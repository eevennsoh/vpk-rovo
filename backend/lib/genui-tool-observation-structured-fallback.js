const { getNonEmptyString, isObjectRecord, clipText: _clipText, normalizeSentence, pluralize, parseMaybeJson } = require("./shared-utils");

const DEFAULT_MAX_TOOL_GROUPS = 24;
const DEFAULT_MAX_TOTAL_EVENTS = 160;
const DEFAULT_MAX_EVENTS_PER_TOOL = 40;
const DEFAULT_MAX_DETAIL_LINES_PER_EVENT = 18;
const DEFAULT_MAX_EVENT_PREVIEW_CHARS = 1600;
const DEFAULT_MAX_LINE_CHARS = 220;
const DEFAULT_MAX_LINKS_PER_EVENT = 4;
const MAX_SCAN_NODES = 1800;
const URL_PATTERN = /https?:\/\/[^\s<>"')\]}]+/gi;
const TOOL_TAG_BLOCK_PATTERN = /<tool\b[^>]*>[\s\S]*?<\/tool>/gi;
const TOOL_TAG_PATTERN = /<\/?tool\b[^>]*>/gi;
const TOOL_SIGNATURE_PATTERN = /\b[a-z0-9]+(?:_[a-z0-9]+){2,}\s*\([^)]*\)\s*:/i;
const JSON_PUNCTUATION_LINE_PATTERN = /^[\s[\]{}:,."']+$/;
const SLACK_CREATE_MESSAGE_TOOL_KEY = "slack_slack_atlassian_channel_create_message";
const SCHEMA_ROOT_KEYS = new Set([
	"type",
	"properties",
	"required",
	"items",
	"additionalproperties",
	"oneof",
	"anyof",
	"allof",
	"definitions",
	"$defs",
	"$schema",
	"patternproperties",
]);
const ISSUE_KEY_PATTERN = /\b[A-Z][A-Z0-9]+-\d+\b/;
const WORK_SUMMARY_INTENT_PATTERN =
	/\b(work\s*summary|summary\s+of\s+work|work\s+activity|last\s+\d+\s*(?:day|days|week|weeks|month|months)\s+of\s+work|past\s+\d+\s*(?:day|days|week|weeks|month|months)\s+of\s+work)\b/i;
const WORK_SUMMARY_TIME_WINDOW_PATTERN =
	/\b(last|past|recent)\b[\s\S]{0,48}\b(\d+\s*(?:day|days|week|weeks|month|months)|7d|14d|30d)\b/i;

/** @param {unknown} value @returns {string | null} */
function clipText(value, maxChars = DEFAULT_MAX_LINE_CHARS) {
	return _clipText(value, maxChars);
}

function isGenericFallbackDescription(value) {
	const normalized = normalizeSentence(value);
	return (
		normalized === "generated from tool execution results" ||
		normalized === "generated from tool execution results and errors" ||
		normalized === "generated from successful and failed tool executions" ||
		normalized === "generated from successful tool executions" ||
		normalized === "generated from tool execution errors" ||
		normalized === "generated from tool executions"
	);
}

function toStructuredPayload(value) {
	if (value === null || value === undefined) {
		return null;
	}

	if (Array.isArray(value) || isObjectRecord(value)) {
		return value;
	}

	if (typeof value === "string") {
		return parseMaybeJson(value);
	}

	return null;
}

/**
 * Try to find a JSON object or array embedded within a plain-text string.
 * Handles cases where tool output has text prefixes before the JSON payload.
 */
function extractEmbeddedJson(text) {
	if (typeof text !== "string") return null;

	// Find the first { or [ that could start JSON
	const objStart = text.indexOf("{");
	const arrStart = text.indexOf("[");
	const start = objStart === -1 ? arrStart : arrStart === -1 ? objStart : Math.min(objStart, arrStart);
	if (start === -1) return null;

	// If it starts at 0, parseMaybeJson already tried and failed
	if (start === 0) return null;

	const candidate = text.slice(start).trim();
	try {
		return JSON.parse(candidate);
	} catch {
		return null;
	}
}

function normalizeToolName(toolName) {
	const normalized = getNonEmptyString(toolName);
	if (!normalized) {
		return "Tool";
	}

	return normalized
		.replace(/^mcp__/i, "")
		.replace(/^functions\./i, "")
		.replace(/__/g, " / ")
		.replace(/[_:/.-]+/g, " ")
		.replace(/\s+/g, " ")
		.trim();
}

function normalizeToolKey(toolName) {
	const normalized = getNonEmptyString(toolName);
	if (!normalized) {
		return "";
	}

	return normalized
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "_")
		.replace(/^_+|_+$/g, "")
		.trim();
}

function isSlackCreateMessageTool(toolName) {
	return normalizeToolKey(toolName) === SLACK_CREATE_MESSAGE_TOOL_KEY;
}

function stripToolDefinitionMarkup(value) {
	if (typeof value !== "string") {
		return "";
	}

	return value
		.replace(TOOL_TAG_BLOCK_PATTERN, " ")
		.replace(TOOL_TAG_PATTERN, " ");
}

function countSchemaTokens(value) {
	if (typeof value !== "string" || !value.trim()) {
		return 0;
	}

	return [...value.matchAll(
		/"(?:type|properties|required|items|additionalProperties|oneOf|anyOf|allOf|definitions|\$defs|patternProperties)"\s*:/gi
	)].length;
}

function isLikelySchemaNoiseLine(value) {
	const text = getNonEmptyString(value);
	if (!text) {
		return false;
	}

	const tokenCount = countSchemaTokens(text);
	if (tokenCount >= 2) {
		return true;
	}

	if (
		tokenCount >= 1 &&
		/"type"\s*:\s*"object"/i.test(text) &&
		/"properties"\s*:/i.test(text)
	) {
		return true;
	}

	if (
		JSON_PUNCTUATION_LINE_PATTERN.test(text) &&
		/[{}\[\]]/.test(text)
	) {
		return true;
	}

	return false;
}

