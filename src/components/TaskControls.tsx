import React, { useState } from 'react';
import { useTaskStore } from '../store/taskStore';
import { Input } from './ui/input';
import { Select } from './ui/select';
import { Button } from './ui/button';
import { Search, Plus, ArrowUpDown } from 'lucide-react';
import { AddTaskDialog } from './AddTaskDialog';

export const TaskControls: React.FC = () => {
  const {
    searchTerm,
    setSearchTerm,
    filterPriority,
    setFilterPriority,
    sortBy,
    setSortBy,
    sortDirection,
    setSortDirection,
  } = useTaskStore();

  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);

  return (
    <div className="mb-6 space-y-4">
      <div className="flex items-center space-x-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 h-4 w-4" />
          <Input
            type="text"
            placeholder="Search tasks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <Select
          value={filterPriority || ''}
          onChange={(e) => setFilterPriority(e.target.value as any || undefined)}
          className="w-40"
        >
          <option value="">All Priorities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </Select>

        <div className="flex items-center space-x-2">
          <Select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="w-40"
          >
            <option value="createdAt">Created Date</option>
            <option value="priority">Priority</option>
            <option value="dueDate">Due Date</option>
            <option value="completed">Completion</option>
          </Select>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
            className={`flex items-center justify-center transition-transform duration-200 ${
              sortDirection === 'asc' ? 'rotate-180' : ''
            }`}
          >
            <ArrowUpDown className="h-4 w-4" />
          </Button>
        </div>

        <Button className="ml-auto" onClick={() => setIsAddTaskOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Task
        </Button>
      </div>

      <AddTaskDialog open={isAddTaskOpen} onOpenChange={setIsAddTaskOpen} />
    </div>
  );
};