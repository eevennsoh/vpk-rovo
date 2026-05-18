"use client";

import { Badge } from "@/components/ui/badge";
import { ProgressTracker, type ProgressTrackerStep } from "@/components/ui/progress-tracker";
import { Separator } from "@/components/ui/separator";
import type {
	AgentsRfpDemoActivityItem,
	AgentsRfpDemoJobRunSummary,
	AgentsRfpDemoState,
} from "../lib/rfp-demo-state";

const TOOL_LABELS = [
	"Jira work item reader",
	"Attachment scanner",
	"Teamwork Graph search",
	"Report generator",
	"HTML draft attachment",
] as const;

const KNOWLEDGE_LABELS = [
	"RFP-101 approved report",
	"Standard ITSM RFP Response Template",
	"Prior JSM pilot notes",
	"Prior security review",
] as const;

function DetailsSection({
	children,
	title,
}: Readonly<{
	children: React.ReactNode;
	title: string;
}>): React.ReactElement {
	return (
		<section className="grid gap-2">
			<h3 className="text-sm font-semibold text-text">{title}</h3>
			{children}
		</section>
	);
}

type TimelineProgressState = NonNullable<ProgressTrackerStep["state"]>;

interface ActivityTimelineEntry {
	sequence: number;
	sortMs: number;
	step: ProgressTrackerStep;
}

function parseTimelineTimestamp(value?: string | null): number {
	const normalizedValue = value?.trim();
	if (!normalizedValue) {
		return Number.NEGATIVE_INFINITY;
	}

	if (normalizedValue.toLowerCase() === "now") {
		return Number.POSITIVE_INFINITY;
	}

	const parsed = Date.parse(normalizedValue);
	return Number.isFinite(parsed) ? parsed : Number.NEGATIVE_INFINITY;
}

function formatTimelineTimestamp(value?: string | null): string | null {
	const normalizedValue = value?.trim();
	if (!normalizedValue) {
		return null;
	}

	const parsed = Date.parse(normalizedValue);
	if (!Number.isFinite(parsed)) {
		return null;
	}

	return new Intl.DateTimeFormat("en-US", {
		dateStyle: "medium",
		timeStyle: "short",
	}).format(new Date(parsed));
}

function getRunTrackerState(status: AgentsRfpDemoJobRunSummary["status"]): TimelineProgressState {
	if (status === "running") {
		return "current";
	}

	if (status === "completed-with-failures" || status === "failed") {
		return "warning";
	}

	if (status === "completed" || status === "skipped") {
		return "done";
	}

	return "todo";
}

function getActivityTrackerState(activity: AgentsRfpDemoActivityItem): TimelineProgressState {
	return activity.type === "draft-failed" ? "warning" : "done";
}

function RunTimelineByline({
	run,
}: Readonly<{
	run: AgentsRfpDemoJobRunSummary;
}>): React.ReactElement {
	const timestampLabel = formatTimelineTimestamp(run.finishedAt ?? run.startedAt);
	const detailLabel = [
		run.triggerLabel,
		run.source,
		timestampLabel,
	]
		.filter((label): label is string => Boolean(label))
		.join(" · ");

	return (
		<span className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
			<span>{detailLabel}</span>
			{run.threadLinks.length > 0 ? (
				<span className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
					{run.threadLinks.map((link) => (
						<a
							key={`${run.id}-${link.ticketCode}`}
							className="font-medium text-link hover:underline"
							href={`/rovo/${encodeURIComponent(link.threadId)}`}
						>
							{link.ticketCode} thread
						</a>
					))}
				</span>
			) : null}
		</span>
	);
}

function createRunTimelineEntry(
	run: AgentsRfpDemoJobRunSummary,
	index: number,
	runCount: number,
	activityCount: number,
): ActivityTimelineEntry {
	const timestamp = run.finishedAt ?? run.startedAt;

	return {
		sequence: activityCount + runCount - index,
		sortMs: parseTimelineTimestamp(timestamp),
		step: {
			id: `run-${run.id}`,
			label: run.summary,
			byline: <RunTimelineByline run={run} />,
			state: getRunTrackerState(run.status),
		},
	};
}

