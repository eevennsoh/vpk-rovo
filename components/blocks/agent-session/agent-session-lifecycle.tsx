"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import QuestionCircleFilledIcon from "@atlaskit/icon-lab/core/question-circle-filled";
import StatusSuccessIcon from "@atlaskit/icon/core/status-success";
import StatusWarningIcon from "@atlaskit/icon/core/status-warning";

import { Button } from "@/components/ui/button";
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

function lifecycleLabel(state: AgentSessionItem["state"]): string {
	switch (state) {
		case "running":
			return "Working";
		case "needs-input":
			return "Needs input";
		case "attention":
			return "Needs attention";
		case "complete":
			return "Complete";
		default: {
			const exhaustiveState: never = state;
			return exhaustiveState;
		}
	}
}

function IndicatorGlyph({ state }: Readonly<{ state: AgentSessionItem["state"] }>) {
	switch (state) {
		case "running":
			// Same 24×24 slot + Spinner `xl` as `JiraIssueActiveAgentStatusIcon`.
			// IconTile `[&_svg]:size-4!` would shrink the orb to a speck.
			return (
				<Spinner
					className="group-aria-pressed/button:text-icon-selected!"
					label=""
					pulse
					size="xl"
					variant="experimental"
				/>
			);
		case "needs-input":
			return (
				<IconTile
					className="text-icon-information"
					icon={<QuestionCircleFilledIcon color="currentColor" label="" size="small" />}
					iconSize="medium"
					label=""
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
					label=""
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
					label=""
					size="small"
					title="Complete"
					variant="transparent"
				/>
			);
		default: {
			const exhaustiveState: never = state;
			return exhaustiveState;
		}
	}
}

/**
 * Trailing lifecycle indicator for a long-form session row.
 *
 * Unlike Agent List's built-in indicator this one covers `complete` too, with a
 * success check — a title-led row has no other place to say the work landed.
 * Each state grows in and out on the swap so a session moving from working to
 * finished reads as a transition rather than a substitution.
 *
 * The glyph is a ghost icon button so a click gets the shared selected chrome
 * (blue border, selected background, selected icon) instead of falling through
 * to the row.
 */
export function AgentSessionLifecycle({ state }: Readonly<{ state: AgentSessionItem["state"] }>) {
	const shouldReduceMotion = useReducedMotion();
	const [pressed, setPressed] = useState(false);
	const label = lifecycleLabel(state);

	return (
		<Button
			aria-label={label}
			aria-pressed={pressed}
			className="size-6 shadow-none focus-visible:ring-0 aria-pressed:[&_svg]:text-icon-selected"
			onClick={(event) => {
				event.stopPropagation();
				setPressed((current) => !current);
			}}
			onPointerDown={(event) => event.stopPropagation()}
			size="icon-compact"
			type="button"
			variant="ghost"
		>
			<AnimatePresence initial={false} mode="popLayout">
				<motion.div
					animate={shouldReduceMotion ? undefined : { opacity: 1, scale: 1 }}
					className="grid place-items-center"
					exit={shouldReduceMotion
						? undefined
						: { opacity: 0, scale: 0.6, transition: INDICATOR_EXIT }}
					initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.6 }}
					key={state}
					style={shouldReduceMotion ? undefined : { willChange: "opacity, transform" }}
					transition={shouldReduceMotion ? { duration: 0 } : INDICATOR_ENTER}
				>
					<IndicatorGlyph state={state} />
				</motion.div>
			</AnimatePresence>
		</Button>
	);
}
