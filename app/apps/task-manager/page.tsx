"use client";

import { useState, useCallback, useId } from "react";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	CardDescription,
	CardAction,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import PlusIcon from "@atlaskit/icon/core/add";
import TrashIcon from "@atlaskit/icon/core/delete";
import FilterIcon from "@atlaskit/icon/core/filter";
import ClockIcon from "@atlaskit/icon/core/clock";
import PriorityHighIcon from "@atlaskit/icon/core/arrow-up";
import PriorityMediumIcon from "@atlaskit/icon/core/minus";
import PriorityLowIcon from "@atlaskit/icon/core/arrow-down";
import CheckCircleIcon from "@atlaskit/icon/core/check-circle";
import TaskIcon from "@atlaskit/icon/core/task";
import BoardIcon from "@atlaskit/icon/core/board";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Priority = "high" | "medium" | "low";
type Category = "work" | "personal" | "errands" | "ideas";
type FilterStatus = "all" | "active" | "completed";

interface Task {
	id: string;
	title: string;
	completed: boolean;
	priority: Priority;
	category: Category;
	createdAt: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PRIORITY_CONFIG: Record<
	Priority,
	{ label: string; variant: "danger" | "warning" | "info"; icon: typeof PriorityHighIcon }
> = {
	high: { label: "High", variant: "danger", icon: PriorityHighIcon },
	medium: { label: "Med", variant: "warning", icon: PriorityMediumIcon },
	low: { label: "Low", variant: "info", icon: PriorityLowIcon },
};

const CATEGORY_CONFIG: Record<
	Category,
	{ label: string; emoji: string; variant: "discovery" | "success" | "default" | "warning" }
> = {
	work: { label: "Work", emoji: "💼", variant: "discovery" },
	personal: { label: "Personal", emoji: "🏠", variant: "success" },
	errands: { label: "Errands", emoji: "🛒", variant: "warning" },
	ideas: { label: "Ideas", emoji: "💡", variant: "default" },
};

const CATEGORIES: Category[] = ["work", "personal", "errands", "ideas"];
const PRIORITIES: Priority[] = ["high", "medium", "low"];

// ---------------------------------------------------------------------------
// Seed data
// ---------------------------------------------------------------------------

function createSeedTasks(): Task[] {
	return [
		{
			id: crypto.randomUUID(),
			title: "Review Q2 roadmap deck",
			completed: false,
			priority: "high",
			category: "work",
			createdAt: Date.now() - 3600_000,
		},
		{
			id: crypto.randomUUID(),
			title: "Buy groceries for the week",
			completed: false,
			priority: "medium",
			category: "errands",
			createdAt: Date.now() - 7200_000,
		},
		{
			id: crypto.randomUUID(),
			title: "Call dentist for appointment",
			completed: true,
			priority: "low",
			category: "personal",
			createdAt: Date.now() - 86400_000,
		},
		{
			id: crypto.randomUUID(),
			title: "Sketch out mobile app concept",
			completed: false,
			priority: "medium",
			category: "ideas",
			createdAt: Date.now() - 10800_000,
		},
		{
			id: crypto.randomUUID(),
			title: "Prepare sprint demo slides",
			completed: false,
			priority: "high",
			category: "work",
			createdAt: Date.now() - 1800_000,
		},
	];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function timeAgo(timestamp: number): string {
	const seconds = Math.floor((Date.now() - timestamp) / 1000);
	if (seconds < 60) return "just now";
	const minutes = Math.floor(seconds / 60);
	if (minutes < 60) return `${minutes}m ago`;
	const hours = Math.floor(minutes / 60);
	if (hours < 24) return `${hours}h ago`;
	const days = Math.floor(hours / 24);
	return `${days}d ago`;
}

const priorityWeight: Record<Priority, number> = { high: 0, medium: 1, low: 2 };

function sortTasks(tasks: Task[]): Task[] {
	return [...tasks].sort((a, b) => {
		if (a.completed !== b.completed) return a.completed ? 1 : -1;
		const pw = priorityWeight[a.priority] - priorityWeight[b.priority];
		if (pw !== 0) return pw;
		return b.createdAt - a.createdAt;
	});
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StatCard({
	icon: Icon,
	label,
	value,
	accent,
}: Readonly<{
	icon: typeof TaskIcon;
	label: string;
	value: number;
	accent: string;
}>) {
	return (
		<div
			className={cn(
				"flex items-center gap-3 rounded-xl border border-border bg-surface p-3 transition-colors",
			)}
		>
			<div
				className={cn(
					"flex size-9 shrink-0 items-center justify-center rounded-lg",
					accent,
				)}
			>
				<Icon label="" size="small" />
			</div>
			<div className="min-w-0">
				<p className="text-xs text-text-subtlest">{label}</p>
				<p className="text-lg font-semibold leading-snug text-text">{value}</p>
			</div>
		</div>
	);
}

function TaskRow({
	task,
	onToggle,
	onDelete,
}: Readonly<{
	task: Task;
	onToggle: (id: string) => void;
	onDelete: (id: string) => void;
}>) {
	const { label: priorityLabel, variant: priorityVariant, icon: PriorityIcon } =
		PRIORITY_CONFIG[task.priority];
	const { emoji, label: catLabel, variant: catVariant } =
		CATEGORY_CONFIG[task.category];

	return (
		<div
			className={cn(
				"group flex items-center gap-3 rounded-lg border border-transparent px-3 py-2.5 transition-all hover:border-border hover:bg-surface-raised",
				task.completed && "opacity-60",
			)}
		>
			<Checkbox
				checked={task.completed}
				onCheckedChange={() => onToggle(task.id)}
				aria-label={`Mark "${task.title}" as ${task.completed ? "incomplete" : "complete"}`}
			/>

			<div className="flex min-w-0 flex-1 flex-col gap-0.5">
				<span
					className={cn(
						"truncate text-sm font-medium text-text transition-all",
						task.completed && "line-through text-text-subtlest",
					)}
				>
					{task.title}
				</span>
				<div className="flex items-center gap-2">
					<Badge variant={priorityVariant} className="gap-0.5">
						<PriorityIcon label="" size="small" />
						{priorityLabel}
					</Badge>
					<Badge variant={catVariant}>
						{emoji} {catLabel}
					</Badge>
					<span className="hidden text-xs text-text-subtlest sm:inline-flex items-center gap-0.5">
						<ClockIcon label="" size="small" />
						{timeAgo(task.createdAt)}
					</span>
				</div>
			</div>

			<Button
				variant="ghost"
				size="icon-sm"
				className="text-text-subtlest opacity-0 transition-opacity group-hover:opacity-100 hover:text-text-danger"
				onClick={() => onDelete(task.id)}
				aria-label={`Delete "${task.title}"`}
			>
				<TrashIcon label="" size="small" />
			</Button>
		</div>
	);
}

// ---------------------------------------------------------------------------
// Main App
// ---------------------------------------------------------------------------

export default function TaskManagerApp() {
	const formId = useId();
	const [tasks, setTasks] = useState<Task[]>(createSeedTasks);
	const [newTitle, setNewTitle] = useState("");
	const [newPriority, setNewPriority] = useState<Priority>("medium");
	const [newCategory, setNewCategory] = useState<Category>("work");
	const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
	const [filterCategory, setFilterCategory] = useState<Category | "all">("all");

	// -- actions --
	const addTask = useCallback(() => {
		const title = newTitle.trim();
		if (!title) return;
		setTasks((prev) => [
			...prev,
			{
				id: crypto.randomUUID(),
				title,
				completed: false,
				priority: newPriority,
				category: newCategory,
				createdAt: Date.now(),
			},
		]);
		setNewTitle("");
	}, [newTitle, newPriority, newCategory]);

	const toggleTask = useCallback((id: string) => {
		setTasks((prev) =>
			prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)),
		);
	}, []);

	const deleteTask = useCallback((id: string) => {
		setTasks((prev) => prev.filter((t) => t.id !== id));
	}, []);

	const clearCompleted = useCallback(() => {
		setTasks((prev) => prev.filter((t) => !t.completed));
	}, []);

	// -- derived --
	const totalTasks = tasks.length;
	const completedCount = tasks.filter((t) => t.completed).length;
	const activeCount = totalTasks - completedCount;
	const highPriorityCount = tasks.filter(
		(t) => t.priority === "high" && !t.completed,
	).length;

	const visibleTasks = sortTasks(
		tasks.filter((t) => {
			if (filterStatus === "active" && t.completed) return false;
			if (filterStatus === "completed" && !t.completed) return false;
			if (filterCategory !== "all" && t.category !== filterCategory) return false;
			return true;
		}),
	);

	return (
		<div className="mx-auto flex min-h-svh w-full max-w-2xl flex-col gap-5 px-4 py-8">
			{/* Header */}
			<div className="flex items-end justify-between">
				<div>
					<h1 className="flex items-center gap-2 text-2xl font-bold text-text">
						<BoardIcon label="" size="medium" />
						Task Manager
					</h1>
					<p className="mt-1 text-sm text-text-subtle">
						Stay organized. Get things done.
					</p>
				</div>
				{completedCount > 0 ? (
					<Button variant="ghost" size="sm" onClick={clearCompleted}>
						Clear completed
					</Button>
				) : null}
			</div>

			{/* Stats */}
			<div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
				<StatCard
					icon={TaskIcon}
					label="Total"
					value={totalTasks}
					accent="bg-bg-neutral text-icon"
				/>
				<StatCard
					icon={ClockIcon}
					label="Active"
					value={activeCount}
					accent="bg-bg-information-subtler text-icon-information"
				/>
				<StatCard
					icon={CheckCircleIcon}
					label="Done"
					value={completedCount}
					accent="bg-bg-success-subtler text-icon-success"
				/>
				<StatCard
					icon={PriorityHighIcon}
					label="Urgent"
					value={highPriorityCount}
					accent="bg-bg-danger-subtler text-icon-danger"
				/>
			</div>

			{/* Add task */}
			<Card>
				<CardHeader>
					<CardTitle>Add a task</CardTitle>
					<CardDescription>What needs to get done?</CardDescription>
				</CardHeader>
				<CardContent className="flex flex-col gap-3">
					<form
						id={formId}
						onSubmit={(e) => {
							e.preventDefault();
							addTask();
						}}
						className="flex gap-2"
					>
						<Input
							placeholder="e.g. Ship feature flags…"
							value={newTitle}
							onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
								setNewTitle(e.target.value)
							}
							className="flex-1"
							autoComplete="off"
						/>
						<Button type="submit" disabled={!newTitle.trim()}>
							<PlusIcon label="" data-icon="inline-start" size="small" />
							Add
						</Button>
					</form>

					<div className="flex flex-wrap items-center gap-2">
						<span className="text-xs font-medium text-text-subtlest">
							Priority
						</span>
						<div className="flex gap-1">
							{PRIORITIES.map((p) => {
								const { label, icon: Icon } = PRIORITY_CONFIG[p];
								return (
									<Button
										key={p}
										type="button"
										variant={newPriority === p ? "outline" : "ghost"}
										size="xs"
										onClick={() => setNewPriority(p)}
										className={cn(
											newPriority === p && "ring-1 ring-ring",
										)}
									>
										<Icon label="" size="small" />
										{label}
									</Button>
								);
							})}
						</div>

						<span className="ml-2 text-xs font-medium text-text-subtlest">
							Category
						</span>
						<div className="flex gap-1">
							{CATEGORIES.map((c) => {
								const { label, emoji } = CATEGORY_CONFIG[c];
								return (
									<Button
										key={c}
										type="button"
										variant={newCategory === c ? "outline" : "ghost"}
										size="xs"
										onClick={() => setNewCategory(c)}
										className={cn(
											newCategory === c && "ring-1 ring-ring",
										)}
									>
										{emoji} {label}
									</Button>
								);
							})}
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Filters */}
			<div className="flex flex-wrap items-center gap-2">
				<FilterIcon label="" size="small" />
				<div className="flex gap-1">
					{(["all", "active", "completed"] as FilterStatus[]).map((s) => (
						<Button
							key={s}
							variant={filterStatus === s ? "outline" : "ghost"}
							size="xs"
							onClick={() => setFilterStatus(s)}
						>
							{s.charAt(0).toUpperCase() + s.slice(1)}
						</Button>
					))}
				</div>

