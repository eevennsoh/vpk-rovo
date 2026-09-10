"use client";

import { useCallback, useId, useMemo, useState } from "react";

import { isCodingAgentListItem } from "@/components/blocks/agent-list";
import {
	createJiraSessionFlyoutHandle,
	JiraSessionFlyoutSurface,
	JiraSessionFlyoutTrigger,
} from "@/components/blocks/product-sidebar/variants/jira-session-flyout";
import { token } from "@/lib/tokens";
import { cn } from "@/lib/utils";

import { AGENT_SESSION_ATTACHED_ITEMS, AGENT_SESSION_ITEMS } from "./data";
import { AgentSessionCard } from "./agent-session-card";
import { useAgentSessionScrollPreview } from "./use-agent-session-scroll-preview";
import { AgentSessionCompactCard } from "./agent-session-compact-card";
import {
	bindAgentSessionFlyoutActions,
	resolveAgentSessionWorkItemKey,
	toAgentSessionUntrackedWorkFlyoutItem,
} from "./agent-session-work-item";
import type {
	AgentSessionItem,
	AgentSessionProps,
} from "./agent-session-types";

/**
 * Past this many arrivals the group lands together instead of stepping in.
 * Eight staggered cards is half a second of competing focal points, which is
 * the opposite of the one-focal-point rule the beat exists to serve.
 */
const ARRIVAL_STAGGER_LIMIT = 4;

/** Seconds between staggered arrivals. */
const ARRIVAL_STAGGER_SECONDS = 0.06;

/**
 * Arrival order for the ids in `newItemIds`, as a delay in seconds.
 *
 * Keyed by id rather than list index so the delay follows the card if the host
 * re-sorts, and so a card that is not new never carries one at all.
 */
function buildArrivalDelays(
	items: readonly AgentSessionItem[],
	newItemIds: ReadonlySet<string> | undefined,
): ReadonlyMap<string, number> {
	if (newItemIds === undefined || newItemIds.size === 0) {
		return new Map<string, number>();
	}

	const arrivals = items.filter((item: AgentSessionItem) => newItemIds.has(item.id));
	const shouldStagger = arrivals.length <= ARRIVAL_STAGGER_LIMIT;

	return new Map(arrivals.map((item: AgentSessionItem, index: number) => [
		item.id,
		shouldStagger ? index * ARRIVAL_STAGGER_SECONDS : 0,
	]));
}

/**
 * Local coding sessions that never became work items.
 *
 * Large sessions are solid uncaptured-work cards: the shared Agent List row
 * (identity, optional linked PR metadata, and timestamp) sits on a single surface and reveals
 * the same hover/focus action pair Agent List rows use — Resume, plus
 * Archive / Unarchive where Agent List puts Archive. Work-item capture lives on the
 * shared untracked-work session flyout, the same surface
 * `components/blocks/agent-session-flyout` uses, so hovering a card offers
 * Link / Create / Add as a subtask without a footer chin. Medium detached keeps
 * that uncaptured relationship in the Jira Agents compact row: a 276×33
 * surface card with a solid disabled stroke, and Create / Add as a subtask
 * from a hover more menu. Medium attached reuses the Jira Issue activity row
 * and its assignment hover — the Assign agent footer appears when the host
 * supplies `assignment.onAssignedAgentIdsChange`. Work-item capture is already
 * the card. Small is the collapsed-column identity notch.
 */
