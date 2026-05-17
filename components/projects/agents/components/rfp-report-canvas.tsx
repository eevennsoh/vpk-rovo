"use client";

import { useEffect, useMemo, useState } from "react";
import { RovoCanvas, type RovoCanvasStatus, type RovoCanvasVersion, type RovoCanvasView } from "@/components/blocks/rovo-canvas/page";
import ChatPanel, { type ChatPanelGreetingProps } from "@/components/projects/sidebar-chat/page";
import type { ChatContextBarDescriptor } from "@/components/projects/sidebar-chat/lib/chat-context-bar";
import {
	ChainOfThought,
	ChainOfThoughtContent,
	ChainOfThoughtStep,
} from "@/components/ui-custom/chain-of-thought";
import { mergeRovoContextDescriptions } from "@/lib/rovo-context";
import { RFP_101_WORK_ITEM, formatActiveJiraWorkItemContext } from "../data/rfp-work-items";
import type { AgentsRfpDemoActions } from "../hooks/use-agents-rfp-demo-state";
import { formatRfpDemoContext, type AgentsRfpDemoState } from "../lib/rfp-demo-state";

interface RfpReportCanvasProps {
	state: AgentsRfpDemoState;
	actions: AgentsRfpDemoActions;
	onAttachReport?: (reportPreviewHtml?: string) => void;
	chatContextBar?: ChatContextBarDescriptor | null;
	chatGreeting?: ChatPanelGreetingProps;
}

interface RfpRenderedHtmlReportProps {
	error: string | null;
	html: string | null;
	status: RfpHtmlReportStatus;
}

type RfpHtmlReportStatus = "idle" | "loading" | "ready" | "error";
type RfpReportVariant = "initial" | "refined";

interface RfpHtmlReportPreviewResponse {
	html: string;
}

interface RfpHtmlReportPreviewState {
	error: string | null;
	html: string | null;
	reload: () => void;
	status: RfpHtmlReportStatus;
}

const RFP_REPORT_PREVIEW_ENDPOINT = "/api/agents/rfp-demo/vpk-html-report";
const RFP_REPORT_ARTIFACT_TITLE = "RFP-101 response strategy report";
const RFP_REPORT_ARTIFACT_METADATA = "HTML report \u2022 Version 1";

function resolveRfpReportVariant(state: AgentsRfpDemoState): RfpReportVariant {
	const selectedVersionId = state.report.currentVersionId
		?? state.report.versions[state.report.versions.length - 1]?.id
		?? null;

	return selectedVersionId === "refined-current-report"
		? "refined"
		: "initial";
}

function buildRfpReportContextDescription(state: AgentsRfpDemoState): string {
	return mergeRovoContextDescriptions(
		formatActiveJiraWorkItemContext(RFP_101_WORK_ITEM),
		formatRfpDemoContext(state),
	) ?? "";
}

function isRfpHtmlReportPreviewResponse(value: unknown): value is RfpHtmlReportPreviewResponse {
	return Boolean(
		value &&
		typeof value === "object" &&
		"html" in value &&
		typeof value.html === "string" &&
		value.html.includes('<meta name="generator" content="vpk-html">'),
	);
}

function resolveRfpReportCanvasStatus(status: RfpHtmlReportStatus): RovoCanvasStatus {
	if (status === "error") {
		return "error";
	}

	if (status === "ready") {
		return "ready";
	}

	return "executing";
}

