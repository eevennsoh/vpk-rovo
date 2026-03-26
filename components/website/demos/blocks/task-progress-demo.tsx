"use client";

import TaskProgress from "@/components/blocks/task-progress/page";
import type { ProgressStatusGroups } from "@/components/blocks/task-progress/data/mock-tasks";

const TASKS_MIXED: ProgressStatusGroups = {
	done: [
		{ id: "d1", label: "Task 1", description: "Set up CI pipeline" },
		{ id: "d2", label: "Task 2", description: "Configure linting rules" },
	],
	inReview: [
		{ id: "r1", label: "Task 3", description: "Implement search API", agentName: "Backend Agent" },
		{ id: "r2", label: "Task 4", description: "Add pagination component" },
	],
	inProgress: [
		{ id: "p1", label: "Task 5", description: "Build dashboard widgets", agentName: "Frontend Agent" },
		{ id: "p2", label: "Task 6", description: "Integrate analytics SDK" },
	],
	failed: [
		{ id: "f1", label: "Task 6b", description: "Recover failed analytics migration" },
	],
	todo: [
		{ id: "t1", label: "Task 7", description: "Write integration tests" },
		{ id: "t2", label: "Task 8", description: "Update documentation" },
		{ id: "t3", label: "Task 9", description: "Deploy to staging" },
	],
};

const TASKS_ALL_DONE: ProgressStatusGroups = {
	done: [
		{ id: "d1", label: "Task 1", description: "Set up CI pipeline" },
		{ id: "d2", label: "Task 2", description: "Configure linting rules" },
		{ id: "d3", label: "Task 3", description: "Implement search API", agentName: "Backend Agent" },
		{ id: "d4", label: "Task 4", description: "Write integration tests" },
	],
	inReview: [],
	inProgress: [],
	failed: [],
	todo: [],
};

const TASKS_EARLY: ProgressStatusGroups = {
	done: [],
	inReview: [],
	inProgress: [{ id: "p1", label: "Task 1", description: "Analyze codebase structure", agentName: "Explorer Agent" }],
	failed: [],
	todo: [
		{ id: "t1", label: "Task 2", description: "Set up CI pipeline" },
		{ id: "t2", label: "Task 3", description: "Configure linting rules" },
		{ id: "t3", label: "Task 4", description: "Implement search API" },
		{ id: "t4", label: "Task 5", description: "Write integration tests" },
		{ id: "t5", label: "Task 6", description: "Update documentation" },
	],
};

const TASKS_WITH_AGENTS: ProgressStatusGroups = {
	done: [{ id: "d1", label: "Task 1", description: "Set up CI pipeline", agentName: "DevOps Agent" }],
	inReview: [
		{ id: "r1", label: "Task 2", description: "Implement search API", agentName: "Backend Agent" },
		{ id: "r2", label: "Task 3", description: "Build search UI", agentName: "Frontend Agent" },
	],
	inProgress: [{ id: "p1", label: "Task 4", description: "Write integration tests", agentName: "QA Agent" }],
	failed: [],
	todo: [{ id: "t1", label: "Task 5", description: "Deploy to staging", agentName: "DevOps Agent" }],
};

export default function TaskProgressDemo() {
	return (
		<div className="flex flex-col items-center gap-8 p-8">
			<div className="flex w-full max-w-sm flex-col gap-2">
				<span className="text-xs font-medium text-text-subtlest">Running</span>
				<TaskProgress taskStatusGroups={TASKS_MIXED} />
			</div>
			<div className="flex w-full max-w-sm flex-col gap-2">
				<span className="text-xs font-medium text-text-subtlest">Completed (collapsed — click to expand)</span>
				<TaskProgress runStatus="completed" runCompletedAt="2025-01-15T10:10:51Z" runCreatedAt="2025-01-15T10:00:00Z" defaultCollapsed />
			</div>
		</div>
	);
}

