import { create } from 'zustand';
import { TaskStore, Task } from '../types/task';
import { supabase } from '../lib/supabase';
import Cookies from 'js-cookie';

const THEME_COOKIE = 'task-manager-theme';

// Get initial theme preference
const getInitialTheme = (): boolean => {
  const savedTheme = Cookies.get(THEME_COOKIE);
  if (savedTheme !== undefined) {
    return savedTheme === 'dark';
  }
  // Check system preference if no cookie exists
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
};

export const useTaskStore = create<TaskStore>((set, get) => ({
  tasks: [],
  searchTerm: '',
  sortBy: 'createdAt',
  sortDirection: 'desc',
  isDarkMode: getInitialTheme(),
  isLoading: true,
  error: null,

  initializeTasks: async () => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user) {
        throw new Error('No authenticated user');
      }

      const { data: tasks, error } = await supabase
        .from('tasks')
        .select('id, title, description, completed, priority, start_date, end_date, tags, parent_ids, user_id, created_at, updated_at')
        .order('created_at', { ascending: false });

      if (error) throw error;

      set({
        tasks: tasks.map(task => ({
          id: task.id,
          title: task.title,
          description: task.description,
          completed: task.completed,
          priority: task.priority,
          startDate: task.start_date ? new Date(task.start_date) : undefined,
          endDate: task.end_date ? new Date(task.end_date) : undefined,
          tags: task.tags,
          parentIds: task.parent_ids || [],
          createdAt: new Date(task.created_at),
          updatedAt: new Date(task.updated_at),
        })),
        isLoading: false,
      });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'An error occurred', isLoading: false });
    }
  },

  addTask: async (taskData) => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user) {
        throw new Error('No authenticated user');
      }

      const { data, error } = await supabase
        .from('tasks')
        .insert([{
          title: taskData.title,
          description: taskData.description,
          completed: taskData.completed,
          priority: taskData.priority,
          start_date: taskData.startDate?.toISOString(),
          end_date: taskData.endDate?.toISOString(),
          tags: taskData.tags,
          parent_ids: taskData.parentIds,
          user_id: session.session.user.id,
        }])
        .select('id, title, description, completed, priority, start_date, end_date, tags, parent_ids, user_id, created_at, updated_at')
        .single();

      if (error) throw error;

      const newTask: Task = {
        id: data.id,
        title: data.title,
        description: data.description,
        completed: data.completed,
        priority: data.priority,
        startDate: data.start_date ? new Date(data.start_date) : undefined,
        endDate: data.end_date ? new Date(data.end_date) : undefined,
        tags: data.tags,
        parentIds: data.parent_ids || [],
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      };

      set(state => ({ tasks: [newTask, ...state.tasks] }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to add task' });
    }
  },

  updateTask: async (taskId, updates) => {
    try {
      const updateData: any = {
        title: updates.title,
        description: updates.description,
        completed: updates.completed,
        priority: updates.priority,
        start_date: updates.startDate?.toISOString(),
        end_date: updates.endDate?.toISOString(),
        tags: updates.tags,
        parent_ids: updates.parentIds,
        updated_at: new Date().toISOString(),
      };

      // Remove undefined values
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined) {
          delete updateData[key];
        }
      });

      const { data, error } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', taskId)
        .select('id, title, description, completed, priority, start_date, end_date, tags, parent_ids, user_id, created_at, updated_at')
        .single();

      if (error) throw error;

      set(state => ({
        tasks: state.tasks.map(task =>
          task.id === taskId
            ? {
                id: data.id,
                title: data.title,
                description: data.description,
                completed: data.completed,
                priority: data.priority,
                startDate: data.start_date ? new Date(data.start_date) : undefined,
                endDate: data.end_date ? new Date(data.end_date) : undefined,
                tags: data.tags,
                parentIds: data.parent_ids || [],
                createdAt: new Date(data.created_at),
                updatedAt: new Date(data.updated_at),
              }
            : task
        ),
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to update task' });
    }
  },

  deleteTask: async (taskId) => {
    try {
      const state = get();
      const taskToDelete = state.tasks.find(t => t.id === taskId);
      if (!taskToDelete) return;

      // Find all tasks that should be deleted
      const tasksToDelete = new Set<string>();
      
      // Helper function to check if a task has other parents that aren't being deleted
      const hasOtherParents = (task: Task): boolean => {
        return task.parentIds.some(parentId => 
          parentId !== taskId && !tasksToDelete.has(parentId)
        );
      };

      // Helper function to process a task and its descendants
      const processTask = (currentTaskId: string) => {
        tasksToDelete.add(currentTaskId);
        
        // Find direct children
        const children = state.tasks.filter(t => t.parentIds.includes(currentTaskId));
        
        // Process each child
        children.forEach(child => {
          // Only process child if it doesn't have other parents
          if (!hasOtherParents(child)) {
            processTask(child.id);
          }
        });
      };

      // Start processing from the initial task
      processTask(taskId);

      // Delete all identified tasks in a single operation
      const { error } = await supabase
        .from('tasks')
        .delete()
        .in('id', Array.from(tasksToDelete));

      if (error) throw error;

      // Update local state
      set(state => ({
        tasks: state.tasks.filter(task => !tasksToDelete.has(task.id)),
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to delete task' });
    }
  },

  toggleTaskCompletion: async (taskId) => {
    const state = get();
    const task = state.tasks.find(t => t.id === taskId);
    if (!task) return [];

    try {
      const { data, error } = await supabase
        .from('tasks')
        .update({ completed: !task.completed })
        .eq('id', taskId)
        .select('id, title, description, completed, priority, start_date, end_date, tags, parent_ids, user_id, created_at, updated_at')
        .single();

      if (error) throw error;

      // Update local state
      set(state => ({
        tasks: state.tasks.map(t =>
          t.id === taskId
            ? {
                id: data.id,
                title: data.title,
                description: data.description,
                completed: data.completed,
                priority: data.priority,
                startDate: data.start_date ? new Date(data.start_date) : undefined,
                endDate: data.end_date ? new Date(data.end_date) : undefined,
                tags: data.tags,
                parentIds: data.parent_ids || [],
                createdAt: new Date(data.created_at),
                updatedAt: new Date(data.updated_at),
              }
            : t
        ),
      }));

      // If the task was marked as complete, check all parent chains
      if (data.completed) {
        const parentChains: Task[][] = [];
        const processedParents = new Set<string>();

        const findParentChains = (currentTask: Task, chain: Task[] = []) => {
          // Get all immediate parents of the current task
          const parents = state.tasks.filter(t => currentTask.parentIds.includes(t.id));
          
          parents.forEach(parent => {
            // Skip if we've already processed this parent
            if (processedParents.has(parent.id)) return;
            processedParents.add(parent.id);

            if (!parent.completed) {
              // Get all children of this parent
              const children = state.tasks.filter(t => t.parentIds.includes(parent.id));
              
              // Check if all children are complete
              const allChildrenComplete = children.every(child => 
                child.id === taskId ? data.completed : child.completed
              );
              
              if (allChildrenComplete) {
                // Create a new chain for this parent
                const newChain = [...chain, parent];
                parentChains.push(newChain);
                
                // Recursively check this parent's parents
                findParentChains(parent, newChain);
              }
            }
          });
        };

        // Start the recursive process from the initial task
        findParentChains(task);

        // Return all parent chains that need to be processed
        return parentChains;
      }

      return [];
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to toggle task completion' });
      return [];
    }
  },

  setSearchTerm: (term) => set({ searchTerm: term }),
  setFilterPriority: (priority) => set({ filterPriority: priority }),
  setFilterCompleted: (completed) => set({ filterCompleted: completed }),
  setSortBy: (sortBy) => set({ sortBy }),
  setSortDirection: (direction) => set({ sortDirection: direction }),
  toggleDarkMode: () => {
    set((state) => {
      const newDarkMode = !state.isDarkMode;
      Cookies.set(THEME_COOKIE, newDarkMode ? 'dark' : 'light', { expires: 365 });
      return { isDarkMode: newDarkMode };
    });
  },
}));