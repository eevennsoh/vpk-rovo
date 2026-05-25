"use client";

import TaskProgress from "@/components/blocks/task-progress/page";
import type { RovoAppPlanExecutionTrackerViewModel } from "@/components/projects/studio/lib/rovo-app-plan-execution-tracker";

interface RovoAppPlanExecutionTrackerProps {
	tracker: RovoAppPlanExecutionTrackerViewModel;
	onDismiss?: () => void;
}

export function RovoAppPlanExecutionTracker({
	tracker,
	onDismiss,
}: Readonly<RovoAppPlanExecutionTrackerProps>) {
	return (
		<TaskProgress
			key={tracker.planKey}
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
