import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Input } from './ui/input';
import { Select } from './ui/select';
import { Button } from './ui/button';
import { useTaskStore } from '../store/taskStore';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';
import { Search } from 'lucide-react';
import { Task } from '../types/task';
import { DatePickerField } from './DatePickerField';

interface EditTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task;
}

export const EditTaskDialog: React.FC<EditTaskDialogProps> = ({ open, onOpenChange, task }) => {
  const { updateTask, tasks } = useTaskStore();
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || '');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>(task.priority || 'medium');
  const [dueDate, setDueDate] = useState(task.endDate ? task.endDate.toISOString().split('T')[0] : '');
  const [tags, setTags] = useState(task.tags.join(', '));
  const [selectedParents, setSelectedParents] = useState<string[]>(task.parentIds);
  const [parentSearch, setParentSearch] = useState('');
  const [parentSortBy, setParentSortBy] = useState<'title' | 'priority' | 'date'>('title');
  const formRef = useRef<HTMLFormElement>(null);

  // Get all descendant task IDs (children, grandchildren, etc.)
  const getAllDescendants = (taskId: string, visited = new Set<string>()): Set<string> => {
    if (visited.has(taskId)) return visited;
    visited.add(taskId);
    
    tasks.forEach(t => {
      if (t.parentIds.includes(taskId)) {
        getAllDescendants(t.id, visited);
      }
    });
    
    return visited;
  };

  // Calculate available parents (excluding the task itself and all its descendants)
  const availableParents = useMemo(() => {
    const descendants = getAllDescendants(task.id);
    return tasks.filter(t => 
      t.id !== task.id && 
      !descendants.has(t.id) &&
      !selectedParents.includes(t.id)
    );
  }, [task.id, tasks, selectedParents]);

  useEffect(() => {
    if (open) {
      setTitle(task.title);
      setDescription(task.description || '');
      setPriority(task.priority || 'medium');
      setDueDate(task.endDate ? task.endDate.toISOString().split('T')[0] : '');
      setTags(task.tags.join(', '));
      setSelectedParents(task.parentIds);
      setParentSearch('');
      setParentSortBy('title');
    }
  }, [open, task]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formRef.current?.checkValidity()) {
      formRef.current?.reportValidity();
      return;
    }

    await updateTask(task.id, {
      title,
      description: description || undefined,
      priority,
      endDate: dueDate ? new Date(dueDate) : undefined,
      tags: tags.split(',').map(tag => tag.trim()).filter(Boolean),
      parentIds: selectedParents,
    });

    onOpenChange(false);
  };

  const toggleParent = (taskId: string) => {
    setSelectedParents(current =>
      current.includes(taskId)
        ? current.filter(id => id !== taskId)
        : [...current, taskId]
    );
  };

  const filteredAndSortedParents = useMemo(() => {
    return availableParents
      .filter(task => task.title.toLowerCase().includes(parentSearch.toLowerCase()))
      .sort((a, b) => {
        switch (parentSortBy) {
          case 'title':
            return a.title.localeCompare(b.title);
          case 'priority':
            return ['high', 'medium', 'low'].indexOf(a.priority || 'medium') -
                   ['high', 'medium', 'low'].indexOf(b.priority || 'medium');
          case 'date':
            return b.createdAt.getTime() - a.createdAt.getTime();
          default:
            return 0;
        }
      });
  }, [availableParents, parentSearch, parentSortBy]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.target instanceof HTMLElement && e.target.tagName !== 'TEXTAREA') {
      e.preventDefault();
      formRef.current?.requestSubmit();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-[600px] h-[90vh] max-h-[800px] flex flex-col">
        <form ref={formRef} onSubmit={handleSubmit} onKeyDown={handleKeyDown} className="flex flex-col h-full">
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-1 py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="Task title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                placeholder="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                id="priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as 'low' | 'medium' | 'high')}
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date</Label>
              <DatePickerField
                selected={dueDate ? new Date(dueDate) : null}
                onChange={(date) => setDueDate(date ? date.toISOString().split('T')[0] : '')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tags">Tags</Label>
              <Input
                id="tags"
                placeholder="Tags (comma-separated)"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Parent Tasks</Label>
              <div className="space-y-2">
                {selectedParents.length > 0 && (
                  <div className="space-y-2 mb-4">
                    <Label>Selected Parents</Label>
                    <div className="border rounded-md p-2 space-y-2 dark:border-gray-600">
                      {selectedParents.map(id => {
                        const task = tasks.find(t => t.id === id);
                        return task ? (
                          <div key={id} className="flex items-center justify-between">
                            <span className="text-sm dark:text-gray-200">{task.title}</span>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.preventDefault();
                                toggleParent(id);
                              }}
                              className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                            >
                              Remove
                            </Button>
                          </div>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}
                {availableParents.length > 0 && (
                  <>
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 h-4 w-4" />
                        <Input
                          placeholder="Search parents..."
                          value={parentSearch}
                          onChange={(e) => setParentSearch(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      <Select
                        value={parentSortBy}
                        onChange={(e) => setParentSortBy(e.target.value as any)}
                        className="w-32"
                      >
                        <option value="title">By Title</option>
                        <option value="priority">By Priority</option>
                        <option value="date">By Date</option>
                      </Select>
                    </div>
                    <div className="h-40 overflow-y-auto border rounded-md p-2 dark:border-gray-600">
                      {filteredAndSortedParents.map(task => (
                        <div key={task.id} className="flex items-center justify-between p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id={task.id}
                              checked={selectedParents.includes(task.id)}
                              onCheckedChange={() => toggleParent(task.id)}
                            />
                            <Label htmlFor={task.id} className="text-sm cursor-pointer">
                              {task.title}
                            </Label>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            task.priority === 'high' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100' :
                            task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100' :
                            'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
                          }`}>
                            {task.priority}
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button type="submit">Save Changes</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};