"use client";

import {
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
	type ReactNode,
	type RefCallback,
} from "react";
import { useReducedMotion } from "motion/react";

import GrowHorizontalIcon from "@atlaskit/icon/core/grow-horizontal";

import { isCodingAgentListItem } from "@/components/blocks/agent-list";
import { AGENT_SESSION_ITEMS, AgentSession } from "@/components/blocks/agent-session";
import type { AgentSessionItem } from "@/components/blocks/agent-session";
import { useHasVerticalOverflow } from "@/components/hooks/use-has-vertical-overflow";
import { Button } from "@/components/ui/button";
import { Empty, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Icon } from "@/components/ui/icon";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ScrollMaskEdgeOverlay } from "@/components/visual/scroll-mask";
import TextMorphing from "@/components/visual/text-morphing";
import type { TextMorphConfig } from "@/components/visual/text-morphing/data";
import { token } from "@/lib/tokens";
import { cn } from "@/lib/utils";

import { AgentSessionColumnFilterMenu } from "./agent-session-column-filter-menu";
import { AgentSessionColumnHeader } from "./agent-session-column-header";
import { AgentSessionColumnEndState } from "./agent-session-column-end-state";
import { AgentSessionColumnHiddenFooter } from "./agent-session-column-hidden-footer";
import { AgentSessionColumnOverflowMenu } from "./agent-session-column-overflow-menu";
import {
	AGENT_SESSION_RAIL_MAX_VISIBLE_ITEMS,
	AgentSessionColumnRail,
} from "./agent-session-column-rail";
import { toAgentSessionRailHitSlopStyle } from "./agent-session-column-rail-viewport";
import {
	DEFAULT_AGENT_SESSION_COLUMN_FRAME,
	resolveAgentSessionColumnLayout,
	type AgentSessionColumnLayout,
} from "./agent-session-column-frame";
import type { AgentSessionColumnProps } from "./agent-session-column-types";
import {
	AGENT_SESSION_DECK_END_SPACE_PX,
	AGENT_SESSION_DECK_FLAT,
	AGENT_SESSION_DECK_STACKED,
} from "./deck/deck-model";
import { useAgentSessionDeck } from "./deck/use-agent-session-deck";
import { useAgentSessionColumnFilter } from "./use-agent-session-column-filter";
import { useAgentSessionColumnHidden } from "./use-agent-session-column-hidden";
import { useUntrackedSelection } from "./use-untracked-selection";
import { focusAgentSessionRow } from "./untracked-selection-keyboard";

/** Expanded column width in px. Exported so a host surface can size itself to match. */
export const AGENT_SESSION_COLUMN_WIDTH_PX = 280;

/**
 * Collapsed rail width in px. Matches the board's collapsed status pill so the
 * two sit on one rhythm; declared here rather than imported, because a shared
 * block must not reach into a kanban variant's internals. Exported for the same
 * reason the expanded width is: a host that animates around the column has to
 * read the two widths from their owner rather than restate them.
 */
export const AGENT_SESSION_COLUMN_COLLAPSED_WIDTH_PX = 32;

/**
 * Hover preview keeps this column collapsed, so the width transition runs only
 * after a deliberate expand/collapse action. Hosts mirror the same timing for
 * their reserved footprint.
 */
const AGENT_SESSION_COLUMN_TRANSITION = "width var(--duration-medium) var(--ease-in-out)";

/**
 * The filled plane that holds the sessions.
 *
 * Caption (simple / default omit): the header is a sibling of this plane so
 * it shares an inset and baseline with `To do`. Enclosed (default board
 * chrome): the expanded header is a child of the well, matching the status
 * columns that wrap title and cards in one painted object. Collapsed never
 * wears that well — a 32px bordered capsule next to a hugging status pill
 * reads as a different object, and the extra inset knocks the two counts
 * off the same row. Panel ignores framing and keeps the fill without a
 * nested well — the docked chrome already draws the leading hairline.
 *
 * The list is the scrollport. Expanded in-flow caption, the plane is a
 * bordered well (`radius.xlarge`) that clips fades and the hidden-work
 * footer so they cannot paint over the 1px stroke. Enclosed moves
 * `overflow-hidden` onto the list/footer region so header focus rings are
 * not sliced. Collapsed, the rail sits in the unframed fill. Cards are
 * borderless. Expanded in-flow uses the same 4px list inset and row gap as
 * the panel; adjacent marked cards fuse across that gap.
 */
