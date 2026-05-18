"use strict";

const fs = require("node:fs/promises");
const path = require("node:path");

const AGENTS2_RFP_DEMO_VERSION = 1;
const AGENTS2_RFP_DEMO_SURFACE = "agents2-omni-live-demo";
const RFP_DRAFTING_AGENT_ID = "voicemate-agent";
const RFP_DRAFTING_AGENT_NAME = "VoiceMate";
const RFP_DRAFTING_AGENT_DESCRIPTION =
	"Drafts landing-page outlines from company brand guide, voice and tone, launch milestones, demo goals, and consent requirements.";
const RFP_DRAFTING_AGENT_CONVERSATION_STARTERS = [
	"Draft the Omni Live landing-page outline.",
	"Summarize missing brand and demo inputs before this moves to Experience Build.",
	"Create reusable hero, CTA, and trust copy from the attached launch brief.",
];
const RFP_DRAFTING_TRIGGER_PROMPT = [
	"When a ticket enters Outline Drafting, inspect the brand guide, voice and tone notes, launch milestones, audience needs, demo goals, and consent requirements.",
	"Draft a landing-page outline, flag missing brand or proof inputs, attach the outline to the ticket, and move ready tickets to Experience Build.",
].join(" ");
const RFP_DRAFTING_AGENT_AVATAR_SRC = "/avatar-agent/dev-agents/feature-flag-cleaner.svg";
const RFP_DRAFTING_BOARD_NAME = "Omni Live Launch";
const RFP_DRAFTING_COLUMN_NAME = "Outline Drafting";
const RFP_REVIEW_COLUMN_NAME = "Experience Build";
const RFP_DRAFTING_EVENT_TRIGGER_LABEL = "On event: ticket enters Outline Drafting";
const AGENTS2_RFP_DEMO_JOB_NAME = `${RFP_DRAFTING_AGENT_NAME} - Omni Live Launch`;
const AGENTS2_RFP_DEMO_JOB_PROMPT = [
	"Process Omni Live tickets when they enter Outline Drafting on the Omni Live Launch board.",
	"Use deterministic demo outputs, create a visible Rovo thread per ticket, attach the HTML landing-page outline, comment with completion status, move successful tickets to Experience Build, and leave them unassigned.",
].join(" ");
const RFP_TICKET_DRAFT_ATTACHMENT_KIND = "html-outline";
const DEMO_RUN_BASE_TIME = Date.parse("2026-06-03T15:00:00.000Z");
const DEMO_ACTIVITY_STEP_MS = 2 * 60_000;
const RFP_DRAFTING_PROCESSING_DELAYS_MS = [15_000, 24_000, 34_000, 19_000, 29_000];

const RFP_DRAFTING_EVENT_TRIGGER = {
	type: "jira-column-entered",
	board: RFP_DRAFTING_BOARD_NAME,
	column: RFP_DRAFTING_COLUMN_NAME,
	label: RFP_DRAFTING_EVENT_TRIGGER_LABEL,
	prompt: RFP_DRAFTING_TRIGGER_PROMPT,
};

const BOARD_SEED = [
	{
		title: "Briefing",
		cardCodes: ["OMNI-101", "OMNI-102", "OMNI-103", "OMNI-104", "OMNI-105", "OMNI-106", "OMNI-107"],
	},
	{
		title: RFP_DRAFTING_COLUMN_NAME,
		cardCodes: ["OMNI-141", "OMNI-142", "OMNI-143"],
	},
	{
		title: RFP_REVIEW_COLUMN_NAME,
		cardCodes: ["OMNI-161", "OMNI-162", "OMNI-163", "OMNI-164"],
	},
	{
		title: "Launch Ready",
		cardCodes: ["OMNI-181", "OMNI-182"],
	},
];

const WORKSTREAM_NAMES_BY_TICKET = {
	"OMNI-101": "Live demo",
	"OMNI-102": "Audience pain",
	"OMNI-103": "Brand voice",
	"OMNI-104": "Proof points",
	"OMNI-105": "Launch timeline",
	"OMNI-106": "Demo assets",
	"OMNI-107": "Consent story",
	"OMNI-141": "VoiceMate",
	"OMNI-142": "Differentiation",
	"OMNI-143": "Proof sections",
	"OMNI-161": "Hero module",
	"OMNI-162": "Interaction states",
	"OMNI-163": "Trust review",
	"OMNI-164": "Executive review",
	"OMNI-181": "Developer Preview",
	"OMNI-182": "Beta and GA archive",
};

const WORK_ITEM_TITLES = {
	"OMNI-141": "VoiceMate: Draft landing-page outline from brand voice",
	"OMNI-142": "Differentiation: Write how Omni Live differs from regular assistants",
	"OMNI-143": "Proof sections: Plan developer and enterprise proof sections",
};

const WORK_ITEM_DESCRIPTIONS = {
	"OMNI-141": "Use VoiceMate to draft the landing-page outline from the brand guide, voice and tone notes, launch milestones, audience pain, demo goals, and consent/trust requirements.",
	"OMNI-142": "Write the section that explains how Omni Live differs from a regular assistant. Focus on continuity: seeing the context, hearing intent, and taking action in one stream rather than asking users to restate the problem across tools.",
	"OMNI-143": "Plan proof sections for developers and enterprise teams. Developers need the troubleshooting and workflow execution story; enterprise teams need consent controls, partner integration readiness, and a credible GA path.",
};

const HUMAN_ASSIGNEES_BY_TICKET = {
	"OMNI-141": "David Hsieh",
	"OMNI-142": "Florence Garcia",
	"OMNI-143": "Jordan Lee",
};

