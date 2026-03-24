const { inferTaskDependencies } = require("./dag-inference");

const MAX_TASKS = 20;
const DEFAULT_MIN_TASKS = 2;
const DEFAULT_PROGRESSIVE_MIN_TASKS = 1;

function normalizeWhitespace(value) {
	return value.replace(/\s+/g, " ").trim();
}

function stripMarkdownDecorators(value) {
	const withoutInlineStrong = value
		.replace(/\*\*([^*\n]+)\*\*/g, "$1")
		.replace(/__([^_\n]+)__/g, "$1");
	const withoutEdgeDecorators = withoutInlineStrong
		.replace(/^[*_`\s]+/, "")
		.replace(/[\s*_`]+$/, "");

	return normalizeWhitespace(withoutEdgeDecorators);
}

function isLikelySectionHeading(line) {
	const trimmed = line.trim();
	if (!trimmed) {
		return false;
	}

	if (/^#{1,6}\s+\S/.test(trimmed)) {
		return true;
	}

	if (/^\*\*[^*]+\*\*:?$/.test(trimmed)) {
		return true;
	}

	if (/^[A-Z][A-Za-z0-9\s\-]{1,60}:?$/.test(trimmed) && !/[.!?]$/.test(trimmed)) {
		return true;
	}

	return false;
}

function isActionItemsHeading(line) {
	const trimmed = line.trim();
	if (!trimmed) {
		return false;
	}

	const normalized = stripMarkdownDecorators(
		trimmed
			.replace(/^#{1,6}\s*/, "")
			.replace(/:$/, "")
	)
		.toLowerCase();

	return /^(?:action\s*items?|tasks?)\b/.test(normalized);
}

function parseListItemLabel(line) {
	const listItemPattern =
		/^\s*(?:[-*+\u2022]\s+|\d+[\.)]\s+)(?:\[(?:\s|x|X)\]\s*)?(?:\u2610\s*)?(.+)$/;
	const checkboxOnlyPattern = /^\s*(?:\[(?:\s|x|X)\]\s*|\u2610\s+)(.+)$/;

	const listMatch = line.match(listItemPattern) || line.match(checkboxOnlyPattern);
	if (!listMatch?.[1]) {
		return null;
	}

	const normalizedLabel = stripMarkdownDecorators(listMatch[1]);
	return normalizedLabel.length > 0 ? normalizedLabel : null;
}

function isContinuationLine(line) {
	return /^\s{2,}\S/.test(line) || /^\t\S/.test(line);
}

function truncateWords(value, maxWords) {
	const words = value.split(/\s+/).filter(Boolean);
	return words.slice(0, maxWords).join(" ").trim();
}

function isGenericPlanTitle(value) {
	const normalizedTitle = normalizeWhitespace(
		stripMarkdownDecorators(value || "")
	).toLowerCase();
	if (!normalizedTitle) {
		return true;
	}

	return (
		normalizedTitle === "plan" ||
		normalizedTitle === "execution plan" ||
		normalizedTitle === "project plan" ||
		normalizedTitle === "work plan" ||
		normalizedTitle === "task plan" ||
		normalizedTitle === "untitled task run"
	);
}

function derivePlanTitleFromTasks(tasks) {
	if (!Array.isArray(tasks) || tasks.length === 0) {
		return "Untitled task run";
	}

	for (const task of tasks) {
		const normalizedLabel = normalizeWhitespace(
			stripMarkdownDecorators(task.label || "")
		);
		if (!normalizedLabel) {
			continue;
		}

		const emDashIndex = normalizedLabel.indexOf("—");
		const heading = emDashIndex === -1
			? normalizedLabel
			: normalizeWhitespace(
					stripMarkdownDecorators(normalizedLabel.slice(0, emDashIndex))
				) || normalizedLabel;
		if (!heading || isGenericPlanTitle(heading)) {
			continue;
		}

		return truncateWords(heading, 8);
	}

	return "Untitled task run";
}

