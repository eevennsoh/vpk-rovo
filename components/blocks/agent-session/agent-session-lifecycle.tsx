"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import QuestionCircleFilledIcon from "@atlaskit/icon-lab/core/question-circle-filled";
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

/**
 * Fixed-size shell so a state change never reflows the row's trailing column.
 *
 * A `div` rather than a `span`: every non-running glyph is an `IconTile`, whose
 * root is a block element, and phrasing content cannot legally contain one.
 */
function IndicatorSlot({ children }: Readonly<{ children: React.ReactNode }>) {
	return <div className="grid size-6 shrink-0 place-items-center">{children}</div>;
}

function IndicatorGlyph({ state }: Readonly<{ state: AgentSessionItem["state"] }>) {
	switch (state) {
		case "running":
			// Same 24×24 slot + Spinner `xl` as `JiraIssueActiveAgentStatusIcon`.
			// IconTile `[&_svg]:size-4!` would shrink the orb to a speck.
			return (
				<span
					aria-hidden="true"
					className="grid size-6 shrink-0 place-items-center text-icon"
				>
					<Spinner label="Working" pulse size="xl" variant="experimental" />
				</span>
			);
		case "needs-input":
			return (
				<IconTile
					className="text-icon-information"
					icon={<QuestionCircleFilledIcon color="currentColor" label="" size="small" />}
					iconSize="medium"
					label="Needs input"
					size="small"
					title="Needs input"
					variant="transparent"
				/>
			);
		case "attention":
			return (
				<IconTile
					className="text-icon-warning"
					icon={<StatusWarningIcon color="currentColor" label="" size="small" />}
					iconSize="medium"
					label="Needs attention"
					size="small"
					title="Needs attention"
					variant="transparent"
				/>
			);
		case "complete":
			return (
				<IconTile
					className="text-icon-success"
					icon={<StatusSuccessIcon color="currentColor" label="" size="small" />}
					iconSize="medium"
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
				<motion.div
					animate={{ opacity: 1, scale: 1 }}
					className="grid place-items-center"
					exit={{ opacity: 0, scale: 0.6, transition: INDICATOR_EXIT }}
					initial={{ opacity: 0, scale: 0.6 }}
					key={state}
					style={{ willChange: "opacity, transform" }}
					transition={INDICATOR_ENTER}
				>
					<IndicatorGlyph state={state} />
				</motion.div>
			</AnimatePresence>
		</IndicatorSlot>
	);
}
