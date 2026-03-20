import type { Spec } from "@json-render/react";

export interface ParsedGenerativeWidgetSource {
	name?: string;
	logoSrc?: string;
}

export interface GenerativeWidgetActionItem {
	label: string;
	href?: string;
}

interface ParsedGenerativeWidgetBase {
	title?: string;
	description?: string;
	primaryActionLabel?: string;
	actions?: GenerativeWidgetActionItem[];
	source: ParsedGenerativeWidgetSource | null;
	contentTypeHint?: string;
	iconHint?: string;
}

export interface ParsedGenuiPreviewWidget extends ParsedGenerativeWidgetBase {
	type: "genui-preview";
	spec: Spec;
	summary?: string;
}

export interface ParsedAudioPreviewWidget extends ParsedGenerativeWidgetBase {
	type: "audio-preview";
	audioUrl: string;
	mimeType?: string;
	transcript?: string;
}

export interface ParsedImagePreviewWidget extends ParsedGenerativeWidgetBase {
	type: "image-preview";
	images: Array<{
		url: string;
		mimeType?: string;
	}>;
	prompt?: string;
}

export type ParsedGenerativeWidget =
	| ParsedGenuiPreviewWidget
	| ParsedAudioPreviewWidget
	| ParsedImagePreviewWidget;

export interface GenerativeWidgetMetadata {
	contentType: GenerativeContentType;
	title: string;
	description: string;
	primaryActionLabel?: string;
	actions?: GenerativeWidgetActionItem[];
	actionLabels?: string[];
	source: ParsedGenerativeWidgetSource | null;
	iconHint?: string;
	iconHintText?: string;
}

export interface GenerativeWidgetPrimaryActionPayload {
	widgetType: "genui-preview";
	actionLabel: string;
	title: string;
	description: string;
	formState: Record<string, unknown>;
}

const GENERATIVE_CONTENT_TYPE_HINT_KEYS = [
	"contentType",
	"generatedContentType",
	"artifactType",
	"outputType",
	"widgetContentType",
] as const;

export type GenerativeContentType =
	| "image"
	| "text"
	| "translation"
	| "message"
	| "calendar"
	| "chart-bar"
	| "chart-line"
	| "chart-area"
	| "chart-pie"
	| "chart-radar"
	| "chart-scatter"
	| "chart"
	| "feed"
	| "sound"
	| "video"
	| "work-item"
	| "page"
	| "board"
	| "table"
	| "code"
	| "ui"
	| "other";

const CONTENT_TYPE_HINT_MATCHERS: ReadonlyArray<{
	pattern: RegExp;
	contentType: GenerativeContentType;
}> = [
	{
		pattern: /\b(bar(?:\s|-)?chart|column(?:\s|-)?chart|histogram)\b/i,
		contentType: "chart-bar",
	},
	{
		pattern: /\b(line(?:\s|-)?chart|trend\s*chart|time\s*series)\b/i,
		contentType: "chart-line",
	},
	{
		pattern: /\b(area(?:\s|-)?chart)\b/i,
		contentType: "chart-area",
	},
	{
		pattern: /\b(pie(?:\s|-)?chart|donut(?:\s|-)?chart|doughnut(?:\s|-)?chart)\b/i,
		contentType: "chart-pie",
	},
	{
		pattern: /\b(radar(?:\s|-)?chart|spider(?:\s|-)?chart)\b/i,
		contentType: "chart-radar",
	},
	{
		pattern: /\b(scatter(?:\s|-)?plot|scatter(?:\s|-)?chart|bubble(?:\s|-)?chart|bubble\s*plot)\b/i,
		contentType: "chart-scatter",
	},
	{
		pattern: /\b(stock\s*(?:price|quote|ticker|data)|share\s*price|market\s*cap(?:italization)?|current\s*price|previous\s*close|day\s*range|52[\s-]*week|trading\s*(?:volume|data)|avg\s*volume)\b/i,
		contentType: "chart",
	},
	{
		pattern: /\b(news|headlines?|breaking\s*news|key\s*events?|market\s*(?:analysis|report|news)|analyst\s*sentiment)\b/i,
		contentType: "feed",
	},
	{
		pattern: /\b(chart|graph|plot|visuali[sz]ation)\b/i,
		contentType: "chart",
	},
	{
		pattern: /\bgoogle\s+calendar\b|\bcalendar\b/i,
		contentType: "calendar",
	},
	{
		pattern: /\b(translate|translation|source\s+language|target\s+language|translated\s+text)\b/i,
		contentType: "translation",
	},
	{
		pattern: /\b(send|post|reply|write)\b[\s\S]{0,30}\b(message|slack|dm|direct\s+message)\b|\b(slack|channel|dm|direct\s+message)\b/i,
		contentType: "message",
	},
	{
		pattern: /\b(work\s*item|work-item|work\s*summary|task|tasks|issue|issues|ticket|tickets|bug|bugs|story|epic|backlog)\b/i,
		contentType: "work-item",
	},
	{
		pattern: /\b(board|kanban|sprint\s*board)\b/i,
		contentType: "board",
	},
	{
		pattern: /\b(page|document|doc|docs|wiki|article)\b/i,
		contentType: "page",
	},
	{
		pattern: /\b(table|grid|spreadsheet|dataset)\b/i,
		contentType: "table",
	},
	{
		pattern: /\b(code|snippet|script|sql|query|json|markdown)\b/i,
		contentType: "code",
	},
	{
		pattern: /\b(audio|sound|voice(?:over)?|narration|podcast|speech)\b/i,
		contentType: "sound",
	},
	{
		pattern: /\b(video|clip|reel|movie)\b/i,
		contentType: "video",
	},
	{
		pattern: /\b(image|images|picture|photo|illustration|mockup|banner)\b/i,
		contentType: "image",
	},
	{
		pattern: /\b(text|summary|draft|copy|transcript|notes?)\b/i,
		contentType: "text",
	},
	{
		pattern: /\b(ui|interface|layout|form|dashboard)\b/i,
		contentType: "ui",
	},
];

const EXACT_CONTENT_TYPE_HINT_MAP: ReadonlyMap<string, GenerativeContentType> = new Map([
	["image", "image"],
	["text", "text"],
	["translation", "translation"],
	["translate", "translation"],
	["message", "message"],
	["calendar", "calendar"],
	["bar chart", "chart-bar"],
	["line chart", "chart-line"],
	["area chart", "chart-area"],
	["pie chart", "chart-pie"],
	["radar chart", "chart-radar"],
	["scatter chart", "chart-scatter"],
	["chart", "chart"],
	["feed", "feed"],
	["news", "feed"],
	["sound", "sound"],
	["audio", "sound"],
	["video", "video"],
	["work item", "work-item"],
	["work summary", "work-item"],
	["page", "page"],
	["board", "board"],
	["table", "table"],
	["code", "code"],
	["ui", "ui"],
]);

