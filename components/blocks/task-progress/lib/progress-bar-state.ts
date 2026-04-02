import type { ProgressStatusGroups } from "@/components/blocks/task-progress/data/mock-tasks";

export type TaskProgressRunStatus = "running" | "completed" | "failed";

export function shouldShowIndeterminateTaskProgressBar({
	runStatus,
	taskStatusGroups,
}: {
	runStatus: TaskProgressRunStatus;
	taskStatusGroups: ProgressStatusGroups;
}): boolean {
	if (runStatus !== "running") {
		return false;
	}

	const startedTaskCount =
		taskStatusGroups.done.length +
		taskStatusGroups.inReview.length +
		taskStatusGroups.inProgress.length +
		taskStatusGroups.failed.length;

	return startedTaskCount === 0 && taskStatusGroups.todo.length > 0;
}