function createActivityTimelineEntry(
	activity: AgentsRfpDemoActivityItem,
	index: number,
): ActivityTimelineEntry {
	return {
		sequence: index,
		sortMs: parseTimelineTimestamp(activity.timestampLabel),
		step: {
			id: `activity-${activity.id}`,
			label: activity.message,
			byline: activity.timestampLabel,
			state: getActivityTrackerState(activity),
		},
	};
}

function compareActivityTimelineEntries(
	first: ActivityTimelineEntry,
	second: ActivityTimelineEntry,
): number {
	if (first.sortMs !== second.sortMs) {
		return first.sortMs > second.sortMs ? -1 : 1;
	}

	return second.sequence - first.sequence;
}

function getActivityTimelineSteps(state: AgentsRfpDemoState): ProgressTrackerStep[] {
	const runs = state.agent?.jobRunSummaries ?? [];
	const activityItems = state.customAgentActivity;
	const entries = [
		...runs.map((run, index) => createRunTimelineEntry(run, index, runs.length, activityItems.length)),
		...activityItems.map((activity, index) => createActivityTimelineEntry(activity, index)),
	];

	return entries
		.sort(compareActivityTimelineEntries)
		.map((entry) => entry.step);
}

export function RfpAgentTriggerDetails({
	state,
}: Readonly<{
	state: AgentsRfpDemoState;
}>): React.ReactElement {
	const agent = state.agent;
	const triggerLabel = agent?.trigger?.label ?? "On event: ticket enters Drafting";

	return (
		<div className="grid gap-5">
			<DetailsSection title="Tasks">
				<div className="grid gap-2 text-sm text-text-subtle">
					<p>Trigger: {triggerLabel}.</p>
					<p>Job: {agent?.jobId ?? "Created when the agent is applied"}.</p>
					<p>Scope: Drafting column.</p>
					<p>Action: Create a thread, attach a draft, comment, and move successful tickets to Review.</p>
					<p>Rerun policy: Completed tickets with draft output are skipped; failed tickets retry.</p>
				</div>
			</DetailsSection>

			<Separator />

			<DetailsSection title="Instructions">
				<p className="text-sm leading-6 text-text-subtle">
					Read each RFP work item, inspect attachments and subtasks, use Teamwork Graph context to find account memory and reusable response assets, draft a deterministic first-pass vpk-html response package, attach the generated HTML artifact, add an agent-authored comment, and move successful tickets to Review.
				</p>
			</DetailsSection>

			<DetailsSection title="Skills">
				<div className="flex flex-wrap gap-2">
					<Badge>vpk-html</Badge>
				</div>
			</DetailsSection>

			<DetailsSection title="Tools">
				<div className="flex flex-wrap gap-2">
					{TOOL_LABELS.map((tool) => (
						<Badge key={tool} variant="secondary">
							{tool}
						</Badge>
					))}
				</div>
			</DetailsSection>

			<DetailsSection title="Knowledge">
				<div className="flex flex-wrap gap-2">
					{KNOWLEDGE_LABELS.map((source) => (
						<Badge key={source} variant="secondary">
							{source}
						</Badge>
					))}
				</div>
			</DetailsSection>
		</div>
	);
}

export function RfpAgentActivityDetails({
	state,
}: Readonly<{
	state: AgentsRfpDemoState;
}>): React.ReactElement {
	const timelineSteps = getActivityTimelineSteps(state);

	return timelineSteps.length > 0 ? (
		<ProgressTracker
			aria-label="RFP Drafter activity timeline"
			bylineClassName="text-sm leading-5"
			labelClassName="text-sm leading-5"
			steps={timelineSteps}
		/>
	) : (
		<p className="text-sm text-text-subtle">No agent activity yet.</p>
	);
}
