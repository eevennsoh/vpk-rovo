"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { usePathname } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { token } from "@/lib/tokens";
import { AnimatedDots } from "@/components/ui-ai/animated-dots";
import { MessageResponse } from "@/components/ui-ai/message";
import { useTheme } from "@/components/utils/theme-wrapper";
import Image from "next/image";
import type { AgentRun } from "@/lib/make-run-types";
import { DEFAULT_DESIGN_CONFIG, type DesignConfig } from "@/lib/design-config-bridge";
import { DesignConfigInjector } from "@/components/utils/design-config-injector";
import type { ParsedPlanWidgetPayload } from "@/components/projects/shared/lib/plan-widget";
import {
	derivePlanEmojiFromTitle,
	resolvePlanDisplayTitle,
} from "@/components/projects/shared/lib/plan-identity";
import EyeOpenIcon from "@atlaskit/icon/core/eye-open";
import ClipboardIcon from "@atlaskit/icon/core/clipboard";
import AiGenerativeTextSummaryIcon from "@atlaskit/icon/core/ai-generative-text-summary";
import PaintPaletteIcon from "@atlaskit/icon/core/paint-palette";
import AiChatIcon from "@atlaskit/icon/core/ai-chat";
import FolderClosedIcon from "@atlaskit/icon/core/folder-closed";
import LinkExternalIcon from "@atlaskit/icon/core/link-external";
import RefreshIcon from "@atlaskit/icon/core/refresh";
import UndoIcon from "@atlaskit/icon/core/undo";
import TerminalSwitchPanel from "@/components/blocks/terminal-switch/page";
import {
	FileTree,
	FileTreeFile,
	FileTreeFolder,
} from "@/components/ui-ai/file-tree";
import { GUI } from "@/components/utils/gui";
import { JsonRenderView } from "@/lib/json-render/renderer";
import { MakePreviewReactGrabMount } from "@/components/utils/make-preview-react-grab-mount";
import type { Spec } from "@json-render/react";

type ArtifactRightPanelMode = "design" | "chat" | "files";
type ArtifactLeftPanelMode = "preview" | "plan" | "summary";

type VisibilityControl = {
	kind: "visibility";
	parentKey: string;
	childKey: string;
	groupLabel: string;
	label: string;
	visible: boolean;
};

type TextEditControl = {
	kind: "text-edit";
	elementKey: string;
	propName: string;
	label: string;
	value: string;
};

type TabsLabelControl = {
	kind: "tabs-label";
	elementKey: string;
	tabIndex: number;
	label: string;
	value: string;
};

type SelectPropControl = {
	kind: "select-prop";
	category: "layout" | "appearance" | "chart";
	elementKey: string;
	propName: string;
	label: string;
	value: string;
	options: Array<{ value: string; label: string }>;
};

type NumberPropControl = {
	kind: "number-prop";
	category: "chart";
	elementKey: string;
	propName: string;
	label: string;
	value: number;
	min: number;
	max: number;
	step: number;
};

type ComponentSwapControl = {
	kind: "component-swap";
	category: "layout" | "chart";
	elementKey: string;
	label: string;
	value: string;
	options: Array<{ value: string; label: string }>;
};

type AutoControl =
	| VisibilityControl
	| TextEditControl
	| TabsLabelControl
	| SelectPropControl
	| NumberPropControl
	| ComponentSwapControl;

type SpecOverrides = {
	elements: Record<
		string,
		{
			type?: string;
			props?: Record<string, unknown>;
			children?: string[];
		}
	>;
};

interface DisplayPlanTask {
	id: string;
	label: string;
	agentName: string | null;
	blockedBy: string[];
}

interface DisplayPlan {
	source: "run" | "chat-draft";
	resolvedTitle: string;
	resolvedEmoji: string;
	description?: string;
	agents: string[];
	tasks: DisplayPlanTask[];
}

interface MakeArtifactSurfaceProps {
	run: AgentRun | null;
	fallbackPlan?: ParsedPlanWidgetPayload | null;
	isRunLoading?: boolean;
	className?: string;
}

interface RenderableOutput {
	title: string;
	spec: Spec;
}

type RunFileLeafNode = {
	kind: "file";
	path: string;
	name: string;
};

type RunFileFolderNode = {
	kind: "folder";
	path: string;
	name: string;
	children: RunFileTreeNode[];
};

type RunFileTreeNode = RunFileLeafNode | RunFileFolderNode;

type RunFileTreeModel = {
	roots: RunFileTreeNode[];
	defaultExpanded: Set<string>;
	filePaths: string[];
	firstFilePath: string | null;
};

const MAKE_PREVIEW_REACT_GRAB_ENABLED = false;

function isMakeArtifactTemplateRoute(pathname: string | null): boolean {
	if (!pathname) {
		return false;
	}

	return (
		pathname === "/make"
		|| pathname.startsWith("/make/")
		|| pathname === "/preview/projects/make"
		|| pathname.startsWith("/preview/projects/make/")
	);
}

function hasRenderableSpec(spec: unknown): spec is Spec {
	if (!spec || typeof spec !== "object" || Array.isArray(spec)) {
		return false;
	}

	const root = (spec as { root?: unknown }).root;
	const elements = (spec as { elements?: unknown }).elements;
	return (
		typeof root === "string" &&
		root.trim().length > 0 &&
		typeof elements === "object" &&
		elements !== null &&
		!Array.isArray(elements) &&
		Object.keys(elements).length > 0
	);
}

function normalizeSummaryMarkdown(value: string): string {
	const trimmed = value.trim();
	if (!trimmed) {
		return "";
	}

	const preMatch = trimmed.match(/^<pre(?:\s[^>]*)?>([\s\S]*?)<\/pre>$/i);
	const preUnwrapped = (preMatch?.[1] ?? trimmed).trim();
	const codeMatch = preUnwrapped.match(/^<code(?:\s[^>]*)?>([\s\S]*?)<\/code>$/i);

	return (codeMatch?.[1] ?? preUnwrapped).trim();
}

function isObjectRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function decodePointerSegment(segment: string): string {
	return segment.replaceAll("~1", "/").replaceAll("~0", "~");
}

function toPointerSegments(path: string): string[] {
	if (typeof path !== "string" || !path.startsWith("/")) {
		return [];
	}

	return path
		.slice(1)
		.split("/")
		.filter((segment) => segment.length > 0)
		.map((segment) => decodePointerSegment(segment));
}

function immutableSetBySegments(value: unknown, segments: string[], nextValue: unknown): unknown {
	if (segments.length === 0) {
		return nextValue;
	}

	const [currentSegment, ...remainingSegments] = segments;
	const isArrayIndex =
		currentSegment.length > 0 && /^[0-9]+$/.test(currentSegment);

	if (Array.isArray(value) && isArrayIndex) {
		const index = Number.parseInt(currentSegment, 10);
		const nextArray = [...value];
		const currentChild = value[index];
		nextArray[index] =
			remainingSegments.length === 0
				? nextValue
				: immutableSetBySegments(currentChild, remainingSegments, nextValue);
		return nextArray;
	}

	const baseObject = isObjectRecord(value) ? value : {};
	const currentChild = baseObject[currentSegment];
	return {
		...baseObject,
		[currentSegment]:
			remainingSegments.length === 0
				? nextValue
				: immutableSetBySegments(currentChild, remainingSegments, nextValue),
	};
}

function applyStateChanges(
	previousState: Record<string, unknown>,
	changes: Array<{ path: string; value: unknown }>,
): Record<string, unknown> {
	let nextState: unknown = previousState;
	for (const change of changes) {
		const segments = toPointerSegments(change.path);
		if (segments.length === 0) {
			continue;
		}
		nextState = immutableSetBySegments(nextState, segments, change.value);
	}

	return isObjectRecord(nextState) ? nextState : previousState;
}

function normalizeStateModel(value: unknown): Record<string, unknown> {
	return isObjectRecord(value) ? { ...value } : {};
}

function getSpecOverrideElements(overrides: SpecOverrides | null | undefined): SpecOverrides["elements"] {
	if (!overrides || !isObjectRecord(overrides.elements)) {
		return {};
	}
	return overrides.elements;
}

