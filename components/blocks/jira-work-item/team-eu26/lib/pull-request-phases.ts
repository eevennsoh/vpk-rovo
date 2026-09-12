import type { JiraActivityEventEntry } from "@/components/blocks/jira-activity";
import type { TagColor, TagTrailingMetric } from "@/components/ui/tag";

/**
 * Phase buckets for pull-request metrics and helper grouping. Order matches
 * Approved → … → Closed. Only Open/Merged exist on today's activity PR model;
 * other phases stay empty until story data grows. The ContextResources popover renders
 * a flat Smart Link list (no accordion), but tag metrics still use these buckets.
 */
export type PullRequestPhaseId =
	| "approved"
	| "needs-review"
	| "open"
	| "draft"
	| "merged-30d"
	| "closed-30d";

export interface PullRequestPhaseDefinition {
	id: PullRequestPhaseId;
	label: string;
}

export const PULL_REQUEST_PHASES: readonly PullRequestPhaseDefinition[] = [
	{ id: "approved", label: "Approved" },
	{ id: "needs-review", label: "Needs your review" },
	{ id: "open", label: "Open" },
	{ id: "draft", label: "Draft" },
	{ id: "merged-30d", label: "Merged" },
	{ id: "closed-30d", label: "Closed" },
] as const;

export interface PullRequestPhaseSection {
	id: PullRequestPhaseId;
	label: string;
	entries: readonly JiraActivityEventEntry[];
}

/**
 * Sort modes for the Pull requests panel. Distinct from Activity's
 * Activity view control — phase order stays fixed; this only reorders
 * cards within each phase.
 */
export type PullRequestSortMode =
	| "by-me"
	| "latest-activity"
	| "newest-created"
	| "oldest-created"
	| "largest-change";

export const DEFAULT_PULL_REQUEST_SORT_MODE: PullRequestSortMode = "by-me";

/** Map activity PR status onto a phase bucket. Exhaustive over known statuses. */
export function phaseIdForPullRequestStatus(
	status: NonNullable<JiraActivityEventEntry["pullRequest"]>["status"],
): PullRequestPhaseId {
	switch (status) {
		case "Open":
			return "open";
		case "Merged":
			return "merged-30d";
		default: {
			const _exhaustive: never = status;
			return _exhaustive;
		}
	}
}

function pullRequestCreatedAtMs(entry: JiraActivityEventEntry): number {
	return entry.pullRequest?.createdAtMs ?? 0;
}

function pullRequestUpdatedAtMs(entry: JiraActivityEventEntry): number {
	return entry.pullRequest?.updatedAtMs ?? entry.pullRequest?.createdAtMs ?? 0;
}

function pullRequestChangeSize(entry: JiraActivityEventEntry): number {
	const pullRequest = entry.pullRequest;
	if (!pullRequest) return 0;
	return pullRequest.additions + pullRequest.deletions;
}

/** True when the PR author matches the signed-in viewer (name equality). */
export function isPullRequestByCurrentUser(
	entry: JiraActivityEventEntry,
	currentUserName: string,
): boolean {
	const authorName = entry.pullRequest?.authorName;
	return authorName != null && authorName === currentUserName;
}

/**
 * Order unique PR entries for the rail. Phase grouping preserves this order
 * within each section. Missing created/updated timestamps sort as 0.
 */
export function sortPullRequestEntries(
	entries: readonly JiraActivityEventEntry[],
	sortMode: PullRequestSortMode,
	currentUserName: string,
): JiraActivityEventEntry[] {
	const ordered = [...entries];

	switch (sortMode) {
		case "by-me":
			return ordered.sort((left, right) => {
				const leftMine = isPullRequestByCurrentUser(left, currentUserName) ? 0 : 1;
				const rightMine = isPullRequestByCurrentUser(right, currentUserName) ? 0 : 1;
				if (leftMine !== rightMine) return leftMine - rightMine;
				return pullRequestUpdatedAtMs(right) - pullRequestUpdatedAtMs(left);
			});
		case "latest-activity":
			return ordered.sort(
				(left, right) => pullRequestUpdatedAtMs(right) - pullRequestUpdatedAtMs(left),
			);
		case "newest-created":
			return ordered.sort(
				(left, right) => pullRequestCreatedAtMs(right) - pullRequestCreatedAtMs(left),
			);
		case "oldest-created":
			return ordered.sort(
				(left, right) => pullRequestCreatedAtMs(left) - pullRequestCreatedAtMs(right),
			);
		case "largest-change":
			return ordered.sort(
				(left, right) => pullRequestChangeSize(right) - pullRequestChangeSize(left),
			);
		default: {
			const _exhaustive: never = sortMode;
			return _exhaustive;
		}
	}
}

/**
 * Group unique PR entries into fixed phase sections, preserving the caller's
 * sort order within each section. Empty sections are kept for callers that need
 * a fixed phase stack (e.g. metrics helpers / tests).
 */
export function groupPullRequestsByPhase(
	entries: readonly JiraActivityEventEntry[],
	sortMode: PullRequestSortMode = DEFAULT_PULL_REQUEST_SORT_MODE,
	currentUserName = "",
): PullRequestPhaseSection[] {
	const ordered = sortPullRequestEntries(entries, sortMode, currentUserName);
	const byPhase = new Map<PullRequestPhaseId, JiraActivityEventEntry[]>(
		PULL_REQUEST_PHASES.map((phase) => [phase.id, []]),
	);

	for (const entry of ordered) {
		const status = entry.pullRequest?.status;
		if (!status) continue;
		const phaseId = phaseIdForPullRequestStatus(status);
		byPhase.get(phaseId)?.push(entry);
	}

	return PULL_REQUEST_PHASES.map((phase) => ({
		id: phase.id,
		label: phase.label,
		entries: byPhase.get(phase.id) ?? [],
	}));
}

/** Accordion values that should open by default (sections with at least one PR). */
export function defaultOpenPullRequestPhases(
	sections: readonly PullRequestPhaseSection[],
): PullRequestPhaseId[] {
	return sections.filter((section) => section.entries.length > 0).map((section) => section.id);
}

/**
 * Compact title-meta metric chips (Open lime, Needs input yellow, Draft gray,
 * Merge purple). Draft stays empty until activity PR status can map to it.
 */
const PULL_REQUEST_TAG_METRICS: readonly {
	phaseId: PullRequestPhaseId;
	label: string;
	color: TagColor;
}[] = [
	{ phaseId: "open", label: "Open", color: "lime" },
	{ phaseId: "needs-review", label: "Needs input", color: "yellow" },
	{ phaseId: "draft", label: "Draft", color: "gray" },
	{ phaseId: "merged-30d", label: "Merged", color: "purple" },
];

/**
 * Trailing metrics for the title-meta Pull requests Tag. Only non-empty
 * Open / Needs input / Draft / Merged buckets are included.
 */
export function summarizePullRequestTagMetrics(
	entries: readonly JiraActivityEventEntry[],
): TagTrailingMetric[] {
	const counts = new Map<PullRequestPhaseId, number>();
	for (const entry of entries) {
		const status = entry.pullRequest?.status;
		if (!status) continue;
		const phaseId = phaseIdForPullRequestStatus(status);
		counts.set(phaseId, (counts.get(phaseId) ?? 0) + 1);
	}

	return PULL_REQUEST_TAG_METRICS.flatMap(({ phaseId, label, color }) => {
		const count = counts.get(phaseId) ?? 0;
		if (count <= 0) {
			return [];
		}
		return [{ value: `${count} ${label}`, color }];
	});
}