function isLikelyToolDefinitionLine(value) {
	const text = getNonEmptyString(value);
	if (!text) {
		return false;
	}

	if (/<\/?tool\b/i.test(text)) {
		return true;
	}

	if (TOOL_SIGNATURE_PATTERN.test(text) && /\btool\b/i.test(text)) {
		return true;
	}

	return false;
}

function sanitizeObservationLine(value, maxChars = DEFAULT_MAX_LINE_CHARS) {
	const withoutToolMarkup = stripToolDefinitionMarkup(value)
		.replace(/\s+/g, " ")
		.trim();
	if (!withoutToolMarkup) {
		return null;
	}

	if (
		isLikelyToolDefinitionLine(withoutToolMarkup) ||
		isLikelySchemaNoiseLine(withoutToolMarkup)
	) {
		return null;
	}

	return clipText(withoutToolMarkup, maxChars);
}

function sanitizeObservationLines(
	lines,
	{
		maxLines = DEFAULT_MAX_DETAIL_LINES_PER_EVENT,
		maxChars = DEFAULT_MAX_LINE_CHARS,
		toolName,
		phase = "result",
	} = {}
) {
	const values = Array.isArray(lines) ? lines : [];
	const cleanedLines = [];
	const seen = new Set();

	for (const line of values) {
		if (cleanedLines.length >= maxLines) {
			break;
		}

		const cleanedLine = sanitizeObservationLine(line, maxChars);
		if (!cleanedLine) {
			continue;
		}

		const dedupeKey = cleanedLine.toLowerCase();
		if (seen.has(dedupeKey)) {
			continue;
		}

		seen.add(dedupeKey);
		cleanedLines.push(cleanedLine);
	}

	if (
		cleanedLines.length === 0 &&
		phase === "result" &&
		isSlackCreateMessageTool(toolName)
	) {
		cleanedLines.push("Slack message sent.");
	}

	return cleanedLines.slice(0, maxLines);
}

function extractUrlsFromString(value) {
	if (typeof value !== "string") {
		return [];
	}

	const matches = value.match(URL_PATTERN);
	return Array.isArray(matches) ? matches : [];
}

function walkNodes(rootValue, visit, maxNodes = MAX_SCAN_NODES) {
	const queue = [{ value: rootValue, path: "" }];
	let visited = 0;

	while (queue.length > 0 && visited < maxNodes) {
		const { value, path } = queue.shift();
		if (value === undefined || value === null) {
			continue;
		}

		visited += 1;
		visit(value, path);

		if (Array.isArray(value)) {
			for (let index = 0; index < value.length; index += 1) {
				const childPath = path ? `${path}[${index}]` : `[${index}]`;
				queue.push({
					value: value[index],
					path: childPath,
				});
			}
			continue;
		}

		if (isObjectRecord(value)) {
			for (const [key, nestedValue] of Object.entries(value)) {
				const childPath = path ? `${path}.${key}` : key;
				queue.push({
					value: nestedValue,
					path: childPath,
				});
			}
		}
	}
}

function lineFromLeaf(path, value, maxChars) {
	const pathLabel = clipText(path || "value", 80);
	if (!pathLabel) {
		return null;
	}

	if (typeof value === "string") {
		const clippedValue = clipText(value, maxChars);
		if (!clippedValue) {
			return null;
		}
		return `${pathLabel}: ${clippedValue}`;
	}

	if (typeof value === "number" || typeof value === "boolean") {
		return `${pathLabel}: ${String(value)}`;
	}

	return null;
}

function collectDetailLinesFromStructuredPayload(
	payload,
	maxLines = DEFAULT_MAX_DETAIL_LINES_PER_EVENT,
	maxChars = DEFAULT_MAX_LINE_CHARS
) {
	if (!payload || (!Array.isArray(payload) && !isObjectRecord(payload))) {
		return [];
	}

	const lines = [];
	const seenLines = new Set();

	if (Array.isArray(payload)) {
		lines.push(`items: ${payload.length}`);
	}

	walkNodes(payload, (node, path) => {
		if (lines.length >= maxLines) {
			return;
		}

		if (Array.isArray(node)) {
			const pathLabel = clipText(path || "items", 80);
			if (!pathLabel) {
				return;
			}

			const arraySummary = `${pathLabel}: ${node.length} item${node.length === 1 ? "" : "s"}`;
			if (!seenLines.has(arraySummary)) {
				lines.push(arraySummary);
				seenLines.add(arraySummary);
			}
			return;
		}

		const leafLine = lineFromLeaf(path, node, maxChars);
		if (!leafLine || seenLines.has(leafLine)) {
			return;
		}

		lines.push(leafLine);
		seenLines.add(leafLine);
	});

	return lines.slice(0, maxLines);
}

function collectLinksFromObservation(observation, maxLinks = DEFAULT_MAX_LINKS_PER_EVENT) {
	const links = [];
	const seen = new Set();

	const pushLink = (candidate) => {
		const link = clipText(candidate, 300);
		if (!link || seen.has(link)) {
			return;
		}
		seen.add(link);
		links.push(link);
	};

	const previewText = getNonEmptyString(observation?.text);
	if (previewText) {
		for (const url of extractUrlsFromString(previewText)) {
			if (links.length >= maxLinks) {
				return links;
			}
			pushLink(url);
		}
	}

	const rawOutput =
		toStructuredPayload(observation?.rawOutput) ||
		toStructuredPayload(observation?.text);
	if (!rawOutput) {
		return links;
	}

	walkNodes(rawOutput, (node) => {
		if (links.length >= maxLinks) {
			return;
		}
		if (typeof node !== "string") {
			return;
		}

		for (const url of extractUrlsFromString(node)) {
			if (links.length >= maxLinks) {
				break;
			}
			pushLink(url);
		}
	});

	return links;
}

