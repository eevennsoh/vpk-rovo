import type { AgentSessionItem } from "./agent-session-types";

export type ApproveUnavailableReason =
	| "already-attached"
	| "no-suggestion"
	| "unknown-work-item";

export type ApproveTarget<T = unknown> =
	| { readonly kind: "work-item"; readonly key: string; readonly target: T }
	| { readonly kind: "unavailable"; readonly reason: ApproveUnavailableReason };

export interface ApproveContext<T = unknown> {
	readonly capturedItemIds?: ReadonlySet<string>;
	readonly getSuggestedWorkItemKey?: (item: AgentSessionItem) => string | undefined;
	readonly getSuggestedWorkItemKeys?: (item: AgentSessionItem) => readonly string[] | undefined;
	readonly locateTarget: (session: AgentSessionItem, workItemKey: string) => T | undefined;
}

function resolveSuggestedWorkItemKey(
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

export function resolveApproveTarget<T>(
	item: AgentSessionItem,
	context: ApproveContext<T>,
): ApproveTarget<T> {
	if (context.capturedItemIds?.has(item.id)) {
		return { kind: "unavailable", reason: "already-attached" };
	}

	const key = resolveSuggestedWorkItemKey(
		item,
		context.getSuggestedWorkItemKey,
		context.getSuggestedWorkItemKeys,
	);
	if (key === undefined) {
		return { kind: "unavailable", reason: "no-suggestion" };
	}

	const target = context.locateTarget(item, key);
	if (target === undefined) {
		return { kind: "unavailable", reason: "unknown-work-item" };
	}

	return { kind: "work-item", key, target };
}

export function approveActionLabel<T>(target: ApproveTarget<T>): string {
	switch (target.kind) {
		case "work-item":
			return `Link to ${target.key}`;
		case "unavailable":
			switch (target.reason) {
				case "already-attached":
					return "Already linked";
				case "no-suggestion":
					return "No suggested work item";
				case "unknown-work-item":
					return "Suggested work item is not on the board";
				default: {
					const exhaustive: never = target.reason;
					return exhaustive;
				}
			}
		default: {
			const exhaustive: never = target;
			return exhaustive;
		}
	}
}
