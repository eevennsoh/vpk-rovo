/**
 * Rovo configuration helpers.
 *
 * Model routing/defaults are defined in backend AI Gateway helpers.
 * This module only owns user-message formatting for RovoDev chat calls.
 */

/**
 * Instruction appended to every RovoDev message so the agent uses the
 * structured `ask_user_questions` tool instead of plain-text questions.
 *
 * The backend intercepts `ask_user_questions` tool calls and renders
 * them as interactive question-card widgets in the chat UI.
 */
const REQUEST_USER_INPUT_INSTRUCTION = [
	"[Clarification Protocol]",
	"When you need to ask the user clarifying questions before proceeding (e.g. to gather requirements, preferences, or missing details), you MUST use the `ask_user_questions` tool instead of writing questions as plain text.",
	"The tool renders an interactive question card in the UI. Provide 2–4 questions, each with a short label, description, and 1–3 predefined options. The UI automatically appends a free-text option.",
	"Each option must be a specific, concrete answer to its question (e.g. site names, technologies, team names) — never generic labels like \"Quick\", \"Balanced\", or \"Detailed\".",
	"If you need clarification, call `ask_user_questions` FIRST, before running any other tools (invoke_subagents, get_skill, code search, or shell commands). After calling ask_user_questions, STOP and do not call any other tools — wait for the user's answers before proceeding.",
	"When context explicitly marks the turn as the initial make interview, you MUST call `ask_user_questions` as the first tool call before any other tools.",
	"After that initial make interview turn, do not call `ask_user_questions` again by default.",
	"Only ask follow-up questions when a hard blocker prevents progress.",
	"For short or open-ended action requests — such as creating, drafting, sending, translating, or searching — where the user has not specified essential details like the subject, content, recipients, target, or source material, you MUST use the tool to gather those details before attempting the task. Do not guess or proceed with fabricated inputs.",
	"Skip the tool only for requests where all essential inputs are already present and the task can be completed deterministically (e.g. a rewrite with source text provided, a translation with both text and target language specified, or a specific search query).",
	"When you call ask_user_questions, it will pause your execution. The user's answers will be returned as the tool result. Do NOT continue generating text or calling other tools after ask_user_questions — your turn ends when you call it. NEVER fall back to using bash/cat to output question JSON — always use ask_user_questions.",
	"[End Clarification Protocol]",
].join("\n");

const PLAN_DESCRIPTION_INSTRUCTION = [
	"[Plan Description Protocol]",
	"When calling create-plan (or any tool that produces a plan widget), keep the plan `description` field to a single short phrase — ideally under 60 characters.",
	"Describe the goal, not the implementation steps. Omit routing details, page paths, and technical specifics — those belong in task labels.",
	"Good examples: \"IT asset management page\", \"Refactor auth to use JWT\", \"Add dark mode support\".",
	"Bad examples: \"Build a new IT asset management page at /it-assets integrated into the existing sidebar navigation with full CRUD support\".",
	"[End Plan Description Protocol]",
].join("\n");

const GENUI_SPEC_INSTRUCTION = [
	"[Interactive Visual UI Protocol]",
	"When answering knowledge or explanatory requests that would benefit from visual presentation (summaries, comparisons, status overviews, data displays, timelines, dashboards), emit a ```spec code fence with JSONL RFC 6902 JSON Patch lines to render an interactive UI card inline in the chat.",
	"",
	"Output format: first write 1-3 sentences of explanation, then emit one ```spec block:",
	"```spec",
	'{"op":"add","path":"/root","value":"main"}',
	'{"op":"add","path":"/elements/main","value":{"type":"Stack","props":{"gap":"md"},"children":["heading","content"]}}',
	'{"op":"add","path":"/elements/heading","value":{"type":"Heading","props":{"text":"Title","level":"h2"},"children":[]}}',
	'{"op":"add","path":"/elements/content","value":{"type":"Text","props":{"content":"Body text"}}}',
	"```",
	"",
	"Key components: Stack (layout), Card (container), Heading, Text, Metric (KPI), Table (data), BarChart/LineChart/PieChart (charts), Lozenge (status), Badge (priority), Tag (labels), Timeline (events), Tabs/TabContent (navigation), Avatar (people), Alert/SectionMessage (notices).",
	"",
	"Rules:",
	"- First patch must set /root. Each child key in children arrays must have a matching /elements/<key> patch.",
	"- Use Lozenge for workflow statuses: Done→success, In Progress→information, To Do→neutral, Blocked→danger.",
	"- For Atlassian data (Jira work items, Confluence pages): ALWAYS emit a spec. Use Table for multiple items, Card for single items, Timeline for activity feeds.",
	"- Say 'Work Items' not 'Issues'. Say 'Pages' not 'Confluence Pages'.",
	"- Do NOT emit a spec for simple greetings, yes/no answers, or short factual replies. Only use specs when visual structure adds value.",
	"[End Interactive Visual UI Protocol]",
].join("\n");