const ELEMENT_TYPE_CONTENT_MATCHERS: ReadonlyArray<{
	pattern: RegExp;
	contentType: GenerativeContentType;
}> = [
	{ pattern: /\bcalendar\b/i, contentType: "calendar" },
	{ pattern: /\bbar\s*chart\b/i, contentType: "chart-bar" },
	{ pattern: /\bline\s*chart\b/i, contentType: "chart-line" },
	{ pattern: /\barea\s*chart\b/i, contentType: "chart-area" },
	{ pattern: /\bpie\s*chart\b/i, contentType: "chart-pie" },
	{ pattern: /\bradar\s*chart\b/i, contentType: "chart-radar" },
	{ pattern: /\bscatter\s*chart\b/i, contentType: "chart-scatter" },
	{ pattern: /\bbubble\s*chart\b/i, contentType: "chart-scatter" },
	{ pattern: /\btable\b/i, contentType: "table" },
	{ pattern: /\bpage\s*header\b/i, contentType: "page" },
	{ pattern: /\bwork\s*item\b/i, contentType: "work-item" },
	{ pattern: /\bboard\b/i, contentType: "board" },
	{ pattern: /\bcode\s*block\b/i, contentType: "code" },
	{ pattern: /\bimage\b/i, contentType: "image" },
	{ pattern: /\baudio\b/i, contentType: "sound" },
	{ pattern: /\bvideo\b/i, contentType: "video" },
	{ pattern: /\bchart\b/i, contentType: "chart" },
];
const DEFAULT_DESCRIPTION = "Generated from your request";
const LOW_SIGNAL_WIDGET_DESCRIPTION_PATTERNS: ReadonlyArray<RegExp> = [
	/^generated from\b/i,
	/^upcoming events from google calendar\b/i,
	/^calendar information from google calendar\b/i,
	/^files from google drive\b/i,
	/^drive account information from google drive\b/i,
	/^design context extracted from figma\b/i,
	/^tool results\b/i,
];
const PRIMARY_ACTION_PREFERRED_LABEL_PATTERN =
	/\b(send|submit|save|create|post|publish|run|confirm|continue|apply|start)\b/i;
const PRIMARY_ACTION_DEPRIORITIZED_LABEL_PATTERN =
	/\b(cancel|close|back|dismiss|reset|clear)\b/i;
const PRIMARY_ACTION_EXCLUDED_LABEL_PATTERN = /\bopen\s+preview\b/i;
const ACTION_LABEL_OBJECT_KEYS = [
	"label",
	"text",
	"title",
] as const;
const ACTION_LABEL_ROOT_KEYS = [
	"primaryLabel",
	"secondaryLabel",
	"tertiaryLabel",
	"actionLabel",
	"submitLabel",
	"ctaLabel",
	"viewLabel",
] as const;
const ACTION_LABEL_NESTED_KEYS = [
	"primary",
	"secondary",
	"tertiary",
	"actions",
	"buttons",
	"items",
] as const;
const ACTION_HREF_KEYS = [
	"href",
	"url",
	"link",
	"externalUrl",
	"webUrl",
	"pageUrl",
	"viewUrl",
	"editUrl",
] as const;
const URL_PATTERN = /https?:\/\/[^\s<>"'`]+/gi;
const SYSTEM_INSTRUCTIONS_BLOCK_PATTERN =
	/\[\s*System Instructions\s*\][\s\S]*?\[\s*End System Instructions\s*\]/gi;
const SYSTEM_INSTRUCTIONS_MARKER_PATTERN =
	/\[\s*(?:End\s+)?System Instructions\s*\]/gi;
const LEAKED_SYSTEM_PROMPT_PATTERN =
	/^you are (?:an?|the)\s+(?:ui generator|helpful assistant)\b/i;
const SANITIZED_SPEC_TEXT_PROP_KEYS = [
	"title",
	"description",
	"content",
	"text",
	"label",
	"subtitle",
	"summary",
	"caption",
	"placeholder",
] as const;

function isObjectRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}

function stripSystemInstructionArtifacts(value: string): string {
	return value
		.replace(SYSTEM_INSTRUCTIONS_BLOCK_PATTERN, " ")
		.replace(SYSTEM_INSTRUCTIONS_MARKER_PATTERN, " ");
}

function getNonEmptyString(value: unknown): string | undefined {
	if (typeof value !== "string") {
		return undefined;
	}

	const trimmed = stripSystemInstructionArtifacts(value).trim();
	if (LEAKED_SYSTEM_PROMPT_PATTERN.test(trimmed)) {
		return undefined;
	}
	return trimmed.length > 0 ? trimmed : undefined;
}

function normalizeSentence(value: string): string {
	return value
		.toLowerCase()
		.replace(/[.!?]+$/g, "")
		.replace(/\s+/g, " ")
		.trim();
}

function isLowSignalWidgetDescription(value: string): boolean {
	const normalized = normalizeSentence(value);
	if (!normalized) {
		return true;
	}

	if (normalizeSentence(DEFAULT_DESCRIPTION) === normalized) {
		return true;
	}

	return LOW_SIGNAL_WIDGET_DESCRIPTION_PATTERNS.some((pattern) => pattern.test(normalized));
}

function sanitizeSpecElementTextProps(
	elements: Record<string, unknown>
): Record<string, unknown> {
	let hasChanges = false;
	const sanitizedElements: Record<string, unknown> = {};

	for (const [key, element] of Object.entries(elements)) {
		if (!isObjectRecord(element)) {
			sanitizedElements[key] = element;
			continue;
		}

		const props = getElementProps(element);
		if (!props) {
			sanitizedElements[key] = element;
			continue;
		}

		let propsChanged = false;
		const nextProps: Record<string, unknown> = { ...props };
		for (const propKey of SANITIZED_SPEC_TEXT_PROP_KEYS) {
			if (!Object.prototype.hasOwnProperty.call(nextProps, propKey)) {
				continue;
			}

			const rawValue = nextProps[propKey];
			if (typeof rawValue !== "string") {
				continue;
			}

			const sanitizedValue = getNonEmptyString(rawValue);
			if (!sanitizedValue) {
				delete nextProps[propKey];
				propsChanged = true;
				continue;
			}

			if (sanitizedValue !== rawValue) {
				nextProps[propKey] = sanitizedValue;
				propsChanged = true;
			}
		}

		if (!propsChanged) {
			sanitizedElements[key] = element;
			continue;
		}

		sanitizedElements[key] = {
			...element,
			props: nextProps,
		};
		hasChanges = true;
	}

	return hasChanges ? sanitizedElements : elements;
}

function normalizeHintText(value: string): string {
	return value
		.replace(/([a-z0-9])([A-Z])/g, "$1 $2")
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, " ")
		.trim();
}

function resolveContentTypeFromHint(value?: string): GenerativeContentType | null {
	if (!value) {
		return null;
	}

	const normalized = normalizeHintText(value);
	if (!normalized) {
		return null;
	}

	const exactContentType = EXACT_CONTENT_TYPE_HINT_MAP.get(normalized);
	if (exactContentType) {
		return exactContentType;
	}

	for (const matcher of CONTENT_TYPE_HINT_MATCHERS) {
		if (matcher.pattern.test(normalized)) {
			return matcher.contentType;
		}
	}

	return null;
}

function resolveContentTypeFromElementType(value: string): GenerativeContentType | null {
	const normalized = normalizeHintText(value);
	if (!normalized) {
		return null;
	}

	for (const matcher of ELEMENT_TYPE_CONTENT_MATCHERS) {
		if (matcher.pattern.test(normalized)) {
			return matcher.contentType;
		}
	}

	return null;
}

function resolveContentTypeFromElementProps(
	element: Record<string, unknown>
): GenerativeContentType | null {
	const props = getElementProps(element);
	if (!props) {
		return null;
	}

	const hintText = [
		getNonEmptyString(props.title),
		getNonEmptyString(props.description),
		getNonEmptyString(props.content),
		getNonEmptyString(props.text),
		getNonEmptyString(props.label),
	]
		.filter((value): value is string => Boolean(value))
		.join(" ");
	if (!hintText) {
		return null;
	}

	return resolveContentTypeFromHint(hintText);
}

function readFirstNonEmptyString(
	record: Record<string, unknown>,
	keys: readonly string[]
): string | undefined {
	for (const key of keys) {
		const value = getNonEmptyString(record[key]);
		if (value) {
			return value;
		}
	}

	return undefined;
}

function readActionHref(
	record: Record<string, unknown>,
	keys: readonly string[] = [...ACTION_HREF_KEYS]
): string | undefined {
	const href = readFirstNonEmptyString(record, keys);
	if (!href) {
		return undefined;
	}

	const normalized = href.trim();
	if (!normalized || normalized.toLowerCase().startsWith("javascript:")) {
		return undefined;
	}

	return normalized;
}

