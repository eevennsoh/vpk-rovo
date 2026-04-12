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
	"Do NOT include an option that tells the user to use the free-text field (e.g. \"I'll describe it now\", \"I'll type it out\", \"Let me provide details\"). Every option must be a concrete, pre-composed answer — never a meta-reference to the input method.",
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
	"Output format: first write 1-3 sentences of explanation, then emit exactly one ```spec block:",
	"```spec",
	'{"op":"add","path":"/root","value":"main"}',
	'{"op":"add","path":"/elements/main","value":{"type":"Stack","props":{"gap":"md"},"children":["heading","content"]}}',
	'{"op":"add","path":"/elements/heading","value":{"type":"Heading","props":{"text":"Title","level":"h2"},"children":[]}}',
	'{"op":"add","path":"/elements/content","value":{"type":"Text","props":{"content":"Body text"}}}',
	"```",
	"",
	"Available components: Stack (direction, gap, align, justify, padding, wrap), Card (title, description, href), Grid (columns: 1-4, gap), Heading (text, level: h1-h4), Text (content, muted, size), Metric (label, value, detail, trend: up/down/neutral), Table (data, columns: [{key,label}]), Badge (text, variant), Alert (title, description, variant), Lozenge (text, variant, isBold), Tag (text, variant, color), Timeline (items: [{title,description,date,status}]), CalendarTimeline (events: [{time,title,duration,location,color,status}]), Tabs (tabs: [{value,label}], defaultValue), TabContent (value), Avatar (src, fallback, size), Link (text, href), Separator, EmptyState (title, description), SectionMessage (title, description, appearance), Comment (author, avatarSrc, time, content), PageHeader (title, description), Progress (value, max, label), ProgressTracker (steps: [{id,label,state}]), Accordion (items: [{title,content}]), Collapsible (title, defaultOpen), Breadcrumb (items: [{label,href}]), Button (label, variant, size, disabled), TextInput (placeholder, value, label, type), TextArea (placeholder, value, label, rows), SelectInput (options, value, placeholder, label), Checkbox (checked, label), Switch (checked, label, size), Slider (value, min, max, step, label), RadioGroup (options, value, label), DatePicker (value, placeholder, label), Dialog (triggerLabel, title, description, size), Image (src, alt, width, height), Code (text), CodeBlock (code, language), Spinner (size, label), Skeleton (width, height), MapWidget (center: {lat,lng}, zoom, height, markers: [{id,lat,lng,title,description}]), WorkSummary (jiraItems: [{key,summary,status,statusCategory,priority,type,url,updated}], confluencePages: [{title,space,url,lastModified}]), BarChart (title, data, xKey, yKey, aggregate, color, height), LineChart (title, data, xKey, yKey, color, height), PieChart (title, data, nameKey, valueKey, height), AreaChart (title, data, xKey, yKey, color, height), RadarChart (data, dataKey, categories, colors, title), FigmaDesignContext (title, description, figmaUrl, code, codeLanguage, links).",
	"",
	"State and dynamic props: Specs can include /state patches for data. Use {\"$state\":\"/path\"} for read-only binding, {\"$bindState\":\"/path\"} for two-way form binding, {\"$item\":\"field\"} inside repeat scopes. Use repeat field on containers for lists: {\"repeat\":{\"statePath\":\"/array\",\"key\":\"id\"}}. Use on field for events: {\"on\":{\"press\":{\"action\":\"setState\",\"params\":{...}}}}. Use visible field for conditional rendering: {\"visible\":{\"$state\":\"/path\",\"eq\":\"value\"}}. All of repeat, on, visible go on the element object (sibling of type/props/children), NOT inside props.",
	"",
	"Rules:",
	"- Output exactly one ```spec block per response. Keep the ```spec block machine-parseable: no markdown bullets, no prose, no comments inside the fence.",
	"- First patch must set /root. Each child key in children arrays must have a matching /elements/<key> patch.",
	"- INTEGRITY CHECK: Before outputting any element that references children, you MUST output each child as its own element. A missing child causes that branch to be invisible.",
	"- Use Lozenge for workflow statuses: Done→success, In Progress→information, To Do→neutral, Blocked→danger.",
	"- For Atlassian data (Jira work items, Confluence pages): ALWAYS emit a spec. Use Card for single items, Timeline for activity feeds. Never use the word 'Issues' — use 'Work Items'. Use 'Pages' not 'Confluence Pages'.",
	"- For work summaries with Jira items and Confluence pages, use WorkSummary component. Do not compose Metric, BarChart, or Tabs manually for work summaries — WorkSummary handles all layout.",
	"- Charts (BarChart, LineChart, PieChart, AreaChart, RadarChart) are leaf components — place directly as children of Stack or Grid, NOT inside Card children.",
	"- Avoid outer padding on the root container. Root Stack padding must be null or 0.",
	"- Horizontal Stack defaults to nowrap; set wrap=true only for flowing layouts like tag groups or badge lists.",
	"- For two-way form values, use {\"$bindState\":\"/path\"} on the natural value prop (value, checked, pressed).",
	"- Do NOT emit a spec for simple greetings, yes/no answers, or short factual replies. Only use specs when visual structure adds value.",
	"[End Interactive Visual UI Protocol]",
].join("\n");

