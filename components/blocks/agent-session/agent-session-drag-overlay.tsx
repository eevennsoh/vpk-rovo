"use client";

import type { MotionValue } from "motion/react";
import { createPortal } from "react-dom";
import { motion } from "motion/react";

import { sessionDragChipViewportStyle } from "@/components/blocks/jira-issue/agent-session-drag";
import type { PointerDragPosition } from "@/components/ui-custom/hooks/use-pointer-drag";

import { AgentSessionCohortChip } from "./agent-session-cohort-chip";
import {
	SESSION_DRAG_CHIP_ENTER_TARGET,
	SESSION_DRAG_CHIP_ENTER_TRANSITION,
	SESSION_DRAG_CHIP_REDUCED_TRANSITION,
} from "./agent-session-drag-motion";
import type { AgentSessionItem } from "./agent-session-types";
import type { SessionCohort } from "./session-cohort";

/**
 * The travelling chip, portalled to `document.body` for the length of a drag.
 *
 * Two transforms, deliberately on two different nodes. The outer follower
 * carries the spring-driven pointer position; the inner node carries the
 * measured FLIP. Sharing one node would make the entrance fight the follow,
 * because both would be writing the same `transform`.
 *
 * Split out of `AgentSessionMediumDrag` so that component is left owning the
 * pointer gesture alone. Nothing here holds state — every value is resolved by
 * the host, which is what makes the split safe for pointer capture.
 */
export function AgentSessionDragOverlay({
	chipOrigin,
	cohort,
	isDraggedOut,
	onEntranceSettled,
	pointerX,
	pointerY,
	reduceMotion,
	settled,
}: Readonly<{
	/** Start offset of the FLIP, relative to the publishing pointer. */
	chipOrigin: PointerDragPosition | null;
	cohort: SessionCohort<AgentSessionItem>;
	isDraggedOut: boolean;
	onEntranceSettled: () => void;
	pointerX: MotionValue<number>;
	pointerY: MotionValue<number>;
	reduceMotion: boolean;
	/** Drops the compositor hint once the entrance has landed. */
	settled: boolean;
}>) {
	if (typeof document === "undefined") {
		return null;
	}

	return createPortal(
		<motion.div
			aria-hidden
			// Above the docked panel (z-40) and session hover flyout (z-200).
			className="pointer-events-none left-0 top-0 z-[400] w-fit"
			data-session-chip-out={isDraggedOut || undefined}
			data-session-drag-overlay=""
			data-session-dragging=""
			style={{
				x: pointerX,
				y: pointerY,
				...sessionDragChipViewportStyle(true),
			}}
		>
			<div
				aria-hidden
				className="pointer-events-none flex w-fit max-w-full -translate-x-1/2 -translate-y-1/2 items-center justify-start"
				data-session-chip-centered=""
			>
				{/* Measured FLIP. The chip slides out of the identity mark the pointer
				    just grabbed and fades in. `data-session-fusion-chip` lives on the
				    lead pill *inside* this transform, never on a wrapper, so the goo's
				    source rect tracks the drawn chip while it converges instead of
				    sitting at the settled pointer. Two properties only — opacity plus
				    the translate — per `.agents/rules/motion-decisions.md`.
				    No exit: the portal is pinned to unmount synchronously on pointerup
				    (`agent-session.test.js` forbids wrapping it in AnimatePresence,
				    which would keep pointer-capture state alive past the drop), and
				    the fusion/flight overlay owns the outgoing frame by replaying the
				    last measured rect. */}
				<motion.div
					animate={SESSION_DRAG_CHIP_ENTER_TARGET}
					className="min-w-0"
					initial={reduceMotion
						? false
						: { opacity: 0, x: chipOrigin?.x ?? 0, y: chipOrigin?.y ?? 0 }}
					onAnimationComplete={onEntranceSettled}
					// Dropped once the entrance settles: a drag can last minutes and
					// the compositor layer has nothing left to accelerate.
					style={{
						willChange: reduceMotion || settled ? undefined : "opacity, transform",
					}}
					transition={reduceMotion
						? SESSION_DRAG_CHIP_REDUCED_TRANSITION
						: SESSION_DRAG_CHIP_ENTER_TRANSITION}
				>
					<AgentSessionCohortChip cohort={cohort} elevated isFusionSource />
				</motion.div>
			</div>
		</motion.div>,
		document.body,
	);
}