function mergeActionItems(items: readonly GenerativeWidgetActionItem[]): GenerativeWidgetActionItem[] {
	const mergedItems: GenerativeWidgetActionItem[] = [];
	const itemIndexByLabel = new Map<string, number>();

	for (const item of items) {
		const label = getNonEmptyString(item.label);
		if (!label || PRIMARY_ACTION_EXCLUDED_LABEL_PATTERN.test(label)) {
			continue;
		}

		const href = getNonEmptyString(item.href);
		const normalizedLabel = label.toLowerCase();
		const existingIndex = itemIndexByLabel.get(normalizedLabel);
		if (existingIndex === undefined) {
			mergedItems.push({ label, ...(href ? { href } : {}) });
			itemIndexByLabel.set(normalizedLabel, mergedItems.length - 1);
			continue;
		}

		const existingItem = mergedItems[existingIndex];
		if (!existingItem.href && href) {
			mergedItems[existingIndex] = { ...existingItem, href };
		}
	}

	return mergedItems;
}

function extractActionItemFromRecord(record: Record<string, unknown>): GenerativeWidgetActionItem | null {
	const label = readFirstNonEmptyString(record, [...ACTION_LABEL_OBJECT_KEYS]);
	if (!label) {
		return null;
	}

	const href = readActionHref(record);
	return { label, ...(href ? { href } : {}) };
}

function collectActionItemsFromActionsValue(value: unknown): GenerativeWidgetActionItem[] {
	if (!isObjectRecord(value)) {
		return [];
	}

	const items: GenerativeWidgetActionItem[] = [];

	for (const labelKey of ACTION_LABEL_ROOT_KEYS) {
		const label = getNonEmptyString(value[labelKey]);
		if (!label) {
			continue;
		}

		const actionHint = labelKey
			.replace(/Label$/i, "")
			.toLowerCase();
		const href = readActionHref(value, [
			`${actionHint}Href`,
			`${actionHint}Url`,
			...ACTION_HREF_KEYS,
		]);

		items.push({ label, ...(href ? { href } : {}) });
	}

	for (const nestedKey of ACTION_LABEL_NESTED_KEYS) {
		const nestedValue = value[nestedKey];
		if (Array.isArray(nestedValue)) {
			for (const entry of nestedValue) {
				if (!isObjectRecord(entry)) {
					continue;
				}
				const item = extractActionItemFromRecord(entry);
				if (item) {
					items.push(item);
				}
			}
			continue;
		}

		if (!isObjectRecord(nestedValue)) {
			continue;
		}

		const item = extractActionItemFromRecord(nestedValue);
		if (item) {
			items.push(item);
		}
	}

	return mergeActionItems(items);
}

function mapFallbackHrefForLabel(label: string, source: Record<string, unknown>): string | undefined {
	const isEditAction = /\bedit\b/i.test(label);
	const isViewAction = /\bview\b|\bopen\b/i.test(label);

	if (isEditAction) {
		return readActionHref(source, [
			"editUrl",
			"editHref",
			"pageEditUrl",
			...ACTION_HREF_KEYS,
		]);
	}

	if (isViewAction) {
		return readActionHref(source, [
			"viewUrl",
			"viewHref",
			"pageUrl",
			"externalUrl",
			...ACTION_HREF_KEYS,
		]);
	}

	return undefined;
}

function extractUrlsFromString(value: string): string[] {
	const matches = value.match(URL_PATTERN);
	if (!matches) {
		return [];
	}

	return matches
		.map((url) => url.replace(/[),.;]+$/g, "").trim())
		.filter((url) => url.length > 0);
}

function collectUrlCandidates(value: unknown): string[] {
	const queue: unknown[] = [value];
	const visited = new Set<unknown>();
	const collectedUrls: string[] = [];
	let processedNodes = 0;

	while (queue.length > 0 && processedNodes < 500) {
		const current = queue.shift();
		processedNodes += 1;

		if (typeof current === "string") {
			collectedUrls.push(...extractUrlsFromString(current));
			continue;
		}

		if (Array.isArray(current)) {
			for (const item of current) {
				queue.push(item);
			}
			continue;
		}

		if (!isObjectRecord(current)) {
			continue;
		}

		if (visited.has(current)) {
			continue;
		}

		visited.add(current);
		for (const entry of Object.values(current)) {
			queue.push(entry);
		}
	}

	return Array.from(new Set(collectedUrls));
}

function selectBestUrlForAction(label: string, candidates: readonly string[]): string | undefined {
	if (candidates.length === 0) {
		return undefined;
	}

	const wantsEdit = /\bedit\b/i.test(label);
	const wantsView = /\bview\b|\bopen\b|\bpage\b/i.test(label);
	let bestCandidate: { url: string; score: number; index: number } | null = null;

	for (const [index, url] of candidates.entries()) {
		const normalizedUrl = url.toLowerCase();
		const looksLikeEditUrl = /\/edit\b|[?&]mode=edit\b|\/edit\//.test(normalizedUrl);
		let score = 0;

		if (/confluence|\/wiki\//.test(normalizedUrl)) {
			score += 20;
		}

		if (wantsEdit && looksLikeEditUrl) {
			score += 50;
		}

		if (wantsView && !looksLikeEditUrl) {
			score += 35;
		}

		if (wantsView && looksLikeEditUrl) {
			score -= 15;
		}

		if (!bestCandidate || score > bestCandidate.score) {
			bestCandidate = { url, score, index };
		}
	}

	return bestCandidate?.url ?? candidates[0];
}

function clipText(text: string, maxLength: number): string {
	if (text.length <= maxLength) {
		return text;
	}

	return `${text.slice(0, maxLength - 1).trimEnd()}…`;
}

function parseExplicitSource(payload: Record<string, unknown>): ParsedGenerativeWidgetSource | null {
	const rootName = readFirstNonEmptyString(payload, [
		"sourceAppName",
		"sourceName",
		"sourceProduct",
		"sourceLabel",
	]);
	const rootLogoSrc = readFirstNonEmptyString(payload, [
		"sourceLogoSrc",
		"sourceLogo",
		"sourceIconSrc",
	]);

	let nestedName: string | undefined;
	let nestedLogoSrc: string | undefined;
	const sourceValue = payload.source;
	if (isObjectRecord(sourceValue)) {
		nestedName = readFirstNonEmptyString(sourceValue, [
			"appName",
			"name",
			"product",
			"label",
		]);
		nestedLogoSrc = readFirstNonEmptyString(sourceValue, [
			"logoSrc",
			"logo",
			"iconSrc",
			"imageSrc",
		]);
	}

	const name = rootName ?? nestedName;
	const logoSrc = rootLogoSrc ?? nestedLogoSrc;
	if (!name && !logoSrc) {
		return null;
	}

	return {
		...(name ? { name } : {}),
		...(logoSrc ? { logoSrc } : {}),
	};
}