const EXECUTION_TRACE_INSTRUCTION = [
	"[Execution Trace Protocol]",
	"For long-running implementation, UI generation, or delegated multi-step work, emit lightweight machine-readable progress markers so the host UI can show a live trace.",
	"When you are delegating work, using `invoke_subagents`, or progressing through multiple meaningful tasks, emit a single line with the exact prefix `AGENT_EXECUTION:` followed by one JSON object.",
	'Use this exact shape: {"agentId":"<stable-agent-id>","agentName":"<short agent name>","taskId":"<stable-task-id>","taskLabel":"<short task label>","status":"working|completed|failed","content":"<optional short update>"}.',
	"Reuse the same `taskId` across updates for the same task. Keep `content` concise and cumulative-friendly. Do not wrap these marker lines in markdown fences.",
	"When tool lifecycle events do not reflect the current phase of work, you may emit `THINKING_STATUS:` followed by a JSON object like {\"label\":\"Generating results\",\"content\":\"Assembling the UI card\"}. Use this sparingly for meaningful phase changes.",
	"[End Execution Trace Protocol]",
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

const WEB_SEARCH_INSTRUCTION = [
	"[Web Search Protocol]",
	"You have access to web search and web browsing MCP tools that can fetch live, real-time information from the internet.",
	"When the user asks about current data (stock prices, news, weather, live scores, recent events, release dates, current status of services, or any question where the answer changes over time), you MUST use your web search tools to look up the information instead of saying you cannot access real-time data.",
	"Do not apologize or say you lack access — search the web and provide the answer.",
	"[End Web Search Protocol]",
].join("\n");

const DURABLE_MEMORY_INSTRUCTION = [
	"[Durable Memory Protocol]",
	"In Rovo App, durable memory means wiki-backed Hermes persistent memory.",
	"When the user asks you to remember, save, or store something for future conversations, treat that as Hermes memory unless they explicitly ask for a repo lesson or rule.",
	"The backend reviews completed turns and persists durable memories through the llm-wiki flow after the turn when appropriate, even if no memory tool is listed in your current toolset.",
	"Do not say that you lack a memory write tool, cannot write memory mid-conversation, or that the user must use the Memory panel for normal remember/save requests.",
	"If the request could instead mean a reminder, scheduled action, or one-off task, infer that intent from the full request instead of forcing it into memory.",
	"Acknowledge durable-memory requests plainly and let the backend persistence flow handle the save unless the user asks about implementation details.",
	"Use repo lesson logging only for repo/operator corrections or explicit requests to save a lesson, rule, or prevention note.",
	"Do not describe durable memory as a lesson or skill unless the user explicitly asked for that kind of record.",
	"[End Durable Memory Protocol]",
].join("\n");

const HERMES_SKILL_DISCOVERABILITY_INSTRUCTION = [
	"[Hermes Skill Discoverability Protocol]",
	"When context includes a [Hermes Skills Catalog] section, treat it as the source of truth for which Hermes skills are installed in this environment.",
	"Skills listed in [Hermes Skills Catalog] are discoverable, even if they are not active in the current turn.",
	"Only skills included in the [Hermes Skills] section are fully loaded as procedural memory for the current turn.",
	"If the user's request clearly matches an installed Hermes skill in the catalog, proactively load that skill instead of waiting for the user to name it exactly.",
	"Do not say a listed skill is unavailable just because it is missing from [Hermes Skills]. Instead, explain that it is installed but not currently selected for this thread.",
	"If a relevant installed skill is not active, prefer loading it directly with the `get_skill` tool when that tool is available.",
	"When multiple installed skills are relevant, load the most directly applicable one first and only mention alternatives when they materially change the outcome.",
	"Treat skill loading as the default response to a relevant installed skill, not as an optional extra.",
	"Use the Rovo App Skills picker only when direct loading is unavailable or when the user wants the skill to stay active as procedural context for future turns. Picker activation applies starting on the next turn.",
	"[End Hermes Skill Discoverability Protocol]",
].join("\n");

const DEEP_PLAN_INSTRUCTION = [
	"[Deep Plan Protocol]",
	"When plan mode is active, you are in the serve planning workflow. Follow these rules strictly:",
	"",
	"1. Q&A BEFORE plan: If the user's request is ambiguous, under-specified, or missing essential build details, call `ask_user_questions` BEFORE `exit_plan_mode` to gather requirements. If the prompt is already specific enough, you may skip straight to `exit_plan_mode`. If you ask clarifying questions first and the answers provide enough detail, the next turn should call `exit_plan_mode`. If essential details are still missing after the user answers, you may call `ask_user_questions` again to gather what you need before planning.",
	"2. NEVER Q&A AFTER plan: Once you have called `exit_plan_mode` in a turn, do NOT call `ask_user_questions` in that same turn. Further iteration happens through subsequent messages.",
	"3. MUST use `exit_plan_mode`: In plan mode, always present plans via `exit_plan_mode`. Never output plan content as free-form text, GenUI spec cards, update_todo output, or any other format — the planning UI depends on `exit_plan_mode` to render correctly.",
	"4. Plan handoff is mandatory for build requests: Do quick exploration as needed, but finish the planning interaction by calling `exit_plan_mode`. Do not treat `invoke_subagents`, `get_skill`, `create_technical_plan`, or plain text as a substitute for the plan handoff.",
	"4a. If you use `invoke_subagents` or `create_technical_plan` during plan mode, you must still continue the same planning turn until you call `exit_plan_mode`. Take the output from `create_technical_plan` and pass it as the markdown argument to `exit_plan_mode`. Do not stop after subagent exploration or plan generation. Do not end the turn without calling `exit_plan_mode`.",
	"5. Implementation happens after approval: After the user approves the plan, the host will switch you back to `default` mode before implementation. Do not start implementing while plan mode is still active.",
	"6. Plan content: Structure the markdown however best fits the user's request — use whatever sections, headings, diagrams, and prose make sense. During implementation you will use `update_todo` to define and track your own tasks.",
	"7. One plan per turn: Call `exit_plan_mode` at most once per turn.",
	"[End Deep Plan Protocol]",
].join("\n");

const SHELL_CHROME_AVOIDANCE_INSTRUCTION = [
	"[Shell Chrome Policy]",
	"When generating or writing React page/app code, do NOT wrap with host-shell chrome.",
	"Do NOT import or use @/components/projects/page (AppLayout).",
	"Do NOT import these host-shell components:",
	"- @/components/blocks/top-navigation/page (TopNavigation)",
	"- @/components/blocks/product-sidebar/page (product sidebar)",
	"- @/components/projects/shared/components/floating-rovo-button (FloatingRovoButton)",
	"- @/components/projects/fullscreen-chat (global Rovo chat panel)",
	"Do NOT add equivalents of global product chrome such as app switchers, global search headers, notifications, help/settings/profile menus, theme toggles, or floating chat launchers unless the user explicitly requested shell UI.",
	"Build only the feature content area. The surrounding host shell already exists.",
	"Feature-local headers, filters, tabs, toolbars, and section navigation are fine when they belong to the generated feature itself.",
	"[End Shell Chrome Policy]",
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

function isPlanModeContext(contextDescription) {
	if (typeof contextDescription !== "string" || contextDescription.trim().length === 0) {
		return false;
	}

	return (
		contextDescription.includes("Plan mode is enabled.") ||
		contextDescription.includes("[POST-CLARIFICATION — Plan Mode]") ||
		contextDescription.includes("exit_plan_mode")
	);
}

function getInstructionBlocksForProfile(profile, promptSpecificInstruction, contextDescription) {
	if (profile === "plain-chat") {
		return [PLAIN_CHAT_INSTRUCTION, promptSpecificInstruction];
	}

	const planModeContextActive = isPlanModeContext(contextDescription);

	return [
		REQUEST_USER_INPUT_INSTRUCTION,
		PLAN_DESCRIPTION_INSTRUCTION,
		DEEP_PLAN_INSTRUCTION,
		planModeContextActive ? null : GENUI_SPEC_INSTRUCTION,
		EXECUTION_TRACE_INSTRUCTION,
		SHELL_CHROME_AVOIDANCE_INSTRUCTION,
		FIGMA_CLARIFICATION_INSTRUCTION,
		WEB_SEARCH_INSTRUCTION,
		DURABLE_MEMORY_INSTRUCTION,
		HERMES_SKILL_DISCOVERABILITY_INSTRUCTION,
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
		promptSpecificInstruction,
		contextDescription,
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
	DEEP_PLAN_INSTRUCTION,
	HERMES_SKILL_DISCOVERABILITY_INSTRUCTION,
};
