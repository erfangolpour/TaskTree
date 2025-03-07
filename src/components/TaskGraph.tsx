import { Plus } from "lucide-react";
import React, { useCallback, useMemo, useState } from "react";
import ReactFlow, {
	Background,
	ConnectionMode,
	Controls,
	Edge,
	MarkerType,
	Node,
	OnConnectStartParams,
	Position,
	ReactFlowProvider,
	useReactFlow,
} from "reactflow";
import "reactflow/dist/style.css";
import { useTaskStore } from "../store/taskStore";
import { Task } from "../types/task";
import { AddTaskDialog } from "./AddTaskDialog";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";

interface TaskGraphProps {
	tasks: Task[];
	isDarkMode: boolean;
}

const VERTICAL_SPACING = 150;
const HORIZONTAL_SPACING = 300;
const NODE_HEIGHT = 100;

const priorityColors = {
	low: { light: "#22c55e", dark: "#22c55e" },
	medium: { light: "#eab308", dark: "#eab308" },
	high: { light: "#ef4444", dark: "#ef4444" },
};

const TaskGraphInner: React.FC<TaskGraphProps> = ({ tasks, isDarkMode }) => {
	const { toggleTaskCompletion, searchTerm, filterPriority, filterCompleted, sortBy, sortDirection } = useTaskStore();
	const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
	const [selectedParentId, setSelectedParentId] = useState<string | null>(null);
	const { project } = useReactFlow();

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

	const getDescendants = (taskId: string): Set<string> => {
		const descendants = new Set<string>();
		const processTask = (id: string) => {
			const children = tasks.filter((t) => t.parentIds.includes(id));
			children.forEach((child) => {
				descendants.add(child.id);
				processTask(child.id);
			});
		};
		processTask(taskId);
		return descendants;
	};

	const filteredTasks = useMemo(() => {
		// First, find all tasks that directly match the search criteria
		const directMatches = tasks.filter(taskMatchesSearch);

		// Create a set of all task IDs that should be included
		const tasksToInclude = new Set<string>();

		// Add all direct matches and their descendants
		directMatches.forEach((task) => {
			tasksToInclude.add(task.id);

			// Add all descendants of matching tasks
			getDescendants(task.id).forEach((id) => {
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
							(["high", "medium", "low"].indexOf(a.priority) -
								["high", "medium", "low"].indexOf(b.priority))
						);
					case "dueDate":
						return direction * ((a.dueDate?.getTime() || 0) - (b.dueDate?.getTime() || 0));
					case "completed":
						return direction * (a.completed === b.completed ? 0 : a.completed ? 1 : -1);
					default:
						return direction * (b.createdAt.getTime() - a.createdAt.getTime());
				}
			});
	}, [tasks, searchTerm, filterPriority, filterCompleted, sortBy, sortDirection]);

	const { nodes, edges } = useMemo(() => {
		const taskMap = new Map(filteredTasks.map((task) => [task.id, task]));

		// Find root tasks (tasks with no parents or whose parents are not in the filtered list)
		const rootTasks = filteredTasks.filter(
			(task) => task.parentIds.length === 0 || !task.parentIds.some((parentId) => taskMap.has(parentId))
		);

		const getSubtreeHeight = (taskId: string, visited = new Set<string>()): number => {
			if (visited.has(taskId)) return 0;
			visited.add(taskId);

			const children = filteredTasks.filter((t) => t.parentIds.includes(taskId));
			if (children.length === 0) return NODE_HEIGHT;

			const childrenHeights = children.map((child) => getSubtreeHeight(child.id, visited));
			return Math.max(...childrenHeights) * children.length;
		};

		const calculatePositions = () => {
			const positions = new Map<string, { x: number; y: number }>();
			const processed = new Set<string>();
			let currentY = VERTICAL_SPACING;

			rootTasks.forEach((rootTask, rootIndex) => {
				if (rootIndex > 0) {
					const prevTreeHeight = getSubtreeHeight(rootTasks[rootIndex - 1].id);
					currentY += prevTreeHeight + VERTICAL_SPACING;
				}

				const processNode = (taskId: string, level: number, parentY?: number) => {
					if (processed.has(taskId)) return;

					// const task = taskMap.get(taskId)!;
					const children = filteredTasks.filter((t) => t.parentIds.includes(taskId));

					let y = parentY !== undefined ? parentY : currentY;
					const x = level * HORIZONTAL_SPACING;

					positions.set(taskId, { x, y });
					processed.add(taskId);

					let childY = y - ((children.length - 1) * VERTICAL_SPACING) / 2;
					children.forEach((child) => {
						processNode(child.id, level + 1, childY);
						childY += VERTICAL_SPACING;
					});
				};

				processNode(rootTask.id, 0);
			});

			return positions;
		};

		const positions = calculatePositions();

		const nodes: Node[] = filteredTasks.map((task) => ({
			id: task.id,
			position: positions.get(task.id) || { x: 0, y: 0 },
			data: {
				label: (
					<div className="p-2">
						<div className="flex items-center gap-2">
							<Checkbox
								checked={task.completed}
								onCheckedChange={() => toggleTaskCompletion(task.id)}
								className="!border-white/50 data-[state=checked]:!bg-white data-[state=checked]:!text-gray-900"
							/>
							<div className="font-medium truncate max-w-[200px]">{task.title}</div>
							<Button
								variant="ghost"
								size="icon"
								className="h-6 w-6 ml-auto !text-white hover:!bg-white/20"
								onClick={(e) => {
									e.stopPropagation();
									setSelectedParentId(task.id);
									setIsAddTaskOpen(true);
								}}
							>
								<Plus className="h-4 w-4" />
							</Button>
						</div>
						{task.description && (
							<div className="text-xs text-left opacity-80 mt-1 line-clamp-2">{task.description}</div>
						)}
						{task.tags.length > 0 && (
							<div className="flex flex-wrap gap-1 mt-1">
								{task.tags.map((tag, index) => (
									<span
										key={index}
										className="text-xs px-1.5 py-0.5 bg-white/20 rounded truncate max-w-[100px]"
									>
										{tag}
									</span>
								))}
							</div>
						)}
					</div>
				),
				task,
			},
			sourcePosition: Position.Right,
			targetPosition: Position.Left,
			className: `${isDarkMode ? "dark" : ""}`,
			style: {
				background: task.completed ? "#4b5563" : priorityColors[task.priority][isDarkMode ? "dark" : "light"],
				color: "#fff",
				border: "none",
				borderRadius: "8px",
				minWidth: 200,
				maxWidth: 300,
			},
		}));

		const edges: Edge[] = [];
		filteredTasks.forEach((task) => {
			task.parentIds.forEach((parentId) => {
				if (taskMap.has(parentId)) {
					edges.push({
						id: `${parentId}-${task.id}`,
						source: parentId,
						target: task.id,
						type: "smoothstep",
						animated: true,
						style: { stroke: isDarkMode ? "#4b5563" : "#9ca3af" },
						markerEnd: {
							type: MarkerType.ArrowClosed,
							color: isDarkMode ? "#4b5563" : "#9ca3af",
						},
					});
				}
			});
		});

		return { nodes, edges };
	}, [filteredTasks, isDarkMode, toggleTaskCompletion]);

	const onConnectStart = useCallback((_: React.MouseEvent | React.TouchEvent, params: OnConnectStartParams) => {
		if (params.nodeId) {
			setSelectedParentId(params.nodeId);
		}
	}, []);

	const onConnectEnd = useCallback(
		(event: MouseEvent | TouchEvent) => {
			if (!selectedParentId) return;

			const targetPosition = project({
				x: event instanceof MouseEvent ? event.clientX : event.touches[0].clientX,
				y: event instanceof MouseEvent ? event.clientY : event.touches[0].clientY,
			});

			const droppedOnNode = nodes.some((node) => {
				const nodeRect = {
					left: node.position.x,
					right: node.position.x + (node.width || 0),
					top: node.position.y,
					bottom: node.position.y + (node.height || 0),
				};
				return (
					targetPosition.x >= nodeRect.left &&
					targetPosition.x <= nodeRect.right &&
					targetPosition.y >= nodeRect.top &&
					targetPosition.y <= nodeRect.bottom
				);
			});

			if (!droppedOnNode) {
				setIsAddTaskOpen(true);
			}
		},
		[selectedParentId, nodes, project]
	);

	return (
		<>
			<div className="w-full h-[calc(100vh-300px)] min-h-[600px] border rounded-lg border-gray-200 dark:border-gray-700">
				<ReactFlow
					nodes={nodes}
					edges={edges}
					fitView
					className={isDarkMode ? "dark" : ""}
					minZoom={0.1}
					maxZoom={1.5}
					defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
					fitViewOptions={{ padding: 0.2 }}
					connectionMode={ConnectionMode.Loose}
					onConnectStart={onConnectStart}
					onConnectEnd={onConnectEnd}
				>
					<Background color={isDarkMode ? "#374151" : "#e5e7eb"} />
					<Controls
						className={`${
							isDarkMode ? "dark" : ""
						} [&>button]:!bg-white dark:[&>button]:!bg-gray-800 [&>button]:!text-gray-700 dark:[&>button]:!text-gray-300 [&>button]:!border-gray-200 dark:[&>button]:!border-gray-700 [&>button:hover]:!bg-gray-100 dark:[&>button:hover]:!bg-gray-700`}
					/>
				</ReactFlow>
			</div>

			<AddTaskDialog
				open={isAddTaskOpen}
				onOpenChange={setIsAddTaskOpen}
				defaultParentId={selectedParentId || undefined}
			/>
		</>
	);
};

const TaskGraph: React.FC<TaskGraphProps> = (props) => {
	return (
		<ReactFlowProvider>
			<TaskGraphInner {...props} />
		</ReactFlowProvider>
	);
};

export default TaskGraph;
