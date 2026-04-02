"use client";

import TaskProgress from "@/components/blocks/task-progress/page";
import type { FutureChatPlanExecutionTrackerViewModel } from "@/components/projects/future-chat/lib/future-chat-plan-execution-tracker";

interface FutureChatPlanExecutionTrackerProps {
	tracker: FutureChatPlanExecutionTrackerViewModel;
	onDismiss?: () => void;
}

export function FutureChatPlanExecutionTracker({
	tracker,
	onDismiss,
}: Readonly<FutureChatPlanExecutionTrackerProps>) {
	return (
		<TaskProgress
			key={`${tracker.planKey}:${tracker.runStatus}`}
			agentCount={tracker.agentCount}
			className="max-w-none"
			defaultCollapsed={tracker.runStatus !== "running"}
			onDelete={tracker.runStatus === "running" ? undefined : onDismiss}
			planVisualIdentity={tracker.planVisualIdentity}
			planTitle={tracker.planTitle}
			runCount={tracker.taskCount}
			runCreatedAt={tracker.runCreatedAt}
			runCompletedAt={tracker.runCompletedAt}
			runStatus={tracker.runStatus}
			showRunningStopButton={false}
			taskStatusGroups={tracker.taskStatusGroups}
		/>
	);
}