const FIGMA_CLARIFICATION_INSTRUCTION = [
	"[Figma Tool Protocol]",
	"When the user mentions Figma, design context, or asks about a Figma design, you MUST first use the `ask_user_questions` tool to gather the following before calling any Figma MCP tools:",
	"- Question 1: \"Which Figma file should I look at?\" — Ask for the Figma URL or file key. Provide options if you can infer likely files from context.",
	"- Question 2: \"What would you like me to do with this design?\" — Offer options like: \"Extract design specs\", \"Generate implementation code\", \"Review layout and spacing\", \"Extract design tokens\".",
	"Only after the user answers these questions should you call `get_design_context`, `get_screenshot`, or other Figma MCP tools with the provided details.",
	"Do NOT call Figma MCP tools without first collecting the Figma URL from the user.",
	"[End Figma Tool Protocol]",
].join("\n");

const PLAIN_CHAT_INSTRUCTION = [
	"[Plain Chat Mode]",
	"This is a simple conversational turn. Respond directly, briefly, and naturally.",
	"Do not call tools unless the user explicitly asks for an action that requires them.",
	"Do not emit plans, widgets, or specs for greetings, acknowledgements, or small talk.",
	"[End Plain Chat Mode]",
].join("\n");

const rovodevSiteUrl = process.env.ROVODEV_SITE_URL || "https://hello.atlassian.net";

const LAST_7_DAYS_WORK_INSTRUCTION = [
	"[Work Summary Scope]",
	"For this request, gather the user's last-7-days work activity across both Atlassian sites.",
	`- Jira site_url: "https://product-fabric.atlassian.net"`,
	`- Confluence site_url: "${rovodevSiteUrl}"`,
	"Choose the tools needed to fetch Jira and Confluence activity for these sites. Do not assume a fixed tool path.",
	"If one site has no results or errors, continue with the other site and clearly report coverage and gaps.",
	"Merge and deduplicate activity before responding.",
	"[End Work Summary Scope]",
].join("\n");

const STANDUP_SUMMARY_INSTRUCTION = [
	"[Standup Summary Protocol]",
	"For this request, generate a daily standup summary from the user's Jira activity.",
	`Use site_url: "https://product-fabric.atlassian.net".`,
	"Search for Jira work items assigned to the current user updated in the last 24 hours using JQL: assignee = currentUser() AND updated >= -24h ORDER BY updated DESC",
	"Classify each work item into one of three buckets based on its status:",
	'- **Done**: statuses containing "done", "closed", "resolved", "completed", "merged", "released", "shipped"',
	'- **In Progress**: statuses containing "in progress", "in review", "in development", "ready for", "active", "open"',
	'- **Blockers**: statuses containing "blocked", "on hold", "needs refinement", "impediment", "waiting", "escalated"',
	"Present the summary in Done / Doing / Blockers format with:",
	"1. A metrics row showing counts for each bucket",
	"2. Grouped work item lists with status lozenges, priority badges, and links",
	"3. If no work items are found, show a friendly empty state message",
	"Use Lozenge variants: success for Done, information for In Progress, danger for Blockers.",
	"[End Standup Summary Protocol]",
].join("\n");

const STANDUP_PATTERN = /\b(standup|stand[\s-]?up|daily\s+summary|daily\s+standup|standup\s+summary)\b/i;
const STANDUP_CONTEXT_PATTERN = /\b(jira|work\s+items?|activity|status|what\s+did\s+i|what\s+i\s+did|my\s+updates?)\b/i;

