import {
	DndContext,
	DragEndEvent,
	DragOverlay,
	DragStartEvent,
	PointerSensor,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import { restrictToVerticalAxis, restrictToWindowEdges } from "@dnd-kit/modifiers";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import React from "react";
import { useTaskStore } from "../store/taskStore";
import { Task } from "../types/task";
import { TaskItem } from "./TaskItem";

export const TaskList: React.FC = () => {
	const { tasks, searchTerm, filterPriority, filterCompleted, sortBy, sortDirection, updateTask } = useTaskStore();
	const [activeId, setActiveId] = React.useState<string | null>(null);

	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: {
				distance: 8,
			},
		})
	);

	// Helper function to check if a task matches the search criteria
	const taskMatchesSearch = (task: Task): boolean => {
		const matchesSearch =
			!searchTerm ||
			task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
			task.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
			false;
		const matchesPriority = !filterPriority || task.priority === filterPriority;
		const matchesCompleted = filterCompleted === undefined || task.completed === filterCompleted;

		return matchesSearch && matchesPriority && matchesCompleted;
	};

	// Get all descendant tasks
	const getDescendants = (taskId: string, allTasks: Task[]): Set<string> => {
		const descendants = new Set<string>();
		const processTask = (id: string) => {
			const children = allTasks.filter((t) => t.parentIds.includes(id));
			children.forEach((child) => {
				descendants.add(child.id);
				processTask(child.id);
			});
		};
		processTask(taskId);
		return descendants;
	};

	const filteredAndSortedTasks = React.useMemo(() => {
		// First, find all tasks that directly match the search criteria
		const directMatches = tasks.filter(taskMatchesSearch);

		// Create a set of all task IDs that should be included
		const tasksToInclude = new Set<string>();

		// Add all direct matches and their descendants
		directMatches.forEach((task) => {
			tasksToInclude.add(task.id);

			// Add all descendants of matching tasks
			getDescendants(task.id, tasks).forEach((id) => {
				tasksToInclude.add(id);
			});
		});

		// Filter tasks based on the collected IDs and sort them
		return tasks
			.filter((task) => tasksToInclude.has(task.id))
			.sort((a, b) => {
				const direction = sortDirection === "asc" ? 1 : -1;
				switch (sortBy) {
					case "priority":
						return (
							direction *
							(["high", "medium", "low"].indexOf(a.priority || "medium") -
								["high", "medium", "low"].indexOf(b.priority || "medium"))
						);
					case "dueDate":
						return direction * ((a.endDate?.getTime() || 0) - (b.endDate?.getTime() || 0));
					case "completed":
						return direction * (a.completed === b.completed ? 0 : a.completed ? 1 : -1);
					default:
						return direction * (b.createdAt.getTime() - a.createdAt.getTime());
				}
			});
	}, [tasks, searchTerm, filterPriority, filterCompleted, sortBy, sortDirection]);

	// Only show root tasks (tasks with no parents or tasks whose parents are not in the filtered list)
	const rootTasks = filteredAndSortedTasks.filter(
		(task) =>
			task.parentIds.length === 0 ||
			!task.parentIds.some((parentId) => filteredAndSortedTasks.some((t) => t.id === parentId))
	);

	const handleDragStart = (event: DragStartEvent) => {
		setActiveId(event.active.id as string);
	};

	const handleDragEnd = async (event: DragEndEvent) => {
		const { active, over } = event;
		setActiveId(null);

		if (!over) return;

		const draggedTaskId = active.id as string;
		const targetTaskId = over.id as string;

		if (draggedTaskId === targetTaskId) return;

		const draggedTask = tasks.find((t) => t.id === draggedTaskId);
		const targetTask = tasks.find((t) => t.id === targetTaskId);

		if (!draggedTask || !targetTask) return;

		const currentParentId = findCommonAncestor(draggedTask, targetTask, tasks);

		if (currentParentId) {
			const updatedParentIds = draggedTask.parentIds.filter((id) => id !== currentParentId);
			updatedParentIds.push(targetTaskId);

			await updateTask(draggedTaskId, {
				...draggedTask,
				parentIds: updatedParentIds,
			});
		} else {
			await updateTask(draggedTaskId, {
				...draggedTask,
				parentIds: [...draggedTask.parentIds, targetTaskId],
			});
		}
	};

	const findCommonAncestor = (draggedTask: Task, targetTask: Task, allTasks: Task[]): string | null => {
		const targetAncestors = new Set<string>();
		const getAncestors = (taskId: string, visited = new Set<string>()) => {
			if (visited.has(taskId)) return;
			visited.add(taskId);
			const task = allTasks.find((t) => t.id === taskId);
			if (task) {
				task.parentIds.forEach((parentId) => {
					targetAncestors.add(parentId);
					getAncestors(parentId, visited);
				});
			}
		};
		getAncestors(targetTask.id);

		return draggedTask.parentIds.find((parentId) => targetAncestors.has(parentId)) || null;
	};

	const activeTask = activeId ? tasks.find((task) => task.id === activeId) : null;

	return (
		<DndContext
			sensors={sensors}
			onDragStart={handleDragStart}
			onDragEnd={handleDragEnd}
			modifiers={[restrictToVerticalAxis, restrictToWindowEdges]}
		>
			<div className="space-y-4">
				<SortableContext items={rootTasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
					{rootTasks.map((task) => (
						<TaskItem key={task.id} task={task} allTasks={filteredAndSortedTasks} />
					))}
				</SortableContext>
			</div>

			<DragOverlay>
				{activeId && activeTask ? (
					<div className="opacity-80">
						<TaskItem task={activeTask} allTasks={filteredAndSortedTasks} />
					</div>
				) : null}
			</DragOverlay>
		</DndContext>
	);
};