const AGENT_SESSION_PLANE =
	"relative flex min-h-0 min-w-0 flex-1 flex-col bg-surface";

const AGENT_SESSION_WELL_PAINT = cn(
	AGENT_SESSION_PLANE,
	"rounded-xl border border-solid border-border-disabled",
);

const AGENT_SESSION_WELL = cn(
	AGENT_SESSION_PLANE,
	"overflow-hidden rounded-xl border border-solid border-border-disabled",
);

/**
 * Row gap and side inset share `space.050` (`gap-1 p-1`, 4px). Adjacent
 * marked cards close that gap (`-mt-1`) and flatten the shared corners.
 * Panel hosts pass the same class via `listClassName`.
 */
const AGENT_SESSION_LIST_SPACING = "gap-1 p-1";

function resolveAgentSessionPlaneClassName(
	layout: AgentSessionColumnLayout,
	collapsed: boolean,
): string {
	switch (layout) {
		case "panel":
			return AGENT_SESSION_PLANE;
		case "caption":
			return collapsed ? AGENT_SESSION_PLANE : AGENT_SESSION_WELL;
		case "enclosed":
			return collapsed ? AGENT_SESSION_PLANE : AGENT_SESSION_WELL_PAINT;
		default: {
			const exhaustive: never = layout;
			return exhaustive;
		}
	}
}

function renderAgentSessionColumnFrame({
	body,
	collapsed,
	header,
	layout,
	planeClassName,
}: Readonly<{
	body: ReactNode;
	collapsed: boolean;
	header: ReactNode;
	layout: AgentSessionColumnLayout;
	planeClassName: string;
}>): ReactNode {
	switch (layout) {
		case "panel":
		case "caption":
			return (
				<>
					{header}
					<div className={planeClassName}>{body}</div>
				</>
			);
		case "enclosed":
			return collapsed ? (
				<>
					{header}
					<div className={planeClassName}>{body}</div>
				</>
			) : (
				<div className={planeClassName}>
					{header}
					<div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
						{body}
					</div>
				</div>
			);
		default: {
			const exhaustive: never = layout;
			return exhaustive;
		}
	}
}

function resolveCollapsedHeaderStyle(
	layout: AgentSessionColumnLayout,
): { paddingBottom: string; paddingTop?: string } {
	switch (layout) {
		case "panel":
		case "enclosed":
			return {
				paddingBottom: token("space.100"),
				paddingTop: token("space.100"),
			};
		case "caption":
			return { paddingBottom: token("space.100") };
		default: {
			const exhaustive: never = layout;
			return exhaustive;
		}
	}
}

/**
 * Hover/focus swap on the collapsed header slot: the count at rest, the expand
 * control once the pointer or keyboard arrives. Both sit in the same 24px row
 * the expanded collapse control uses, so the number does not move. Gutter rest
 * keeps this pair hidden; `focus-visible` still unfades the control so keyboard
 * users can expand without a pointer.
 */
const HEADER_COUNT_AT_REST = cn(
	"pointer-events-none transition-opacity duration-normal ease-out-practical",
	"peer-hover/expand-control:opacity-0 peer-focus-visible/expand-control:opacity-0",
	"motion-reduce:transition-none",
);

const HEADER_CONTROL_ON_REVEAL = cn(
	"peer/expand-control opacity-0 transition-opacity duration-normal ease-out-practical",
	"hover:opacity-100 focus-visible:opacity-100",
	"motion-reduce:transition-none",
);