function derivePlanTitle(lines, actionItemsHeadingIndex) {
	for (let index = 0; index < actionItemsHeadingIndex; index += 1) {
		const line = lines[index];
		const headingMatch = line.match(/^\s*#{1,6}\s+(.+?)\s*$/);
		if (!headingMatch?.[1]) {
			continue;
		}

		const headingText = stripMarkdownDecorators(headingMatch[1]);
		if (!headingText || isActionItemsHeading(headingText)) {
			continue;
		}

		return truncateWords(headingText, 8);
	}

	for (let index = 0; index < actionItemsHeadingIndex; index += 1) {
		const line = lines[index].trim();
		if (!line || isLikelySectionHeading(line)) {
			continue;
		}

		const label = parseListItemLabel(line);
		if (label) {
			continue;
		}

		const normalizedLine = stripMarkdownDecorators(line);
		if (!normalizedLine) {
			continue;
		}

		return truncateWords(normalizedLine, 8);
	}

	return "Untitled task run";
}

function derivePlanDescription(lines, stopIndex) {
	if (!Array.isArray(lines) || lines.length === 0) {
		return undefined;
	}

	const upperBound =
		typeof stopIndex === "number" && stopIndex >= 0
			? Math.min(stopIndex, lines.length)
			: lines.length;

	const paragraphs = [];
	let currentParagraph = [];

	const flushParagraph = () => {
		if (currentParagraph.length === 0) {
			return;
		}
		paragraphs.push(normalizeWhitespace(currentParagraph.join(" ")));
		currentParagraph = [];
	};

	for (let index = 0; index < upperBound; index += 1) {
		const trimmedLine = lines[index].trim();
		if (!trimmedLine) {
			flushParagraph();
			continue;
		}

		if (isLikelySectionHeading(trimmedLine) || parseListItemLabel(trimmedLine)) {
			flushParagraph();
			continue;
		}

		currentParagraph.push(stripMarkdownDecorators(trimmedLine));
	}
	flushParagraph();

	for (const paragraph of paragraphs) {
		if (!paragraph || isGenericPlanTitle(paragraph)) {
			continue;
		}
		if (paragraph.length > 240) {
			return paragraph.slice(0, 239).trimEnd() + "…";
		}
		return paragraph;
	}

	return undefined;
}

function deriveProgressivePlanTitle(lines, listStartIndex) {
	for (let index = 0; index < listStartIndex; index += 1) {
		const line = lines[index];
		const listItemLabel = parseListItemLabel(line);
		if (listItemLabel) {
			continue;
		}

		const normalizedLine = stripMarkdownDecorators(
			line
				.replace(/^#{1,6}\s*/, "")
				.replace(/:$/, "")
		);
		if (!normalizedLine || isActionItemsHeading(normalizedLine)) {
			continue;
		}

		return truncateWords(normalizedLine, 8);
	}

	return derivePlanTitle(lines, listStartIndex);
}

function hasPlanSignal(value) {
	return /\b(action\s*items?|plan|steps?|tasks?|roadmap|timeline|milestones?)\b/i.test(
		value
	);
}

function hasPhaseHeadingSignal(lines) {
	if (!Array.isArray(lines) || lines.length === 0) {
		return false;
	}

	return lines.some((line) =>
		/^\s*(?:#{1,6}\s+)?phase\s+\d+\b/i.test(line.trim())
	);
}

function isLikelyQuestionTaskLabel(label) {
	const normalizedLabel = normalizeWhitespace(stripMarkdownDecorators(label || ""));
	if (!normalizedLabel) {
		return false;
	}

	if (/[?]$/.test(normalizedLabel)) {
		return true;
	}

	return /^(what|which|when|where|who|why|how|can|should|do|does|is|are)\b/i.test(
		normalizedLabel
	);
}

function parseNumberedListItemLabel(line) {
	const numberedItemPattern =
		/^\s*\d+[\.)]\s+(?:\[(?:\s|x|X)\]\s*)?(?:\u2610\s*)?(.+)$/;
	const numberedMatch = line.match(numberedItemPattern);
	if (!numberedMatch?.[1]) {
		return null;
	}

	const normalizedLabel = stripMarkdownDecorators(numberedMatch[1]);
	return normalizedLabel.length > 0 ? normalizedLabel : null;
}

function findFirstNumberedListItemIndex(lines) {
	for (let index = 0; index < lines.length; index += 1) {
		if (parseNumberedListItemLabel(lines[index])) {
			return index;
		}
	}

	return -1;
}

function collectStructuredPlanTasks(lines, maxTasks) {
	const tasks = [];
	let activeTaskIndex = -1;

	for (let index = 0; index < lines.length; index += 1) {
		const line = lines[index];
		const numberedLabel = parseNumberedListItemLabel(line);
		if (numberedLabel) {
			tasks.push({
				id: `task-${tasks.length + 1}`,
				label: numberedLabel,
				blockedBy: [],
			});
			activeTaskIndex = tasks.length - 1;
			if (tasks.length >= maxTasks) {
				break;
			}
			continue;
		}

		if (activeTaskIndex !== -1 && isContinuationLine(line)) {
			tasks[activeTaskIndex].label = normalizeWhitespace(
				`${tasks[activeTaskIndex].label} ${line.trim()}`
			);
			continue;
		}

		activeTaskIndex = -1;
	}

	return tasks;
}

function isLikelyNarrativeIntroLine(value) {
	return /^(?:thanks|thank you|here'?s|let me|i(?:'|’)ll|i will|based on)\b/i.test(
		value
	);
}

function normalizeTitleCandidate(line) {
	const normalizedLine = stripMarkdownDecorators(
		(line || "")
			.replace(/^#{1,6}\s*/, "")
			.replace(/:$/, "")
	);
	if (!normalizedLine) {
		return "";
	}

	return normalizeWhitespace(normalizedLine);
}

function deriveStructuredPlanTitle(lines, listStartIndex, tasks) {
	for (let index = 0; index < listStartIndex; index += 1) {
		const line = lines[index];
		if (parseListItemLabel(line)) {
			continue;
		}

		const candidate = normalizeTitleCandidate(line);
		if (!candidate) {
			continue;
		}
		if (isActionItemsHeading(candidate)) {
			continue;
		}
		if (/^phase\s+\d+\b/i.test(candidate)) {
			continue;
		}
		if (!/\bplan\b/i.test(candidate)) {
			continue;
		}
		if (candidate.length > 60) {
			continue;
		}
		if (/[.!?]$/.test(candidate)) {
			continue;
		}
		if (isLikelyNarrativeIntroLine(candidate)) {
			continue;
		}

		return truncateWords(candidate, 8);
	}

	const fallbackTitle = deriveProgressivePlanTitle(lines, listStartIndex);
	if (!isGenericPlanTitle(fallbackTitle)) {
		return fallbackTitle;
	}

	return derivePlanTitleFromTasks(tasks);
}

function parseTaskHeadingLabel(line) {
	const headingMatch = line.match(/^\s*#{1,6}\s*task\s+\d+\s*:\s*(.+)$/i);
	if (!headingMatch?.[1]) {
		return null;
	}

	const normalizedLabel = stripMarkdownDecorators(headingMatch[1]);
	return normalizedLabel.length > 0 ? normalizedLabel : null;
}

function collectHeadingBasedPlanTasks(lines, maxTasks) {
	const tasks = [];

	for (let index = 0; index < lines.length; index += 1) {
		const label = parseTaskHeadingLabel(lines[index]);
		if (!label) {
			continue;
		}

		tasks.push({
			id: `task-${tasks.length + 1}`,
			label,
			blockedBy: [],
		});
		if (tasks.length >= maxTasks) {
			break;
		}
	}

	return tasks;
}

function findFirstListItemIndex(lines, startIndex = 0) {
	for (let index = startIndex; index < lines.length; index += 1) {
		if (parseListItemLabel(lines[index])) {
			return index;
		}
	}

	return -1;
}

function collectPlanTasks(lines, startIndex, maxTasks) {
	const tasks = [];
	let hasSeenListItem = false;
	let activeTaskIndex = -1;

	for (let index = startIndex; index < lines.length; index += 1) {
		const line = lines[index];
		const listItemLabel = parseListItemLabel(line);
		if (listItemLabel) {
			hasSeenListItem = true;
			tasks.push({
				id: `task-${tasks.length + 1}`,
				label: listItemLabel,
				blockedBy: [],
			});
			activeTaskIndex = tasks.length - 1;
			if (tasks.length >= maxTasks) {
				break;
			}
			continue;
		}

		const trimmedLine = line.trim();
		if (!trimmedLine) {
			activeTaskIndex = -1;
			continue;
		}

		if (!hasSeenListItem) {
			if (isLikelySectionHeading(trimmedLine)) {
				break;
			}
			continue;
		}

		if (activeTaskIndex !== -1 && isContinuationLine(line)) {
			tasks[activeTaskIndex].label = normalizeWhitespace(
				`${tasks[activeTaskIndex].label} ${trimmedLine}`
			);
			continue;
		}

		if (isLikelySectionHeading(trimmedLine)) {
			break;
		}

		break;
	}

	return tasks;
}

function normalizeScopeLineCandidate(line) {
	const listLabel = parseListItemLabel(line);
	const baseLine = typeof listLabel === "string" ? listLabel : line;

	return normalizeWhitespace(
		stripMarkdownDecorators(
			(baseLine || "")
				.replace(/^#{1,6}\s*/, "")
				.replace(/:$/, "")
		)
	);
}

function isScopeHeading(line) {
	const normalized = normalizeScopeLineCandidate(line).toLowerCase();
	if (!normalized) {
		return false;
	}

	return /^scope(?:\s*&\s*boundaries)?$/.test(normalized);
}

function extractScopeInValue(line) {
	const normalized = normalizeScopeLineCandidate(line);
	if (!normalized) {
		return null;
	}

	const inMatch = normalized.match(/^in(?:\s*scope)?\s*:\s*(.+)$/i);
	if (!inMatch?.[1]) {
		return null;
	}

	return normalizeWhitespace(inMatch[1]);
}

function splitScopeInItems(value, maxItems) {
	if (typeof value !== "string") {
		return [];
	}

	const parts = [];
	let buffer = "";
	let nestedDepth = 0;
	for (const char of value) {
		if (char === "(" || char === "[" || char === "{") {
			nestedDepth += 1;
			buffer += char;
			continue;
		}
		if (char === ")" || char === "]" || char === "}") {
			nestedDepth = Math.max(nestedDepth - 1, 0);
			buffer += char;
			continue;
		}

		if (char === "," && nestedDepth === 0) {
			parts.push(buffer);
			buffer = "";
			continue;
		}

		buffer += char;
	}
	if (buffer.trim().length > 0) {
		parts.push(buffer);
	}

	const seen = new Set();
	const items = [];
	for (const part of parts) {
		const normalized = normalizeWhitespace(
			part
				.replace(/^[\-•*\s]+/, "")
				.replace(/^(?:and|or)\s+/i, "")
				.replace(/[.;:,]+$/, "")
		);
		if (!normalized) {
			continue;
		}

		const dedupeKey = normalized.toLowerCase();
		if (seen.has(dedupeKey)) {
			continue;
		}
		seen.add(dedupeKey);

		items.push(normalized);
		if (items.length >= maxItems) {
			break;
		}
	}

	return items;
}

function collectScopeInTasks(lines, maxTasks) {
	if (!Array.isArray(lines) || lines.length === 0) {
		return null;
	}

	const scopeHeadingIndex = lines.findIndex((line) => isScopeHeading(line));
	const searchStartIndex = scopeHeadingIndex === -1 ? 0 : scopeHeadingIndex + 1;

	for (let index = searchStartIndex; index < lines.length; index += 1) {
		const line = lines[index];
		const trimmedLine = line.trim();
		if (!trimmedLine) {
			continue;
		}
		if (
			scopeHeadingIndex !== -1 &&
			index > searchStartIndex &&
			isLikelySectionHeading(trimmedLine)
		) {
			break;
		}

		const inValue = extractScopeInValue(line);
		if (!inValue) {
			continue;
		}

		const taskLabels = splitScopeInItems(inValue, maxTasks);
		if (taskLabels.length === 0) {
			return null;
		}

		return {
			listStartIndex: index,
			tasks: taskLabels.map((label, taskIndex) => ({
				id: `task-${taskIndex + 1}`,
				label,
				blockedBy: [],
			})),
		};
	}

	return null;
}

function extractScopeBasedPlanPayload(lines, { minTasks, maxTasks }) {
	const scopeTaskCollection = collectScopeInTasks(lines, maxTasks);
	if (!scopeTaskCollection) {
		return null;
	}

	const tasks = inferTaskDependencies(scopeTaskCollection.tasks);
	if (tasks.length < minTasks) {
		return null;
	}

	const derivedTitle = deriveStructuredPlanTitle(
		lines,
		scopeTaskCollection.listStartIndex,
		tasks
	);
	const title = isGenericPlanTitle(derivedTitle)
		? derivePlanTitleFromTasks(tasks)
		: derivedTitle;

	return {
		type: "plan",
		title,
		tasks,
	};
}

function extractPlanWidgetPayloadFromText(rawText, options = {}) {
	if (typeof rawText !== "string") {
		return null;
	}

	const normalizedText = rawText.trim();
	if (!normalizedText) {
		return null;
	}

	const minTasks =
		typeof options.minTasks === "number" && options.minTasks > 0
			? Math.floor(options.minTasks)
			: DEFAULT_MIN_TASKS;
	const maxTasks =
		typeof options.maxTasks === "number" && options.maxTasks > 0
			? Math.floor(options.maxTasks)
			: MAX_TASKS;

	const lines = normalizedText.split(/\r?\n/);
	const actionItemsHeadingIndex = lines.findIndex((line) =>
		isActionItemsHeading(line)
	);
	if (actionItemsHeadingIndex === -1) {
		if (!hasPlanSignal(normalizedText)) {
			return null;
		}

		return extractScopeBasedPlanPayload(lines, { minTasks, maxTasks });
	}

	const tasks = inferTaskDependencies(
		collectPlanTasks(lines, actionItemsHeadingIndex + 1, maxTasks)
	);

	if (tasks.length < minTasks) {
		return null;
	}

	const derivedTitle = derivePlanTitle(lines, actionItemsHeadingIndex);
	const title = isGenericPlanTitle(derivedTitle)
		? derivePlanTitleFromTasks(tasks)
		: derivedTitle;
	const description = derivePlanDescription(lines, actionItemsHeadingIndex);

	return {
		type: "plan",
		title,
		description,
		markdown: normalizedText,
		tasks,
	};
}

function extractProgressivePlanWidgetPayloadFromText(rawText, options = {}) {
	if (typeof rawText !== "string") {
		return null;
	}

	const normalizedText = rawText.trim();
	if (!normalizedText) {
		return null;
	}

	const minTasks =
		typeof options.minTasks === "number" && options.minTasks > 0
			? Math.floor(options.minTasks)
			: DEFAULT_PROGRESSIVE_MIN_TASKS;
	const maxTasks =
		typeof options.maxTasks === "number" && options.maxTasks > 0
			? Math.floor(options.maxTasks)
			: MAX_TASKS;
	const requirePlanSignal = options.requirePlanSignal !== false;
	const requireActionItemsHeading = options.requireActionItemsHeading === true;

	const lines = normalizedText.split(/\r?\n/);
	const actionItemsHeadingIndex = lines.findIndex((line) =>
		isActionItemsHeading(line)
	);
	if (requireActionItemsHeading && actionItemsHeadingIndex === -1) {
		if (requirePlanSignal && !hasPlanSignal(normalizedText)) {
			return null;
		}

		return extractScopeBasedPlanPayload(lines, { minTasks, maxTasks });
	}
	if (actionItemsHeadingIndex === -1 && requirePlanSignal && !hasPlanSignal(normalizedText)) {
		return null;
	}

	const listStartIndex =
		actionItemsHeadingIndex !== -1
			? actionItemsHeadingIndex + 1
			: findFirstListItemIndex(lines);
	if (listStartIndex === -1) {
		return null;
	}

	const tasks = inferTaskDependencies(
		collectPlanTasks(lines, listStartIndex, maxTasks)
	);
	if (tasks.length < minTasks) {
		return null;
	}

	const derivedTitle =
		actionItemsHeadingIndex !== -1
			? derivePlanTitle(lines, actionItemsHeadingIndex)
			: deriveProgressivePlanTitle(lines, listStartIndex);
	const title = isGenericPlanTitle(derivedTitle)
		? derivePlanTitleFromTasks(tasks)
		: derivedTitle;
	const description = derivePlanDescription(lines, listStartIndex);

	return {
		type: "plan",
		title,
		description,
		markdown: rawText,
		tasks,
	};
}

function extractPlanWidgetPayloadFromStructuredText(rawText, options = {}) {
	if (typeof rawText !== "string") {
		return null;
	}

	const normalizedText = rawText.trim();
	if (!normalizedText) {
		return null;
	}

	const minTasks =
		typeof options.minTasks === "number" && options.minTasks > 0
			? Math.floor(options.minTasks)
			: DEFAULT_MIN_TASKS;
	const maxTasks =
		typeof options.maxTasks === "number" && options.maxTasks > 0
			? Math.floor(options.maxTasks)
			: MAX_TASKS;

	const lines = normalizedText.split(/\r?\n/);
	const hasPlanLikeSignal = hasPlanSignal(normalizedText);
	const hasPhaseSignal = hasPhaseHeadingSignal(lines);
	if (!hasPlanLikeSignal && !hasPhaseSignal) {
		return null;
	}

	const numberedTasks = collectStructuredPlanTasks(lines, maxTasks);
	const tasks = inferTaskDependencies(numberedTasks);
	if (tasks.length < minTasks) {
		return null;
	}

	const questionLikeTaskCount = tasks.reduce(
		(count, task) =>
			isLikelyQuestionTaskLabel(task.label) ? count + 1 : count,
		0
	);
	if (questionLikeTaskCount >= Math.ceil(tasks.length / 2)) {
		return null;
	}

	const firstListItemIndex = findFirstNumberedListItemIndex(lines);
	const title =
		firstListItemIndex !== -1
			? deriveStructuredPlanTitle(lines, firstListItemIndex, tasks)
			: derivePlanTitleFromTasks(tasks);
	const description = derivePlanDescription(lines, firstListItemIndex);

	return {
		type: "plan",
		title,
		description,
		markdown: normalizedText,
		tasks,
	};
}

function extractPlanWidgetPayloadFromExitPlanToolInput(toolInput, options = {}) {
	let planMarkdown = null;

	if (toolInput && typeof toolInput === "object" && !Array.isArray(toolInput)) {
		planMarkdown =
			typeof toolInput.plan === "string" && toolInput.plan.trim()
				? toolInput.plan
				: null;
	} else if (typeof toolInput === "string" && toolInput.trim()) {
		const trimmedInput = toolInput.trim();
		try {
			const parsed = JSON.parse(trimmedInput);
			if (parsed && typeof parsed === "object" && typeof parsed.plan === "string" && parsed.plan.trim()) {
				planMarkdown = parsed.plan;
			} else {
				planMarkdown = trimmedInput;
			}
		} catch {
			planMarkdown = trimmedInput;
		}
	}

	if (!planMarkdown) {
		return null;
	}

	const extractedPayload =
		extractPlanWidgetPayloadFromText(planMarkdown, options) ||
		extractPlanWidgetPayloadFromStructuredText(planMarkdown, options) ||
		extractProgressivePlanWidgetPayloadFromText(planMarkdown, {
			...options,
			requirePlanSignal: false,
			requireActionItemsHeading: false,
		});
	if (extractedPayload) {
		return extractedPayload;
	}

	const lines = planMarkdown.trim().split(/\r?\n/);
	const maxTasks =
		typeof options.maxTasks === "number" && options.maxTasks > 0
			? Math.floor(options.maxTasks)
			: MAX_TASKS;
	const minTasks =
		typeof options.minTasks === "number" && options.minTasks > 0
			? Math.floor(options.minTasks)
			: DEFAULT_MIN_TASKS;
	const tasks = inferTaskDependencies(collectHeadingBasedPlanTasks(lines, maxTasks));
	if (tasks.length < minTasks) {
		return null;
	}

	const headingIndex = lines.findIndex((line) => parseTaskHeadingLabel(line));
	const title =
		headingIndex > 0
			? deriveStructuredPlanTitle(lines, headingIndex, tasks)
			: derivePlanTitleFromTasks(tasks);
	const description = derivePlanDescription(lines, headingIndex);

	return {
		type: "plan",
		title,
		description,
		markdown: planMarkdown,
		tasks,
	};
}

module.exports = {
	extractPlanWidgetPayloadFromExitPlanToolInput,
	extractPlanWidgetPayloadFromText,
	extractProgressivePlanWidgetPayloadFromText,
	extractPlanWidgetPayloadFromStructuredText,
};
