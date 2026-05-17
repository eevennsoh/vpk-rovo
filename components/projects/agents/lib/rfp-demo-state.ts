import type {
	KanbanBoardAgentData,
	KanbanBoardColumnData,
} from "@/components/blocks/kanban-board";
import { BOARD_COLUMNS } from "../data/board-data";

export const AGENTS_RFP_DEMO_STORAGE_KEY = "vpk-rovo:agents-rfp-demo:v1";
export const AGENTS_RFP_DEMO_VERSION = 1;
export const RFP_DRAFTING_AGENT_ID = "rfp-drafting-agent";
export const RFP_DRAFTING_SCHEDULE_ID = "rfp-drafting-weekday-0900";
export const GENERATED_RFP_REPORT_ATTACHMENT_ID = "generated-rfp-response-strategy-pdf";

export type AgentsRfpDemoReportStage =
	| "none"
	| "generating"
	| "generated"
	| "refined"
	| "approved"
	| "pdf-exported"
	| "attached";

export type AgentsRfpDemoCanvasViewId = "report";

export interface AgentsRfpDemoBoardColumnState {
	title: string;
	cardCodes: string[];
}

export interface AgentsRfpDemoAttachment {
	id: string;
	displayName: string;
	ext: "html" | "pdf" | string;
	source: "fixture" | "generated";
	approved?: boolean;
	previewKind?: "html-report" | "pdf-preview";
}

export interface AgentsRfpDemoWorkItemState {
	status: string;
	attachments: AgentsRfpDemoAttachment[];
	agentAssignmentIds: string[];
}

export interface AgentsRfpDemoReportVersion {
	id: string;
	label: string;
	summary: string;
	createdBy: "Rovo" | "Maya";
	timestampLabel: string;
}

export interface AgentsRfpDemoAgent {
	id: typeof RFP_DRAFTING_AGENT_ID;
	name: "RFP Drafting Agent";
	selected: boolean;
	assignedColumn: "Drafting";
	createdAt: string;
}

export interface AgentsRfpDemoSchedule {
	id: typeof RFP_DRAFTING_SCHEDULE_ID;
	name: "Drafting column RFP response prep";
	agentId: typeof RFP_DRAFTING_AGENT_ID;
	scheduleLabel: "Weekdays at 9:00 AM";
	status: "scheduled";
}

export type AgentsRfpDemoActivityType =
	| "agent-created"
	| "workflow-assigned"
	| "scheduled"
	| "card-assigned"
	| "draft-started";

export interface AgentsRfpDemoActivityItem {
	id: string;
	timestampLabel: string;
	message: string;
	type: AgentsRfpDemoActivityType;
}

export interface AgentsRfpDemoToast {
	id: string;
	message: string;
}

export interface AgentsRfpDemoState {
	version: 1;
	board: {
		columns: AgentsRfpDemoBoardColumnState[];
	};
	workItems: Record<string, AgentsRfpDemoWorkItemState>;
	report: {
		stage: AgentsRfpDemoReportStage;
		currentVersionId?: string;
		previewHtml?: string;
		versions: AgentsRfpDemoReportVersion[];
	};
	agent: AgentsRfpDemoAgent | null;
	schedule: AgentsRfpDemoSchedule | null;
	customAgentActivity: AgentsRfpDemoActivityItem[];
	canvas: {
		open: boolean;
		activeViewId: AgentsRfpDemoCanvasViewId;
		mode: "editable" | "read-only";
	};
	chat: {
		selectedAgentId: "rovo" | typeof RFP_DRAFTING_AGENT_ID;
		lastRfp101AnswerSummary?: string;
	};
	toasts: AgentsRfpDemoToast[];
}

