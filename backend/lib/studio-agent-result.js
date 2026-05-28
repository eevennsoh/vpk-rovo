const AGENT_RESULT_STREAM_PREFIX = "AGENT_RESULT:";
const DEFAULT_GENERATED_AGENT_BYLINE = "Generated agent";
const MISSING_STUDIO_AGENT_RESULT_ERROR_CODE = "missing-agent-result";
const STUDIO_AGENT_RESULT_WIDGET_TYPE = "agent-result";

function getNonEmptyString(value) {
	if (typeof value !== "string") {
		return null;
	}

	const trimmed = value.trim();
	return trimmed.length > 0 ? trimmed : null;
}

function isPlainObject(value) {
	return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function slugify(value) {
	const normalized = getNonEmptyString(value);
	if (!normalized) {
		return null;
	}

	const slug = normalized
		.toLowerCase()
		.replace(/['"]/g, "")
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");

	return slug || null;
}

function getInitials(name) {
	const normalizedName = getNonEmptyString(name);
	if (!normalizedName) {
		return null;
	}

	const words = normalizedName
		.split(/\s+/u)
		.map((word) => word.replace(/[^a-z0-9]/giu, ""))
		.filter(Boolean);
	if (words.length === 0) {
		return null;
	}

	const initials = words.length === 1
		? words[0].slice(0, 2)
		: `${words[0][0]}${words[words.length - 1][0]}`;

	return initials.toUpperCase();
}

function normalizeStringList(value, { maxItems = 6 } = {}) {
	if (!Array.isArray(value)) {
		return [];
	}

	const normalized = [];
	const seen = new Set();
	for (const item of value) {
		const text =
			getNonEmptyString(item) ||
			(isPlainObject(item)
				? getNonEmptyString(item.prompt) ||
					getNonEmptyString(item.label) ||
					getNonEmptyString(item.text) ||
					getNonEmptyString(item.title)
				: null);
		if (!text) {
			continue;
		}

		const key = text.toLowerCase();
		if (seen.has(key)) {
			continue;
		}

		seen.add(key);
		normalized.push(text);
		if (normalized.length >= maxItems) {
			break;
		}
	}

	return normalized;
}

function unwrapAgentDefinition(value) {
	if (!isPlainObject(value)) {
		return null;
	}

	if (value.type === "data-agent-result" && isPlainObject(value.data)) {
		return value.data;
	}

	for (const key of ["agentResult", "agent_result", "agent", "profile", "definition"]) {
		if (isPlainObject(value[key])) {
			return value[key];
		}
	}

	return value;
}

function normalizeAvatarFallback(value, name) {
	const avatar = isPlainObject(value?.avatar) ? value.avatar : null;
	const fallback = isPlainObject(value?.avatarFallback)
		? value.avatarFallback
		: isPlainObject(value?.avatar_fallback)
			? value.avatar_fallback
			: null;
	const initials =
		getNonEmptyString(fallback?.initials) ||
		getNonEmptyString(avatar?.initials) ||
		getInitials(name);
	const backgroundColor =
		getNonEmptyString(fallback?.backgroundColor) ||
		getNonEmptyString(fallback?.background_color) ||
		getNonEmptyString(fallback?.color) ||
		getNonEmptyString(avatar?.backgroundColor) ||
		getNonEmptyString(avatar?.background_color) ||
		getNonEmptyString(avatar?.color);
	const iconName =
		getNonEmptyString(fallback?.iconName) ||
		getNonEmptyString(fallback?.icon_name) ||
		getNonEmptyString(avatar?.iconName) ||
		getNonEmptyString(avatar?.icon_name);
	const label =
		getNonEmptyString(fallback?.label) ||
		getNonEmptyString(avatar?.label);

	if (!initials && !backgroundColor && !iconName && !label) {
		return null;
	}

	return {
		...(initials ? { initials } : {}),
		...(backgroundColor ? { backgroundColor } : {}),
		...(iconName ? { iconName } : {}),
		...(label ? { label } : {}),
	};
}

function normalizeStudioAgentResult(value) {
	const definition = unwrapAgentDefinition(value);
	if (!definition) {
		return null;
	}

	const name = getNonEmptyString(definition.name) || getNonEmptyString(definition.displayName);
	const description =
		getNonEmptyString(definition.description) ||
		getNonEmptyString(definition.summary);
	const instructions =
		getNonEmptyString(definition.instructions) ||
		getNonEmptyString(definition.contextDescription) ||
		getNonEmptyString(definition.context_description) ||
		getNonEmptyString(definition.context) ||
		getNonEmptyString(definition.systemPrompt) ||
		getNonEmptyString(definition.system_prompt);
	const conversationStarters = normalizeStringList(
		definition.conversationStarters ||
			definition.conversation_starters ||
			definition.starters ||
			definition.suggestedQuestions ||
			definition.suggested_questions,
	);

	if (!name || !description || !instructions || conversationStarters.length === 0) {
		return null;
	}

	const explicitAgentId =
		getNonEmptyString(definition.agentId) ||
		getNonEmptyString(definition.agent_id) ||
		getNonEmptyString(definition.id);
	const agentId = explicitAgentId || `studio-agent-${slugify(name) || "generated"}`;
	const byline =
		getNonEmptyString(definition.byline) ||
		getNonEmptyString(definition.sourceLabel) ||
		getNonEmptyString(definition.source_label) ||
		getNonEmptyString(definition.source) ||
		DEFAULT_GENERATED_AGENT_BYLINE;
	const avatarSrc =
		getNonEmptyString(definition.avatarSrc) ||
		getNonEmptyString(definition.avatar_src) ||
		getNonEmptyString(definition.avatar?.src) ||
		getNonEmptyString(definition.avatar?.url);
	const avatarFallback = normalizeAvatarFallback(definition, name);
	const tools = normalizeStringList(definition.tools, { maxItems: 12 });
	const trigger = getNonEmptyString(definition.trigger);
	const guardrail =
		getNonEmptyString(definition.guardrail) ||
		getNonEmptyString(definition.guardrails);
	const assignedColumn =
		getNonEmptyString(definition.assignedColumn) ||
		getNonEmptyString(definition.assigned_column);

	return {
		agentId,
		name,
		byline,
		sourceLabel: byline,
		description,
		summary: getNonEmptyString(definition.summary) || description,
		instructions,
		contextDescription:
			getNonEmptyString(definition.contextDescription) ||
			getNonEmptyString(definition.context_description) ||
			instructions,
		conversationStarters,
		...(avatarSrc ? { avatarSrc } : {}),
		...(avatarFallback ? { avatarFallback } : {}),
		...(assignedColumn ? { assignedColumn } : {}),
		...(trigger ? { trigger } : {}),
		...(tools.length > 0 ? { tools } : {}),
		...(guardrail ? { guardrail } : {}),
		action: "create",
	};
}

function findJsonObjectEndIndex(value, startIndex) {
	let depth = 0;
	let inString = false;
	let isEscaped = false;

	for (let index = startIndex; index < value.length; index += 1) {
		const character = value[index];

		if (inString) {
			if (isEscaped) {
				isEscaped = false;
			} else if (character === "\\") {
				isEscaped = true;
			} else if (character === "\"") {
				inString = false;
			}
			continue;
		}

		if (character === "\"") {
			inString = true;
		} else if (character === "{") {
			depth += 1;
		} else if (character === "}") {
			depth -= 1;
			if (depth === 0) {
				return index;
			}
		}
	}

	return -1;
}

function parseJsonObjectAt(value, startIndex) {
	if (typeof value !== "string" || value[startIndex] !== "{") {
		return null;
	}

	const endIndex = findJsonObjectEndIndex(value, startIndex);
	if (endIndex === -1) {
		return null;
	}

	try {
		return {
			value: JSON.parse(value.slice(startIndex, endIndex + 1)),
			endIndex,
		};
	} catch {
		return null;
	}
}

function cleanExtractedText(text) {
	return text
		.replace(/[ \t]+\n/gu, "\n")
		.replace(/\n{3,}/gu, "\n\n")
		.trim();
}

function joinTextAroundExtraction(before, after) {
	const left = before.replace(/[ \t]+$/u, "").replace(/\n+$/u, "\n");
	const right = after.replace(/^[\r\n\t ]+/u, "");
	if (!left) {
		return right;
	}
	if (!right) {
		return left;
	}

	return `${left}${left.endsWith("\n") ? "" : "\n"}${right}`;
}

function extractAgentResultFromMarker(text) {
	const markerIndex = text.indexOf(AGENT_RESULT_STREAM_PREFIX);
	if (markerIndex === -1) {
		return null;
	}

	let jsonStartIndex = markerIndex + AGENT_RESULT_STREAM_PREFIX.length;
	while (jsonStartIndex < text.length && /\s/u.test(text[jsonStartIndex])) {
		jsonStartIndex += 1;
	}

	const parsed = parseJsonObjectAt(text, jsonStartIndex);
	if (!parsed) {
		return null;
	}

	const payload = normalizeStudioAgentResult(parsed.value);
	if (!payload) {
		return null;
	}

	return {
		payload,
		cleanedText: cleanExtractedText(
			joinTextAroundExtraction(
				text.slice(0, markerIndex),
				text.slice(parsed.endIndex + 1),
			),
		),
		source: "marker",
	};
}

function tryParseJsonObject(value) {
	const text = getNonEmptyString(value);
	if (!text || text[0] !== "{") {
		return null;
	}

	try {
		const parsed = JSON.parse(text);
		return isPlainObject(parsed) ? parsed : null;
	} catch {
		return null;
	}
}

function extractAgentResultFromFencedJson(text) {
	const fencePattern = /```(?:json|agent-result|agent)?\s*\n([\s\S]*?)```/giu;
	let match = fencePattern.exec(text);
	while (match) {
		const parsed = tryParseJsonObject(match[1]);
		const payload = normalizeStudioAgentResult(parsed);
		if (payload) {
			return {
				payload,
				cleanedText: cleanExtractedText(
					joinTextAroundExtraction(
						text.slice(0, match.index),
						text.slice(match.index + match[0].length),
					),
				),
				source: "json-fence",
			};
		}

		match = fencePattern.exec(text);
	}

	return null;
}

function extractAgentResultFromBareJson(text) {
	const parsed = tryParseJsonObject(text);
	const payload = normalizeStudioAgentResult(parsed);
	if (!payload) {
		return null;
	}

	return {
		payload,
		cleanedText: "",
		source: "bare-json",
	};
}

function extractStudioAgentResultFromText(text) {
	const normalizedText = getNonEmptyString(text);
	if (!normalizedText) {
		return null;
	}

	return (
		extractAgentResultFromMarker(normalizedText) ||
		extractAgentResultFromFencedJson(normalizedText) ||
		extractAgentResultFromBareJson(normalizedText)
	);
}

function buildCreationModeContextPrefix(creationMode) {
	if (creationMode === "agent") {
		return `[AGENT CREATION MODE]
You are in agent creation mode. Help the user create a session-local agent profile for Studio.
This is a local agent definition - not a Confluence page, Jira ticket, or any Atlassian product content.
Ask clarifying questions only when required profile fields are missing: name, description, instructions/context, and conversation starters.
Do not call POST /api/plan/agents or any persistence endpoint; durable agent persistence is out of scope for this v1.
Write instructions as structured Markdown matching repo-local agent definitions: start with ## Instructions, use clear paragraphs, bullet lists with bold labels, and include optional ## Knowledge, ## Triggers, and ## Validation sections only when relevant.
When ready, emit exactly one structured result marker outside code fences:
AGENT_RESULT: {"agentId":"stable-slug","name":"Display name","byline":"Generated agent","description":"Short profile summary","instructions":"## Instructions\\n\\nYou are Display name. Describe the role, scope, and operating style.\\n\\n- **Summary** Explain the agent's main responsibility.\\n- **Workflow** Describe how it should handle requests.\\n\\n## Validation\\n\\n- Confirm the output is ready for the user's next step.","conversationStarters":["Starter prompt 1","Starter prompt 2"],"avatarFallback":{"initials":"DA"},"action":"create"}
Do not include edit, delete, approval, publishing, or real tool-binding controls in the result.
[END AGENT CREATION MODE]`;
	}

	if (creationMode === "skill") {
		return `[SKILL CREATION MODE]
You are in skill creation mode. Help the user create a new skill definition file.
This is a local skill definition - not a Confluence page, Jira ticket, or any Atlassian product content.
Ask clarifying questions when required fields are missing.
Return a complete, production-ready definition that can be persisted directly.
Once ready, call POST /api/plan/skills to persist it.
[END SKILL CREATION MODE]`;
	}

	return null;
}

function shouldSurfaceMissingStudioAgentResultFailure({
	creationMode,
	hasAgentResult,
	hasDeferredToolRequest,
	hasPlanWidget,
	hasQuestionCard,
}) {
	return (
		creationMode === "agent" &&
		!hasAgentResult &&
		!hasQuestionCard &&
		!hasPlanWidget &&
		!hasDeferredToolRequest
	);
}

function buildMissingStudioAgentResultFailureParts({
	id = `studio-agent-result-failure-${Date.now()}`,
} = {}) {
	const message =
		"I couldn't create a selectable agent profile from that response. Please retry the agent creation request.";

	return [
		{ type: "text-start", id },
		{
			type: "text-delta",
			id,
			delta: message,
		},
		{ type: "text-end", id },
		{
			type: "data-widget-error",
			id: `${id}-widget`,
			data: {
				type: STUDIO_AGENT_RESULT_WIDGET_TYPE,
				code: MISSING_STUDIO_AGENT_RESULT_ERROR_CODE,
				message,
				details:
					"Agent creation mode requires a structured data-agent-result with name, description, instructions/context, and conversation starters.",
				canRetry: true,
			},
		},
	];
}

module.exports = {
	AGENT_RESULT_STREAM_PREFIX,
	MISSING_STUDIO_AGENT_RESULT_ERROR_CODE,
	STUDIO_AGENT_RESULT_WIDGET_TYPE,
	buildCreationModeContextPrefix,
	buildMissingStudioAgentResultFailureParts,
	extractStudioAgentResultFromText,
	findJsonObjectEndIndex,
	normalizeStudioAgentResult,
	shouldSurfaceMissingStudioAgentResultFailure,
};
