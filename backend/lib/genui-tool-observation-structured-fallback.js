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
const SLACK_SEND_MESSAGE_PATTERN = /slack.*(?:create|send|post)_*(?:message|msg)/i;
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
	const normalized = normalizeToolKey(toolName);
	if (!normalized) {
		return false;
	}
	return SLACK_SEND_MESSAGE_PATTERN.test(normalized);
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

// ── Rich payload shape detection ──

const TEMPORAL_KEY_PATTERN = /(date|time|start|end|created|updated|timestamp|modified|when)/i;
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}/;
const TITLE_KEY_PATTERN = /^(summary|title|name|subject|event|label|headline)$/i;
const DESCRIPTION_KEY_PATTERN = /^(description|body|detail|content|text|snippet|excerpt)$/i;
const URL_KEY_PATTERN = /^(url|link|href|web_url|html_url|permalink|self)$/i;
const STATUS_KEY_PATTERN = /^(status|state|phase|stage)$/i;

const STATUS_LOZENGE_MAP = {
	done: "success",
	closed: "success",
	resolved: "success",
	completed: "success",
	deployed: "success",
	merged: "success",
	"in progress": "information",
	in_progress: "information",
	inprogress: "information",
	active: "information",
	running: "information",
	open: "information",
	started: "information",
	blocked: "danger",
	failed: "danger",
	error: "danger",
	rejected: "danger",
	cancelled: "danger",
	todo: "neutral",
	backlog: "neutral",
	planned: "neutral",
	queued: "neutral",
	pending: "neutral",
	new: "neutral",
	review: "discovery",
	review_requested: "discovery",
	in_review: "discovery",
	"in review": "discovery",
	warning: "warning",
	degraded: "warning",
};

function formatKeyLabel(key) {
	if (typeof key !== "string" || key.trim().length === 0) {
		return "";
	}

	return key
		.replace(/([a-z])([A-Z])/g, "$1 $2")
		.replace(/[_\-./]+/g, " ")
		.replace(/\s+/g, " ")
		.trim()
		.split(" ")
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
		.join(" ");
}

function classifyStatusValue(value) {
	if (typeof value !== "string") {
		return null;
	}

	const normalized = value.trim().toLowerCase().replace(/[\s_-]+/g, " ");
	return STATUS_LOZENGE_MAP[normalized] || null;
}

function unwrapArrayPayload(payload) {
	if (Array.isArray(payload)) {
		return payload;
	}

	if (!isObjectRecord(payload)) {
		return null;
	}

	const keys = Object.keys(payload);
	for (const key of keys) {
		const value = payload[key];
		if (Array.isArray(value) && value.length > 0 && value.every((item) => isObjectRecord(item))) {
			return value;
		}
	}

	return null;
}

function getSharedKeys(items) {
	if (!Array.isArray(items) || items.length === 0) {
		return [];
	}

	const keySets = items.map((item) =>
		new Set(isObjectRecord(item) ? Object.keys(item) : [])
	);
	const unionKeys = new Set();
	for (const keySet of keySets) {
		for (const key of keySet) {
			unionKeys.add(key);
		}
	}

	const threshold = Math.ceil(items.length * 0.6);
	const shared = [];
	for (const key of unionKeys) {
		const count = keySets.filter((keySet) => keySet.has(key)).length;
		if (count >= threshold) {
			shared.push(key);
		}
	}

	return shared;
}

function findKeyByPattern(keys, pattern) {
	for (const key of keys) {
		if (pattern.test(key)) {
			return key;
		}
	}
	return null;
}

function cellValue(value) {
	if (value === null || value === undefined) {
		return "";
	}
	if (typeof value === "string") {
		const clipped = _clipText(value, 120);
		return clipped || "";
	}
	if (typeof value === "number" || typeof value === "boolean") {
		return String(value);
	}
	if (Array.isArray(value)) {
		return `[${value.length} items]`;
	}
	if (isObjectRecord(value)) {
		return "[object]";
	}
	return String(value);
}

/**
 * Detect the best rendering shape for a raw payload.
 * Returns a shape descriptor or null (fall through to text lines).
 */
