import type { AgentSessionItem } from "@/components/blocks/agent-session";
import type { ThirdPartyLogoName } from "@/components/ui/data/logo-third-party-data";

export const AGENT_SESSION_FILTER_AGENT_IDS = [
	"claude",
	"codex",
	"cursor",
	"copilot",
] as const;

export type AgentSessionFilterAgentId = (typeof AGENT_SESSION_FILTER_AGENT_IDS)[number];

export const AGENT_SESSION_FILTER_AGENT_OPTIONS = [
	{ brandName: "claude", id: "claude", name: "Claude" },
	{ brandName: "openai-codex", id: "codex", name: "Codex" },
	{ brandName: "cursor", id: "cursor", name: "Cursor" },
	{ brandName: "github-copilot", id: "copilot", name: "Copilot" },
] as const satisfies readonly Readonly<{
	brandName: ThirdPartyLogoName;
	id: AgentSessionFilterAgentId;
	name: string;
}>[];

export const AGENT_SESSION_FILTER_DAYS_PRESETS = [
	"today",
	"last-7-days",
	"last-30-days",
	"custom",
] as const;

export type AgentSessionFilterDaysPreset =
	(typeof AGENT_SESSION_FILTER_DAYS_PRESETS)[number];

export type AgentSessionFilterTriState = "yes" | "no" | null;

export const UNASSIGNED_OWNER_ID = "unassigned";

export const AGENT_SESSION_FILTER_OWNER_FACEPILE_MAX = 6;

export interface AgentSessionFilterOwner {
	readonly avatarSrc?: string;
	readonly id: string;
	readonly name: string;
}

export interface AgentSessionColumnFilterDays {
	readonly customEnd?: string;
	readonly customStart?: string;
	readonly endTime?: string;
	readonly preset: AgentSessionFilterDaysPreset | null;
	readonly startTime?: string;
}

export interface AgentSessionColumnFilterState {
	readonly agentIds: readonly AgentSessionFilterAgentId[];
	readonly containsArtifacts: AgentSessionFilterTriState;
	readonly days: AgentSessionColumnFilterDays;
	readonly hasLinkSuggestion: AgentSessionFilterTriState;
	readonly ownerIds: readonly string[];
}

export const EMPTY_AGENT_SESSION_COLUMN_FILTER: AgentSessionColumnFilterState = {
	agentIds: [],
	containsArtifacts: null,
	days: { preset: null },
	hasLinkSuggestion: null,
	ownerIds: [],
};

export const EMPTY_AGENT_SESSION_COLUMN_FILTER_DAYS: AgentSessionColumnFilterDays = {
	preset: null,
};

/**
 * The filter popover is a multi-select surface. Close on Escape, the trigger,
 * a true outside press, or a genuine focus-out (Tab past the last control).
 * Keep it open for in-menu clicks — including the focus-out Base UI emits
 * when option buttons remount with no related target — and for outside
 * presses that belong to the nested custom-range calendar portal.
 */
export function shouldKeepAgentSessionFilterMenuOpen({
	customCalendarOpen,
	focusOutStayedInside = false,
	nextOpen,
	reason,
}: Readonly<{
	customCalendarOpen: boolean;
	focusOutStayedInside?: boolean;
	nextOpen: boolean;
	reason: string | undefined;
}>): boolean {
	if (nextOpen) {
		return false;
	}
	switch (reason) {
		case "close-press":
		case "escape-key":
		case "trigger-press":
			return false;
		case "outside-press":
			return customCalendarOpen;
		case "focus-out":
			return focusOutStayedInside;
		default:
			return true;
	}
}

export interface AgentSessionColumnFilterContext {
	readonly getSuggestedWorkItemKey?: (item: AgentSessionItem) => string | undefined;
	readonly getSuggestedWorkItemKeys?: (
		item: AgentSessionItem,
	) => readonly string[] | undefined;
	readonly now?: Date;
}

export function toggleFilterId<T extends string>(
	ids: readonly T[],
	id: T,
): readonly T[] {
	return ids.includes(id) ? ids.filter((current) => current !== id) : [...ids, id];
}

export function toggleFilterTriState(
	current: AgentSessionFilterTriState,
	next: Exclude<AgentSessionFilterTriState, null>,
): AgentSessionFilterTriState {
	return current === next ? null : next;
}

/**
 * Overflow-style switches are binary. Map them onto the existing tri-state
 * field: on → `"yes"`, off → `null` (filter inactive). The previous Yes/No
 * `"no"` exclude path is not exposed in the toggle UI.
 */