function isLikelyToolSchemaPayload(payload) {
	if (!isObjectRecord(payload)) {
		return false;
	}

	const keys = Object.keys(payload);
	if (keys.length === 0) {
		return false;
	}

	const normalizedKeys = keys.map((key) => key.toLowerCase());
	const schemaKeyCount = normalizedKeys.reduce(
		(count, key) => count + (SCHEMA_ROOT_KEYS.has(key) ? 1 : 0),
		0
	);
	const hasSchemaCoreKeys =
		normalizedKeys.includes("type") &&
		(normalizedKeys.includes("properties") || normalizedKeys.includes("items"));

	if (hasSchemaCoreKeys) {
		return true;
	}

	return schemaKeyCount >= 2 && schemaKeyCount >= normalizedKeys.length - 1;
}

function collectDetailLinesFromObservation(
	observation,
	{
		maxLines = DEFAULT_MAX_DETAIL_LINES_PER_EVENT,
		maxChars = DEFAULT_MAX_LINE_CHARS,
	} = {}
) {
	const phase =
		observation?.phase === "error" || observation?.phase === "result"
			? observation.phase
			: "result";
	const toolName = getNonEmptyString(observation?.toolName) || "";
	const rawOutput =
		toStructuredPayload(observation?.rawOutput) ||
		toStructuredPayload(observation?.text);
	if (rawOutput && !isLikelyToolSchemaPayload(rawOutput)) {
		const structuredLines = collectDetailLinesFromStructuredPayload(
			rawOutput,
			maxLines,
			maxChars
		);
		const sanitizedStructuredLines = sanitizeObservationLines(structuredLines, {
			maxLines,
			maxChars,
			toolName,
			phase,
		});
		if (sanitizedStructuredLines.length > 0) {
			return sanitizedStructuredLines;
		}
	}

	const previewText = getNonEmptyString(observation?.text);
	const rawLines = previewText ? previewText.split(/\r?\n/) : [];
	return sanitizeObservationLines(rawLines, {
		maxLines,
		maxChars,
		toolName,
		phase,
	});
}

function toRenderableObservation(observation, index, options) {
	const phase =
		observation?.phase === "error" || observation?.phase === "result"
			? observation.phase
			: "result";
	const rawToolName = getNonEmptyString(observation?.toolName) || "Tool";
	const toolName = normalizeToolName(rawToolName);
	const detailLines = collectDetailLinesFromObservation(observation, {
		maxLines: options.maxDetailLines,
		maxChars: options.maxLineChars,
	});
	const previewCandidates = sanitizeObservationLines(
		typeof observation?.text === "string"
			? observation.text.split(/\r?\n/)
			: [],
		{
			maxLines: 1,
			maxChars: options.maxPreviewChars,
			toolName: rawToolName,
			phase,
		}
	);
	const preview =
		previewCandidates[0] ||
		detailLines[0] ||
		(phase === "error" ? "Tool execution failed." : "Tool completed successfully.");
	const links = collectLinksFromObservation(observation, options.maxLinks);

	return {
		id: `${toolName.toLowerCase()}-${index}`,
		phase,
		toolName,
		preview,
		detailLines,
		links,
	};
}

function toObservationDedupeKey(observation) {
	if (!observation || typeof observation !== "object") {
		return null;
	}

	const phase = observation.phase === "result" || observation.phase === "error"
		? observation.phase
		: null;
	if (!phase) {
		return null;
	}

	const normalizedTool = normalizeToolName(observation.toolName).toLowerCase();
	const textFingerprint = clipText(
		getNonEmptyString(observation.text) || "",
		DEFAULT_MAX_EVENT_PREVIEW_CHARS
	);
	if (!textFingerprint) {
		return null;
	}

	return `${phase}|${normalizedTool}|${textFingerprint.toLowerCase()}`;
}

function dedupeObservations(observations) {
	const entries = Array.isArray(observations) ? observations : [];
	const deduped = [];
	const seenKeys = new Set();

	for (const observation of entries) {
		const key = toObservationDedupeKey(observation);
		if (!key) {
			continue;
		}

		if (seenKeys.has(key)) {
			continue;
		}

		seenKeys.add(key);
		deduped.push(observation);
	}

	return deduped;
}

function groupObservationsByTool(observations, options) {
	const groups = new Map();
	let order = 0;

	for (let index = 0; index < observations.length; index += 1) {
		const observation = observations[index];
		if (!observation || (observation.phase !== "result" && observation.phase !== "error")) {
			continue;
		}

		const renderableObservation = toRenderableObservation(observation, index, options);
		const groupKey = renderableObservation.toolName.toLowerCase();

		if (!groups.has(groupKey)) {
			groups.set(groupKey, {
				toolName: renderableObservation.toolName,
				order,
				observations: [],
			});
			order += 1;
		}

		groups.get(groupKey).observations.push(renderableObservation);
	}

	for (const group of groups.values()) {
		const resultObservations = group.observations.filter(
			(observation) => observation.phase === "result"
		);
		const errorObservations = group.observations.filter(
			(observation) => observation.phase === "error"
		);
		group.observations = [...resultObservations, ...errorObservations];
		group.hasResults = resultObservations.length > 0;
	}

	return Array.from(groups.values()).sort((left, right) => left.order - right.order);
}