const RFP_101_FIXTURE_ATTACHMENTS: readonly AgentsRfpDemoAttachment[] = [
	{
		id: "fixture-rfp-intake-notes",
		displayName: "RFP intake notes",
		ext: "page",
		source: "fixture",
	},
	{
		id: "fixture-rfp-requirement-compliance-matrix",
		displayName: "Compliance matrix",
		ext: "xlsx",
		source: "fixture",
	},
	{
		id: "fixture-response-brief",
		displayName: "Response brief",
		ext: "docx",
		source: "fixture",
	},
	{
		id: "fixture-enterprise-rfp-requirements",
		displayName: "Enterprise RFP packet",
		ext: "pdf",
		source: "fixture",
	},
	{
		id: "fixture-proposal-audio-briefing",
		displayName: "proposal-audio-briefing.mp3",
		ext: "mp3",
		source: "fixture",
	},
	{
		id: "fixture-supplier-portal-upload",
		displayName: "Supplier portal upload",
		ext: "png",
		source: "fixture",
	},
	{
		id: "fixture-proposal-walkthrough",
		displayName: "Proposal walkthrough",
		ext: "mp4",
		source: "fixture",
	},
];

const GENERATED_REPORT_ATTACHMENTS: readonly AgentsRfpDemoAttachment[] = [
	{
		id: GENERATED_RFP_REPORT_ATTACHMENT_ID,
		displayName: "RFP response strategy.pdf",
		ext: "pdf",
		source: "generated",
		approved: true,
		previewKind: "pdf-preview",
	},
];

const INITIAL_REPORT_VERSION: AgentsRfpDemoReportVersion = {
	id: "initial-generated-report",
	label: "Initial generated report",
	summary: "First offline HTML response package from RFP-101 context.",
	createdBy: "Rovo",
	timestampLabel: "Now",
};

const REFINED_REPORT_VERSION: AgentsRfpDemoReportVersion = {
	id: "refined-current-report",
	label: "Refined current report",
	summary: "Customer-facing summary with stronger legal and data residency review note.",
	createdBy: "Maya",
	timestampLabel: "Now",
};

export const RFP_DRAFTING_AGENT: KanbanBoardAgentData = {
	id: RFP_DRAFTING_AGENT_ID,
	name: "RFP Drafting Agent",
	byline: "Local demo agent by Rovo",
	avatarSrc: "/1p/rovo.svg",
};

function cloneState(state: AgentsRfpDemoState): AgentsRfpDemoState {
	return JSON.parse(JSON.stringify(state)) as AgentsRfpDemoState;
}

function createDefaultBoardState(): AgentsRfpDemoState["board"] {
	return {
		columns: BOARD_COLUMNS.map((column) => ({
			title: column.title,
			cardCodes: column.cards.map((card) => card.code),
		})),
	};
}

function createDefaultWorkItems(): Record<string, AgentsRfpDemoWorkItemState> {
	const workItems: Record<string, AgentsRfpDemoWorkItemState> = {};

	for (const column of BOARD_COLUMNS) {
		for (const card of column.cards) {
			workItems[card.code] = {
				status: column.title,
				attachments: card.code === "RFP-101"
					? RFP_101_FIXTURE_ATTACHMENTS.map((attachment) => ({ ...attachment }))
					: [],
				agentAssignmentIds: [],
			};
		}
	}

	return workItems;
}

export function createDefaultAgentsRfpDemoState(): AgentsRfpDemoState {
	return {
		version: AGENTS_RFP_DEMO_VERSION,
		board: createDefaultBoardState(),
		workItems: createDefaultWorkItems(),
		report: {
			stage: "none",
			versions: [],
		},
		agent: null,
		schedule: null,
		customAgentActivity: [],
		canvas: {
			open: false,
			activeViewId: "report",
			mode: "editable",
		},
		chat: {
			selectedAgentId: "rovo",
		},
		toasts: [],
	};
}

