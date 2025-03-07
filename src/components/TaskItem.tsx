import React, { useState, useMemo } from 'react';
import { Task } from '../types/task';
import { useTaskStore } from '../store/taskStore';
import { Checkbox } from './ui/checkbox';
import { Button } from './ui/button';
import { Calendar, Clock, Tag, Trash2, ChevronDown, ChevronRight, Edit, GripVertical, Plus } from 'lucide-react';
import { formatDate } from '../lib/utils';
import { Progress } from './ui/progress';
import { CompletionConfirmDialog } from './CompletionConfirmDialog';
import { DeleteTaskDialog } from './DeleteTaskDialog';
import { EditTaskDialog } from './EditTaskDialog';
import { AddTaskDialog } from './AddTaskDialog';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface TaskItemProps {
  task: Task;
  allTasks: Task[];
  level?: number;
}

export const TaskItem: React.FC<TaskItemProps> = ({ task, allTasks, level = 0 }) => {
  const { toggleTaskCompletion, deleteTask } = useTaskStore();
  const [isExpanded, setIsExpanded] = useState(true);
  const [showCompletionDialog, setShowCompletionDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showAddTaskDialog, setShowAddTaskDialog] = useState(false);
  const [parentChains, setParentChains] = useState<Task[][]>([]);
  const [currentChainIndex, setCurrentChainIndex] = useState(0);
  const [currentParentIndex, setCurrentParentIndex] = useState(0);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : undefined,
    marginLeft: `${level * 20}px`,
  };

  const priorityColors = {
    low: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
    medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100',
    high: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100',
  };

  // Find all child tasks (tasks that have this task as a parent)
  const childTasks = useMemo(() => 
    allTasks.filter(t => t.parentIds.includes(task.id)),
    [allTasks, task.id]
  );

  // Check if there are any uncompleted sub-tasks
  const hasUncompletedSubtasks = childTasks.some(t => !t.completed);

  // Calculate progress
  const progress = useMemo(() => {
    if (childTasks.length === 0) return null;
    const completedTasks = childTasks.filter(t => t.completed).length;
    return Math.round((completedTasks / childTasks.length) * 100);
  }, [childTasks]);

  const handleTaskCompletion = async (checked: boolean) => {
    const chains = await toggleTaskCompletion(task.id);
    
    if (chains.length > 0) {
      setParentChains(chains);
      setCurrentChainIndex(0);
      setCurrentParentIndex(0);
      setShowCompletionDialog(true);
    }
  };

  const handleConfirmParentCompletion = async () => {
    const currentChain = parentChains[currentChainIndex];
    const currentParent = currentChain[currentParentIndex];
    await toggleTaskCompletion(currentParent.id);

    // Move to next parent in current chain
    if (currentParentIndex < currentChain.length - 1) {
      setCurrentParentIndex(currentParentIndex + 1);
    } else {
      // Move to next chain if available
      if (currentChainIndex < parentChains.length - 1) {
        setCurrentChainIndex(currentChainIndex + 1);
        setCurrentParentIndex(0);
      } else {
        // Reset and close dialog when done with all chains
        setShowCompletionDialog(false);
        setParentChains([]);
        setCurrentChainIndex(0);
        setCurrentParentIndex(0);
      }
    }
  };

  const handleDeleteTask = async () => {
    // If task has uncompleted sub-tasks, show confirmation dialog
    if (hasUncompletedSubtasks) {
      setShowDeleteDialog(true);
    } else {
      await deleteTask(task.id);
    }
  };

  const handleConfirmDelete = async () => {
    // Delete all child tasks first
    for (const childTask of childTasks) {
      await deleteTask(childTask.id);
    }
    // Then delete the parent task
    await deleteTask(task.id);
    setShowDeleteDialog(false);
  };

  const getCurrentParentTask = () => {
    if (!parentChains.length) return null;
    const currentChain = parentChains[currentChainIndex];
    if (!currentChain) return null;
    return currentChain[currentParentIndex];
  };

  return (
    <>
      <div 
        ref={setNodeRef}
        style={style}
        className={`p-4 mb-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 ${
          task.completed ? 'opacity-60' : ''
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <div className="flex items-center space-x-2 flex-shrink-0">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-gray-400 cursor-grab active:cursor-grabbing"
                {...attributes}
                {...listeners}
              >
                <GripVertical className="h-4 w-4" />
              </Button>
              {childTasks.length > 0 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-gray-700 dark:text-gray-100"
                  onClick={() => setIsExpanded(!isExpanded)}
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>
              )}
              <Checkbox
                checked={task.completed}
                onCheckedChange={handleTaskCompletion}
                className="border-gray-300 dark:border-gray-500"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className={`text-lg font-medium truncate ${
                task.completed 
                  ? 'line-through text-gray-500 dark:text-gray-400' 
                  : 'text-gray-900 dark:text-gray-100'
              }`}>
                {task.title}
              </h3>
              {task.description && (
                <p className="text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">{task.description}</p>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-2 flex-shrink-0">
            <span className={`px-2 py-1 rounded-full text-xs ${priorityColors[task.priority]}`}>
              {task.priority}
            </span>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setShowAddTaskDialog(true)}
              className="h-6 w-6 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300 dark:text-gray-100"
            >
              <Plus className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setShowEditDialog(true)}
              className="h-6 w-6 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300 dark:text-gray-100"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleDeleteTask}
              className="h-6 w-6 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900 dark:hover:text-red-300 dark:text-gray-100"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {progress !== null && (
          <div className="mt-2 space-y-1">
            <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400">
              <span>Progress</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="w-full" />
          </div>
        )}
        
        <div className="mt-2 flex flex-wrap gap-2 text-sm text-gray-500 dark:text-gray-400">
          {task.dueDate && (
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-1 flex-shrink-0" />
              <span>{formatDate(task.dueDate)}</span>
            </div>
          )}
          {task.tags.length > 0 && (
            <div className="flex items-center">
              <Tag className="h-4 w-4 mr-1 flex-shrink-0" />
              <span className="truncate max-w-[200px]">{task.tags.join(', ')}</span>
            </div>
          )}
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-1 flex-shrink-0" />
            <span>Updated {formatDate(task.updatedAt)}</span>
          </div>
        </div>

        {childTasks.length > 0 && isExpanded && (
          <div className="mt-4 space-y-2">
            {childTasks.map(childTask => (
              <TaskItem 
                key={childTask.id} 
                task={childTask} 
                allTasks={allTasks}
                level={level + 1} 
              />
            ))}
          </div>
        )}
      </div>

      {showCompletionDialog && (
        <CompletionConfirmDialog
          open={showCompletionDialog}
          onOpenChange={(open) => {
            setShowCompletionDialog(open);
            if (!open) {
              setParentChains([]);
              setCurrentChainIndex(0);
              setCurrentParentIndex(0);
            }
          }}
          taskTitle={getCurrentParentTask()?.title || ''}
          onConfirm={handleConfirmParentCompletion}
        />
      )}

      <DeleteTaskDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        taskTitle={task.title}
        hasUncompletedSubtasks={hasUncompletedSubtasks}
        onConfirm={handleConfirmDelete}
      />

      <EditTaskDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        task={task}
      />

      <AddTaskDialog
        open={showAddTaskDialog}
        onOpenChange={setShowAddTaskDialog}
        defaultParentId={task.id}
      />
    </>
  );
};