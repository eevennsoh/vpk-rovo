"use client";

import { useMemo } from "react";
import { RovoCanvas, type RovoCanvasVersion, type RovoCanvasView } from "@/components/blocks/rovo-canvas/page";
import {
	ChainOfThought,
	ChainOfThoughtContent,
	ChainOfThoughtStep,
} from "@/components/ui-ai/chain-of-thought";
import { Button } from "@/components/ui/button";
import { Lozenge } from "@/components/ui/lozenge";
import { token } from "@/lib/tokens";
import type { AgentsRfpDemoActions } from "../hooks/use-agents-rfp-demo-state";
import type { AgentsRfpDemoState } from "../lib/rfp-demo-state";

interface RfpReportCanvasProps {
	state: AgentsRfpDemoState;
	actions: AgentsRfpDemoActions;
	onCreateAgent: () => void;
}

interface RfpReportPreviewProps {
	isRefined: boolean;
}

const PLAN_ITEMS = [
	"Read RFP-101, parent RFP-100, status, priority, due date, and subtasks.",
	"Scan RFP packet, compliance matrix, response brief, supplier portal image, audio briefing, and walkthrough.",
	"Use fixture-backed Teamwork Graph context for account memory, reusable assets, people, and goals.",
	"Map ITSM, CMDB, asset management, AI, legal, data residency, audit, and security requirements.",
	"Generate deterministic offline HTML with vpk-html, then stage PDF export only after approval.",
];

const ACCOUNT_MEMORY = [
	"Confluence: Standard ITSM RFP Response Template.",
	"Jira: Prior security review and POC tracker.",
	"Loom: Rovo for ITSM demo recording.",
	"People: CSM, SE, legal counsel.",
	"Goals: FY26 Enterprise Expansion.",
];

function getRfpReportHtml(isRefined: boolean): string {
	const summary = isRefined
		? "Enterprise Evaluation Account should receive a customer-facing response that leads with unified ITSM and CMDB outcomes, then uses Rovo and Teamwork Graph as the AI automation differentiator. Legal, data residency, audit, and vulnerability answers stay review-required before any customer submission."
		: "RFP-101 is a strong qualified pursuit because Atlassian can cover the core ITSM, service desk, portal, knowledge, change, Assets, CMDB, and AI collaboration story while clearly marking legal and security gaps for review.";

	return [
		"<article>",
		"<h1>RFP-101 response strategy</h1>",
		`<p>${summary}</p>`,
		"<h2>Requirement coverage</h2>",
		"<ul>",
		"<li>Strong fit: ITSM, service desk, portal, knowledge, change, incident, and reporting workflows.</li>",
		"<li>Differentiator: Assets, CMDB, Rovo, and Teamwork Graph connect service data to account memory.</li>",
		"<li>Review required: legal, data residency, audit, vulnerability, and GRC responses.</li>",
		"</ul>",
		"<h2>Reusable assets</h2>",
		"<ul>",
		"<li>Standard ITSM RFP Response Template.</li>",
		"<li>Prior JSM pilot notes.</li>",
		"<li>Prior security review and POC tracker.</li>",
		"</ul>",
		"</article>",
	].join("\n");
}

export function RfpStagedToolTrace(): React.ReactElement {
	return (
		<ChainOfThought defaultOpen className="rounded-lg border border-border bg-surface p-3">
			<ChainOfThoughtContent className="mt-0 space-y-3">
				<ChainOfThoughtStep
					label="jira.read_work_item"
					description="Read RFP-101, parent RFP-100, status, priority, due date, and subtasks."
					status="complete"
				/>
				<ChainOfThoughtStep
					label="jira.scan_attachments"
					description="Scanned RFP packet, compliance matrix, response brief, supplier portal upload, audio briefing, and walkthrough."
					status="complete"
				/>
				<ChainOfThoughtStep
					label="teamwork_graph.search"
					description="Returned fixture-backed account memory, people, goals, and reusable response assets."
					status="complete"
				/>
				<ChainOfThoughtStep
					label="rfp.map_requirements"
					description="Mapped ITSM, CMDB, asset management, AI, legal, data residency, security, and audit requirements."
					status="complete"
				/>
				<ChainOfThoughtStep
					label="rfp.check_unfinished_work"
					description="Flagged RFP-106 and RFP-108 as validation gaps for demo ownership and legal/security exhibits."
					status="complete"
				/>
			</ChainOfThoughtContent>
		</ChainOfThought>
	);
}

