const {
	getNonEmptyString,
	isObjectRecord,
} = require("./shared-utils");

const PLAN_METADATA_SYSTEM_PROMPT =
	'You name apps and products based on technical plans. Identify what is being built, give it a clear product name, and write a terse header description. Respond with JSON only: {"title":"...","shortDescription":"..."}';

function parseTaskLabel(task) {
	if (typeof task === "string") {
		return getNonEmptyString(task);
	}

	if (!isObjectRecord(task)) {
		return null;
	}

	return (
		getNonEmptyString(task.label)
		|| getNonEmptyString(task.title)
		|| getNonEmptyString(task.task)
		|| getNonEmptyString(task.text)
	);
}

function normalizeTaskLabels(tasks) {
	if (!Array.isArray(tasks)) {
		return [];
	}

	return tasks.map(parseTaskLabel).filter(Boolean);
}

function parsePlanWidgetPayload(payload) {
	if (!isObjectRecord(payload)) {
		return null;
	}

	const tasks = Array.isArray(payload.tasks)
		? payload.tasks
		: Array.isArray(payload.steps)
			? payload.steps
			: [];

	const title =
		getNonEmptyString(payload.title)
		|| getNonEmptyString(payload.name)
		|| getNonEmptyString(payload.planTitle)
		|| null;
	const description =
		getNonEmptyString(payload.description)
		|| getNonEmptyString(payload.summary)
		|| getNonEmptyString(payload.subtitle)
		|| null;
	const shortDescription =
		getNonEmptyString(payload.shortDescription)
		|| getNonEmptyString(payload.short_description)
		|| null;
	const taskLabels = normalizeTaskLabels(tasks);

	if (!title && !description && !shortDescription && taskLabels.length === 0) {
		return null;
	}

	return {
		title,
		description,
		shortDescription,
		tasks: taskLabels,
	};
}

function getLatestPlanWidgetMetadata(messages) {
	if (!Array.isArray(messages)) {
		return null;
	}

	for (let messageIndex = messages.length - 1; messageIndex >= 0; messageIndex -= 1) {
		const message = messages[messageIndex];
		if (!message || message.role !== "assistant" || message.metadata?.visibility === "hidden") {
			continue;
		}
		if (!Array.isArray(message.parts)) {
			continue;
		}

		for (let partIndex = message.parts.length - 1; partIndex >= 0; partIndex -= 1) {
			const part = message.parts[partIndex];
			if (part?.type !== "data-widget-data" || !isObjectRecord(part.data)) {
				continue;
			}
			if (getNonEmptyString(part.data.type) !== "plan") {
				continue;
			}

			const payload = isObjectRecord(part.data.payload) ? part.data.payload : part.data;
			const parsedPayload = parsePlanWidgetPayload(payload);
			if (parsedPayload) {
				return parsedPayload;
			}
		}
	}

	return null;
}

function buildPlanMetadataPrompt({
	title,
	description,
	tasks,
}) {
	const normalizedTitle = getNonEmptyString(title);
	if (!normalizedTitle) {
		throw new Error("A title is required");
	}

	const taskLabels = normalizeTaskLabels(tasks);
	const taskContext = taskLabels.length > 0
		? `\nTasks (${taskLabels.length}): ${taskLabels.join("; ")}`
		: "";
	const descriptionContext = getNonEmptyString(description)
		? `\nCurrent description: ${description.trim()}`
		: "";

	return `Name the app or product this plan will build, and write a terse plan-card header description.

Current title: ${normalizedTitle}${descriptionContext}${taskContext}

Rules:
- Title: 2-5 words, name the final app/product/feature being built (e.g. "Time Tracking Dashboard", "Sprint Board", "Team Chat App"), no code/file references, no verbs like "Create" or "Build"
- Short description: 4-10 words, terse and user-facing, suitable for a narrow card header
- Do not mention file paths, routes, implementation steps, or technical details
- Do not copy the full summary verbatim
- Respond with JSON only`;
}

function cleanGeneratedValue(value) {
	const trimmedValue = getNonEmptyString(value);
	if (!trimmedValue) {
		return "";
	}

	return trimmedValue
		.replace(/^["']|["']$/g, "")
		.replace(/\.+$/g, "")
		.trim();
}

function parsePlanMetadataResponse(text, fallbackTitle) {
	const normalizedFallbackTitle = getNonEmptyString(fallbackTitle);
	if (!normalizedFallbackTitle) {
		throw new Error("A fallback title is required");
	}

	const trimmed = getNonEmptyString(text) || "";
	let title = normalizedFallbackTitle;
	let shortDescription = "";

	try {
		const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
		if (jsonMatch) {
			const parsed = JSON.parse(jsonMatch[0]);
			const parsedTitle = cleanGeneratedValue(parsed?.title);
			if (parsedTitle) {
				title = parsedTitle;
			}
			const parsedShortDescription =
				cleanGeneratedValue(parsed?.shortDescription)
				|| cleanGeneratedValue(parsed?.description);
			if (parsedShortDescription) {
				shortDescription = parsedShortDescription;
			}
		}
	} catch {
		// Fall back to the original title when JSON parsing fails.
	}

	return { title, shortDescription };
}

async function generatePlanMetadata({
	title,
	description,
	tasks,
	generateText,
}) {
	const normalizedTitle = getNonEmptyString(title);
	if (!normalizedTitle) {
		throw new Error("A title is required");
	}
	if (typeof generateText !== "function") {
		throw new Error("A generateText function is required");
	}

	const prompt = buildPlanMetadataPrompt({
		title: normalizedTitle,
		description,
		tasks,
	});
	const text = await generateText({
		system: PLAN_METADATA_SYSTEM_PROMPT,
		prompt,
		maxOutputTokens: 120,
		temperature: 0.4,
	});

	return parsePlanMetadataResponse(text, normalizedTitle);
}

module.exports = {
	PLAN_METADATA_SYSTEM_PROMPT,
	buildPlanMetadataPrompt,
	generatePlanMetadata,
	getLatestPlanWidgetMetadata,
	parsePlanMetadataResponse,
};