export function AgentSession({
	className,
	items: itemsProp,
	arrivingItemIds,
	assignment,
	canViewItem,
	capturedItemIds,
	density = "short",
	getResumeCommand,
	getSuggestedWorkItemKey,
	getSuggestedWorkItemKeys,
	highlightedItemId,
	issueKey,
	isResumable,
	newItemIds,
	onContinueInAgent,
	onCopyResume,
	onArchiveSession,
	onCreateWorkItem,
	onArrivalComplete,
	onDeleteSession,
	onLinkWorkItem,
	onRenameSession,
	onSubtasks,
	onItemHover,
	onSelectedItemIdChange,
	onToggleVisibility,
	onUnlinkSession,
	onView,
	rowTriage,
	selectedItemId: selectedItemIdProp,
	sessionDrag,
	draggingIds,
	showUntrackedWorkFooter,
	style,
	variant = "large",
	visibilityLabel,
}: Readonly<AgentSessionProps>) {
	const isAttached = variant === "medium-attached";
	const items = itemsProp ?? (isAttached ? AGENT_SESSION_ATTACHED_ITEMS : AGENT_SESSION_ITEMS);
	const isSelectionControlled = selectedItemIdProp !== undefined;
	const [uncontrolledSelectedItemId, setUncontrolledSelectedItemId] = useState<string | null>(
		null,
	);
	const selectedItemId = isSelectionControlled ? selectedItemIdProp : uncontrolledSelectedItemId;
	// Card-body activation is the only select/deselect path. Hover Resume /
	// Archive stay on their own controls so they cannot flip the highlight.
	const handleView = useCallback((item: AgentSessionItem) => {
		const nextId = selectedItemId === item.id ? null : item.id;
		if (!isSelectionControlled) {
			setUncontrolledSelectedItemId((current) => (current === item.id ? null : item.id));
		}
		onSelectedItemIdChange?.(nextId);
		// Deselect is not another view. Calling onView here would re-spotlight
		// the related issue and leave the board dimmed.
		if (nextId !== null) {
			onView?.(item);
		}
	}, [isSelectionControlled, onSelectedItemIdChange, onView, selectedItemId]);
	// The beat runs for arrivals the viewer has not seen yet; the mark stays on
	// every unreviewed id. A host that never unmounts the list can pass one set.
	const beatItemIds = arrivingItemIds ?? newItemIds;
	const arrivalDelays = useMemo(
		() => buildArrivalDelays(items, beatItemIds),
		[items, beatItemIds],
	);
	// One payload-aware flyout for the whole list, as Agent List and the
	// Agent Session flyout block do: the popup stays mounted and follows the
	// hovered card, so sliding down the list crossfades instead of remounting.
	const [flyoutHandle] = useState(createJiraSessionFlyoutHandle);
	const scrollPreview = useAgentSessionScrollPreview(flyoutHandle);
	const flyoutActions = useMemo(
		() => bindAgentSessionFlyoutActions(items, {
			capturedItemIds,
			onArchiveSession,
			onCreateWorkItem,
			onLinkWorkItem,
			onSubtasks,
		}),
		[capturedItemIds, items, onArchiveSession, onCreateWorkItem, onLinkWorkItem, onSubtasks],
	);
	const isMultiSelectList = items.some(
		(item: AgentSessionItem) => rowTriage?.get(item.id)?.mark != null,
	);
	const selectionHintId = useId();

	return (
		<>
			{isMultiSelectList ? (
				<p className="sr-only" id={selectionHintId}>
					Click additional sessions to add or remove them. Shift-click selects
					a range. Command-click on a Mac, or Control-click on Windows, also
					adds or removes individual sessions. Arrow keys move the selection.
					Shift-arrow extends it. Command-A or Control-A selects all. Escape
					clears.
				</p>
			) : null}
			<ul
				aria-describedby={isMultiSelectList ? selectionHintId : undefined}
				aria-multiselectable={isMultiSelectList ? true : undefined}
				className={cn(
					"flex flex-col",
					variant === "large"
						? "gap-0"
						: variant === "medium-detached"
							? undefined
							: "gap-2",
					isMultiSelectList ? "select-none" : null,
					className,
				)}
				data-variant={variant}
				role={isMultiSelectList ? "grid" : undefined}
				// Large defaults to flush. Column and panel hosts override
				// `gap-0` via `listClassName` (`gap-1 p-1`) so marked rows can
				// fuse. Detached compact rows sit 2px apart (`space.025`).
				style={variant === "medium-detached"
					? { ...style, gap: token("space.025") }
					: style}
			>
				{items.map((item: AgentSessionItem) => {
					const itemOnView = isCodingAgentListItem(item)
						? onView === undefined
							? undefined
							: handleView
						: onView === undefined || (canViewItem !== undefined && !canViewItem(item))
							? undefined
							: handleView;

					if (variant === "large") {
						const flyoutSession = toAgentSessionUntrackedWorkFlyoutItem(
							item,
							resolveAgentSessionWorkItemKey(
								item,
								getSuggestedWorkItemKey,
								getSuggestedWorkItemKeys,
							),
						);
						return (
							<AgentSessionCard
								arrivalDelaySeconds={arrivalDelays.get(item.id)}
								captured={capturedItemIds?.has(item.id) ?? false}
								density={density}
								flyoutHandle={flyoutHandle}
								flyoutSession={flyoutSession}
								getResumeCommand={getResumeCommand}
								isArriving={beatItemIds?.has(item.id) ?? false}
								isHighlighted={item.id === highlightedItemId}
								isNew={newItemIds?.has(item.id) ?? false}
								isResumable={isResumable}
								isSelected={item.id === selectedItemId}
								item={item}
								key={item.id}
								onContinueInAgent={onContinueInAgent}
								onCopyResume={onCopyResume}
								onDeleteSession={onDeleteSession}
								onArrivalComplete={onArrivalComplete === undefined
									? undefined
									: () => onArrivalComplete(item.id)}
								onItemHover={onItemHover}
								onRenameSession={onRenameSession}
								onToggleVisibility={onToggleVisibility}
								onUnlinkSession={onUnlinkSession}
								onView={itemOnView}
								sessionDrag={sessionDrag}
								triageRow={rowTriage?.get(item.id)}
								draggingIds={draggingIds}
								visibilityLabel={visibilityLabel}
							/>
						);
					}

					const compactCard = (
						<AgentSessionCompactCard
							assignment={isAttached ? assignment : undefined}
							captured={capturedItemIds?.has(item.id) ?? false}
							flyout={!isAttached}
							isArriving={beatItemIds?.has(item.id) ?? false}
							// The column and the board hold the same session ids, so an id
							// match is the whole relationship test: hovering an Untracked
							// card lights its twin beside the work item it already names.
							isHighlighted={item.id === highlightedItemId}
							isNew={newItemIds?.has(item.id) ?? false}
							issueKey={issueKey}
							item={item}
							onAttach={onLinkWorkItem
								? () => onLinkWorkItem(
									item,
									resolveAgentSessionWorkItemKey(
										item,
										getSuggestedWorkItemKey,
										getSuggestedWorkItemKeys,
									),
								)
								: undefined}
							onCreateWorkItem={onCreateWorkItem}
							onItemHover={variant === "medium-detached" ? onItemHover : undefined}
							onSubtasks={onSubtasks}
							onView={itemOnView}
							sessionDrag={variant === "medium-detached" ? sessionDrag : undefined}
							variant={variant}
						/>
					);

					if (isAttached) {
						return (
							<li data-testid={"agent-session-row-" + item.id} key={item.id}>
								{compactCard}
							</li>
						);
					}

					const flyoutSession = toAgentSessionUntrackedWorkFlyoutItem(
						item,
						resolveAgentSessionWorkItemKey(
							item,
							getSuggestedWorkItemKey,
							getSuggestedWorkItemKeys,
						),
					);

					return (
						<JiraSessionFlyoutTrigger
							closeDelay={160}
							handle={flyoutHandle}
							key={item.id}
							render={<li data-testid={"agent-session-row-" + item.id} />}
							session={flyoutSession}
						>
							{compactCard}
						</JiraSessionFlyoutTrigger>
					);
				})}
			</ul>
			{/*
				`instantPosition` keeps this list's flyout identical to the one the
				collapsed rail shows: no enter, exit, reposition, or content-crossfade
				motion. Both surfaces are hovered row-to-row at the same rate, so an
				animated shell reads as lag rather than as a transition, and collapsing
				the column would otherwise swap motion profiles mid-hover.
			*/}
			{isAttached ? null : (
				<JiraSessionFlyoutSurface
					{...scrollPreview}
					archiveActionLabel={visibilityLabel}
					capturedSessionIds={capturedItemIds}
					content="untracked-work"
					handle={flyoutHandle}
					instantPosition
					onAddAsSubtask={flyoutActions.onAddAsSubtask}
					onArchiveSession={flyoutActions.onArchiveSession}
					onCreateWorkItem={flyoutActions.onCreateWorkItem}
					onLinkWorkItem={flyoutActions.onLinkWorkItem}
					showUntrackedWorkFooter={showUntrackedWorkFooter}
				/>
			)}
		</>
	);
}