export function agentSessionFilterToggleTriState(
	checked: boolean,
): AgentSessionFilterTriState {
	return checked ? "yes" : null;
}

export function agentSessionOwnerId(item: AgentSessionItem): string {
	if (item.invokedBy === undefined) {
		return UNASSIGNED_OWNER_ID;
	}

	return item.invokedBy.avatarSrc ?? item.invokedBy.name;
}

export function collectAgentSessionFilterOwners(
	items: readonly AgentSessionItem[],
): readonly AgentSessionFilterOwner[] {
	const owners: AgentSessionFilterOwner[] = [];
	const seen = new Set<string>();

	for (const item of items) {
		const id = agentSessionOwnerId(item);
		if (seen.has(id)) {
			continue;
		}
		seen.add(id);
		if (item.invokedBy === undefined) {
			owners.push({ id, name: "Unassigned" });
			continue;
		}
		owners.push({
			id,
			name: item.invokedBy.name,
			...(item.invokedBy.avatarSrc === undefined
				? {}
				: { avatarSrc: item.invokedBy.avatarSrc }),
		});
	}

	return owners;
}

export function resolveAgentSessionFilterAgentId(
	item: AgentSessionItem,
): AgentSessionFilterAgentId | null {
	switch (item.agent.brandName) {
		case "claude":
			return "claude";
		case "openai-codex":
			return "codex";
		case "cursor":
			return "cursor";
		case "github-copilot":
			return "copilot";
		default:
			break;
	}

	const rawId = item.agent.id?.toLocaleLowerCase();
	switch (rawId) {
		case "claude":
			return "claude";
		case "codex":
		case "openai-codex":
			return "codex";
		case "cursor":
			return "cursor";
		case "copilot":
		case "github-copilot":
			return "copilot";
		default:
			break;
	}

	const name = item.agent.name.toLocaleLowerCase();
	if (name === "claude") {
		return "claude";
	}
	if (name === "codex") {
		return "codex";
	}
	if (name === "cursor") {
		return "cursor";
	}
	if (name.includes("copilot")) {
		return "copilot";
	}

	return null;
}

export function agentSessionContainsArtifacts(item: AgentSessionItem): boolean {
	return item.prStatus !== undefined
		|| item.sessionDetails?.pullRequestNumber !== undefined
		|| Boolean(item.sessionDetails?.worktreePath);
}

function resolveFilterWorkItemKey(
	item: AgentSessionItem,
	getSuggestedWorkItemKey?: (item: AgentSessionItem) => string | undefined,
	getSuggestedWorkItemKeys?: (item: AgentSessionItem) => readonly string[] | undefined,
): string | undefined {
	const firstKey = getSuggestedWorkItemKeys?.(item)?.[0];
	if (firstKey !== undefined) {
		return firstKey;
	}

	return getSuggestedWorkItemKey?.(item) ?? item.sessionDetails?.issueKey;
}

export function agentSessionHasLinkSuggestion(
	item: AgentSessionItem,
	getSuggestedWorkItemKey?: (item: AgentSessionItem) => string | undefined,
	getSuggestedWorkItemKeys?: (item: AgentSessionItem) => readonly string[] | undefined,
): boolean {
	return resolveFilterWorkItemKey(
		item,
		getSuggestedWorkItemKey,
		getSuggestedWorkItemKeys,
	) !== undefined;
}

export function toLocalIsoDate(date: Date): string {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
}