function parseGenerativeWidgetBase(payload: Record<string, unknown>): ParsedGenerativeWidgetBase {
	const title = readFirstNonEmptyString(payload, [
		"title",
		"cardTitle",
		"widgetTitle",
	]);
	const description = readFirstNonEmptyString(payload, [
		"description",
		"cardDescription",
		"widgetDescription",
	]);
	let primaryActionLabel = readFirstNonEmptyString(payload, [
		"primaryActionLabel",
		"primaryCtaLabel",
		"actionLabel",
		"submitLabel",
		"ctaLabel",
	]);
	const actionsValue = payload.actions;
	const parsedActions = mergeActionItems([
		...collectActionItemsFromActionsValue(actionsValue),
		...collectActionItemsFromActionsValue(payload),
	]);
	const payloadUrlCandidates = collectUrlCandidates(payload);
	if (!primaryActionLabel && isObjectRecord(actionsValue)) {
		const nestedPrimary = actionsValue.primary;
		if (isObjectRecord(nestedPrimary)) {
			primaryActionLabel = readFirstNonEmptyString(nestedPrimary, [
				"label",
				"text",
				"title",
			]);
		}

		if (!primaryActionLabel) {
			primaryActionLabel = readFirstNonEmptyString(actionsValue, [
				"primaryLabel",
				"submitLabel",
				"actionLabel",
			]);
		}
	}
	const actionsWithFallbackLinks = mergeActionItems(
		parsedActions.map((actionItem) => {
			if (actionItem.href) {
				return actionItem;
			}

			const href =
				mapFallbackHrefForLabel(actionItem.label, payload) ??
				(isObjectRecord(actionsValue)
					? mapFallbackHrefForLabel(actionItem.label, actionsValue)
					: undefined) ??
				selectBestUrlForAction(actionItem.label, payloadUrlCandidates);

			return { ...actionItem, ...(href ? { href } : {}) };
		})
	);
	const primaryActionHref = primaryActionLabel
		? mapFallbackHrefForLabel(primaryActionLabel, payload) ??
			selectBestUrlForAction(primaryActionLabel, payloadUrlCandidates)
		: undefined;
	const resolvedActions =
		actionsWithFallbackLinks.length > 0
			? actionsWithFallbackLinks
			: primaryActionLabel
				? [{
					label: primaryActionLabel,
					...(primaryActionHref
						? { href: primaryActionHref }
						: {}),
				}]
				: [];

	const contentTypeHint = readFirstNonEmptyString(payload, [
		...GENERATIVE_CONTENT_TYPE_HINT_KEYS,
	]);

	const rawIconHint = readFirstNonEmptyString(payload, [
		"iconHint",
		"icon",
		"iconName",
	]);
	const iconHint = rawIconHint
		? rawIconHint.trim().replace(/\s+/g, "-").toLowerCase()
		: undefined;

	return {
		...(title ? { title } : {}),
		...(description ? { description } : {}),
		...(primaryActionLabel ? { primaryActionLabel } : {}),
		...(resolvedActions.length > 0
			? { actions: resolvedActions }
			: {}),
		...(contentTypeHint ? { contentTypeHint } : {}),
		...(iconHint ? { iconHint } : {}),
		source: parseExplicitSource(payload),
	};
}

function parseGenuiPreviewWidgetData(value: unknown): ParsedGenuiPreviewWidget | null {
	if (!isObjectRecord(value) || !isObjectRecord(value.spec)) {
		return null;
	}

	const rawSpec = value.spec;
	const root = typeof rawSpec.root === "string" ? rawSpec.root : "";
	const elements = isObjectRecord(rawSpec.elements) ? rawSpec.elements : null;
	if (!root.trim() || !elements || Object.keys(elements).length === 0) {
		return null;
	}
	const sanitizedElements = sanitizeSpecElementTextProps(elements);

	const spec = {
		root,
		elements: sanitizedElements,
		...(Object.prototype.hasOwnProperty.call(rawSpec, "state")
			? { state: rawSpec.state }
			: {}),
	} as Spec;

	const summary = getNonEmptyString(value.summary);

	return {
		type: "genui-preview",
		spec,
		...(summary ? { summary } : {}),
		...parseGenerativeWidgetBase(value),
	};
}

function parseAudioPreviewWidgetData(value: unknown): ParsedAudioPreviewWidget | null {
	if (!isObjectRecord(value) || typeof value.audioUrl !== "string") {
		return null;
	}

	const audioUrl = value.audioUrl.trim();
	if (!audioUrl) {
		return null;
	}

	const mimeType = getNonEmptyString(value.mimeType);
	const transcript = getNonEmptyString(value.transcript);

	return {
		type: "audio-preview",
		audioUrl,
		...(mimeType ? { mimeType } : {}),
		...(transcript ? { transcript } : {}),
		...parseGenerativeWidgetBase(value),
	};
}

function parseImagePreviewWidgetData(value: unknown): ParsedImagePreviewWidget | null {
	if (!isObjectRecord(value) || !Array.isArray(value.images)) {
		return null;
	}

	const images = value.images
		.filter((entry): entry is Record<string, unknown> => isObjectRecord(entry))
		.map((entry) => ({
			url: typeof entry.url === "string" ? entry.url.trim() : "",
			mimeType: getNonEmptyString(entry.mimeType),
		}))
		.filter((entry) => entry.url.length > 0);
	if (images.length === 0) {
		return null;
	}

	const prompt = getNonEmptyString(value.prompt);

	return {
		type: "image-preview",
		images,
		...(prompt ? { prompt } : {}),
		...parseGenerativeWidgetBase(value),
	};
}

export function parseGenerativeWidget(
	widgetType: string,
	widgetData: unknown
): ParsedGenerativeWidget | null {
	if (widgetType === "genui-preview") {
		return parseGenuiPreviewWidgetData(widgetData);
	}

	if (widgetType === "audio-preview") {
		return parseAudioPreviewWidgetData(widgetData);
	}

	if (widgetType === "image-preview") {
		return parseImagePreviewWidgetData(widgetData);
	}

	return null;
}

function resolveGenuiContentType(widget: ParsedGenuiPreviewWidget): GenerativeContentType {
	const textHints = [
		widget.title,
		widget.description,
		widget.summary,
		widget.primaryActionLabel,
		widget.source?.name,
	]
		.filter((value): value is string => typeof value === "string" && value.trim().length > 0)
		.join(" ");

	const hintedContentType = resolveContentTypeFromHint(textHints);
	if (hintedContentType) {
		return hintedContentType;
	}

	for (const value of Object.values(widget.spec.elements ?? {})) {
		if (!isObjectRecord(value)) {
			continue;
		}

		const inferredFromProps = resolveContentTypeFromElementProps(value);
		if (inferredFromProps) {
			return inferredFromProps;
		}

		const typeName = getNonEmptyString(value.type);
		if (!typeName) {
			continue;
		}

		const inferredElementType = resolveContentTypeFromElementType(typeName);
		if (inferredElementType) {
			return inferredElementType;
		}
	}

	return "other";
}

function resolveContentType(widget: ParsedGenerativeWidget): GenerativeContentType {
	const explicitHint = resolveContentTypeFromHint(widget.contentTypeHint);
	if (widget.type === "genui-preview") {
		const inferredContentType = resolveGenuiContentType(widget);

		// Generic "text" hints should not override stronger inferred domains.
		if (
			explicitHint &&
			!(
				explicitHint === "text" &&
				inferredContentType !== "other" &&
				inferredContentType !== "text"
			)
		) {
			return explicitHint;
		}

		if (inferredContentType !== "other") {
			return inferredContentType;
		}

		return explicitHint ?? inferredContentType;
	}

	if (explicitHint) {
		return explicitHint;
	}

	if (widget.type === "image-preview") {
		return "image";
	}

	if (widget.type === "audio-preview") {
		return "sound";
	}

	return "other";
}

function getSpecTraversalKeys(spec: Spec): string[] {
	const keys: string[] = [];
	const visited = new Set<string>();
	const elements = spec.elements ?? {};

	const visit = (key: string) => {
		if (!key || visited.has(key)) {
			return;
		}

		visited.add(key);
		keys.push(key);

		const element = elements[key];
		if (!isObjectRecord(element) || !Array.isArray(element.children)) {
			return;
		}

		for (const childKey of element.children) {
			if (typeof childKey === "string" && childKey.trim().length > 0) {
				visit(childKey);
			}
		}
	};

	visit(spec.root);
	for (const key of Object.keys(elements)) {
		visit(key);
	}

	return keys;
}

function getElementProps(element: Record<string, unknown>): Record<string, unknown> | null {
	return isObjectRecord(element.props) ? element.props : null;
}

interface SpecTitleCandidate {
	text: string;
	propName: string;
	key: string;
	score: number;
	index: number;
}