				<span className="mx-1 h-4 w-px bg-border" />

				<div className="flex gap-1">
					<Button
						variant={filterCategory === "all" ? "outline" : "ghost"}
						size="xs"
						onClick={() => setFilterCategory("all")}
					>
						All
					</Button>
					{CATEGORIES.map((c) => {
						const { emoji, label } = CATEGORY_CONFIG[c];
						return (
							<Button
								key={c}
								variant={filterCategory === c ? "outline" : "ghost"}
								size="xs"
								onClick={() => setFilterCategory(c)}
							>
								{emoji} {label}
							</Button>
						);
					})}
				</div>
			</div>

			{/* Task list */}
			<Card className="flex-1">
				<CardHeader>
					<CardTitle>
						Tasks{" "}
						<Badge variant="default" className="ml-1">
							{visibleTasks.length}
						</Badge>
					</CardTitle>
					<CardAction>
						<span className="text-xs text-text-subtlest">
							Sorted by priority
						</span>
					</CardAction>
				</CardHeader>
				<CardContent className="flex flex-col gap-0.5">
					{visibleTasks.length === 0 ? (
						<div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
							<CheckCircleIcon label="" size="medium" />
							<p className="text-sm font-medium text-text-subtle">
								{filterStatus === "completed"
									? "No completed tasks yet"
									: filterStatus === "active"
										? "All caught up! 🎉"
										: "No tasks yet — add one above"}
							</p>
						</div>
					) : (
						visibleTasks.map((task) => (
							<TaskRow
								key={task.id}
								task={task}
								onToggle={toggleTask}
								onDelete={deleteTask}
							/>
						))
					)}
				</CardContent>
			</Card>

			{/* Footer */}
			<p className="text-center text-xs text-text-subtlest">
				Built with VPK • {activeCount} task{activeCount !== 1 ? "s" : ""}{" "}
				remaining
			</p>
		</div>
	);
}
