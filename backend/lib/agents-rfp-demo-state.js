"use strict";

const fs = require("node:fs/promises");
const path = require("node:path");

const AGENTS_RFP_DEMO_VERSION = 1;
const RFP_DRAFTING_AGENT_ID = "rfp-drafting-agent";
const RFP_DRAFTING_AGENT_NAME = "RFP Drafting Agent";
const RFP_DRAFTING_AGENT_AVATAR_SRC = "/avatar-agent/dev-agents/feature-flag-cleaner.svg";
const RFP_DRAFTING_BOARD_NAME = "Enterprise RFP Response";
const RFP_DRAFTING_COLUMN_NAME = "Drafting";
const RFP_REVIEW_COLUMN_NAME = "Review";
const RFP_DRAFTING_EVENT_TRIGGER_LABEL = "On event: ticket enters Drafting";
const AGENTS_RFP_DEMO_SURFACE = "agents-rfp-demo";
const AGENTS_RFP_DEMO_JOB_NAME = "RFP Drafting Agent - Enterprise RFP Response";
const AGENTS_RFP_DEMO_JOB_PROMPT = [
	"Process RFP tickets when they enter Drafting on the Enterprise RFP Response board.",
	"Use deterministic demo outputs, create a visible Rovo thread per ticket, attach the response draft, comment, and move successful tickets to Review.",
].join(" ");
const GENERATED_RFP_REPORT_ATTACHMENT_ID = "generated-rfp-response-strategy-pdf";
const RFP_TICKET_DRAFT_ATTACHMENT_KIND = "rfp-draft-pdf";
const DEMO_RUN_BASE_TIME = Date.parse("2025-09-03T15:00:00.000Z");

const RFP_DRAFTING_EVENT_TRIGGER = {
	type: "jira-column-entered",
	board: RFP_DRAFTING_BOARD_NAME,
	column: RFP_DRAFTING_COLUMN_NAME,
	label: RFP_DRAFTING_EVENT_TRIGGER_LABEL,
};

const BOARD_SEED = [
	{
		title: "RFP Intake",
		cardCodes: ["RFP-101", "RFP-102", "RFP-103", "RFP-104", "RFP-105", "RFP-106", "RFP-107"],
	},
	{
		title: RFP_DRAFTING_COLUMN_NAME,
		cardCodes: ["RFP-141", "RFP-142", "RFP-143"],
	},
	{
		title: RFP_REVIEW_COLUMN_NAME,
		cardCodes: ["RFP-161", "RFP-162", "RFP-163", "RFP-164"],
	},
	{
		title: "Submitted",
		cardCodes: ["RFP-181", "RFP-182"],
	},
];

const WORK_ITEM_TITLES = {
	"RFP-101": "Qualify enterprise service-management RFP",
	"RFP-102": "Parse supplier questionnaire and requested files",
	"RFP-103": "Build DACI and response-owner matrix",
	"RFP-104": "Inventory ITSM, asset, portal, and reporting requirements",
	"RFP-105": "Confirm bid/no-bid risks and mandatory gaps",
	"RFP-106": "Create RFP timeline with checkpoints and demos",
	"RFP-107": "Collect customer context, current tools, and success metrics",
	"RFP-141": "Draft Atlassian System of Work executive narrative",
	"RFP-142": "Write JSM service desk, portal, and knowledge answers",
	"RFP-143": "Prepare pricing, implementation, and TCO response",
	"RFP-161": "Review Assets, CMDB, HAM, and SAM positioning",
	"RFP-162": "Legal review for data residency, DPA, and terms",
	"RFP-163": "Security review for Guard, audit, GRC, and vulnerabilities",
	"RFP-164": "Executive review of win themes and final pitch",
	"RFP-181": "Submit supplier clarification responses",
	"RFP-182": "Archive final response, exhibits, and demo deck",
};

