const RFP_101_CONTEXT_PATTERN = /\[Active Jira Work Item Context\][\s\S]*\bKey:\s*RFP-101\b[\s\S]*\[End Active Jira Work Item Context\]/;
const RFP_DEMO_AGENT_CREATION_CONTEXT_PATTERN = /\[Agents RFP Demo Local State\][\s\S]*Report stage:\s*attached\.[\s\S]*Custom agent:\s*not created\.[\s\S]*(?:Trigger:\s*none\.[\s\S]*)?\[End Agents RFP Demo Local State\]/;
const RFP_HELP_DETAILED_MARKERS = [
	/\bcomplete this rfp\b/i,
	/\bbid\/no-bid\b/i,
	/\bfirst-pass response strategy\b/i,
	/\battached documents\b/i,
];
const RFP_HELP_OBJECT_PATTERN = /\b(?:this\s+)?rfp\b/i;
const RFP_HELP_COMPLETION_ACTION_PATTERNS = [
	/\bcomplete\b/i,
	/\bfinish\b/i,
	/\breview\s+and\s+complete\b/i,
];
const RFP_HELP_DIRECT_REQUEST_PATTERNS = [
	/\bhelp(?:\s+me)?\s+(?:prepare|complete|finish|work\s+on)\s+(?:this|the\s+)?rfp\b/i,
	/^(?:please\s+)?(?:prepare|complete|finish|draft)\s+(?:this|the\s+)?rfp\b/i,
	/\b(?:can|could|would)\s+you\s+(?:please\s+)?(?:help(?:\s+me)?\s+)?(?:prepare|complete|finish|draft|work\s+on)\s+(?:this|the\s+)?rfp\b/i,
];
const RFP_HELP_ACTION_PATTERNS = [
	/\bhelp(?:\s+me)?\b/i,
	/\breview\b/i,
	/\bcomplete\b/i,
	/\bfinish\b/i,
	/\bwork\s+on\b/i,
	/\bdraft\b/i,
	/\bprepare\b/i,
];
const RFP_HELP_OUTPUT_PATTERNS = [
	/\bbid\/no-bid\b/i,
	/\bfirst-pass response strategy\b/i,
	/\bresponse strategy\b/i,
	/\battached documents?\b/i,
	/\bthis ticket\b/i,
	/\bwork item\b/i,
];
const RFP_AGENT_CREATION_MARKERS = [
	/\brfp (?:drafting agent|drafter)\b/i,
	/\bdrafting column\b/i,
	/\benterprise rfp response board\b/i,
];
const RFP_DEMO_QUESTION_SESSION_ID = "agents-rfp-demo-rfp-101-qualification";
const RFP_DEMO_QUESTION_TOOL_CALL_ID = "ai-gateway-ask_user_questions-agents-rfp-demo-rfp-101";
const RFP_DEMO_AGENT_ID = "rfp-drafting-agent";
const RFP_DEMO_AGENT_NAME = "RFP Drafter";
const RFP_DEMO_AGENT_DESCRIPTION =
	"Drafts first-pass RFP response packages for Enterprise RFP Response tickets entering Drafting.";
const RFP_DEMO_AGENT_CONVERSATION_STARTERS = [
	"Draft the response package for the next Drafting ticket.",
	"Summarize blockers before this RFP can move to Review.",
	"Create reusable answer snippets from the attached RFP packet.",
];
const RFP_DEMO_TOOL_CALL_DELAY_MIN_MS = 1000;
const RFP_DEMO_TOOL_CALL_DELAY_MAX_MS = 3000;
const RFP_DEMO_QUALIFICATION_PRELOAD_DELAY_MS = 2000;
const RFP_DEMO_REPORT_TITLE = "RFP-101 response strategy report";
const RFP_DEMO_REPORT_PREVIEW_SUMMARY = "Offline vpk-html report for RFP-101 with bid/no-bid recommendation, response strategy, reusable assets, and review gates.";

