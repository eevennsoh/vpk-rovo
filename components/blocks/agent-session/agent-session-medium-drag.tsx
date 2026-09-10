"use client";

import {
	useEffect,
	useRef,
	useState,
	type MouseEvent as ReactMouseEvent,
	type PointerEvent as ReactPointerEvent,
	type ReactElement,
} from "react";

import {
	type JiraIssueAgentSessionDragBinding,
	type JiraIssueAgentSessionDragSource,
} from "@/components/blocks/jira-issue/agent-session-drag";
import { useSessionDragChipPointer } from "@/components/blocks/jira-issue/use-session-drag-chip-pointer";
import {
	usePointerDrag,
	type PointerDragPosition,
} from "@/components/ui-custom/hooks/use-pointer-drag";
import { cn } from "@/lib/utils";

import { SESSION_DRAG_INTERACTIVE_SELECTOR } from "./agent-session-drag-interactive";
import { measureSessionDragIdentityOrigin } from "./agent-session-drag-motion";
import { AgentSessionDragOverlay } from "./agent-session-drag-overlay";
import { toSessionTransferMember } from "./agent-session-transfer-member";
import { toJiraIssueAgentActivityFromSession } from "./agent-session-work-item";
import { singletonSessionCohort, type SessionCohort } from "./session-cohort";
import type { AgentSessionItem } from "./agent-session-types";

const SESSION_DRAG_ORIGIN: PointerDragPosition = { x: 0, y: 0 };
/** Same 2px threshold as `usePointerDrag` — publish/arm only after a real move. */
const SESSION_DRAG_PUBLISH_THRESHOLD_PX = 2;
const SESSION_DRAG_CHIP_DISTANCE_PX = 12;

