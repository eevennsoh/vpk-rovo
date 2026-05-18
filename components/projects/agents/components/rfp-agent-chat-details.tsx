"use client";

import type { ReactNode } from "react";
import AddIcon from "@atlaskit/icon/core/add";
import AutomationIcon from "@atlaskit/icon/core/automation";
import ChevronDownIcon from "@atlaskit/icon/core/chevron-down";
import DeleteIcon from "@atlaskit/icon/core/delete";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { IconTile } from "@/components/ui/icon-tile";
import { Lozenge } from "@/components/ui/lozenge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
	RFP_DRAFTING_BOARD_NAME,
	RFP_DRAFTING_COLUMN_NAME,
	type AgentsRfpDemoState,
} from "../lib/rfp-demo-state";

function DetailsSection({
	children,
	title,
}: Readonly<{
	children: ReactNode;
	title: string;
}>): React.ReactElement {
	return (
		<section className="grid gap-2">
			<h3 className="text-sm font-semibold text-text">{title}</h3>
			{children}
		</section>
	);
}

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
			<span className="flex size-6 shrink-0 items-center justify-center">
				<AddIcon label="" size="small" />
			</span>
			<span className="text-sm font-medium">{label}</span>
		</div>
	);
}

function TriggerChip({
	children,
}: Readonly<{
	children: ReactNode;
}>): React.ReactElement {
	return (
		<span className="inline-flex h-6 items-center rounded-md bg-bg-neutral pl-2 text-sm font-medium text-text">
			{children}
			<span className="flex size-6 shrink-0 items-center justify-center">
				<ChevronDownIcon label="" size="small" />
			</span>
		</span>
	);
}

function getRunTone(status: string): "neutral" | "success" | "warning" | "danger" {
	if (status === "completed") {
		return "success";
	}
	if (status === "completed-with-failures") {
		return "warning";
	}
	if (status === "failed") {
		return "danger";
	}
	return "neutral";
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
							<div className="group/trigger-row flex min-h-14 items-center gap-3 rounded-lg px-3 py-2 transition-colors duration-normal hover:bg-bg-neutral-subtle-hovered">
								<IconTile
									aria-hidden={true}
									icon={<AutomationIcon label="" />}
									label="Automation"
									size="small"
									variant="blue"
								/>
								<div className="flex min-w-0 flex-1 flex-wrap items-center gap-2 text-sm text-text">
									<span className="font-medium">Status changed to</span>
									<TriggerChip>{RFP_DRAFTING_COLUMN_NAME}</TriggerChip>
									<span className="font-medium">in</span>
									<TriggerChip>{RFP_DRAFTING_BOARD_NAME}</TriggerChip>
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
	const runs = state.agent?.jobRunSummaries ?? [];

	return (
		<div className="grid gap-5">
			<DetailsSection title="Run log">
				{runs.length > 0 ? (
					<ul className="grid gap-3">
						{runs.map((run) => (
							<li key={run.id} className="grid gap-2 rounded-lg border border-border bg-surface-raised p-3">
								<div className="flex flex-wrap items-center justify-between gap-2">
									<div className="min-w-0">
										<p className="text-sm font-medium text-text">{run.summary}</p>
										<p className="text-xs text-text-subtlest">{run.triggerLabel} · {run.source}</p>
									</div>
									<Lozenge variant={getRunTone(run.status)}>{run.status}</Lozenge>
								</div>
								<div className="flex flex-wrap gap-2 text-xs text-text-subtle">
									<Badge variant="secondary">Processed {run.processedTicketCodes.length}</Badge>
									<Badge variant="secondary">Skipped {run.skippedTicketCodes.length}</Badge>
									<Badge variant="secondary">Failed {run.failedTicketCodes.length}</Badge>
								</div>
								{run.threadLinks.length > 0 ? (
									<div className="flex flex-wrap gap-2">
										{run.threadLinks.map((link) => (
											<a
												key={`${run.id}-${link.ticketCode}`}
												className="text-xs font-medium text-link hover:underline"
												href={`/rovo/${encodeURIComponent(link.threadId)}`}
											>
												{link.ticketCode} thread
											</a>
										))}
									</div>
								) : null}
							</li>
						))}
					</ul>
				) : (
					<p className="text-sm text-text-subtle">No event runs yet.</p>
				)}
			</DetailsSection>

			<Separator />

			<DetailsSection title="Activity">
				{state.customAgentActivity.length > 0 ? (
					<ul className="grid gap-3">
						{state.customAgentActivity.map((activity) => (
							<li key={activity.id} className="grid gap-1 border-l-2 border-border pl-3">
								<p className="text-sm text-text">{activity.message}</p>
								<p className="text-xs text-text-subtlest">{activity.timestampLabel}</p>
							</li>
						))}
					</ul>
				) : (
					<p className="text-sm text-text-subtle">No custom-agent activity yet.</p>
				)}
			</DetailsSection>
		</div>
	);
}