export { AGENT_SESSION_ATTACHED_ITEMS, AGENT_SESSION_CLOUD_ITEMS, AGENT_SESSION_ITEMS, AGENT_SESSION_MULTI_LINK_KEYS } from "./data";
export { approveActionLabel, resolveApproveTarget } from "./agent-session-approve";
export type { ApproveTarget, ApproveUnavailableReason } from "./agent-session-approve";
export { AgentSessionCard } from "./agent-session-card";
export {
	AGENT_SESSION_STATUS_LABEL,
	toAgentSessionMetadataSegments,
} from "./agent-session-long-metadata";
export type {
	AgentSessionMetadataInput,
	AgentSessionMetadataSegment,
	AgentSessionMetadataSegmentKind,
} from "./agent-session-long-metadata";
export {
	bindAgentSessionFlyoutActions,
	resolveAgentSessionWorkItemKey,
	suggestedAgentSessionWorkItemKey,
	toAgentSessionUntrackedWorkFlyoutItem,
	toJiraIssueAgentActivityFromSession,
} from "./agent-session-work-item";
export type {
	AgentSessionDensity,
	AgentSessionItem,
	AgentSessionProps,
	AgentSessionSelectionGesture,
	AgentSessionTriageRow,
	AgentSessionVariant,
} from "./agent-session-types";
export type { UntrackedWorkTriage } from "./untracked-work-triage";