function RfpReportPlan(): React.ReactElement {
	return (
		<div className="size-full overflow-auto bg-surface p-6">
			<div className="mx-auto grid max-w-4xl gap-6">
				<section className="grid gap-2">
					<div className="flex items-center gap-2">
						<h2 className="text-base font-semibold text-text">Generation plan</h2>
						<Lozenge variant="information">vpk-html</Lozenge>
					</div>
					<ol className="grid gap-2 text-sm text-text-subtle">
						{PLAN_ITEMS.map((item, index) => (
							<li key={item} className="flex gap-2">
								<span className="text-text-subtlest">{index + 1}.</span>
								<span>{item}</span>
							</li>
						))}
					</ol>
				</section>
				<section className="grid gap-2">
					<h2 className="text-base font-semibold text-text">Staged tool trace</h2>
					<RfpStagedToolTrace />
				</section>
				<section className="grid gap-2">
					<h2 className="text-base font-semibold text-text">Source summary</h2>
					<ul className="grid gap-1 text-sm text-text-subtle">
						{ACCOUNT_MEMORY.map((item) => (
							<li key={item}>{item}</li>
						))}
					</ul>
				</section>
			</div>
		</div>
	);
}

function RfpReportPreview({ isRefined }: Readonly<RfpReportPreviewProps>): React.ReactElement {
	return (
		<div className="size-full overflow-auto bg-surface-sunken p-6">
			<article
				className="mx-auto max-w-4xl bg-surface px-8 py-7 text-text shadow-sm"
				style={{ borderRadius: token("radius.medium") }}
			>
				<div className="mb-6 flex flex-wrap items-start justify-between gap-3 border-b border-border pb-4">
					<div>
						<p className="text-xs font-semibold uppercase text-text-subtlest">RFP-101</p>
						<h1 className="mt-1 text-2xl font-semibold text-text">Enterprise RFP response strategy</h1>
					</div>
					<Lozenge variant={isRefined ? "success" : "information"}>
						{isRefined ? "Refined current report" : "Initial generated report"}
					</Lozenge>
				</div>

				<section className="grid gap-3">
					<h2 className="text-base font-semibold text-text">Executive recommendation</h2>
					<p className="text-sm leading-6 text-text-subtle">
						{isRefined
							? "Proceed with a qualified bid. Lead the customer-facing narrative with unified ITSM and CMDB outcomes, then position Rovo and Teamwork Graph as the AI automation layer that helps teams reuse account memory and response assets across the RFP."
							: "Proceed with a qualified bid. RFP-101 is a strong fit for Atlassian's ITSM, service desk, portal, knowledge, change, Assets, CMDB, and AI collaboration story, with legal and security items marked for review."}
					</p>
				</section>

				<section className="mt-6 grid gap-3">
					<h2 className="text-base font-semibold text-text">Requirement coverage matrix</h2>
					<div className="overflow-hidden rounded-lg border border-border">
						<table className="w-full border-collapse text-left text-sm">
							<thead className="bg-surface-raised text-text-subtle">
								<tr>
									<th className="px-3 py-2 font-medium">Area</th>
									<th className="px-3 py-2 font-medium">Coverage</th>
									<th className="px-3 py-2 font-medium">Review</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-border">
								<tr>
									<td className="px-3 py-2">ITSM and service desk</td>
									<td className="px-3 py-2">Strong native story across request, incident, change, portal, and knowledge.</td>
									<td className="px-3 py-2">Sales engineering demo owner</td>
								</tr>
								<tr>
									<td className="px-3 py-2">Assets and CMDB</td>
									<td className="px-3 py-2">Addresses fragmentation and operational visibility with Assets and service context.</td>
									<td className="px-3 py-2">Validate scale assumptions</td>
								</tr>
								<tr>
									<td className="px-3 py-2">AI compliance</td>
									<td className="px-3 py-2">Rovo and Teamwork Graph differentiate reusable response and knowledge workflows.</td>
									<td className="px-3 py-2">Mark legal, audit, and data residency review-required</td>
								</tr>
							</tbody>
						</table>
					</div>
				</section>

				<section className="mt-6 grid gap-3">
					<h2 className="text-base font-semibold text-text">TWG-sourced reusable asset index</h2>
					<ul className="grid gap-2 text-sm text-text-subtle">
						{ACCOUNT_MEMORY.map((item) => (
							<li key={item}>{item}</li>
						))}
					</ul>
				</section>

				<section className="mt-6 grid gap-3">
					<h2 className="text-base font-semibold text-text">Open risks and approvals</h2>
					<p className="text-sm leading-6 text-text-subtle">
						Legal, data residency, audit, and vulnerability responses remain review-required before attachment or status changes. The staged PDF export is only a browser-local preview for this demo.
					</p>
				</section>
			</article>
		</div>
	);
}

