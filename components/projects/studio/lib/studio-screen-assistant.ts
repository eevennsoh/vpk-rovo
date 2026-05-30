"use client";

import type { RovoDataParts } from "@/lib/rovo-ui-messages";

export const SCREEN_ASSISTANT_TARGET_ATTR = "data-screen-assistant-target";
export const SCREEN_ASSISTANT_AGENT_FIELD_ATTR = "data-agent-field";

export type StudioScreenAssistantCoordinateSpace = "screenshot" | "viewport";

export interface StudioScreenAssistantPoint {
	x: number;
	y: number;
	label: string;
	coordinateSpace?: StudioScreenAssistantCoordinateSpace;
}

export interface StudioScreenAssistantRect {
	x: number;
	y: number;
	width: number;
	height: number;
}

export interface StudioScreenAssistantTarget {
	id?: string;
	fieldId?: string;
	label?: string;
	role?: string;
	rect?: StudioScreenAssistantRect;
}

export interface StudioScreenAssistantPointerContext {
	x: number | null;
	y: number | null;
	viewport: {
		width: number;
		height: number;
		scrollX: number;
		scrollY: number;
	};
	target: StudioScreenAssistantTarget | null;
}

export interface StudioScreenAssistantVisibleTarget extends StudioScreenAssistantTarget {
	id: string;
}

export interface StudioScreenAssistantScreenContext {
	route: "/studio";
	activePanel: string;
	selectedAgent?: {
		id: string;
		name: string;
	};
	composer?: {
		placeholder?: string;
		hasPrefill?: boolean;
	};
	activeAgentDraft?: Pick<
		RovoDataParts["agent-result"],
		| "agentId"
		| "name"
		| "description"
		| "summary"
		| "instructions"
		| "contextDescription"
		| "trigger"
		| "guardrail"
		| "tools"
		| "conversationStarters"
		| "action"
	>;
}

export interface StudioScreenAssistantSnapshot {
	screenContext: StudioScreenAssistantScreenContext;
	pointerContext: StudioScreenAssistantPointerContext | null;
	visibleTargets: StudioScreenAssistantVisibleTarget[];
}

export interface StudioScreenAssistantResult {
	turnId: string;
	text: string;
	point?: StudioScreenAssistantPoint;
	target?: StudioScreenAssistantTarget;
	agentDraftPatch?: Partial<RovoDataParts["agent-result"]>;
}

export interface StudioScreenAssistantSnapshotInput {
	activeAgentDraft?: RovoDataParts["agent-result"] | null;
	activePanel: string;
	composer?: {
		placeholder?: string;
		hasPrefill?: boolean;
	};
	pointer?: {
		x: number;
		y: number;
	} | null;
	selectedAgent?: {
		id: string;
		name: string;
	} | null;
}

type AgentDraftPatch = Partial<RovoDataParts["agent-result"]>;

const ALLOWED_TEXT_FIELDS = [
	"name",
	"description",
	"summary",
	"instructions",
	"contextDescription",
	"trigger",
	"guardrail",
	"byline",
] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeText(value: unknown): string | undefined {
	if (typeof value !== "string") {
		return undefined;
	}
	const trimmed = value.trim();
	return trimmed.length > 0 ? trimmed : undefined;
}

function normalizeTextArray(value: unknown): string[] | undefined {
	if (!Array.isArray(value)) {
		return undefined;
	}
	const items = value
		.map((item) => normalizeText(item))
		.filter((item): item is string => Boolean(item));
	return items.length > 0 ? items : undefined;
}

function normalizeAvatarFallback(value: unknown): RovoDataParts["agent-result"]["avatarFallback"] | undefined {
	if (!isRecord(value)) {
		return undefined;
	}
	const avatarFallback: NonNullable<RovoDataParts["agent-result"]["avatarFallback"]> = {};
	for (const field of ["initials", "backgroundColor", "iconName", "label"] as const) {
		const normalized = normalizeText(value[field]);
		if (normalized) {
			avatarFallback[field] = normalized;
		}
	}
	return Object.keys(avatarFallback).length > 0 ? avatarFallback : undefined;
}

export function normalizeAgentDraftPatch(value: unknown): AgentDraftPatch | null {
	if (!isRecord(value)) {
		return null;
	}

	const patch: AgentDraftPatch = {};

	for (const field of ALLOWED_TEXT_FIELDS) {
		const normalized = normalizeText(value[field]);
		if (normalized) {
			patch[field] = normalized;
		}
	}

	const tools = normalizeTextArray(value.tools);
	if (tools) {
		patch.tools = tools;
	}

	const conversationStarters = normalizeTextArray(value.conversationStarters);
	if (conversationStarters) {
		patch.conversationStarters = conversationStarters;
	}

	const avatarFallback = normalizeAvatarFallback(value.avatarFallback);
	if (avatarFallback) {
		patch.avatarFallback = avatarFallback;
	}

	if (value.action === "create" || value.action === "update") {
		patch.action = value.action;
	}

	return Object.keys(patch).length > 0 ? patch : null;
}