const TICKET_RESPONSE_FOCUS = {
	"OMNI-141": "live-demo-first landing-page outline",
	"OMNI-142": "VoiceMate differentiation and continuity story",
	"OMNI-143": "developer and enterprise proof sections",
};

const OMNI_101_FIXTURE_ATTACHMENTS = [
	{ id: "fixture-omni-live-brand-guide", displayName: "Omni Live brand guide", ext: "page", source: "fixture" },
	{ id: "fixture-omni-live-outline-inputs", displayName: "Landing page outline inputs", ext: "xlsx", source: "fixture" },
	{ id: "fixture-voice-tone-brief", displayName: "Voice and tone brief", ext: "docx", source: "fixture" },
	{ id: "fixture-omni-live-launch-brief", displayName: "Omni Live launch brief", ext: "pdf", source: "fixture" },
];

function cloneJson(value) {
	return JSON.parse(JSON.stringify(value));
}

function isObject(value) {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getNonEmptyString(value) {
	return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function normalizeStringArray(value) {
	return Array.isArray(value) ? value.filter((item) => typeof item === "string" && item.trim().length > 0) : [];
}

function createThreadIdForTicket(ticketCode) {
	return `agents2-omni-live-${ticketCode.toLowerCase()}`;
}

function createRunId() {
	return `omni-run-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function formatDemoTimestamp(index = 0) {
	return new Date(DEMO_RUN_BASE_TIME + index * DEMO_ACTIVITY_STEP_MS).toISOString();
}

function formatDemoTimestampLabel(index = 0) {
	return index === 0 ? "Jun 3, 2026, 10:00 AM" : `Jun 3, 2026, 10:${String(index * 2).padStart(2, "0")} AM`;
}

function createDefaultBoardState() {
	return {
		columns: BOARD_SEED.map((column) => ({
			title: column.title,
			cardCodes: [...column.cardCodes],
		})),
	};
}

function createDefaultWorkItemState(code, status) {
	return {
		status,
		attachments: code === "OMNI-101" ? OMNI_101_FIXTURE_ATTACHMENTS.map((attachment) => ({ ...attachment })) : [],
		agentAssignmentIds: [],
		assignee: null,
		previousAssignee: null,
		agentStatus: "idle",
		agentStartedAt: null,
		agentReadyAt: null,
		agentSessionThreadId: null,
		agentJobRunId: null,
		generatedAttachment: null,
		agentComment: null,
		completedAt: null,
		lastError: null,
	};
}

function createDefaultWorkItems() {
	const workItems = {};
	for (const column of BOARD_SEED) {
		for (const cardCode of column.cardCodes) {
			workItems[cardCode] = createDefaultWorkItemState(cardCode, column.title);
		}
	}
	return workItems;
}

function createDefaultAgents2RfpDemoState() {
	return {
		version: AGENTS2_RFP_DEMO_VERSION,
		board: createDefaultBoardState(),
		workItems: createDefaultWorkItems(),
		report: { stage: "none", versions: [] },
		agent: null,
		schedule: null,
		customAgentActivity: [],
		canvas: { open: false, activeViewId: "report", mode: "editable" },
		chat: { selectedAgentId: "rovo" },
		toasts: [],
	};
}

function normalizeAttachment(rawAttachment) {
	if (!isObject(rawAttachment)) {
		return null;
	}
	const id = getNonEmptyString(rawAttachment.id);
	const displayName = getNonEmptyString(rawAttachment.displayName);
	const ext = getNonEmptyString(rawAttachment.ext);
	const source = rawAttachment.source === "generated" || rawAttachment.source === "fixture" ? rawAttachment.source : null;
	if (!id || !displayName || !ext || !source) {
		return null;
	}
	return {
		id,
		displayName,
		ext,
		source,
		approved: rawAttachment.approved === true,
		previewKind: rawAttachment.previewKind === "html-report" || rawAttachment.previewKind === "pdf-preview" ? rawAttachment.previewKind : undefined,
		kind: getNonEmptyString(rawAttachment.kind),
		previewHtml: getNonEmptyString(rawAttachment.previewHtml),
	};
}

function normalizeAgentComment(rawComment) {
	if (!isObject(rawComment)) {
		return null;
	}
	const id = getNonEmptyString(rawComment.id);
	const content = getNonEmptyString(rawComment.content);
	if (!id || !content) {
		return null;
	}
	return {
		id,
		authorName: getNonEmptyString(rawComment.authorName) ?? RFP_DRAFTING_AGENT_NAME,
		authorAvatarSrc: getNonEmptyString(rawComment.authorAvatarSrc) ?? RFP_DRAFTING_AGENT_AVATAR_SRC,
		timestampLabel: getNonEmptyString(rawComment.timestampLabel) ?? "Jun 3, 2026, 10:00 AM",
		content,
	};
}

function normalizeWorkItemState(rawWorkItem, code, fallbackStatus) {
	const base = createDefaultWorkItemState(code, fallbackStatus);
	if (!isObject(rawWorkItem)) {
		return base;
	}
	const agentStatus = ["idle", "queued", "running", "completed", "failed"].includes(rawWorkItem.agentStatus)
		? rawWorkItem.agentStatus
		: base.agentStatus;
	const attachments = Array.isArray(rawWorkItem.attachments)
		? rawWorkItem.attachments.map(normalizeAttachment).filter(Boolean)
		: base.attachments;
	return {
		...base,
		status: getNonEmptyString(rawWorkItem.status) ?? base.status,
		attachments,
		agentAssignmentIds: normalizeStringArray(rawWorkItem.agentAssignmentIds),
		assignee: getNonEmptyString(rawWorkItem.assignee),
		previousAssignee: getNonEmptyString(rawWorkItem.previousAssignee),
		agentStatus,
		agentStartedAt: getNonEmptyString(rawWorkItem.agentStartedAt),
		agentReadyAt: getNonEmptyString(rawWorkItem.agentReadyAt),
		agentSessionThreadId: getNonEmptyString(rawWorkItem.agentSessionThreadId),
		agentJobRunId: getNonEmptyString(rawWorkItem.agentJobRunId),
		generatedAttachment: normalizeAttachment(rawWorkItem.generatedAttachment),
		agentComment: normalizeAgentComment(rawWorkItem.agentComment),
		completedAt: getNonEmptyString(rawWorkItem.completedAt),
		lastError: getNonEmptyString(rawWorkItem.lastError),
	};
}

function normalizeBoard(rawBoard) {
	const defaultBoard = createDefaultBoardState();
	if (!isObject(rawBoard) || !Array.isArray(rawBoard.columns)) {
		return defaultBoard;
	}
	const columns = rawBoard.columns
		.map((column) => {
			if (!isObject(column)) {
				return null;
			}
			const title = getNonEmptyString(column.title);
			return title ? { title, cardCodes: normalizeStringArray(column.cardCodes) } : null;
		})
		.filter(Boolean);
	return columns.length > 0 ? { columns } : defaultBoard;
}

function createRfpDraftingEventTrigger(prompt = RFP_DRAFTING_TRIGGER_PROMPT) {
	return {
		...RFP_DRAFTING_EVENT_TRIGGER,
		prompt: getNonEmptyString(prompt) ?? RFP_DRAFTING_TRIGGER_PROMPT,
	};
}

function normalizeTrigger(rawTrigger) {
	if (rawTrigger === null) {
		return null;
	}
	if (!isObject(rawTrigger)) {
		return createRfpDraftingEventTrigger();
	}
	return {
		type: getNonEmptyString(rawTrigger.type) ?? RFP_DRAFTING_EVENT_TRIGGER.type,
		board: getNonEmptyString(rawTrigger.board) ?? RFP_DRAFTING_EVENT_TRIGGER.board,
		column: getNonEmptyString(rawTrigger.column) ?? RFP_DRAFTING_EVENT_TRIGGER.column,
		label: getNonEmptyString(rawTrigger.label) ?? RFP_DRAFTING_EVENT_TRIGGER.label,
		prompt: getNonEmptyString(rawTrigger.prompt),
	};
}

function normalizeJobRunSummary(rawRun) {
	if (!isObject(rawRun)) {
		return null;
	}
	const id = getNonEmptyString(rawRun.id);
	if (!id) {
		return null;
	}
	const status = ["completed", "completed-with-failures", "failed", "running", "skipped"].includes(rawRun.status)
		? rawRun.status
		: "completed";
	return {
		id,
		jobId: getNonEmptyString(rawRun.jobId),
		source: getNonEmptyString(rawRun.source) ?? "manual",
		triggerLabel: getNonEmptyString(rawRun.triggerLabel) ?? RFP_DRAFTING_EVENT_TRIGGER_LABEL,
		status,
		startedAt: getNonEmptyString(rawRun.startedAt) ?? formatDemoTimestamp(0),
		finishedAt: getNonEmptyString(rawRun.finishedAt),
		processedTicketCodes: normalizeStringArray(rawRun.processedTicketCodes),
		skippedTicketCodes: normalizeStringArray(rawRun.skippedTicketCodes),
		failedTicketCodes: normalizeStringArray(rawRun.failedTicketCodes),
		threadLinks: Array.isArray(rawRun.threadLinks)
			? rawRun.threadLinks.map((link) => {
					if (!isObject(link)) {
						return null;
					}
					const ticketCode = getNonEmptyString(link.ticketCode);
					const threadId = getNonEmptyString(link.threadId);
					return ticketCode && threadId ? { ticketCode, threadId } : null;
				}).filter(Boolean)
			: [],
		summary: getNonEmptyString(rawRun.summary) ?? "",
	};
}

function normalizeAgent(rawAgent) {
	if (!isObject(rawAgent)) {
		return null;
	}
	return {
		id: RFP_DRAFTING_AGENT_ID,
		name: RFP_DRAFTING_AGENT_NAME,
		description: getNonEmptyString(rawAgent.description) ?? RFP_DRAFTING_AGENT_DESCRIPTION,
		conversationStarters: normalizeStringArray(rawAgent.conversationStarters).length > 0
			? normalizeStringArray(rawAgent.conversationStarters)
			: [...RFP_DRAFTING_AGENT_CONVERSATION_STARTERS],
		selected: rawAgent.selected !== false,
		assignedColumn: RFP_DRAFTING_COLUMN_NAME,
		createdAt: getNonEmptyString(rawAgent.createdAt) ?? "Jun 3, 2026, 10:00 AM",
		avatarSrc: getNonEmptyString(rawAgent.avatarSrc) ?? RFP_DRAFTING_AGENT_AVATAR_SRC,
		jobId: getNonEmptyString(rawAgent.jobId),
		trigger: normalizeTrigger(rawAgent.trigger),
		jobRunSummaries: Array.isArray(rawAgent.jobRunSummaries)
			? rawAgent.jobRunSummaries.map(normalizeJobRunSummary).filter(Boolean)
			: [],
	};
}

function normalizeAgents2RfpDemoState(rawState) {
	const defaultState = createDefaultAgents2RfpDemoState();
	if (!isObject(rawState) || rawState.version !== AGENTS2_RFP_DEMO_VERSION) {
		return defaultState;
	}
	const board = normalizeBoard(rawState.board);
	const defaultStatuses = new Map(board.columns.flatMap((column) => column.cardCodes.map((code) => [code, column.title])));
	const workItems = {};
	for (const code of new Set([...Object.keys(defaultState.workItems), ...defaultStatuses.keys(), ...Object.keys(isObject(rawState.workItems) ? rawState.workItems : {})])) {
		workItems[code] = normalizeWorkItemState(
			isObject(rawState.workItems) ? rawState.workItems[code] : null,
			code,
			defaultStatuses.get(code) ?? defaultState.workItems[code]?.status ?? "Briefing",
		);
	}
	return {
		...defaultState,
		board,
		workItems,
		report: isObject(rawState.report)
			? {
					...defaultState.report,
					...rawState.report,
					stage: getNonEmptyString(rawState.report.stage) ?? defaultState.report.stage,
					versions: Array.isArray(rawState.report.versions) ? rawState.report.versions : [],
				}
			: defaultState.report,
		agent: normalizeAgent(rawState.agent),
		schedule: null,
		customAgentActivity: Array.isArray(rawState.customAgentActivity) ? rawState.customAgentActivity : [],
		canvas: isObject(rawState.canvas) ? { ...defaultState.canvas, ...rawState.canvas } : defaultState.canvas,
		chat: isObject(rawState.chat) ? { ...defaultState.chat, ...rawState.chat } : defaultState.chat,
		toasts: Array.isArray(rawState.toasts) ? rawState.toasts : [],
	};
}

function appendUniqueActivity(state, item) {
	if (state.customAgentActivity.some((activity) => activity.id === item.id)) {
		return state;
	}
	return {
		...state,
		customAgentActivity: [...state.customAgentActivity, item],
	};
}

function appendToast(state, message, id) {
	return {
		...state,
		toasts: [...state.toasts.filter((toast) => toast.id !== id), { id, message }].slice(-3),
	};
}

function ensureRfpDraftingAgent(state, { jobId, createdAtLabel = "Jun 3, 2026, 10:00 AM" } = {}) {
	const agent = normalizeAgent({
		...(state.agent ?? {}),
		id: RFP_DRAFTING_AGENT_ID,
		name: RFP_DRAFTING_AGENT_NAME,
		selected: true,
		assignedColumn: RFP_DRAFTING_COLUMN_NAME,
		createdAt: state.agent?.createdAt ?? createdAtLabel,
		avatarSrc: state.agent?.avatarSrc ?? RFP_DRAFTING_AGENT_AVATAR_SRC,
		jobId: jobId ?? state.agent?.jobId,
		trigger: createRfpDraftingEventTrigger(state.agent?.trigger?.prompt),
		jobRunSummaries: state.agent?.jobRunSummaries ?? [],
	});
	const nextState = {
		...state,
		agent,
		schedule: null,
		chat: {
			...state.chat,
			selectedAgentId: RFP_DRAFTING_AGENT_ID,
		},
	};
	return appendUniqueActivity(appendUniqueActivity(nextState, {
		id: "activity-agent-created",
		timestampLabel: createdAtLabel,
		message: `Rovo created ${RFP_DRAFTING_AGENT_NAME}.`,
		type: "agent-created",
	}), {
		id: "activity-workflow-assigned",
		timestampLabel: createdAtLabel,
		message: `Rovo assigned ${RFP_DRAFTING_AGENT_NAME} to the Outline Drafting column event.`,
		type: "workflow-assigned",
	});
}

function findColumnForTicket(state, ticketCode) {
	return state.board.columns.find((column) => column.cardCodes.includes(ticketCode)) ?? null;
}

function moveTicketToColumn(state, ticketCode, targetColumnTitle, { append = false } = {}) {
	const targetColumn = state.board.columns.find((column) => column.title === targetColumnTitle);
	if (!targetColumn) {
		return state;
	}
	const columns = state.board.columns.map((column) => {
		const filteredCodes = column.cardCodes.filter((code) => code !== ticketCode);
		if (column.title !== targetColumnTitle) {
			return { ...column, cardCodes: filteredCodes };
		}
		return {
			...column,
			cardCodes: append ? [...filteredCodes, ticketCode] : [ticketCode, ...filteredCodes],
		};
	});
	return {
		...state,
		board: { columns },
		workItems: {
			...state.workItems,
			[ticketCode]: {
				...(state.workItems[ticketCode] ?? createDefaultWorkItemState(ticketCode, targetColumnTitle)),
				status: targetColumnTitle,
			},
		},
	};
}

function isCompletedByAgent(workItem) {
	return workItem?.agentStatus === "completed" && Boolean(workItem.generatedAttachment) && Boolean(workItem.agentComment);
}

function getCurrentDraftingTicketCodes(state) {
	return state.board.columns.find((column) => column.title === RFP_DRAFTING_COLUMN_NAME)?.cardCodes ?? [];
}

function getHumanAssigneeForTicket(ticketCode) {
	return HUMAN_ASSIGNEES_BY_TICKET[ticketCode] ?? "Maya Chen";
}

function getWorkstreamNameForTicket(ticketCode) {
	return WORKSTREAM_NAMES_BY_TICKET[ticketCode] ?? ticketCode;
}

function getProcessingDelayMs(index) {
	return RFP_DRAFTING_PROCESSING_DELAYS_MS[index % RFP_DRAFTING_PROCESSING_DELAYS_MS.length];
}

function getRunTimelineTimestampMs(runSummary) {
	const finishedAtMs = Date.parse(runSummary?.finishedAt);
	if (Number.isFinite(finishedAtMs)) {
		return finishedAtMs;
	}
	const startedAtMs = Date.parse(runSummary?.startedAt);
	return Number.isFinite(startedAtMs) ? startedAtMs : null;
}

function getNextRunTimelineTimestamp(state) {
	const timestamps = (state.agent?.jobRunSummaries ?? []).map(getRunTimelineTimestampMs).filter((timestamp) => Number.isFinite(timestamp));
	return timestamps.length === 0 ? formatDemoTimestamp(0) : new Date(Math.max(...timestamps) + DEMO_ACTIVITY_STEP_MS).toISOString();
}

function getRunCompletionTimestamp(runSummary) {
	const startedAtMs = Date.parse(runSummary?.startedAt);
	return Number.isFinite(startedAtMs)
		? new Date(startedAtMs + (runSummary.processedTicketCodes.length + 1) * DEMO_ACTIVITY_STEP_MS).toISOString()
		: runSummary?.finishedAt ?? formatDemoTimestamp(runSummary?.processedTicketCodes?.length ?? 0);
}

function getTicketCompletionTimestamp(state, ticketCode, workItem, fallbackIndex) {
	const runSummary = state.agent?.jobRunSummaries?.find((run) => run.id === workItem.agentJobRunId);
	if (!runSummary) {
		return formatDemoTimestamp(fallbackIndex + 1);
	}
	const processedIndex = runSummary.processedTicketCodes.indexOf(ticketCode);
	const completionIndex = processedIndex >= 0 ? processedIndex + 1 : fallbackIndex + 1;
	const startedAtMs = Date.parse(runSummary.startedAt);
	return Number.isFinite(startedAtMs) ? new Date(startedAtMs + completionIndex * DEMO_ACTIVITY_STEP_MS).toISOString() : formatDemoTimestamp(completionIndex);
}

function createGeneratedAttachment(ticketCode, previewHtml) {
	return {
		id: `generated-${ticketCode.toLowerCase()}-outline-html`,
		displayName: `${ticketCode} landing-page outline.html`,
		ext: "html",
		source: "generated",
		approved: true,
		previewKind: "html-report",
		kind: RFP_TICKET_DRAFT_ATTACHMENT_KIND,
		previewHtml: getNonEmptyString(previewHtml),
	};
}

function createAgentComment(ticketCode, ticketTitle, index) {
	const focus = TICKET_RESPONSE_FOCUS[ticketCode] ?? "landing-page outline";
	return {
		id: `agent-comment-${ticketCode.toLowerCase()}-outline-ready`,
		authorName: RFP_DRAFTING_AGENT_NAME,
		authorAvatarSrc: RFP_DRAFTING_AGENT_AVATAR_SRC,
		timestampLabel: formatDemoTimestampLabel(index),
		content: `${RFP_DRAFTING_AGENT_NAME} finished the HTML landing-page outline for ${ticketCode} (${ticketTitle}). Status: draft complete. I focused on ${focus}, attached the vpk-html artifact, moved the ticket to Experience Build, and left it unassigned for the experience team to pick up.`,
	};
}

function buildActiveJiraWorkItemContextForTicket(ticketCode, status = RFP_DRAFTING_COLUMN_NAME) {
	const ticketTitle = WORK_ITEM_TITLES[ticketCode] ?? ticketCode;
	const assignee = getHumanAssigneeForTicket(ticketCode);
	const workstreamName = getWorkstreamNameForTicket(ticketCode);
	const description = WORK_ITEM_DESCRIPTIONS[ticketCode] ?? `Prepare a first-pass Omni Live landing-page outline for ${ticketCode}.`;
	const focus = TICKET_RESPONSE_FOCUS[ticketCode] ?? "landing-page outline";
	return [
		"[Active Jira Work Item Context]",
		"Source: /agents2 Jira work item.",
		`Key: ${ticketCode}`,
		`Title: ${ticketTitle}`,
		`Status: ${status}`,
		"Priority: High",
		`Assignee: ${assignee} (Experience owner)`,
		"Reporter: Maya Chen (Launch lead)",
		"Parent: OMNI-100 - Omni Live Launch",
		`Workstream: ${workstreamName}`,
		"Launch stage: landing-page outline and experience build",
		`Description: ${description}`,
		"Buyer priorities:",
		"- Lead with the live demo rather than abstract AI positioning.",
		"- Show voice, vision, and action continuity in one flow.",
		"- Keep enterprise consent and trust visible before CTA.",
		"Next actions:",
		`- Draft ${focus} for the Omni Live handoff.`,
		"- Attach the generated HTML outline for experience build.",
		"- Move the ticket to Experience Build and leave it unassigned for a builder to pick up.",
		"[End Active Jira Work Item Context]",
	].join("\n");
}

function buildTicketSpecificReportFields(ticketCode) {
	const ticketTitle = WORK_ITEM_TITLES[ticketCode] ?? ticketCode;
	const focus = TICKET_RESPONSE_FOCUS[ticketCode] ?? "landing-page outline";
	return {
		summary: `${ticketCode} Omni Live outline for ${focus}.`,
		whatChangedText: `${RFP_DRAFTING_AGENT_NAME} converted ${ticketTitle} into a reviewable Omni Live HTML outline focused on ${focus}.`,
		confidenceText: "Medium confidence: the work item has enough context for a first-pass landing page outline, while final proof, launch, and consent language still need human review.",
		progressText: "A vpk-html outline artifact has been prepared for the experience team with hero, proof, trust, and CTA guidance.",
		blockersText: "Final approval still depends on human validation of product claims, partner readiness, and enterprise consent language.",
		nextWindowText: "The experience team should pick up the unassigned Experience Build ticket, inspect the attached HTML outline, and turn it into the landing-page module.",
		milestonesText: "Outline Drafting is complete for agent handoff; Experience Build is the next workflow milestone.",
		informationGaps: [
			"Final approved launch date and preview audience are not recorded in the work item context.",
			"Omni Live proof points still need human verification before publishing.",
		],
	};
}

function buildFallbackHtmlReport(ticketCode) {
	const title = `${ticketCode} landing-page outline`;
	const focus = TICKET_RESPONSE_FOCUS[ticketCode] ?? "landing-page outline";
	return [
		"<!doctype html>",
		'<html lang="en">',
		"<head>",
		'\t<meta charset="utf-8">',
		'\t<meta name="generator" content="vpk-html">',
		`\t<title>${title}</title>`,
		"</head>",
		"<body>",
		`\t<h1>${title}</h1>`,
		`\t<p>Deterministic vpk-html outline for Omni Live, focused on ${focus}.</p>`,
		"</body>",
		"</html>",
	].join("\n");
}

function buildThreadMessagesForTicket({ attachmentName, focus, runId, status = "completed", ticketCode, ticketTitle, timestamp }) {
	const resultText = status === "running"
		? [
				`Started deterministic Omni Live outline drafting for ${ticketCode}.`,
				`Focus: ${focus}.`,
				"Status: VoiceMate is reading the work item and preparing a vpk-html outline artifact.",
			].join("\n")
		: [
				`Prepared deterministic Omni Live outline output for ${ticketCode}.`,
				`Attachment: ${attachmentName}.`,
				`Focus: ${focus}.`,
				"Summary: mapped the ticket to live-demo-first narrative, differentiated capability, proof, trust, and CTA sections.",
				"Next step: review the generated HTML outline before experience build.",
			].join("\n");
	return [
		{
			id: `${ticketCode.toLowerCase()}-outline-request`,
			role: "user",
			parts: [{ type: "text", text: `Event received: ${ticketCode} entered Outline Drafting on the ${RFP_DRAFTING_BOARD_NAME} board. Draft the landing-page outline for "${ticketTitle}".` }],
			metadata: { source: AGENTS2_RFP_DEMO_SURFACE, runId },
			createdAt: timestamp,
		},
		{
			id: status === "running" ? `${ticketCode.toLowerCase()}-outline-started` : `${ticketCode.toLowerCase()}-outline-result`,
			role: "assistant",
			parts: [{ type: "text", text: resultText }],
			metadata: { source: AGENTS2_RFP_DEMO_SURFACE, runId },
			createdAt: timestamp,
		},
	];
}

function buildThreadForTicket({ attachmentName, status = "completed", ticketCode, runId, timestamp }) {
	const ticketTitle = WORK_ITEM_TITLES[ticketCode] ?? ticketCode;
	const threadId = createThreadIdForTicket(ticketCode);
	const focus = TICKET_RESPONSE_FOCUS[ticketCode] ?? "landing-page outline";
	return {
		id: threadId,
		title: `${ticketCode} Omni Live outline`,
		messages: buildThreadMessagesForTicket({
			attachmentName: attachmentName ?? `${ticketCode} landing-page outline.html`,
			focus,
			status,
			ticketCode,
			ticketTitle,
			runId,
			timestamp,
		}),
		realtimeMessages: [],
		visibility: "private",
		modelId: null,
		provider: "agents2-omni-live-demo",
		createdAt: timestamp,
		updatedAt: timestamp,
	};
}

function buildRunSummary({ failedTicketCodes, finishedAt, jobId, processedTicketCodes, runId, skippedTicketCodes, source, startedAt, status: statusOverride, threadLinks }) {
	const status = statusOverride ?? (failedTicketCodes.length > 0
		? processedTicketCodes.length > 0 ? "completed-with-failures" : "failed"
		: processedTicketCodes.length > 0 ? "completed" : "skipped");
	const action = status === "running" ? "Queued" : "Processed";
	return {
		id: runId,
		jobId,
		source,
		triggerLabel: RFP_DRAFTING_EVENT_TRIGGER_LABEL,
		status,
		startedAt,
		finishedAt,
		processedTicketCodes,
		skippedTicketCodes,
		failedTicketCodes,
		threadLinks,
		summary: `${action} ${processedTicketCodes.length} ticket${processedTicketCodes.length === 1 ? "" : "s"}, skipped ${skippedTicketCodes.length}, failed ${failedTicketCodes.length}.`,
	};
}

function runRfpDraftingAgent(state, {
	jobId = state.agent?.jobId ?? null,
	now = Date.now(),
	runId = createRunId(),
	source = "manual",
	ticketCodes,
} = {}) {
	let nextState = ensureRfpDraftingAgent(state, { jobId });
	const startedAtIso = new Date(now).toISOString();
	const requestedTicketCodes = Array.isArray(ticketCodes) && ticketCodes.length > 0 ? ticketCodes : getCurrentDraftingTicketCodes(nextState);
	const completedTicketCodes = Object.entries(nextState.workItems)
		.filter(([, workItem]) => isCompletedByAgent(workItem))
		.map(([ticketCode]) => ticketCode);
	const ticketCodesToEvaluate = Array.from(new Set(Array.isArray(ticketCodes) && ticketCodes.length > 0 ? requestedTicketCodes : [...requestedTicketCodes, ...completedTicketCodes]));
	const processedTicketCodes = [];
	const skippedTicketCodes = [];
	const failedTicketCodes = [];
	const threadLinks = [];
	const threadRecords = [];
	const startedAt = getNextRunTimelineTimestamp(nextState);

	for (const [index, ticketCode] of ticketCodesToEvaluate.entries()) {
		const currentWorkItem = nextState.workItems[ticketCode] ?? createDefaultWorkItemState(ticketCode, findColumnForTicket(nextState, ticketCode)?.title ?? RFP_DRAFTING_COLUMN_NAME);
		const isRequested = requestedTicketCodes.includes(ticketCode);
		if (isCompletedByAgent(currentWorkItem) || currentWorkItem.agentStatus === "running" || currentWorkItem.agentStatus === "queued") {
			skippedTicketCodes.push(ticketCode);
			continue;
		}
		if (!isRequested || currentWorkItem.status !== RFP_DRAFTING_COLUMN_NAME) {
			continue;
		}
		const threadId = currentWorkItem.agentSessionThreadId ?? createThreadIdForTicket(ticketCode);
		nextState = {
			...nextState,
			workItems: {
				...nextState.workItems,
				[ticketCode]: {
					...currentWorkItem,
					previousAssignee: currentWorkItem.previousAssignee ?? currentWorkItem.assignee ?? getHumanAssigneeForTicket(ticketCode),
					assignee: RFP_DRAFTING_AGENT_NAME,
					agentAssignmentIds: Array.from(new Set([...currentWorkItem.agentAssignmentIds, RFP_DRAFTING_AGENT_ID])),
					agentStatus: index === 0 ? "running" : "queued",
					agentStartedAt: currentWorkItem.agentStartedAt ?? startedAtIso,
					agentReadyAt: new Date(now + getProcessingDelayMs(index)).toISOString(),
					agentSessionThreadId: threadId,
					agentJobRunId: runId,
					lastError: null,
				},
			},
		};
		processedTicketCodes.push(ticketCode);
		threadLinks.push({ ticketCode, threadId });
		threadRecords.push({ ...buildThreadForTicket({ status: "running", ticketCode, runId, timestamp: startedAtIso }), id: threadId });
	}

	const hasRunningTickets = processedTicketCodes.some((ticketCode) => (
		nextState.workItems[ticketCode]?.agentStatus === "running" || nextState.workItems[ticketCode]?.agentStatus === "queued"
	));
	const runSummary = buildRunSummary({
		failedTicketCodes,
		finishedAt: hasRunningTickets ? null : formatDemoTimestamp(ticketCodesToEvaluate.length + 1),
		jobId,
		processedTicketCodes,
		runId,
		skippedTicketCodes,
		source,
		startedAt,
		status: hasRunningTickets ? "running" : undefined,
		threadLinks,
	});
	nextState = {
		...nextState,
		agent: normalizeAgent({
			...nextState.agent,
			jobId,
			jobRunSummaries: [runSummary, ...(nextState.agent?.jobRunSummaries ?? [])].slice(0, 10),
		}),
	};
	if (runSummary.status !== "skipped") {
		nextState = appendToast(nextState, `${RFP_DRAFTING_AGENT_NAME} queued ${processedTicketCodes.length} Outline Drafting ticket${processedTicketCodes.length === 1 ? "" : "s"}.`, `omni-agent-run-${runId}`);
	}
	return { state: nextState, runSummary, threadRecords };
}

function getDueAgentWorkItems(state, now) {
	const nowMs = typeof now === "number" ? now : Date.parse(now);
	if (!Number.isFinite(nowMs)) {
		return [];
	}
	return Object.entries(state.workItems ?? {})
		.filter(([, workItem]) => (
			(workItem?.agentStatus === "running" || workItem?.agentStatus === "queued") &&
			getNonEmptyString(workItem.agentReadyAt) &&
			Date.parse(workItem.agentReadyAt) <= nowMs &&
			workItem.status === RFP_DRAFTING_COLUMN_NAME
		))
		.map(([ticketCode, workItem]) => ({ ticketCode, workItem }));
}

function refreshRunSummaries(state) {
	if (!state.agent?.jobRunSummaries?.length) {
		return state;
	}
	let changed = false;
	const jobRunSummaries = state.agent.jobRunSummaries.map((runSummary) => {
		if (runSummary.status !== "running" || runSummary.processedTicketCodes.length === 0) {
			return runSummary;
		}
		const processedWorkItems = runSummary.processedTicketCodes.map((ticketCode) => state.workItems[ticketCode]).filter(Boolean);
		const allSettled = processedWorkItems.length > 0 && processedWorkItems.every((workItem) => workItem.agentStatus === "completed" || workItem.agentStatus === "failed");
		if (!allSettled) {
			return runSummary;
		}
		changed = true;
		const failedTicketCodes = runSummary.processedTicketCodes.filter((ticketCode) => state.workItems[ticketCode]?.agentStatus === "failed");
		return {
			...runSummary,
			status: failedTicketCodes.length > 0 ? "completed-with-failures" : "completed",
			failedTicketCodes,
			finishedAt: getRunCompletionTimestamp(runSummary),
			summary: `Processed ${runSummary.processedTicketCodes.length} ticket${runSummary.processedTicketCodes.length === 1 ? "" : "s"}, skipped ${runSummary.skippedTicketCodes.length}, failed ${failedTicketCodes.length}.`,
		};
	});
	return changed ? { ...state, agent: normalizeAgent({ ...state.agent, jobRunSummaries }) } : state;
}

async function advanceRfpDraftingAgentProcessing(state, { createHtmlReport, now = Date.now() } = {}) {
	let nextState = normalizeAgents2RfpDemoState(state);
	const dueItems = getDueAgentWorkItems(nextState, now);
	const completedTicketCodes = [];
	const failedTicketCodes = [];
	const threadRecords = [];
	for (const [index, { ticketCode, workItem }] of dueItems.entries()) {
		const ticketTitle = WORK_ITEM_TITLES[ticketCode] ?? ticketCode;
		const threadId = workItem.agentSessionThreadId ?? createThreadIdForTicket(ticketCode);
		const completedAt = getTicketCompletionTimestamp(nextState, ticketCode, workItem, index);
		try {
			const report = typeof createHtmlReport === "function"
				? await createHtmlReport({
						contextDescription: buildActiveJiraWorkItemContextForTicket(ticketCode, workItem.status),
						fields: buildTicketSpecificReportFields(ticketCode),
						ticketCode,
						ticketTitle,
					})
				: { html: buildFallbackHtmlReport(ticketCode) };
			const generatedAttachment = createGeneratedAttachment(ticketCode, report?.html);
			const agentComment = createAgentComment(ticketCode, ticketTitle, index + 1);
			const preservedAttachments = workItem.attachments.filter((attachment) => attachment.source !== "generated" || attachment.kind !== RFP_TICKET_DRAFT_ATTACHMENT_KIND);
			nextState = {
				...moveTicketToColumn(nextState, ticketCode, RFP_REVIEW_COLUMN_NAME, { append: true }),
				workItems: {
					...nextState.workItems,
					[ticketCode]: {
						...workItem,
						status: RFP_REVIEW_COLUMN_NAME,
						attachments: [...preservedAttachments, generatedAttachment],
						assignee: null,
						agentStatus: "completed",
						agentReadyAt: null,
						agentSessionThreadId: threadId,
						generatedAttachment,
						agentComment,
						completedAt,
						lastError: null,
					},
				},
			};
			completedTicketCodes.push(ticketCode);
			threadRecords.push({
				...buildThreadForTicket({
					attachmentName: generatedAttachment.displayName,
					ticketCode,
					runId: workItem.agentJobRunId,
					timestamp: completedAt,
				}),
				id: threadId,
			});
		} catch (error) {
			nextState = {
				...nextState,
				workItems: {
					...nextState.workItems,
					[ticketCode]: {
						...workItem,
						agentStatus: "failed",
						agentReadyAt: null,
						lastError: error instanceof Error ? error.message : String(error),
					},
				},
			};
			failedTicketCodes.push(ticketCode);
		}
	}
	const withSummaries = refreshRunSummaries(nextState);
	return {
		changed: dueItems.length > 0 || withSummaries !== nextState,
		completedTicketCodes,
		failedTicketCodes,
		state: withSummaries,
		threadRecords,
	};
}

function moveTicketEnteredColumn(state, { jobId = state.agent?.jobId ?? null, runId, source = "jira-column-entered", targetColumn, ticketCode } = {}) {
	const normalizedTicketCode = getNonEmptyString(ticketCode);
	const normalizedTargetColumn = getNonEmptyString(targetColumn);
	if (!normalizedTicketCode || !normalizedTargetColumn) {
		const error = new Error("ticketCode and targetColumn are required.");
		error.code = "INVALID_INPUT";
		throw error;
	}
	const nextState = moveTicketToColumn(state, normalizedTicketCode, normalizedTargetColumn);
	if (normalizedTargetColumn !== RFP_DRAFTING_COLUMN_NAME || !nextState.agent?.trigger) {
		return { state: nextState, runSummary: null, threadRecords: [] };
	}
	return runRfpDraftingAgent(nextState, {
		jobId,
		runId,
		source,
		ticketCodes: [normalizedTicketCode],
	});
}

function getDemoCreatedThreadIds(state) {
	const threadIds = new Set();
	for (const [ticketCode, workItem] of Object.entries(state.workItems ?? {})) {
		const threadId = getNonEmptyString(workItem?.agentSessionThreadId);
		if (threadId) {
			threadIds.add(threadId);
		}
		if (ticketCode.startsWith("OMNI-")) {
			threadIds.add(createThreadIdForTicket(ticketCode));
		}
	}
	return [...threadIds];
}

function createAgents2RfpDemoStateManager({ baseDir }) {
	const filePath = path.join(baseDir, "agents2-rfp-demo", "state.json");
	async function readState() {
		try {
			const rawText = await fs.readFile(filePath, "utf8");
			return normalizeAgents2RfpDemoState(JSON.parse(rawText));
		} catch (error) {
			if (error?.code === "ENOENT") {
				return createDefaultAgents2RfpDemoState();
			}
			throw error;
		}
	}
	async function writeState(state) {
		const normalizedState = normalizeAgents2RfpDemoState(state);
		await fs.mkdir(path.dirname(filePath), { recursive: true });
		await fs.writeFile(filePath, `${JSON.stringify(normalizedState, null, 2)}\n`, "utf8");
		return cloneJson(normalizedState);
	}
	async function resetState() {
		return writeState(createDefaultAgents2RfpDemoState());
	}
	return { filePath, readState, resetState, writeState };
}

module.exports = {
	AGENTS2_RFP_DEMO_JOB_NAME,
	AGENTS2_RFP_DEMO_JOB_PROMPT,
	AGENTS2_RFP_DEMO_SURFACE,
	RFP_DRAFTING_AGENT_NAME,
	RFP_DRAFTING_EVENT_TRIGGER,
	RFP_DRAFTING_EVENT_TRIGGER_LABEL,
	RFP_DRAFTING_COLUMN_NAME,
	advanceRfpDraftingAgentProcessing,
	createAgents2RfpDemoStateManager,
	createDefaultAgents2RfpDemoState,
	getDemoCreatedThreadIds,
	moveTicketEnteredColumn,
	moveTicketToColumn,
	normalizeAgents2RfpDemoState,
	runRfpDraftingAgent,
};
