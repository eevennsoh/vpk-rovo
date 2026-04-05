const { inferTaskDependencies } = require("./dag-inference");
const { getNonEmptyString } = require("./shared-utils");

const MAX_TASKS = 20;
const DEFAULT_MIN_TASKS = 2;
const MAX_RECURSION_DEPTH = 6;
const NEEDS_PREFIX_PATTERN = /^\s*\[\s*(?:blocked\s+by|needs)\s+([^\]]+)\]\s*/i;

function normalizeWhitespace(value) {
	return value.replace(/\s+/g, " ").trim();
}

function dedupeStringArray(values) {
	if (!Array.isArray(values)) {
		return [];
	}

	const dedupedValues = [];
	const seenValues = new Set();
	for (const value of values) {
		const normalizedValue = getNonEmptyString(value);
		if (!normalizedValue || seenValues.has(normalizedValue)) {
			continue;
		}

		seenValues.add(normalizedValue);
		dedupedValues.push(normalizedValue);
	}

	return dedupedValues;
}

function normalizeTaskReference(value) {
	if (typeof value === "number" && Number.isInteger(value)) {
		return String(value);
	}

	const asString = getNonEmptyString(value);
	if (!asString) {
		return null;
	}

	if (/^\d+$/.test(asString)) {
		return String(Number.parseInt(asString, 10));
	}

	const taskMatch = asString.match(/^task-(\d+)$/i);
	if (taskMatch?.[1]) {
		return `task-${Number.parseInt(taskMatch[1], 10)}`;
	}

	return asString;
}

function normalizeTaskDependencies(value) {
	if (!Array.isArray(value)) {
		return [];
	}

	const normalizedDependencies = value
		.map((entry) => normalizeTaskReference(entry))
		.filter(Boolean);
	return dedupeStringArray(normalizedDependencies);
}

function parseNeedsDependencies(label) {
	const normalizedLabel = getNonEmptyString(label);
	if (!normalizedLabel) {
		return {
			label: null,
			dependencies: [],
		};
	}

	const needsMatch = normalizedLabel.match(NEEDS_PREFIX_PATTERN);
	if (!needsMatch?.[1]) {
		return {
			label: normalizeWhitespace(normalizedLabel),
			dependencies: [],
		};
	}

	const dependencies = dedupeStringArray(
		needsMatch[1]
			.split(",")
			.map((rawEntry) => normalizeTaskReference(rawEntry))
			.filter(Boolean)
	);

	const strippedLabel = normalizeWhitespace(normalizedLabel.slice(needsMatch[0].length));

	return {
		label: strippedLabel || normalizeWhitespace(normalizedLabel),
		dependencies,
	};
}

function truncateWords(value, maxWords) {
	const words = value.split(/\s+/).filter(Boolean);
	return words.slice(0, maxWords).join(" ").trim();
}

function looksLikeGenericTitle(value) {
	const normalized = normalizeWhitespace((value || "").toLowerCase());
	if (!normalized) {
		return true;
	}

	return (
		normalized === "plan" ||
		normalized === "execution plan" ||
		normalized === "project plan" ||
		normalized === "todo plan" ||
		normalized === "task plan"
	);
}

function derivePlanTitle(tasks, preferredTitle) {
	const normalizedPreferredTitle = getNonEmptyString(preferredTitle);
	if (normalizedPreferredTitle && !looksLikeGenericTitle(normalizedPreferredTitle)) {
		return truncateWords(normalizedPreferredTitle, 8);
	}

	for (const task of tasks) {
		const normalizedLabel = getNonEmptyString(task.label);
		if (!normalizedLabel) {
			continue;
		}

		return truncateWords(normalizedLabel, 8);
	}

	return "Implementation plan";
}

function isUpdateTodoToolName(toolName) {
	const normalizedToolName = getNonEmptyString(toolName);
	if (!normalizedToolName) {
		return false;
	}

	const lowered = normalizedToolName.toLowerCase();
	if (lowered === "update_todo") {
		return true;
	}

	return /(?:^|[./:_-])update_todo$/.test(lowered);
}

function normalizeTaskRecord(record, fallbackIndex) {
	if (!record || typeof record !== "object") {
		return null;
	}

	const label =
		getNonEmptyString(record.content) ||
		getNonEmptyString(record.label) ||
		getNonEmptyString(record.title) ||
		getNonEmptyString(record.task) ||
		getNonEmptyString(record.text) ||
		getNonEmptyString(record.active_form);
	if (!label) {
		return null;
	}

	const idValue = normalizeTaskReference(record.id);
	const id = idValue || `task-${fallbackIndex + 1}`;
	const parsedNeeds = parseNeedsDependencies(label);
	const normalizedLabel = parsedNeeds.label;
	if (!normalizedLabel) {
		return null;
	}

	const blockedByFromTool = normalizeTaskDependencies(record.blockedBy);
	const blockedBy = dedupeStringArray([
		...blockedByFromTool,
		...parsedNeeds.dependencies,
	]);

	return {
		id,
		label: normalizedLabel,
		blockedBy,
		hasExplicitBlockedBy: blockedBy.length > 0,
	};
}

