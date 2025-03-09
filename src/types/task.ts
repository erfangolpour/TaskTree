export type Priority = 'low' | 'medium' | 'high';
export type SortDirection = 'asc' | 'desc';

export interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: Priority | null;
  startDate?: Date;
  endDate?: Date;
  tags: string[];
  parentIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskStore {
  tasks: Task[];
  searchTerm: string;
  filterPriority?: Priority;
  filterCompleted?: boolean;
  sortBy: 'priority' | 'dueDate' | 'createdAt' | 'completed';
  sortDirection: SortDirection;
  isDarkMode: boolean;
  isLoading: boolean;
  error: string | null;
  initializeTasks: () => Promise<void>;
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateTask: (taskId: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  toggleTaskCompletion: (taskId: string) => Promise<Task[][]>;
  setSearchTerm: (term: string) => void;
  setFilterPriority: (priority?: Priority) => void;
  setFilterCompleted: (completed?: boolean) => void;
  setSortBy: (sortBy: TaskStore['sortBy']) => void;
  setSortDirection: (direction: SortDirection) => void;
  toggleDarkMode: () => void;
}