function toSentenceCase(rawValue: string): string {
	const normalized = rawValue
		.replace(/([a-z0-9])([A-Z])/g, "$1 $2")
		.replace(/[-_]+/g, " ")
		.replace(/\s+/g, " ")
		.trim();
	if (!normalized) {
		return "Field";
	}
	return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

const GAP_OPTIONS = [
	{ value: "sm", label: "Small" },
	{ value: "md", label: "Medium" },
	{ value: "lg", label: "Large" },
] as const;

const GRID_COLUMN_OPTIONS = [
	{ value: "1", label: "1 column" },
	{ value: "2", label: "2 columns" },
	{ value: "3", label: "3 columns" },
	{ value: "4", label: "4 columns" },
] as const;

const STACK_DIRECTION_OPTIONS = [
	{ value: "vertical", label: "Vertical" },
	{ value: "horizontal", label: "Horizontal" },
] as const;

const CHART_TYPE_OPTIONS = [
	{ value: "BarChart", label: "Bar chart" },
	{ value: "LineChart", label: "Line chart" },
	{ value: "AreaChart", label: "Area chart" },
	{ value: "PieChart", label: "Pie chart" },
] as const;

const CHART_COLOR_OPTIONS = [
	{ value: "var(--color-chart-1)", label: "Chart 1" },
	{ value: "var(--color-chart-2)", label: "Chart 2" },
	{ value: "var(--color-chart-3)", label: "Chart 3" },
	{ value: "var(--color-chart-4)", label: "Chart 4" },
	{ value: "var(--color-chart-5)", label: "Chart 5" },
] as const;

const CHART_COMPONENT_TYPES = new Set(["BarChart", "LineChart", "AreaChart", "PieChart"]);
const KEY_NESTED_PARENT_TYPES = new Set(["Stack", "Grid", "Tabs", "TabContent"]);
const MAX_CONTROLS_PER_SECTION = 24;
const DESIGN_PANEL_VISIBILITY_GROUP_LIMIT = 1;
const DESIGN_PANEL_VISIBILITY_ITEMS_PER_GROUP = 3;
const DESIGN_PANEL_CONTENT_LIMIT = 1;
const DESIGN_PANEL_LAYOUT_LIMIT = 1;
const DESIGN_PANEL_CHART_LIMIT = 2;
const DESIGN_PANEL_APPEARANCE_LIMIT = 1;

const COPY_EDITABLE_PROPS: Record<string, string[]> = {
	Text: ["content"],
	Heading: ["text"],
	PageHeader: ["title", "description"],
	Card: ["title", "description"],
	Alert: ["title", "description"],
	SectionMessage: ["title", "description"],
	Button: ["label"],
	Link: ["text"],
	Badge: ["text"],
	Lozenge: ["text"],
	BarChart: ["title"],
	LineChart: ["title"],
	AreaChart: ["title"],
	PieChart: ["title"],
};

const APPEARANCE_PROP_OPTIONS: Record<string, Record<string, Array<{ value: string; label: string }>>> = {
	Lozenge: {
		variant: [
			{ value: "neutral", label: "Neutral" },
			{ value: "success", label: "Success" },
			{ value: "danger", label: "Danger" },
			{ value: "information", label: "Information" },
			{ value: "warning", label: "Warning" },
			{ value: "discovery", label: "Discovery" },
			{ value: "accent-blue", label: "Accent Blue" },
			{ value: "accent-purple", label: "Accent Purple" },
		],
	},
	Badge: {
		variant: [
			{ value: "default", label: "Default" },
			{ value: "neutral", label: "Neutral" },
			{ value: "secondary", label: "Secondary" },
			{ value: "destructive", label: "Destructive" },
			{ value: "success", label: "Success" },
			{ value: "warning", label: "Warning" },
			{ value: "info", label: "Info" },
			{ value: "outline", label: "Outline" },
		],
	},
	Alert: {
		variant: [
			{ value: "default", label: "Default" },
			{ value: "info", label: "Info" },
			{ value: "warning", label: "Warning" },
			{ value: "success", label: "Success" },
			{ value: "danger", label: "Danger" },
			{ value: "discovery", label: "Discovery" },
		],
	},
	Button: {
		variant: [
			{ value: "default", label: "Default" },
			{ value: "destructive", label: "Destructive" },
			{ value: "outline", label: "Outline" },
			{ value: "secondary", label: "Secondary" },
			{ value: "ghost", label: "Ghost" },
			{ value: "link", label: "Link" },
		],
	},
	SectionMessage: {
		appearance: [
			{ value: "default", label: "Default" },
			{ value: "info", label: "Info" },
			{ value: "warning", label: "Warning" },
			{ value: "success", label: "Success" },
			{ value: "danger", label: "Danger" },
			{ value: "announcement", label: "Announcement" },
		],
	},
};

function isDynamicPropValue(value: unknown): boolean {
	if (!isObjectRecord(value)) {
		return false;
	}
	return "$bindState" in value || "$state" in value || "$bindItem" in value || "$item" in value;
}

function areValuesEqual(left: unknown, right: unknown): boolean {
	if (left === right) {
		return true;
	}
	try {
		return JSON.stringify(left) === JSON.stringify(right);
	} catch {
		return false;
	}
}

function isSelectableValue(options: Array<{ value: string; label: string }>, value: unknown): value is string {
	return typeof value === "string" && options.some((option) => option.value === value);
}

function normalizeGap(value: unknown): string {
	return isSelectableValue([...GAP_OPTIONS], value) ? value : "md";
}

function normalizeGridColumns(value: unknown): string {
	return isSelectableValue([...GRID_COLUMN_OPTIONS], value) ? value : "2";
}

function normalizeStackDirection(value: unknown): string {
	return isSelectableValue([...STACK_DIRECTION_OPTIONS], value) ? value : "vertical";
}

function normalizeChartType(value: unknown): string | null {
	return typeof value === "string" && CHART_COMPONENT_TYPES.has(value) ? value : null;
}

function getElementType(
	spec: Spec,
	overrideElements: SpecOverrides["elements"],
	elementKey: string,
): string | null {
	const overriddenType = overrideElements[elementKey]?.type;
	if (typeof overriddenType === "string" && overriddenType.trim().length > 0) {
		return overriddenType;
	}
	const rawType = spec.elements[elementKey]?.type;
	return typeof rawType === "string" ? rawType : null;
}

function getOriginalElementProps(spec: Spec, elementKey: string): Record<string, unknown> {
	const props = spec.elements[elementKey]?.props;
	return isObjectRecord(props) ? props : {};
}

function getMergedElementProps(
	spec: Spec,
	overrideElements: SpecOverrides["elements"],
	elementKey: string,
): Record<string, unknown> {
	const originalProps = getOriginalElementProps(spec, elementKey);
	const overriddenProps = overrideElements[elementKey]?.props;
	return isObjectRecord(overriddenProps)
		? { ...originalProps, ...overriddenProps }
		: originalProps;
}

function getOriginalElementChildren(spec: Spec, elementKey: string): string[] {
	const rawChildren = spec.elements[elementKey]?.children;
	return Array.isArray(rawChildren) ? rawChildren : [];
}

function getCurrentElementChildren(
	spec: Spec,
	overrideElements: SpecOverrides["elements"],
	elementKey: string,
): string[] {
	const overriddenChildren = overrideElements[elementKey]?.children;
	if (Array.isArray(overriddenChildren)) {
		return overriddenChildren;
	}
	return getOriginalElementChildren(spec, elementKey);
}

function deriveElementLabel(
	element: { type: string; props: Record<string, unknown> },
	key: string,
): string {
	const props = element.props;
	for (const propName of ["title", "text", "label", "name"]) {
		const val = props[propName];
		if (typeof val === "string" && val.length > 0 && val.length <= 50 && !isDynamicPropValue(val)) {
			return val;
		}
	}
	return `${element.type} (${toSentenceCase(key)})`;
}

function collectVisibilityParentKeys(
	spec: Spec,
	overrideElements: SpecOverrides["elements"],
): string[] {
	const parentKeys = new Set<string>([spec.root]);
	const rootChildren = getOriginalElementChildren(spec, spec.root);
	for (const childKey of rootChildren) {
		const childType = getElementType(spec, overrideElements, childKey);
		if (childType && KEY_NESTED_PARENT_TYPES.has(childType)) {
			parentKeys.add(childKey);
		}
	}
	return Array.from(parentKeys);
}

function collectKeyElementKeys(
	spec: Spec,
	overrideElements: SpecOverrides["elements"],
): string[] {
	const keys = new Set<string>([spec.root]);
	const rootChildren = getOriginalElementChildren(spec, spec.root);

	for (const childKey of rootChildren) {
		keys.add(childKey);
		const childType = getElementType(spec, overrideElements, childKey);
		if (childType && KEY_NESTED_PARENT_TYPES.has(childType)) {
			for (const grandChildKey of getOriginalElementChildren(spec, childKey)) {
				keys.add(grandChildKey);
			}
		}
	}

	return Array.from(keys);
}

function mapLayoutPropsForType(currentProps: Record<string, unknown>, targetType: "Stack" | "Grid") {
	const className = typeof currentProps.className === "string" ? currentProps.className : null;
	if (targetType === "Grid") {
		const inferredColumns =
			typeof currentProps.direction === "string" && currentProps.direction === "horizontal"
				? "2"
				: normalizeGridColumns(currentProps.columns);
		return {
			columns: inferredColumns,
			gap: normalizeGap(currentProps.gap),
			className,
		};
	}

	const inferredDirection =
		typeof currentProps.direction === "string" &&
		(currentProps.direction === "vertical" || currentProps.direction === "horizontal")
			? currentProps.direction
			: typeof currentProps.columns === "string" && currentProps.columns !== "1"
				? "horizontal"
				: normalizeStackDirection(currentProps.direction);
	const align =
		typeof currentProps.align === "string" && ["start", "center", "end", "stretch"].includes(currentProps.align)
			? currentProps.align
			: null;
	const justify =
		typeof currentProps.justify === "string" && ["start", "center", "end", "between"].includes(currentProps.justify)
			? currentProps.justify
			: null;
	const padding =
		typeof currentProps.padding === "number" && Number.isFinite(currentProps.padding)
			? currentProps.padding
			: null;

	return {
		direction: inferredDirection,
		gap: normalizeGap(currentProps.gap),
		align,
		justify,
		padding,
		className,
	};
}

function mapChartPropsForType(currentProps: Record<string, unknown>, targetType: string) {
	const title = typeof currentProps.title === "string" ? currentProps.title : null;
	const data = currentProps.data;
	const height =
		typeof currentProps.height === "number" && Number.isFinite(currentProps.height)
			? currentProps.height
			: 220;

	if (targetType === "PieChart") {
		const nameKey =
			typeof currentProps.nameKey === "string"
				? currentProps.nameKey
				: typeof currentProps.xKey === "string"
					? currentProps.xKey
					: "label";
		const valueKey =
			typeof currentProps.valueKey === "string"
				? currentProps.valueKey
				: typeof currentProps.yKey === "string"
					? currentProps.yKey
					: "value";
		return {
			title,
			data,
			nameKey,
			valueKey,
			height,
		};
	}

	const xKey =
		typeof currentProps.xKey === "string"
			? currentProps.xKey
			: typeof currentProps.nameKey === "string"
				? currentProps.nameKey
				: "label";
	const yKey =
		typeof currentProps.yKey === "string"
			? currentProps.yKey
			: typeof currentProps.valueKey === "string"
				? currentProps.valueKey
				: "value";
	const aggregate =
		typeof currentProps.aggregate === "string" && ["sum", "count", "avg"].includes(currentProps.aggregate)
			? currentProps.aggregate
			: null;
	const color =
		typeof currentProps.color === "string" && currentProps.color.trim().length > 0
			? currentProps.color
			: CHART_COLOR_OPTIONS[0].value;

	return {
		title,
		data,
		xKey,
		yKey,
		aggregate,
		color,
		height,
	};
}

function extractVisibilityControls(spec: Spec, overrides: SpecOverrides | null | undefined): VisibilityControl[] {
	const controls: VisibilityControl[] = [];
	const overrideElements = getSpecOverrideElements(overrides);
	const parentKeys = collectVisibilityParentKeys(spec, overrideElements);

	for (const parentKey of parentKeys) {
		const originalChildren = getOriginalElementChildren(spec, parentKey);
		if (originalChildren.length <= 1) {
			continue;
		}
		const currentChildren = getCurrentElementChildren(spec, overrideElements, parentKey);
		const parentType = getElementType(spec, overrideElements, parentKey) ?? "Section";
		const parentProps = getMergedElementProps(spec, overrideElements, parentKey);
		const groupLabel =
			parentKey === spec.root
				? "Top Sections"
				: deriveElementLabel({ type: parentType, props: parentProps }, parentKey);

		for (const childKey of originalChildren) {
			const childType = getElementType(spec, overrideElements, childKey);
			if (!childType) {
				continue;
			}
			const childProps = getMergedElementProps(spec, overrideElements, childKey);
			controls.push({
				kind: "visibility",
				parentKey,
				childKey,
				groupLabel,
				label: deriveElementLabel({ type: childType, props: childProps }, childKey),
				visible: currentChildren.includes(childKey),
			});
		}
	}

	return controls.slice(0, MAX_CONTROLS_PER_SECTION);
}

function extractContentControls(spec: Spec, overrides: SpecOverrides | null | undefined): AutoControl[] {
	const controls: AutoControl[] = [];
	const overrideElements = getSpecOverrideElements(overrides);

	for (const [elementKey] of Object.entries(spec.elements)) {
		const elementType = getElementType(spec, overrideElements, elementKey);
		if (!elementType) {
			continue;
		}
		const elementProps = getMergedElementProps(spec, overrideElements, elementKey);
		const editableProps = COPY_EDITABLE_PROPS[elementType];
		if (editableProps) {
			for (const propName of editableProps) {
				const value = elementProps[propName];
				if (typeof value !== "string" || isDynamicPropValue(value)) {
					continue;
				}
				controls.push({
					kind: "text-edit",
					elementKey,
					propName,
					label: `${deriveElementLabel({ type: elementType, props: elementProps }, elementKey)} · ${toSentenceCase(propName)}`,
					value,
				});
			}
		}

		if (elementType !== "Tabs") {
			continue;
		}

		const tabs = Array.isArray(elementProps.tabs) ? elementProps.tabs : [];
		for (let tabIndex = 0; tabIndex < tabs.length; tabIndex += 1) {
			const tab = tabs[tabIndex];
			if (!isObjectRecord(tab) || typeof tab.label !== "string") {
				continue;
			}
			controls.push({
				kind: "tabs-label",
				elementKey,
				tabIndex,
				label: `${deriveElementLabel({ type: elementType, props: elementProps }, elementKey)} · Tab ${tabIndex + 1}`,
				value: tab.label,
			});
		}
	}

	return controls.slice(0, MAX_CONTROLS_PER_SECTION);
}

function extractLayoutControls(spec: Spec, overrides: SpecOverrides | null | undefined): AutoControl[] {
	const controls: AutoControl[] = [];
	const overrideElements = getSpecOverrideElements(overrides);
	const keyElementKeys = collectKeyElementKeys(spec, overrideElements);

	for (const elementKey of keyElementKeys) {
		const elementType = getElementType(spec, overrideElements, elementKey);
		if (!elementType) {
			continue;
		}
		const elementProps = getMergedElementProps(spec, overrideElements, elementKey);
		const label = deriveElementLabel({ type: elementType, props: elementProps }, elementKey);

		if (elementType === "Grid") {
			controls.push({
				kind: "select-prop",
				category: "layout",
				elementKey,
				propName: "columns",
				label: `${label} · Columns`,
				value: normalizeGridColumns(elementProps.columns),
				options: [...GRID_COLUMN_OPTIONS],
			});
			controls.push({
				kind: "select-prop",
				category: "layout",
				elementKey,
				propName: "gap",
				label: `${label} · Gap`,
				value: normalizeGap(elementProps.gap),
				options: [...GAP_OPTIONS],
			});

			if (getOriginalElementChildren(spec, elementKey).length > 1) {
				controls.push({
					kind: "component-swap",
					category: "layout",
					elementKey,
					label: `${label} · Layout Type`,
					value: "Grid",
					options: [
						{ value: "Stack", label: "Stack" },
						{ value: "Grid", label: "Grid" },
					],
				});
			}
			continue;
		}

		if (elementType === "Stack") {
			controls.push({
				kind: "select-prop",
				category: "layout",
				elementKey,
				propName: "direction",
				label: `${label} · Direction`,
				value: normalizeStackDirection(elementProps.direction),
				options: [...STACK_DIRECTION_OPTIONS],
			});
			controls.push({
				kind: "select-prop",
				category: "layout",
				elementKey,
				propName: "gap",
				label: `${label} · Gap`,
				value: normalizeGap(elementProps.gap),
				options: [...GAP_OPTIONS],
			});

			if (getOriginalElementChildren(spec, elementKey).length > 1) {
				controls.push({
					kind: "component-swap",
					category: "layout",
					elementKey,
					label: `${label} · Layout Type`,
					value: "Stack",
					options: [
						{ value: "Stack", label: "Stack" },
						{ value: "Grid", label: "Grid" },
					],
				});
			}
			continue;
		}

		if (elementType === "Tabs") {
			const tabs = Array.isArray(elementProps.tabs)
				? elementProps
						.tabs
						.filter((tab): tab is { value: string; label: string } =>
							isObjectRecord(tab) && typeof tab.value === "string" && typeof tab.label === "string"
						)
				: [];
			if (tabs.length === 0) {
				continue;
			}
			const defaultTabValue =
				typeof elementProps.defaultValue === "string" && tabs.some((tab) => tab.value === elementProps.defaultValue)
					? elementProps.defaultValue
					: tabs[0].value;
			controls.push({
				kind: "select-prop",
				category: "layout",
				elementKey,
				propName: "defaultValue",
				label: `${label} · Default Tab`,
				value: defaultTabValue,
				options: tabs.map((tab) => ({ value: tab.value, label: tab.label })),
			});
		}
	}

	return controls.slice(0, MAX_CONTROLS_PER_SECTION);
}

function extractChartControls(spec: Spec, overrides: SpecOverrides | null | undefined): AutoControl[] {
	const controls: AutoControl[] = [];
	const overrideElements = getSpecOverrideElements(overrides);

	for (const [elementKey] of Object.entries(spec.elements)) {
		const elementType = getElementType(spec, overrideElements, elementKey);
		if (!elementType || !CHART_COMPONENT_TYPES.has(elementType)) {
			continue;
		}
		const elementProps = getMergedElementProps(spec, overrideElements, elementKey);
		const label = deriveElementLabel({ type: elementType, props: elementProps }, elementKey);

		controls.push({
			kind: "component-swap",
			category: "chart",
			elementKey,
			label: `${label} · Chart Type`,
			value: normalizeChartType(elementType) ?? "BarChart",
			options: [...CHART_TYPE_OPTIONS],
		});

		if (elementType === "BarChart" || elementType === "LineChart" || elementType === "AreaChart") {
			controls.push({
				kind: "select-prop",
				category: "chart",
				elementKey,
				propName: "color",
				label: `${label} · Color`,
				value:
					typeof elementProps.color === "string" && elementProps.color.trim().length > 0
						? elementProps.color
						: CHART_COLOR_OPTIONS[0].value,
				options: [...CHART_COLOR_OPTIONS],
			});
		}

		controls.push({
			kind: "number-prop",
			category: "chart",
			elementKey,
			propName: "height",
			label: `${label} · Height`,
			value:
				typeof elementProps.height === "number" && Number.isFinite(elementProps.height)
					? elementProps.height
					: 220,
			min: 160,
			max: 520,
			step: 10,
		});
	}

	return controls.slice(0, MAX_CONTROLS_PER_SECTION);
}

function extractAppearanceControls(spec: Spec, overrides: SpecOverrides | null | undefined): AutoControl[] {
	const controls: AutoControl[] = [];
	const overrideElements = getSpecOverrideElements(overrides);

	for (const [elementKey] of Object.entries(spec.elements)) {
		const elementType = getElementType(spec, overrideElements, elementKey);
		if (!elementType) {
			continue;
		}
		const propOptionGroups = APPEARANCE_PROP_OPTIONS[elementType];
		if (!propOptionGroups) {
			continue;
		}
		const elementProps = getMergedElementProps(spec, overrideElements, elementKey);
		const label = deriveElementLabel({ type: elementType, props: elementProps }, elementKey);
		for (const [propName, options] of Object.entries(propOptionGroups)) {
			const rawValue = elementProps[propName];
			if (isDynamicPropValue(rawValue)) {
				continue;
			}
			controls.push({
				kind: "select-prop",
				category: "appearance",
				elementKey,
				propName,
				label: `${label} · ${toSentenceCase(propName)}`,
				value: isSelectableValue(options, rawValue) ? rawValue : options[0].value,
				options,
			});
		}
	}

	return controls.slice(0, MAX_CONTROLS_PER_SECTION);
}

function extractAutoControls(spec: Spec, overrides: SpecOverrides | null | undefined): AutoControl[] {
	const visibilityControls = extractVisibilityControls(spec, overrides);
	const contentControls = extractContentControls(spec, overrides);
	const layoutControls = extractLayoutControls(spec, overrides);
	const chartControls = extractChartControls(spec, overrides);
	const appearanceControls = extractAppearanceControls(spec, overrides);
	return [
		...visibilityControls,
		...contentControls,
		...layoutControls,
		...chartControls,
		...appearanceControls,
	];
}

function applySpecOverrides(spec: Spec, overrides: SpecOverrides | null | undefined): Spec {
	const overrideElements = getSpecOverrideElements(overrides);
	if (Object.keys(overrideElements).length === 0) {
		return spec;
	}

	const nextElements = { ...spec.elements };
	for (const [key, override] of Object.entries(overrideElements)) {
		const original = nextElements[key];
		if (!original) {
			continue;
		}

		let merged = { ...original };
		if (typeof override.type === "string" && override.type.trim().length > 0) {
			merged = { ...merged, type: override.type };
		}
		if (isObjectRecord(override.props)) {
			merged = { ...merged, props: { ...original.props, ...override.props } };
		}
		if (Array.isArray(override.children)) {
			merged = { ...merged, children: override.children };
		}
		nextElements[key] = merged;
	}

	return { ...spec, elements: nextElements };
}

type ElementOverrideValue = SpecOverrides["elements"][string];

function normalizeElementOverride(
	override: ElementOverrideValue | null | undefined,
): ElementOverrideValue | null {
	if (!override || typeof override !== "object") {
		return null;
	}

	const normalizedType =
		typeof override.type === "string" && override.type.trim().length > 0
			? override.type
			: undefined;
	const normalizedProps = isObjectRecord(override.props)
		? Object.fromEntries(
				Object.entries(override.props).filter(([, value]) => value !== undefined)
			)
		: undefined;
	const hasChildren = Array.isArray(override.children);

	if (
		normalizedType === undefined &&
		(normalizedProps === undefined || Object.keys(normalizedProps).length === 0) &&
		!hasChildren
	) {
		return null;
	}

	const nextOverride: ElementOverrideValue = {};
	if (normalizedType !== undefined) {
		nextOverride.type = normalizedType;
	}
	if (normalizedProps !== undefined && Object.keys(normalizedProps).length > 0) {
		nextOverride.props = normalizedProps;
	}
	if (hasChildren) {
		nextOverride.children = override.children;
	}
	return nextOverride;
}

function resolveRenderableOutput(run: AgentRun | null): RenderableOutput | null {
	if (!run) {
		return null;
	}

	const genuiSummary = run.genuiSummary;
	const primaryWidget = Array.isArray(genuiSummary?.widgets)
		? genuiSummary.widgets.find(
				(widget) => widget?.status === "ready" && hasRenderableSpec(widget.spec)
			)
		: null;
	const fallbackSpec =
		primaryWidget === null && hasRenderableSpec(genuiSummary?.spec)
			? genuiSummary.spec
			: null;
	const renderableSpec = primaryWidget?.spec ?? fallbackSpec ?? null;
	if (!renderableSpec) {
		return null;
	}

	return {
		title: primaryWidget?.title || "Primary output",
		spec: renderableSpec,
	};
}

function escapeRegexForPattern(value: string): string {
	return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function countTokenMentions(source: string, token: string): number {
	const normalizedToken = token.trim().toLowerCase();
	if (!normalizedToken) {
		return 0;
	}

	const pattern = new RegExp(
		`(^|[^a-z0-9-])${escapeRegexForPattern(normalizedToken)}(?=$|[^a-z0-9-])`,
		"gi",
	);
	let count = 0;
	while (pattern.exec(source) !== null) {
		count += 1;
	}
	return count;
}

function countSubstringMentions(source: string, needle: string): number {
	if (!source || !needle) {
		return 0;
	}

	let count = 0;
	let searchIndex = 0;
	while (searchIndex < source.length) {
		const nextIndex = source.indexOf(needle, searchIndex);
		if (nextIndex < 0) {
			break;
		}
		count += 1;
		searchIndex = nextIndex + needle.length;
	}
	return count;
}

function routeFromAppPageFilePath(filePath: string): string | null {
	if (filePath === "app/page.tsx") {
		return "/";
	}

	if (!filePath.startsWith("app/") || !filePath.endsWith("/page.tsx")) {
		return null;
	}

	const relativePath = filePath.slice("app/".length, -"/page.tsx".length);
	if (!relativePath) {
		return "/";
	}

	const rawSegments = relativePath.split("/").filter((segment) => segment.length > 0);
	const routeSegments: string[] = [];
	for (const rawSegment of rawSegments) {
		if (/^\(.*\)$/.test(rawSegment)) {
			continue;
		}
		if (rawSegment.startsWith("(") || rawSegment.startsWith("@")) {
			return null;
		}
		if (rawSegment.includes("[") || rawSegment.includes("]")) {
			return null;
		}
		routeSegments.push(rawSegment);
	}

	if (routeSegments.length === 0) {
		return "/";
	}
	return `/${routeSegments.join("/")}`;
}

function resolveAppPreviewRoutes(run: AgentRun | null): string[] {
	if (!run) {
		return [];
	}

	const routeCandidates = Array.from(
		new Set(
			collectRunFilePaths(run)
				.map((filePath) => routeFromAppPageFilePath(filePath))
				.filter((routePath): routePath is string => typeof routePath === "string"),
		),
	);
	if (routeCandidates.length === 0) {
		return [];
	}

	const focusText = [
		run.userPrompt,
		run.plan.title,
		run.plan.description,
		...run.plan.tasks.map((task) => task.label),
	]
		.filter((value): value is string => typeof value === "string" && value.trim().length > 0)
		.join("\n")
		.toLowerCase();

	const broadText = extractTextCandidatesFromRun(run).join("\n").toLowerCase();

	const scoredRoutes = routeCandidates.map((routePath) => {
		const normalizedRoute = routePath === "/" ? "" : routePath.slice(1).toLowerCase();
		const leafSegment = normalizedRoute.split("/").at(-1) ?? normalizedRoute;
		const sourcePagePath =
			routePath === "/" ? "app/page.tsx" : `app/${normalizedRoute}/page.tsx`;
		const depth = normalizedRoute.length > 0 ? normalizedRoute.split("/").length : 0;

		const focusRouteMentions =
			normalizedRoute.length > 0 ? countTokenMentions(focusText, normalizedRoute) : 0;
		const focusLeafMentions =
			leafSegment.length > 0 ? countTokenMentions(focusText, leafSegment) : 0;
		const sourcePageMentions = countSubstringMentions(broadText, sourcePagePath.toLowerCase());

		const score =
			(focusRouteMentions * 200) +
			(sourcePageMentions * 60) +
			(focusLeafMentions * 12) +
			(depth * 2) +
			(routePath.length * 0.01);

		return {
			routePath,
			score,
		};
	});

	const hasConcreteAppRoute = scoredRoutes.some(
		(scoredRoute) => !scoredRoute.routePath.startsWith("/apps/"),
	);

	scoredRoutes.sort((leftRoute, rightRoute) => {
		if (hasConcreteAppRoute) {
			const leftIsGeneratedRoute = leftRoute.routePath.startsWith("/apps/");
			const rightIsGeneratedRoute = rightRoute.routePath.startsWith("/apps/");
			if (leftIsGeneratedRoute !== rightIsGeneratedRoute) {
				return leftIsGeneratedRoute ? 1 : -1;
			}
		}

		if (rightRoute.score !== leftRoute.score) {
			return rightRoute.score - leftRoute.score;
		}
		if (rightRoute.routePath.length !== leftRoute.routePath.length) {
			return rightRoute.routePath.length - leftRoute.routePath.length;
		}
		return leftRoute.routePath.localeCompare(rightRoute.routePath);
	});

	return scoredRoutes.map((scoredRoute) => scoredRoute.routePath);
}

async function isRoutePreviewReachable(
	routePath: string,
	signal?: AbortSignal,
): Promise<boolean> {
	if (!routePath.startsWith("/")) {
		return false;
	}

	const request = async (method: "HEAD" | "GET") => {
		try {
			return await fetch(routePath, {
				method,
				cache: "no-store",
				credentials: "same-origin",
				headers: {
					Accept: "text/html",
				},
				signal,
			});
		} catch {
			return null;
		}
	};

	const headResponse = await request("HEAD");
	if (headResponse && headResponse.status !== 405 && headResponse.status !== 501) {
		return headResponse.ok;
	}

	const getResponse = await request("GET");
	return Boolean(getResponse?.ok);
}

const ALLOWED_RUN_FILE_EXTENSIONS = new Set([
	"ts",
	"tsx",
	"js",
	"jsx",
	"mjs",
	"cjs",
	"json",
	"md",
	"mdx",
	"css",
	"scss",
	"less",
	"html",
	"yml",
	"yaml",
]);

const RUN_FILE_PATH_CANDIDATE_REGEX = /[A-Za-z0-9._-]+(?:\/[A-Za-z0-9._-]+)*\.[A-Za-z0-9]+(?:\s*(?:->|→)\s*[^\s`"')\]}]+)?/g;

function normalizeRunFilePath(raw: string): string | null {
	let normalizedPath = raw.trim();
	if (!normalizedPath) {
		return null;
	}

	normalizedPath = normalizedPath
		.replace(/^[`"'([{<]+/, "")
		.replace(/[`"')\]}>.,;:!?]+$/, "")
		.trim();

	const arrowIndex = normalizedPath.search(/\s*(?:->|→)\s*/);
	if (arrowIndex >= 0) {
		normalizedPath = normalizedPath.slice(0, arrowIndex).trim();
	}

	normalizedPath = normalizedPath.replaceAll("\\", "/");
	while (normalizedPath.startsWith("./")) {
		normalizedPath = normalizedPath.slice(2);
	}

	if (!normalizedPath || /\s/.test(normalizedPath)) {
		return null;
	}
	if (/^[a-z][a-z0-9+.-]*:\/\//i.test(normalizedPath)) {
		return null;
	}
	if (normalizedPath.startsWith("@/")) {
		return null;
	}
	if (normalizedPath.startsWith("../")) {
		return null;
	}
	if (normalizedPath.startsWith("/") || normalizedPath.startsWith("~/")) {
		return null;
	}
	if (/^[A-Za-z]:\//.test(normalizedPath)) {
		return null;
	}

	const fileName = normalizedPath.split("/").at(-1) ?? "";
	const extensionIndex = fileName.lastIndexOf(".");
	if (extensionIndex <= 0 || extensionIndex === fileName.length - 1) {
		return null;
	}
	const extension = fileName.slice(extensionIndex + 1).toLowerCase();
	if (!ALLOWED_RUN_FILE_EXTENSIONS.has(extension)) {
		return null;
	}

	return normalizedPath;
}

function extractRunFilePathCandidates(text: string): string[] {
	const candidates: string[] = [];
	RUN_FILE_PATH_CANDIDATE_REGEX.lastIndex = 0;
	let regexMatch: RegExpExecArray | null = null;
	while ((regexMatch = RUN_FILE_PATH_CANDIDATE_REGEX.exec(text)) !== null) {
		if (regexMatch[0]) {
			candidates.push(regexMatch[0]);
		}
	}
	return candidates;
}

function collectCodeTextFromSpec(spec: Spec | null | undefined): string[] {
	if (!spec) {
		return [];
	}

	const rawElements = (spec as { elements?: unknown }).elements;
	if (!isObjectRecord(rawElements)) {
		return [];
	}

	const texts: string[] = [];
	for (const element of Object.values(rawElements)) {
		if (!isObjectRecord(element)) {
			continue;
		}
		if (typeof element.type !== "string" || element.type !== "Code") {
			continue;
		}
		if (!isObjectRecord(element.props)) {
			continue;
		}

		for (const propName of ["text", "content", "value"]) {
			const rawValue = element.props[propName];
			if (typeof rawValue === "string" && rawValue.trim().length > 0) {
				texts.push(rawValue);
			}
		}
	}

	return texts;
}

function extractTextCandidatesFromRun(run: AgentRun): string[] {
	const candidates: string[] = [];

	for (const task of run.plan.tasks) {
		if (typeof task.label === "string" && task.label.trim().length > 0) {
			candidates.push(task.label);
		}
	}

	for (const task of run.tasks) {
		for (const value of [task.label, task.output, task.outputSummary]) {
			if (typeof value === "string" && value.trim().length > 0) {
				candidates.push(value);
			}
		}
	}

	if (typeof run.summary?.content === "string" && run.summary.content.trim().length > 0) {
		candidates.push(run.summary.content);
	}

	if (run.genuiSummary) {
		const widgetSpecs = Array.isArray(run.genuiSummary.widgets)
			? run.genuiSummary.widgets.map((widget) => widget.spec)
			: [];
		for (const spec of [...widgetSpecs, run.genuiSummary.spec]) {
			candidates.push(...collectCodeTextFromSpec(spec ?? null));
		}
	}

	return candidates;
}

function collectRunFilePaths(run: AgentRun | null): string[] {
	if (!run) {
		return [];
	}

	const normalizedPathSet = new Set<string>();
	for (const createdFilePath of run.createdFiles ?? []) {
		const normalizedPath = normalizeRunFilePath(createdFilePath);
		if (normalizedPath) {
			normalizedPathSet.add(normalizedPath);
		}
	}

	for (const textCandidate of extractTextCandidatesFromRun(run)) {
		for (const rawPath of extractRunFilePathCandidates(textCandidate)) {
			const normalizedPath = normalizeRunFilePath(rawPath);
			if (normalizedPath) {
				normalizedPathSet.add(normalizedPath);
			}
		}
	}

	return Array.from(normalizedPathSet).sort((leftPath, rightPath) => {
		const leftDepth = leftPath.split("/").length;
		const rightDepth = rightPath.split("/").length;
		if (leftDepth !== rightDepth) {
			return leftDepth - rightDepth;
		}
		return leftPath.localeCompare(rightPath);
	});
}

function buildFileTreeModel(paths: string[]): RunFileTreeModel {
	type MutableFolderNode = {
		name: string;
		path: string;
		folders: Map<string, MutableFolderNode>;
		files: Set<string>;
	};

	const createFolderNode = (name: string, path: string): MutableFolderNode => ({
		name,
		path,
		folders: new Map(),
		files: new Set(),
	});

	const rootNode = createFolderNode("", "");
	const defaultExpanded = new Set<string>();

	for (const filePath of paths) {
		const segments = filePath.split("/").filter((segment) => segment.length > 0);
		if (segments.length === 0) {
			continue;
		}

		let cursor = rootNode;
		for (let index = 0; index < segments.length - 1; index += 1) {
			const segment = segments[index];
			const parentPath = cursor.path;
			const folderPath = parentPath ? `${parentPath}/${segment}` : segment;
			let folderNode = cursor.folders.get(segment);
			if (!folderNode) {
				folderNode = createFolderNode(segment, folderPath);
				cursor.folders.set(segment, folderNode);
			}
			cursor = folderNode;

			if (index === 0 || index === 1) {
				defaultExpanded.add(folderPath);
			}
		}

		cursor.files.add(segments[segments.length - 1]);
	}

	const toTreeNodes = (folderNode: MutableFolderNode): RunFileTreeNode[] => {
		const folderChildren = Array.from(folderNode.folders.values())
			.sort((leftFolder, rightFolder) => leftFolder.path.localeCompare(rightFolder.path))
			.map((childFolder) => ({
				kind: "folder" as const,
				path: childFolder.path,
				name: childFolder.name,
				children: toTreeNodes(childFolder),
			}));

		const fileChildren = Array.from(folderNode.files)
			.sort((leftFile, rightFile) => leftFile.localeCompare(rightFile))
			.map((fileName) => ({
				kind: "file" as const,
				path: folderNode.path ? `${folderNode.path}/${fileName}` : fileName,
				name: fileName,
			}));

		return [...folderChildren, ...fileChildren];
	};

	return {
		roots: toTreeNodes(rootNode),
		defaultExpanded,
		filePaths: paths,
		firstFilePath: paths[0] ?? null,
	};
}

function renderRunFileTreeNodes(nodes: RunFileTreeNode[]): React.ReactNode {
	return nodes.map((node) => {
		if (node.kind === "folder") {
			return (
				<FileTreeFolder key={node.path} path={node.path} name={node.name}>
					{renderRunFileTreeNodes(node.children)}
				</FileTreeFolder>
			);
		}

		return <FileTreeFile key={node.path} path={node.path} name={node.name} />;
	});
}

function ContentTabBar({
	leftMode,
	onLeftModeChange,
	panelMode,
	onPanelModeChange,
}: Readonly<{
	leftMode: ArtifactLeftPanelMode;
	onLeftModeChange: (nextMode: ArtifactLeftPanelMode) => void;
	panelMode: ArtifactRightPanelMode;
	onPanelModeChange: (nextMode: ArtifactRightPanelMode) => void;
}>) {
	return (
		<div className="flex items-start justify-between">
			<ToggleGroup
				value={[leftMode]}
				onValueChange={(newValue: string[]) => {
					if (newValue.length > 0) {
						onLeftModeChange(newValue[0] as ArtifactLeftPanelMode);
					}
				}}
				variant="outline"
				spacing={0}
			>
				<ToggleGroupItem value="preview">
					<Icon render={<EyeOpenIcon label="" />} label="Preview" />
					Preview
				</ToggleGroupItem>
				<ToggleGroupItem value="plan">
					<Icon render={<ClipboardIcon label="" />} label="Plan" />
					Plan
				</ToggleGroupItem>
				<ToggleGroupItem value="summary">
					<Icon render={<AiGenerativeTextSummaryIcon label="" />} label="Summary" />
					Summary
				</ToggleGroupItem>
			</ToggleGroup>

			<ToggleGroup
				value={[panelMode]}
				onValueChange={(newValue: string[]) => {
					if (newValue.length > 0) {
						onPanelModeChange(newValue[0] as ArtifactRightPanelMode);
					}
				}}
				variant="outline"
				spacing={0}
			>
				<ToggleGroupItem value="design">
					<Icon render={<PaintPaletteIcon label="" />} label="Design" />
					Design
				</ToggleGroupItem>
				<ToggleGroupItem value="chat">
					<Icon render={<AiChatIcon label="" />} label="Chat" />
					Chat
				</ToggleGroupItem>
				<ToggleGroupItem value="files">
					<Icon render={<FolderClosedIcon label="" />} label="Files" />
					Files
				</ToggleGroupItem>
			</ToggleGroup>
		</div>
	);
}

function FilesPanel({
	run,
	isRunLoading,
}: Readonly<{
	run: AgentRun | null;
	isRunLoading: boolean;
}>) {
	const fileTreeModel = useMemo(
		() => buildFileTreeModel(collectRunFilePaths(run)),
		[run]
	);
	const [userSelectedPath, setUserSelectedPath] = useState<string | null>(null);
	const selectedPath = useMemo(() => {
		if (userSelectedPath && fileTreeModel.filePaths.includes(userSelectedPath)) {
			return userSelectedPath;
		}
		return fileTreeModel.firstFilePath ?? undefined;
	}, [fileTreeModel.filePaths, fileTreeModel.firstFilePath, userSelectedPath]);

	const hasFilePaths = fileTreeModel.filePaths.length > 0;

	return (
		<div className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-border bg-surface">
			<div className="flex h-11 items-center border-border border-b px-4">
				<span style={{ font: token("font.heading.xsmall") }} className="text-text">
					File tree
				</span>
			</div>
			<div className="min-h-0 flex-1 overflow-auto p-3">
				{isRunLoading && run === null ? (
					<p className="text-sm text-text-subtle">Loading files from run...</p>
				) : run === null ? (
					<p className="text-sm text-text-subtle">
						Select or generate an artifact run to see referenced files.
					</p>
				) : !hasFilePaths ? (
					<p className="text-sm text-text-subtle">No file paths were referenced in this run.</p>
				) : (
					<FileTree
						className="w-full text-xs"
						defaultExpanded={fileTreeModel.defaultExpanded}
						selectedPath={selectedPath}
						{...{ onSelect: setUserSelectedPath } as Record<string, unknown>}
					>
						{renderRunFileTreeNodes(fileTreeModel.roots)}
					</FileTree>
				)}
			</div>
		</div>
	);
}

function DesignPanelSectionHeading({ children }: Readonly<{ children: React.ReactNode }>) {
	return (
		<div className="flex items-center gap-2 pt-2 pb-1">
			<span className="text-xs font-medium tracking-wider text-text-subtlest">
				{children}
			</span>
			<div className="h-px flex-1 bg-border" />
		</div>
	);
}

function DesignPanel({
	isRunLoading,
	isLiveAppPreview,
	hasRenderableOutput,
	autoControls,
	hasOverrides,
	designConfig,
	onAutoControlChange,
	onDesignConfigChange,
	onReset,
}: Readonly<{
	isRunLoading: boolean;
	isLiveAppPreview: boolean;
	hasRenderableOutput: boolean;
	autoControls: AutoControl[];
	hasOverrides: boolean;
	designConfig: DesignConfig;
	onAutoControlChange: (control: AutoControl, nextValue: unknown) => void;
	onDesignConfigChange: (next: DesignConfig) => void;
	onReset: () => void;
}>) {
	const visibilityControls = useMemo(
		() => autoControls.filter((c): c is VisibilityControl => c.kind === "visibility"),
		[autoControls],
	);
	const visibilityGroups = useMemo(() => {
		const groups = new Map<string, VisibilityControl[]>();
		for (const control of visibilityControls) {
			const existingControls = groups.get(control.groupLabel) ?? [];
			existingControls.push(control);
			groups.set(control.groupLabel, existingControls);
		}
		return Array.from(groups.entries());
	}, [visibilityControls]);
	const contentControls = useMemo(
		() =>
			autoControls.filter(
				(control): control is TextEditControl | TabsLabelControl =>
					control.kind === "text-edit" || control.kind === "tabs-label"
			),
		[autoControls],
	);
	const layoutControls = useMemo(
		() =>
			autoControls.filter(
				(control): control is SelectPropControl | ComponentSwapControl =>
					(control.kind === "select-prop" && control.category === "layout") ||
					(control.kind === "component-swap" && control.category === "layout")
			),
		[autoControls],
	);
	const chartControls = useMemo(
		() =>
			autoControls.filter(
				(control): control is SelectPropControl | ComponentSwapControl | NumberPropControl =>
					(control.kind === "select-prop" && control.category === "chart") ||
					(control.kind === "component-swap" && control.category === "chart") ||
					control.kind === "number-prop"
			),
		[autoControls],
	);
	const appearanceControls = useMemo(
		() =>
			autoControls.filter(
				(control): control is SelectPropControl =>
					control.kind === "select-prop" && control.category === "appearance"
			),
		[autoControls],
	);
	const displayVisibilityGroups = useMemo<Array<[string, VisibilityControl[]]>>(
		() =>
			visibilityGroups
				.slice(0, DESIGN_PANEL_VISIBILITY_GROUP_LIMIT)
				.map(
					([groupLabel, controls]) =>
						[groupLabel, controls.slice(0, DESIGN_PANEL_VISIBILITY_ITEMS_PER_GROUP)] as [string, VisibilityControl[]],
				),
		[visibilityGroups],
	);
	const displayContentControls = useMemo(
		() => contentControls.slice(0, DESIGN_PANEL_CONTENT_LIMIT),
		[contentControls],
	);
	const displayLayoutControls = useMemo(() => {
		const preferredControl =
			layoutControls.find((control) => control.kind === "component-swap") ??
			layoutControls.find((control) => control.kind === "select-prop");
		return preferredControl ? [preferredControl].slice(0, DESIGN_PANEL_LAYOUT_LIMIT) : [];
	}, [layoutControls]);
	const displayChartControls = useMemo(() => {
		const curatedControls: Array<SelectPropControl | ComponentSwapControl | NumberPropControl> = [];
		const pushControl = (candidate: SelectPropControl | ComponentSwapControl | NumberPropControl | undefined) => {
			if (!candidate || curatedControls.includes(candidate)) {
				return;
			}
			curatedControls.push(candidate);
		};
		pushControl(chartControls.find((control) => control.kind === "component-swap"));
		pushControl(chartControls.find((control) => control.kind === "number-prop"));
		pushControl(chartControls.find((control) => control.kind === "select-prop"));
		for (const control of chartControls) {
			if (curatedControls.length >= DESIGN_PANEL_CHART_LIMIT) {
				break;
			}
			pushControl(control);
		}
		return curatedControls.slice(0, DESIGN_PANEL_CHART_LIMIT);
	}, [chartControls]);
	const displayAppearanceControls = useMemo(
		() => appearanceControls.slice(0, DESIGN_PANEL_APPEARANCE_LIMIT),
		[appearanceControls],
	);

	const hasAnyControls =
		displayVisibilityGroups.length > 0 ||
		displayContentControls.length > 0 ||
		displayLayoutControls.length > 0 ||
		displayChartControls.length > 0 ||
		displayAppearanceControls.length > 0;

	return (
		<div className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-border bg-surface">
			<div className="flex h-11 items-center justify-between border-border border-b px-4">
				<span style={{ font: token("font.heading.xsmall") }} className="text-text">
					Design
				</span>
				{hasOverrides ? (
					<button
						type="button"
						onClick={onReset}
						className="flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-text-subtle transition-colors hover:bg-bg-neutral hover:text-text"
					>
						<UndoIcon label="" size="small" />
						Reset
					</button>
				) : null}
			</div>
			<div className="min-h-0 flex-1 overflow-auto p-4">
				{isRunLoading ? (
					<p className="text-sm text-text-subtle">
						Generating controls from the latest artifact...
					</p>
				) : isLiveAppPreview ? (
					<div className="space-y-4">
						<DesignPanelSectionHeading>Appearance</DesignPanelSectionHeading>
						<GUI.Select
							id="design-theme"
							label="Theme"
							value={designConfig.theme}
							options={[
								{ value: "light" as const, label: "Light" },
								{ value: "dark" as const, label: "Dark" },
							]}
							onChange={(next) => onDesignConfigChange({ ...designConfig, theme: next })}
						/>
						<GUI.Control
							id="design-radius"
							label="Corner Radius"
							value={designConfig.radius}
							defaultValue={DEFAULT_DESIGN_CONFIG.radius}
							min={0}
							max={24}
							step={1}
							unit="px"
							onChange={(next) => onDesignConfigChange({ ...designConfig, radius: next })}
						/>
						<GUI.Select
							id="design-density"
							label="Density"
							value={designConfig.density}
							options={[
								{ value: "compact" as const, label: "Compact" },
								{ value: "default" as const, label: "Default" },
								{ value: "spacious" as const, label: "Spacious" },
							]}
							onChange={(next) => onDesignConfigChange({ ...designConfig, density: next })}
						/>
						<GUI.Select
							id="design-shadow"
							label="Shadow"
							value={designConfig.shadow}
							options={[
								{ value: "none" as const, label: "None" },
								{ value: "subtle" as const, label: "Subtle" },
								{ value: "raised" as const, label: "Raised" },
							]}
							onChange={(next) => onDesignConfigChange({ ...designConfig, shadow: next })}
						/>
						<GUI.Toggle
							id="design-animation"
							label="Animation"
							description="Enable transitions and animations"
							checked={designConfig.animation}
							onChange={(next) => onDesignConfigChange({ ...designConfig, animation: next })}
						/>
						<GUI.Toggle
							id="design-borders"
							label="Borders"
							description="Show element borders"
							checked={designConfig.borders}
							onChange={(next) => onDesignConfigChange({ ...designConfig, borders: next })}
						/>
						<GUI.Toggle
							id="design-grayscale"
							label="Grayscale"
							description="Remove color to check contrast"
							checked={designConfig.grayscale}
							onChange={(next) => onDesignConfigChange({ ...designConfig, grayscale: next })}
						/>

						<DesignPanelSectionHeading>Typography</DesignPanelSectionHeading>
						<GUI.Control
							id="design-font-scale"
							label="Font Scale"
							value={designConfig.fontScale}
							defaultValue={DEFAULT_DESIGN_CONFIG.fontScale}
							min={0.75}
							max={1.5}
							step={0.05}
							unit="x"
							onChange={(next) => onDesignConfigChange({ ...designConfig, fontScale: next })}
						/>
						<GUI.Select
							id="design-font-family"
							label="Font Family"
							value={designConfig.fontFamily}
							options={[
								{ value: "system" as const, label: "System" },
								{ value: "mono" as const, label: "Mono" },
								{ value: "serif" as const, label: "Serif" },
							]}
							onChange={(next) => onDesignConfigChange({ ...designConfig, fontFamily: next })}
						/>
						<GUI.Control
							id="design-letter-spacing"
							label="Letter Spacing"
							value={designConfig.letterSpacing}
							defaultValue={DEFAULT_DESIGN_CONFIG.letterSpacing}
							min={-2}
							max={4}
							step={0.5}
							unit="px"
							onChange={(next) => onDesignConfigChange({ ...designConfig, letterSpacing: next })}
						/>

						<DesignPanelSectionHeading>Copy</DesignPanelSectionHeading>
						<GUI.TextInput
							id="design-heading"
							label="Heading"
							placeholder="Override h1 text"
							value={designConfig.heading}
							onChange={(next) => onDesignConfigChange({ ...designConfig, heading: next })}
						/>
						<GUI.TextInput
							id="design-subheading"
							label="Subheading"
							placeholder="Override h2 / subtitle text"
							value={designConfig.subheading}
							onChange={(next) => onDesignConfigChange({ ...designConfig, subheading: next })}
						/>
					</div>
				) : !hasRenderableOutput ? (
					<p className="text-sm text-text-subtle">
						Generate an artifact to unlock visual controls.
					</p>
				) : !hasAnyControls ? (
					<p className="text-sm text-text-subtle">
						This artifact has no editable fields yet.
					</p>
				) : (
					<div className="space-y-4">
						{displayVisibilityGroups.length > 0 ? (
							<div className="space-y-2">
								<DesignPanelSectionHeading>Sections</DesignPanelSectionHeading>
								{displayVisibilityGroups.map(([groupLabel, controls]) => (
									<div key={groupLabel} className="space-y-2 rounded-md border border-border bg-surface p-2.5">
										<p className="text-[11px] font-medium text-text-subtle">{groupLabel}</p>
										{controls.map((control) => (
											<GUI.Toggle
												key={`vis-${control.parentKey}-${control.childKey}`}
												id={`auto-vis-${control.parentKey}-${control.childKey}`}
												label={control.label}
												checked={control.visible}
												onChange={(nextValue) => onAutoControlChange(control, nextValue)}
											/>
										))}
									</div>
								))}
							</div>
						) : null}

						{displayContentControls.length > 0 ? (
							<div className="space-y-2">
								<DesignPanelSectionHeading>Content</DesignPanelSectionHeading>
								{displayContentControls.map((control) => {
									const controlId =
										control.kind === "tabs-label"
											? `auto-content-${control.elementKey}-tab-${control.tabIndex}`
											: `auto-content-${control.elementKey}-${control.propName}`;
									return (
										<div key={controlId} className="space-y-1.5">
											<Label htmlFor={controlId} className="text-xs font-medium text-text">
												{control.label}
											</Label>
											<Input
												id={controlId}
												value={control.value}
												onChange={(event) => onAutoControlChange(control, event.currentTarget.value)}
												className="h-8 text-xs"
											/>
										</div>
									);
								})}
							</div>
						) : null}

						{displayLayoutControls.length > 0 ? (
							<div className="space-y-2">
								<DesignPanelSectionHeading>Layout</DesignPanelSectionHeading>
								{displayLayoutControls.map((control) => {
									const controlId =
										control.kind === "select-prop"
											? `auto-layout-${control.elementKey}-${control.propName}`
											: `auto-layout-${control.elementKey}-type`;
									return (
										<GUI.Select
											key={controlId}
											id={controlId}
											label={control.label}
											value={control.value}
											options={control.options}
											onChange={(nextValue) => onAutoControlChange(control, nextValue)}
										/>
									);
								})}
							</div>
						) : null}

						{displayChartControls.length > 0 ? (
							<div className="space-y-2">
								<DesignPanelSectionHeading>Charts</DesignPanelSectionHeading>
								{displayChartControls.map((control) => {
									if (control.kind === "number-prop") {
										return (
											<GUI.Control
												key={`auto-chart-${control.elementKey}-${control.propName}`}
												id={`auto-chart-${control.elementKey}-${control.propName}`}
												label={control.label}
												value={control.value}
												min={control.min}
												max={control.max}
												step={control.step}
												onChange={(nextValue) => onAutoControlChange(control, nextValue)}
											/>
										);
									}

									const controlId =
										control.kind === "select-prop"
											? `auto-chart-${control.elementKey}-${control.propName}`
											: `auto-chart-${control.elementKey}-type`;
									return (
										<GUI.Select
											key={controlId}
											id={controlId}
											label={control.label}
											value={control.value}
											options={control.options}
											onChange={(nextValue) => onAutoControlChange(control, nextValue)}
										/>
									);
								})}
							</div>
						) : null}

						{displayAppearanceControls.length > 0 ? (
							<div className="space-y-2">
								<DesignPanelSectionHeading>Appearance</DesignPanelSectionHeading>
								{displayAppearanceControls.map((control) => (
									<GUI.Select
										key={`auto-appearance-${control.elementKey}-${control.propName}`}
										id={`auto-appearance-${control.elementKey}-${control.propName}`}
										label={control.label}
										value={control.value}
										options={control.options}
										onChange={(nextValue) => onAutoControlChange(control, nextValue)}
									/>
								))}
							</div>
						) : null}
					</div>
				)}
			</div>
		</div>
	);
}

function LoadingPanel({
	title,
}: Readonly<{
	title: string;
}>) {
	return (
		<div className="flex h-full w-full flex-col items-center justify-center gap-3 rounded-xl border border-border bg-surface p-6 text-center">
			<div className="size-5 animate-spin rounded-full border border-border border-t-text-subtle" />
			<p className="text-sm text-text-subtle">{title}</p>
		</div>
	);
}

function EmptyPanel({
	title,
	description,
}: Readonly<{
	title: string;
	description: string;
}>) {
	return (
		<div className="flex h-full w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-surface p-6 text-center">
			<p style={{ font: token("font.heading.xsmall") }} className="text-text">
				{title}
			</p>
			<p className="max-w-md text-sm text-text-subtle">{description}</p>
		</div>
	);
}

function GeneratingPanel() {
	const { actualTheme } = useTheme();
	const loadingAnimationSrc =
		actualTheme === "dark"
			? "/loading/rovo-create-dark.gif"
			: "/loading/rovo-create-light.gif";

	return (
		<div className="flex h-full w-full flex-col items-center justify-center gap-3 rounded-xl border border-border bg-surface p-6 text-center">
			<Image
				alt=""
				className="h-28 w-auto"
				height={280}
				src={loadingAnimationSrc}
				unoptimized
				width={442}
			/>
			<p className="text-sm text-muted-foreground">
				Rovo is cooking
				<AnimatedDots />
			</p>
		</div>
	);
}

function PreviewHeader({
	title,
	subtitle,
	onOpenExternal,
	onRefresh,
}: Readonly<{
	title: string;
	subtitle?: string;
	onOpenExternal?: () => void;
	onRefresh?: () => void;
}>) {
	return (
		<div className="flex shrink-0 items-center gap-2 border-b border-border px-4 py-2.5">
			<div className="min-w-0 flex-1">
				<p className="truncate text-sm font-medium text-text">{title}</p>
				{subtitle ? (
					<p className="truncate text-xs text-text-subtlest">{subtitle}</p>
				) : null}
			</div>
			{onRefresh || onOpenExternal ? (
				<div className="flex shrink-0 items-center gap-1">
					{onRefresh ? (
						<button
							type="button"
							onClick={onRefresh}
							className="flex size-7 items-center justify-center rounded-md text-icon-subtle transition-colors hover:bg-bg-neutral-subtle-hovered hover:text-icon"
							aria-label="Refresh preview"
						>
							<Icon render={<RefreshIcon label="" />} label="Refresh" />
						</button>
					) : null}
					{onOpenExternal ? (
						<button
							type="button"
							onClick={onOpenExternal}
							className="flex size-7 items-center justify-center rounded-md text-icon-subtle transition-colors hover:bg-bg-neutral-subtle-hovered hover:text-icon"
							aria-label="Open in new tab"
						>
							<Icon render={<LinkExternalIcon label="" />} label="Open externally" />
						</button>
					) : null}
				</div>
			) : null}
		</div>
	);
}

function PreviewOutputPanel({
	isRunLoading,
	run,
	appPreviewRoute,
	isResolvingPreviewRoute,
	enableReactGrabInPreview,
	hasDraftPlan,
	forceRenderableOutput = false,
	renderableOutput,
	previewState,
	specOverrides,
	designConfig,
	iframeRef,
	onPreviewStateChange,
}: Readonly<{
	isRunLoading: boolean;
	run: AgentRun | null;
	appPreviewRoute: string | null;
	isResolvingPreviewRoute: boolean;
	enableReactGrabInPreview: boolean;
	hasDraftPlan: boolean;
	forceRenderableOutput?: boolean;
	renderableOutput: RenderableOutput | null;
	previewState: Record<string, unknown>;
	specOverrides: SpecOverrides;
	designConfig: DesignConfig;
	iframeRef: RefObject<HTMLIFrameElement | null>;
	onPreviewStateChange: (changes: Array<{ path: string; value: unknown }>) => void;
}>) {
	const handleOpenExternal = useCallback(() => {
		if (appPreviewRoute) {
			window.open(appPreviewRoute, "_blank");
		}
	}, [appPreviewRoute]);

	const handleRefresh = useCallback(() => {
		const iframe = iframeRef.current;
		if (iframe) {
			iframe.src = iframe.src;
		}
	}, [iframeRef]);

	if (isRunLoading) {
		return <LoadingPanel title="Loading output..." />;
	}

	const previewTitle = forceRenderableOutput
		? renderableOutput?.title || "Summary"
		: (renderableOutput?.title
			?? resolvePlanDisplayTitle(run?.plan.title ?? "", run?.plan.tasks ?? []))
			|| "Preview";

	if (run) {
		if (!forceRenderableOutput && appPreviewRoute) {
			return (
				<div className="flex h-full w-full flex-col overflow-hidden rounded-xl border border-border bg-surface">
					<PreviewHeader
						title={previewTitle}
						subtitle={appPreviewRoute}
						onOpenExternal={handleOpenExternal}
						onRefresh={handleRefresh}
					/>
					<MakePreviewReactGrabMount
						iframeRef={iframeRef}
						enabled={enableReactGrabInPreview}
						active={false}
					/>
					<DesignConfigInjector iframeRef={iframeRef} config={designConfig} />
					<iframe
						ref={iframeRef}
						title={`Live app preview (${appPreviewRoute})`}
						className="h-full min-h-0 w-full flex-1 border-0 bg-surface"
						sandbox="allow-forms allow-modals allow-popups allow-same-origin allow-scripts"
						src={appPreviewRoute}
					/>
				</div>
			);
		}

		if (renderableOutput) {
			const overriddenSpec = applySpecOverrides(renderableOutput.spec, specOverrides);
			const specWithLiveState = {
				...overriddenSpec,
				state: previewState,
			};
			return (
				<div className="flex h-full w-full flex-col overflow-hidden rounded-xl border border-border bg-surface">
					<PreviewHeader title={previewTitle} />
					<div className="min-h-0 flex-1 overflow-auto p-3">
						<JsonRenderView spec={specWithLiveState} onStateChange={onPreviewStateChange} />
					</div>
				</div>
			);
		}

		if (run.status === "running" || (!forceRenderableOutput && isResolvingPreviewRoute)) {
			return <GeneratingPanel />;
		}

		return (
			<EmptyPanel
				title={forceRenderableOutput ? "No summary yet" : "No output yet"}
				description={
					forceRenderableOutput
						? "This run does not have a renderable summary yet."
						: "This run does not have a renderable output yet."
				}
			/>
		);
	}

	if (hasDraftPlan) {
		return (
			<EmptyPanel
				title="No output yet"
				description="A draft plan was found in chat history, but no saved make run output exists yet."
			/>
		);
	}

	return (
		<EmptyPanel
			title={forceRenderableOutput ? "No saved summary" : "No saved output"}
			description={
				forceRenderableOutput
					? "Start a make run to persist a summary view."
					: "Start a make run to persist one plan and one output."
			}
		/>
	);
}

function PlanPanel({
	isRunLoading,
	plan,
	summaryContent,
}: Readonly<{
	isRunLoading: boolean;
	plan: DisplayPlan | null;
	summaryContent: string;
}>) {
	if (isRunLoading) {
		return <LoadingPanel title="Loading plan..." />;
	}

	const normalizedSummaryContent = normalizeSummaryMarkdown(summaryContent);
	if (!plan && normalizedSummaryContent.length === 0) {
		return (
			<EmptyPanel
				title="No saved plan"
				description="No plan was found in saved runs or chat threads."
			/>
		);
	}

	return (
		<div className="flex h-full w-full flex-col overflow-hidden rounded-xl border border-border bg-surface">
			<Tabs defaultValue="summary" className="flex min-h-0 flex-1 flex-col !gap-0">
				<div className="pt-3">
					<TabsList variant="line" className="w-full justify-start px-4">
						<TabsTrigger value="summary" className="flex-initial">Summary</TabsTrigger>
						<TabsTrigger value="tasks" className="flex-initial">Tasks ({plan?.tasks.length ?? 0})</TabsTrigger>
					</TabsList>
				</div>
				<TabsContent value="summary" className="min-h-0 flex-1 overflow-auto px-4 py-4">
					{normalizedSummaryContent.length > 0 ? (
						<MessageResponse
							isAnimating={false}
							className="size-full text-sm leading-6 text-text [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_h1]:mt-3 [&_h1]:mb-2 [&_h1]:text-2xl [&_h1]:leading-7 [&_h1]:font-semibold [&_h2]:mt-3 [&_h2]:mb-2 [&_h2]:text-xl [&_h2]:leading-6 [&_h2]:font-semibold [&_h3]:mt-3 [&_h3]:mb-2 [&_h3]:text-base [&_h3]:leading-5 [&_h3]:font-semibold [&_p]:my-0"
						>
							{normalizedSummaryContent}
						</MessageResponse>
					) : (
						<p className="text-sm text-text-subtle">No summary yet.</p>
					)}
				</TabsContent>
				<TabsContent value="tasks" className="min-h-0 flex-1 overflow-auto px-4 py-4">
					{plan ? (
						<ol className="flex flex-col gap-0">
							{plan.tasks.map((task, index) => {
								const blockedByText = task.blockedBy.length > 0
									? `Blocked by ${task.blockedBy.map((id) => `#${id.replace(/^task-/, "")}`).join(", ")}`
									: undefined;
								return (
									<li
										key={task.id}
										className="flex min-h-8 shrink-0 items-center gap-4 rounded-lg bg-surface px-2 py-1.5"
									>
										<span className="inline-flex size-5 shrink-0 items-center justify-center rounded-[4px] border border-border bg-surface text-sm leading-5 font-medium text-text">
											{index + 1}
										</span>
										<div className="flex min-w-0 flex-1 flex-col gap-0.5">
											<span className="text-sm leading-5 text-text">{task.label}</span>
											{blockedByText ? (
												<span className="text-xs leading-4 text-text-subtlest">{blockedByText}</span>
											) : null}
										</div>
									</li>
								);
							})}
						</ol>
					) : (
						<p className="text-sm text-text-subtle">No plan available.</p>
					)}
				</TabsContent>
			</Tabs>
		</div>
	);
}

function TwoPanelLayout({
	leftMode,
	panelMode,
	isRunLoading,
	plan,
	run,
	appPreviewRoute,
	isResolvingPreviewRoute,
	enableReactGrabInPreview,
	hasDraftPlan,
	summaryContent,
	renderableOutput,
	previewState,
	specOverrides,
	autoControls,
	hasOverrides,
	onPreviewStateChange,
	onAutoControlChange,
	onReset,
}: Readonly<{
	leftMode: ArtifactLeftPanelMode;
	panelMode: ArtifactRightPanelMode;
	isRunLoading: boolean;
	plan: DisplayPlan | null;
	run: AgentRun | null;
	appPreviewRoute: string | null;
	isResolvingPreviewRoute: boolean;
	enableReactGrabInPreview: boolean;
	hasDraftPlan: boolean;
	summaryContent: string;
	renderableOutput: RenderableOutput | null;
	previewState: Record<string, unknown>;
	specOverrides: SpecOverrides;
	autoControls: AutoControl[];
	hasOverrides: boolean;
	onPreviewStateChange: (changes: Array<{ path: string; value: unknown }>) => void;
	onAutoControlChange: (control: AutoControl, nextValue: unknown) => void;
	onReset: () => void;
}>) {
	const { actualTheme } = useTheme();
	const iframeRef = useRef<HTMLIFrameElement>(null);
	const [hasCustomizedPreviewTheme, setHasCustomizedPreviewTheme] = useState(false);
	const [designConfig, setDesignConfig] = useState<DesignConfig>(() => ({
		...DEFAULT_DESIGN_CONFIG,
		theme: actualTheme,
	}));

	const isLiveAppPreview = leftMode === "preview" && appPreviewRoute !== null;

	const effectiveDesignConfig = useMemo(() => ({
		...designConfig,
		theme: hasCustomizedPreviewTheme
			? designConfig.theme
			: actualTheme,
	}), [actualTheme, designConfig, hasCustomizedPreviewTheme]);

	const liveAppHasOverrides = isLiveAppPreview && (
		effectiveDesignConfig.theme !== actualTheme ||
		effectiveDesignConfig.radius !== DEFAULT_DESIGN_CONFIG.radius ||
		effectiveDesignConfig.density !== DEFAULT_DESIGN_CONFIG.density ||
		effectiveDesignConfig.shadow !== DEFAULT_DESIGN_CONFIG.shadow ||
		effectiveDesignConfig.animation !== DEFAULT_DESIGN_CONFIG.animation ||
		effectiveDesignConfig.fontScale !== DEFAULT_DESIGN_CONFIG.fontScale ||
		effectiveDesignConfig.fontFamily !== DEFAULT_DESIGN_CONFIG.fontFamily ||
		effectiveDesignConfig.letterSpacing !== DEFAULT_DESIGN_CONFIG.letterSpacing ||
		effectiveDesignConfig.borders !== DEFAULT_DESIGN_CONFIG.borders ||
		effectiveDesignConfig.grayscale !== DEFAULT_DESIGN_CONFIG.grayscale ||
		effectiveDesignConfig.heading !== DEFAULT_DESIGN_CONFIG.heading ||
		effectiveDesignConfig.subheading !== DEFAULT_DESIGN_CONFIG.subheading
	);

	const handleDesignConfigChange = useCallback((nextConfig: DesignConfig) => {
		setHasCustomizedPreviewTheme(nextConfig.theme !== actualTheme);
		setDesignConfig(nextConfig);
	}, [actualTheme]);

	const handleDesignReset = useCallback(() => {
		if (isLiveAppPreview) {
			setHasCustomizedPreviewTheme(false);
			setDesignConfig({ ...DEFAULT_DESIGN_CONFIG, theme: actualTheme });
		} else {
			onReset();
		}
	}, [isLiveAppPreview, actualTheme, onReset]);

	const rightPanel =
		panelMode === "chat"
			? <TerminalSwitchPanel />
			: panelMode === "files"
				? <FilesPanel run={run} isRunLoading={isRunLoading} />
				: (
				<DesignPanel
					isRunLoading={isRunLoading}
					isLiveAppPreview={isLiveAppPreview}
					hasRenderableOutput={renderableOutput !== null && !isLiveAppPreview}
					autoControls={autoControls}
					hasOverrides={isLiveAppPreview ? liveAppHasOverrides : hasOverrides}
					designConfig={effectiveDesignConfig}
					onAutoControlChange={onAutoControlChange}
					onDesignConfigChange={handleDesignConfigChange}
					onReset={handleDesignReset}
				/>
			);

	return (
		<div className="flex min-h-0 flex-1 gap-4">
			<div className="min-h-0 min-w-0 flex-1">
				{leftMode === "plan" ? (
					<PlanPanel
						isRunLoading={isRunLoading}
						plan={plan}
						summaryContent={summaryContent}
					/>
				) : (
					<PreviewOutputPanel
						isRunLoading={isRunLoading}
						run={run}
						appPreviewRoute={appPreviewRoute}
						isResolvingPreviewRoute={isResolvingPreviewRoute}
						enableReactGrabInPreview={enableReactGrabInPreview}
						hasDraftPlan={hasDraftPlan}
						forceRenderableOutput={leftMode === "summary"}
						renderableOutput={renderableOutput}
						previewState={previewState}
						specOverrides={specOverrides}
						designConfig={effectiveDesignConfig}
						iframeRef={iframeRef}
						onPreviewStateChange={onPreviewStateChange}
					/>
				)}
			</div>
			<div className="min-h-0 w-[400px] max-w-full shrink-0">
				{rightPanel}
			</div>
		</div>
	);
}

export function MakeArtifactSurface({
	run,
	fallbackPlan = null,
	isRunLoading = false,
	className,
}: Readonly<MakeArtifactSurfaceProps>) {
	const pathname = usePathname();
	const [panelMode, setPanelMode] = useState<ArtifactRightPanelMode>("chat");
	const [leftMode, setLeftMode] = useState<ArtifactLeftPanelMode>("preview");
	const [previewState, setPreviewState] = useState<Record<string, unknown>>({});
	const [specOverrides, setSpecOverrides] = useState<SpecOverrides>({ elements: {} });
	const enableReactGrabInPreview = MAKE_PREVIEW_REACT_GRAB_ENABLED
		&& isMakeArtifactTemplateRoute(pathname);

	const previewSummaryContent = useMemo(() => {
		const runSummaryContent = run?.summary?.content;
		if (typeof runSummaryContent !== "string") {
			return "";
		}
		return runSummaryContent.trim();
	}, [run]);

	const displayPlan = useMemo<DisplayPlan | null>(() => {
		if (run) {
			const resolvedTitle = resolvePlanDisplayTitle(
				run.plan.title,
				run.plan.tasks,
			);
			const resolvedEmoji = run.plan.emoji ?? derivePlanEmojiFromTitle(resolvedTitle);
			return {
				source: "run",
				resolvedTitle,
				resolvedEmoji,
				description: run.plan.description,
				agents: run.plan.agents,
				tasks: run.plan.tasks.map((task) => ({
					id: task.id,
					label: task.label,
					agentName: task.agent,
					blockedBy: task.blockedBy,
				})),
			};
		}

		if (fallbackPlan) {
			const resolvedTitle = resolvePlanDisplayTitle(fallbackPlan.title, fallbackPlan.tasks);
			const resolvedEmoji = fallbackPlan.emoji ?? derivePlanEmojiFromTitle(resolvedTitle);
			return {
				source: "chat-draft",
				resolvedTitle,
				resolvedEmoji,
				description: fallbackPlan.description,
				agents: fallbackPlan.agents,
				tasks: fallbackPlan.tasks.map((task) => ({
					id: task.id,
					label: task.label,
					agentName: task.agent ?? null,
					blockedBy: task.blockedBy,
				})),
			};
		}

		return null;
	}, [fallbackPlan, run]);

	const renderableOutput = useMemo(() => resolveRenderableOutput(run), [run]);
	const appPreviewRouteCandidates = useMemo(
		() => resolveAppPreviewRoutes(run),
		[run],
	);
	const [appPreviewRoute, setAppPreviewRoute] = useState<string | null>(null);
	const [isResolvingPreviewRoute, setIsResolvingPreviewRoute] = useState(false);

	useEffect(() => {
		let cancelled = false;
		const abortController = new AbortController();

		const MAX_RETRIES = 5;
		const RETRY_DELAY_MS = 1500;

		const delay = (ms: number) =>
			new Promise<void>((resolve) => setTimeout(resolve, ms));

		const resolvePreviewRoute = async () => {
			if (appPreviewRouteCandidates.length === 0) {
				setAppPreviewRoute(null);
				setIsResolvingPreviewRoute(false);
				return;
			}

			setIsResolvingPreviewRoute(true);

			for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
				if (cancelled) return;
				if (attempt > 0) {
					await delay(RETRY_DELAY_MS);
					if (cancelled) return;
				}

				for (const routeCandidate of appPreviewRouteCandidates) {
					const isReachable = await isRoutePreviewReachable(
						routeCandidate,
						abortController.signal,
					);
					if (cancelled) return;
					if (isReachable) {
						setAppPreviewRoute(routeCandidate);
						setIsResolvingPreviewRoute(false);
						return;
					}
				}
			}

			// All retries exhausted — use first candidate anyway
			if (!cancelled) {
				setAppPreviewRoute(appPreviewRouteCandidates[0] ?? null);
				setIsResolvingPreviewRoute(false);
			}
		};

		void resolvePreviewRoute();

		return () => {
			cancelled = true;
			abortController.abort();
		};
	}, [appPreviewRouteCandidates, run?.updatedAt]);

	const initialPreviewState = useMemo(
		() => normalizeStateModel(renderableOutput?.spec.state),
		[renderableOutput]
	);

	useEffect(() => {
		setPreviewState(initialPreviewState);
	}, [initialPreviewState]);

	const autoControls = useMemo(
		() =>
			renderableOutput && (appPreviewRoute === null || leftMode === "summary")
				? extractAutoControls(renderableOutput.spec, specOverrides)
				: [],
		[appPreviewRoute, leftMode, renderableOutput, specOverrides]
	);
	const hasOverrides = Object.keys(specOverrides.elements).length > 0;

	const handlePreviewStateChange = useCallback(
		(changes: Array<{ path: string; value: unknown }>) => {
			setPreviewState((previousState) => applyStateChanges(previousState, changes));
		},
		[]
	);

	const handleAutoControlChange = useCallback(
		(control: AutoControl, nextValue: unknown) => {
			if (!renderableOutput || appPreviewRoute !== null) {
				return;
			}

			const spec = renderableOutput.spec;
			setSpecOverrides((previousOverrides) => {
				const previousElements = previousOverrides.elements;
				let nextElements: SpecOverrides["elements"] = { ...previousElements };
				let hasChanges = false;

				const getCurrentOverride = (elementKey: string): ElementOverrideValue => {
					return nextElements[elementKey] ?? previousElements[elementKey] ?? {};
				};

				const setElementOverride = (
					elementKey: string,
					override: ElementOverrideValue | null | undefined,
				): void => {
					const normalizedCurrent = normalizeElementOverride(
						nextElements[elementKey] ?? previousElements[elementKey]
					);
					const normalizedNext = normalizeElementOverride(override);
					if (areValuesEqual(normalizedCurrent, normalizedNext)) {
						return;
					}

					hasChanges = true;
					if (normalizedNext) {
						nextElements = {
							...nextElements,
							[elementKey]: normalizedNext,
						};
					} else {
						const restElements = { ...nextElements };
						delete restElements[elementKey];
						nextElements = restElements;
					}
				};

				const setPropOverride = (
					elementKey: string,
					propName: string,
					value: unknown,
				): void => {
					const currentOverride = getCurrentOverride(elementKey);
					const currentProps = isObjectRecord(currentOverride.props)
						? { ...currentOverride.props }
						: {};
					const originalProps = getOriginalElementProps(spec, elementKey);
					if (areValuesEqual(value, originalProps[propName])) {
						delete currentProps[propName];
					} else {
						currentProps[propName] = value;
					}

					setElementOverride(elementKey, {
						...currentOverride,
						props: currentProps,
					});
				};

				if (control.kind === "visibility") {
					if (typeof nextValue !== "boolean") {
						return previousOverrides;
					}

					const originalChildren = getOriginalElementChildren(spec, control.parentKey);
					if (originalChildren.length === 0) {
						return previousOverrides;
					}

					const currentChildren = getCurrentElementChildren(spec, previousElements, control.parentKey);
					const nextChildrenSet = new Set(currentChildren);
					if (nextValue) {
						nextChildrenSet.add(control.childKey);
					} else {
						nextChildrenSet.delete(control.childKey);
					}

					const nextChildren = originalChildren.filter((childKey) => nextChildrenSet.has(childKey));
					const isUnchanged = areValuesEqual(nextChildren, originalChildren);
					const currentOverride = getCurrentOverride(control.parentKey);
					setElementOverride(control.parentKey, {
						...currentOverride,
						children: isUnchanged ? undefined : nextChildren,
					});
					return hasChanges ? { elements: nextElements } : previousOverrides;
				}

				if (control.kind === "text-edit") {
					if (typeof nextValue !== "string") {
						return previousOverrides;
					}
					setPropOverride(control.elementKey, control.propName, nextValue);
					return hasChanges ? { elements: nextElements } : previousOverrides;
				}

				if (control.kind === "tabs-label") {
					if (typeof nextValue !== "string") {
						return previousOverrides;
					}

					const mergedProps = getMergedElementProps(spec, previousElements, control.elementKey);
					const mergedTabs = Array.isArray(mergedProps.tabs)
						? mergedProps.tabs.map((tab) => (isObjectRecord(tab) ? { ...tab } : tab))
						: null;
					if (!mergedTabs || control.tabIndex < 0 || control.tabIndex >= mergedTabs.length) {
						return previousOverrides;
					}

					const currentTab = mergedTabs[control.tabIndex];
					if (!isObjectRecord(currentTab)) {
						return previousOverrides;
					}

					mergedTabs[control.tabIndex] = {
						...currentTab,
						label: nextValue,
					};
					setPropOverride(control.elementKey, "tabs", mergedTabs);
					return hasChanges ? { elements: nextElements } : previousOverrides;
				}

				if (control.kind === "select-prop") {
					if (
						typeof nextValue !== "string" ||
						!control.options.some((option) => option.value === nextValue)
					) {
						return previousOverrides;
					}
					setPropOverride(control.elementKey, control.propName, nextValue);
					return hasChanges ? { elements: nextElements } : previousOverrides;
				}

				if (control.kind === "number-prop") {
					if (typeof nextValue !== "number" || !Number.isFinite(nextValue)) {
						return previousOverrides;
					}
					const clampedValue = Math.min(control.max, Math.max(control.min, nextValue));
					setPropOverride(control.elementKey, control.propName, clampedValue);
					return hasChanges ? { elements: nextElements } : previousOverrides;
				}

				if (control.kind !== "component-swap" || typeof nextValue !== "string") {
					return previousOverrides;
				}

				if (!control.options.some((option) => option.value === nextValue)) {
					return previousOverrides;
				}

				const originalType = spec.elements[control.elementKey]?.type;
				if (typeof originalType !== "string" || originalType.trim().length === 0) {
					return previousOverrides;
				}

				const currentType = getElementType(spec, previousElements, control.elementKey) ?? originalType;
				const currentOverride = getCurrentOverride(control.elementKey);
				const currentOverrideProps = isObjectRecord(currentOverride.props)
					? { ...currentOverride.props }
					: {};
				const mergedProps = getMergedElementProps(spec, previousElements, control.elementKey);
				const originalProps = getOriginalElementProps(spec, control.elementKey);

				const mappedProps =
					control.category === "layout"
						? mapLayoutPropsForType(
								mergedProps,
								nextValue === "Grid" ? "Grid" : "Stack"
							)
						: mapChartPropsForType(mergedProps, nextValue);
				const mappedPropsRecord = mappedProps as Record<string, unknown>;
				const mappedKeys =
					control.category === "layout"
						? ["columns", "direction", "gap", "align", "justify", "padding", "className"]
						: ["title", "data", "xKey", "yKey", "nameKey", "valueKey", "aggregate", "color", "height"];

				for (const mappedKey of mappedKeys) {
					const mappedValue = mappedPropsRecord[mappedKey];
					if (mappedValue === undefined || mappedValue === null) {
						delete currentOverrideProps[mappedKey];
						continue;
					}

					if (areValuesEqual(mappedValue, originalProps[mappedKey])) {
						delete currentOverrideProps[mappedKey];
						continue;
					}

					currentOverrideProps[mappedKey] = mappedValue;
				}

				const nextType = nextValue === originalType ? undefined : nextValue;
				const nextOverride: ElementOverrideValue = {
					...currentOverride,
					type: nextType,
					props: currentOverrideProps,
				};

				if (control.category === "chart" && currentType !== nextValue) {
					const isChartType =
						nextValue === "BarChart" ||
						nextValue === "LineChart" ||
						nextValue === "AreaChart" ||
						nextValue === "PieChart";
					if (!isChartType) {
						return previousOverrides;
					}
				}

				if (control.category === "layout" && nextValue !== "Grid" && nextValue !== "Stack") {
					return previousOverrides;
				}

				setElementOverride(control.elementKey, nextOverride);
				return hasChanges ? { elements: nextElements } : previousOverrides;
			});
		},
		[appPreviewRoute, renderableOutput]
	);

	const handleReset = useCallback(() => {
		setPreviewState(initialPreviewState);
		setSpecOverrides({ elements: {} });
	}, [initialPreviewState]);

	return (
		<div className={cn("flex h-full min-h-0 flex-col gap-4 bg-surface p-4", className)}>
			<ContentTabBar
				leftMode={leftMode}
				onLeftModeChange={setLeftMode}
				panelMode={panelMode}
				onPanelModeChange={setPanelMode}
			/>
			<TwoPanelLayout
				leftMode={leftMode}
				panelMode={panelMode}
				isRunLoading={isRunLoading}
				plan={displayPlan}
				run={run}
				appPreviewRoute={appPreviewRoute}
				isResolvingPreviewRoute={isResolvingPreviewRoute}
				enableReactGrabInPreview={enableReactGrabInPreview}
				hasDraftPlan={run === null && fallbackPlan !== null}
				summaryContent={previewSummaryContent}
				renderableOutput={renderableOutput}
				previewState={previewState}
				specOverrides={specOverrides}
				autoControls={autoControls}
				hasOverrides={hasOverrides}
				onPreviewStateChange={handlePreviewStateChange}
				onAutoControlChange={handleAutoControlChange}
				onReset={handleReset}
			/>
		</div>
	);
}