function getNonEmptyString(value) {
	if (typeof value !== "string") {
		return null;
	}

	const trimmed = value.trim();
	return trimmed.length > 0 ? trimmed : null;
}

function extractTextFromMessagePart(part) {
	if (!part || typeof part !== "object") {
		return "";
	}

	if (part.type === "text" && typeof part.text === "string") {
		return part.text;
	}

	if (part.type === "text-delta" && typeof part.delta === "string") {
		return part.delta;
	}

	return "";
}

function getLatestUserMessageText(messages) {
	if (!Array.isArray(messages)) {
		return "";
	}

	for (let index = messages.length - 1; index >= 0; index -= 1) {
		const message = messages[index];
		if (!message || typeof message !== "object" || message.role !== "user") {
			continue;
		}

		if (Array.isArray(message.parts)) {
			return message.parts.map(extractTextFromMessagePart).join("").trim();
		}

		return getNonEmptyString(message.content) || "";
	}

	return "";
}

function hasRfp101Context(requestBody) {
	return RFP_101_CONTEXT_PATTERN.test(getNonEmptyString(requestBody?.contextDescription) || "");
}

function hasRfpDemoAgentCreationContext(requestBody) {
	return RFP_DEMO_AGENT_CREATION_CONTEXT_PATTERN.test(
		getNonEmptyString(requestBody?.contextDescription) || "",
	);
}

function countMatchingPatterns(patterns, prompt) {
	return patterns.reduce(
		(count, pattern) => count + (pattern.test(prompt) ? 1 : 0),
		0,
	);
}

function isRfpHelpPrompt(prompt) {
	const normalizedPrompt = getNonEmptyString(prompt);
	if (!normalizedPrompt) {
		return false;
	}

	if (RFP_HELP_DETAILED_MARKERS.every((pattern) => pattern.test(normalizedPrompt))) {
		return true;
	}

	if (!RFP_HELP_OBJECT_PATTERN.test(normalizedPrompt)) {
		return false;
	}

	if (RFP_HELP_DIRECT_REQUEST_PATTERNS.some((pattern) => pattern.test(normalizedPrompt))) {
		return true;
	}

	const actionScore = countMatchingPatterns(RFP_HELP_ACTION_PATTERNS, normalizedPrompt);
	const outputScore = countMatchingPatterns(RFP_HELP_OUTPUT_PATTERNS, normalizedPrompt);
	const hasCompletionAction = RFP_HELP_COMPLETION_ACTION_PATTERNS.some((pattern) => pattern.test(normalizedPrompt));

	return hasCompletionAction || (actionScore > 0 && outputScore > 0);
}

function isRfpAgentCreationPrompt(prompt, requestBody) {
	if (requestBody?.creationMode !== "agent" || !getNonEmptyString(prompt)) {
		return false;
	}

	return RFP_AGENT_CREATION_MARKERS.every((pattern) => pattern.test(prompt));
}

function resolveAgentsRfpDemoChatTurn(requestBody) {
	if (!requestBody || typeof requestBody !== "object") {
		return null;
	}

	const prompt = getLatestUserMessageText(requestBody.messages);
	if (
		hasRfpDemoAgentCreationContext(requestBody) &&
		isRfpAgentCreationPrompt(prompt, requestBody)
	) {
		return "agent-creation";
	}

	if (!hasRfp101Context(requestBody)) {
		return null;
	}

	const clarification = requestBody.clarification;
	if (
		clarification &&
		typeof clarification === "object" &&
		getNonEmptyString(clarification.sessionId) === RFP_DEMO_QUESTION_SESSION_ID
	) {
		return "qualification-answer";
	}

	return isRfpHelpPrompt(prompt) ? "qualification-questions" : null;
}

function getAgentsRfpDemoToolCallDelayMs(random = Math.random) {
	const rawValue = typeof random === "function" ? random() : Math.random();
	const boundedValue = Number.isFinite(rawValue)
		? Math.min(1, Math.max(0, rawValue))
		: 0;

	return Math.round(
		RFP_DEMO_TOOL_CALL_DELAY_MIN_MS +
			boundedValue *
				(RFP_DEMO_TOOL_CALL_DELAY_MAX_MS - RFP_DEMO_TOOL_CALL_DELAY_MIN_MS),
	);
}

