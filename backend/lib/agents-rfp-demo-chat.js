const RFP_101_CONTEXT_PATTERN = /\[Active Jira Work Item Context\][\s\S]*\bKey:\s*RFP-101\b[\s\S]*\[End Active Jira Work Item Context\]/;
const RFP_DEMO_AGENT_CREATION_CONTEXT_PATTERN = /\[Agents RFP Demo Local State\][\s\S]*Report stage:\s*attached\.[\s\S]*Custom agent:\s*not created\.[\s\S]*(?:Trigger:\s*none\.[\s\S]*)?\[End Agents RFP Demo Local State\]/;
const OMNI_101_CONTEXT_PATTERN = /\[Active Jira Work Item Context\][\s\S]*\bKey:\s*OMNI-101\b[\s\S]*\[End Active Jira Work Item Context\]/;
const AGENTS2_OMNI_LIVE_AGENT_CREATION_CONTEXT_PATTERN = /\[Agents VoiceMate Creation Request\][\s\S]*Board:\s*Omni Live Launch\.[\s\S]*Column:\s*Outline Drafting\.[\s\S]*\[End Agents VoiceMate Creation Request\]/;
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
const RFP_DEMO_TOOL_CALL_DELAY_MIN_MS = 1000;
const RFP_DEMO_TOOL_CALL_DELAY_MAX_MS = 3000;
const RFP_DEMO_SKILL_TOOL_CALL_DELAY_MS = 4500;
const RFP_DEMO_QUALIFICATION_PRELOAD_DELAY_MS = 2000;
const RFP_DEMO_REPORT_TITLE = "Acmecorp RFP qualification DACI";
const RFP_DEMO_REPORT_PREVIEW_SUMMARY = "PDF-ready one-pager for RFP-101 with bid/no-bid recommendation, DACI roles, stakeholder relationship, budget qualification, campaign fit, competitive advantages, risks, and open gaps.";
const AGENTS2_OMNI_LIVE_OUTLINE_TITLE = "Omni Live landing-page outline";
const AGENTS2_OMNI_LIVE_OUTLINE_PREVIEW_SUMMARY = "HTML one-pager landing-page outline for OMNI-101 with hero demo thesis, audience, pain, positioning, section outline, proof points, CTA, launch timeline, consent/trust notes, and content gaps.";
const AGENTS2_OMNI_LIVE_AGENT_ID = "voicemate-agent";
const AGENTS2_OMNI_LIVE_AGENT_NAME = "VoiceMate";
const AGENTS2_OMNI_LIVE_AGENT_DESCRIPTION =
	"Drafts landing-page outlines from company brand guide, voice and tone, launch milestones, demo goals, and consent requirements.";
const AGENTS2_OMNI_LIVE_AGENT_CONVERSATION_STARTERS = [
	"Draft the Omni Live landing-page outline.",
	"Flag missing brand or proof inputs before Experience Build.",
	"Summarize launch milestones and consent notes for this page.",
];

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

function hasOmni101Context(requestBody) {
	return OMNI_101_CONTEXT_PATTERN.test(getNonEmptyString(requestBody?.contextDescription) || "");
}

