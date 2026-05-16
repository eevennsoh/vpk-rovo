const RFP_101_CONTEXT_PATTERN = /\[Active Jira Work Item Context\][\s\S]*\bKey:\s*RFP-101\b[\s\S]*\[End Active Jira Work Item Context\]/;
const RFP_HELP_MARKERS = [
	/\bcomplete this rfp\b/i,
	/\bbid\/no-bid\b/i,
	/\bfirst-pass response strategy\b/i,
	/\battached documents\b/i,
];
const RFP_DEMO_QUESTION_SESSION_ID = "agents-rfp-demo-rfp-101-qualification";
const RFP_DEMO_QUESTION_TOOL_CALL_ID = "ai-gateway-ask_user_questions-agents-rfp-demo-rfp-101";

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
				label: "What ARR or deal size should I assume?",
				description: "Used to calibrate the bid/no-bid recommendation.",
				required: true,
				kind: "text",
				placeholder: "Example: $2.4M ARR",
				options: [],
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
				label: "How should I handle legal, security, and data residency gaps?",
				required: true,
				kind: "multi-select",
				options: [
					{ id: "approved-language", label: "Use approved standard language", recommended: true },
					{ id: "review-required", label: "Mark gaps review-required", recommended: true },
					{ id: "legal-escalation", label: "Escalate legal review" },
					{ id: "security-escalation", label: "Escalate security review" },
				],
			},
			{
				id: "lead-narrative",
				label: "What should lead the response narrative?",
				required: true,
				kind: "single-select",
				options: [
					{ id: "itsm-cmdb", label: "Unified ITSM and CMDB", recommended: true },
					{ id: "rovo-ai", label: "Rovo AI automation" },
					{ id: "commercial", label: "Commercial value and speed" },
				],
			},
			{
				id: "reuse-assets",
				label: "Which reusable assets should I pull forward?",
				required: false,
				kind: "multi-select",
				options: [
					{ id: "itsm-template", label: "Standard ITSM RFP template", recommended: true },
					{ id: "pilot-notes", label: "Prior JSM pilot notes", recommended: true },
					{ id: "rovo-demo", label: "Rovo for ITSM demo recording" },
					{ id: "security-tracker", label: "Security review tracker" },
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
			input: { sessionId: RFP_DEMO_QUESTION_SESSION_ID, round: 1, questions: 6 },
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
	];
}

function buildAgentsRfpDemoQualificationIntro() {
	return "I found enough context in RFP-101 to start the bid/no-bid analysis. Before I draft the response package, I need a few qualification details so I do not overstate commercial, legal, or security posture.";
}

function buildAgentsRfpDemoResponsePackageText() {
	return [
		"**Bid/no-bid recommendation: Bid, with review gates.** The RFP is a strong fit for Jira Service Management, Assets, CMDB-backed service operations, and Rovo AI automation. I would proceed, while keeping legal, data residency, audit, and vulnerability responses marked review-required before anything becomes customer-facing.",
		"",
		"**Response strategy.** Lead with unified ITSM and CMDB: service desk, portal, knowledge, change, asset lifecycle, and configuration management form the core platform narrative. Use Rovo and Teamwork Graph as the differentiator for faster intake, reusable response assembly, and AI-assisted service operations.",
		"",
		"**Reusable assets.** I would pull forward the Standard ITSM RFP Response Template, prior JSM pilot notes, the Rovo for ITSM demo recording, and the existing security review tracker. Those give the deal desk a stronger first pass than starting from a blank response.",
		"",
		"**Open risks.** RFP-106 and RFP-108 still need validation. Legal, data residency, audit, and vulnerability answers should use standard approved language only where available, then stay flagged for owner review.",
		"",
		"**Next action.** I can turn this into an offline HTML report for RFP-101, then stage the approved HTML/PDF attachments back on the work item.",
	].join("\n");
}

module.exports = {
	RFP_DEMO_QUESTION_SESSION_ID,
	RFP_DEMO_QUESTION_TOOL_CALL_ID,
	buildAgentsRfpDemoQualificationIntro,
	buildAgentsRfpDemoQualificationTrace,
	buildAgentsRfpDemoQuestionCardPayload,
	buildAgentsRfpDemoResponsePackageText,
	buildAgentsRfpDemoAnswerTrace,
	getLatestUserMessageText,
	resolveAgentsRfpDemoChatTurn,
};
