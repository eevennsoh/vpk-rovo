/**
 * Maps a React-catalog json-render spec to a target renderer format.
 *
 * The React catalog has 130+ component types. Target renderers (PDF, Image, Email)
 * have 9–16 components each. This module bridges the gap by transforming element
 * types and props, resolving state expressions, and wrapping in format-specific
 * document envelopes.
 */

import type { Spec } from "@json-render/core";

export type ExportFormat = "pdf" | "image" | "email";

// ── State resolution ─────────────────────────────────────────────

function resolveValue(value: unknown, state: Record<string, unknown>): unknown {
	if (value == null || typeof value !== "object") return value;
	if (Array.isArray(value)) return value.map((v) => resolveValue(v, state));

	const obj = value as Record<string, unknown>;

	if (typeof obj.$state === "string") {
		return getByPath(state, obj.$state as string);
	}
	if (typeof obj.$bindState === "string") {
		return getByPath(state, obj.$bindState as string);
	}
	if ("$cond" in obj) {
		return undefined; // Conditions resolve to visibility, not a value
	}

	const resolved: Record<string, unknown> = {};
	for (const key of Object.keys(obj)) {
		resolved[key] = resolveValue(obj[key], state);
	}
	return resolved;
}

function getByPath(obj: unknown, path: string): unknown {
	const segments = path.replace(/^\//, "").split("/");
	let current: unknown = obj;
	for (const seg of segments) {
		if (current == null || typeof current !== "object") return undefined;
		current = (current as Record<string, unknown>)[seg];
	}
	return current;
}

function resolveProps(
	props: Record<string, unknown>,
	state: Record<string, unknown>,
): Record<string, unknown> {
	const resolved: Record<string, unknown> = {};
	for (const [key, val] of Object.entries(props)) {
		resolved[key] = resolveValue(val, state);
	}
	return resolved;
}

// ── Helpers ──────────────────────────────────────────────────────

let keyCounter = 0;

function uid(prefix = "m"): string {
	return `${prefix}_${++keyCounter}`;
}

function str(value: unknown): string {
	if (value == null) return "";
	if (typeof value === "string") return value;
	if (typeof value === "number" || typeof value === "boolean") return String(value);
	return JSON.stringify(value);
}

// ── Types ────────────────────────────────────────────────────────

interface MappedElement {
	type: string;
	props: Record<string, unknown>;
	children?: string[];
}

interface MapContext {
	format: ExportFormat;
	state: Record<string, unknown>;
	elements: Record<string, MappedElement>;
}

// ── Per-format component mapping ─────────────────────────────────

type Mapper = (
	props: Record<string, unknown>,
	children: string[] | undefined,
	ctx: MapContext,
) => MappedElement | null;

const CHART_TYPES = new Set([
	"BarChart", "LineChart", "PieChart", "AreaChart", "RadarChart",
]);

const THREE_D_TYPES = new Set([
	"Scene3D", "Group3D", "Box", "Sphere", "Cylinder", "Cone",
	"Torus", "Plane", "Ring", "AmbientLight", "PointLight",
	"DirectionalLight", "Stars", "Label3D",
]);

const INPUT_TYPES = new Set([
	"TextInput", "TextArea", "SelectInput", "RadioGroup", "Checkbox",
	"Switch", "Slider", "Toggle", "ToggleGroup", "DatePicker",
	"TimePicker", "DateTimePicker", "InlineEdit", "InputOTP", "Calendar",
]);

// ── PDF mappers ──────────────────────────────────────────────────

const pdfMappers: Record<string, Mapper> = {
	Stack: (p, ch) => ({
		type: "View",
		props: {
			style: {
				flexDirection: p.direction === "horizontal" ? "row" : "column",
				gap: p.gap === "lg" ? 16 : p.gap === "md" ? 10 : 6,
				alignItems: p.align === "center" ? "center" : p.align === "end" ? "flex-end" : "flex-start",
				...(p.wrap ? { flexWrap: "wrap" } : {}),
			},
		},
		children: ch,
	}),
	Card: (_, ch) => ({
		type: "View",
		props: {
			style: { border: "1pt solid #E0E0E0", borderRadius: 6, padding: 12, marginBottom: 8 },
		},
		children: ch,
	}),
	Grid: (_, ch) => ({
		type: "View",
		props: { style: { flexDirection: "row", flexWrap: "wrap", gap: 10 } },
		children: ch,
	}),
	Heading: (p) => ({
		type: "Heading",
		props: { text: str(p.text), level: p.level ?? "h2" },
	}),
	Text: (p) => ({
		type: "Text",
		props: { text: str(p.content), style: p.muted ? { color: "#666666" } : {} },
	}),
	Badge: (p) => ({
		type: "Text",
		props: { text: `[${str(p.text)}]`, style: { color: "#0052CC", fontSize: 10 } },
	}),
	Lozenge: (p) => ({
		type: "Text",
		props: { text: str(p.text), style: { fontSize: 10, fontWeight: "bold" } },
	}),
	Tag: (p) => ({
		type: "Text",
		props: { text: str(p.text), style: { fontSize: 10 } },
	}),
	Code: (p) => ({
		type: "Text",
		props: { text: str(p.text), style: { fontFamily: "Courier", fontSize: 10 } },
	}),
	CodeBlock: (p) => ({
		type: "Text",
		props: { text: str(p.code), style: { fontFamily: "Courier", fontSize: 9, backgroundColor: "#F4F5F7", padding: 8 } },
	}),
	Kbd: (p) => ({
		type: "Text",
		props: { text: `[${str(p.text)}]`, style: { fontFamily: "Courier", fontSize: 10 } },
	}),
	Alert: (_) => ({
		type: "View",
		props: { style: { backgroundColor: "#DEEBFF", padding: 10, borderRadius: 4, marginBottom: 8 } },
		children: [uid("alert_t"), uid("alert_d")],
	}),
	SectionMessage: (_) => ({
		type: "View",
		props: { style: { backgroundColor: "#DEEBFF", padding: 10, borderRadius: 4, marginBottom: 8 } },
		children: [uid("sm_t")],
	}),
	Banner: (_) => ({
		type: "View",
		props: { style: { backgroundColor: "#FFF0B3", padding: 8, marginBottom: 8 } },
		children: [uid("banner_t")],
	}),
	Separator: () => ({
		type: "Divider",
		props: {},
	}),
	Metric: (_) => ({
		type: "View",
		props: { style: { marginBottom: 8 } },
		children: [uid("metric")],
	}),
	Table: (p) => ({
		type: "Table",
		props: {
			columns: (p.columns as Array<{ key: string; label: string }>)?.map((c) => ({
				key: c.key,
				header: c.label,
			})) ?? [],
			data: Array.isArray(p.data) ? p.data : [],
		},
	}),
	Image: (p) => ({
		type: "Image",
		props: { src: str(p.src), style: { width: p.width ?? 200, height: p.height ?? 100 } },
	}),
	Link: (p) => ({
		type: "Link",
		props: { href: str(p.href), text: str(p.text) },
	}),
	Accordion: (p) => ({
		type: "View",
		props: { style: { marginBottom: 8 } },
		children: ((p.items as Array<{ title: string; content: string }>) ?? []).map(() => uid("acc")),
	}),
	Tabs: (_, ch) => ({
		type: "View",
		props: {},
		children: ch,
	}),
	TabContent: (_, ch) => ({
		type: "View",
		props: {},
		children: ch,
	}),
	Timeline: (p) => ({
		type: "View",
		props: { style: { marginBottom: 8 } },
		children: ((p.items as Array<{ title: string }>) ?? []).map(() => uid("tl")),
	}),
	Button: (p) => ({
		type: "Text",
		props: { text: `[${str(p.label)}]`, style: { color: "#0052CC" } },
	}),
	Progress: (p) => ({
		type: "Text",
		props: { text: `${str(p.label ?? "Progress")}: ${p.value ?? 0}%` },
	}),
	ProgressBar: (p) => ({
		type: "Text",
		props: { text: `${str(p.label ?? "Progress")}: ${p.value ?? 0}%` },
	}),
	Callout: (_) => ({
		type: "View",
		props: { style: { backgroundColor: "#EAE6FF", padding: 10, borderRadius: 4, marginBottom: 8 } },
		children: [uid("callout")],
	}),
	EmptyState: (_) => ({
		type: "View",
		props: { style: { textAlign: "center", padding: 20 } },
		children: [uid("empty")],
	}),
	Comment: (_) => ({
		type: "View",
		props: { style: { marginBottom: 8 } },
		children: [uid("comment")],
	}),
	PageHeader: (_) => ({
		type: "View",
		props: { style: { marginBottom: 12 } },
		children: [uid("ph")],
	}),
	Breadcrumb: (p) => ({
		type: "Text",
		props: {
			text: ((p.items as Array<{ label: string }>) ?? []).map((i) => i.label).join(" > "),
			style: { fontSize: 10, color: "#666666" },
		},
	}),
	Pagination: (p) => ({
		type: "Text",
		props: { text: `Page ${p.currentPage ?? 1} of ${p.totalPages ?? 1}`, style: { fontSize: 10 } },
	}),
	Avatar: (p) => ({
		type: "Text",
		props: { text: `[${str(p.fallback)}]`, style: { fontSize: 10 } },
	}),
	Spinner: () => ({
		type: "Text",
		props: { text: "Loading...", style: { color: "#666666" } },
	}),
	Skeleton: () => null,
	Dialog: (_, ch) => ({
		type: "View",
		props: {},
		children: ch,
	}),
	Tooltip: (_, ch) => ({
		type: "View",
		props: {},
		children: ch,
	}),
	Collapsible: (_, ch) => ({
		type: "View",
		props: {},
		children: ch,
	}),
	ButtonGroup: (_, ch) => ({
		type: "View",
		props: { style: { flexDirection: "row", gap: 6 } },
		children: ch,
	}),
	TagGroup: (_, ch) => ({
		type: "View",
		props: { style: { flexDirection: "row", gap: 4, flexWrap: "wrap" } },
		children: ch,
	}),
	ScrollArea: (_, ch) => ({
		type: "View",
		props: {},
		children: ch,
	}),
	AspectRatio: (_, ch) => ({
		type: "View",
		props: {},
		children: ch,
	}),
	Carousel: (_, ch) => ({
		type: "View",
		props: {},
		children: ch,
	}),
	ObjectTile: (_) => ({
		type: "View",
		props: { style: { padding: 8, border: "1pt solid #E0E0E0", borderRadius: 4, marginBottom: 4 } },
		children: [uid("tile")],
	}),
	IconTile: (p) => ({
		type: "Text",
		props: { text: str(p.label), style: { fontSize: 10 } },
	}),
	CalendarTimeline: (p) => ({
		type: "View",
		props: { style: { marginBottom: 8 } },
		children: ((p.events as Array<{ title: string }>) ?? []).map(() => uid("ct")),
	}),
	MapWidget: (p) => ({
		type: "Text",
		props: {
			text: `[Map: ${((p.markers as Array<{ title: string }>) ?? []).map((m) => m.title).join(", ") || "No markers"}]`,
			style: { color: "#666666", fontStyle: "italic" },
		},
	}),
	AccordionForm: (_, ch) => ({
		type: "View",
		props: {},
		children: ch,
	}),
	ProgressTracker: (p) => ({
		type: "View",
		props: { style: { marginBottom: 8 } },
		children: ((p.steps as Array<{ label: string }>) ?? []).map(() => uid("pt")),
	}),
	FigmaDesignContext: (_) => ({
		type: "View",
		props: { style: { padding: 10, border: "1pt solid #E0E0E0", borderRadius: 4 } },
		children: [uid("figma")],
	}),
	WorkSummary: (_) => ({
		type: "View",
		props: { style: { marginBottom: 8 } },
		children: [uid("ws")],
	}),
};

// ── Image mappers ────────────────────────────────────────────────

const imageMappers: Record<string, Mapper> = {
	Stack: (p, ch) => ({
		type: p.direction === "horizontal" ? "Row" : "Column",
		props: {
			gap: p.gap === "lg" ? 16 : p.gap === "md" ? 10 : 6,
			alignItems: p.align === "center" ? "center" : p.align === "end" ? "flex-end" : "flex-start",
		},
		children: ch,
	}),
	Card: (_, ch) => ({
		type: "Box",
		props: {
			style: { border: "1px solid #E0E0E0", borderRadius: 6, padding: 12 },
		},
		children: ch,
	}),
	Grid: (_, ch) => ({
		type: "Row",
		props: { gap: 10, flexWrap: "wrap" },
		children: ch,
	}),
	Heading: (p) => ({
		type: "Heading",
		props: { text: str(p.text), level: p.level ?? "h2" },
	}),
	Text: (p) => ({
		type: "Text",
		props: { text: str(p.content), color: p.muted ? "#666666" : undefined },
	}),
	Image: (p) => ({
		type: "Image",
		props: { src: str(p.src), width: p.width ?? 200, height: p.height ?? 100 },
	}),
	Separator: () => ({
		type: "Divider",
		props: {},
	}),
	Badge: (p) => ({
		type: "Text",
		props: { text: str(p.text), fontSize: 12, color: "#0052CC" },
	}),
	Metric: (_) => ({
		type: "Column",
		props: { gap: 2 },
		children: [uid("metric_l"), uid("metric_v")],
	}),
};

// ── Email mappers ────────────────────────────────────────────────

const emailMappers: Record<string, Mapper> = {
	Stack: (p, ch) => ({
		type: p.direction === "horizontal" ? "Row" : "Section",
		props: {},
		children: ch,
	}),
	Card: (_, ch) => ({
		type: "Container",
		props: { style: { border: "1px solid #E0E0E0", borderRadius: "6px", padding: "12px" } },
		children: ch,
	}),
	Grid: (_, ch) => ({
		type: "Row",
		props: {},
		children: ch,
	}),
	Heading: (p) => ({
		type: "Heading",
		props: { text: str(p.text), as: p.level ?? "h2" },
	}),
	Text: (p) => ({
		type: "Text",
		props: { text: str(p.content), style: p.muted ? { color: "#666666" } : {} },
	}),
	Button: (p) => ({
		type: "Button",
		props: { text: str(p.label), href: "#", style: { backgroundColor: "#0052CC", color: "#ffffff", borderRadius: "4px", padding: "10px 20px" } },
	}),
	Separator: () => ({
		type: "Hr",
		props: {},
	}),
	Image: (p) => ({
		type: "Image",
		props: { src: str(p.src), alt: str(p.alt), width: str(p.width ?? 200) },
	}),
	Link: (p) => ({
		type: "Link",
		props: { href: str(p.href), text: str(p.text) },
	}),
	Badge: (p) => ({
		type: "Text",
		props: { text: str(p.text), style: { fontSize: "12px", color: "#0052CC", fontWeight: "bold" } },
	}),
	Metric: (_) => ({
		type: "Section",
		props: {},
		children: [uid("metric")],
	}),
	Alert: (_) => ({
		type: "Section",
		props: { style: { backgroundColor: "#DEEBFF", padding: "10px", borderRadius: "4px" } },
		children: [uid("alert")],
	}),
	Table: (_) => ({
		type: "Section",
		props: {},
		children: [uid("table_text")],
	}),
};

// ── Mapper selection ─────────────────────────────────────────────

function getMappers(format: ExportFormat): Record<string, Mapper> {
	switch (format) {
		case "pdf":
			return pdfMappers;
		case "image":
			return imageMappers;
		case "email":
			return emailMappers;
	}
}

// ── Generic fallbacks ────────────────────────────────────────────

function chartPlaceholder(type: string, props: Record<string, unknown>, format: ExportFormat): MappedElement {
	const title = str(props.title ?? type);
	const textType = format === "email" ? "Text" : "Text";
	return {
		type: textType,
		props: {
			text: `[${title}]`,
			style: { color: "#666666", fontStyle: "italic" },
		},
	};
}

function inputAsStatic(type: string, props: Record<string, unknown>, format: ExportFormat): MappedElement {
	const label = str(props.label ?? type);
	const value = str(props.value ?? props.checked ?? "");
	const text = value ? `${label}: ${value}` : label;
	const textType = "Text";
	return {
		type: textType,
		props: { text, style: { fontSize: format === "pdf" ? 10 : undefined } },
	};
}

// ── Main mapper ──────────────────────────────────────────────────

function mapElement(
	key: string,
	element: {
		type: string;
		props?: Record<string, unknown>;
		children?: string[];
	},
	ctx: MapContext,
): void {
	const { type, children } = element;
	const props = resolveProps(element.props ?? {}, ctx.state);

	// 3D → drop entirely
	if (THREE_D_TYPES.has(type)) return;

	// Charts → placeholder text
	if (CHART_TYPES.has(type)) {
		ctx.elements[key] = chartPlaceholder(type, props, ctx.format);
		return;
	}

	// Inputs → static text representation
	if (INPUT_TYPES.has(type)) {
		ctx.elements[key] = inputAsStatic(type, props, ctx.format);
		return;
	}

	const mappers = getMappers(ctx.format);
	const mapper = mappers[type];

	if (mapper) {
		const result = mapper(props, children, ctx);
		if (result) {
			ctx.elements[key] = result;
		}
		return;
	}

	// Default: pass-through as Text with type label
	ctx.elements[key] = {
		type: "Text",
		props: { text: `[${type}]`, style: { color: "#999999" } },
	};
}

// ── Document envelopes ───────────────────────────────────────────

function wrapForPdf(contentKey: string, elements: Record<string, MappedElement>): {
	root: string;
	elements: Record<string, unknown>;
} {
	const pageKey = uid("page");
	const docKey = uid("doc");

	elements[pageKey] = {
		type: "Page",
		props: { size: "A4", style: { padding: 40, fontFamily: "Helvetica", fontSize: 12 } },
		children: [contentKey],
	};
	elements[docKey] = {
		type: "Document",
		props: {},
		children: [pageKey],
	};

	return { root: docKey, elements: elements as Record<string, unknown> };
}

function wrapForImage(
	contentKey: string,
	elements: Record<string, MappedElement>,
	width = 1200,
	height = 630,
): {
	root: string;
	elements: Record<string, unknown>;
} {
	const frameKey = uid("frame");

	elements[frameKey] = {
		type: "Frame",
		props: {
			width,
			height,
			style: { padding: 40, backgroundColor: "#ffffff", fontFamily: "Inter" },
		},
		children: [contentKey],
	};

	return { root: frameKey, elements: elements as Record<string, unknown> };
}

function wrapForEmail(contentKey: string, elements: Record<string, MappedElement>): {
	root: string;
	elements: Record<string, unknown>;
} {
	const containerKey = uid("container");
	const bodyKey = uid("body");
	const headKey = uid("head");
	const htmlKey = uid("html");

	elements[containerKey] = {
		type: "Container",
		props: { style: { maxWidth: "600px", margin: "0 auto" } },
		children: [contentKey],
	};
	elements[bodyKey] = {
		type: "Body",
		props: {},
		children: [containerKey],
	};
	elements[headKey] = {
		type: "Head",
		props: {},
	};
	elements[htmlKey] = {
		type: "Html",
		props: {},
		children: [headKey, bodyKey],
	};

	return { root: htmlKey, elements: elements as Record<string, unknown> };
}

// ── Public API ───────────────────────────────────────────────────

export interface MapSpecOptions {
	state?: Record<string, unknown>;
	imageWidth?: number;
	imageHeight?: number;
}

export function mapSpecToFormat(
	spec: Spec,
	format: ExportFormat,
	options: MapSpecOptions = {},
): Spec {
	keyCounter = 0;
	const state = options.state ?? spec.state ?? {};

	const ctx: MapContext = {
		format,
		state: state as Record<string, unknown>,
		elements: {},
	};

	// Map all source elements
	for (const [key, element] of Object.entries(spec.elements)) {
		mapElement(key, element as {
			type: string;
			props?: Record<string, unknown>;
			children?: string[];
		}, ctx);
	}

	// Remove children references to dropped elements
	for (const el of Object.values(ctx.elements)) {
		if (el.children) {
			el.children = el.children.filter((childKey) => childKey in ctx.elements);
		}
	}

	// Find the mapped root
	const rootKey = spec.root;
	if (!(rootKey in ctx.elements)) {
		// Root was dropped (e.g. 3D scene). Create a wrapper.
		const wrapKey = uid("wrap");
		const visibleKeys = Object.keys(ctx.elements).filter(
			(k) => !Object.values(ctx.elements).some((e) => e.children?.includes(k)),
		);
		ctx.elements[wrapKey] = {
			type: format === "image" ? "Column" : format === "email" ? "Section" : "View",
			props: {},
			children: visibleKeys,
		};

		switch (format) {
			case "pdf":
				return wrapForPdf(wrapKey, ctx.elements) as unknown as Spec;
			case "image":
				return wrapForImage(wrapKey, ctx.elements, options.imageWidth, options.imageHeight) as unknown as Spec;
			case "email":
				return wrapForEmail(wrapKey, ctx.elements) as unknown as Spec;
		}
	}

	switch (format) {
		case "pdf":
			return wrapForPdf(rootKey, ctx.elements) as unknown as Spec;
		case "image":
			return wrapForImage(rootKey, ctx.elements, options.imageWidth, options.imageHeight) as unknown as Spec;
		case "email":
			return wrapForEmail(rootKey, ctx.elements) as unknown as Spec;
	}
}