function allocateGroupsAndEvents(
	groups,
	{
		maxToolGroups = DEFAULT_MAX_TOOL_GROUPS,
		maxTotalEvents = DEFAULT_MAX_TOTAL_EVENTS,
		maxEventsPerTool = DEFAULT_MAX_EVENTS_PER_TOOL,
	} = {}
) {
	const selectedGroups = groups.slice(0, maxToolGroups);
	let remainingEventBudget = maxTotalEvents;

	const renderedGroups = selectedGroups.map((group) => {
		const allowedForGroup = Math.max(
			0,
			Math.min(maxEventsPerTool, remainingEventBudget)
		);
		const renderedObservations = group.observations.slice(0, allowedForGroup);
		remainingEventBudget -= renderedObservations.length;

		return {
			toolName: group.toolName,
			hasResults: group.hasResults === true,
			total: group.observations.length,
			rendered: renderedObservations,
			omitted: group.observations.length - renderedObservations.length,
		};
	});

	const omittedGroups = groups.length - selectedGroups.length;
	const omittedEventsFromUnselectedGroups = groups
		.slice(maxToolGroups)
		.reduce((sum, group) => sum + group.observations.length, 0);
	const omittedEventsFromBudget = renderedGroups.reduce(
		(sum, group) => sum + group.omitted,
		0
	);

	return {
		renderedGroups,
		omittedGroups,
		omittedEvents: omittedEventsFromUnselectedGroups + omittedEventsFromBudget,
	};
}

function readStringCandidate(value, maxChars = DEFAULT_MAX_LINE_CHARS) {
	if (typeof value === "string") {
		return clipText(value, maxChars);
	}

	if (typeof value === "number" || typeof value === "boolean") {
		return clipText(String(value), maxChars);
	}

	if (!isObjectRecord(value)) {
		return null;
	}

	const nestedCandidateKeys = [
		"name",
		"value",
		"text",
		"label",
		"title",
		"displayName",
		"key",
	];
	for (const nestedKey of nestedCandidateKeys) {
		const nestedValue = value[nestedKey];
		if (typeof nestedValue === "string") {
			const normalized = clipText(nestedValue, maxChars);
			if (normalized) {
				return normalized;
			}
		}
	}

	return null;
}

function readStringField(record, keys, maxChars = DEFAULT_MAX_LINE_CHARS) {
	if (!isObjectRecord(record)) {
		return null;
	}

	for (const key of keys) {
		const value = readStringCandidate(record[key], maxChars);
		if (value) {
			return value;
		}
	}

	return null;
}

function normalizeWorkSummaryStatusCategory(rawCategory, rawStatus) {
	const normalizedCategory = getNonEmptyString(rawCategory)?.toLowerCase() ?? "";
	const normalizedStatus = getNonEmptyString(rawStatus)?.toLowerCase() ?? "";
	const combined = `${normalizedCategory} ${normalizedStatus}`;

	if (/\b(blocked|impediment|stalled)\b/.test(combined)) {
		return "blocked";
	}
	if (/\b(done|complete|completed|closed|resolved)\b/.test(combined)) {
		return "done";
	}
	if (/\b(in progress|in-progress|doing|active|started)\b/.test(combined)) {
		return "inprogress";
	}
	if (/\b(todo|to do|open|selected for development|backlog)\b/.test(combined)) {
		return "todo";
	}

	return null;
}

function resolveWorkSummaryStatusLabel(rawStatus, normalizedCategory) {
	const status = clipText(rawStatus, 100);
	if (status) {
		return status;
	}

	if (normalizedCategory === "done") {
		return "Done";
	}
	if (normalizedCategory === "inprogress") {
		return "In Progress";
	}
	if (normalizedCategory === "todo") {
		return "To Do";
	}
	if (normalizedCategory === "blocked") {
		return "Blocked";
	}

	return "Unknown";
}

function normalizeToolDomainForWorkSummary(toolName, rawOutput) {
	const normalized = normalizeToolKey(toolName);
	if (!normalized) {
		return "other";
	}

	if (normalized.includes("jira")) {
		return "jira";
	}
	if (normalized.includes("confluence")) {
		return "confluence";
	}
	if (normalized.includes("teamwork_graph") || normalized.includes("teamworkgraph")) {
		return "atlassian";
	}

	if (isGenericWrapperToolKey(normalized)) {
		return inferDomainFromOutput(rawOutput);
	}

	return "other";
}

function isGenericWrapperToolKey(key) {
	return key === "mcp_invoke_tool" ||
		key.endsWith("invoke_tool") ||
		key === "mcp_tool";
}

function inferDomainFromOutput(rawOutput) {
	if (!rawOutput) return "other";
	const text = typeof rawOutput === "string"
		? rawOutput
		: JSON.stringify(rawOutput);
	if (/\b[A-Z]{2,10}-\d+\b/.test(text)) return "jira";
	if (/\bJQL\b/.test(text) || /\bjira\b/i.test(text)) return "jira";
	if (/\bCQL\b/.test(text) || /\bconfluence\b/i.test(text) || (/\bspace\b/i.test(text) && /\bpage\b/i.test(text))) return "confluence";
	return "other";
}

function isResultObservation(observation) {
	return observation?.phase === "result";
}

function resolveJiraIssueKeyFromRecord(record) {
	if (!isObjectRecord(record)) {
		return null;
	}

	const directCandidates = [
		record.key,
		record.issueKey,
		record.issue_key,
		record.jiraKey,
		record.workItemKey,
	];
	for (const candidate of directCandidates) {
		const candidateText = readStringCandidate(candidate, 60);
		if (!candidateText) {
			continue;
		}
		const matched = candidateText.match(ISSUE_KEY_PATTERN);
		if (matched?.[0]) {
			return matched[0];
		}
	}

	const searchableFields = [
		record.title,
		record.summary,
		record.description,
	];
	for (const fieldValue of searchableFields) {
		const fieldText = readStringCandidate(fieldValue, 260);
		if (!fieldText) {
			continue;
		}
		const matched = fieldText.match(ISSUE_KEY_PATTERN);
		if (matched?.[0]) {
			return matched[0];
		}
	}

	return null;
}

