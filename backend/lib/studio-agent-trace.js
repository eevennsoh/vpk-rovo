/**
 * Scripted chain-of-thought trace for Studio agent creation on the
 * AI Gateway code path.
 *
 * The AI Gateway turn has no real tool-call harness — the model just returns
 * a JSON envelope describing the agent. Without a backend trace the
 * `<AssistantThinkingTrace>` collapsible has nothing to render and the body
 * stays empty (see `thinking-status-state.ts`: the trigger appears, but
 * `isThinkingStatusActive` only returns true when at least one
 * `data-thinking-event` part has arrived). This module builds a *contextual*
 * step list derived from the user's prompt and prior Q&A so the UI shows
 * a believable, brief-specific trace during the gateway's buffering window.
 *
 * The output shape matches what `writeThinkingTraceSteps` (in
 * `backend/lib/thinking-trace-writer.js`) consumes: each step needs
 * `toolName`, `toolCallId`, `label`, optional `content`, optional `input`,
 * and optional `output` / `outputPreview`.
 */

const TOOL_KEYWORD_GROUPS = [
	{ key: "jira", label: "Jira", patterns: [/\bjira\b/i, /\bissue tracker\b/i] },
	{ key: "confluence", label: "Confluence", patterns: [/\bconfluence\b/i, /\bwiki\b/i] },
	{ key: "slack", label: "Slack", patterns: [/\bslack\b/i] },
	{ key: "github", label: "GitHub", patterns: [/\bgithub\b/i, /\bpull request\b/i, /\bpr review\b/i] },
	{ key: "email", label: "Email", patterns: [/\bemail\b/i, /\binbox\b/i, /\bgmail\b/i] },
	{ key: "calendar", label: "Calendar", patterns: [/\bcalendar\b/i, /\bmeeting\b/i, /\bschedul(?:e|ing)\b/i] },
	{ key: "search", label: "Web search", patterns: [/\bweb search\b/i, /\bgoogle it\b/i, /\bsearch the web\b/i] },
	{ key: "browse", label: "Web browsing", patterns: [/\bbrows(?:e|ing)\b/i, /\bvisit (?:a )?(?:the )?(?:url|site|page)\b/i] },
	{ key: "code", label: "Code", patterns: [/\bcode\b/i, /\brepo\b/i, /\brepository\b/i, /\bcodebase\b/i] },
	{ key: "file", label: "Files", patterns: [/\bfile(s)?\b/i, /\battachment(s)?\b/i, /\bdocument(s)?\b/i] },
];

const MAX_PROMPT_PREVIEW_CHARS = 180;
const MAX_QA_PREVIEW_CHARS = 220;

function truncate(text, maxChars) {
	if (typeof text !== "string") {
		return "";
	}
	const trimmed = text.trim().replace(/\s+/g, " ");
	if (trimmed.length <= maxChars) {
		return trimmed;
	}
	return `${trimmed.slice(0, Math.max(0, maxChars - 1)).trimEnd()}…`;
}

function getMessageRole(message) {
	if (!message || typeof message !== "object") {
		return null;
	}
	if (typeof message.role === "string") {
		return message.role;
	}
	if (typeof message.type === "string") {
		return message.type === "assistant" ? "assistant" : "user";
	}
	return null;
}

function getMessageText(message) {
	if (!message || typeof message !== "object") {
		return "";
	}
	if (typeof message.content === "string") {
		return message.content;
	}
	if (Array.isArray(message.content)) {
		return message.content
			.map((part) => {
				if (!part) return "";
				if (typeof part === "string") return part;
				if (typeof part.text === "string") return part.text;
				return "";
			})
			.filter(Boolean)
			.join("\n");
	}
	if (typeof message.text === "string") {
		return message.text;
	}
	return "";
}

function detectMentionedTools(text) {
	if (typeof text !== "string" || text.length === 0) {
		return [];
	}
	const matched = [];
	for (const group of TOOL_KEYWORD_GROUPS) {
		if (group.patterns.some((pattern) => pattern.test(text))) {
			matched.push(group.label);
		}
	}
	return matched;
}

function findPriorAssistantQuestion(messages) {
	if (!Array.isArray(messages)) {
		return null;
	}
	for (let i = messages.length - 1; i >= 0; i--) {
		const message = messages[i];
		if (getMessageRole(message) !== "assistant") {
			continue;
		}
		const text = getMessageText(message);
		if (text && /\?/.test(text)) {
			return text;
		}
	}
	return null;
}

