"use client";

import { useMemo } from "react";
import { RovoCanvas, type RovoCanvasVersion, type RovoCanvasView } from "@/components/blocks/rovo-canvas/page";
import ChatPanel, { type ChatPanelGreetingProps } from "@/components/projects/sidebar-chat/page";
import type { ChatContextBarDescriptor } from "@/components/projects/sidebar-chat/lib/chat-context-bar";
import {
	ChainOfThought,
	ChainOfThoughtContent,
	ChainOfThoughtStep,
} from "@/components/ui-ai/chain-of-thought";
import { Button } from "@/components/ui/button";
import type { AgentsRfpDemoActions } from "../hooks/use-agents-rfp-demo-state";
import type { AgentsRfpDemoState } from "../lib/rfp-demo-state";

interface RfpReportCanvasProps {
	state: AgentsRfpDemoState;
	actions: AgentsRfpDemoActions;
	onCreateAgent: () => void;
	chatContextBar?: ChatContextBarDescriptor | null;
	chatGreeting?: ChatPanelGreetingProps;
}

interface RfpRenderedHtmlReportProps {
	isRefined: boolean;
}

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
	const statusLabel = isRefined ? "Refined current report" : "Initial generated report";
	const reusableAssets = ACCOUNT_MEMORY.map((item) => `<li>${item}</li>`).join("\n");

	return `<!doctype html>
<html lang="en">
<head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<title>RFP-101 response strategy</title>
	<style>
		:root {
			color-scheme: light;
			--surface: #ffffff;
			--surface-raised: #f7f8f9;
			--surface-sunken: #f1f2f4;
			--text: #172b4d;
			--text-subtle: #44546f;
			--text-subtlest: #626f86;
			--border: #dcdfe4;
			--brand: #0c66e4;
			--success: #216e4e;
			--warning: #a54800;
		}

		* {
			box-sizing: border-box;
		}

		body {
			margin: 0;
			background: var(--surface-sunken);
			color: var(--text);
			font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
			line-height: 1.5;
		}

		.report {
			max-width: 960px;
			margin: 0 auto;
			padding: 40px;
		}

		.paper {
			background: var(--surface);
			border: 1px solid var(--border);
			border-radius: 16px;
			box-shadow: 0 8px 24px rgb(9 30 66 / 12%);
			overflow: hidden;
		}

		header {
			display: flex;
			justify-content: space-between;
			gap: 24px;
			padding: 32px 36px 28px;
			border-bottom: 1px solid var(--border);
		}

		.kicker {
			margin: 0 0 8px;
			color: var(--text-subtlest);
			font-size: 12px;
			font-weight: 700;
			letter-spacing: 0.08em;
			text-transform: uppercase;
		}

		h1 {
			margin: 0;
			font-size: 30px;
			line-height: 1.15;
		}

		.badge {
			align-self: flex-start;
			white-space: nowrap;
			border-radius: 999px;
			background: #e9f2ff;
			color: #0055cc;
			font-size: 12px;
			font-weight: 700;
			padding: 5px 10px;
		}

		main {
			display: grid;
			gap: 28px;
			padding: 32px 36px 36px;
		}

		section {
			display: grid;
			gap: 12px;
		}

		h2 {
			margin: 0;
			font-size: 16px;
			line-height: 1.25;
		}

		p,
		ul {
			margin: 0;
			color: var(--text-subtle);
			font-size: 14px;
		}

		ul {
			display: grid;
			gap: 8px;
			padding-left: 20px;
		}

		.matrix {
			width: 100%;
			border-collapse: collapse;
			overflow: hidden;
			border: 1px solid var(--border);
			border-radius: 10px;
			font-size: 13px;
		}

		.matrix th,
		.matrix td {
			padding: 11px 12px;
			border-bottom: 1px solid var(--border);
			text-align: left;
			vertical-align: top;
		}

		.matrix th {
			background: var(--surface-raised);
			color: var(--text-subtle);
			font-weight: 700;
		}

		.matrix tr:last-child td {
			border-bottom: 0;
		}

		.status {
			color: var(--success);
			font-weight: 700;
		}

		.review {
			color: var(--warning);
			font-weight: 700;
		}
	</style>
</head>
<body>
	<article class="report">
		<div class="paper">
			<header>
				<div>
					<p class="kicker">RFP-101</p>
					<h1>Enterprise RFP response strategy</h1>
				</div>
				<span class="badge">${statusLabel}</span>
			</header>
			<main>
				<section>
					<h2>Executive recommendation</h2>
					<p>${summary}</p>
				</section>
				<section>
					<h2>Requirement coverage matrix</h2>
					<table class="matrix">
						<thead>
							<tr>
								<th>Area</th>
								<th>Coverage</th>
								<th>Review path</th>
							</tr>
						</thead>
						<tbody>
							<tr>
								<td>ITSM and service desk</td>
								<td><span class="status">Strong fit.</span> Native story across request, incident, change, portal, knowledge, and reporting workflows.</td>
								<td>Sales engineering demo owner</td>
							</tr>
							<tr>
								<td>Assets and CMDB</td>
								<td><span class="status">Strong fit.</span> Assets and service context address fragmented operations and mature CMDB needs.</td>
								<td>Validate scale assumptions</td>
							</tr>
							<tr>
								<td>AI and account memory</td>
								<td><span class="status">Differentiator.</span> Rovo and Teamwork Graph reuse account context, prior answers, and response assets.</td>
								<td>Position as response acceleration and knowledge workflow</td>
							</tr>
							<tr>
								<td>Legal, data residency, audit</td>
								<td><span class="review">Review required.</span> Customer-ready language needs legal, security, audit, and GRC approval.</td>
								<td>Legal and security owners</td>
							</tr>
						</tbody>
					</table>
				</section>
				<section>
					<h2>Teamwork Graph reusable asset index</h2>
					<ul>
						${reusableAssets}
					</ul>
				</section>
				<section>
					<h2>Open risks and approvals</h2>
					<p>Legal, data residency, audit, and vulnerability responses remain review-required before attachment or status changes. The staged PDF export is a browser-local preview for this demo.</p>
				</section>
			</main>
		</div>
	</article>
</body>
</html>`;
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

