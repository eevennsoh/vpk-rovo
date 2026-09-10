"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import StatusInformationIcon from "@atlaskit/icon/core/status-information";
import StatusSuccessIcon from "@atlaskit/icon/core/status-success";
import StatusWarningIcon from "@atlaskit/icon/core/status-warning";

import { IconTile } from "@/components/ui/icon-tile";
import { Spinner } from "@/components/ui/spinner";

import type { AgentSessionItem } from "./agent-session-types";

/**
 * Enter is the attention-getting beat, exit gets out of the way. Resolved token
 * values because Motion cannot read `var()` — `duration-normal` +
 * `ease-out-practical` in, `duration-fast` + `ease-in` out. The exit timing
 * lives in the exit variant's own transition; a lone `transition` prop would
 * silently run the exit at the enter timing.
 */
const INDICATOR_ENTER = { duration: 0.15, ease: [0.4, 1, 0.6, 1] } as const;
const INDICATOR_EXIT = { duration: 0.1, ease: [0.6, 0, 0.8, 0.6] } as const;

/** Fixed-size shell so a state change never reflows the row's trailing column. */
function IndicatorSlot({ children }: Readonly<{ children: React.ReactNode }>) {
	return <span className="grid size-6 shrink-0 place-items-center">{children}</span>;
}

function IndicatorGlyph({ state }: Readonly<{ state: AgentSessionItem["state"] }>) {
	switch (state) {
		case "running":
			// The experimental orb rather than the pixel loader: `pulse` converges
			// the six dots to the center and grows them back out, so the working
			// state reads as one continuous breath instead of a marching pattern.
			return (
				<Spinner
					className="text-icon-subtle"
					label="Working"
					pulse
					size="default"
					variant="experimental"
				/>
			);
		case "needs-input":
			return (
				<IconTile
					icon={
						<span className="grid place-items-center leading-none text-icon-information">
							<StatusInformationIcon color="currentColor" label="" size="small" />
						</span>
					}
					iconSize="small"
					label="Needs input"
					size="small"
					title="Needs input"
					variant="transparent"
				/>
			);
		case "attention":
			return (
				<IconTile
					icon={
						<span className="grid place-items-center leading-none text-icon-warning">
							<StatusWarningIcon color="currentColor" label="" size="small" />
						</span>
					}
					iconSize="small"
					label="Needs attention"
					size="small"
					title="Needs attention"
					variant="transparent"
				/>
			);
		case "complete":
			return (
				<IconTile
					icon={
						<span className="grid place-items-center leading-none text-icon-success">
							<StatusSuccessIcon color="currentColor" label="" size="small" />
						</span>
					}
					iconSize="small"
					label="Complete"
					size="small"
					title="Complete"
					variant="transparent"
				/>
			);
	}
}

/**
 * Trailing lifecycle indicator for a long-form session row.
 *
 * Unlike Agent List's built-in indicator this one covers `complete` too, with a
 * success check — a title-led row has no other place to say the work landed.
 * Each state grows in and out on the swap so a session moving from working to
 * finished reads as a transition rather than a substitution.
 */
export function AgentSessionLifecycle({ state }: Readonly<{ state: AgentSessionItem["state"] }>) {
	const shouldReduceMotion = useReducedMotion();

	if (shouldReduceMotion) {
		return (
			<IndicatorSlot>
				<IndicatorGlyph state={state} />
			</IndicatorSlot>
		);
	}

	return (
		<IndicatorSlot>
			<AnimatePresence initial={false} mode="popLayout">
				<motion.span
					animate={{ opacity: 1, scale: 1 }}
					className="grid place-items-center"
					exit={{ opacity: 0, scale: 0.6, transition: INDICATOR_EXIT }}
					initial={{ opacity: 0, scale: 0.6 }}
					key={state}
					style={{ willChange: "opacity, transform" }}
					transition={INDICATOR_ENTER}
				>
					<IndicatorGlyph state={state} />
				</motion.span>
			</AnimatePresence>
		</IndicatorSlot>
	);
}