function resolveJiraIssueUrl(record) {
	const directUrl = readStringField(
		record,
		["url", "webUrl", "htmlUrl", "browseUrl", "self", "link", "permalink"],
		320
	);
	if (directUrl) {
		return directUrl;
	}

	if (isObjectRecord(record?._links)) {
		const base = readStringCandidate(record._links.base, 180);
		const browse = readStringCandidate(record._links.browse, 220);
		const webui = readStringCandidate(record._links.webui, 220);
		const self = readStringCandidate(record._links.self, 320);
		if (base && browse) {
			return clipText(
				`${base.replace(/\/+$/g, "")}${browse.startsWith("/") ? browse : `/${browse}`}`,
				320
			);
		}
		if (base && webui) {
			return clipText(
				`${base.replace(/\/+$/g, "")}${webui.startsWith("/") ? webui : `/${webui}`}`,
				320
			);
		}
		if (self) {
			return self;
		}
	}

	return null;
}

function resolveConfluencePageUrl(record) {
	const directUrl = readStringField(
		record,
		["url", "webUrl", "htmlUrl", "link", "permalink"],
		320
	);
	if (directUrl) {
		return directUrl;
	}

	if (isObjectRecord(record?._links)) {
		const base = readStringCandidate(record._links.base, 180);
		const webui = readStringCandidate(record._links.webui, 220);
		const tinyui = readStringCandidate(record._links.tinyui, 220);
		const self = readStringCandidate(record._links.self, 320);
		if (base && webui) {
			return clipText(
				`${base.replace(/\/+$/g, "")}${webui.startsWith("/") ? webui : `/${webui}`}`,
				320
			);
		}
		if (base && tinyui) {
			return clipText(
				`${base.replace(/\/+$/g, "")}${tinyui.startsWith("/") ? tinyui : `/${tinyui}`}`,
				320
			);
		}
		if (self) {
			return self;
		}
	}

	return null;
}

function resolveConfluenceSpaceName(record) {
	const directSpace = readStringField(
		record,
		["space", "spaceName", "spaceKey", "spaceTitle"],
		120
	);
	if (directSpace) {
		return directSpace;
	}

	if (isObjectRecord(record?.space)) {
		return (
			readStringField(record.space, ["name", "key", "title"], 120) ||
			null
		);
	}

	return null;
}

function resolveConfluenceLastModified(record) {
	return (
		readStringField(
			record,
			["lastModified", "updated", "updatedAt", "modified", "modifiedAt"],
			100
		) ||
		(isObjectRecord(record?.version)
			? readStringField(record.version, ["when", "friendlyWhen"], 100)
			: null) ||
		(isObjectRecord(record?.history?.lastUpdated)
			? readStringField(record.history.lastUpdated, ["when", "friendlyWhen"], 100)
			: null)
	);
}

function toWorkSummaryJiraItem(record) {
	const key = resolveJiraIssueKeyFromRecord(record);
	if (!key) {
		return null;
	}

	const summary =
		readStringField(record, ["summary", "title", "name"], 220) || key;
	const rawStatus =
		readStringField(record, ["status", "statusName", "state", "workflowStatus"], 100) ||
		(isObjectRecord(record?.status)
			? readStringField(record.status, ["name", "statusCategory"], 100)
			: null);
	const rawStatusCategory =
		readStringField(record, ["statusCategory", "category"], 80) ||
		(isObjectRecord(record?.status)
			? readStringField(record.status, ["statusCategory", "category"], 80)
			: null);
	const statusCategory = normalizeWorkSummaryStatusCategory(
		rawStatusCategory,
		rawStatus
	);

	return {
		key,
		summary,
		status: resolveWorkSummaryStatusLabel(rawStatus, statusCategory),
		statusCategory,
		priority: readStringField(record, ["priority", "priorityName", "severity"], 80),
		type: readStringField(
			record,
			["type", "issueType", "issuetype", "workItemType"],
			80
		),
		url: resolveJiraIssueUrl(record),
		updated: readStringField(
			record,
			["updated", "updatedAt", "updatedDate", "lastUpdated", "modified"],
			100
		),
	};
}

function toWorkSummaryConfluencePage(record) {
	const title = readStringField(record, ["title", "pageTitle"], 220);
	const url = resolveConfluencePageUrl(record);
	const space = resolveConfluenceSpaceName(record);
	const lastModified = resolveConfluenceLastModified(record);
	const type = readStringField(record, ["type", "contentType"], 80);
	const looksLikePageType = type ? /\bpage\b/i.test(type) : false;
	const looksLikeConfluenceUrl = url ? /\/wiki\//i.test(url) : false;
	if (!title && !looksLikePageType && !looksLikeConfluenceUrl) {
		return null;
	}

	return {
		title: title || "Untitled page",
		space,
		url,
		lastModified,
	};
}

function extractIssueCandidatesFromText(value, limit = 50) {
	const text = getNonEmptyString(value);
	if (!text) {
		return [];
	}

	const candidates = [];
	const seen = new Set();
	for (const line of text.split(/\r?\n/)) {
		if (candidates.length >= limit) {
			break;
		}
		const matched = line.match(ISSUE_KEY_PATTERN);
		if (!matched?.[0]) {
			continue;
		}

		const key = matched[0];
		if (seen.has(key)) {
			continue;
		}
		seen.add(key);

		const summaryMatch = line.match(
			new RegExp(`${key}\\s*(?::|-)?\\s*(.+)$`, "i")
		);
		const summaryText = summaryMatch?.[1]
			? clipText(summaryMatch[1], 220)
			: null;

		candidates.push({
			key,
			summary: summaryText || key,
			status: "Unknown",
			statusCategory: null,
			priority: null,
			type: null,
			url: null,
			updated: null,
		});
	}

	return candidates;
}