function getAgentsRfpDemoPreloadDelayMs(turn) {
	return turn === "qualification-questions"
		? RFP_DEMO_QUALIFICATION_PRELOAD_DELAY_MS
		: 0;
}

function buildAgentsRfpDemoQuestionCardPayload() {
	return {
		type: "question-card",
		sessionId: RFP_DEMO_QUESTION_SESSION_ID,
		round: 1,
		maxRounds: 1,
		title: "Qualify the RFP response",
		description: "I have the ticket context and attachments. These inputs keep the recommendation and first-pass strategy accurate.",
		directive: "Answer what you know. I will mark unknowns as assumptions or review-required.",
		questions: [
			{
				id: "deal-size",
				label: "What opportunity size should I assume?",
				description: "Used to calibrate bid/no-bid priority and response depth.",
				required: true,
				kind: "single-select",
				placeholder: "Use a different ARR or deal size",
				options: [
					{ id: "strategic-2-4m-arr", label: "$2.4M ARR strategic pursuit", recommended: true },
					{ id: "enterprise-expansion", label: "$750K enterprise expansion" },
					{ id: "unknown-strategic", label: "Unknown, assume strategic" },
				],
			},
			{
				id: "incumbent",
				label: "Which incumbent platform should I position against?",
				required: true,
				kind: "single-select",
				options: [
					{ id: "servicenow", label: "ServiceNow incumbent", recommended: true },
					{ id: "bmc", label: "BMC or legacy ITSM" },
					{ id: "unknown", label: "Not confirmed" },
				],
			},
			{
				id: "audience",
				label: "Who is the first draft for?",
				required: true,
				kind: "single-select",
				options: [
					{ id: "deal-desk", label: "Internal deal desk first", recommended: true },
					{ id: "customer", label: "Customer-facing draft" },
					{ id: "executive", label: "Executive summary only" },
				],
			},
			{
				id: "review-posture",
				label: "Which review and reuse posture should I apply?",
				required: true,
				kind: "multi-select",
				options: [
					{ id: "approved-language", label: "Use approved standard language", recommended: true },
					{ id: "review-required", label: "Mark gaps review-required", recommended: true },
					{ id: "itsm-template", label: "Reuse standard ITSM template", recommended: true },
					{ id: "pilot-notes", label: "Prior JSM pilot notes", recommended: true },
				],
			},
		],
	};
}

