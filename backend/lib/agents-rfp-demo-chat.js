const RFP_101_CONTEXT_PATTERN = /\[Active Jira Work Item Context\][\s\S]*\bKey:\s*RFP-101\b[\s\S]*\[End Active Jira Work Item Context\]/;
const RFP_HELP_MARKERS = [
	/\bcomplete this rfp\b/i,
	/\bbid\/no-bid\b/i,
	/\bfirst-pass response strategy\b/i,
	/\battached documents\b/i,
];
const RFP_DEMO_QUESTION_SESSION_ID = "agents-rfp-demo-rfp-101-qualification";
const RFP_DEMO_QUESTION_TOOL_CALL_ID = "ai-gateway-ask_user_questions-agents-rfp-demo-rfp-101";
const RFP_DEMO_TOOL_CALL_DELAY_MIN_MS = 1000;
const RFP_DEMO_TOOL_CALL_DELAY_MAX_MS = 3000;
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

function isRfpHelpPrompt(prompt) {
	if (!getNonEmptyString(prompt)) {
		return false;
	}

	return RFP_HELP_MARKERS.every((pattern) => pattern.test(prompt));
}

function resolveAgentsRfpDemoChatTurn(requestBody) {
	if (!requestBody || typeof requestBody !== "object" || !hasRfp101Context(requestBody)) {
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

	const prompt = getLatestUserMessageText(requestBody.messages);
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
	buildAgentsRfpDemoQualificationTrace,
	buildAgentsRfpDemoQuestionCardPayload,
	buildAgentsRfpDemoReportConfirmationText,
	buildAgentsRfpDemoAnswerTrace,
	getAgentsRfpDemoToolCallDelayMs,
	getLatestUserMessageText,
	resolveAgentsRfpDemoChatTurn,
};