export function AgentSessionMediumDrag({
	cohort,
	cohortFollower = false,
	item,
	preserveSourceFootprint = false,
	sessionDrag,
	shouldReduceMotion,
	source = "detached",
	children,
}: Readonly<{
	cohort?: () => SessionCohort<AgentSessionItem>;
	cohortFollower?: boolean;
	item: AgentSessionItem;
	preserveSourceFootprint?: boolean;
	sessionDrag?: JiraIssueAgentSessionDragBinding;
	shouldReduceMotion: boolean | null;
	source?: JiraIssueAgentSessionDragSource;
	children: (bind: Record<string, unknown> | undefined) => ReactElement;
}>) {
	const activity = toJiraIssueAgentActivityFromSession(item);
	const [dragOffset, setDragOffset] = useState<PointerDragPosition>(SESSION_DRAG_ORIGIN);
	const [publishedDragging, setPublishedDragging] = useState(false);
	const [ghostCohort, setGhostCohort] = useState<SessionCohort<AgentSessionItem> | null>(null);
	const [sourceHeight, setSourceHeight] = useState<number | undefined>(undefined);
	// Where the chip starts, as an offset from the pointer that published the
	// drag. Stored as the resolved delta so nothing has to read a ref at render.
	const [chipOrigin, setChipOrigin] = useState<PointerDragPosition | null>(null);
	// Drops `will-change` once the entrance lands so the promoted layer does not
	// outlive the 150ms it was for.
	const [chipSettled, setChipSettled] = useState(false);
	const drag = usePointerDrag(dragOffset, setDragOffset, sessionDrag?.bounds);
	const chipPointer = useSessionDragChipPointer(shouldReduceMotion);
	const isDragging = Boolean(sessionDrag) && drag.dragging && publishedDragging;
	const isFollower = cohortFollower && !isDragging;
	const isDraggedOut = isDragging
		&& Math.hypot(drag.position.x, drag.position.y) >= SESSION_DRAG_CHIP_DISTANCE_PX;

	const pointerOriginRef = useRef<PointerDragPosition | null>(null);
	// Absolute viewport centre of the grabbed identity mark, kept raw. The chip
	// mounts on the *publishing* pointermove, not on pointerdown, and the portal
	// has already followed the pointer there — so the delta can only be taken
	// against that later position. Resolving it at pointerdown would start the
	// chip at `identityOrigin + firstMoveDelta` and it would visibly jump,
	// worst with coalesced touch and stylus moves that clear the 2px threshold
	// in one large step.
	const identityOriginRef = useRef<PointerDragPosition | null>(null);
	const didPublishDragRef = useRef(false);
	const dragTargetRef = useRef<HTMLElement | null>(null);

	function publishSessionDrag(
		dragging: boolean,
		event?: ReactPointerEvent<HTMLElement>,
		cancelled = false,
	) {
		if (dragging && event) {
			const next = cohort?.() ?? singletonSessionCohort(item);
			const [first, ...rest] = next.members;
			setGhostCohort(next);
			sessionDrag?.onDragStateChange({
				activities: [activity],
				cancelled: false,
				dragging: true,
				pointer: { x: event.clientX, y: event.clientY },
				source: source,
				transfer: {
					key: next.key,
					members: [
						toSessionTransferMember(first),
						...rest.map(toSessionTransferMember),
					],
				},
			});
			return;
		}

		sessionDrag?.onDragStateChange({
			activities: [activity],
			cancelled,
			dragging: false,
			pointer: event ? { x: event.clientX, y: event.clientY } : null,
			source: source,
		});
	}

	function endSessionDrag(event: ReactPointerEvent<HTMLElement>) {
		if (pointerOriginRef.current === null) {
			return;
		}
		drag.bind.onPointerUp(event);
		pointerOriginRef.current = null;
		identityOriginRef.current = null;
		dragTargetRef.current = null;
		setPublishedDragging(false);
		setGhostCohort(null);
		setSourceHeight(undefined);
		setChipOrigin(null);
		setChipSettled(false);
		setDragOffset(SESSION_DRAG_ORIGIN);
		publishSessionDrag(false, event);
	}

	function cancelSessionDrag(event: ReactPointerEvent<HTMLElement>) {
		if (pointerOriginRef.current === null) {
			return;
		}
		drag.bind.onPointerCancel(event);
		drag.bind.onClick();
		pointerOriginRef.current = null;
		identityOriginRef.current = null;
		dragTargetRef.current = null;
		didPublishDragRef.current = false;
		setPublishedDragging(false);
		setGhostCohort(null);
		setSourceHeight(undefined);
		setChipOrigin(null);
		setChipSettled(false);
		setDragOffset(SESSION_DRAG_ORIGIN);
		publishSessionDrag(false, undefined, true);
	}

	const endSessionDragRef = useRef(endSessionDrag);
	const cancelSessionDragRef = useRef(cancelSessionDrag);

	useEffect(() => {
		endSessionDragRef.current = endSessionDrag;
		cancelSessionDragRef.current = cancelSessionDrag;
	});

	// Capture lives on this host. If a descendant unmounts or CDP drops the
	// element listener, window still ends the gesture so the card cannot stick
	// in the attach-chin preview.
	useEffect(() => {
		if (!isDragging) {
			return undefined;
		}

		function toHostEvent(event: PointerEvent): ReactPointerEvent<HTMLElement> {
			return {
				currentTarget: dragTargetRef.current ?? (event.target as HTMLElement),
				pointerId: event.pointerId,
				clientX: event.clientX,
				clientY: event.clientY,
			} as ReactPointerEvent<HTMLElement>;
		}

		function onPointerUp(event: PointerEvent) {
			endSessionDragRef.current(toHostEvent(event));
		}

		function onPointerCancel(event: PointerEvent) {
			cancelSessionDragRef.current(toHostEvent(event));
		}

		window.addEventListener("pointerup", onPointerUp);
		window.addEventListener("pointercancel", onPointerCancel);
		return () => {
			window.removeEventListener("pointerup", onPointerUp);
			window.removeEventListener("pointercancel", onPointerCancel);
		};
	}, [isDragging]);

	const { onKeyDown: _ignoredPointerDragKeyDown, ...dragBindWithoutKeyboard } = drag.bind;
	void _ignoredPointerDragKeyDown;
	const sessionDragBind = sessionDrag
		? {
			...dragBindWithoutKeyboard,
			onFocus: () => sessionDrag.onFocusedActivitiesChange([activity]),
			onMouseDown: (event: ReactMouseEvent<HTMLElement>) => {
				const interactiveTarget = event.target instanceof Element
					? event.target.closest(SESSION_DRAG_INTERACTIVE_SELECTOR)
					: null;
				if (interactiveTarget !== null && interactiveTarget !== event.currentTarget) {
					return;
				}
				event.preventDefault();
			},
			onClickCapture: (event: ReactMouseEvent<HTMLElement>) => {
				if (!didPublishDragRef.current) {
					return;
				}
				didPublishDragRef.current = false;
				drag.bind.onClick();
				event.preventDefault();
				event.stopPropagation();
			},
			onPointerCancel: cancelSessionDrag,
			onPointerDown: (event: ReactPointerEvent<HTMLElement>) => {
				const interactiveTarget = event.target instanceof Element
					? event.target.closest(SESSION_DRAG_INTERACTIVE_SELECTOR)
					: null;
				if (interactiveTarget !== null && interactiveTarget !== event.currentTarget) {
					return;
				}
				didPublishDragRef.current = false;
				dragTargetRef.current = event.currentTarget;
				setSourceHeight(event.currentTarget.getBoundingClientRect().height);
				identityOriginRef.current = measureSessionDragIdentityOrigin(event.currentTarget);
				drag.bind.onPointerDown(event);
				pointerOriginRef.current = { x: event.clientX, y: event.clientY };
				chipPointer.snapToPointer(
					{ x: event.clientX, y: event.clientY },
				);
			},
			onPointerMove: (event: ReactPointerEvent<HTMLElement>) => {
				drag.bind.onPointerMove(event);
				chipPointer.followPointer(
					{ x: event.clientX, y: event.clientY },
				);
				const origin = pointerOriginRef.current;
				const moved = Boolean(
					origin
					&& (
						Math.abs(event.clientX - origin.x) > SESSION_DRAG_PUBLISH_THRESHOLD_PX
						|| Math.abs(event.clientY - origin.y) > SESSION_DRAG_PUBLISH_THRESHOLD_PX
					),
				);
				if (moved) {
					// Only the move that actually publishes resolves the origin.
					// Later moves already have the chip mounted; recomputing would
					// restart the entrance mid-drag.
					if (!didPublishDragRef.current) {
						const identityOrigin = identityOriginRef.current;
						setChipOrigin(identityOrigin === null
							? null
							: {
								x: identityOrigin.x - event.clientX,
								y: identityOrigin.y - event.clientY,
							});
					}
					didPublishDragRef.current = true;
					setPublishedDragging(true);
					publishSessionDrag(true, event);
				}
			},
			onPointerUp: endSessionDrag,
		}
		: undefined;

	if (!sessionDrag) {
		return children(undefined);
	}

	// VPK duration tokens do not collapse themselves. Card `shouldPlayArrival`
	// reads `shouldReduceMotion` permissively, so the chip matches it.
	const reduceChipMotion = Boolean(shouldReduceMotion);

	return (
		<div
			className={cn(
				"min-w-0",
				isDragging && "relative w-full",
				isFollower && !preserveSourceFootprint && "h-0 overflow-hidden",
				isDragging && !preserveSourceFootprint && (isDraggedOut ? "h-0" : "h-[33px]"),
			)}
			data-session-chip-out={isDraggedOut || undefined}
			data-session-drag-placeholder={preserveSourceFootprint || undefined}
			data-session-transfer-faded={isFollower || undefined}
			style={{ height: isDragging && preserveSourceFootprint ? sourceHeight : undefined }}
		>
			{/* The bound source stays mounted for the whole gesture, preserving
			    pointer capture while the chip travels. Retained list sources keep a
			    disabled-opacity ghost so their reserved space never reads as a hole. */}
			<div
				aria-hidden={isDragging || isFollower || undefined}
				className={cn(
					"min-w-0",
					isDragging && preserveSourceFootprint && "pointer-events-none absolute inset-x-0 top-0 opacity-(--opacity-disabled)",
					isFollower && preserveSourceFootprint && "pointer-events-none opacity-(--opacity-disabled)",
					(isFollower && !preserveSourceFootprint || (isDragging && !preserveSourceFootprint)) && "pointer-events-none absolute inset-x-0 top-0 opacity-0",
					sessionDragBind && "touch-none select-none",
					isDragging && "cursor-grabbing [&_article]:cursor-grabbing",
				)}
				inert={isDragging || isFollower || undefined}
			>
				{children(sessionDragBind)}
			</div>
			{isDragging ? (
				<AgentSessionDragOverlay
					chipOrigin={chipOrigin}
					cohort={ghostCohort ?? singletonSessionCohort(item)}
					isDraggedOut={isDraggedOut}
					onEntranceSettled={() => setChipSettled(true)}
					pointerX={chipPointer.x}
					pointerY={chipPointer.y}
					reduceMotion={reduceChipMotion}
					settled={chipSettled}
				/>
			) : null}
		</div>
	);
}