function RfpReportHtmlView({ isRefined }: Readonly<RfpReportPreviewProps>): React.ReactElement {
	return (
		<div className="size-full overflow-auto bg-surface p-6">
			<pre className="min-h-full overflow-auto rounded-lg border border-border bg-surface-raised p-4 text-xs leading-5 text-text-subtle">
				<code>{getRfpReportHtml(isRefined)}</code>
			</pre>
		</div>
	);
}

function RfpCanvasFooter({
	state,
	actions,
}: Readonly<{
	state: AgentsRfpDemoState;
	actions: AgentsRfpDemoActions;
}>): React.ReactElement {
	const canApprove = state.report.stage === "generated" || state.report.stage === "refined";
	const canExport = state.report.stage === "approved";
	const canAttach = state.report.stage === "pdf-exported";

	return (
		<div className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-surface px-4 py-3">
			<p className="text-xs text-text-subtle">
				Human approval is required before attachment or status changes.
			</p>
			<div className="flex flex-wrap items-center gap-2">
				<Button size="sm" variant="outline" onClick={actions.approveReport} disabled={!canApprove}>
					Approve report
				</Button>
				<Button size="sm" variant="outline" onClick={actions.exportPdf} disabled={!canExport}>
					Export PDF
				</Button>
				<Button size="sm" onClick={actions.attachReport} disabled={!canAttach}>
					Attach to RFP-101
				</Button>
			</div>
		</div>
	);
}

function RfpAgentProposalBanner({
	state,
	onCreateAgent,
}: Readonly<{
	state: AgentsRfpDemoState;
	onCreateAgent: () => void;
}>): React.ReactElement | null {
	if (state.report.stage !== "attached" || state.agent) {
		return null;
	}

	return (
		<div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-surface px-4 py-3">
			<p className="text-sm text-text">
				This RFP workflow looks repeatable. Want me to create an RFP Drafting Agent that can help with future tickets moved into Drafting?
			</p>
			<Button size="sm" onClick={onCreateAgent}>
				Create agent
			</Button>
		</div>
	);
}

export function RfpReportCanvas({
	state,
	actions,
	onCreateAgent,
}: Readonly<RfpReportCanvasProps>): React.ReactElement {
	const isRefined = state.report.versions.some((version) => version.id === "refined-current-report");
	const versions = useMemo<ReadonlyArray<RovoCanvasVersion>>(
		() => state.report.versions.map((version) => ({
			id: version.id,
			label: version.label,
			summary: version.summary,
			timestamp: version.timestampLabel,
			author: version.createdBy,
			isCurrent: version.id === state.report.currentVersionId,
			group: "Today",
		})),
		[state.report.currentVersionId, state.report.versions],
	);
	const views = useMemo<ReadonlyArray<RovoCanvasView>>(
		() => [
			{
				id: "plan",
				label: "Plan",
				toolbar: "none",
				content: <RfpReportPlan />,
			},
			{
				id: "preview",
				label: "Preview",
				toolbar: "preview",
				content: <RfpReportPreview isRefined={isRefined} />,
			},
			{
				id: "html",
				label: "HTML",
				toolbar: "source",
				copyText: getRfpReportHtml(isRefined),
				content: <RfpReportHtmlView isRefined={isRefined} />,
			},
		],
		[isRefined],
	);

	return (
		<RovoCanvas
			open={state.canvas.open}
			onOpenChange={(open) => actions.setCanvasOpen(open)}
			kind="report"
			status="ready"
			title="RFP-101 response strategy"
			lozengeLabel={state.canvas.mode === "read-only" ? "Read-only" : "Draft"}
			primaryActionLabel="Attach to RFP-101"
			onPrimaryAction={actions.attachReport}
			views={views}
			viewId={state.canvas.activeViewId}
			onViewChange={(viewId) => actions.setCanvasView(viewId as "plan" | "preview" | "html")}
			artefactLabel="Rovo Canvas report"
			versionHistory={versions}
			feedbackBanner={<RfpAgentProposalBanner state={state} onCreateAgent={onCreateAgent} />}
			footer={<RfpCanvasFooter state={state} actions={actions} />}
		/>
	);
}
