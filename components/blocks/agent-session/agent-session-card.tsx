"use client";

import { useEffect, useRef, useState, type KeyboardEvent, type MouseEvent } from "react";
import { motion, useReducedMotion } from "motion/react";

import ArchiveBoxIcon from "@atlaskit/icon/core/archive-box";
import CheckMarkIcon from "@atlaskit/icon/core/check-mark";
import LibraryIcon from "@atlaskit/icon/core/library";
import {
	AgentListIdentity,
	AgentListPrStatusIcon,
	AgentListRow,
	AgentListTime,
	type AgentListRowHoverActions,
} from "@/components/blocks/agent-list/agent-list-card";
import { toAgentListResumeCommand } from "@/components/blocks/agent-list/agent-list-session";
import type { JiraSidebarSessionItem } from "@/components/blocks/product-sidebar/variants/jira";
import {
	JiraSessionFlyoutTrigger,
	type JiraSessionFlyoutHandle,
} from "@/components/blocks/product-sidebar/variants/jira-session-flyout";
import type { JiraIssueAgentSessionDragBinding } from "@/components/blocks/jira-issue/agent-session-drag";
import { Icon } from "@/components/ui/icon";
import { MetadataPathLink } from "@/components/ui/metadata-path-link";
import { cn } from "@/lib/utils";

import {
	AGENT_SESSION_ARRIVAL_OFFSET_PX,
	AGENT_SESSION_ARRIVAL_TRANSITION,
} from "./agent-session-arrival-motion";
import { approveActionLabel } from "./agent-session-approve";
import { SESSION_DRAG_INTERACTIVE_SELECTOR } from "./agent-session-drag-interactive";
import { AgentSessionMediumDrag } from "./agent-session-medium-drag";
import { AgentSessionSelectMark } from "./agent-session-select-mark";
import { selectionGestureFromModifierKeys } from "./agent-session-selection-gesture";
import { isTransferSourceFaded } from "./session-cohort";
import {
	toAgentSessionVisibleIdentity,
	type AgentSessionItem,
	type AgentSessionSelectionGesture,
	type AgentSessionTriageRow,
} from "./agent-session-types";

/** How long Resume reads "Copied" after it writes the command to the clipboard. */
const COPIED_RESET_MS = 2000;

/** PR-first session metadata. Local device names stay in the flyout, not the work row. */
function AgentSessionPullRequestMetadata({ item }: Readonly<{ item: AgentSessionItem }>) {
	const pullRequestNumber = item.sessionDetails?.pullRequestNumber;
	const pullRequestTitle = item.sessionDetails?.pullRequestTitle;
	const pullRequestUrl = item.sessionDetails?.pullRequestUrl;
	const pullRequestLabel = pullRequestNumber === undefined
		? undefined
		: pullRequestTitle === undefined
			? `#${pullRequestNumber}`
			: `#${pullRequestNumber}: ${pullRequestTitle}`;

	return (
		<span className="flex w-full min-w-0 items-center gap-1 text-xs text-text-subtlest">
			{pullRequestLabel ? (
				<>
					<AgentListPrStatusIcon status={item.prStatus ?? "created"} />
					{pullRequestUrl ? (
						<MetadataPathLink
							className="min-w-0 flex-1 truncate text-text-subtle"
							href={pullRequestUrl}
							rel="noreferrer"
							target="_blank"
							title={pullRequestLabel}
						>
							{pullRequestLabel}
						</MetadataPathLink>
					) : (
						<span className="min-w-0 truncate text-text-subtle" title={pullRequestLabel}>
							{pullRequestLabel}
						</span>
					)}
					<span aria-hidden="true" className="shrink-0 text-text-subtlest">
						·
					</span>
				</>
			) : null}
			<span className="shrink-0" title="Last update">
				<AgentListTime item={item} />
			</span>
		</span>
	);
}