function hasAgents2OmniLiveAgentCreationContext(requestBody) {
	return AGENTS2_OMNI_LIVE_AGENT_CREATION_CONTEXT_PATTERN.test(
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

function isAgents2OmniLiveOutlinePrompt(prompt) {
	const normalizedPrompt = getNonEmptyString(prompt);
	if (!normalizedPrompt) {
		return false;
	}

	if (
		/\bclarification answers\b/i.test(normalizedPrompt) &&
		/\b(?:landing[-\s]?page|html mockup|html|outline|one[-\s]?pager|brief)\b/i.test(normalizedPrompt)
	) {
		return true;
	}

	return (
		/\b(generate|create|write|make|build|draft|prepare|compose|render|produce)\b/i.test(normalizedPrompt) &&
		/\b(?:omni live|landing[-\s]?page|outline|one[-\s]?pager|content brief|vpk-html|html)\b/i.test(normalizedPrompt) &&
		/\b(?:outline|one[-\s]?pager|brief|html|artifact|document|page)\b/i.test(normalizedPrompt)
	);
}

function isAgents2OmniLiveAgentCreationPrompt(prompt, requestBody) {
	if (requestBody?.creationMode !== "agent" || !getNonEmptyString(prompt)) {
		return false;
	}

	return (
		/\bvoicemate\b/i.test(prompt) &&
		/\b(?:landing[-\s]?page|outline|omni live|launch)\b/i.test(prompt)
	);
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

function resolveAgents2OmniLiveChatTurn(requestBody) {
	if (!requestBody || typeof requestBody !== "object") {
		return null;
	}

	const prompt = getLatestUserMessageText(requestBody.messages);
	if (
		hasAgents2OmniLiveAgentCreationContext(requestBody) &&
		isAgents2OmniLiveAgentCreationPrompt(prompt, requestBody)
	) {
		return "omni-agent-creation";
	}

	if (!hasOmni101Context(requestBody)) {
		return null;
	}

	if (requestBody.clarification && typeof requestBody.clarification === "object") {
		return "omni-outline-create";
	}

	return isAgents2OmniLiveOutlinePrompt(prompt) ? "omni-outline-create" : null;
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
		title: "Qualify the Acmecorp RFP",
		description: "I have the ticket context and attachments. These inputs keep the bid/no-bid recommendation and DACI roles accurate.",
		directive: "Answer what you know. I will mark unknowns as assumptions or review-required.",
		questions: [
			{
				id: "budget",
				label: "Has Acmecorp budget been qualified?",
				description: "Used to decide whether the pursuit deserves a full response effort.",
				required: true,
				kind: "single-select",
				placeholder: "Use a different budget signal",
				options: [
					{ id: "qualified-strategic", label: "Qualified strategic budget", recommended: true },
					{ id: "unconfirmed-budget", label: "Budget not confirmed" },
					{ id: "budget-risk", label: "Budget likely constrained" },
				],
			},
			{
				id: "stakeholder-relationship",
				label: "How strong is our Acmecorp stakeholder relationship?",
				required: true,
				kind: "single-select",
				options: [
					{ id: "executive-and-champion", label: "Executive sponsor and champion", recommended: true },
					{ id: "working-team-only", label: "Working team access only" },
					{ id: "procurement-led", label: "Procurement-led with limited access" },
				],
			},
			{
				id: "campaign-fit",
				label: "Does Acmecorp match our current campaign?",
				required: true,
				kind: "single-select",
				options: [
					{ id: "strong-fit", label: "Strong enterprise service campaign fit", recommended: true },
					{ id: "partial-fit", label: "Partial fit, needs qualification" },
					{ id: "weak-fit", label: "Weak campaign fit" },
				],
			},
			{
				id: "competitive-position",
				label: "What is our competitive position?",
				required: true,
				kind: "single-select",
				options: [
					{ id: "clear-advantages", label: "Clear Atlassian advantages", recommended: true },
					{ id: "incumbent-favored", label: "Incumbent appears favored" },
					{ id: "unknown-position", label: "Competitive position unknown" },
				],
			},
			{
				id: "review-posture",
				label: "Which review posture should the DACI show?",
				required: true,
				kind: "multi-select",
				options: [
					{ id: "deal-desk-approval", label: "Deal desk approval required", recommended: true },
					{ id: "legal-security-review", label: "Legal and security review required", recommended: true },
					{ id: "product-validation", label: "Product validation required", recommended: true },
					{ id: "partner-coverage", label: "Partner coverage may be needed" },
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
			content: "Asking for the Acmecorp budget, stakeholder, campaign fit, competitive, and review posture details needed before recommending whether to respond.",
			input: { sessionId: RFP_DEMO_QUESTION_SESSION_ID, round: 1, questions: 5 },
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
			outputPreview: "Assumptions captured for Acmecorp budget qualification, stakeholder relationship, campaign fit, competitive position, and review-required legal/security posture.",
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
			toolName: "agent_skill.load",
			toolCallId: "agents-rfp-demo-agent-load-create-agent",
			label: "Using create-agent skill",
			content: "Loading the create-agent skill to turn the completed RFP-101 flow into a reusable Drafting agent.",
			input: { skill: "create-agent", target: RFP_DEMO_AGENT_NAME, workflow: "Drafting" },
			outputPreview: "Loaded the create-agent skill with the Drafting workflow context.",
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
				output: "pdf-report",
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
	return "I found enough Acmecorp context in RFP-101 to start the bid/no-bid analysis. Before I recommend whether we should respond, I need a few qualification details so the DACI does not overstate budget, stakeholder, legal, or security posture.";
}

function buildAgentsRfpDemoReportConfirmationText({ documentId, title = RFP_DEMO_REPORT_TITLE } = {}) {
	const resolvedDocumentId = getNonEmptyString(documentId) || "report";
	return `Generated **${title}** with the generate-pdf skill. [Open it in Rovo Canvas](#rovo-canvas-${encodeURIComponent(resolvedDocumentId)}) to review the embedded qualification DACI.`;
}

function buildAgents2OmniLiveOutlineTrace() {
	return [
		{
			toolName: "jira.read_work_item",
			toolCallId: "agents2-omni-live-read-omni-101",
			label: "Reading OMNI-101",
			content: "Loading the active Omni Live work item, subtasks, launch dates, labels, attachments, and modal context.",
			input: { key: "OMNI-101", include: ["description", "subtasks", "attachments", "activity"] },
			outputPreview: "OMNI-101 is the live-demo-first landing-page narrative for Omni Live, anchored on voice loop, camera feed, agentic action, and May 28 / June 18 / July 9 launch milestones.",
		},
		{
			toolName: "jira.scan_attachments",
			toolCallId: "agents2-omni-live-scan-assets",
			label: "Scanning launch inputs",
			content: "Checking brand guide, voice and tone brief, launch brief, and early landing-page outline attachments.",
			input: {
				key: "OMNI-101",
				attachments: [
					"omni-live-brand-guide.pdf",
					"voice-and-tone-brief.docx",
					"omni-live-launch-brief.pdf",
					"landing-page-outline-inputs.xlsx",
				],
			},
			outputPreview: "Found product story, demo-first mandate, audience notes, preview/beta/GA milestones, and unresolved consent-control language.",
		},
		{
			toolName: "teamwork_graph.search",
			toolCallId: "agents2-omni-live-search-memory",
			label: "Searching launch memory",
			content: "Looking for Omni Live positioning, developer preview guidance, enterprise trust requirements, demo goals, and partner integration notes.",
			input: { product: "Omni Live", topics: ["voice loop", "camera feed", "agentic action", "launch milestones", "consent controls"] },
			outputPreview: "Returned the sees-hears-acts positioning, live demo proof points, preview/beta/GA rollout guidance, and enterprise trust guardrails.",
		},
		{
			toolName: "omni.map_page_story",
			toolCallId: "agents2-omni-live-map-page-story",
			label: "Mapping page story",
			content: "Structuring the landing-page outline so the live demo makes the multimodal value tangible before explaining differentiation.",
			input: { sections: ["hero demo", "fragmented AI pain", "positioning", "proof points", "timeline", "trust", "CTA"] },
			outputPreview: "Page story starts with the continuous live demo, moves into fragmented mode pain, then explains how Omni Live sees, hears, and acts in one stream.",
		},
		{
			toolName: "omni.check_content_gaps",
			toolCallId: "agents2-omni-live-check-gaps",
			label: "Checking content gaps",
			content: "Identifying missing inputs VoiceMate should flag before Experience Build.",
			input: { key: "OMNI-101", requiredInputs: ["brand voice", "demo clips", "consent language", "partner integration claims"] },
			outputPreview: "Flagged final brand voice examples, continuous live demo sequence, and legally reviewed consent-control wording as content gaps.",
		},
		{
			toolName: "agent_skill.load",
			toolCallId: "agents2-omni-live-load-generate-html",
			label: "Using generate-html skill",
			content: "Selecting the generate-html skill backed by the repo-local one-pager template for a concise landing-page outline/content brief.",
			input: { skill: "generate-html", template: "assets/templates/one-pager.html", artifactKind: "landing-page-outline" },
			outputPreview: "Loaded the generate-html one-pager contract for a self-contained HTML artifact with deterministic fallback fields.",
			delayMs: RFP_DEMO_SKILL_TOOL_CALL_DELAY_MS,
		},
		{
			toolName: "generate_html.distill_fields",
			toolCallId: "agents2-omni-live-generate-html-distill-fields",
			label: "Distilling outline fields",
			content: "Converting OMNI-101 context into hero demo thesis, audience, pain, positioning, proof points, CTA, timeline, trust notes, and gaps.",
			input: { key: "OMNI-101", reportKind: "landing-page-outline", factPolicy: "mark gaps" },
			outputPreview: "Prepared structured landing-page outline fields without turning the brief into a finished landing page implementation.",
		},
		{
			toolName: "generate_html.render_one_pager",
			toolCallId: "agents2-omni-live-generate-html-render-outline",
			label: "Rendering one-pager",
			content: "Rendering the Omni Live landing-page outline as a generate-html one-pager artifact.",
			input: { title: AGENTS2_OMNI_LIVE_OUTLINE_TITLE, kind: "html", dependencies: "inline-only" },
			outputPreview: "Rendered the one-pager with embedded styles and no remote runtime dependencies.",
		},
		{
			toolName: "generate_html.validate_artifact",
			toolCallId: "agents2-omni-live-generate-html-validate-outline",
			label: "Validating outline artifact",
			content: "Checking placeholders, offline dependencies, and required outline sections before sharing the artifact.",
			input: { checks: ["placeholders", "html-validity", "offline-dependencies", "content-gaps"] },
			outputPreview: "Validated the Omni Live landing-page outline and saved it to the active Rovo thread.",
		},
	];
}

function buildAgents2OmniLiveAgentCreationTrace() {
	return [
		{
			toolName: "jira.inspect_board_column",
			toolCallId: "agents2-omni-live-agent-inspect-outline-drafting",
			label: "Inspecting Outline Drafting",
			content: "Reading the Outline Drafting column, OMNI-101 context, and related launch work items to scope VoiceMate.",
			input: { board: "Omni Live Launch", column: "Outline Drafting", include: ["OMNI-101", "OMNI-102", "OMNI-103"] },
			outputPreview: "Outline Drafting has repeatable launch-content prep: read brand inputs, map page story, flag gaps, attach outline, and move ready work to Experience Build.",
		},
		{
			toolName: "agent_skill.load",
			toolCallId: "agents2-omni-live-agent-load-create-agent",
			label: "Using create-agent skill",
			content: "Loading the create-agent skill to turn the OMNI-101 outline flow into a reusable VoiceMate agent.",
			input: { skill: "create-agent", target: AGENTS2_OMNI_LIVE_AGENT_NAME, workflow: "Outline Drafting" },
			outputPreview: "Loaded the create-agent skill with the Outline Drafting workflow context.",
			delayMs: RFP_DEMO_SKILL_TOOL_CALL_DELAY_MS,
		},
		{
			toolName: "agent.define_trigger",
			toolCallId: "agents2-omni-live-agent-define-trigger",
			label: "Defining agent trigger",
			content: "Setting VoiceMate to activate when an Omni Live work item enters Outline Drafting.",
			input: { board: "Omni Live Launch", column: "Outline Drafting", signal: "jira-column-entered" },
			outputPreview: "Trigger scoped to Outline Drafting tickets so VoiceMate handles launch outline work without interrupting unrelated tasks.",
		},
		{
			toolName: "agent.configure_tools",
			toolCallId: "agents2-omni-live-agent-configure-tools",
			label: "Adding tools and skills",
			content: "Giving VoiceMate deterministic demo access to Jira work items, attachments, Teamwork Graph launch memory, generate-html, and ticket attachment output.",
			input: { skills: ["generate-html"], tools: ["jira.work_items", "jira.attachments", "teamwork_graph.search", "generate_html.render_one_pager", "jira.attach_html"] },
			outputPreview: "Tool set matches the completed OMNI-101 outline flow and produces ticket-specific HTML one-pager outlines.",
		},
		{
			toolName: "agent.write_instructions",
			toolCallId: "agents2-omni-live-agent-instructions",
			label: "Writing agent instructions",
			content: "Adding the description, conversation starters, and instructions to read each ticket context, draft a landing-page outline, flag gaps, attach the artifact, and move ready tickets forward.",
			input: {
				description: AGENTS2_OMNI_LIVE_AGENT_DESCRIPTION,
				conversationStarters: AGENTS2_OMNI_LIVE_AGENT_CONVERSATION_STARTERS,
				output: "landing-page-outline",
				reviewColumn: "Experience Build",
				assigneePolicy: "return-to-human-owner",
			},
			outputPreview: "Profile metadata and instructions keep VoiceMate event-triggered, context-bound, and scoped to Omni Live launch work.",
		},
		{
			toolName: "teamwork_graph.link_knowledge",
			toolCallId: "agents2-omni-live-agent-knowledge",
			label: "Linking launch knowledge",
			content: "Connecting brand guide, voice and tone, launch milestones, demo goals, audience needs, and consent/trust requirements.",
			input: { sources: ["brand guide", "voice and tone", "launch milestones", "demo goals", "consent requirements"] },
			outputPreview: "Knowledge scope is limited to deterministic Omni Live demo context so VoiceMate can produce stable per-ticket outlines.",
		},
		{
			toolName: "agent_skill.load",
			toolCallId: "agents2-omni-live-agent-load-create-automation",
			label: "Using create-automation skill",
			content: "Loading the create-automation skill to connect Outline Drafting column events, rerun behavior, and the VoiceMate handoff.",
			input: { skill: "create-automation", trigger: "jira-column-entered", column: "Outline Drafting" },
			outputPreview: "Loaded the create-automation skill for Outline Drafting event handling.",
			delayMs: RFP_DEMO_SKILL_TOOL_CALL_DELAY_MS,
		},
		{
			toolName: "agent.define_rerun_policy",
			toolCallId: "agents2-omni-live-agent-rerun-policy",
			label: "Setting rerun policy",
			content: "Skipping tickets that already have a VoiceMate outline and retrying failed Outline Drafting tickets on later event runs.",
			input: { skipWhen: ["generated-html", "agent-comment"], retryWhen: ["agentStatus=failed"] },
			outputPreview: "Completed tickets are idempotent on rerun, and failed tickets remain retryable without blocking other launch work.",
		},
		{
			toolName: "agent.persist_definition",
			toolCallId: "agents2-omni-live-agent-persist",
			label: `Creating ${AGENTS2_OMNI_LIVE_AGENT_NAME}`,
			content: "Saving the VoiceMate definition, selecting it for chat, and assigning it to the Outline Drafting workflow.",
			input: { agentId: AGENTS2_OMNI_LIVE_AGENT_ID, name: AGENTS2_OMNI_LIVE_AGENT_NAME, assignedColumn: "Outline Drafting" },
			outputPreview: "VoiceMate is ready for Outline Drafting work items and selected for the current Rovo session.",
		},
	];
}

function buildAgents2OmniLiveAgentResultPayload() {
	return {
		agentId: AGENTS2_OMNI_LIVE_AGENT_ID,
		name: AGENTS2_OMNI_LIVE_AGENT_NAME,
		description: AGENTS2_OMNI_LIVE_AGENT_DESCRIPTION,
		conversationStarters: AGENTS2_OMNI_LIVE_AGENT_CONVERSATION_STARTERS,
		assignedColumn: "Outline Drafting",
		summary: "Ready to handle similar Omni Live launch work items",
		trigger: "On event: ticket enters Outline Drafting.",
		tools: [
			"Jira work items",
			"Teamwork Graph",
			"generate-html one-pagers",
			"HTML outline attachment",
		],
		guardrail: "Skips completed tickets on rerun and retries failed tickets later.",
		action: "create",
	};
}

function buildAgents2OmniLiveAgentCreationConfirmationText({ name = AGENTS2_OMNI_LIVE_AGENT_NAME } = {}) {
	return `Created **${name}** and added it to the Omni Live Launch project. It runs when a ticket enters Outline Drafting, drafts a generate-html landing-page outline, flags missing brand or proof inputs, attaches the HTML one-pager, comments in Jira, and moves ready work toward Experience Build.`;
}

function buildAgents2OmniLiveOutlineConfirmationText({ documentId, title = AGENTS2_OMNI_LIVE_OUTLINE_TITLE } = {}) {
	const resolvedDocumentId = getNonEmptyString(documentId) || "outline";
	return `Generated **${title}** with the generate-html skill. [Open it in Rovo Canvas](#rovo-canvas-${encodeURIComponent(resolvedDocumentId)}) to review the HTML one-pager content brief.`;
}

module.exports = {
	AGENTS2_OMNI_LIVE_AGENT_ID,
	AGENTS2_OMNI_LIVE_AGENT_NAME,
	AGENTS2_OMNI_LIVE_OUTLINE_PREVIEW_SUMMARY,
	AGENTS2_OMNI_LIVE_OUTLINE_TITLE,
	RFP_DEMO_REPORT_PREVIEW_SUMMARY,
	RFP_DEMO_REPORT_TITLE,
	RFP_DEMO_QUESTION_SESSION_ID,
	RFP_DEMO_QUESTION_TOOL_CALL_ID,
	buildAgents2OmniLiveAgentCreationConfirmationText,
	buildAgents2OmniLiveAgentCreationTrace,
	buildAgents2OmniLiveAgentResultPayload,
	buildAgents2OmniLiveOutlineConfirmationText,
	buildAgents2OmniLiveOutlineTrace,
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
	resolveAgents2OmniLiveChatTurn,
	resolveAgentsRfpDemoChatTurn,
};
