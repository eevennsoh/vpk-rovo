"use client";

import { TaskCard } from "./task-card";
import { SAMPLE_TASKS, type TaskStatus } from "@/app/data/dashboard-sample";

interface KanbanBoardProps {
	/**
	 * Optional filter function to reduce displayed tasks
	 */
	filterFn?: (task: typeof SAMPLE_TASKS[0]) => boolean;
	/**
	 * Optional callback when a task card is clicked
	 */
	onTaskClick?: (taskId: string) => void;
}

/**
 * Maps TaskStatus to display labels
 */
function getStatusLabel(status: TaskStatus): string {
	switch (status) {
		case "todo":
			return "To Do";
		case "inprogress":
			return "In Progress";
		case "done":
			return "Done";
		default:
			return "Unknown";
	}
}

/**
 * Gets tasks for a given status, optionally filtered
 */
function getTasksForStatus(
	status: TaskStatus,
	filterFn?: (task: typeof SAMPLE_TASKS[0]) => boolean,
): (typeof SAMPLE_TASKS)[0][] {
	const tasks = SAMPLE_TASKS.filter((task) => task.status === status);
	return filterFn ? tasks.filter(filterFn) : tasks;
}

/**
 * KanbanBoard component renders tasks in three columns by status
 *
 * Structure:
 * - Three columns: To Do, In Progress, Done
 * - Each column shows status label and task count
 * - TaskCard components render individual tasks with hover effects
 * - Responsive layout: stacked on mobile, 3-column grid on desktop
 */
export function KanbanBoard({ filterFn, onTaskClick }: KanbanBoardProps) {
	const statuses: TaskStatus[] = ["todo", "inprogress", "done"];

	return (
		<div className="grid grid-cols-1 gap-6 md:grid-cols-3">
			{statuses.map((status) => {
				const tasks = getTasksForStatus(status, filterFn);
				const count = tasks.length;

				return (
					<div
						key={status}
						className="flex flex-col gap-4"
					>
						{/* Column Header */}
						<div className="flex items-center justify-between border-b border-border pb-3">
							<div className="flex flex-col gap-1">
								<h3 className="text-sm font-medium text-text">{getStatusLabel(status)}</h3>
								<p className="text-xs text-text-subtle">{count} item{count !== 1 ? "s" : ""}</p>
							</div>
						</div>

						{/* Tasks Column */}
						<div className="flex flex-col gap-3">
							{tasks.length > 0 ? (
								tasks.map((task) => (
									<TaskCard
										key={task.id}
										task={task}
										onClick={() => onTaskClick?.(task.id)}
									/>
								))
							) : (
								<div className="flex items-center justify-center rounded-lg border border-dashed border-border bg-bg-neutral/50 py-8 text-center">
									<p className="text-sm text-text-subtle">No tasks in this status</p>
								</div>
							)}
						</div>
					</div>
				);
			})}
		</div>
	);
}

/**
 * Helper component for empty state when no tasks exist
 */
export function KanbanBoardEmpty() {
	return (
		<div className="flex items-center justify-center rounded-lg border-2 border-dashed border-border bg-bg-neutral/30 py-12">
			<div className="text-center">
				<p className="text-base font-medium text-text">No tasks found</p>
				<p className="text-sm text-text-subtle">Try adjusting your filters</p>
			</div>
		</div>
	);
}