const TICKET_CLASSIFIER_INSTRUCTION = [
	"[Ticket Classifier Protocol]",
	"For this request, classify and route incoming support tickets from Jira.",
	`Use site_url: "https://product-fabric.atlassian.net".`,
	'Search for open support tickets using JQL: project = "SUPPORT" AND status NOT IN ("Done", "Closed", "Resolved") ORDER BY created DESC',
	"For each ticket, classify it into one of six product area categories based on its summary, description, labels, and components:",
	'- **Billing**: keywords like "invoice", "payment", "charge", "subscription", "refund", "pricing"',
	'- **Account**: keywords like "login", "password", "SSO", "permissions", "access", "MFA"',
	'- **Technical**: keywords like "bug", "error", "crash", "performance", "timeout", "outage"',
	'- **Onboarding**: keywords like "setup", "getting started", "tutorial", "configuration"',
	'- **API / Integration**: keywords like "API", "webhook", "REST", "endpoint", "SDK", "OAuth"',
	'- **Documentation**: keywords like "docs", "guide", "how to", "instructions", "FAQ"',
	"Also infer a priority (P1–P4) from the Jira priority and urgency keywords in the text.",
	"For each classified ticket, present:",
	"1. A rich card with the ticket key, summary, category Lozenge, priority Badge, and confidence score",
	"2. Suggested team for routing (do NOT auto-assign)",
	"3. If confidence is below 50%, show a low-confidence warning",
	"Use Lozenge variants: warning for Billing, discovery for Account, danger for Technical, success for Onboarding, accent-teal for API/Integration, information for Documentation.",
	"[End Ticket Classifier Protocol]",
].join("\n");

const TICKET_CLASSIFIER_PATTERN = /\b(classify|categorize|triage|route|sort)\s+.{0,20}\b(ticket|support|request|incident)s?\b/i;
const TICKET_CLASSIFIER_DIRECT_PATTERN = /\b(ticket\s+classif|support\s+ticket|triage\s+ticket|classify\s+.*ticket|route\s+.*ticket|incoming\s+ticket)/i;

const LAST_7_DAYS_WINDOW_PATTERN = /\b(?:last|past)\s+7\s+days?\b|\b7[-\s]?day\b|\blast\s+week\b/i;
const WORK_SUMMARY_PATTERN = /\b(work|activity|summary|updates?)\b/i;

function isStandupSummaryPrompt(message) {
	if (typeof message !== "string" || message.trim().length === 0) {
		return false;
	}

	// Direct standup request (e.g. "summarize my standup", "daily standup")
	if (STANDUP_PATTERN.test(message)) {
		return true;
	}

	// Contextual standup request (e.g. "what did I do today in Jira")
	const hasTodayContext = /\b(today|yesterday|this\s+morning|last\s+24|past\s+24)\b/i.test(message);
	return hasTodayContext && STANDUP_CONTEXT_PATTERN.test(message);
}

function hasStandupGuardrail(contextDescription) {
	if (typeof contextDescription !== "string" || contextDescription.trim().length === 0) {
		return false;
	}

	return (
		contextDescription.includes("[Standup Summary Protocol]") &&
		contextDescription.includes("product-fabric.atlassian.net")
	);
}

function isTicketClassifierPrompt(message) {
	if (typeof message !== "string" || message.trim().length === 0) {
		return false;
	}

	// Direct classifier request (e.g. "classify my support tickets", "triage incoming tickets")
	if (TICKET_CLASSIFIER_PATTERN.test(message)) {
		return true;
	}

	// Alternative phrasing (e.g. "support ticket classification", "route incoming tickets")
	if (TICKET_CLASSIFIER_DIRECT_PATTERN.test(message)) {
		return true;
	}

	return false;
}

function hasTicketClassifierGuardrail(contextDescription) {
	if (typeof contextDescription !== "string" || contextDescription.trim().length === 0) {
		return false;
	}

	return (
		contextDescription.includes("[Ticket Classifier Protocol]") &&
		contextDescription.includes("product-fabric.atlassian.net")
	);
}

function isSevenDayWorkSummaryPrompt(message) {
	if (typeof message !== "string" || message.trim().length === 0) {
		return false;
	}

	return (
		LAST_7_DAYS_WINDOW_PATTERN.test(message) &&
		WORK_SUMMARY_PATTERN.test(message)
	);
}

