"use client";

import { Badge } from "@/components/ui/badge";
import { Lozenge } from "@/components/ui/lozenge";
import { Separator } from "@/components/ui/separator";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import type { AgentsRfpDemoState } from "../lib/rfp-demo-state";

interface RfpAgentDetailsSheetProps {
	open: boolean;
	state: AgentsRfpDemoState;
	onOpenChange: (open: boolean) => void;
}

const TOOL_LABELS = [
	"Jira work item reader",
	"Attachment scanner",
	"Teamwork Graph search",
	"Report generator",
	"Staged PDF export",
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

export function RfpAgentDetailsSheet({
	open,
	state,
	onOpenChange,
}: Readonly<RfpAgentDetailsSheetProps>): React.ReactElement {
	const agent = state.agent;

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent side="right" size="lg" className="gap-0 overflow-hidden bg-surface p-0">
				<SheetHeader className="border-b border-border p-5">
					<div className="flex flex-wrap items-center gap-2">
						<SheetTitle>{agent?.name ?? "RFP Drafting Agent"}</SheetTitle>
						{agent ? <Lozenge variant="success">Assigned to Drafting</Lozenge> : null}
					</div>
					<SheetDescription>
						Rovo is now running with the RFP Drafting Agent selected.
					</SheetDescription>
				</SheetHeader>

				<div className="min-h-0 flex-1 overflow-auto p-5">
					<div className="grid gap-5">
						<DetailsSection title="Tasks">
							<div className="grid gap-2 text-sm text-text-subtle">
								<p>Trigger: When an RFP ticket enters Drafting.</p>
								<p>Job: {state.schedule?.name ?? "Drafting column RFP response prep"}</p>
								<p>Schedule: {state.schedule?.scheduleLabel ?? "Weekdays at 9:00 AM"}</p>
								<p>Scope: Drafting column.</p>
								<p>Action: Prepare first-pass draft package.</p>
								<p>Guardrail: Approval required for attachments and status changes.</p>
							</div>
						</DetailsSection>

						<Separator />

						<DetailsSection title="Instructions">
							<p className="text-sm leading-6 text-text-subtle">
								Read each RFP work item, inspect attachments and subtasks, use Teamwork Graph context to find account memory and reusable response assets, ask missing qualification questions, draft a response strategy, generate an HTML report with vpk-html, stage a PDF export, and wait for human approval before attaching the report or moving the ticket forward.
							</p>
						</DetailsSection>

						<Separator />

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
				</div>
			</SheetContent>
		</Sheet>
	);
}