function collectTasksFromTodoArray(value, maxTasks) {
	if (!Array.isArray(value)) {
		return [];
	}

	const tasks = [];
	for (const [index, entry] of value.entries()) {
		const normalizedTask = normalizeTaskRecord(entry, index);
		if (!normalizedTask) {
			continue;
		}

		tasks.push(normalizedTask);
		if (tasks.length >= maxTasks) {
			break;
		}
	}

	return tasks;
}

function parseJsonCandidate(value) {
	if (typeof value !== "string") {
		return null;
	}

	try {
		return JSON.parse(value);
	} catch {
		return null;
	}
}

function parseTodoJsonLine(line) {
	const trimmedLine = line.trim();
	if (!trimmedLine) {
		return null;
	}

	const lineWithoutListPrefix = trimmedLine.replace(/^[-*+]\s+/, "");
	const directJson = parseJsonCandidate(lineWithoutListPrefix);
	if (directJson) {
		return directJson;
	}

	const objectMatch = lineWithoutListPrefix.match(/(\{[\s\S]*\})/);
	if (!objectMatch?.[1]) {
		return null;
	}

	return parseJsonCandidate(objectMatch[1]);
}

function extractTodoBlock(text) {
	const markerIndex = text.toLowerCase().indexOf("<todo>");
	if (markerIndex === -1) {
		return null;
	}

	let block = text.slice(markerIndex + "<todo>".length);
	const endIndex = block.toLowerCase().indexOf("</todo>");
	if (endIndex !== -1) {
		block = block.slice(0, endIndex);
	}

	return block;
}

function collectTasksFromText(value, maxTasks) {
	const text = getNonEmptyString(value);
	if (!text) {
		return [];
	}

	const todoBlock = extractTodoBlock(text) || text;
	const parsedTasks = [];

	const lines = todoBlock.split(/\r?\n/);
	for (const line of lines) {
		if (parsedTasks.length >= maxTasks) {
			break;
		}

		const parsedLine = parseTodoJsonLine(line);
		if (!parsedLine) {
			continue;
		}

		if (Array.isArray(parsedLine)) {
			const nestedTasks = collectTasksFromTodoArray(parsedLine, maxTasks - parsedTasks.length);
			parsedTasks.push(...nestedTasks);
			continue;
		}

		const normalizedTask = normalizeTaskRecord(parsedLine, parsedTasks.length);
		if (normalizedTask) {
			parsedTasks.push(normalizedTask);
		}
	}

	return parsedTasks;
}

function collectTasksFromRawOutput(value, maxTasks, depth = 0) {
	if (depth > MAX_RECURSION_DEPTH || value === null || value === undefined) {
		return [];
	}

	if (typeof value === "string") {
		return collectTasksFromText(value, maxTasks);
	}

	if (Array.isArray(value)) {
		const directTasks = collectTasksFromTodoArray(value, maxTasks);
		if (directTasks.length > 0) {
			return directTasks;
		}

		const nestedTasks = [];
		for (const entry of value) {
			if (nestedTasks.length >= maxTasks) {
				break;
			}

			const nextTasks = collectTasksFromRawOutput(
				entry,
				maxTasks - nestedTasks.length,
				depth + 1
			);
			if (nextTasks.length > 0) {
				nestedTasks.push(...nextTasks);
			}
		}

		return nestedTasks;
	}

	if (typeof value !== "object") {
		return [];
	}

	const record = value;

	const directTaskArrays = [
		record.todos,
		record.tasks,
		record.items,
	];
	for (const candidate of directTaskArrays) {
		const directTasks = collectTasksFromTodoArray(candidate, maxTasks);
		if (directTasks.length > 0) {
			return directTasks;
		}
	}

	const textKeys = [
		"output",
		"outputPreview",
		"result",
		"message",
		"text",
		"stdout",
		"content",
	];
	for (const key of textKeys) {
		const textTasks = collectTasksFromText(record[key], maxTasks);
		if (textTasks.length > 0) {
			return textTasks;
		}
	}

	for (const nestedValue of Object.values(record)) {
		const nestedTasks = collectTasksFromRawOutput(nestedValue, maxTasks, depth + 1);
		if (nestedTasks.length > 0) {
			return nestedTasks;
		}
	}

	return [];
}

