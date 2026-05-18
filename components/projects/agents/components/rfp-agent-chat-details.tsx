"use client";

import AddIcon from "@atlaskit/icon/core/add";
import AutomationIcon from "@atlaskit/icon/core/automation";
import DeleteIcon from "@atlaskit/icon/core/delete";
import { Button } from "@/components/ui/button";
import { IconTile } from "@/components/ui/icon-tile";
import { ProgressTracker, type ProgressTrackerStep } from "@/components/ui/progress-tracker";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tag } from "@/components/ui/tag";
import { cn } from "@/lib/utils";
import {
	RFP_DRAFTING_BOARD_NAME,
	RFP_DRAFTING_COLUMN_NAME,
	type AgentsRfpDemoActivityItem,
	type AgentsRfpDemoJobRunSummary,
	type AgentsRfpDemoState,
} from "../lib/rfp-demo-state";

function TriggerAddRow({
	className,
	label = "Add Trigger",
}: Readonly<{
	className?: string;
	label?: string;
}>): React.ReactElement {
	return (
		<div
			className={cn(
				"flex h-8 w-full items-center gap-2 rounded-lg px-2 text-left text-sm text-text-subtle",
				className,
			)}
		>
			<span className="flex size-6 shrink-0 items-center justify-center text-icon-subtle">
				<AddIcon label="" size="small" />
			</span>
			<span className="text-sm font-medium">{label}</span>
		</div>
	);
}

function TriggerDropdown({
	value,
}: Readonly<{
	value: string;
}>): React.ReactElement {
	return (
		<Select defaultValue={value}>
			<SelectTrigger
				aria-label={value}
				className="!h-6 gap-0 rounded-md !py-0 !pr-0 !pl-2 text-sm font-medium text-text [&_[data-slot=icon]]:size-6"
				size="sm"
				variant="none"
			>
				<SelectValue />
			</SelectTrigger>
			<SelectContent align="start" alignItemWithTrigger={false} className="min-w-0">
				<SelectItem value={value}>{value}</SelectItem>
			</SelectContent>
		</Select>
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

function parseRunIdTimestamp(id: string): number | null {
	const match = /^rfp-run-(\d+)-/u.exec(id.trim());
	if (!match) {
		return null;
	}

	const parsed = Number(match[1]);
	return Number.isFinite(parsed) ? parsed : null;
}

function getRunTimelineSortMs(run: AgentsRfpDemoJobRunSummary): number {
	const runIdTimestamp = parseRunIdTimestamp(run.id);
	return runIdTimestamp ?? parseTimelineTimestamp(run.finishedAt ?? run.startedAt);
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

	return (
		<span className="grid gap-1">
			{timestampLabel ? <span data-run-timeline-timestamp>{timestampLabel}</span> : null}
			{run.threadLinks.length > 0 ? (
				<span
					className="flex flex-wrap items-center gap-x-1.5 gap-y-1"
					data-run-timeline-metadata
				>
					{run.threadLinks.map((link) => (
						<a
							key={`${run.id}-${link.ticketCode}`}
							className="group inline-flex rounded-sm no-underline focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-3 focus-visible:outline-none"
							href={`/rovo/${encodeURIComponent(link.threadId)}`}
						>
							<Tag
								color="blue"
								className="cursor-pointer group-hover:bg-bg-neutral-subtle-hovered group-active:bg-bg-neutral-subtle-pressed"
							>
								{link.ticketCode}
							</Tag>
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
	return {
		sequence: activityCount + runCount - index,
		sortMs: getRunTimelineSortMs(run),
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
	onClearTrigger,
	state,
}: Readonly<{
	onClearTrigger?: () => void;
	state: AgentsRfpDemoState;
}>): React.ReactElement {
	const agent = state.agent;
	const trigger = agent?.trigger ?? null;
	const addTriggerControl = <TriggerAddRow />;

	return (
		<div className="grid gap-5">
			<section className="grid gap-2">
				<div className="rounded-xl border border-border bg-surface p-2">
					{trigger ? (
						<>
							<div className="group/trigger-row flex min-h-14 items-center gap-3 rounded-lg px-2 py-2 transition-colors duration-normal hover:bg-bg-neutral-subtle-hovered">
								<IconTile
									aria-hidden={true}
									icon={<AutomationIcon label="" />}
									label="Automation"
									size="small"
									variant="blue"
								/>
								<div className="flex min-w-0 flex-1 flex-wrap items-center gap-2 text-sm text-text">
									<span className="font-medium">Status changed to</span>
									<TriggerDropdown value={RFP_DRAFTING_COLUMN_NAME} />
									<span className="font-medium">in</span>
									<TriggerDropdown value={RFP_DRAFTING_BOARD_NAME} />
								</div>
								<Button
									aria-label="Delete trigger"
									className="opacity-0 transition-opacity duration-normal group-hover/trigger-row:opacity-100 focus-visible:opacity-100"
									onClick={onClearTrigger}
									size="icon-sm"
									variant="ghost"
								>
									<DeleteIcon label="" size="small" />
								</Button>
							</div>
							<Separator className="my-2" />
							{addTriggerControl}
						</>
					) : (
						addTriggerControl
					)}
				</div>
			</section>
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
			bylineClassName="text-xs leading-4"
			className="[&_[data-slot=progress-tracker-content]]:gap-0"
			labelClassName="text-sm leading-5"
			steps={timelineSteps}
		/>
	) : (
		<p className="text-sm text-text-subtle">No agent activity yet.</p>
	);
}