function findBestTitleInSpec(widget: ParsedGenuiPreviewWidget): SpecTitleCandidate | null {
	const traversalKeys = getSpecTraversalKeys(widget.spec);
	let best: SpecTitleCandidate | null = null;

	for (const [index, key] of traversalKeys.entries()) {
		const element = widget.spec.elements[key];
		if (!isObjectRecord(element)) {
			continue;
		}

		const elementType = getNonEmptyString(element.type);
		const props = getElementProps(element);
		if (!elementType || !props) {
			continue;
		}

		let candidateText: string | undefined;
		let propName = "title";
		let score = 0;
		if (elementType === "PageHeader") {
			candidateText = getNonEmptyString(props.title);
			score = 140;
		} else if (elementType === "Heading") {
			candidateText = getNonEmptyString(props.text);
			propName = "text";
			const headingLevel = getNonEmptyString(props.level);
			score = headingLevel === "h1" ? 130 : headingLevel === "h2" ? 125 : 120;
		} else if (elementType === "Card") {
			candidateText = getNonEmptyString(props.title);
			score = 110;
		} else {
			candidateText = getNonEmptyString(props.title);
			if (!candidateText) {
				candidateText = getNonEmptyString(props.text);
				propName = "text";
			}
			score = 80;
		}

		if (!candidateText) {
			continue;
		}

		if (!best || score > best.score || (score === best.score && index < best.index)) {
			best = { text: candidateText, propName, key, score, index };
		}
	}

	return best;
}

function resolveGenuiTitleFromSpec(widget: ParsedGenuiPreviewWidget): string | undefined {
	return findBestTitleInSpec(widget)?.text;
}

interface SpecDescriptionCandidate {
	text: string;
	propName: string;
	key: string;
	score: number;
	index: number;
}

function findBestDescriptionInSpec(widget: ParsedGenuiPreviewWidget): SpecDescriptionCandidate | null {
	const traversalKeys = getSpecTraversalKeys(widget.spec);
	let best: SpecDescriptionCandidate | null = null;

	for (const [index, key] of traversalKeys.entries()) {
		const element = widget.spec.elements[key];
		if (!isObjectRecord(element)) {
			continue;
		}

		const elementType = getNonEmptyString(element.type);
		const props = getElementProps(element);
		if (!elementType || !props) {
			continue;
		}

		let candidateText: string | undefined;
		let propName = "description";
		let score = 0;
		if (elementType === "PageHeader") {
			candidateText = getNonEmptyString(props.description);
			score = 140;
		} else if (elementType === "Card") {
			candidateText = getNonEmptyString(props.description);
			score = 120;
		} else if (elementType === "Text") {
			candidateText = getNonEmptyString(props.content);
			propName = "content";
			score = 100;
		} else {
			candidateText = getNonEmptyString(props.description);
			score = 80;
		}

		if (!candidateText || candidateText.length < 12) {
			continue;
		}

		if (!best || score > best.score || (score === best.score && index < best.index)) {
			best = { text: candidateText, propName, key, score, index };
		}
	}

	return best;
}

function resolveGenuiDescriptionFromSpec(widget: ParsedGenuiPreviewWidget): string | undefined {
	return findBestDescriptionInSpec(widget)?.text;
}

function scorePrimaryActionLabel(
	label: string,
	variant: string | undefined
): number {
	if (PRIMARY_ACTION_EXCLUDED_LABEL_PATTERN.test(label)) {
		return -1000;
	}

	let score = 0;
	if (PRIMARY_ACTION_PREFERRED_LABEL_PATTERN.test(label)) {
		score += 100;
	}

	if (PRIMARY_ACTION_DEPRIORITIZED_LABEL_PATTERN.test(label)) {
		score -= 120;
	}

	if (variant === "default") {
		score += 25;
	}

	if (variant === "outline" || variant === "ghost" || variant === "link") {
		score -= 20;
	}

	if (label.length > 40) {
		score -= 10;
	}

	return score;
}

function resolveGenuiPrimaryActionLabelFromSpec(
	widget: ParsedGenuiPreviewWidget
): string | undefined {
	const traversalKeys = getSpecTraversalKeys(widget.spec);
	let fallbackLabel: string | undefined;
	let bestLabel: { text: string; score: number } | null = null;

	for (const key of traversalKeys) {
		const element = widget.spec.elements[key];
		if (!isObjectRecord(element)) {
			continue;
		}

		if (getNonEmptyString(element.type) !== "Button") {
			continue;
		}

		const props = getElementProps(element);
		if (!props) {
			continue;
		}

		const label = readFirstNonEmptyString(props, [...ACTION_LABEL_OBJECT_KEYS]);
		if (!label) {
			continue;
		}

		if (!fallbackLabel) {
			fallbackLabel = label;
		}

		const variant = getNonEmptyString(props.variant);
		const score = scorePrimaryActionLabel(label, variant);
		if (!bestLabel || score > bestLabel.score) {
			bestLabel = { text: label, score };
		}
	}

	if (bestLabel && bestLabel.score >= 0) {
		return bestLabel.text;
	}

	if (
		fallbackLabel &&
		!PRIMARY_ACTION_DEPRIORITIZED_LABEL_PATTERN.test(fallbackLabel) &&
		!PRIMARY_ACTION_EXCLUDED_LABEL_PATTERN.test(fallbackLabel)
	) {
		return fallbackLabel;
	}

	return undefined;
}

function resolveActionHrefFromPress(pressValue: unknown): string | undefined {
	if (!isObjectRecord(pressValue)) {
		return undefined;
	}

	const directHref = readActionHref(pressValue);
	if (directHref) {
		return directHref;
	}

	const paramsValue = pressValue.params;
	if (!isObjectRecord(paramsValue)) {
		return undefined;
	}

	return readActionHref(paramsValue);
}

function resolveGenuiActionsFromSpec(
	widget: ParsedGenuiPreviewWidget
): GenerativeWidgetActionItem[] {
	const traversalKeys = getSpecTraversalKeys(widget.spec);
	const actions: GenerativeWidgetActionItem[] = [];

	for (const key of traversalKeys) {
		const element = widget.spec.elements[key];
		if (!isObjectRecord(element)) {
			continue;
		}

		if (getNonEmptyString(element.type) !== "Button") {
			continue;
		}

		const props = getElementProps(element);
		if (!props) {
			continue;
		}

		const label = readFirstNonEmptyString(props, [...ACTION_LABEL_OBJECT_KEYS]);
		if (!label) {
			continue;
		}

		const href =
			readActionHref(props) ??
			(isObjectRecord(element.on)
				? resolveActionHrefFromPress(element.on.press)
				: undefined);

		actions.push({ label, ...(href ? { href } : {}) });
	}

	return mergeActionItems(actions);
}

const CONTENT_TYPE_FALLBACK_TITLES: Partial<Record<GenerativeContentType, string>> = {
	"image": "Generated image",
	"sound": "Generated audio",
	"translation": "Generated translation",
	"message": "Generated message draft",
	"calendar": "Generated calendar preview",
	"chart": "Generated chart preview",
	"chart-bar": "Generated chart preview",
	"chart-line": "Generated chart preview",
	"chart-area": "Generated chart preview",
	"chart-pie": "Generated chart preview",
	"chart-radar": "Generated chart preview",
	"chart-scatter": "Generated chart preview",
	"text": "Generated text draft",
	"work-item": "Generated work item",
	"page": "Generated page draft",
	"board": "Generated board preview",
	"table": "Generated table preview",
	"code": "Generated code snippet",
	"video": "Generated video draft",
	"ui": "Generated UI preview",
};

function resolveTitle(
	widget: ParsedGenerativeWidget,
	contentType: GenerativeContentType,
	derivedGenuiTitle?: string
): string {
	if (widget.title) {
		return clipText(widget.title, 72);
	}

	if (widget.type === "genui-preview" && derivedGenuiTitle) {
		return clipText(derivedGenuiTitle, 72);
	}

	if (widget.type === "image-preview" && widget.prompt) {
		return clipText(widget.prompt, 72);
	}

	if (widget.type === "audio-preview" && widget.transcript) {
		return clipText(widget.transcript, 72);
	}

	return CONTENT_TYPE_FALLBACK_TITLES[contentType] ?? "Generated content";
}