function dedupeTasks(tasks, maxTasks) {
	const seenLabels = new Set();
	const dedupedTasks = [];

	for (const task of tasks) {
		const normalizedLabel = normalizeWhitespace(task.label).toLowerCase();
		if (!normalizedLabel || seenLabels.has(normalizedLabel)) {
			continue;
		}

		seenLabels.add(normalizedLabel);
		dedupedTasks.push({
			id: normalizeTaskReference(task.id) || `task-${dedupedTasks.length + 1}`,
			label: normalizeWhitespace(task.label),
			blockedBy: normalizeTaskDependencies(task.blockedBy),
			hasExplicitBlockedBy: task.hasExplicitBlockedBy === true,
		});
		if (dedupedTasks.length >= maxTasks) {
			break;
		}
	}

	const canonicalTasks = dedupedTasks.map((task, index) => ({
		id: `task-${index + 1}`,
		rawId: task.id,
		label: task.label,
		blockedBy: task.blockedBy,
		hasExplicitBlockedBy: task.hasExplicitBlockedBy,
	}));

	const dependencyAliasMap = new Map();
	for (const [index, task] of canonicalTasks.entries()) {
		const canonicalId = task.id;
		const oneBasedIndex = String(index + 1);
		const aliases = dedupeStringArray([
			task.rawId,
			canonicalId,
			oneBasedIndex,
			`task-${oneBasedIndex}`,
		]);
		for (const alias of aliases) {
			if (!dependencyAliasMap.has(alias)) {
				dependencyAliasMap.set(alias, canonicalId);
			}
		}
	}

	const withCanonicalDependencies = canonicalTasks.map((task) => {
		const resolvedDependencies = [];
		const seenDependencies = new Set();

		for (const rawDependency of task.blockedBy) {
			const normalizedDependency = normalizeTaskReference(rawDependency);
			if (!normalizedDependency) {
				continue;
			}

			let canonicalDependencyId = dependencyAliasMap.get(normalizedDependency);
			if (!canonicalDependencyId) {
				const taskMatch = normalizedDependency.match(/^task-(\d+)$/);
				if (taskMatch?.[1]) {
					canonicalDependencyId = `task-${taskMatch[1]}`;
				} else if (/^\d+$/.test(normalizedDependency)) {
					canonicalDependencyId = `task-${normalizedDependency}`;
				}
			}

			if (
				!canonicalDependencyId ||
				canonicalDependencyId === task.id ||
				!dependencyAliasMap.has(canonicalDependencyId) ||
				seenDependencies.has(canonicalDependencyId)
			) {
				continue;
			}

			seenDependencies.add(canonicalDependencyId);
			resolvedDependencies.push(canonicalDependencyId);
		}

		return {
			id: task.id,
			label: task.label,
			blockedBy: resolvedDependencies,
			hasExplicitBlockedBy: task.hasExplicitBlockedBy,
		};
	});

	const hasAnyExplicitDependencies = withCanonicalDependencies.some(
		(task) => task.hasExplicitBlockedBy
	);
	if (hasAnyExplicitDependencies) {
		return withCanonicalDependencies.map((task) => ({
			id: task.id,
			label: task.label,
			blockedBy: task.blockedBy,
		}));
	}

	const inferredTasks = inferTaskDependencies(
		withCanonicalDependencies.map((task) => ({
			id: task.id,
			label: task.label,
			blockedBy: [],
		}))
	);

	return inferredTasks.map((task) => ({
		id: task.id,
		label: task.label,
		blockedBy: normalizeTaskDependencies(task.blockedBy),
	}));
}

function extractTasksFromObservation(observation, maxTasks) {
	if (!observation || typeof observation !== "object") {
		return [];
	}

	const rawOutputTasks = collectTasksFromRawOutput(observation.rawOutput, maxTasks);
	if (rawOutputTasks.length > 0) {
		return dedupeTasks(rawOutputTasks, maxTasks);
	}

	const textTasks = collectTasksFromText(observation.text, maxTasks);
	if (textTasks.length > 0) {
		return dedupeTasks(textTasks, maxTasks);
	}

	return [];
}

function extractUpdateTodoTasksFromObservations(observations, options = {}) {
	if (!Array.isArray(observations) || observations.length === 0) {
		return [];
	}

	const minTasks =
		typeof options.minTasks === "number" && options.minTasks > 0
			? Math.floor(options.minTasks)
			: DEFAULT_MIN_TASKS;
	const maxTasks =
		typeof options.maxTasks === "number" && options.maxTasks > 0
			? Math.floor(options.maxTasks)
			: MAX_TASKS;

	for (let index = observations.length - 1; index >= 0; index -= 1) {
		const observation = observations[index];
		if (!observation || typeof observation !== "object") {
			continue;
		}

		if (observation.phase !== "result" && observation.phase !== "error") {
			continue;
		}

		if (!isUpdateTodoToolName(observation.toolName)) {
			continue;
		}

		const tasks = extractTasksFromObservation(observation, maxTasks);
		if (tasks.length < minTasks) {
			continue;
		}

		return tasks;
	}

	return [];
}

function extractUpdateTodoPlanPayloadFromObservations(observations, options = {}) {
	const tasks = extractUpdateTodoTasksFromObservations(observations, options);
	if (tasks.length === 0) {
		return null;
	}

	return {
		type: "plan",
		title: derivePlanTitle(tasks, options.title),
		tasks,
	};
}

module.exports = {
	extractUpdateTodoTasksFromObservations,
	extractUpdateTodoPlanPayloadFromObservations,
};
