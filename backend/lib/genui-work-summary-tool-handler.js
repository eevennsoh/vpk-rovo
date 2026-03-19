const { getNonEmptyString, isObjectRecord, clipText: _clipText, normalizeSentence, pluralize, parseMaybeJson } = require("./shared-utils");

const DEFAULT_MAX_LINE_CHARS = 220;
const MAX_SCAN_NODES = 1800;
const DEFAULT_MAX_EVENT_PREVIEW_CHARS = 1600;

const ISSUE_KEY_PATTERN = /\b[A-Z][A-Z0-9]+-\d+\b/;
const WORK_SUMMARY_INTENT_PATTERN =
	/\b(work\s*summary|summary\s+of\s+work|work\s+activity|last\s+\d+\s*(?:day|days|week|weeks|month|months)\s+of\s+work|past\s+\d+\s*(?:day|days|week|weeks|month|months)\s+of\s+work)\b/i;
const WORK_SUMMARY_TIME_WINDOW_PATTERN =
	/\b(last|past|recent)\b[\s\S]{0,48}\b(\d+\s*(?:day|days|week|weeks|month|months)|7d|14d|30d)\b/i;
const WORK_SUMMARY_HELPER_TOOL_KEY_PATTERNS = [
	/\bget_full_context_for_user\b/i,
	/\bfull_context_for_user\b/i,
	/\bget_atlassian_site_urls\b/i,
	/\batlassian_site_urls\b/i,
	/\bget_current_user\b/i,
	/\bcurrent_user_identity\b/i,
];

/** @param {unknown} value @returns {string | null} */
function clipText(value, maxChars = DEFAULT_MAX_LINE_CHARS) {
	return _clipText(value, maxChars);
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

function isNonBlockingWorkSummaryHelperObservation(observation, domain) {
	if (domain === "jira" || domain === "confluence") {
		return false;
	}

	const normalized = normalizeToolKey(observation?.toolName);
	if (!normalized) {
		return false;
	}

	return WORK_SUMMARY_HELPER_TOOL_KEY_PATTERNS.some((pattern) =>
		pattern.test(normalized)
	);
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
			/\b(work|worked|activity|jira|confluence|ticket|issue|page|pages)\b/i.test(intentText));
	if (!hasWorkSummaryIntent) {
		return false;
	}

	if (domainSignals.hasBlockingOtherResultTool) {
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

function buildWorkSummaryStructuredSpec({
	observations,
	prompt,
	title,
	description,
}) {
	const entries = dedupeObservations(observations);
	if (entries.length === 0) {
		return null;
	}
	const resultCount = entries.filter((entry) => entry?.phase === "result").length;
	const errorCount = entries.filter((entry) => entry?.phase === "error").length;

	const domainSignals = {
		hasJiraResultTool: false,
		hasConfluenceResultTool: false,
		hasBlockingOtherResultTool: false,
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
		} else if (
			!isNonBlockingWorkSummaryHelperObservation(
				observation,
				collected.domain
			)
		) {
			domainSignals.hasBlockingOtherResultTool = true;
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

module.exports = {
	buildWorkSummaryStructuredSpec,
};