const HEADER_CONTROL_IN_GUTTER = cn(
	HEADER_CONTROL_ON_REVEAL,
	"hover:opacity-0",
);

/**
 * Expanded header actions: overflow + collapse, revealed together. Stay
 * painted while the overflow menu is open so the trigger does not vanish
 * under the portalled popup.
 */
/**
 * Count morphing for the collapsed header.
 *
 * `slots` spins each digit behind a fade mask, which suits a value that changes
 * because work arrived rather than because the viewer acted. Gutter presentation
 * keeps this renderer mounted while the digits stay hidden, so a column
 * presentation can still roll the total without remounting.
 *
 * `autoSize` eases the slot's width as the total crosses a digit. `initial:
 * false` keeps a column that mounts already collapsed from spinning its count
 * in on first paint. `TextMorphing` degrades to static text under
 * `prefers-reduced-motion`.
 */
const HEAD_COUNT_MORPH: TextMorphConfig = {
	variant: "slots",
	animation: "snappy",
	driftX: 0,
	driftY: 0,
	trend: 0,
	stagger: 0.02,
	initial: false,
	autoSize: true,
};

/** Matches `bg-surface` so edge fades dissolve into the plane. */
const AGENT_SESSION_PLANE_FADE_COLOR = "var(--color-surface)";

const AGENT_SESSION_PLANE_TOP_FADE_SIZE = "3rem";
const AGENT_SESSION_PLANE_BOTTOM_FADE_SIZE = `${AGENT_SESSION_DECK_END_SPACE_PX}px`;

/**
 * A kanban column of agent sessions that never became work items.
 *
 * The board's status columns are unfilled under simple chrome — they read as
 * regions of the board surface. This one wraps its list in a `bg-surface`
 * plane that is also a 1px well when expanded in-flow: the outer stroke and
 * `radius.xlarge` live on the plane so scroll masks cannot wash them out.
 * Caption framing leaves the header on the host surface so it shares an
 * inset and a baseline with the status titles. Enclosed framing (default
 * board chrome) moves that same title row inside the well, matching the
 * status columns that wrap header and cards in one painted object. The well
 * stays `bg-surface`, not sunken: Untracked is outside the workflow.
 * Everything below the header is the Agent Session block verbatim, so a card's
 * untracked-work flyout, captured state, and resume gating behave identically
 * here and in the standalone block.
 *
 * The list is the scrollport. Fades sit on the list wrapper, already inside
 * the well's padding box, so they stop at the inner edge of the stroke.
 *
 * It collapses like the status columns beside it, but not *into* the same thing:
 * a status pill is a rotated label, while this becomes a full-height rail of
 * per-session markers. Circular user dots are the default; `notchShape="line"`
 * preserves the original horizontal marks. Both open the session flyout on
 * hover or keyboard focus. See
 * {@link AgentSessionColumnRail}. Collapsed drops the well so the count
 * shares the status pill's 24px header slot instead of sitting inside a
 * full-height bordered rail. `collapsedPresentation="gutter"` hides that
 * count and the expand icon at rest, while keeping the expand control in
 * the same slot for keyboard. Hover preview uses `"column"` so both return.
 *
 * Two capabilities exist for hosts that dock the column into their own surface
 * rather than stand it on the board: `collapsed` makes the rail state
 * controlled, and `headerSurface="panel"` wears the docked header skin. Both
 * are generic options — the column knows nothing about who is hosting it.
 * `columnFrame` is in-flow only; panel ignores it.
 */