const RFP_101_FIXTURE_ATTACHMENTS = [
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

function cloneJson(value) {
	return JSON.parse(JSON.stringify(value));
}

function isObject(value) {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getNonEmptyString(value) {
	return typeof value === "string" && value.trim().length > 0
		? value.trim()
		: null;
}

function normalizeStringArray(value) {
	return Array.isArray(value)
		? value.filter((item) => typeof item === "string" && item.trim().length > 0)
		: [];
}

function createThreadIdForTicket(ticketCode) {
	return `agents-rfp-demo-${ticketCode.toLowerCase()}`;
}

function createRunId() {
	return `rfp-run-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function formatDemoTimestamp(index = 0) {
	return new Date(DEMO_RUN_BASE_TIME + index * 2 * 60_000).toISOString();
}

function formatDemoTimestampLabel(index = 0) {
	return index === 0 ? "Sep 3, 2025, 10:00 AM" : `Sep 3, 2025, 10:${String(index * 2).padStart(2, "0")} AM`;
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
		attachments: code === "RFP-101" ? RFP_101_FIXTURE_ATTACHMENTS.map((attachment) => ({ ...attachment })) : [],
		agentAssignmentIds: [],
		assignee: null,
		previousAssignee: null,
		agentStatus: "idle",
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

function createDefaultAgentsRfpDemoState() {
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

function normalizeAttachment(rawAttachment) {
	if (!isObject(rawAttachment)) {
		return null;
	}

	const id = getNonEmptyString(rawAttachment.id);
	const displayName = getNonEmptyString(rawAttachment.displayName);
	const ext = getNonEmptyString(rawAttachment.ext);
	const source = rawAttachment.source === "generated" || rawAttachment.source === "fixture"
		? rawAttachment.source
		: null;
	if (!id || !displayName || !ext || !source) {
		return null;
	}

	return {
		id,
		displayName,
		ext,
		source,
		approved: rawAttachment.approved === true,
		previewKind:
			rawAttachment.previewKind === "html-report" || rawAttachment.previewKind === "pdf-preview"
				? rawAttachment.previewKind
				: undefined,
		kind: getNonEmptyString(rawAttachment.kind),
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
		timestampLabel: getNonEmptyString(rawComment.timestampLabel) ?? "Sep 3, 2025, 10:00 AM",
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
			if (!title) {
				return null;
			}
			return {
				title,
				cardCodes: normalizeStringArray(column.cardCodes),
			};
		})
		.filter(Boolean);

	return columns.length > 0 ? { columns } : defaultBoard;
}

function normalizeTrigger(rawTrigger) {
	if (!isObject(rawTrigger)) {
		return { ...RFP_DRAFTING_EVENT_TRIGGER };
	}

	return {
		type: getNonEmptyString(rawTrigger.type) ?? RFP_DRAFTING_EVENT_TRIGGER.type,
		board: getNonEmptyString(rawTrigger.board) ?? RFP_DRAFTING_EVENT_TRIGGER.board,
		column: getNonEmptyString(rawTrigger.column) ?? RFP_DRAFTING_EVENT_TRIGGER.column,
		label: getNonEmptyString(rawTrigger.label) ?? RFP_DRAFTING_EVENT_TRIGGER.label,
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
			? rawRun.threadLinks
					.map((link) => {
						if (!isObject(link)) {
							return null;
						}
						const ticketCode = getNonEmptyString(link.ticketCode);
						const threadId = getNonEmptyString(link.threadId);
						if (!ticketCode || !threadId) {
							return null;
						}
						return { ticketCode, threadId };
					})
					.filter(Boolean)
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
		selected: rawAgent.selected !== false,
		assignedColumn: RFP_DRAFTING_COLUMN_NAME,
		createdAt: getNonEmptyString(rawAgent.createdAt) ?? "Sep 3, 2025, 10:00 AM",
		avatarSrc: getNonEmptyString(rawAgent.avatarSrc) ?? RFP_DRAFTING_AGENT_AVATAR_SRC,
		jobId: getNonEmptyString(rawAgent.jobId),
		trigger: normalizeTrigger(rawAgent.trigger),
		jobRunSummaries: Array.isArray(rawAgent.jobRunSummaries)
			? rawAgent.jobRunSummaries.map(normalizeJobRunSummary).filter(Boolean)
			: [],
	};
}

function normalizeAgentsRfpDemoState(rawState) {
	const defaultState = createDefaultAgentsRfpDemoState();
	if (!isObject(rawState) || rawState.version !== AGENTS_RFP_DEMO_VERSION) {
		return defaultState;
	}

	const board = normalizeBoard(rawState.board);
	const defaultStatuses = new Map(
		board.columns.flatMap((column) => column.cardCodes.map((code) => [code, column.title])),
	);
	const workItems = {};
	for (const code of new Set([...Object.keys(defaultState.workItems), ...defaultStatuses.keys(), ...Object.keys(isObject(rawState.workItems) ? rawState.workItems : {})])) {
		workItems[code] = normalizeWorkItemState(
			isObject(rawState.workItems) ? rawState.workItems[code] : null,
			code,
			defaultStatuses.get(code) ?? defaultState.workItems[code]?.status ?? "RFP Intake",
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
		toasts: [
			...state.toasts.filter((toast) => toast.id !== id),
			{ id, message },
		].slice(-3),
	};
}

function ensureRfpDraftingAgent(state, { jobId, createdAtLabel = "Sep 3, 2025, 10:00 AM" } = {}) {
	const agent = normalizeAgent({
		...(state.agent ?? {}),
		id: RFP_DRAFTING_AGENT_ID,
		name: RFP_DRAFTING_AGENT_NAME,
		selected: true,
		assignedColumn: RFP_DRAFTING_COLUMN_NAME,
		createdAt: state.agent?.createdAt ?? createdAtLabel,
		avatarSrc: state.agent?.avatarSrc ?? RFP_DRAFTING_AGENT_AVATAR_SRC,
		jobId: jobId ?? state.agent?.jobId,
		trigger: RFP_DRAFTING_EVENT_TRIGGER,
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
		message: "Rovo created RFP Drafting Agent.",
		type: "agent-created",
	}), {
		id: "activity-workflow-assigned",
		timestampLabel: createdAtLabel,
		message: "Rovo assigned RFP Drafting Agent to the Drafting column event.",
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
			return {
				...column,
				cardCodes: filteredCodes,
			};
		}

		return {
			...column,
			cardCodes: append
				? [...filteredCodes, ticketCode]
				: [ticketCode, ...filteredCodes],
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
	return (
		workItem?.agentStatus === "completed" &&
		Boolean(workItem.generatedAttachment) &&
		Boolean(workItem.agentComment)
	);
}

function getCurrentDraftingTicketCodes(state) {
	return state.board.columns.find((column) => column.title === RFP_DRAFTING_COLUMN_NAME)?.cardCodes ?? [];
}

function createGeneratedAttachment(ticketCode) {
	return {
		id: `generated-${ticketCode.toLowerCase()}-response-draft-pdf`,
		displayName: `${ticketCode} response draft.pdf`,
		ext: "pdf",
		source: "generated",
		approved: true,
		previewKind: "pdf-preview",
		kind: RFP_TICKET_DRAFT_ATTACHMENT_KIND,
	};
}

function createAgentComment(ticketCode, ticketTitle, index) {
	return {
		id: `agent-comment-${ticketCode.toLowerCase()}-draft-ready`,
		authorName: RFP_DRAFTING_AGENT_NAME,
		authorAvatarSrc: RFP_DRAFTING_AGENT_AVATAR_SRC,
		timestampLabel: formatDemoTimestampLabel(index),
		content: `${RFP_DRAFTING_AGENT_NAME} drafted the first-pass response for ${ticketCode} (${ticketTitle}), attached the deterministic PDF package, and moved the ticket to Review for human review.`,
	};
}

function buildThreadMessagesForTicket({ ticketCode, ticketTitle, attachmentName, runId, timestamp }) {
	return [
		{
			id: `${ticketCode.toLowerCase()}-draft-request`,
			role: "user",
			parts: [
				{
					type: "text",
					text: `Event received: ${ticketCode} entered Drafting on the ${RFP_DRAFTING_BOARD_NAME} board. Draft the response package for "${ticketTitle}".`,
				},
			],
			metadata: {
				source: AGENTS_RFP_DEMO_SURFACE,
				runId,
			},
			createdAt: timestamp,
		},
		{
			id: `${ticketCode.toLowerCase()}-draft-result`,
			role: "assistant",
			parts: [
				{
					type: "text",
					text: [
						`Prepared deterministic RFP draft output for ${ticketCode}.`,
						`Attachment: ${attachmentName}.`,
						"Summary: mapped the ticket to Atlassian System of Work win themes, reusable ITSM answer language, legal/security review notes, and implementation assumptions.",
						"Next step: review the generated draft in Jira before final submission.",
					].join("\n"),
				},
			],
			metadata: {
				source: AGENTS_RFP_DEMO_SURFACE,
				runId,
			},
			createdAt: timestamp,
		},
	];
}

function buildThreadForTicket({ ticketCode, runId, timestamp }) {
	const ticketTitle = WORK_ITEM_TITLES[ticketCode] ?? ticketCode;
	const threadId = createThreadIdForTicket(ticketCode);
	const attachment = createGeneratedAttachment(ticketCode);

	return {
		id: threadId,
		title: `${ticketCode} RFP draft response`,
		messages: buildThreadMessagesForTicket({
			ticketCode,
			ticketTitle,
			attachmentName: attachment.displayName,
			runId,
			timestamp,
		}),
		realtimeMessages: [],
		visibility: "private",
		modelId: null,
		provider: "agents-rfp-demo",
		createdAt: timestamp,
		updatedAt: timestamp,
	};
}

function buildFailureThreadForTicket({ ticketCode, runId, timestamp }) {
	const ticketTitle = WORK_ITEM_TITLES[ticketCode] ?? ticketCode;
	const threadId = createThreadIdForTicket(ticketCode);

	return {
		id: threadId,
		title: `${ticketCode} RFP draft response`,
		messages: [
			{
				id: `${ticketCode.toLowerCase()}-draft-request`,
				role: "user",
				parts: [
					{
						type: "text",
						text: `Event received: ${ticketCode} entered Drafting on the ${RFP_DRAFTING_BOARD_NAME} board. Draft the response package for "${ticketTitle}".`,
					},
				],
				metadata: {
					source: AGENTS_RFP_DEMO_SURFACE,
					runId,
				},
				createdAt: timestamp,
			},
			{
				id: `${ticketCode.toLowerCase()}-draft-failed`,
				role: "assistant",
				parts: [
					{
						type: "text",
						text: `The deterministic demo run failed while preparing ${ticketCode}. The ticket stayed in Drafting and can be retried by rerunning the event job.`,
					},
				],
				metadata: {
					source: AGENTS_RFP_DEMO_SURFACE,
					runId,
				},
				createdAt: timestamp,
			},
		],
		realtimeMessages: [],
		visibility: "private",
		modelId: null,
		provider: "agents-rfp-demo",
		createdAt: timestamp,
		updatedAt: timestamp,
	};
}

function buildRunSummary({
	failedTicketCodes,
	finishedAt,
	jobId,
	processedTicketCodes,
	runId,
	skippedTicketCodes,
	source,
	startedAt,
	threadLinks,
}) {
	const status = failedTicketCodes.length > 0
		? processedTicketCodes.length > 0
			? "completed-with-failures"
			: "failed"
		: processedTicketCodes.length > 0
			? "completed"
			: "skipped";
	const summary = [
		`Processed ${processedTicketCodes.length} ticket${processedTicketCodes.length === 1 ? "" : "s"}`,
		`skipped ${skippedTicketCodes.length}`,
		`failed ${failedTicketCodes.length}`,
	].join(", ");

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
		summary: `${summary}.`,
	};
}

function runRfpDraftingAgent(state, {
	failTicketCodes = [],
	jobId = state.agent?.jobId ?? null,
	runId = createRunId(),
	source = "manual",
	ticketCodes,
} = {}) {
	let nextState = ensureRfpDraftingAgent(state, { jobId });
	const failSet = new Set(failTicketCodes);
	const requestedTicketCodes = Array.isArray(ticketCodes) && ticketCodes.length > 0
		? ticketCodes
		: getCurrentDraftingTicketCodes(nextState);
	const completedTicketCodes = Object.entries(nextState.workItems)
		.filter(([, workItem]) => isCompletedByAgent(workItem))
		.map(([ticketCode]) => ticketCode);
	const ticketCodesToEvaluate = Array.from(new Set(
		Array.isArray(ticketCodes) && ticketCodes.length > 0
			? requestedTicketCodes
			: [...requestedTicketCodes, ...completedTicketCodes],
	));
	const processedTicketCodes = [];
	const skippedTicketCodes = [];
	const failedTicketCodes = [];
	const threadLinks = [];
	const threadRecords = [];
	const startedAt = formatDemoTimestamp(0);

	for (const [index, ticketCode] of ticketCodesToEvaluate.entries()) {
		const currentWorkItem = nextState.workItems[ticketCode] ?? createDefaultWorkItemState(ticketCode, findColumnForTicket(nextState, ticketCode)?.title ?? RFP_DRAFTING_COLUMN_NAME);
		const isRequested = requestedTicketCodes.includes(ticketCode);
		if (isCompletedByAgent(currentWorkItem)) {
			skippedTicketCodes.push(ticketCode);
			continue;
		}
		if (!isRequested || currentWorkItem.status !== RFP_DRAFTING_COLUMN_NAME) {
			continue;
		}

		const threadId = currentWorkItem.agentSessionThreadId ?? createThreadIdForTicket(ticketCode);
		const runningWorkItem = {
			...currentWorkItem,
			previousAssignee: currentWorkItem.previousAssignee ?? currentWorkItem.assignee,
			assignee: RFP_DRAFTING_AGENT_NAME,
			agentAssignmentIds: Array.from(new Set([...currentWorkItem.agentAssignmentIds, RFP_DRAFTING_AGENT_ID])),
			agentStatus: "running",
			agentSessionThreadId: threadId,
			agentJobRunId: runId,
			lastError: null,
		};

		if (failSet.has(ticketCode)) {
			const failedAt = formatDemoTimestamp(index + 1);
			nextState = {
				...nextState,
				workItems: {
					...nextState.workItems,
					[ticketCode]: {
						...runningWorkItem,
						agentStatus: "failed",
						lastError: `Deterministic demo failure for ${ticketCode}.`,
					},
				},
			};
			failedTicketCodes.push(ticketCode);
			threadLinks.push({ ticketCode, threadId });
			threadRecords.push({
				...buildFailureThreadForTicket({ ticketCode, runId, timestamp: failedAt }),
				id: threadId,
			});
			continue;
		}

		const ticketTitle = WORK_ITEM_TITLES[ticketCode] ?? ticketCode;
		const completedAt = formatDemoTimestamp(index + 1);
		const generatedAttachment = createGeneratedAttachment(ticketCode);
		const agentComment = createAgentComment(ticketCode, ticketTitle, index + 1);
		const preservedAttachments = runningWorkItem.attachments.filter((attachment) => (
			attachment.source !== "generated" ||
			attachment.kind !== RFP_TICKET_DRAFT_ATTACHMENT_KIND
		));

		nextState = {
			...moveTicketToColumn(nextState, ticketCode, RFP_REVIEW_COLUMN_NAME, { append: true }),
			workItems: {
				...nextState.workItems,
				[ticketCode]: {
					...runningWorkItem,
					status: RFP_REVIEW_COLUMN_NAME,
					attachments: [...preservedAttachments, generatedAttachment],
					agentStatus: "completed",
					agentSessionThreadId: threadId,
					agentJobRunId: runId,
					generatedAttachment,
					agentComment,
					completedAt,
					lastError: null,
				},
			},
		};
		processedTicketCodes.push(ticketCode);
		threadLinks.push({ ticketCode, threadId });
		threadRecords.push({
			...buildThreadForTicket({ ticketCode, runId, timestamp: completedAt }),
			id: threadId,
		});
	}

	const finishedAt = formatDemoTimestamp(ticketCodesToEvaluate.length + 1);
	const runSummary = buildRunSummary({
		failedTicketCodes,
		finishedAt,
		jobId,
		processedTicketCodes,
		runId,
		skippedTicketCodes,
		source,
		startedAt,
		threadLinks,
	});
	const agent = normalizeAgent({
		...nextState.agent,
		jobId,
		jobRunSummaries: [runSummary, ...(nextState.agent?.jobRunSummaries ?? [])].slice(0, 10),
	});
	nextState = appendToast({
		...nextState,
		agent,
	}, runSummary.status === "skipped"
		? "RFP Drafting Agent found no new Drafting tickets to process."
		: `${RFP_DRAFTING_AGENT_NAME} ${runSummary.summary}`,
	`rfp-agent-run-${runId}`);

	return {
		state: nextState,
		runSummary,
		threadRecords,
	};
}

function moveTicketEnteredColumn(state, {
	jobId = state.agent?.jobId ?? null,
	runId,
	source = "jira-column-entered",
	targetColumn,
	ticketCode,
} = {}) {
	const normalizedTicketCode = getNonEmptyString(ticketCode);
	const normalizedTargetColumn = getNonEmptyString(targetColumn);
	if (!normalizedTicketCode || !normalizedTargetColumn) {
		const error = new Error("ticketCode and targetColumn are required.");
		error.code = "INVALID_INPUT";
		throw error;
	}

	let nextState = moveTicketToColumn(state, normalizedTicketCode, normalizedTargetColumn);
	if (normalizedTargetColumn !== RFP_DRAFTING_COLUMN_NAME || !nextState.agent) {
		return {
			state: nextState,
			runSummary: null,
			threadRecords: [],
		};
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
		if (ticketCode.startsWith("RFP-")) {
			threadIds.add(createThreadIdForTicket(ticketCode));
		}
	}
	return [...threadIds];
}

function createAgentsRfpDemoStateManager({ baseDir }) {
	const filePath = path.join(baseDir, "agents-rfp-demo", "state.json");

	async function readState() {
		try {
			const rawText = await fs.readFile(filePath, "utf8");
			return normalizeAgentsRfpDemoState(JSON.parse(rawText));
		} catch (error) {
			if (error?.code === "ENOENT") {
				return createDefaultAgentsRfpDemoState();
			}
			throw error;
		}
	}

	async function writeState(state) {
		const normalizedState = normalizeAgentsRfpDemoState(state);
		await fs.mkdir(path.dirname(filePath), { recursive: true });
		await fs.writeFile(filePath, `${JSON.stringify(normalizedState, null, 2)}\n`, "utf8");
		return cloneJson(normalizedState);
	}

	async function resetState() {
		return writeState(createDefaultAgentsRfpDemoState());
	}

	async function updateState(updater) {
		const currentState = await readState();
		const nextState = await updater(currentState);
		return writeState(nextState);
	}

	return {
		filePath,
		readState,
		resetState,
		updateState,
		writeState,
	};
}

module.exports = {
	AGENTS_RFP_DEMO_JOB_NAME,
	AGENTS_RFP_DEMO_JOB_PROMPT,
	AGENTS_RFP_DEMO_SURFACE,
	AGENTS_RFP_DEMO_VERSION,
	GENERATED_RFP_REPORT_ATTACHMENT_ID,
	RFP_DRAFTING_AGENT_AVATAR_SRC,
	RFP_DRAFTING_AGENT_ID,
	RFP_DRAFTING_AGENT_NAME,
	RFP_DRAFTING_BOARD_NAME,
	RFP_DRAFTING_COLUMN_NAME,
	RFP_DRAFTING_EVENT_TRIGGER,
	RFP_DRAFTING_EVENT_TRIGGER_LABEL,
	RFP_REVIEW_COLUMN_NAME,
	buildThreadForTicket,
	buildFailureThreadForTicket,
	createAgentsRfpDemoStateManager,
	createDefaultAgentsRfpDemoState,
	createGeneratedAttachment,
	createThreadIdForTicket,
	getDemoCreatedThreadIds,
	moveTicketEnteredColumn,
	moveTicketToColumn,
	normalizeAgentsRfpDemoState,
	runRfpDraftingAgent,
};