async function copyResumeCommand(command: string): Promise<void> {
	if (typeof navigator === "undefined" || navigator.clipboard?.writeText === undefined) {
		return;
	}

	try {
		await navigator.clipboard.writeText(command);
	} catch {
		// Keep the click successful when clipboard permission is denied.
	}
}

export function AgentSessionCard({
	arrivalDelaySeconds,
	captured = false,
	flyoutHandle,
	flyoutSession,
	getResumeCommand,
	isArriving = false,
	isHighlighted = false,
	isNew = false,
	isResumable,
	isSelected = false,
	item,
	onArrivalComplete,
	onCopyResume,
	onItemHover,
	onToggleVisibility,
	onView,
	sessionDrag,
	triageRow,
	draggingIds,
	visibilityLabel = "Archive",
}: Readonly<{
	arrivalDelaySeconds?: number;
	captured?: boolean;
	flyoutHandle: JiraSessionFlyoutHandle;
	flyoutSession: JiraSidebarSessionItem;
	getResumeCommand?: (item: AgentSessionItem) => string | undefined;
	/** Play the one-shot arrival beat. A remounted card must not re-arm it. */
	isArriving?: boolean;
	/** Light this row for a pointer hovering its matching board session. */
	isHighlighted?: boolean;
	/** Carry the persistent unreviewed mark. Outlives the beat. */
	isNew?: boolean;
	isResumable?: (item: AgentSessionItem) => boolean;
	/** Single-select highlight owned by the list, not this card. */
	isSelected?: boolean;
	item: AgentSessionItem;
	onArrivalComplete?: () => void;
	onCopyResume?: (item: AgentSessionItem) => void;
	onItemHover?: (item: AgentSessionItem | null) => void;
	onToggleVisibility?: (item: AgentSessionItem) => void;
	onView?: (item: AgentSessionItem) => void;
	sessionDrag?: JiraIssueAgentSessionDragBinding;
	triageRow?: AgentSessionTriageRow | null;
	draggingIds?: ReadonlySet<string>;
	/** Tooltip and accessible name for the hover archive control. Archive in the active list, Unarchive in the archived view. */
	visibilityLabel?: string;
}>) {
	const shouldReduceMotion = useReducedMotion();
	const [copiedResume, setCopiedResume] = useState(false);
	const copiedResetRef = useRef<number | undefined>(undefined);
	const onItemHoverRef = useRef(onItemHover);
	// Whether the pointer is on *this* row, so unmount cleanup can tell "I was
	// the hovered row" from "a sibling went away".
	const isHoveredRef = useRef(false);

	useEffect(() => {
		onItemHoverRef.current = onItemHover;
	}, [onItemHover]);

	useEffect(() => () => {
		window.clearTimeout(copiedResetRef.current);
		// Hide / filter can unmount the hovered row before pointerleave fires.
		// Only the row that owns the hover may clear it: a filter or capture that
		// unmounts a sibling must not wipe a highlight the pointer still rests on,
		// because no pointerenter would fire to put it back.
		if (isHoveredRef.current) {
			onItemHoverRef.current?.(null);
		}
	}, []);

	const resumeCommand = getResumeCommand?.(item) ?? toAgentListResumeCommand(item);
	// Resume is an affordance, not just a callback: a row the host cannot resume
	// must not render an enabled control, because the button copies the command to
	// the clipboard before `onCopyResume` ever runs.
	const canResume = (isResumable?.(item) ?? true) && resumeCommand.length > 0;
	// The beat, not the mark: a card remounted while still unreviewed keeps the
	// information dot but must not replay its entrance.
	const shouldPlayArrival = isArriving && !shouldReduceMotion;
	const handleArrivalComplete = () => {
		if (shouldPlayArrival) {
			onArrivalComplete?.();
		}
	};

	const approve = triageRow?.approve;
	const mark = triageRow?.mark;
	const isMarked = mark?.isMarked ?? false;
	const isLead = mark?.isLead ?? false;
	const isTransferSource = Boolean(draggingIds?.has(item.id));
	const showSelectedFill = isMarked || (isSelected && mark == null);
	const visibleIdentity = toAgentSessionVisibleIdentity(item);

	// The same hover/focus-revealed pair Agent List rows use, with Archive /
	// Unarchive in the slot Agent List gives to Archive. The control always
	// renders; the column supplies `onToggleVisibility` so Archive removes the card.
	// The article is the hit area. RowBody would otherwise wrap only the title
	// column, leaving avatar and padding inert. A triage mark uses that same
	// path so selection is not avatar-only. Hover actions stay buttons so they
	// can stop the article from changing the selection.
	const activateCard = onView === undefined && mark == null
		? undefined
		: (gesture: AgentSessionSelectionGesture) => {
			if (mark != null) {
				mark.onActivate(gesture);
				return;
			}
			onView?.(item);
		};
	const handleArticleClick = activateCard === undefined
		? undefined
		: (event: MouseEvent<HTMLElement>) => {
			if (
				event.target instanceof Element
				&& event.target.closest(SESSION_DRAG_INTERACTIVE_SELECTOR) !== null
			) {
				return;
			}
			activateCard(selectionGestureFromModifierKeys(event));
		};
	const handleArticleKeyDown = activateCard === undefined
		? undefined
		: (event: KeyboardEvent<HTMLElement>) => {
			if (event.target !== event.currentTarget) {
				return;
			}
			if (event.key === "Enter" || event.key === " ") {
				event.preventDefault();
				activateCard(selectionGestureFromModifierKeys(event));
			}
		};
	const articleRole = mark == null ? undefined : "gridcell";
	const articleTabIndex = mark == null ? undefined : isLead ? 0 : -1;
	const hoverActions: AgentListRowHoverActions = {
		primary: approve
			? {
				disabled: approve.target.kind === "unavailable",
				icon: <Icon render={<CheckMarkIcon label="" size="small" />} />,
				label: approveActionLabel(approve.target),
				onClick: approve.onApprove,
			}
			: canResume
				? {
					label: copiedResume ? "Copied" : "Resume",
					onClick: () => {
						void copyResumeCommand(resumeCommand).then(() => {
							onCopyResume?.(item);
							setCopiedResume(true);
							window.clearTimeout(copiedResetRef.current);
							copiedResetRef.current = window.setTimeout(() => {
								setCopiedResume(false);
							}, COPIED_RESET_MS);
						});
					},
				}
				: undefined,
		secondary: {
			// Archive (active list) uses the archive box; Unarchive (hidden view)
			// uses Library so the restore action is distinct from hide.
			icon: (
				<Icon
					render={visibilityLabel === "Unarchive"
						? <LibraryIcon label="" size="small" />
						: <ArchiveBoxIcon label="" size="small" />}
				/>
			),
			label: visibilityLabel,
			onClick: () => {
				onItemHover?.(null);
				onToggleVisibility?.(item);
			},
		},
	};

	// Arrival layout lives on the list item, not the flyout trigger. Base UI
	// closes a preview card when its active trigger unmounts, and Motion's layout
	// projection can replace that host — which made each row open its own flyout
	// instead of sliding the list's shared popup. The catalog demo uses a stable
	// `div` as the trigger host so hovering down the list crossfades in place.
	return (
		<motion.li
			animate={shouldPlayArrival ? { opacity: 1, y: 0 } : undefined}
			aria-hidden={isTransferSource || undefined}
			aria-selected={mark == null ? undefined : isMarked}
			className={cn(
				isMarked ? "has-[+[data-marked]]:[&_article]:rounded-b-none" : null,
				"[[data-marked]+&[data-marked]]:[&_article]:rounded-t-none",
				"[[data-marked]+&[data-marked]]:in-[.gap-1]:-mt-1",
			)}
			data-marked={isMarked || undefined}
			data-testid={"agent-session-row-" + item.id}
			inert={isTransferSource || undefined}
			role={mark == null ? undefined : "row"}
			onAnimationComplete={handleArrivalComplete}
			onPointerEnter={() => {
				isHoveredRef.current = true;
				onItemHover?.(item);
			}}
			onPointerLeave={() => {
				isHoveredRef.current = false;
				onItemHover?.(null);
			}}
			// `false` for a settled card, so nothing replays when the list re-renders
			// or the watermark clears the mark. Only an arrival animates.
			initial={shouldPlayArrival ? { opacity: 0, y: AGENT_SESSION_ARRIVAL_OFFSET_PX } : false}
			// Siblings slide down to make room instead of jumping. `"position"` so a
			// displaced card is never scaled, only moved.
			layout={shouldReduceMotion ? false : "position"}
			style={{ willChange: shouldPlayArrival ? "opacity, transform" : undefined }}
			transition={{ ...AGENT_SESSION_ARRIVAL_TRANSITION, delay: arrivalDelaySeconds ?? 0 }}
		>
			<AgentSessionMediumDrag
				cohort={triageRow?.drag?.cohort}
				cohortFollower={isTransferSourceFaded(item.id, draggingIds, false)}
				item={item}
				preserveSourceFootprint
				sessionDrag={sessionDrag}
				shouldReduceMotion={shouldReduceMotion}
				source="untracked"
			>
				{(bind) => (
					<JiraSessionFlyoutTrigger
						closeDelay={160}
						handle={flyoutHandle}
						render={<div className="w-full" />}
						session={flyoutSession}
					>
						<article
							{...bind}
							aria-current={isSelected ? "true" : undefined}
							aria-roledescription={bind ? "Draggable agent session" : undefined}
							className={cn(
						"group/agent-row relative flex w-full cursor-default rounded-lg p-3 text-left text-text",
						// Borderless tiles, 8px radius — same chrome as editor-palette
						// suggestion rows. The list owns the gap between them.
						"transition-[background-color,border-radius] duration-xxshort ease-out-practical",
						"motion-reduce:transition-none",
						showSelectedFill && "bg-bg-selected",
						!showSelectedFill && isHighlighted && "bg-surface-hovered",
						!showSelectedFill && !isHighlighted && "bg-transparent hover:bg-surface-hovered",
						activateCard === undefined
							? null
							: "outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
							)}
							data-captured={captured || undefined}
							data-highlighted={isHighlighted || undefined}
							data-marked={isMarked || undefined}
							data-new={isNew || undefined}
							data-selected={isSelected || undefined}
							data-variant="uncaptured-work"
							onClick={handleArticleClick}
							onKeyDown={handleArticleKeyDown}
							role={articleRole}
							tabIndex={articleTabIndex}
						>
							{isNew ? (
						<>
							{/* Colour never carries it alone. */}
							<span className="sr-only">Newly synced, not yet reviewed</span>
							{/* Parked in the body's 12px padding, vertically centered
							    with the avatar + two text lines. */}
							<span
								aria-hidden="true"
								className="absolute left-1.5 top-1/2 size-1.5 -translate-y-1/2 rounded-full bg-icon-information"
							/>
						</>
							) : null}
							<AgentListRow
								hoverActions={hoverActions}
								isCompact={false}
								isSelected={showSelectedFill}
								item={item}
								metadata={<AgentSessionPullRequestMetadata item={item} />}
								onView={mark == null ? onView : undefined}
								renderIdentity={() => {
									const sessionIdentity = (
										<AgentListIdentity
											agent={visibleIdentity}
											sizePx={24}
										/>
									);

									return mark === undefined || mark === null
										? sessionIdentity
										: (
											<AgentSessionSelectMark
												identity={sessionIdentity}
												isMarked={mark.isMarked}
												label={`Select "${item.title}"`}
												onActivate={activateCard ?? mark.onActivate}
											/>
										);
								}}
								showHoverActionsWhenSelected
							/>
						</article>
					</JiraSessionFlyoutTrigger>
				)}
			</AgentSessionMediumDrag>
		</motion.li>
	);
}