export function TaskProgressDemoRunning() {
	return (
		<div className="flex items-center justify-center p-6">
			<TaskProgress planTitle="Sprint Planning" planEmoji="🚀" taskStatusGroups={TASKS_MIXED} runStatus="running" agentCount={6} />
		</div>
	);
}

export function TaskProgressDemoCompleted() {
	return (
		<div className="flex items-center justify-center p-6">
			<TaskProgress
				planTitle="Code Review Sweep"
				planEmoji="✅"
				taskStatusGroups={TASKS_ALL_DONE}
				runStatus="completed"
				runCreatedAt="2025-01-15T10:00:00Z"
				runCompletedAt="2025-01-15T10:10:51Z"
				agentCount={4}
			/>
		</div>
	);
}

export function TaskProgressDemoFailed() {
	return (
		<div className="flex items-center justify-center p-6">
			<TaskProgress
				planTitle="Deploy Pipeline"
				planEmoji="❌"
				taskStatusGroups={{
					done: [{ id: "d1", label: "Task 1", description: "Build artifacts" }],
					inReview: [],
					inProgress: [],
					failed: [
						{ id: "f1", label: "Task 2", description: "Run smoke tests" },
						{ id: "f2", label: "Task 3", description: "Deploy to production" },
					],
					todo: [
						{ id: "t1", label: "Task 4", description: "Prepare rollback plan" },
					],
				}}
				runStatus="failed"
				runCreatedAt="2025-01-15T10:00:00Z"
				runCompletedAt="2025-01-15T10:03:22Z"
				agentCount={3}
			/>
		</div>
	);
}

export function TaskProgressDemoCollapsed() {
	return (
		<div className="flex items-center justify-center p-6">
			<TaskProgress planTitle="Flexible Friday Plan" planEmoji="🔥" runStatus="completed" runCreatedAt="2025-01-15T10:00:00Z" runCompletedAt="2025-01-15T10:10:51Z" defaultCollapsed />
		</div>
	);
}

export function TaskProgressDemoCollapsedRunning() {
	return (
		<div className="flex items-center justify-center p-6">
			<TaskProgress planTitle="Background Tasks" planEmoji="⏳" runStatus="running" agentCount={8} defaultCollapsed />
		</div>
	);
}

export function TaskProgressDemoWithAgents() {
	return (
		<div className="flex items-center justify-center p-6">
			<TaskProgress planTitle="Multi-Agent Sprint" planEmoji="🤖" taskStatusGroups={TASKS_WITH_AGENTS} runStatus="running" agentCount={4} />
		</div>
	);
}

export function TaskProgressDemoEarlyProgress() {
	return (
		<div className="flex items-center justify-center p-6">
			<TaskProgress planTitle="New Feature Build" planEmoji="🏗️" taskStatusGroups={TASKS_EARLY} runStatus="running" agentCount={1} />
		</div>
	);
}

export function TaskProgressDemoMultipleRuns() {
	return (
		<div className="flex items-center justify-center p-6">
			<TaskProgress planTitle="Iterative Refinement" planEmoji="🔄" taskStatusGroups={TASKS_MIXED} runStatus="running" runCount={3} agentCount={5} />
		</div>
	);
}

export function TaskProgressDemoAllStates() {
	return (
		<div className="flex flex-col items-center gap-6 p-6">
			<TaskProgress planTitle="Running Plan" planEmoji="🚀" taskStatusGroups={TASKS_MIXED} runStatus="running" agentCount={6} />
			<TaskProgress
				planTitle="Completed Plan"
				planEmoji="✅"
				taskStatusGroups={TASKS_ALL_DONE}
				runStatus="completed"
				runCreatedAt="2025-01-15T10:00:00Z"
				runCompletedAt="2025-01-15T10:10:51Z"
				agentCount={4}
			/>
			<TaskProgress
				planTitle="Failed Plan"
				planEmoji="❌"
				taskStatusGroups={TASKS_EARLY}
				runStatus="failed"
				runCreatedAt="2025-01-15T10:00:00Z"
				runCompletedAt="2025-01-15T10:03:22Z"
				agentCount={3}
			/>
		</div>
	);
}