function summarizeQAExchange(messages, userAnswer) {
	const question = findPriorAssistantQuestion(messages);
	if (!question && !userAnswer) {
		return null;
	}
	const parts = [];
	if (question) {
		parts.push(`Q: ${truncate(question, 110)}`);
	}
	if (userAnswer) {
		parts.push(`A: ${truncate(userAnswer, 110)}`);
	}
	return truncate(parts.join(" — "), MAX_QA_PREVIEW_CHARS);
}

function deriveAgentNameHint(userPrompt) {
	if (typeof userPrompt !== "string") {
		return "an agent";
	}
	const match = userPrompt.match(
		/\b(?:an?|the)\s+([a-z][a-z0-9-]*(?:\s+[a-z][a-z0-9-]*){0,3})\s+agent\b/i,
	);
	if (match?.[1]) {
		return `${match[1].trim()} agent`;
	}
	const verbMatch = userPrompt.match(/\b(helps?|assists?|reviews?|summari[sz]es?|tracks?|monitors?|drafts?)\s+([^.!?\n]{3,60})/i);
	if (verbMatch) {
		return `agent that ${verbMatch[1].toLowerCase()} ${truncate(verbMatch[2], 50)}`;
	}
	return "an agent";
}

/**
 * Build an ordered list of thinking-trace steps for a Studio agent-creation
 * turn on the AI Gateway path.
 *
 * @param {object} params
 * @param {string} [params.userPrompt]          — the latest user message text
 * @param {Array}  [params.messages]            — conversation history (role + content)
 * @param {string} [params.contextDescription]  — optional hidden context (unused for output but kept for future heuristics)
 * @returns {Array<object>} step descriptors consumable by `writeThinkingTraceSteps`
 */
function buildStudioAgentCreationTrace({ userPrompt, messages, contextDescription } = {}) {
	const promptText = typeof userPrompt === "string" ? userPrompt : "";
	const traceIdPrefix = `studio-agent-trace-${Date.now()}`;
	const steps = [];

	const briefPreview = truncate(promptText, MAX_PROMPT_PREVIEW_CHARS) || "User did not supply a brief.";
	steps.push({
		toolName: "studio.read_brief",
		toolCallId: `${traceIdPrefix}-read-brief`,
		label: "Reading your brief",
		content: "Parsing the prompt to understand what kind of agent to build.",
		input: { prompt: briefPreview },
		outputPreview: `Brief understood: ${briefPreview}`,
	});

	const qaSummary = summarizeQAExchange(messages, promptText);
	const hadPriorAssistantTurn = Array.isArray(messages)
		&& messages.some((m) => getMessageRole(m) === "assistant" && getMessageText(m).trim().length > 0);
	if (hadPriorAssistantTurn && qaSummary) {
		steps.push({
			toolName: "studio.review_answers",
			toolCallId: `${traceIdPrefix}-review-answers`,
			label: "Reviewing your answers",
			content: "Folding in the clarifications from earlier turns.",
			input: { exchange: qaSummary },
			outputPreview: qaSummary,
		});
	}

	const mentionedTools = detectMentionedTools(promptText);
	const toolSelectionPreview = mentionedTools.length > 0
		? `Selected: ${mentionedTools.join(", ")}`
		: "No tool integrations called out — defaulting to the standard skill set.";
	steps.push({
		toolName: "studio.select_tools",
		toolCallId: `${traceIdPrefix}-select-tools`,
		label: "Selecting tools",
		content: "Mapping the brief to available integrations and skills.",
		input: { mentioned: mentionedTools },
		outputPreview: toolSelectionPreview,
	});

	steps.push({
		toolName: "studio.draft_instructions",
		toolCallId: `${traceIdPrefix}-draft-instructions`,
		label: "Drafting instructions",
		content: "Writing the system prompt and behavior guardrails.",
		input: { hasContext: typeof contextDescription === "string" && contextDescription.length > 0 },
		outputPreview: "Drafted instructions covering role, scope, and tone.",
	});

	const nameHint = deriveAgentNameHint(promptText);
	steps.push({
		toolName: "studio.name_agent",
		toolCallId: `${traceIdPrefix}-name-agent`,
		label: "Naming the agent",
		content: "Choosing a name and short description for the profile card.",
		input: { hint: nameHint },
		outputPreview: `Naming hint: ${nameHint}`,
	});

	steps.push({
		toolName: "studio.save_profile",
		toolCallId: `${traceIdPrefix}-save-profile`,
		label: "Saving the agent profile",
		content: "Persisting the agent so it shows up in your Studio library.",
		outputPreview: "Profile ready to surface.",
	});

	return steps;
}

module.exports = {
	buildStudioAgentCreationTrace,
	// Exported for tests:
	__internals: {
		detectMentionedTools,
		summarizeQAExchange,
		deriveAgentNameHint,
		truncate,
	},
};