function countCollectionItems(value: unknown): number {
	if (!Array.isArray(value)) {
		return 0;
	}

	return value.filter((entry) => entry !== null && entry !== undefined).length;
}

interface CalendarOverviewDetails {
	displayCount?: number;
	totalCount?: number;
	calendarName?: string;
	timeZone?: string;
}

function extractCalendarOverviewDetails(widget: ParsedGenuiPreviewWidget): CalendarOverviewDetails {
	const traversalKeys = getSpecTraversalKeys(widget.spec);
	const details: CalendarOverviewDetails = {};

	for (const key of traversalKeys) {
		const element = widget.spec.elements[key];
		if (!isObjectRecord(element) || getNonEmptyString(element.type) !== "Text") {
			continue;
		}

		const props = getElementProps(element);
		if (!props) {
			continue;
		}

		const content = getNonEmptyString(props.content);
		if (!content) {
			continue;
		}

		if (!details.totalCount) {
			const showingMatch = content.match(/\bshowing\s+(\d+)\s+of\s+(\d+)\s+events?\b/i);
			if (showingMatch) {
				details.displayCount = Number.parseInt(showingMatch[1], 10);
				details.totalCount = Number.parseInt(showingMatch[2], 10);
			}
		}

		if (!details.calendarName) {
			const calendarMatch = content.match(/\bcalendar:\s*([^.\n]+)/i);
			if (calendarMatch?.[1]) {
				details.calendarName = calendarMatch[1].trim();
			}
		}

		if (!details.timeZone) {
			const timeZoneMatch = content.match(/\btime\s*zone:\s*([^.\n]+)/i);
			if (timeZoneMatch?.[1]) {
				details.timeZone = timeZoneMatch[1].trim();
			}
		}
	}

	return details;
}

function resolveGenuiContextDescription(
	widget: ParsedGenuiPreviewWidget
): string | undefined {
	const traversalKeys = getSpecTraversalKeys(widget.spec);
	const calendarOverview = extractCalendarOverviewDetails(widget);

	for (const key of traversalKeys) {
		const element = widget.spec.elements[key];
		if (!isObjectRecord(element)) {
			continue;
		}

		const elementType = getNonEmptyString(element.type);
		const props = getElementProps(element);
		if (!elementType || !props) {
			continue;
		}

		if (elementType === "WorkSummary") {
			const jiraCount = countCollectionItems(props.jiraItems);
			const confluenceCount = countCollectionItems(props.confluencePages);
			if (jiraCount > 0 || confluenceCount > 0) {
				const parts = [
					jiraCount > 0 ? `${jiraCount} Jira work item${jiraCount === 1 ? "" : "s"}` : null,
					confluenceCount > 0
						? `${confluenceCount} Confluence page${confluenceCount === 1 ? "" : "s"}`
						: null,
				].filter((part): part is string => Boolean(part));
				if (parts.length === 2) {
					return `${parts[0]} and ${parts[1]} found.`;
				}
				return `${parts[0]} found.`;
			}
		}

		if (elementType === "CalendarTimeline") {
			const eventCount = countCollectionItems(props.events);
			if (eventCount > 0) {
				const resolvedCount =
					(calendarOverview.totalCount && calendarOverview.totalCount > 0)
						? calendarOverview.totalCount
						: eventCount;
				const countLabel = `${resolvedCount} calendar event${resolvedCount === 1 ? "" : "s"}`;
				if (calendarOverview.calendarName) {
					return `${countLabel} in ${calendarOverview.calendarName} calendar.`;
				}
				if (calendarOverview.timeZone) {
					return `${countLabel} (${calendarOverview.timeZone}).`;
				}
				return `${countLabel} in this timeline.`;
			}
		}

		if (elementType === "Timeline") {
			const itemCount = countCollectionItems(props.items);
			if (itemCount > 0) {
				return `${itemCount} timeline item${itemCount === 1 ? "" : "s"} in this view.`;
			}
		}

		if (elementType === "Metric") {
			const metricTitle =
				getNonEmptyString(props.title) ??
				getNonEmptyString(props.label) ??
				getNonEmptyString(props.name);
			const metricValue = getNonEmptyString(props.value);
			if (metricTitle && metricValue) {
				return `${metricTitle}: ${metricValue}`;
			}
			if (metricTitle) {
				return `${metricTitle} metric available.`;
			}
		}
	}

	for (const key of traversalKeys) {
		const element = widget.spec.elements[key];
		if (!isObjectRecord(element)) {
			continue;
		}

		if (getNonEmptyString(element.type) !== "Text") {
			continue;
		}

		const props = getElementProps(element);
		if (!props) {
			continue;
		}

		const content = getNonEmptyString(props.content);
		if (!content || content.length < 16) {
			continue;
		}

		if (content.toLowerCase() === DEFAULT_DESCRIPTION.toLowerCase()) {
			continue;
		}

		return content;
	}

	return undefined;
}

function resolvePreferredGenuiDescription({
	explicitDescription,
	derivedDescription,
	summary,
	contextDescription,
}: {
	explicitDescription?: string;
	derivedDescription?: string;
	summary?: string;
	contextDescription?: string;
}): string | undefined {
	const prioritizedCandidates = [
		explicitDescription && !isLowSignalWidgetDescription(explicitDescription)
			? explicitDescription
			: undefined,
		contextDescription,
		derivedDescription && !isLowSignalWidgetDescription(derivedDescription)
			? derivedDescription
			: undefined,
		summary && !isLowSignalWidgetDescription(summary)
			? summary
			: undefined,
		explicitDescription,
		derivedDescription,
		summary,
	];

	return prioritizedCandidates.find(
		(candidate): candidate is string =>
			typeof candidate === "string" && candidate.trim().length > 0
	);
}

function resolveDescription(
	widget: ParsedGenerativeWidget,
	derivedGenuiDescription?: string
): string {
	const explicitDescription = widget.description
		? clipText(widget.description, 140)
		: undefined;

	if (widget.type === "genui-preview") {
		const contextDescription = resolveGenuiContextDescription(widget);
		const preferredDescription = resolvePreferredGenuiDescription({
			explicitDescription,
			derivedDescription: derivedGenuiDescription
				? clipText(derivedGenuiDescription, 140)
				: undefined,
			summary: widget.summary
				? clipText(widget.summary, 140)
				: undefined,
			contextDescription,
		});
		if (preferredDescription) {
			return clipText(preferredDescription, 140);
		}
	}

	if (explicitDescription) {
		return explicitDescription;
	}

	if (widget.type === "image-preview") {
		if (widget.title && widget.prompt) {
			return clipText(widget.prompt, 140);
		}
		return "AI-generated image";
	}

	if (widget.type === "audio-preview") {
		if (widget.title && widget.transcript) {
			return clipText(widget.transcript, 140);
		}
		return "AI-generated audio";
	}

	return DEFAULT_DESCRIPTION;
}

function resolvePrimaryActionLabel(
	widget: ParsedGenerativeWidget,
	derivedGenuiPrimaryActionLabel?: string
): string | undefined {
	if (widget.type !== "genui-preview") {
		return undefined;
	}

	if (widget.primaryActionLabel) {
		return clipText(widget.primaryActionLabel, 40);
	}

	if (derivedGenuiPrimaryActionLabel) {
		return clipText(derivedGenuiPrimaryActionLabel, 40);
	}

	return undefined;
}