function startOfLocalDay(date: Date): Date {
	return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function endOfLocalDay(date: Date): Date {
	return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
}

function shiftLocalDays(date: Date, days: number): Date {
	return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

function parseLocalIsoDate(isoDate: string): Date | null {
	const match = /^(\d{4})-(\d{2})-(\d{2})$/u.exec(isoDate);
	if (!match) {
		return null;
	}
	const year = Number(match[1]);
	const month = Number(match[2]);
	const day = Number(match[3]);
	const date = new Date(year, month - 1, day);
	if (
		date.getFullYear() !== year
		|| date.getMonth() !== month - 1
		|| date.getDate() !== day
	) {
		return null;
	}
	return date;
}

function withLocalTime(
	date: Date,
	time: string | undefined,
	edge: "end" | "start",
): Date {
	if (time === undefined) {
		return edge === "start" ? startOfLocalDay(date) : endOfLocalDay(date);
	}
	const match = /^(\d{2}):(\d{2})$/u.exec(time);
	if (!match) {
		return edge === "start" ? startOfLocalDay(date) : endOfLocalDay(date);
	}
	const hours = Number(match[1]);
	const minutes = Number(match[2]);
	return new Date(
		date.getFullYear(),
		date.getMonth(),
		date.getDate(),
		hours,
		minutes,
		edge === "end" ? 59 : 0,
		edge === "end" ? 999 : 0,
	);
}

export function isAgentSessionColumnFilterDaysActive(
	days: AgentSessionColumnFilterDays,
): boolean {
	if (days.preset === null) {
		return false;
	}
	if (days.preset !== "custom") {
		return true;
	}
	return Boolean(days.customStart && days.customEnd);
}

export function resolveAgentSessionFilterDaysRange(
	days: AgentSessionColumnFilterDays,
	now: Date,
): { readonly end: Date; readonly start: Date } | null {
	if (days.preset === null) {
		return null;
	}

	switch (days.preset) {
		case "today":
			return { end: endOfLocalDay(now), start: startOfLocalDay(now) };
		case "last-7-days":
			return {
				end: endOfLocalDay(now),
				start: startOfLocalDay(shiftLocalDays(now, -6)),
			};
		case "last-30-days":
			return {
				end: endOfLocalDay(now),
				start: startOfLocalDay(shiftLocalDays(now, -29)),
			};
		case "custom": {
			if (!days.customStart || !days.customEnd) {
				return null;
			}
			const start = parseLocalIsoDate(days.customStart);
			const end = parseLocalIsoDate(days.customEnd);
			if (!start || !end) {
				return null;
			}
			const ordered = start.getTime() <= end.getTime()
				? { end, start }
				: { end: start, start: end };
			return {
				end: withLocalTime(ordered.end, days.endTime, "end"),
				start: withLocalTime(ordered.start, days.startTime, "start"),
			};
		}
		default: {
			const exhaustive: never = days.preset;
			return exhaustive;
		}
	}
}

export function resolveAgentSessionTimestampMs(
	item: AgentSessionItem,
	now: Date,
): number | undefined {
	if (item.startedAtMs !== undefined) {
		return item.startedAtMs;
	}
	if (item.completedAtMs !== undefined) {
		return item.completedAtMs;
	}
	if (item.completedSecondsAgo !== undefined) {
		return now.getTime() - item.completedSecondsAgo * 1000;
	}
	return undefined;
}

export function countAgentSessionColumnFilterSelections(
	filter: AgentSessionColumnFilterState,
): number {
	return filter.ownerIds.length
		+ filter.agentIds.length
		+ (isAgentSessionColumnFilterDaysActive(filter.days) ? 1 : 0)
		+ (filter.containsArtifacts === null ? 0 : 1)
		+ (filter.hasLinkSuggestion === null ? 0 : 1);
}

function matchesTriState(value: boolean, state: AgentSessionFilterTriState): boolean {
	if (state === null) {
		return true;
	}
	return state === "yes" ? value : !value;
}

export function applyAgentSessionColumnFilter(
	items: readonly AgentSessionItem[],
	filter: AgentSessionColumnFilterState,
	context: AgentSessionColumnFilterContext = {},
): readonly AgentSessionItem[] {
	if (countAgentSessionColumnFilterSelections(filter) === 0) {
		return items;
	}

	const now = context.now ?? new Date();
	const daysRange = resolveAgentSessionFilterDaysRange(filter.days, now);
	const ownerIds = new Set(filter.ownerIds);
	const agentIds = new Set(filter.agentIds);

	return items.filter((item) => {
		if (ownerIds.size > 0 && !ownerIds.has(agentSessionOwnerId(item))) {
			return false;
		}

		if (agentIds.size > 0) {
			const agentId = resolveAgentSessionFilterAgentId(item);
			if (agentId === null || !agentIds.has(agentId)) {
				return false;
			}
		}

		if (daysRange) {
			const timestampMs = resolveAgentSessionTimestampMs(item, now);
			if (
				timestampMs === undefined
				|| timestampMs < daysRange.start.getTime()
				|| timestampMs > daysRange.end.getTime()
			) {
				return false;
			}
		}

		if (!matchesTriState(
			agentSessionContainsArtifacts(item),
			filter.containsArtifacts,
		)) {
			return false;
		}

		if (!matchesTriState(
			agentSessionHasLinkSuggestion(
				item,
				context.getSuggestedWorkItemKey,
				context.getSuggestedWorkItemKeys,
			),
			filter.hasLinkSuggestion,
		)) {
			return false;
		}

		return true;
	});
}