function buildAgentsRfpDemoQualificationTrace() {
	return [
		{
			toolName: "jira.read_work_item",
			toolCallId: "agents-rfp-demo-jira-read-rfp-101",
			label: "Reading RFP-101",
			content: "Loading active work item fields, subtasks, due date, priority, and parent RFP context.",
			input: { key: "RFP-101", include: ["parent", "subtasks", "activity"] },
			outputPreview: "RFP-101 is a high-priority enterprise service-management RFP due Sep 8, with response work split across matrix, win themes, and legal/security exhibits.",
		},
		{
			toolName: "jira.scan_attachments",
			toolCallId: "agents-rfp-demo-jira-scan-attachments",
			label: "Scanning attachments",
			content: "Checking the RFP packet, compliance matrix, response brief, supplier portal upload, audio briefing, and walkthrough.",
			input: {
				key: "RFP-101",
				attachments: [
					"enterprise-rfp-requirements.pdf",
					"compliance-matrix.xlsx",
					"response-brief.docx",
					"supplier-portal-upload.png",
					"proposal-audio-briefing.mp3",
					"proposal-walkthrough.mp4",
				],
			},
			outputPreview: "Found requirements for ITSM, CMDB, asset lifecycle, AI compliance, data residency, audit, and vulnerability response.",
		},
		{
			toolName: "teamwork_graph.search",
			toolCallId: "agents-rfp-demo-twg-search",
			label: "Searching Teamwork Graph",
			content: "Looking for account memory, reusable response assets, people, goals, and prior pilot notes.",
			input: { account: "Enterprise Evaluation Account", topics: ["ITSM RFP", "JSM pilot", "Rovo AI", "security review"] },
			outputPreview: "Returned Standard ITSM RFP Response Template, prior JSM pilot notes, Rovo for ITSM demo recording, CSM/SE/legal contacts, and FY26 Enterprise Expansion goals.",
		},
		{
			toolName: "rfp.map_requirements",
			toolCallId: "agents-rfp-demo-map-requirements",
			label: "Mapping requirements",
			content: "Structuring the bid/no-bid inputs across platform fit, response evidence, and review gaps.",
			input: { sections: ["ITSM", "CMDB", "asset management", "AI compliance", "legal", "data residency", "security"] },
			outputPreview: "Strong fit for ITSM, service desk, portal, knowledge, change, assets, and CMDB. Legal, data residency, audit, and vulnerability responses need review posture.",
		},
		{
			toolName: "rfp.check_unfinished_work",
			toolCallId: "agents-rfp-demo-check-gaps",
			label: "Checking open work",
			content: "Looking for unresolved subtasks that should shape the recommendation.",
			input: { key: "RFP-101", status: "RFP Intake" },
			outputPreview: "Flagged RFP-106 and RFP-108 as validation gaps before customer-facing release.",
		},
		{
			toolName: "ask_user_questions",
			toolCallId: RFP_DEMO_QUESTION_TOOL_CALL_ID,
			label: "Preparing clarification questions",
			content: "Asking for the commercial and review posture details needed before drafting.",
			input: { sessionId: RFP_DEMO_QUESTION_SESSION_ID, round: 1, questions: 4 },
		},
	];
}

function buildAgentsRfpDemoAnswerTrace() {
	return [
		{
			toolName: "rfp.apply_qualification_answers",
			toolCallId: "agents-rfp-demo-apply-answers",
			label: "Applying your answers",
			content: "Combining your qualification answers with the active RFP-101 context.",
			input: { sessionId: RFP_DEMO_QUESTION_SESSION_ID },
			outputPreview: "Assumptions captured for deal size, ServiceNow incumbent positioning, internal deal-desk audience, and review-required legal/security posture.",
		},
		{
			toolName: "rfp.build_response_strategy",
			toolCallId: "agents-rfp-demo-build-strategy",
			label: "Drafting response strategy",
			content: "Building the bid/no-bid recommendation, coverage matrix, win themes, reusable asset index, risks, and next actions.",
			input: { key: "RFP-101", sections: ["recommendation", "coverage", "win themes", "risks", "next actions"] },
			outputPreview: "Prepared a bid recommendation with unified ITSM/CMDB as the lead narrative and Rovo AI automation as the differentiator.",
		},
		{
			toolName: "rfp.flag_reviews",
			toolCallId: "agents-rfp-demo-flag-reviews",
			label: "Flagging review gates",
			content: "Separating approved standard language from items that need legal, data residency, audit, and vulnerability review.",
			input: { reviewRequired: ["legal", "data residency", "audit", "vulnerability response"] },
			outputPreview: "Marked the risk language review-required before customer-facing release.",
		},
		{
			toolName: "agent_skill.load",
			toolCallId: "agents-rfp-demo-load-vpk-html",
			label: "Loading vpk-html",
			content: "Selecting the repo-local vpk-html skill because the next step is an offline HTML report artifact.",
			input: { skill: "vpk-html", template: "assets/templates/status-report.html" },
			outputPreview: "Loaded the vpk-html report template and offline artifact contract.",
		},
		{
			toolName: "vpk_html.distill_fields",
			toolCallId: "agents-rfp-demo-vpk-html-distill",
			label: "Distilling report fields",
			content: "Converting the RFP context and your answers into structured status report fields without inventing facts.",
			input: { key: "RFP-101", audience: "deal desk", factPolicy: "mark gaps" },
			outputPreview: "Prepared summary, recommendation, progress, blockers, next-window, and information-gap fields.",
		},
		{
			toolName: "vpk_html.render_template",
			toolCallId: "agents-rfp-demo-vpk-html-render",
			label: "Rendering HTML report",
			content: "Filling the vpk-html status report template as a single offline HTML artifact.",
			input: { title: RFP_DEMO_REPORT_TITLE, kind: "html", dependencies: "inline-only" },
			outputPreview: "Rendered the first report version with embedded styles and no remote runtime dependencies.",
		},
		{
			toolName: "vpk_html.validate_artifact",
			toolCallId: "agents-rfp-demo-vpk-html-validate",
			label: "Validating artifact",
			content: "Checking placeholder coverage and the static HTML contract before sharing the report.",
			input: { checks: ["placeholders", "html-validity", "offline-dependencies"] },
			outputPreview: "Validated the report artifact and saved it to the active Rovo thread.",
		},
	];
}