function isObject(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasString(value: unknown): value is string {
	return typeof value === "string" && value.length > 0;
}

function isValidBoard(value: unknown): value is AgentsRfpDemoState["board"] {
	if (!isObject(value) || !Array.isArray(value.columns)) {
		return false;
	}

	return value.columns.every((column) => (
		isObject(column) &&
		hasString(column.title) &&
		Array.isArray(column.cardCodes) &&
		column.cardCodes.every(hasString)
	));
}

function isValidWorkItems(value: unknown): value is AgentsRfpDemoState["workItems"] {
	if (!isObject(value)) {
		return false;
	}

	return Object.values(value).every((workItem) => (
		isObject(workItem) &&
		hasString(workItem.status) &&
		Array.isArray(workItem.attachments) &&
		Array.isArray(workItem.agentAssignmentIds)
	));
}

function isValidReport(value: unknown): value is AgentsRfpDemoState["report"] {
	if (!isObject(value) || !hasString(value.stage) || !Array.isArray(value.versions)) {
		return false;
	}

	return [
		"none",
		"generating",
		"generated",
		"refined",
		"approved",
		"pdf-exported",
		"attached",
	].includes(value.stage);
}

export function isValidAgentsRfpDemoState(value: unknown): value is AgentsRfpDemoState {
	if (!isObject(value) || value.version !== AGENTS_RFP_DEMO_VERSION) {
		return false;
	}

	return (
		isValidBoard(value.board) &&
		isValidWorkItems(value.workItems) &&
		isValidReport(value.report) &&
		(value.agent === null || isObject(value.agent)) &&
		(value.schedule === null || isObject(value.schedule)) &&
		Array.isArray(value.customAgentActivity) &&
		isObject(value.canvas) &&
		isObject(value.chat) &&
		Array.isArray(value.toasts)
	);
}

export function parseAgentsRfpDemoState(rawValue: string | null): AgentsRfpDemoState {
	if (!rawValue) {
		return createDefaultAgentsRfpDemoState();
	}

	try {
		const parsed = JSON.parse(rawValue) as unknown;
		if (isValidAgentsRfpDemoState(parsed)) {
			return parsed;
		}
	} catch {
		return createDefaultAgentsRfpDemoState();
	}

	return createDefaultAgentsRfpDemoState();
}

function appendToast(
	state: AgentsRfpDemoState,
	message: string,
	id: string,
): AgentsRfpDemoState {
	const nextToasts = [
		...state.toasts.filter((toast) => toast.id !== id),
		{ id, message },
	].slice(-3);

	return {
		...state,
		toasts: nextToasts,
	};
}

function clearReportAttachmentToasts(state: AgentsRfpDemoState): AgentsRfpDemoState {
	const reportToastIds = new Set(["report-approved", "report-pdf-exported", "report-attached"]);

	return {
		...state,
		toasts: state.toasts.filter((toast) => !reportToastIds.has(toast.id)),
	};
}

function appendUniqueActivity(
	state: AgentsRfpDemoState,
	item: AgentsRfpDemoActivityItem,
): AgentsRfpDemoState {
	if (state.customAgentActivity.some((activity) => activity.id === item.id)) {
		return state;
	}

	return {
		...state,
		customAgentActivity: [...state.customAgentActivity, item],
	};
}

function updateWorkItem(
	state: AgentsRfpDemoState,
	code: string,
	updater: (workItem: AgentsRfpDemoWorkItemState) => AgentsRfpDemoWorkItemState,
): AgentsRfpDemoState {
	const currentWorkItem = state.workItems[code] ?? {
		status: "RFP Intake",
		attachments: [],
		agentAssignmentIds: [],
	};

	return {
		...state,
		workItems: {
			...state.workItems,
			[code]: updater(currentWorkItem),
		},
	};
}

export function generateRfpReport(state: AgentsRfpDemoState): AgentsRfpDemoState {
	return {
		...state,
		report: {
			stage: "generated",
			currentVersionId: INITIAL_REPORT_VERSION.id,
			versions: [INITIAL_REPORT_VERSION],
		},
		canvas: {
			open: true,
			activeViewId: "report",
			mode: "editable",
		},
	};
}

export function refineRfpReport(state: AgentsRfpDemoState): AgentsRfpDemoState {
	const generatedState = state.report.versions.length > 0
		? state
		: generateRfpReport(state);

	return {
		...generatedState,
		report: {
			stage: "refined",
			currentVersionId: REFINED_REPORT_VERSION.id,
			versions: [
				INITIAL_REPORT_VERSION,
				REFINED_REPORT_VERSION,
			],
		},
		canvas: {
			open: true,
			activeViewId: "report",
			mode: "editable",
		},
	};
}

export function selectRfpReportVersion(
	state: AgentsRfpDemoState,
	versionId: string,
): AgentsRfpDemoState {
	if (!state.report.versions.some((version) => version.id === versionId)) {
		return state;
	}

	return {
		...state,
		report: {
			...state.report,
			currentVersionId: versionId,
		},
	};
}

export function approveRfpReport(state: AgentsRfpDemoState): AgentsRfpDemoState {
	const reportState = state.report.stage === "none"
		? generateRfpReport(state)
		: state;

	return appendToast(
		{
			...reportState,
			report: {
				...reportState.report,
				stage: "approved",
			},
		},
		"HTML report approved for RFP-101.",
		"report-approved",
	);
}

export function exportRfpReportPdf(state: AgentsRfpDemoState): AgentsRfpDemoState {
	const approvedState = state.report.stage === "approved"
		? state
		: approveRfpReport(state);

	return appendToast(
		{
			...approvedState,
			report: {
				...approvedState.report,
				stage: "pdf-exported",
			},
		},
		"Staged PDF export created for browser preview.",
		"report-pdf-exported",
	);
}

export function attachRfpReportToWorkItem(
	state: AgentsRfpDemoState,
	reportPreviewHtml?: string,
): AgentsRfpDemoState {
	const reportState = state.report.stage === "none"
		? generateRfpReport(state)
		: state;
	const exportedState = clearReportAttachmentToasts({
		...reportState,
		report: {
			...reportState.report,
			stage: reportState.report.stage === "attached" ? "attached" : "pdf-exported",
		},
	});
	const attachedState = updateWorkItem(exportedState, "RFP-101", (workItem) => {
		const preservedAttachments = workItem.attachments.filter((attachment) => attachment.source !== "generated");

		return {
			...workItem,
			attachments: [
				...preservedAttachments,
				...GENERATED_REPORT_ATTACHMENTS.map((attachment) => ({ ...attachment })),
			],
		};
	});

	return appendToast(
		{
			...attachedState,
			report: {
				...attachedState.report,
				stage: "attached",
				previewHtml: reportPreviewHtml ?? attachedState.report.previewHtml,
			},
			canvas: {
				...attachedState.canvas,
				open: false,
				activeViewId: "report",
				mode: "read-only",
			},
		},
		"Added PDF to RFP-101.",
		"report-attached",
	);
}

export function createRfpDraftingAgent(state: AgentsRfpDemoState): AgentsRfpDemoState {
	const createdState: AgentsRfpDemoState = {
		...state,
		agent: state.agent ?? {
			id: RFP_DRAFTING_AGENT_ID,
			name: "RFP Drafting Agent",
			selected: true,
			assignedColumn: "Drafting",
			createdAt: "Now",
		},
		chat: {
			...state.chat,
			selectedAgentId: RFP_DRAFTING_AGENT_ID,
		},
	};

	const withCreated = appendUniqueActivity(createdState, {
		id: "activity-agent-created",
		timestampLabel: "Now",
		message: "Rovo created RFP Drafting Agent.",
		type: "agent-created",
	});

	return appendUniqueActivity(withCreated, {
		id: "activity-workflow-assigned",
		timestampLabel: "Now",
		message: "Rovo assigned RFP Drafting Agent to the Drafting workflow.",
		type: "workflow-assigned",
	});
}

export function scheduleRfpDraftingAgent(state: AgentsRfpDemoState): AgentsRfpDemoState {
	const agentState = createRfpDraftingAgent(state);
	const scheduledState: AgentsRfpDemoState = {
		...agentState,
		schedule: agentState.schedule ?? {
			id: RFP_DRAFTING_SCHEDULE_ID,
			name: "Drafting column RFP response prep",
			agentId: RFP_DRAFTING_AGENT_ID,
			scheduleLabel: "Weekdays at 9:00 AM",
			status: "scheduled",
		},
	};

	return appendUniqueActivity(scheduledState, {
		id: "activity-agent-scheduled",
		timestampLabel: "Now",
		message: "Maya scheduled RFP Drafting Agent for weekdays at 9:00 AM.",
		type: "scheduled",
	});
}

function assignRfpDraftingAgentToCard(
	state: AgentsRfpDemoState,
	cardCode: string,
): AgentsRfpDemoState {
	const assignedState = updateWorkItem(state, cardCode, (workItem) => {
		if (workItem.agentAssignmentIds.includes(RFP_DRAFTING_AGENT_ID)) {
			return workItem;
		}

		return {
			...workItem,
			agentAssignmentIds: [...workItem.agentAssignmentIds, RFP_DRAFTING_AGENT_ID],
		};
	});
	const withAssignment = appendUniqueActivity(assignedState, {
		id: `activity-${cardCode.toLowerCase()}-assigned`,
		timestampLabel: "Now",
		message: `RFP Drafting Agent was assigned to ${cardCode}.`,
		type: "card-assigned",
	});
	const withPrep = appendUniqueActivity(withAssignment, {
		id: `activity-${cardCode.toLowerCase()}-draft-started`,
		timestampLabel: "Now",
		message: `RFP Drafting Agent started first-pass response prep for ${cardCode}.`,
		type: "draft-started",
	});

	return appendToast(
		withPrep,
		"RFP Drafting Agent assigned to RFP-102. Preparing first-pass response package.",
		"rfp-102-agent-assigned",
	);
}

export function moveRfpDemoCard(
	state: AgentsRfpDemoState,
	cardCode: string,
	targetColumnTitle: string,
): AgentsRfpDemoState {
	const nextState = cloneState(state);
	const sourceColumn = nextState.board.columns.find((column) => column.cardCodes.includes(cardCode));
	const targetColumn = nextState.board.columns.find((column) => column.title === targetColumnTitle);

	if (!sourceColumn || !targetColumn || sourceColumn.title === targetColumn.title) {
		return state;
	}

	sourceColumn.cardCodes = sourceColumn.cardCodes.filter((code) => code !== cardCode);
	targetColumn.cardCodes = [
		cardCode,
		...targetColumn.cardCodes.filter((code) => code !== cardCode),
	];
	nextState.workItems[cardCode] = {
		...(nextState.workItems[cardCode] ?? {
			attachments: [],
			agentAssignmentIds: [],
			status: targetColumn.title,
		}),
		status: targetColumn.title,
	};

	if (cardCode === "RFP-102" && targetColumn.title === "Drafting" && nextState.agent) {
		return assignRfpDraftingAgentToCard(nextState, cardCode);
	}

	return nextState;
}

export function setRfp101AnswerSummary(
	state: AgentsRfpDemoState,
	answerSummary: string,
): AgentsRfpDemoState {
	return {
		...state,
		chat: {
			...state.chat,
			lastRfp101AnswerSummary: answerSummary,
		},
	};
}

export function setRfpDemoCanvasOpen(
	state: AgentsRfpDemoState,
	open: boolean,
	mode: "editable" | "read-only" = state.canvas.mode,
): AgentsRfpDemoState {
	return {
		...state,
		canvas: {
			...state.canvas,
			open,
			mode,
		},
	};
}

export function setRfpDemoCanvasView(
	state: AgentsRfpDemoState,
	activeViewId: AgentsRfpDemoCanvasViewId,
): AgentsRfpDemoState {
	return {
		...state,
		canvas: {
			...state.canvas,
			activeViewId,
		},
	};
}

export function dismissRfpDemoToast(
	state: AgentsRfpDemoState,
	toastId: string,
): AgentsRfpDemoState {
	return {
		...state,
		toasts: state.toasts.filter((toast) => toast.id !== toastId),
	};
}

export function getGeneratedRfpAttachments(
	state: AgentsRfpDemoState,
	workItemCode: string,
): AgentsRfpDemoAttachment[] {
	return (state.workItems[workItemCode]?.attachments ?? [])
		.filter((attachment) => (
			attachment.source === "generated" &&
			attachment.id === GENERATED_RFP_REPORT_ATTACHMENT_ID
		))
		.map((attachment) => ({ ...attachment }));
}

export function resolveRfpDemoBoardColumns(
	state: AgentsRfpDemoState,
): KanbanBoardColumnData[] {
	const baseCards = new Map(
		BOARD_COLUMNS.flatMap((column) => column.cards.map((card) => [card.code, card])),
	);

	return state.board.columns.map((column) => {
		const cards = column.cardCodes
			.map((cardCode) => {
				const card = baseCards.get(cardCode);
				if (!card) {
					return null;
				}

				const agentAssignmentIds = state.workItems[cardCode]?.agentAssignmentIds ?? [];
				const hasRfpDraftingAgent = agentAssignmentIds.includes(RFP_DRAFTING_AGENT_ID);

				return {
					...card,
					tags: hasRfpDraftingAgent
						? [
								...card.tags,
								{ text: "agent prep", color: "green" as const },
							]
						: card.tags.map((tag) => ({ ...tag })),
				};
			})
			.filter((card): card is KanbanBoardColumnData["cards"][number] => card !== null);

		return {
			title: column.title,
			count: cards.length,
			cards,
		};
	});
}

export function getRfpDemoColumnAgentAssignments(
	state: AgentsRfpDemoState,
): Record<string, string[]> {
	if (!state.agent) {
		return {};
	}

	return {
		[state.agent.assignedColumn]: [state.agent.id],
	};
}

export function getRfpDemoAgents(
	state: AgentsRfpDemoState,
	baseAgents: readonly KanbanBoardAgentData[],
): KanbanBoardAgentData[] {
	if (!state.agent || baseAgents.some((agent) => agent.id === RFP_DRAFTING_AGENT_ID)) {
		return [...baseAgents];
	}

	return [RFP_DRAFTING_AGENT, ...baseAgents];
}

export function formatRfpDemoContext(state: AgentsRfpDemoState): string {
	const rfp101 = state.workItems["RFP-101"];
	const rfp102 = state.workItems["RFP-102"];
	const generatedAttachments = getGeneratedRfpAttachments(state, "RFP-101")
		.map((attachment) => attachment.displayName)
		.join(", ");

	return [
		"[Agents RFP Demo Local State]",
		"Source: browser-local /agents RFP demo state.",
		`Report stage: ${state.report.stage}.`,
		generatedAttachments ? `Generated attachments on RFP-101: ${generatedAttachments}.` : "Generated attachments on RFP-101: none.",
		`RFP-101 status: ${rfp101?.status ?? "unknown"}.`,
		`RFP-102 status: ${rfp102?.status ?? "unknown"}.`,
		state.agent ? "Custom agent: RFP Drafting Agent assigned to Drafting." : "Custom agent: not created.",
		state.schedule ? "Schedule: Weekdays at 9:00 AM for Drafting column RFP response prep." : "Schedule: none.",
		`Selected chat agent: ${state.chat.selectedAgentId === RFP_DRAFTING_AGENT_ID ? "RFP Drafting Agent" : "Rovo"}.`,
		state.chat.lastRfp101AnswerSummary ? `Latest Maya qualification answer: ${state.chat.lastRfp101AnswerSummary}` : null,
		"[End Agents RFP Demo Local State]",
	]
		.filter((line): line is string => typeof line === "string" && line.length > 0)
		.join("\n");
}
