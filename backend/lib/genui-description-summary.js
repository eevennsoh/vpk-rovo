const { getNonEmptyString } = require("./shared-utils");

const GENUI_DESCRIPTION_SYSTEM_PROMPT =
	'You write terse card-header descriptions for UI cards. Respond with JSON only: {"shortDescription":"..."}';

const DEFAULT_DESCRIPTION = "Generated from your request";

const LOW_SIGNAL_PATTERNS = [
	/^generated from\b/i,
	/^upcoming events from google calendar\b/i,
	/^calendar information from google calendar\b/i,
	/^files from google drive\b/i,
	/^drive account information from google drive\b/i,
	/^design context extracted from figma\b/i,
	/^tool results\b/i,
];

const CONTEXT_DRIVEN_PATTERN = /^\d+\s+\w+.*\b(found|available|in this)\b/i;

function shouldSummarizeDescription(description) {
	const trimmed = getNonEmptyString(description);
	if (!trimmed) {
		return false;
	}
	if (trimmed.length <= 60) {
		return false;
	}
	if (trimmed === DEFAULT_DESCRIPTION) {
		return false;
	}
	if (CONTEXT_DRIVEN_PATTERN.test(trimmed)) {
		return false;
	}
	const normalized = trimmed
		.toLowerCase()
		.replace(/[.!?]+$/g, "")
		.replace(/\s+/g, " ")
		.trim();
	if (LOW_SIGNAL_PATTERNS.some((pattern) => pattern.test(normalized))) {
		return false;
	}
	return true;
}

function buildDescriptionSummaryPrompt({ title, description }) {
	const normalizedDescription = getNonEmptyString(description);
	if (!normalizedDescription) {
		throw new Error("A description is required");
	}

	const titleContext = getNonEmptyString(title)
		? `\nCard title: ${title.trim()}`
		: "";

	return `Write a terse card-header description for this UI card.
${titleContext}
Current description: ${normalizedDescription}

Rules:
- Short description: 4-10 words, describe what the card shows to the user
- Do not describe what the AI is doing (no "Fetching", "Getting", "Looking up", "Let me")
- Do not mention file paths, routes, or technical details
- Do not copy the original description verbatim
- Respond with JSON only`;
}

function cleanGeneratedValue(value) {
	const trimmed = getNonEmptyString(value);
	if (!trimmed) {
		return "";
	}

	return trimmed
		.replace(/^["']|["']$/g, "")
		.replace(/\.+$/g, "")
		.trim();
}

function parseDescriptionSummaryResponse(text) {
	const trimmed = getNonEmptyString(text) || "";
	let shortDescription = "";

	try {
		const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
		if (jsonMatch) {
			const parsed = JSON.parse(jsonMatch[0]);
			const parsedShortDescription =
				cleanGeneratedValue(parsed?.shortDescription)
				|| cleanGeneratedValue(parsed?.description)
				|| cleanGeneratedValue(parsed?.summary);
			if (parsedShortDescription) {
				shortDescription = parsedShortDescription;
			}
		}
	} catch {
		// Fall back to empty when JSON parsing fails.
	}

	return { shortDescription: shortDescription || null };
}

async function generateDescriptionSummary({
	title,
	description,
	generateText,
}) {
	const normalizedDescription = getNonEmptyString(description);
	if (!normalizedDescription) {
		throw new Error("A description is required");
	}
	if (typeof generateText !== "function") {
		throw new Error("A generateText function is required");
	}

	if (!shouldSummarizeDescription(normalizedDescription)) {
		return { shortDescription: null };
	}

	const prompt = buildDescriptionSummaryPrompt({ title, description });
	const text = await generateText({
		system: GENUI_DESCRIPTION_SYSTEM_PROMPT,
		prompt,
		maxOutputTokens: 60,
		temperature: 0.4,
	});

	return parseDescriptionSummaryResponse(text);
}

module.exports = {
	GENUI_DESCRIPTION_SYSTEM_PROMPT,
	shouldSummarizeDescription,
	buildDescriptionSummaryPrompt,
	parseDescriptionSummaryResponse,
	generateDescriptionSummary,
};