function resolveActions(
	widget: ParsedGenerativeWidget,
	primaryActionLabel: string | undefined,
	derivedGenuiActions: GenerativeWidgetActionItem[] = []
): GenerativeWidgetActionItem[] | undefined {
	if (widget.type !== "genui-preview") {
		return undefined;
	}

	const mergedActions = mergeActionItems([
		...(primaryActionLabel ? [{ label: primaryActionLabel }] : []),
		...(widget.actions ?? []),
		...derivedGenuiActions,
	]);
	const knownHrefs = Array.from(new Set(
		mergedActions
			.map((actionItem) => getNonEmptyString(actionItem.href))
			.filter((href): href is string => Boolean(href))
	));
	const additionalCandidates =
		widget.type === "genui-preview"
			? collectUrlCandidates(widget.spec)
			: [];
	const allCandidates = Array.from(new Set([...knownHrefs, ...additionalCandidates]));
	const hydratedActions = mergedActions.map((actionItem) => {
		if (actionItem.href) {
			return actionItem;
		}

		const shouldInheritHref = /\b(view|edit|open|page)\b/i.test(actionItem.label);
		if (!shouldInheritHref || allCandidates.length === 0) {
			return actionItem;
		}

		if (knownHrefs.length === 1) {
			return { ...actionItem, href: knownHrefs[0] };
		}

		return {
			...actionItem,
			href: selectBestUrlForAction(actionItem.label, allCandidates),
		};
	});
	const resolvedActions = hydratedActions.map((actionItem) => ({
		...actionItem,
		label: clipText(actionItem.label, 40),
	}));

	if (resolvedActions.length === 0) {
		return undefined;
	}

	return resolvedActions;
}

export function resolveGenerativeWidgetMetadata(
	widget: ParsedGenerativeWidget
): GenerativeWidgetMetadata {
	const contentType = resolveContentType(widget);
	const derivedGenuiTitle =
		widget.type === "genui-preview"
			? resolveGenuiTitleFromSpec(widget)
			: undefined;
	const derivedGenuiDescription =
		widget.type === "genui-preview"
			? resolveGenuiDescriptionFromSpec(widget)
			: undefined;
	const derivedGenuiPrimaryActionLabel =
		widget.type === "genui-preview"
			? resolveGenuiPrimaryActionLabelFromSpec(widget)
			: undefined;
	const derivedGenuiActions =
		widget.type === "genui-preview"
			? resolveGenuiActionsFromSpec(widget)
			: [];
	const primaryActionLabel = resolvePrimaryActionLabel(
		widget,
		derivedGenuiPrimaryActionLabel
	);
	const actions = resolveActions(
		widget,
		primaryActionLabel,
		derivedGenuiActions
	);
	const actionLabels = actions?.map((actionItem) => actionItem.label);
	const iconHintText = [
		widget.title,
		widget.description,
		widget.type === "genui-preview" ? widget.summary : undefined,
		derivedGenuiTitle,
		derivedGenuiDescription,
		widget.source?.name,
	]
		.filter((value): value is string => typeof value === "string" && value.trim().length > 0)
		.join(" ")
		.trim();

	return {
		contentType,
		title: resolveTitle(widget, contentType, derivedGenuiTitle),
		description: resolveDescription(widget, derivedGenuiDescription),
		source: widget.source,
		...(widget.iconHint ? { iconHint: widget.iconHint } : {}),
		...(iconHintText ? { iconHintText } : {}),
		...(primaryActionLabel ? { primaryActionLabel } : {}),
		...(actions ? { actions } : {}),
		...(actionLabels ? { actionLabels } : {}),
	};
}

export function buildGenerativeWidgetSubmitPrompt(
	payload: GenerativeWidgetPrimaryActionPayload
): string {
	const serializedState = JSON.stringify(payload.formState ?? {}, null, 2);

	return [
		`Please execute "${payload.actionLabel}" for "${payload.title}".`,
		`Context: ${payload.description}`,
		"Use these form values:",
		"```json",
		serializedState,
		"```",
	].join("\n");
}

interface SpecTextSource {
	key: string;
	propName: string;
}

function findTitleSourceInSpec(widget: ParsedGenuiPreviewWidget): SpecTextSource | null {
	const best = findBestTitleInSpec(widget);
	return best ? { key: best.key, propName: best.propName } : null;
}

function findDescriptionSourceInSpec(widget: ParsedGenuiPreviewWidget): SpecTextSource | null {
	const best = findBestDescriptionInSpec(widget);
	return best ? { key: best.key, propName: best.propName } : null;
}