function buildAgentsRfpDemoAgentCreationTrace() {
	return [
		{
			toolName: "jira.inspect_board_column",
			toolCallId: "agents-rfp-demo-agent-inspect-drafting",
			label: "Inspecting Drafting workflow",
			content: "Reading the Drafting column, RFP-101 attachment history, and nearby work items to scope the reusable agent trigger.",
			input: { board: "Enterprise RFP Response", column: "Drafting", include: ["RFP-101", "RFP-102", "RFP-103"] },
			outputPreview: "Drafting has repeatable RFP response prep: inspect attachments, qualify gaps, draft strategy, attach the draft, comment, and move to Review.",
		},
		{
			toolName: "agent.define_trigger",
			toolCallId: "agents-rfp-demo-agent-define-trigger",
			label: "Defining agent trigger",
			content: "Setting the agent to activate when an RFP work item enters Drafting on the Enterprise RFP Response board.",
			input: { board: "Enterprise RFP Response", column: "Drafting", signal: "jira-column-entered" },
			outputPreview: "Trigger scoped to Drafting work items so the agent handles similar RFPs without interrupting unrelated tickets.",
		},
		{
			toolName: "agent.configure_tools",
			toolCallId: "agents-rfp-demo-agent-configure-tools",
			label: "Adding tools and skills",
			content: "Giving the agent deterministic demo access to Jira work items, attachments, Teamwork Graph account memory, the repo-local /vpk-html skill, and HTML draft attachment output.",
			input: { skills: ["vpk-html"], tools: ["jira.work_items", "jira.attachments", "teamwork_graph.search", "vpk_html.render_template", "jira.attach_html"] },
			outputPreview: "Tool set matches the completed RFP-101 report flow and produces ticket-specific vpk-html draft artifacts.",
		},
		{
			toolName: "agent.write_instructions",
			toolCallId: "agents-rfp-demo-agent-instructions",
			label: "Writing agent instructions",
			content: "Adding the description, conversation starters, and instructions to read each ticket context, generate a contextual HTML draft, comment with the ticket-specific handoff, and return work to a human reviewer.",
			input: {
				description: RFP_DEMO_AGENT_DESCRIPTION,
				conversationStarters: RFP_DEMO_AGENT_CONVERSATION_STARTERS,
				output: "html-report",
				reviewColumn: "Review",
				assigneePolicy: "return-to-human-owner",
			},
			outputPreview: "Profile metadata and instructions keep the flow event-triggered, backend-persisted, and bounded to the Enterprise RFP Response board.",
		},
		{
			toolName: "teamwork_graph.link_knowledge",
			toolCallId: "agents-rfp-demo-agent-knowledge",
			label: "Linking Teamwork Graph knowledge",
			content: "Connecting proposal memory, prior RFP language, Jira work-item context, and account-team ownership signals for the drafting flow.",
			input: { sources: ["proposal memory", "prior RFP language", "Jira work items", "account-team ownership"] },
			outputPreview: "Knowledge scope is limited to deterministic demo context so the agent can produce stable per-ticket drafts.",
		},
		{
			toolName: "agent.define_rerun_policy",
			toolCallId: "agents-rfp-demo-agent-rerun-policy",
			label: "Setting rerun policy",
			content: "Skipping tickets that already have agent-generated draft output and retrying failed Drafting tickets on later event runs.",
			input: { skipWhen: ["generated-html", "agent-comment"], retryWhen: ["agentStatus=failed"] },
			outputPreview: "Completed tickets are idempotent on rerun, and failed tickets remain retryable without blocking other tickets.",
		},
		{
			toolName: "agent.persist_definition",
			toolCallId: "agents-rfp-demo-agent-persist",
			label: `Creating ${RFP_DEMO_AGENT_NAME}`,
			content: "Saving the agent definition, selecting it for chat, and assigning it to the Drafting workflow.",
			input: { agentId: RFP_DEMO_AGENT_ID, name: RFP_DEMO_AGENT_NAME, assignedColumn: "Drafting" },
			outputPreview: `${RFP_DEMO_AGENT_NAME} is ready for Drafting work items and selected for the current Rovo session.`,
		},
	];
}