function detectPayloadShape(rawPayload) {
	if (!rawPayload || isLikelyToolSchemaPayload(rawPayload)) {
		return null;
	}

	const items = unwrapArrayPayload(rawPayload);

	// Test 1: Homogeneous Array → Table
	if (items && items.length >= 2 && items.length <= 20) {
		const sharedKeys = getSharedKeys(items);
		if (sharedKeys.length >= 2 && sharedKeys.length <= 8) {
			const hasStringValues = items.some((item) =>
				sharedKeys.some((key) => typeof item[key] === "string" && item[key].trim().length > 0)
			);
			if (hasStringValues) {
				const columns = sharedKeys.slice(0, 6);
				const data = items.map((item) => {
					const row = {};
					for (const col of columns) {
						row[col] = cellValue(item[col]);
					}
					return row;
				});
				return {
					kind: "table",
					columns: columns.map((key) => ({
						key,
						header: formatKeyLabel(key),
					})),
					data,
				};
			}
		}
	}

	// Test 2: Temporal Array → Timeline
	if (items && items.length >= 1 && items.length <= 10) {
		const sampleKeys = isObjectRecord(items[0]) ? Object.keys(items[0]) : [];
		const temporalKey = findKeyByPattern(sampleKeys, TEMPORAL_KEY_PATTERN);
		const hasIsoValues = temporalKey && items.some((item) =>
			ISO_DATE_PATTERN.test(String(item[temporalKey] || ""))
		);
		if (hasIsoValues) {
			const titleKey = findKeyByPattern(sampleKeys, TITLE_KEY_PATTERN);
			const descKey = findKeyByPattern(sampleKeys, DESCRIPTION_KEY_PATTERN);
			const dateKey = temporalKey;
			if (titleKey || descKey) {
				const timelineItems = items.map((item) => {
					const entry = {};
					if (titleKey && item[titleKey]) {
						entry.title = _clipText(String(item[titleKey]), 120) || "Item";
					} else {
						entry.title = "Item";
					}
					if (descKey && item[descKey]) {
						entry.description = _clipText(String(item[descKey]), 200) || undefined;
					}
					if (dateKey && item[dateKey]) {
						const raw = String(item[dateKey]);
						entry.date = _clipText(raw.replace(/T.*$/, ""), 30) || undefined;
					}
					return entry;
				});
				return { kind: "timeline", items: timelineItems };
			}
		}
	}

	// Test 3: Single Numeric Scalar → Metric
	if (isObjectRecord(rawPayload)) {
		const entries = Object.entries(rawPayload);
		if (entries.length >= 1 && entries.length <= 3) {
			const numericEntry = entries.find(
				([, value]) => typeof value === "number" && Number.isFinite(value)
			);
			if (numericEntry) {
				const [numericKey, numericValue] = numericEntry;
				const detailEntry = entries.find(
					([key, value]) => key !== numericKey && typeof value === "string"
				);
				return {
					kind: "metric",
					label: formatKeyLabel(numericKey),
					value: numericValue.toLocaleString(),
					detail: detailEntry ? _clipText(String(detailEntry[1]), 60) : undefined,
				};
			}
		}
	}

	// Test 4: Single Object with Many Fields → Field Card
	if (isObjectRecord(rawPayload)) {
		const entries = Object.entries(rawPayload);
		if (entries.length >= 2 && entries.length <= 15) {
			const scalarEntries = entries.filter(
				([, value]) =>
					typeof value === "string" ||
					typeof value === "number" ||
					typeof value === "boolean"
			);
			if (scalarEntries.length >= 2) {
				const fields = scalarEntries.slice(0, 12).map(([key, value]) => {
					if (typeof value === "string" && /^https?:\/\//.test(value)) {
						return { label: formatKeyLabel(key), value, type: "link" };
					}
					const statusVariant = typeof value === "string" ? classifyStatusValue(value) : null;
					if (statusVariant) {
						return {
							label: formatKeyLabel(key),
							value,
							type: "status",
							variant: statusVariant,
						};
					}
					if (typeof value === "boolean") {
						return {
							label: formatKeyLabel(key),
							value: value ? "Yes" : "No",
							type: "badge",
							variant: value ? "success" : "neutral",
						};
					}
					return {
						label: formatKeyLabel(key),
						value: _clipText(String(value), 160) || String(value),
						type: "text",
					};
				});
				return { kind: "field-card", fields };
			}
		}
	}

	// Test 5: Array of Results with Links → Result Cards
	if (items && items.length >= 1 && items.length <= 8) {
		const sampleKeys = isObjectRecord(items[0]) ? Object.keys(items[0]) : [];
		const titleKey = findKeyByPattern(sampleKeys, TITLE_KEY_PATTERN);
		const urlKey = findKeyByPattern(sampleKeys, URL_KEY_PATTERN);
		if (titleKey) {
			const descKey = findKeyByPattern(sampleKeys, DESCRIPTION_KEY_PATTERN);
			const resultItems = items.map((item) => ({
				title: _clipText(String(item[titleKey] || ""), 120) || "Result",
				description: descKey
					? _clipText(String(item[descKey] || ""), 200) || undefined
					: undefined,
				href: urlKey && typeof item[urlKey] === "string"
					? item[urlKey]
					: undefined,
			}));
			return { kind: "result-cards", items: resultItems };
		}
	}

	return null;
}