const REMOVABLE_HEADER_TYPES = new Set(["PageHeader", "Heading", "Text"]);
const COLLAPSIBLE_EMPTY_CONTAINER_TYPES = new Set(["Stack"]);
const TRANSLATED_HEADING_PATTERN = /^translated\s*\(/i;
const USAGE_NOTES_CARD_TITLE_PATTERN = /^usage\s+notes\b/i;

function getLiveChildKeys(
	children: unknown[],
	elements: Record<string, unknown>,
	keysToRemove: ReadonlySet<string>
): string[] {
	return children.filter((childKey): childKey is string => {
		if (typeof childKey !== "string" || childKey.trim().length === 0) {
			return false;
		}

		if (keysToRemove.has(childKey)) {
			return false;
		}

		return Object.prototype.hasOwnProperty.call(elements, childKey);
	});
}

function isSeparatorElement(element: unknown): boolean {
	return isObjectRecord(element) && getNonEmptyString(element.type) === "Separator";
}

function normalizeChildKeySequence(
	childKeys: readonly string[],
	elements: Record<string, unknown>
): string[] {
	const normalized: string[] = [];

	for (const childKey of childKeys) {
		const childIsSeparator = isSeparatorElement(elements[childKey]);
		if (normalized.length === 0 && childIsSeparator) {
			continue;
		}

		const previousKey = normalized[normalized.length - 1];
		const previousIsSeparator = previousKey
			? isSeparatorElement(elements[previousKey])
			: false;

		if (childIsSeparator && previousIsSeparator) {
			continue;
		}

		normalized.push(childKey);
	}

	while (
		normalized.length > 0 &&
		isSeparatorElement(elements[normalized[normalized.length - 1]])
	) {
		normalized.pop();
	}

	return normalized;
}

function arraysMatch(left: readonly string[], right: readonly string[]): boolean {
	if (left.length !== right.length) {
		return false;
	}

	for (let index = 0; index < left.length; index += 1) {
		if (left[index] !== right[index]) {
			return false;
		}
	}

	return true;
}

function normalizeTranslationTypography(
	elements: Record<string, unknown>
): Record<string, unknown> {
	const normalizedElements: Record<string, unknown> = { ...elements };

	for (const element of Object.values(normalizedElements)) {
		if (!isObjectRecord(element) || getNonEmptyString(element.type) !== "Stack") {
			continue;
		}

		if (!Array.isArray(element.children)) {
			continue;
		}

		const childKeys = element.children.filter(
			(childKey): childKey is string =>
				typeof childKey === "string" && childKey.trim().length > 0
		);
		if (childKeys.length < 2) {
			continue;
		}

		const translatedHeadingKey = childKeys[0];
		const translatedValueKey = childKeys[1];
		const translatedHeading = normalizedElements[translatedHeadingKey];
		if (
			!isObjectRecord(translatedHeading) ||
			getNonEmptyString(translatedHeading.type) !== "Heading"
		) {
			continue;
		}

		const translatedHeadingProps = getElementProps(translatedHeading);
		const translatedHeadingText = translatedHeadingProps
			? getNonEmptyString(translatedHeadingProps.text)
			: undefined;
		if (!translatedHeadingText || !TRANSLATED_HEADING_PATTERN.test(translatedHeadingText)) {
			continue;
		}

		normalizedElements[translatedHeadingKey] = {
			...translatedHeading,
			props: {
				...(translatedHeadingProps ?? {}),
				level: "h4",
				className: "text-sm font-semibold",
			},
		};

		const translatedValue = normalizedElements[translatedValueKey];
		if (!isObjectRecord(translatedValue)) {
			continue;
		}

		const translatedValueType = getNonEmptyString(translatedValue.type);
		const translatedValueProps = getElementProps(translatedValue);
		if (!translatedValueType || !translatedValueProps) {
			continue;
		}

		if (translatedValueType === "Heading") {
			normalizedElements[translatedValueKey] = {
				...translatedValue,
				props: {
					...translatedValueProps,
					level: "h4",
					className: "text-lg font-medium",
				},
			};
			continue;
		}

		if (translatedValueType === "Text") {
			const translatedBodyText = getNonEmptyString(translatedValueProps.content);
			if (translatedBodyText) {
				normalizedElements[translatedValueKey] = {
					...translatedValue,
					type: "Heading",
					props: {
						text: translatedBodyText,
						level: "h4",
						className: "text-lg font-medium",
					},
				};
				continue;
			}

			normalizedElements[translatedValueKey] = {
				...translatedValue,
				props: {
					...translatedValueProps,
					size: "base",
					muted: null,
				},
			};
		}
	}

	return normalizedElements;
}

function normalizeUsageNotesGap(
	elements: Record<string, unknown>
): Record<string, unknown> {
	const normalizedElements: Record<string, unknown> = { ...elements };

	for (const [key, element] of Object.entries(normalizedElements)) {
		if (!isObjectRecord(element) || getNonEmptyString(element.type) !== "Stack") {
			continue;
		}

		if (!Array.isArray(element.children)) {
			continue;
		}

		const childKeys = element.children.filter(
			(childKey): childKey is string =>
				typeof childKey === "string" && childKey.trim().length > 0
		);
		if (childKeys.length < 2) {
			continue;
		}

		const hasUsageNotesCard = childKeys.some((childKey) => {
			const childElement = normalizedElements[childKey];
			if (!isObjectRecord(childElement) || getNonEmptyString(childElement.type) !== "Card") {
				return false;
			}

			const childProps = getElementProps(childElement);
			const childTitle = childProps ? getNonEmptyString(childProps.title) : undefined;
			return Boolean(
				childTitle && USAGE_NOTES_CARD_TITLE_PATTERN.test(childTitle)
			);
		});
		if (!hasUsageNotesCard) {
			continue;
		}

		normalizedElements[key] = {
			...element,
			props: {
				...(getElementProps(element) ?? {}),
				gap: "md",
			},
		};
	}

	return normalizedElements;
}

function pruneUnreachableElements(
	rootKey: string,
	elements: Record<string, unknown>
): Record<string, unknown> {
	const reachableKeys = new Set<string>();
	const stack = [rootKey];

	while (stack.length > 0) {
		const currentKey = stack.pop();
		if (!currentKey || reachableKeys.has(currentKey)) {
			continue;
		}

		if (!Object.prototype.hasOwnProperty.call(elements, currentKey)) {
			continue;
		}

		reachableKeys.add(currentKey);
		const element = elements[currentKey];
		if (!isObjectRecord(element) || !Array.isArray(element.children)) {
			continue;
		}

		for (const childKey of element.children) {
			if (typeof childKey === "string" && childKey.trim().length > 0) {
				stack.push(childKey);
			}
		}
	}

	const pruned: Record<string, unknown> = {};
	for (const key of reachableKeys) {
		pruned[key] = elements[key];
	}

	return pruned;
}

function collectActionButtonKeysFromSpec(spec: Spec): Set<string> {
	const buttonKeys = new Set<string>();

	for (const [key, element] of Object.entries(spec.elements ?? {})) {
		if (!isObjectRecord(element)) {
			continue;
		}

		if (getNonEmptyString(element.type) !== "Button") {
			continue;
		}

		buttonKeys.add(key);
	}

	return buttonKeys;
}

export function createBodyOnlySpec(widget: ParsedGenuiPreviewWidget): Spec {
	const titleSource = findTitleSourceInSpec(widget);
	const descSource = findDescriptionSourceInSpec(widget);
	const actionButtonKeys = collectActionButtonKeysFromSpec(widget.spec);

	if (!titleSource && !descSource && actionButtonKeys.size === 0) {
		return widget.spec;
	}

	const propsToStrip = new Map<string, Set<string>>();
	for (const source of [titleSource, descSource]) {
		if (!source) continue;
		if (!propsToStrip.has(source.key)) {
			propsToStrip.set(source.key, new Set());
		}
		propsToStrip.get(source.key)!.add(source.propName);
	}

	const newElements: Record<string, unknown> = {};
	const keysToRemove = new Set<string>();

	for (const [key, element] of Object.entries(widget.spec.elements)) {
		if (actionButtonKeys.has(key)) {
			keysToRemove.add(key);
			continue;
		}

		if (!propsToStrip.has(key)) {
			newElements[key] = element;
			continue;
		}

		if (!isObjectRecord(element)) {
			newElements[key] = element;
			continue;
		}

		const props = getElementProps(element);
		if (!props) {
			newElements[key] = element;
			continue;
		}

		const stripSet = propsToStrip.get(key)!;
		const newProps: Record<string, unknown> = {};
		for (const [propKey, propVal] of Object.entries(props)) {
			if (!stripSet.has(propKey)) {
				newProps[propKey] = propVal;
			}
		}

		const elementType = getNonEmptyString(element.type);
		const hasChildren = Array.isArray(element.children) && element.children.length > 0;

		if (!hasChildren && elementType && REMOVABLE_HEADER_TYPES.has(elementType)) {
			keysToRemove.add(key);
		} else {
			newElements[key] = { ...element, props: newProps };
		}
	}

	if (keysToRemove.has(widget.spec.root)) {
		return widget.spec;
	}

	let changed = true;
	while (changed) {
		changed = false;

		for (const [key, element] of Object.entries(newElements)) {
			if (key === widget.spec.root || keysToRemove.has(key)) {
				continue;
			}
			if (!isObjectRecord(element) || !Array.isArray(element.children)) {
				continue;
			}

			const elementType = getNonEmptyString(element.type);
			if (!elementType || !COLLAPSIBLE_EMPTY_CONTAINER_TYPES.has(elementType)) {
				continue;
			}

			const originalChildren = element.children.filter(
				(childKey): childKey is string =>
					typeof childKey === "string" && childKey.trim().length > 0
			);
			if (originalChildren.length === 0) {
				continue;
			}

			const liveChildren = getLiveChildKeys(
				element.children,
				newElements,
				keysToRemove
			);
			if (liveChildren.length > 0) {
				continue;
			}

			keysToRemove.add(key);
			changed = true;
		}
	}

	if (keysToRemove.has(widget.spec.root)) {
		return widget.spec;
	}

	const elementsAfterRemoval: Record<string, unknown> = {};
	for (const [key, element] of Object.entries(newElements)) {
		if (!keysToRemove.has(key)) {
			elementsAfterRemoval[key] = element;
		}
	}

	if (!Object.prototype.hasOwnProperty.call(elementsAfterRemoval, widget.spec.root)) {
		return widget.spec;
	}

	const normalizedElements: Record<string, unknown> = {};
	for (const [key, element] of Object.entries(elementsAfterRemoval)) {
		if (!isObjectRecord(element) || !Array.isArray(element.children)) {
			normalizedElements[key] = element;
			continue;
		}

		const liveChildren = getLiveChildKeys(
			element.children,
			elementsAfterRemoval,
			new Set<string>()
		);
		const normalizedChildren = normalizeChildKeySequence(
			liveChildren,
			elementsAfterRemoval
		);

		if (arraysMatch(liveChildren, normalizedChildren)) {
			normalizedElements[key] = { ...element, children: liveChildren };
			continue;
		}

		normalizedElements[key] = { ...element, children: normalizedChildren };
	}

	const prunedElements = pruneUnreachableElements(
		widget.spec.root,
		normalizedElements
	);

	if (!Object.prototype.hasOwnProperty.call(prunedElements, widget.spec.root)) {
		return widget.spec;
	}

	return {
		...widget.spec,
		elements: normalizeUsageNotesGap(
			normalizeTranslationTypography(prunedElements)
		),
	} as Spec;
}