function buildAgentsRfpDemoAgentResultPayload() {
	return {
		agentId: RFP_DEMO_AGENT_ID,
		name: RFP_DEMO_AGENT_NAME,
		description: RFP_DEMO_AGENT_DESCRIPTION,
		conversationStarters: RFP_DEMO_AGENT_CONVERSATION_STARTERS,
		assignedColumn: "Drafting",
		summary: "Ready to handle similar RFP work items",
		trigger: "On event: ticket enters Drafting.",
		tools: [
			"Jira work items",
			"Teamwork Graph",
			"vpk-html reports",
			"HTML draft attachment",
		],
		guardrail: "Skips completed tickets on rerun and retries failed tickets later.",
		action: "create",
	};
}

function buildAgentsRfpDemoAgentCreationConfirmationText({ name = RFP_DEMO_AGENT_NAME } = {}) {
	return `Created **${name}** and added it to the Enterprise RFP Response project. It runs when a ticket enters Drafting, creates a visible Rovo thread, generates a contextual vpk-html draft, attaches the HTML artifact, comments in Jira, and returns successful tickets to Review for a human owner.`;
}

function buildAgentsRfpDemoQualificationIntro() {
	return "I found enough context in RFP-101 to start the bid/no-bid analysis. Before I draft the response package, I need a few qualification details so I do not overstate commercial, legal, or security posture.";
}

function buildAgentsRfpDemoReportConfirmationText({ documentId, title = RFP_DEMO_REPORT_TITLE } = {}) {
	const resolvedDocumentId = getNonEmptyString(documentId) || "report";
	return `Generated **${title}** with the repo-local /vpk-html skill. [Open it in Rovo Canvas](#rovo-canvas-${encodeURIComponent(resolvedDocumentId)}) to review the embedded HTML report.`;
}

module.exports = {
	RFP_DEMO_REPORT_PREVIEW_SUMMARY,
	RFP_DEMO_REPORT_TITLE,
	RFP_DEMO_QUESTION_SESSION_ID,
	RFP_DEMO_QUESTION_TOOL_CALL_ID,
	buildAgentsRfpDemoQualificationIntro,
	buildAgentsRfpDemoAgentCreationConfirmationText,
	buildAgentsRfpDemoAgentCreationTrace,
	buildAgentsRfpDemoAgentResultPayload,
	buildAgentsRfpDemoQualificationTrace,
	buildAgentsRfpDemoQuestionCardPayload,
	buildAgentsRfpDemoReportConfirmationText,
	buildAgentsRfpDemoAnswerTrace,
	getAgentsRfpDemoPreloadDelayMs,
	getAgentsRfpDemoToolCallDelayMs,
	getLatestUserMessageText,
	resolveAgentsRfpDemoChatTurn,
};