function collectWorkSummaryFromObservation(observation, limits) {
	const maxItems = limits.maxItems;
	const jiraItems = [];
	const confluencePages = [];
	const observationPayloads = [];
	const rawOutputPayload = toStructuredPayload(observation?.rawOutput);
	if (rawOutputPayload) {
		observationPayloads.push(rawOutputPayload);
	}
	const textPayload = toStructuredPayload(observation?.text);
	if (textPayload) {
		observationPayloads.push(textPayload);
	}
	const domain = normalizeToolDomainForWorkSummary(observation?.toolName, observation?.rawOutput);

	console.info("[WORK-SUMMARY] Collecting from observation", {
		toolName: observation?.toolName,
		domain,
		hasRawOutput: observation?.rawOutput !== null && observation?.rawOutput !== undefined,
		rawOutputType: typeof observation?.rawOutput,
		rawPayloadParsed: rawOutputPayload !== null,
		textPayloadParsed: textPayload !== null,
		payloadCount: observationPayloads.length,
		rawOutputPreview: typeof observation?.rawOutput === "string"
			? observation.rawOutput.slice(0, 300)
			: undefined,
	});

	// When structured parsing fails on a string rawOutput, try to find
	// embedded JSON within the string (e.g., prefixed with metadata text)
	if (observationPayloads.length === 0 && typeof observation?.rawOutput === "string") {
		const embedded = extractEmbeddedJson(observation.rawOutput);
		if (embedded) {
			observationPayloads.push(embedded);
		}
	}

	if (domain === "jira") {
		for (const payload of observationPayloads) {
			walkNodes(payload, (node) => {
				if (jiraItems.length >= maxItems || !isObjectRecord(node)) {
					return;
				}
				const item = toWorkSummaryJiraItem(node);
				if (item) {
					jiraItems.push(item);
				}
			});
		}

		if (jiraItems.length === 0) {
			jiraItems.push(...extractIssueCandidatesFromText(observation?.text, maxItems));
		}
	}

	if (domain === "confluence") {
		for (const payload of observationPayloads) {
			walkNodes(payload, (node) => {
				if (confluencePages.length >= maxItems || !isObjectRecord(node)) {
					return;
				}
				const page = toWorkSummaryConfluencePage(node);
				if (page) {
					confluencePages.push(page);
				}
			});
		}
	}

	console.info("[WORK-SUMMARY] Extraction result", {
		toolName: observation?.toolName,
		domain,
		jiraItemCount: jiraItems.length,
		confluencePageCount: confluencePages.length,
	});

	return {
		domain,
		jiraItems,
		confluencePages,
	};
}

function shouldUseWorkSummaryFallback({
	prompt,
	title,
	description,
	domainSignals,
	resultCount,
}) {
	if (resultCount <= 0) {
		return false;
	}

	const intentText = [prompt, title, description]
		.map((value) => getNonEmptyString(value))
		.filter(Boolean)
		.join(" ")
		.toLowerCase();

	if (!intentText) {
		return false;
	}

	const hasWorkSummaryIntent =
		WORK_SUMMARY_INTENT_PATTERN.test(intentText) ||
		(WORK_SUMMARY_TIME_WINDOW_PATTERN.test(intentText) &&
			/\b(work|activity|jira|confluence|ticket|issue|page|pages)\b/i.test(intentText));
	if (!hasWorkSummaryIntent) {
		return false;
	}

	if (domainSignals.hasOtherResultTool) {
		return false;
	}

	return domainSignals.hasJiraResultTool || domainSignals.hasConfluenceResultTool;
}

function buildWorkSummarySpec({ title, description, jiraItems, confluencePages }) {
	const elements = {};

	elements.root = {
		type: "Stack",
		props: { direction: "vertical", gap: "md" },
		children: ["summary-card"],
	};
	elements["summary-card"] = {
		type: "Card",
		props: {
			title,
			description,
		},
		children: ["work-summary-content"],
	};
	elements["work-summary-content"] = {
		type: "WorkSummary",
		props: {
			jiraItems,
			confluencePages,
		},
		children: [],
	};

	return {
		root: "root",
		elements,
	};
}