/**
 * Build rich spec elements for a detected payload shape.
 * Returns an array of child keys added to the elements dictionary.
 */
function buildRichEventSpec(elements, baseKey, shape) {
	if (!shape) {
		return [];
	}

	const children = [];

	if (shape.kind === "table") {
		const tableKey = `${baseKey}-rich-table`;
		children.push(tableKey);
		elements[tableKey] = {
			type: "Table",
			props: {
				columns: shape.columns.map((col) => ({
					key: col.key,
					header: col.header,
				})),
				data: shape.data,
			},
		};
	} else if (shape.kind === "timeline") {
		const timelineKey = `${baseKey}-rich-timeline`;
		children.push(timelineKey);
		elements[timelineKey] = {
			type: "Timeline",
			props: {
				items: shape.items,
			},
		};
	} else if (shape.kind === "metric") {
		const metricKey = `${baseKey}-rich-metric`;
		children.push(metricKey);
		elements[metricKey] = {
			type: "Metric",
			props: {
				label: shape.label,
				value: shape.value,
				...(shape.detail ? { detail: shape.detail } : {}),
			},
		};
	} else if (shape.kind === "field-card") {
		const stackKey = `${baseKey}-rich-fields`;
		const fieldChildren = [];
		children.push(stackKey);

		shape.fields.forEach((field, fieldIndex) => {
			const rowKey = `${baseKey}-rich-field-${fieldIndex}`;
			const labelKey = `${rowKey}-label`;
			const valueKey = `${rowKey}-value`;
			fieldChildren.push(rowKey);

			const rowChildren = [labelKey, valueKey];
			elements[rowKey] = {
				type: "Stack",
				props: { direction: "horizontal", gap: "sm", align: "center" },
				children: rowChildren,
			};
			elements[labelKey] = {
				type: "Text",
				props: { content: `${field.label}:`, muted: true },
			};

			if (field.type === "link") {
				elements[valueKey] = {
					type: "Link",
					props: { text: "Open link", href: field.value },
				};
			} else if (field.type === "status") {
				elements[valueKey] = {
					type: "Lozenge",
					props: { text: field.value, variant: field.variant },
				};
			} else if (field.type === "badge") {
				elements[valueKey] = {
					type: "Badge",
					props: { text: field.value, variant: field.variant },
				};
			} else {
				elements[valueKey] = {
					type: "Text",
					props: { content: field.value },
				};
			}
		});

		elements[stackKey] = {
			type: "Stack",
			props: { direction: "vertical", gap: "xs" },
			children: fieldChildren,
		};
	} else if (shape.kind === "result-cards") {
		const stackKey = `${baseKey}-rich-results`;
		const resultChildren = [];
		children.push(stackKey);

		shape.items.forEach((item, itemIndex) => {
			const tileKey = `${baseKey}-rich-result-${itemIndex}`;
			resultChildren.push(tileKey);
			elements[tileKey] = {
				type: "ObjectTile",
				props: {
					title: item.title,
					...(item.description ? { description: item.description } : {}),
					...(item.href ? { href: item.href } : {}),
				},
			};
		});

		elements[stackKey] = {
			type: "Stack",
			props: { direction: "vertical", gap: "sm" },
			children: resultChildren,
		};
	}

	return children;
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
		rawPayload:
			toStructuredPayload(observation?.rawOutput) ||
			toStructuredPayload(observation?.text),
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

			// Rich path: detect payload shape and render with richer components
			const shape = event.rawPayload
				? detectPayloadShape(event.rawPayload)
				: null;
			const richChildren = shape
				? buildRichEventSpec(elements, eventKey, shape)
				: [];

			if (richChildren.length > 0) {
				eventChildren.push(...richChildren);
			} else {
				// Fallback: text-line dump (existing behavior)
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
			}

			// Links always render regardless of rich/text path
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