function hasLast7DaysWorkGuardrail(contextDescription) {
	if (typeof contextDescription !== "string" || contextDescription.trim().length === 0) {
		return false;
	}

	return (
		contextDescription.includes("[Work Summary Scope]") &&
		contextDescription.includes("https://product-fabric.atlassian.net") &&
		contextDescription.includes(rovodevSiteUrl)
	);
}

function resolvePromptSpecificInstruction(message, contextDescription) {
	// Standup summary (check first — more specific than 7-day work summary)
	if (hasStandupGuardrail(contextDescription)) {
		return null;
	}
	if (isStandupSummaryPrompt(message)) {
		return STANDUP_SUMMARY_INSTRUCTION;
	}

	// Ticket classifier
	if (hasTicketClassifierGuardrail(contextDescription)) {
		return null;
	}
	if (isTicketClassifierPrompt(message)) {
		return TICKET_CLASSIFIER_INSTRUCTION;
	}

	// 7-day work summary
	if (hasLast7DaysWorkGuardrail(contextDescription)) {
		return null;
	}
	if (isSevenDayWorkSummaryPrompt(message)) {
		return LAST_7_DAYS_WORK_INSTRUCTION;
	}

	return null;
}

/**
 * System message sent to RovoDev when the user skips/dismisses a
 * Question Card without providing answers. RovoDev can then decide
 * whether to ask differently, proceed with caveats, or explain why
 * more context is needed.
 *
 * @param {string} [questionTitle] - The title of the dismissed Question Card.
 * @returns {string} The skip notification message.
 */
function buildQuestionCardSkipNotification(questionTitle) {
	const titleContext = questionTitle
		? ` (titled "${questionTitle}")`
		: "";
	return [
		"[Question Card Dismissed]",
		`The user skipped the clarification question card${titleContext} without providing answers.`,
		"You may either:",
		"1. Explain what specific information you need and why it matters, then offer a simpler way to provide it.",
		"2. Proceed with reasonable default assumptions and clearly state what assumptions you are making.",
		"Choose the approach that best serves the user's original request.",
		"[End Question Card Dismissed]",
	].join("\n");
}

function getInstructionBlocksForProfile(profile, promptSpecificInstruction) {
	if (profile === "plain-chat") {
		return [PLAIN_CHAT_INSTRUCTION, promptSpecificInstruction];
	}

	return [
		REQUEST_USER_INPUT_INSTRUCTION,
		PLAN_DESCRIPTION_INSTRUCTION,
		GENUI_SPEC_INSTRUCTION,
		FIGMA_CLARIFICATION_INSTRUCTION,
		promptSpecificInstruction,
	];
}

function getConversationHistoryForProfile(profile, conversationHistory) {
	if (!Array.isArray(conversationHistory) || conversationHistory.length === 0) {
		return [];
	}

	if (profile === "plain-chat") {
		return conversationHistory.slice(-4);
	}

	return conversationHistory;
}

/**
 * Formats user message with conversation history for RovoDev.
 * RovoDev handles all system prompts and widget protocol.
 */
function buildUserMessage(
	message,
	conversationHistory,
	contextDescription,
	options = {},
) {
	const profile = options?.profile === "plain-chat" ? "plain-chat" : "default";
	const promptSpecificInstruction = resolvePromptSpecificInstruction(
		message,
		contextDescription
	);
	const instructions = getInstructionBlocksForProfile(
		profile,
		promptSpecificInstruction
	)
		.filter((entry) => typeof entry === "string" && entry.trim().length > 0)
		.join("\n\n");
	const combinedContext = contextDescription
		? `${contextDescription}\n\n${instructions}`
		: instructions;
	const baseMessage = `${combinedContext}\n\nUser question: ${message}`;
	const resolvedConversationHistory = getConversationHistoryForProfile(
		profile,
		conversationHistory
	);

	if (resolvedConversationHistory.length > 0) {
		return `Previous conversation context:\n${resolvedConversationHistory.map((msg) => `${msg.type === "user" ? "User" : "Assistant"}: ${msg.content}`).join("\n")}\n\nCurrent question: ${baseMessage}`;
	}

	return baseMessage;
}

module.exports = {
	buildUserMessage,
	buildQuestionCardSkipNotification,
};
