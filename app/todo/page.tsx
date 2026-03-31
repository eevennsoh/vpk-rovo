"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import CheckCircleIcon from "@atlaskit/icon/core/check-circle";
import TrashIcon from "@atlaskit/icon/core/delete";

interface Task {
	id: string;
	text: string;
	completed: boolean;
}

let nextId = 1;
function generateId() {
	return `task-${nextId++}`;
}

const NEW_TASK_INPUT_ID = "todo-new-task-input";

export default function TodoPage() {
	const [tasks, setTasks] = useState<Task[]>([]);
	const [inputValue, setInputValue] = useState("");

	function handleAdd() {
		const text = inputValue.trim();
		if (!text) return;
		setTasks((prev) => [
			...prev,
			{ id: generateId(), text, completed: false },
		]);
		setInputValue("");
	}

	function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
		if (e.key === "Enter") {
			handleAdd();
		}
	}

	function handleToggle(id: string) {
		setTasks((prev) =>
			prev.map((task) =>
				task.id === id ? { ...task, completed: !task.completed } : task
			)
		);
	}

	function handleDelete(id: string) {
		setTasks((prev) => prev.filter((task) => task.id !== id));
	}

	const completedCount = tasks.filter((t) => t.completed).length;
	const totalCount = tasks.length;

	return (
		<div className="flex flex-col gap-6 p-8 max-w-[640px] mx-auto">
			{/* Page Header */}
			<div className="flex items-center gap-3">
				<div className="flex items-center justify-center size-10 rounded-sm bg-bg-success-subtler text-icon-success">
					<CheckCircleIcon label="" />
				</div>
				<div className="flex flex-col gap-0.5">
					<h1 className="text-xl font-semibold text-text">My Tasks</h1>
					<p className="text-sm text-text-subtlest">
						{totalCount === 0
							? "No tasks yet — add one below"
							: `${completedCount} of ${totalCount} completed`}
					</p>
				</div>
			</div>

			{/* Add Task Input */}
			<div className="flex gap-2">
				<label htmlFor={NEW_TASK_INPUT_ID} className="sr-only">
					New task
				</label>
				<Input
					id={NEW_TASK_INPUT_ID}
					placeholder="Add a new task…"
					value={inputValue}
					onChange={(e) => setInputValue(e.target.value)}
					onKeyDown={handleKeyDown}
					className="flex-1"
				/>
				<Button onClick={handleAdd} disabled={!inputValue.trim()}>
					Add task
				</Button>
			</div>

			{/* Task List */}
			{tasks.length > 0 ? (
				<ul className="flex flex-col divide-y divide-border rounded-lg border border-border overflow-hidden">
					{tasks.map((task) => (
						<li
							key={task.id}
							className="flex items-center gap-3 px-4 py-3 bg-bg-neutral-subtle hover:bg-bg-neutral-subtle-hovered transition-colors group"
						>
							<Checkbox
								checked={task.completed}
								onCheckedChange={() => handleToggle(task.id)}
								aria-label={`Mark "${task.text}" as ${task.completed ? "incomplete" : "complete"}`}
							/>
							<span
								className={cn(
									"flex-1 text-sm text-text transition-colors",
									task.completed && "line-through text-text-disabled"
								)}
							>
								{task.text}
							</span>
							<Button
								variant="ghost"
								size="icon-sm"
								onClick={() => handleDelete(task.id)}
								aria-label={`Delete "${task.text}"`}
								className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100 text-icon-subtle hover:text-icon-danger hover:bg-bg-danger-subtle transition-opacity"
							>
								<TrashIcon label="" />
							</Button>
						</li>
					))}
				</ul>
			) : null}

			{/* Clear Completed */}
			{completedCount > 0 ? (
				<div className="flex justify-end">
					<Button
						variant="ghost"
						size="sm"
						onClick={() =>
							setTasks((prev) => prev.filter((t) => !t.completed))
						}
						className="text-text-subtlest"
					>
						Clear {completedCount} completed
					</Button>
				</div>
			) : null}
		</div>
	);
}
