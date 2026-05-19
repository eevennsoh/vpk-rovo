const RFP_101_CONTEXT_PATTERN = /\[Active Jira Work Item Context\][\s\S]*\bKey:\s*RFP-101\b[\s\S]*\[End Active Jira Work Item Context\]/;
const RFP_DEMO_AGENT_CREATION_CONTEXT_PATTERN = /\[Agents RFP Demo Local State\][\s\S]*Report stage:\s*attached\.[\s\S]*Custom agent:\s*not created\.[\s\S]*(?:Trigger:\s*none\.[\s\S]*)?\[End Agents RFP Demo Local State\]/;
const RFP_HELP_DETAILED_MARKERS = [
	/\bshould we respond to this rfp\b/i,
	/\bbid\/no-bid\b/i,
	/\bqualification\b/i,
];
const RFP_HELP_OBJECT_PATTERN = /\b(?:this\s+)?rfp\b/i;
const RFP_HELP_COMPLETION_ACTION_PATTERNS = [
	/\bshould\s+we\s+(?:respond|bid)\b/i,
	/\bshould\s+atlassian\s+(?:respond|bid)\b/i,
];
const RFP_HELP_DIRECT_REQUEST_PATTERNS = [
	/\bshould\s+we\s+respond\s+to\s+(?:(?:this|the)\s+)?rfp\b/i,
	/\bshould\s+we\s+bid\s+on\s+(?:(?:this|the)\s+)?rfp\b/i,
	/\b(?:can|could|would)\s+you\s+(?:please\s+)?(?:help(?:\s+me)?\s+)?(?:decide|recommend)\s+(?:whether\s+)?(?:we|atlassian)\s+should\s+(?:respond|bid)\s+(?:to|on)\s+(?:(?:this|the)\s+)?rfp\b/i,
];
const RFP_HELP_ACTION_PATTERNS = [
	/\bdecide\b/i,
	/\brecommend\b/i,
	/\bqualif(?:y|ication)\b/i,
	/\brespond\b/i,
	/\bbid\b/i,
];
const RFP_HELP_OUTPUT_PATTERNS = [
	/\bshould\s+we\s+respond\b/i,
	/\bbid\/no-bid\b/i,
	/\bbid recommendation\b/i,
	/\bqualification\b/i,
	/\bdaci\b/i,
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
const RFP_DEMO_KNOWLEDGE_QUESTION_ID = "knowledge-source";
const RFP_DEMO_KNOWLEDGE_OPTIONS = [
	{ id: "reusable-answer-library", label: "Reusable answer library" },
	{ id: "customer-account-context", label: "Customer/account context" },
	{ id: "product-security-evidence", label: "Product and security evidence" },
];
const RFP_DEMO_KNOWLEDGE_SEED_FILES_BY_ID = {
	"reusable-answer-library": [".agents/knowledge/rfp-drafting-agent/reusable-answer-library.md"],
	"customer-account-context": [".agents/knowledge/rfp-drafting-agent/customer-account-context.md"],
	"product-security-evidence": [".agents/knowledge/rfp-drafting-agent/product-security-evidence.md"],
};
const RFP_DEMO_TOOL_CALL_DELAY_MIN_MS = 1000;
const RFP_DEMO_TOOL_CALL_DELAY_MAX_MS = 3000;
const RFP_DEMO_SKILL_TOOL_CALL_DELAY_MS = 4500;
const RFP_DEMO_QUALIFICATION_PRELOAD_DELAY_MS = 2000;
const RFP_DEMO_REPORT_TITLE = "Acmecorp RFP qualification DACI";
const RFP_DEMO_REPORT_PREVIEW_SUMMARY = "PDF-ready one-pager for RFP-101 with bid/no-bid recommendation, DACI roles, stakeholder relationship, budget qualification, campaign fit, competitive advantages, risks, and open gaps.";

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

function normalizeAgentsRfpDemoKnowledgeAnswer(value) {
	const answer = Array.isArray(value) ? value[0] : value;
	const normalizedAnswer = getNonEmptyString(answer);
	if (!normalizedAnswer) {
		return null;
	}

	const matchingOption = RFP_DEMO_KNOWLEDGE_OPTIONS.find((option) => (
		option.id === normalizedAnswer ||
		option.label.toLowerCase() === normalizedAnswer.toLowerCase()
	));

	return matchingOption?.label ?? normalizedAnswer;
}

function extractAgentsRfpDemoSelectedKnowledge(requestBody) {
	const answers = requestBody?.clarification?.answers;
	if (!answers || typeof answers !== "object") {
		return null;
	}

	return normalizeAgentsRfpDemoKnowledgeAnswer(answers[RFP_DEMO_KNOWLEDGE_QUESTION_ID]);
}

function getAgentsRfpDemoKnowledgeSeedFiles(selectedKnowledge) {
	const option = RFP_DEMO_KNOWLEDGE_OPTIONS.find((candidate) => candidate.label === selectedKnowledge);
	return option ? RFP_DEMO_KNOWLEDGE_SEED_FILES_BY_ID[option.id] : [];
}

function buildAgentsRfpDemoQuestionCardPayload() {
	return {
		type: "question-card",
		sessionId: RFP_DEMO_QUESTION_SESSION_ID,
		round: 1,
		maxRounds: 1,
		title: "Shape the reusable RFP agent",
		description: "These answers guide this RFP and seed the later custom agent.",
		directive: "Answer what you know. This is the only question round; I will infer unanswered items and continue with the best recommendation.",
		questions: [
			{
				id: "agent-focus",
				label: "What should the RFP agent optimize for?",
				description: "This becomes the agent's default operating priority.",
				required: true,
				kind: "single-select",
				placeholder: "Describe a different RFP priority",
				options: [
					{ id: "bid-qualification", label: "Bid qualification", recommended: true },
					{ id: "compliance-response", label: "Compliance response" },
					{ id: "win-narrative", label: "Win narrative" },
				],
			},
			{
				id: RFP_DEMO_KNOWLEDGE_QUESTION_ID,
				label: "Which knowledge should the agent reuse first?",
				description: "This seeds the custom agent knowledge path.",
				required: true,
				kind: "single-select",
				placeholder: "Name another knowledge source",
				options: RFP_DEMO_KNOWLEDGE_OPTIONS.map((option, index) => ({
					...option,
					recommended: index === 0,
				})),
			},
			{
				id: "review-posture",
				label: "What should require human review before the agent moves work forward?",
				description: "This becomes the agent's review gate.",
				required: true,
				kind: "single-select",
				placeholder: "Describe another review gate",
				options: [
					{ id: "commercial-assumptions", label: "Commercial assumptions", recommended: true },
					{ id: "legal-security-commitments", label: "Legal/security commitments" },
					{ id: "product-fit-gaps", label: "Product fit gaps" },
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
			outputPreview: "RFP-101 is a high-priority Acmecorp enterprise service-management RFP due Jun 8, 2026, with qualification work split across matrix, DACI ownership, win themes, and legal/security exhibits.",
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
			content: "Looking for Acmecorp account memory, stakeholder signals, reusable qualification assets, people, goals, and prior pilot notes.",
			input: { account: "Acmecorp", topics: ["ITSM RFP", "budget qualification", "stakeholder relationship", "Rovo AI", "security review"] },
			outputPreview: "Returned standard ITSM qualification criteria, prior JSM pilot notes, Acmecorp stakeholder map, Rovo for ITSM demo recording, CSM/SE/legal contacts, and FY26 Enterprise Expansion goals.",
		},
		{
			toolName: "rfp.map_requirements",
			toolCallId: "agents-rfp-demo-map-requirements",
			label: "Mapping requirements",
			content: "Structuring the Acmecorp bid/no-bid inputs across platform fit, budget, stakeholder access, competitive advantage, and review gaps.",
			input: { sections: ["budget", "stakeholders", "campaign fit", "ITSM", "CMDB", "asset management", "AI compliance", "legal", "security"] },
			outputPreview: "Strong fit for ITSM, service desk, portal, knowledge, change, assets, and CMDB. Budget, stakeholder access, legal, data residency, audit, and vulnerability posture need explicit DACI ownership.",
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
			content: "Asking reusable RFP discovery questions that can inform this response and seed the later custom agent.",
			input: { sessionId: RFP_DEMO_QUESTION_SESSION_ID, round: 1, questions: 3 },
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
			outputPreview: "Reusable RFP agent priorities, knowledge preference, and human-review gates captured where provided. Unanswered items will be inferred for the recommendation.",
		},
		{
			toolName: "rfp.build_bid_recommendation",
			toolCallId: "agents-rfp-demo-build-strategy",
			label: "Building bid recommendation",
			content: "Building the Acmecorp bid/no-bid recommendation, DACI roles, stakeholder relationship notes, budget qualification, campaign fit, competitive advantages, risks, and next actions.",
			input: { key: "RFP-101", sections: ["recommendation", "daci", "relationship", "budget", "campaign fit", "competitive advantages", "risks", "gaps"] },
			outputPreview: "Prepared a qualified-respond recommendation with unified ITSM/CMDB as the lead advantage and Rovo AI automation as the differentiator.",
		},
		{
			toolName: "rfp.flag_reviews",
			toolCallId: "agents-rfp-demo-flag-reviews",
			label: "Flagging review gates",
			content: "Separating approved standard language from items that need legal, data residency, audit, and vulnerability review.",
			input: { reviewRequired: ["legal", "data residency", "audit", "vulnerability response"] },
			outputPreview: "Marked Acmecorp legal, security, pricing, and product commitments review-required before any customer-facing response.",
		},
		{
			toolName: "agent_skill.load",
			toolCallId: "agents-rfp-demo-load-generate-pdf",
			label: "Using generate-pdf skill",
			content: "Selecting the generate-pdf skill because the next step is a qualification DACI one-pager artifact.",
			input: { skill: "generate-pdf", template: "assets/templates/one-pager.html" },
			outputPreview: "Loaded the generate-pdf one-pager template and artifact contract.",
		},
		{
			toolName: "generate_pdf.distill_fields",
			toolCallId: "agents-rfp-demo-generate-pdf-distill",
			label: "Distilling DACI fields",
			content: "Converting the Acmecorp RFP context and your answers into structured DACI qualification fields without inventing facts.",
			input: { key: "RFP-101", audience: "deal desk", template: "one-pager", factPolicy: "mark gaps" },
			outputPreview: "Prepared recommendation, Driver, Approver, Contributors, Informed, stakeholder relationship, budget qualification, campaign fit, competitive advantages, decision risks, and open gaps.",
		},
		{
			toolName: "generate_pdf.render_document",
			toolCallId: "agents-rfp-demo-generate-pdf-render",
			label: "Rendering DACI one-pager",
			content: "Rendering the generate-pdf one-pager as a reviewable qualification artifact.",
			input: { title: RFP_DEMO_REPORT_TITLE, kind: "pdf", dependencies: "inline-only" },
			outputPreview: "Rendered the first qualification DACI version with embedded styles and no remote runtime dependencies.",
		},
		{
			toolName: "generate_pdf.validate_artifact",
			toolCallId: "agents-rfp-demo-generate-pdf-validate",
			label: "Validating artifact",
			content: "Checking placeholder coverage and the artifact contract before sharing the qualification DACI.",
			input: { checks: ["placeholders", "html-validity", "offline-dependencies"] },
			outputPreview: "Validated the qualification DACI artifact and saved it to the active Rovo thread.",
		},
	];
}

function buildAgentsRfpDemoAgentCreationTrace({ selectedKnowledge } = {}) {
	const knowledgeSeedFiles = getAgentsRfpDemoKnowledgeSeedFiles(selectedKnowledge);
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
			toolName: "agent_skill.load",
			toolCallId: "agents-rfp-demo-agent-load-create-agent",
			label: "Using agent-creator skill",
			content: "Loading the agent-creator skill to turn the completed RFP flow into a reusable Drafting agent.",
			input: { skill: "agent-creator", target: RFP_DEMO_AGENT_NAME, workflow: "Drafting" },
			outputPreview: "Loaded the agent-creator skill with the Drafting workflow, canonical agent file, and knowledge path context.",
			delayMs: RFP_DEMO_SKILL_TOOL_CALL_DELAY_MS,
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
			content: "Giving the agent deterministic demo access to Jira work items, attachments, Teamwork Graph account memory, the generate-pdf skill, and PDF draft attachment output.",
			input: { skills: ["generate-pdf"], tools: ["jira.work_items", "jira.attachments", "teamwork_graph.search", "generate_pdf.render_document", "jira.attach_pdf"] },
			outputPreview: "Tool set matches the completed RFP-101 report flow and produces ticket-specific PDF draft artifacts.",
		},
		{
			toolName: "agent.write_instructions",
			toolCallId: "agents-rfp-demo-agent-instructions",
			label: "Writing agent instructions",
			content: "Adding the description, conversation starters, and instructions to read each ticket context, generate a contextual PDF draft, comment with the ticket-specific handoff, and return work to a human reviewer.",
			input: {
				description: RFP_DEMO_AGENT_DESCRIPTION,
				conversationStarters: RFP_DEMO_AGENT_CONVERSATION_STARTERS,
				knowledgePath: ".agents/knowledge/rfp-drafting-agent/",
				selectedKnowledge: selectedKnowledge || undefined,
				seedFiles: knowledgeSeedFiles,
				output: "pdf-report",
				reviewColumn: "Review",
				assigneePolicy: "return-to-human-owner",
			},
			outputPreview: selectedKnowledge
				? `Profile metadata, instructions, and knowledge seed path preserve the user's ${selectedKnowledge} preference.`
				: "Profile metadata and instructions keep the flow event-triggered, backend-persisted, and bounded to the Enterprise RFP Response board.",
		},
		{
			toolName: "teamwork_graph.link_knowledge",
			toolCallId: "agents-rfp-demo-agent-knowledge",
			label: "Linking Teamwork Graph knowledge",
			content: "Connecting proposal memory, prior RFP language, Jira work-item context, and account-team ownership signals for the drafting flow.",
			input: {
				path: ".agents/knowledge/rfp-drafting-agent/",
				selectedKnowledge: selectedKnowledge || "Reusable answer library",
				seedFiles: knowledgeSeedFiles,
				sources: ["proposal memory", "prior RFP language", "Jira work items", "account-team ownership"],
			},
			outputPreview: selectedKnowledge
				? `${selectedKnowledge} will be added to the future custom agent knowledge setup.`
				: "Knowledge scope is limited to deterministic demo context so the agent can produce stable per-ticket drafts.",
		},
		{
			toolName: "agent_skill.load",
			toolCallId: "agents-rfp-demo-agent-load-create-automation",
			label: "Using create-automation skill",
			content: "Loading the create-automation skill to connect Drafting column events, rerun behavior, and the agent handoff.",
			input: { skill: "create-automation", trigger: "jira-column-entered", column: "Drafting" },
			outputPreview: "Loaded the create-automation skill for Drafting column event handling.",
			delayMs: RFP_DEMO_SKILL_TOOL_CALL_DELAY_MS,
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

function buildAgentsRfpDemoAgentResultPayload({ selectedKnowledge } = {}) {
	return {
		agentId: RFP_DEMO_AGENT_ID,
		name: RFP_DEMO_AGENT_NAME,
		description: RFP_DEMO_AGENT_DESCRIPTION,
		conversationStarters: RFP_DEMO_AGENT_CONVERSATION_STARTERS,
		assignedColumn: "Drafting",
		summary: "Ready to handle similar RFP work items",
		trigger: "On event: ticket enters Drafting.",
		knowledgePath: ".agents/knowledge/rfp-drafting-agent/",
		selectedKnowledge: selectedKnowledge || null,
		seedKnowledge: getAgentsRfpDemoKnowledgeSeedFiles(selectedKnowledge),
		tools: [
			"Jira work items",
			"Teamwork Graph",
			"generate-pdf reports",
			"PDF draft attachment",
		],
		guardrail: "Skips completed tickets on rerun and retries failed tickets later.",
		action: "create",
	};
}

function buildAgentsRfpDemoAgentCreationConfirmationText({ name = RFP_DEMO_AGENT_NAME } = {}) {
	return `Created **${name}** and added it to the Enterprise RFP Response project. It runs when a ticket enters Drafting, creates a visible Rovo thread, generates a contextual PDF draft, attaches the artifact, comments in Jira, and returns successful tickets to Review for a human owner.`;
}

function buildAgentsRfpDemoQualificationIntro() {
	return "I found enough Acmecorp context in RFP-101 to start the bid/no-bid analysis. Before I recommend whether we should respond, I need a few reusable RFP preferences so this work can also seed the custom agent later.";
}

function buildAgentsRfpDemoReportConfirmationText({ documentId, title = RFP_DEMO_REPORT_TITLE } = {}) {
	const resolvedDocumentId = getNonEmptyString(documentId) || "report";
	return `Generated **${title}** with the generate-pdf skill. [Open it in Rovo Canvas](#rovo-canvas-${encodeURIComponent(resolvedDocumentId)}) to review the embedded qualification DACI.`;
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
	extractAgentsRfpDemoSelectedKnowledge,
	getAgentsRfpDemoPreloadDelayMs,
	getAgentsRfpDemoToolCallDelayMs,
	getLatestUserMessageText,
	resolveAgentsRfpDemoChatTurn,
};