function normalizeRect(rect: DOMRect | ClientRect): StudioScreenAssistantRect | null {
	if (rect.width <= 0 || rect.height <= 0) {
		return null;
	}
	return {
		x: Math.round(rect.x),
		y: Math.round(rect.y),
		width: Math.round(rect.width),
		height: Math.round(rect.height),
	};
}

function getElementText(element: Element): string | undefined {
	const ariaLabel = normalizeText(element.getAttribute("aria-label"));
	if (ariaLabel) {
		return ariaLabel;
	}

	const labelledBy = normalizeText(element.getAttribute("aria-labelledby"));
	if (labelledBy && typeof document !== "undefined") {
		const label = labelledBy
			.split(/\s+/u)
			.map((id) => document.getElementById(id)?.textContent ?? "")
			.join(" ");
		const normalizedLabel = normalizeText(label);
		if (normalizedLabel) {
			return normalizedLabel;
		}
	}

	const placeholder = normalizeText((element as { placeholder?: unknown }).placeholder);
	if (placeholder) {
		return placeholder;
	}

	const title = normalizeText(element.getAttribute("title"));
	if (title) {
		return title;
	}

	const innerText = normalizeText((element as { innerText?: unknown }).innerText);
	if (innerText) {
		return innerText.slice(0, 160);
	}

	return normalizeText(element.textContent)?.slice(0, 160);
}

function targetFromElement(element: Element): StudioScreenAssistantTarget | null {
	const rect = normalizeRect(element.getBoundingClientRect());
	if (!rect) {
		return null;
	}

	const id =
		normalizeText(element.getAttribute(SCREEN_ASSISTANT_TARGET_ATTR)) ??
		normalizeText(element.getAttribute("data-testid")) ??
		normalizeText(element.id);
	const fieldId = normalizeText(element.getAttribute(SCREEN_ASSISTANT_AGENT_FIELD_ATTR));
	const label = getElementText(element);
	const role = normalizeText(element.getAttribute("role")) ?? element.tagName.toLowerCase();

	return {
		...(id ? { id } : {}),
		...(fieldId ? { fieldId } : {}),
		...(label ? { label } : {}),
		role,
		rect,
	};
}

export function getStudioScreenAssistantPointerContext(
	pointer?: { x: number; y: number } | null,
): StudioScreenAssistantPointerContext | null {
	if (typeof window === "undefined" || typeof document === "undefined") {
		return null;
	}

	const viewport = {
		width: window.innerWidth,
		height: window.innerHeight,
		scrollX: window.scrollX,
		scrollY: window.scrollY,
	};
	const x = pointer ? Math.round(pointer.x) : null;
	const y = pointer ? Math.round(pointer.y) : null;
	const element = x !== null && y !== null ? document.elementFromPoint(x, y) : null;

	return {
		x,
		y,
		viewport,
		target: element ? targetFromElement(element) : null,
	};
}

// Interactive/landmark elements worth surfacing to the model even when they
// are not explicitly tagged with a screen-assistant attribute. This lets the
// assistant "see" and point at general chrome (profile avatar, nav, search,
// Create button, agent cards) — not only the composer.
const AUTO_TARGET_SELECTOR = [
	"button",
	"a[href]",
	"[role='button']",
	"[role='link']",
	"[role='tab']",
	"[role='menuitem']",
	"[role='switch']",
	"input:not([type='hidden'])",
	"select",
	"textarea",
	"img[alt]",
	"[aria-label]",
	"[data-testid]",
].join(", ");

function isVisibleInViewport(element: Element): boolean {
	if (typeof window === "undefined") {
		return false;
	}
	const rect = element.getBoundingClientRect();
	if (rect.width <= 0 || rect.height <= 0) {
		return false;
	}
	// Must intersect the current viewport.
	if (
		rect.bottom <= 0 ||
		rect.right <= 0 ||
		rect.top >= window.innerHeight ||
		rect.left >= window.innerWidth
	) {
		return false;
	}
	const style = window.getComputedStyle(element);
	if (style.visibility === "hidden" || style.display === "none" || style.opacity === "0") {
		return false;
	}
	return true;
}