function useRfpHtmlReportPreview(state: AgentsRfpDemoState): RfpHtmlReportPreviewState {
	const [reloadKey, setReloadKey] = useState(0);
	const [previewState, setPreviewState] = useState<Omit<RfpHtmlReportPreviewState, "reload">>({
		error: null,
		html: null,
		status: "idle",
	});
	const variant = resolveRfpReportVariant(state);
	const contextDescription = useMemo(() => buildRfpReportContextDescription(state), [state]);

	useEffect(() => {
		if (!state.canvas.open) {
			return;
		}

		const abortController = new AbortController();
		setPreviewState((currentState) => ({
			error: null,
			html: currentState.html,
			status: currentState.html ? "ready" : "loading",
		}));

		void fetch(RFP_REPORT_PREVIEW_ENDPOINT, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				contextDescription,
				variant,
			}),
			signal: abortController.signal,
		})
			.then(async (response) => {
				const payload = await response.json().catch(() => null) as unknown;
				if (!response.ok) {
					const message = payload &&
						typeof payload === "object" &&
						"error" in payload &&
						typeof payload.error === "string"
						? payload.error
						: "The vpk-html report preview route returned an error.";
					throw new Error(message);
				}
				if (!isRfpHtmlReportPreviewResponse(payload)) {
					throw new Error("The report preview route did not return a vpk-html document.");
				}

				setPreviewState({
					error: null,
					html: payload.html,
					status: "ready",
				});
			})
			.catch((error: unknown) => {
				if (abortController.signal.aborted) {
					return;
				}

				setPreviewState({
					error: error instanceof Error ? error.message : String(error),
					html: null,
					status: "error",
				});
			});

		return () => abortController.abort();
	}, [contextDescription, reloadKey, state.canvas.open, variant]);

	return {
		...previewState,
		reload: () => setReloadKey((currentKey) => currentKey + 1),
	};
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

function RfpRenderedHtmlReport({
	error,
	html,
	status,
}: Readonly<RfpRenderedHtmlReportProps>): React.ReactElement {
	if (status === "error") {
		return (
			<div className="flex size-full items-center justify-center bg-surface-sunken p-6">
				<div className="max-w-md rounded-lg border border-border bg-surface p-4 text-sm text-text shadow-sm">
					<p className="font-medium">Could not render the vpk-html report.</p>
					<p className="mt-2 text-text-subtle">{error ?? "The report preview route failed."}</p>
				</div>
			</div>
		);
	}

	if (!html) {
		return (
			<div className="flex size-full items-center justify-center bg-surface-sunken p-6">
				<div className="rounded-lg border border-border bg-surface px-4 py-3 text-sm text-text-subtle shadow-sm">
					Rendering vpk-html report...
				</div>
			</div>
		);
	}

	return (
		<iframe
			title="RFP-101 response strategy report"
			className="block size-full border-0 bg-surface"
			sandbox=""
			srcDoc={html}
		/>
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
	const editContextBar: ChatContextBarDescriptor = {
		iconName: "artifact",
		label: RFP_REPORT_ARTIFACT_TITLE,
		signature: chatContextBar ? `rovo-canvas-edit:${chatContextBar.signature}` : "rovo-canvas-edit:rfp-101-response-strategy-report",
		variant: "edit",
	};

	return (
		<ChatPanel
			onClose={onClose}
			hideHeader
			enableSmartWidgets
			abortOnUnmount={false}
			chatContextBar={editContextBar}
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

export function RfpReportCanvas({
	state,
	actions,
	onAttachReport,
	chatContextBar,
	chatGreeting,
}: Readonly<RfpReportCanvasProps>): React.ReactElement {
	const reportPreview = useRfpHtmlReportPreview(state);
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
				copyText: reportPreview.html ?? "vpk-html report preview is loading.",
				content: (
					<RfpRenderedHtmlReport
						error={reportPreview.error}
						html={reportPreview.html}
						status={reportPreview.status}
					/>
				),
			},
		],
		[reportPreview.error, reportPreview.html, reportPreview.status],
	);

	return (
		<RovoCanvas
			open={state.canvas.open}
			onOpenChange={(open) => actions.setCanvasOpen(open)}
			kind="report"
			status={resolveRfpReportCanvasStatus(reportPreview.status)}
			title={RFP_REPORT_ARTIFACT_TITLE}
			primaryActionLabel="Add PDF to RFP-101"
			onPrimaryAction={() => (onAttachReport ?? actions.attachReport)(reportPreview.html ?? undefined)}
			views={views}
			viewId={state.canvas.activeViewId}
			onViewChange={() => actions.setCanvasView("report")}
			onRefresh={reportPreview.reload}
			onVersionSelect={actions.selectReportVersion}
			artefactLabel={RFP_REPORT_ARTIFACT_TITLE}
			artefactMetadata={RFP_REPORT_ARTIFACT_METADATA}
			versionHistory={versions}
			rightRail={
				<RfpReportCanvasChatRail
					chatContextBar={chatContextBar}
					chatGreeting={chatGreeting}
					onClose={() => actions.setCanvasOpen(false)}
				/>
			}
			footer={null}
		/>
	);
}