function RfpRenderedHtmlReport({ isRefined }: Readonly<RfpRenderedHtmlReportProps>): React.ReactElement {
	return (
		<div className="size-full overflow-auto bg-surface-sunken p-6">
			<iframe
				title="RFP-101 response strategy report"
				className="mx-auto block h-[1100px] min-h-full w-full max-w-5xl rounded-lg border border-border bg-surface shadow-sm"
				sandbox=""
				srcDoc={getRfpReportHtml(isRefined)}
			/>
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

function RfpReportCanvasChatRail({
	chatContextBar,
	chatGreeting,
	onClose,
}: Readonly<{
	chatContextBar?: ChatContextBarDescriptor | null;
	chatGreeting?: ChatPanelGreetingProps;
	onClose: () => void;
}>): React.ReactElement {
	return (
		<ChatPanel
			onClose={onClose}
			enableSmartWidgets
			abortOnUnmount={false}
			chatContextBar={chatContextBar}
			greeting={chatGreeting}
			sendPromptOptions={{
				smartGeneration: {
					enabled: true,
					surface: "sidebar",
				},
			}}
		/>
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
	chatContextBar,
	chatGreeting,
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
				id: "report",
				label: "Report",
				toolbar: "preview",
				copyText: getRfpReportHtml(isRefined),
				content: <RfpRenderedHtmlReport isRefined={isRefined} />,
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
			onViewChange={() => actions.setCanvasView("report")}
			artefactLabel="Rovo Canvas report"
			versionHistory={versions}
			rightRail={
				<RfpReportCanvasChatRail
					chatContextBar={chatContextBar}
					chatGreeting={chatGreeting}
					onClose={() => actions.setCanvasOpen(false)}
				/>
			}
			feedbackBanner={<RfpAgentProposalBanner state={state} onCreateAgent={onCreateAgent} />}
			footer={<RfpCanvasFooter state={state} actions={actions} />}
		/>
	);
}