function slugifyTargetId(role: string, label: string): string {
	const base = `${role}-${label}`
		.toLowerCase()
		.replace(/[^a-z0-9]+/gu, "-")
		.replace(/(^-+|-+$)/gu, "")
		.slice(0, 60);
	return `auto:${base || role}`;
}

export function getStudioScreenAssistantVisibleTargets(
	limit = 60,
): StudioScreenAssistantVisibleTarget[] {
	if (typeof document === "undefined") {
		return [];
	}

	const targets: StudioScreenAssistantVisibleTarget[] = [];
	const seenElements = new Set<Element>();
	const seenIds = new Set<string>();

	const push = (element: Element, id: string, target: StudioScreenAssistantTarget) => {
		if (seenElements.has(element) || seenIds.has(id)) {
			return;
		}
		seenElements.add(element);
		seenIds.add(id);
		targets.push({ ...target, id });
	};

	// 1) Explicitly tagged targets take priority (stable ids/fieldIds).
	const tagged = Array.from(
		document.querySelectorAll(
			`[${SCREEN_ASSISTANT_TARGET_ATTR}], [${SCREEN_ASSISTANT_AGENT_FIELD_ATTR}]`,
		),
	);
	for (const element of tagged) {
		if (targets.length >= limit) {
			return targets;
		}
		const target = targetFromElement(element);
		const id =
			target?.id ??
			target?.fieldId ??
			normalizeText(element.getAttribute(SCREEN_ASSISTANT_TARGET_ATTR)) ??
			normalizeText(element.getAttribute(SCREEN_ASSISTANT_AGENT_FIELD_ATTR));
		if (target && id) {
			push(element, id, target);
		}
	}

	// 2) Auto-detected interactive/landmark elements visible in the viewport.
	const auto = Array.from(document.querySelectorAll(AUTO_TARGET_SELECTOR));
	for (const element of auto) {
		if (targets.length >= limit) {
			break;
		}
		if (seenElements.has(element) || !isVisibleInViewport(element)) {
			continue;
		}
		const target = targetFromElement(element);
		if (!target) {
			continue;
		}
		// Require something the model can refer to: a label, an explicit id, or a
		// test id. Skip unlabeled structural noise.
		const label = target.label;
		const id =
			target.id ??
			(label ? slugifyTargetId(target.role ?? "element", label) : null);
		if (!id || (!label && !target.id)) {
			continue;
		}
		push(element, id, target);
	}

	return targets;
}

export function groundStudioScreenAssistantTarget(input: {
	fieldId?: string;
	id?: string;
	label?: string;
	pointerTarget?: StudioScreenAssistantTarget | null;
	visibleTargets: readonly StudioScreenAssistantVisibleTarget[];
}): StudioScreenAssistantTarget | null {
	const byId = input.id
		? input.visibleTargets.find((target) => target.id === input.id)
		: null;
	if (byId) {
		return byId;
	}

	const byField = input.fieldId
		? input.visibleTargets.find((target) => target.fieldId === input.fieldId || target.id === input.fieldId)
		: null;
	if (byField) {
		return byField;
	}

	const normalizedLabel = normalizeText(input.label)?.toLowerCase();
	const byLabel = normalizedLabel
		? input.visibleTargets.find((target) => target.label?.toLowerCase().includes(normalizedLabel))
		: null;
	if (byLabel) {
		return byLabel;
	}

	return input.pointerTarget ?? null;
}

function summarizeAgentDraft(
	draft: RovoDataParts["agent-result"] | null | undefined,
): StudioScreenAssistantScreenContext["activeAgentDraft"] | undefined {
	if (!draft) {
		return undefined;
	}

	return {
		agentId: draft.agentId,
		name: draft.name,
		description: draft.description,
		summary: draft.summary,
		instructions: draft.instructions,
		contextDescription: draft.contextDescription,
		trigger: draft.trigger,
		guardrail: draft.guardrail,
		tools: draft.tools,
		conversationStarters: draft.conversationStarters,
		action: draft.action,
	};
}

export function createStudioScreenAssistantSnapshot({
	activeAgentDraft,
	activePanel,
	composer,
	pointer,
	selectedAgent,
}: StudioScreenAssistantSnapshotInput): StudioScreenAssistantSnapshot {
	return {
		screenContext: {
			route: "/studio",
			activePanel,
			...(selectedAgent ? { selectedAgent } : {}),
			...(composer ? { composer } : {}),
			...(activeAgentDraft ? { activeAgentDraft: summarizeAgentDraft(activeAgentDraft) } : {}),
		},
		pointerContext: getStudioScreenAssistantPointerContext(pointer),
		visibleTargets: getStudioScreenAssistantVisibleTargets(),
	};
}
