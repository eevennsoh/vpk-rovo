// Extracts a fenced ```question-card JSON block from the assistant's
// streamed text and validates it against a minimal schema mirroring
// ParsedQuestionCardQuestion in components/projects/shared/lib/question-card-widget.ts.
//
// Why a separate extractor: the AI Gateway path can't drive the AI SDK's
// native tool calling against Atlassian's Bedrock proxy (auth 403), so we
// instead prompt the model to emit clarification questions as JSON inside
// a fenced code block. This module parses that block server-side and
// returns a structured payload the existing data-widget-data part shape
// expects — including options, which the prose-only extractor at
// question-card-extractor.js cannot produce.
//
// Falls back semantics live in server.js: if this returns null, the
// caller invokes extractQuestionCardDefinitionFromAssistantText (prose).

const VALID_KINDS = new Set(["single-select", "multi-select", "text"]);
const MAX_QUESTIONS = 6;
const MAX_OPTIONS_PER_QUESTION = 8;
const MAX_LABEL_LENGTH = 200;
const MAX_DESCRIPTION_LENGTH = 400;
const MAX_TITLE_LENGTH = 200;

const FENCE_PATTERN = /```(?:question-card|json)\s*\n([\s\S]*?)\n```/i;

function trimString(value, maxLength) {
	if (typeof value !== "string") return null;
	const trimmed = value.trim();
	if (trimmed.length === 0) return null;
	return trimmed.length > maxLength ? trimmed.slice(0, maxLength) : trimmed;
}

function normalizeOption(option, index) {
	if (!option || typeof option !== "object") return null;
	const label = trimString(option.label, MAX_LABEL_LENGTH);
	if (!label) return null;
	const idCandidate = trimString(option.id, 80);
	return {
		id: idCandidate || `option-${index + 1}`,
		label,
	};
}

function normalizeOptions(options, kind) {
	if (kind === "text") return [];
	if (!Array.isArray(options)) return null;
	const out = [];
	const seenIds = new Set();
	const seenLabels = new Set();
	for (const [index, raw] of options.entries()) {
		const normalized = normalizeOption(raw, index);
		if (!normalized) continue;
		const normalizedLabel = normalized.label.toLowerCase();
		if (seenIds.has(normalized.id) || seenLabels.has(normalizedLabel)) continue;
		seenIds.add(normalized.id);
		seenLabels.add(normalizedLabel);
		out.push(normalized);
		if (out.length >= MAX_OPTIONS_PER_QUESTION) break;
	}
	return out;
}

function normalizeKind(value) {
	if (typeof value !== "string") return "single-select";
	const lower = value.trim().toLowerCase();
	return VALID_KINDS.has(lower) ? lower : "single-select";
}

function normalizeQuestion(question, index, seenIds) {
	if (!question || typeof question !== "object") return null;
	const label = trimString(question.label, MAX_LABEL_LENGTH);
	if (!label) return null;
	const kind = normalizeKind(question.kind);
	const options = normalizeOptions(question.options, kind);
	if (options === null) return null;
	// Select kinds with zero options would render as a text fallback —
	// that defeats the JSON-fence's purpose, so reject and let the prose
	// extractor handle this question. The fallback path is graceful.
	if (kind !== "text" && options.length === 0) return null;

	const baseId = trimString(question.id, 80) || `q-${index + 1}`;
	let uniqueId = baseId;
	let suffix = 2;
	while (seenIds.has(uniqueId)) {
		uniqueId = `${baseId}-${suffix}`;
		suffix += 1;
	}
	seenIds.add(uniqueId);

	const result = {
		id: uniqueId,
		label,
		required: question.required !== false,
		kind,
		options,
	};
	const description = trimString(question.description, MAX_DESCRIPTION_LENGTH);
	if (description) result.description = description;
	return result;
}

function validatePayload(parsed) {
	if (!parsed || typeof parsed !== "object") return null;
	const questionsRaw = Array.isArray(parsed.questions) ? parsed.questions : null;
	if (!questionsRaw || questionsRaw.length === 0) return null;

	const seenIds = new Set();
	const questions = [];
	for (const [index, raw] of questionsRaw.entries()) {
		const normalized = normalizeQuestion(raw, index, seenIds);
		if (normalized) questions.push(normalized);
		if (questions.length >= MAX_QUESTIONS) break;
	}
	if (questions.length === 0) return null;

	const result = {
		type: "question-card",
		title: trimString(parsed.title, MAX_TITLE_LENGTH) || "Help me clarify this",
		questions,
	};
	const description = trimString(parsed.description, MAX_DESCRIPTION_LENGTH);
	if (description) result.description = description;
	return result;
}

/**
 * @param {string} text - The assistant's streamed text.
 * @returns {{ payload: object, cleanedText: string } | null}
 *   - `payload`: the validated question-card payload with `questions` (each
 *     with optional `options`), `title`, optional `description`.
 *   - `cleanedText`: the original text with the JSON fence removed, so the
 *     user does not see the raw JSON in the message body.
 *   Returns `null` if no valid fenced block is present.
 */
function extractQuestionCardJsonFromAssistantText(text) {
	if (typeof text !== "string" || text.length === 0) return null;

	const fenceMatch = text.match(FENCE_PATTERN);
	if (!fenceMatch) return null;

	let parsed;
	try {
		parsed = JSON.parse(fenceMatch[1]);
	} catch {
		return null;
	}

	const payload = validatePayload(parsed);
	if (!payload) return null;

	const cleanedText = text.replace(fenceMatch[0], "").replace(/\n{3,}/g, "\n\n").trim();
	return { payload, cleanedText };
}

module.exports = {
	extractQuestionCardJsonFromAssistantText,
};