function buildWorkSummaryStructuredFallback({
	entries,
	prompt,
	title,
	description,
	resultCount,
	errorCount,
}) {
	const domainSignals = {
		hasJiraResultTool: false,
		hasConfluenceResultTool: false,
		hasOtherResultTool: false,
	};
	const collectedJiraItems = [];
	const collectedConfluencePages = [];

	for (const observation of entries) {
		if (!isResultObservation(observation)) {
			continue;
		}

		const collected = collectWorkSummaryFromObservation(observation, {
			maxItems: 80,
		});

		if (collected.domain === "jira") {
			domainSignals.hasJiraResultTool = true;
		} else if (collected.domain === "confluence") {
			domainSignals.hasConfluenceResultTool = true;
		} else {
			domainSignals.hasOtherResultTool = true;
		}

		collectedJiraItems.push(...collected.jiraItems);
		collectedConfluencePages.push(...collected.confluencePages);
	}

	if (
		!shouldUseWorkSummaryFallback({
			prompt,
			title,
			description,
			domainSignals,
			resultCount,
		})
	) {
		return null;
	}

	const jiraItems = [];
	const jiraKeys = new Set();
	for (const item of collectedJiraItems) {
		const key = getNonEmptyString(item?.key);
		if (!key || jiraKeys.has(key)) {
			continue;
		}
		jiraKeys.add(key);
		jiraItems.push(item);
		if (jiraItems.length >= 80) {
			break;
		}
	}

	const confluencePages = [];
	const pageKeys = new Set();
	for (const page of collectedConfluencePages) {
		const dedupeKey =
			getNonEmptyString(page?.url) ||
			[getNonEmptyString(page?.title), getNonEmptyString(page?.space)]
				.filter(Boolean)
				.join("|");
		if (!dedupeKey || pageKeys.has(dedupeKey)) {
			continue;
		}
		pageKeys.add(dedupeKey);
		confluencePages.push(page);
		if (confluencePages.length >= 80) {
			break;
		}
	}

	const resolvedTitle =
		resolveFallbackTitle(prompt, title) || "Work Summary";
	const resolvedDescription =
		resolveFallbackDescription(description, {
			errorsOnly: resultCount === 0 && errorCount > 0,
		}) ||
		(jiraItems.length === 0 && confluencePages.length === 0
			? "No Jira work items or Confluence pages were found for this period."
			: `${jiraItems.length} ${pluralize(jiraItems.length, "work item", "work items")} and ${confluencePages.length} ${pluralize(confluencePages.length, "page", "pages")} from Jira and Confluence.`);

	return {
		spec: buildWorkSummarySpec({
			title: resolvedTitle,
			description: resolvedDescription,
			jiraItems,
			confluencePages,
		}),
		summary: `Rendered work summary with ${jiraItems.length} work item${
			jiraItems.length === 1 ? "" : "s"
		} and ${confluencePages.length} page${confluencePages.length === 1 ? "" : "s"}.`,
		source: "tool-observation-work-summary",
		observationUsed: true,
		observationCount: entries.length,
		resultCount,
		errorCount,
		omittedGroups: 0,
		omittedEvents: 0,
	};
}

function pushTextLine(elements, parentChildren, key, content, muted = false) {
	const line = clipText(content, DEFAULT_MAX_LINE_CHARS);
	if (!line) {
		return;
	}

	parentChildren.push(key);
	elements[key] = {
		type: "Text",
		props: {
			content: line,
			...(muted ? { muted: true } : {}),
		},
	};
}

function buildStructuredToolSpec({
	title,
	description,
	renderedGroups,
	resultCount,
	errorCount,
	omittedGroups,
	omittedEvents,
}) {
	const elements = {};
	const cardChildren = [];

	elements.root = {
		type: "Stack",
		props: { direction: "vertical", gap: "md" },
		children: ["summary-card"],
	};

	elements["summary-card"] = {
		type: "Card",
		props: {
			title,
			description,
		},
		children: cardChildren,
	};

	pushTextLine(
		elements,
		cardChildren,
		"summary-overview",
		`Tool results: ${resultCount} | Tool errors: ${errorCount} | Tools: ${renderedGroups.length}`,
		true
	);

	if (omittedGroups > 0 || omittedEvents > 0) {
		pushTextLine(
			elements,
			cardChildren,
			"summary-omitted",
			`${omittedGroups > 0 ? `${omittedGroups} tool group${omittedGroups === 1 ? "" : "s"} omitted` : "No tool groups omitted"}${
				omittedEvents > 0 ? ` | ${omittedEvents} tool event${omittedEvents === 1 ? "" : "s"} omitted` : ""
			}.`,
			true
		);
	}

	renderedGroups.forEach((group, groupIndex) => {
		const headingKey = `tool-group-heading-${groupIndex}`;
		cardChildren.push(headingKey);
		elements[headingKey] = {
			type: "Heading",
			props: {
				level: "h3",
				text: `${group.toolName} (${group.total})`,
			},
		};

		const groupListKey = `tool-group-list-${groupIndex}`;
		const groupChildren = [];
		cardChildren.push(groupListKey);
		elements[groupListKey] = {
			type: "Stack",
			props: { direction: "vertical", gap: "sm" },
			children: groupChildren,
		};

		group.rendered.forEach((event, eventIndex) => {
			const eventKey = `tool-group-${groupIndex}-event-${eventIndex}`;
			const eventChildren = [];
			groupChildren.push(eventKey);

			elements[eventKey] = {
				type: "Card",
					props: {
						title:
							event.phase === "error"
								? `Error ${eventIndex + 1}`
								: `Result ${eventIndex + 1}`,
						description: event.phase === "error"
							? `${clipText(group.toolName, 56) || "Tool"}${
								group.hasResults ? " error context." : " error."
							}`
							: `${clipText(group.toolName, 56) || "Tool"} result.`,
					},
					children: eventChildren,
				};

			pushTextLine(
				elements,
				eventChildren,
				`${eventKey}-preview`,
				event.preview,
				true
			);

			event.detailLines.forEach((line, detailIndex) => {
				pushTextLine(
					elements,
					eventChildren,
					`${eventKey}-detail-${detailIndex}`,
					line,
					true
				);
			});

			event.links.forEach((href, linkIndex) => {
				const linkKey = `${eventKey}-link-${linkIndex}`;
				eventChildren.push(linkKey);
				elements[linkKey] = {
					type: "Link",
					props: {
						text: "Open link",
						href,
					},
				};
			});

			if (eventChildren.length > 0) {
				elements[eventKey].children = eventChildren;
			}
		});

		if (group.omitted > 0) {
			pushTextLine(
				elements,
				cardChildren,
				`tool-group-${groupIndex}-omitted`,
				`+${group.omitted} additional ${group.toolName} event${
					group.omitted === 1 ? "" : "s"
				} omitted.`,
				true
			);
		}
	});

	return {
		root: "root",
		elements,
	};
}

function resolveFallbackTitle(prompt, title) {
	const explicitTitle = clipText(title, 80);
	if (explicitTitle) {
		return explicitTitle;
	}

	const promptTitle = clipText(prompt, 80);
	if (promptTitle) {
		return promptTitle;
	}

	return "Tool Results";
}

