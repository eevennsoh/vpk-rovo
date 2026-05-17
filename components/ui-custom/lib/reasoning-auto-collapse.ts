interface TimelineAutoCollapseOptions {
	allowAutoCollapse: boolean;
	isStreaming: boolean;
	isOpen: boolean;
	hasAutoCollapsedAtCount: boolean;
	timelineEntryCount: number;
	autoCollapseAtCount: number;
}

interface CompletionAutoCollapseOptions {
	allowAutoCollapse: boolean;
	hasEverStreamed: boolean;
	isStreaming: boolean;
	isOpen: boolean;
	hasAutoCollapsedOnCompletion: boolean;
}

export function shouldScheduleTimelineAutoCollapse({
	allowAutoCollapse,
	isStreaming,
	isOpen,
	hasAutoCollapsedAtCount,
	timelineEntryCount,
	autoCollapseAtCount,
}: Readonly<TimelineAutoCollapseOptions>): boolean {
	return (
		allowAutoCollapse &&
		isStreaming &&
		isOpen &&
		!hasAutoCollapsedAtCount &&
		timelineEntryCount >= autoCollapseAtCount
	);
}

export function shouldScheduleCompletionAutoCollapse({
	allowAutoCollapse,
	hasEverStreamed,
	isStreaming,
	isOpen,
	hasAutoCollapsedOnCompletion,
}: Readonly<CompletionAutoCollapseOptions>): boolean {
	return (
		allowAutoCollapse &&
		hasEverStreamed &&
		!isStreaming &&
		isOpen &&
		!hasAutoCollapsedOnCompletion
	);
}

interface ToolIdleAutoCollapseOptions {
	toolsRunning: boolean;
	prevToolsRunning: boolean;
	isOpen: boolean;
}

export function shouldScheduleToolIdleAutoCollapse({
	toolsRunning,
	prevToolsRunning,
	isOpen,
}: Readonly<ToolIdleAutoCollapseOptions>): boolean {
	return prevToolsRunning && !toolsRunning && isOpen;
}