export function AgentSessionColumn({
	headerSurface = "column",
	columnFrame = DEFAULT_AGENT_SESSION_COLUMN_FRAME,
	className,
	collapsed: collapsedProp,
	collapsedPresentation = "column",
	collapsedRailHitSlopPx = 0,
	count,
	defaultCollapsed = false,
	emptyLabel = "No untracked sessions",
	expandedWidthPx = AGENT_SESSION_COLUMN_WIDTH_PX,
	hasScrollingEffect = false,
	widthTransitionDisabled = false,
	items = AGENT_SESSION_ITEMS,
	listClassName,
	newItemIds,
	notchShape = "circle",
	onCollapsedChange,
	onGutterIntroComplete,
	onArchiveSession: onArchiveSessionProp,
	onSelectedItemIdChange,
	onToggleVisibility,
	playGutterIntro = false,
	selectedItemId: selectedItemIdProp,
	title = "Untracked work",
	triage,
	...sessionProps
}: Readonly<AgentSessionColumnProps>) {
	const shouldReduceMotion = useReducedMotion();
	// Collapse mirrors the selection contract below: the host owns the value
	// when it supplies one, and the column falls back to its own state
	// otherwise. Same idiom the board uses for `collapsedColumns`.
	const isCollapsedControlled = collapsedProp !== undefined;
	const [uncontrolledCollapsed, setUncontrolledCollapsed] = useState(defaultCollapsed);
	const collapsed = collapsedProp ?? uncontrolledCollapsed;
	// Collapse remounts `AgentSession`, so the column keeps the selected id the
	// same way it keeps arrival-beat history.
	const isSelectionControlled = selectedItemIdProp !== undefined;
	const [uncontrolledSelectedItemId, setUncontrolledSelectedItemId] = useState<string | null>(
		null,
	);
	const selectedItemId = isSelectionControlled ? selectedItemIdProp : uncontrolledSelectedItemId;
	const canViewItem = sessionProps.canViewItem;
	const onViewSession = sessionProps.onView;
	const {
		closeHiddenView,
		hideHidden,
		hiddenCount,
		hiddenItems,
		openHiddenView,
		toggleHidden,
		view,
		visibleItems,
	} = useAgentSessionColumnHidden(items);
	const viewItems = view === "hidden" ? hiddenItems : visibleItems;
	const {
		filter,
		filteredViewItems,
		selectedCount: selectedFilterCount,
		setFilter,
	} = useAgentSessionColumnFilter({
		getSuggestedWorkItemKey: sessionProps.getSuggestedWorkItemKey,
		getSuggestedWorkItemKeys: sessionProps.getSuggestedWorkItemKeys,
		viewItems,
	});
	// Header Archive, the untracked-work flyout Archive, and the rail flyout
	// all hide into the column-owned well the footer reads. In the archived
	// view the same control Unarchives, matching the row.
	const handleArchiveSession = useCallback((session: AgentSessionItem) => {
		switch (view) {
			case "hidden":
				toggleHidden(session);
				break;
			case "active":
				hideHidden(session);
				break;
			default: {
				const exhaustive: never = view;
				return exhaustive;
			}
		}
		onToggleVisibility?.(session);
		onArchiveSessionProp?.(session);
	}, [hideHidden, onArchiveSessionProp, onToggleVisibility, toggleHidden, view]);
	const selectionTriage = useMemo(() => {
		if (triage === undefined) {
			return undefined;
		}

		return {
			...triage,
			archive: handleArchiveSession,
		};
	}, [handleArchiveSession, triage]);
	const displayTitle = view === "hidden" ? "Archived" : title;
	// The rail and the card list have very different intrinsic widths, so the
	// overflow has to be clipped for the duration of the width transition. Any
	// longer and it would clip the 4px focus rings on the cards inside.
	const [isResizing, setIsResizing] = useState(false);
	const deck = hasScrollingEffect
		? AGENT_SESSION_DECK_STACKED
		: AGENT_SESSION_DECK_FLAT;
	const deckListRef = useAgentSessionDeck(deck);
	const {
		hasScrolledToBottom,
		ref: overflowListRef,
		showBottomScrollMask,
		showTopScrollMask,
	} = useHasVerticalOverflow<HTMLDivElement>();
	const listRef = useCallback<RefCallback<HTMLDivElement>>((node) => {
		overflowListRef(node);
		deckListRef(node);
	}, [deckListRef, overflowListRef]);
	const columnRef = useRef<HTMLElement>(null);
	const untrackedCount = count ?? visibleItems.length;
	const showWellFooter = view === "hidden" || hiddenCount > 0;
	const hasActiveFilters = selectedFilterCount > 0;
	const sessionCount = hasActiveFilters
		? filteredViewItems.length
		: (view === "hidden" ? hiddenItems.length : untrackedCount);
	// Coding sessions are always activatable; person rows only when `canViewItem`
	// allows it. Selection, notches, and board spotlight share this gate.
	const canActivateItem = useCallback((item: AgentSessionItem) => (
		isCodingAgentListItem(item) || (canViewItem?.(item) ?? true)
	), [canViewItem]);
	const handleSelectedItemIdChange = useCallback((itemId: string | null) => {
		if (!isSelectionControlled) {
			setUncontrolledSelectedItemId(itemId);
		}
		onSelectedItemIdChange?.(itemId);
	}, [isSelectionControlled, onSelectedItemIdChange]);
	const handleLeadItem = useCallback((item: AgentSessionItem | null) => {
		if (item === null) {
			handleSelectedItemIdChange(null);
			return;
		}
		handleSelectedItemIdChange(item.id);
		if (canActivateItem(item)) {
			onViewSession?.(item);
		}
	}, [canActivateItem, handleSelectedItemIdChange, onViewSession]);
	const handleFocusRow = useCallback((itemId: string | null) => {
		focusAgentSessionRow(columnRef.current, itemId);
	}, []);
	const untrackedSelection = useUntrackedSelection({
		capturedItemIds: sessionProps.capturedItemIds,
		count: sessionCount,
		focusRow: handleFocusRow,
		getSuggestedWorkItemKey: sessionProps.getSuggestedWorkItemKey,
		getSuggestedWorkItemKeys: sessionProps.getSuggestedWorkItemKeys,
		onLeadItem: handleLeadItem,
		title: displayTitle,
		triage: selectionTriage,
		visibilityLabel: view === "hidden" ? "Unarchive" : "Archive",
		visibleItems: filteredViewItems,
	});
	const overflowMenu = (
		<AgentSessionColumnOverflowMenu
			capturedItemIds={sessionProps.capturedItemIds}
			getSuggestedWorkItemKey={sessionProps.getSuggestedWorkItemKey}
			getSuggestedWorkItemKeys={sessionProps.getSuggestedWorkItemKeys}
			items={filteredViewItems}
			onLinkWorkItem={sessionProps.onLinkWorkItem}
			size={headerSurface === "column" ? "icon-compact" : "icon"}
			title={title}
		/>
	);
	const filterMenu = (
		<AgentSessionColumnFilterMenu
			filter={filter}
			items={viewItems}
			onFilterChange={setFilter}
			size={headerSurface === "column" ? "icon-compact" : "icon"}
		/>
	);
	const newCount = newItemIds === undefined
		? 0
		: visibleItems.reduce((total: number, item: AgentSessionItem) => (
			newItemIds.has(item.id) ? total + 1 : total
		), 0);
	// Collapsing swaps the cards for the rail and back, which remounts them — and
	// a mount is exactly what re-arms an `initial` animation. The beat is meant to
	// fire once per arrival, so the column, which survives the toggle, remembers
	// which ids have already played. This is history, not derived state: nothing
	// in the current props can say whether a beat has already run.
	const [playedArrivalIds, setPlayedArrivalIds] = useState<ReadonlySet<string>>(
		() => new Set<string>(),
	);
	const arrivingItemIds = useMemo(() => {
		if (newItemIds === undefined || newItemIds.size === 0) {
			return undefined;
		}

		const arriving = new Set<string>();
		for (const id of newItemIds) {
			if (!playedArrivalIds.has(id)) {
				arriving.add(id);
			}
		}
		return arriving;
	}, [newItemIds, playedArrivalIds]);

	const handleArrivalComplete = useCallback((itemId: string) => {
		if (newItemIds?.has(itemId) !== true) {
			return;
		}
		setPlayedArrivalIds((current) => {
			if (current.has(itemId)) {
				return current;
			}
			const next = new Set(current);
			next.add(itemId);
			return next;
		});
	}, [newItemIds]);

	useEffect(() => {
		setPlayedArrivalIds((current) => {
			// Forget reviewed ids so a later re-arrival can animate again. Reduced
			// motion has no completion callback, so mark those ids as played now.
			const next = new Set<string>();
			for (const id of current) {
				if (newItemIds?.has(id) === true) {
					next.add(id);
				}
			}
			if (shouldReduceMotion) {
				for (const id of newItemIds ?? []) {
					next.add(id);
				}
			}
			const isUnchanged = next.size === current.size
				&& [...next].every((id: string) => current.has(id));
			return isUnchanged ? current : next;
		});
	}, [newItemIds, shouldReduceMotion]);
	// A controlled host can flip `collapsed` from its own affordance, which never
	// runs `handleToggleCollapsed`. React to the committed change so an external
	// collapse behaves like an internal one: clip the overflow for the width
	// transition, and leave the hidden view, which the rail cannot render.
	const lastCollapsedRef = useRef(collapsed);
	useEffect(() => {
		if (lastCollapsedRef.current === collapsed) {
			return;
		}
		lastCollapsedRef.current = collapsed;
		if (!shouldReduceMotion) {
			setIsResizing(true);
		}
		if (collapsed) {
			closeHiddenView();
		}
	}, [closeHiddenView, collapsed, shouldReduceMotion]);
	const handleNotchView = onViewSession === undefined
		? undefined
		: (item: AgentSessionItem) => {
			if (canActivateItem(item)) {
				onViewSession(item);
			}
		};

	const handleToggleCollapsed = () => {
		const nextCollapsed = !collapsed;
		if (nextCollapsed) {
			columnRef.current?.focus();
		}
		if (!shouldReduceMotion) {
			setIsResizing(true);
		}
		if (nextCollapsed) {
			closeHiddenView();
		}
		// Only own the state when the host has not claimed it, so a controlled
		// host stays the single source of truth.
		if (!isCollapsedControlled) {
			setUncontrolledCollapsed(nextCollapsed);
		}
		onCollapsedChange?.(nextCollapsed);
	};

	const handleToggleVisibility = (item: AgentSessionItem) => {
		toggleHidden(item);
		onToggleVisibility?.(item);
	};

	const handleTransitionEnd = (event: React.TransitionEvent<HTMLElement>) => {
		if (event.target === event.currentTarget && event.propertyName === "width") {
			setIsResizing(false);
		}
	};

	const layout = resolveAgentSessionColumnLayout(headerSurface, columnFrame);
	const isGutterCollapsed = collapsed && collapsedPresentation === "gutter";
	const planeClassName = cn(
		resolveAgentSessionPlaneClassName(layout, collapsed),
		isGutterCollapsed ? "bg-transparent" : null,
	);
	// Gutter rest hides the digits and the expand icon so the rail can sit
	// in the page inset. Hover preview switches to column presentation, so
	// the same 24px slot shows the count and the expand control again.
	// Screen-reader copy still names the pool count.
	const hideGutterCount = isGutterCollapsed;
	const collapsedCountLabel = newCount > 0
		? `${sessionCount} sessions, ${newCount} newly synced`
		: `${sessionCount} sessions`;
	const collapsedExpandControl = (
		<TooltipProvider>
			<Tooltip>
				<TooltipTrigger
					render={
						<Button
							aria-label={`Expand ${title} column`}
							className={isGutterCollapsed ? HEADER_CONTROL_IN_GUTTER : HEADER_CONTROL_ON_REVEAL}
							onClick={handleToggleCollapsed}
							size="icon-compact"
							style={{ width: "100%" }}
							type="button"
							variant="ghost"
						/>
					}
				>
					<Icon className="text-icon-subtle" render={<GrowHorizontalIcon label="" />} />
				</TooltipTrigger>
				<TooltipContent>Expand</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	);
	const collapsedHeader = (
		<div
			className={cn(
				"flex min-w-0 items-center gap-1.5",
				layout === "enclosed" ? "border border-solid border-transparent" : null,
			)}
			style={resolveCollapsedHeaderStyle(layout)}
		>
			<div
				className="relative flex h-6 w-full min-w-0 items-center justify-center px-1"
				style={collapsedRailHitSlopPx === 0
					? undefined
					: toAgentSessionRailHitSlopStyle(collapsedRailHitSlopPx)}
			>
				{collapsedExpandControl}
				<span
					aria-hidden="true"
					className={cn(
						"absolute inset-x-1 inset-y-0 flex items-center justify-center text-xs font-normal",
						"text-text-subtlest",
						HEADER_COUNT_AT_REST,
						hideGutterCount ? "opacity-0" : "opacity-100",
					)}
					data-agent-session-column-count=""
				>
					<TextMorphing
						config={HEAD_COUNT_MORPH}
						text={String(sessionCount)}
					/>
				</span>
				<span className="sr-only">{collapsedCountLabel}</span>
			</div>
		</div>
	);
	const expandedHeader = (
		<AgentSessionColumnHeader
			collapseLabel={headerSurface === "panel"
				? "Collapse panel"
				: `Collapse ${title} column`}
			filter={filterMenu}
			frame={columnFrame}
			hasActiveFilters={hasActiveFilters}
			model={untrackedSelection.header}
			onAction={untrackedSelection.onHeaderAction}
			onCollapse={handleToggleCollapsed}
			overflow={overflowMenu}
			surface={headerSurface}
		/>
	);
	const body = collapsed ? (
		<AgentSessionColumnRail
			arrivingItemIds={arrivingItemIds}
			capturedItemIds={sessionProps.capturedItemIds}
			getSuggestedWorkItemKey={sessionProps.getSuggestedWorkItemKey}
			getSuggestedWorkItemKeys={sessionProps.getSuggestedWorkItemKeys}
			highlightedItemId={sessionProps.highlightedItemId}
			hitSlopPx={collapsedRailHitSlopPx}
			items={filteredViewItems}
			maxVisibleItems={isGutterCollapsed && collapsedRailHitSlopPx === 0
				? AGENT_SESSION_RAIL_MAX_VISIBLE_ITEMS
				: undefined}
			newItemIds={newItemIds}
			notchShape={notchShape}
			onArrivalComplete={handleArrivalComplete}
			onArchiveSession={handleArchiveSession}
			onCreateWorkItem={sessionProps.onCreateWorkItem}
			onItemHover={sessionProps.onItemHover}
			onIntroComplete={onGutterIntroComplete}
			onLinkWorkItem={sessionProps.onLinkWorkItem}
			onSubtasks={sessionProps.onSubtasks}
			onView={handleNotchView}
			playIntro={isGutterCollapsed ? playGutterIntro : false}
			sessionDrag={sessionProps.sessionDrag}
		/>
	) : (
		<>
			<div className="relative flex min-h-0 min-w-0 flex-1 flex-col">
				{filteredViewItems.length === 0 ? (
					hasActiveFilters ? (
						<Empty width="narrow">
							<EmptyHeader>
								<EmptyTitle headingSize="xsmall">No matching sessions</EmptyTitle>
							</EmptyHeader>
						</Empty>
					) : (
						<p className="text-xs text-text-subtlest">{emptyLabel}</p>
					)
				) : (
					<div
						ref={listRef}
						className="min-h-0 min-w-0 flex-1 overflow-y-auto has-[:focus-visible]:overflow-visible relative z-0 scrollbar-auto-hide [&[data-scrolling]>ul]:pointer-events-none"
					>
						<AgentSession
							arrivingItemIds={arrivingItemIds}
							className={cn(
								headerSurface === "column" ? AGENT_SESSION_LIST_SPACING : null,
								listClassName,
							)}
							items={filteredViewItems}
							newItemIds={newItemIds}
							onArrivalComplete={handleArrivalComplete}
							{...sessionProps}
							onArchiveSession={handleArchiveSession}
							onSelectedItemIdChange={handleSelectedItemIdChange}
							onToggleVisibility={handleToggleVisibility}
							rowTriage={untrackedSelection.rows}
							selectedItemId={selectedItemId}
							visibilityLabel={view === "hidden" ? "Unarchive" : "Archive"}
						/>
						{hasScrollingEffect ? (
							<AgentSessionColumnEndState
								count={sessionCount}
								visible={view === "active" && hasScrolledToBottom}
							/>
						) : null}
					</div>
				)}
				{showTopScrollMask || showBottomScrollMask ? (
					<div
						aria-hidden="true"
						className="pointer-events-none absolute inset-0 z-10"
					>
						{showTopScrollMask ? (
							<ScrollMaskEdgeOverlay
								color={AGENT_SESSION_PLANE_FADE_COLOR}
								edge="top"
								fadeSize={AGENT_SESSION_PLANE_TOP_FADE_SIZE}
							/>
						) : null}
						{showBottomScrollMask ? (
							<ScrollMaskEdgeOverlay
								color={AGENT_SESSION_PLANE_FADE_COLOR}
								edge="bottom"
								fadeSize={hasScrollingEffect
									? AGENT_SESSION_PLANE_BOTTOM_FADE_SIZE
									: AGENT_SESSION_PLANE_TOP_FADE_SIZE}
							/>
						) : null}
					</div>
				) : null}
			</div>
			{showWellFooter ? (
				<AgentSessionColumnHiddenFooter
					count={view === "hidden" ? untrackedCount : hiddenCount}
					mode={view === "hidden" ? "back" : "hidden"}
					onClick={view === "hidden" ? closeHiddenView : openHiddenView}
					title={title}
				/>
			) : null}
		</>
	);

	return (
		<section
			ref={columnRef}
			aria-label={`${displayTitle}, ${sessionCount} sessions`}
			className={cn(
				"group/session-column relative flex min-h-0 shrink-0 flex-col",
				(collapsed && collapsedRailHitSlopPx === 0) || isResizing ? "overflow-hidden" : null,
				className,
			)}
			data-agent-session-column={title}
			data-collapsed={collapsed || undefined}
			data-column-frame={layout === "panel" ? undefined : layout}
			onKeyDown={untrackedSelection.onKeyDown}
			onTransitionEnd={handleTransitionEnd}
			tabIndex={-1}
			style={{
				transition:
					shouldReduceMotion || widthTransitionDisabled
						? "none"
						: AGENT_SESSION_COLUMN_TRANSITION,
				width: collapsed
					? `${AGENT_SESSION_COLUMN_COLLAPSED_WIDTH_PX}px`
					: `${expandedWidthPx}px`,
			}}
		>
			{renderAgentSessionColumnFrame({
				body,
				collapsed,
				header: collapsed ? collapsedHeader : expandedHeader,
				layout,
				planeClassName,
			})}
		</section>
	);
}

export { AgentSessionColumnRail } from "./agent-session-column-rail";
export {
	DEFAULT_AGENT_SESSION_COLUMN_FRAME,
	resolveAgentSessionColumnLayout,
} from "./agent-session-column-frame";
export type {
	AgentSessionColumnFrame,
	AgentSessionColumnLayout,
} from "./agent-session-column-frame";
export type {
	AgentSessionColumnNotchShape,
	AgentSessionColumnProps,
} from "./agent-session-column-types";