function resolveFallbackDescription(
	description,
	{
		errorsOnly = false,
		resultCount = 0,
		errorCount = 0,
		toolCount = 0,
	} = {}
) {
	const explicitDescription = clipText(description, 140);
	if (explicitDescription && !isGenericFallbackDescription(explicitDescription)) {
		return explicitDescription;
	}

	if (errorsOnly || (resultCount === 0 && errorCount > 0)) {
		return `${errorCount} ${pluralize(errorCount, "tool error", "tool errors")} returned; no successful results.`;
	}

	if (resultCount > 0 && errorCount > 0) {
		return `${resultCount} ${pluralize(resultCount, "result", "results")} and ${errorCount} ${pluralize(errorCount, "error", "errors")} from ${toolCount || 1} ${pluralize(toolCount || 1, "tool", "tools")}.`;
	}

	if (resultCount > 0) {
		return `${resultCount} ${pluralize(resultCount, "result", "results")} from ${toolCount || 1} ${pluralize(toolCount || 1, "tool", "tools")}.`;
	}

	if (errorCount > 0) {
		return `${errorCount} ${pluralize(errorCount, "error", "errors")} from ${toolCount || 1} ${pluralize(toolCount || 1, "tool", "tools")}.`;
	}

	return null;
}

function buildToolObservationStructuredFallback({
	observations,
	prompt,
	title,
	description,
	maxToolGroups = DEFAULT_MAX_TOOL_GROUPS,
	maxTotalEvents = DEFAULT_MAX_TOTAL_EVENTS,
	maxEventsPerTool = DEFAULT_MAX_EVENTS_PER_TOOL,
	maxDetailLinesPerEvent = DEFAULT_MAX_DETAIL_LINES_PER_EVENT,
	maxEventPreviewChars = DEFAULT_MAX_EVENT_PREVIEW_CHARS,
	maxLineChars = DEFAULT_MAX_LINE_CHARS,
	maxLinksPerEvent = DEFAULT_MAX_LINKS_PER_EVENT,
} = {}) {
	const entries = dedupeObservations(observations);
	if (entries.length === 0) {
		return null;
	}
	const resultCount = entries.filter((entry) => entry?.phase === "result").length;
	const errorCount = entries.filter((entry) => entry?.phase === "error").length;

	const workSummaryFallback = buildWorkSummaryStructuredFallback({
		entries,
		prompt,
		title,
		description,
		resultCount,
		errorCount,
	});
	if (workSummaryFallback) {
		return workSummaryFallback;
	}

	const groups = groupObservationsByTool(entries, {
		maxDetailLines: maxDetailLinesPerEvent,
		maxPreviewChars: maxEventPreviewChars,
		maxLineChars,
		maxLinks: maxLinksPerEvent,
	});
	if (groups.length === 0) {
		return null;
	}

	const boundedMaxToolGroups =
		typeof maxToolGroups === "number" && Number.isFinite(maxToolGroups) && maxToolGroups > 0
			? Math.min(Math.floor(maxToolGroups), 60)
			: DEFAULT_MAX_TOOL_GROUPS;
	const boundedMaxTotalEvents =
		typeof maxTotalEvents === "number" && Number.isFinite(maxTotalEvents) && maxTotalEvents > 0
			? Math.min(Math.floor(maxTotalEvents), 500)
			: DEFAULT_MAX_TOTAL_EVENTS;
	const boundedMaxEventsPerTool =
		typeof maxEventsPerTool === "number" &&
		Number.isFinite(maxEventsPerTool) &&
		maxEventsPerTool > 0
			? Math.min(Math.floor(maxEventsPerTool), 120)
			: DEFAULT_MAX_EVENTS_PER_TOOL;

	const allocation = allocateGroupsAndEvents(groups, {
		maxToolGroups: boundedMaxToolGroups,
		maxTotalEvents: boundedMaxTotalEvents,
		maxEventsPerTool: boundedMaxEventsPerTool,
	});
	const renderedEventsCount = allocation.renderedGroups.reduce(
		(sum, group) => sum + group.rendered.length,
		0
	);
	if (renderedEventsCount === 0) {
		return null;
	}

	const errorsOnly = resultCount === 0 && errorCount > 0;
	const resolvedTitle = resolveFallbackTitle(prompt, title);
	const resolvedDescription = resolveFallbackDescription(description, {
		errorsOnly,
		resultCount,
		errorCount,
		toolCount: allocation.renderedGroups.length,
	});
	const summaryBase = `Rendered ${renderedEventsCount} tool event${
		renderedEventsCount === 1 ? "" : "s"
	} across ${allocation.renderedGroups.length} tool${
		allocation.renderedGroups.length === 1 ? "" : "s"
	}.`;
	const summary =
		allocation.omittedGroups > 0 || allocation.omittedEvents > 0
			? `${summaryBase} ${allocation.omittedGroups > 0 ? `${allocation.omittedGroups} tool group${allocation.omittedGroups === 1 ? "" : "s"} omitted.` : ""}${
					allocation.omittedEvents > 0 ? ` ${allocation.omittedEvents} additional event${allocation.omittedEvents === 1 ? "" : "s"} omitted.` : ""
				}`.trim()
			: summaryBase;

	return {
		spec: buildStructuredToolSpec({
			title: resolvedTitle,
			description: resolvedDescription || "Tool output captured for review.",
			renderedGroups: allocation.renderedGroups,
			resultCount,
			errorCount,
			omittedGroups: allocation.omittedGroups,
			omittedEvents: allocation.omittedEvents,
		}),
		summary,
		source: "tool-observation-structured",
		observationUsed: true,
		observationCount: entries.length,
		resultCount,
		errorCount,
		omittedGroups: allocation.omittedGroups,
		omittedEvents: allocation.omittedEvents,
	};
}

module.exports = {
	buildToolObservationStructuredFallback,
};
