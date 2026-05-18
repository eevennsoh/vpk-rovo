"use client";

import { Badge } from "@/components/ui/badge";
import { Lozenge } from "@/components/ui/lozenge";
import { Separator } from "@/components/ui/separator";
import type { AgentsRfpDemoState } from "../lib/rfp-demo-state";

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
