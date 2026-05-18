"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import ArrowLeftIcon from "@atlaskit/icon/core/arrow-left";

import { useRovoSelectedAgent } from "@/app/contexts";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";

const ROVO_AGENT_BACK_BUTTON_VARIANTS = {
	hidden: {
		opacity: 0,
		transform: "translateX(-6px)",
	},
	visible: {
		opacity: 1,
		transform: "translateX(0px)",
		transition: {
			type: "spring",
			bounce: 0,
			visualDuration: 0.16,
		},
	},
	exit: {
		opacity: 0,
		transform: "translateX(-6px)",
		transition: {
			duration: 0.08,
		},
	},
} as const;
const ROVO_AGENT_BACK_BUTTON_REDUCED_VARIANTS = {
	hidden: {
		opacity: 0,
	},
	visible: {
		opacity: 1,
		transition: {
			duration: 0.08,
		},
	},
	exit: {
		opacity: 0,
		transition: {
			duration: 0.08,
		},
	},
} as const;

export function RovoAgentBackButton() {
	const { isCustomAgentSelected, resetAgentToRovo } = useRovoSelectedAgent();
	const shouldReduceMotion = Boolean(useReducedMotion());
	const buttonVariants = shouldReduceMotion ? ROVO_AGENT_BACK_BUTTON_REDUCED_VARIANTS : ROVO_AGENT_BACK_BUTTON_VARIANTS;

	return (
		<AnimatePresence initial={false}>
			{isCustomAgentSelected ? (
				<motion.div
					animate="visible"
					className="shrink-0"
					exit="exit"
					initial="hidden"
					key="back-to-rovo"
					variants={buttonVariants}
				>
					<Button aria-label="Back to Rovo" size="icon" variant="ghost" onClick={resetAgentToRovo}>
						<Icon aria-hidden render={<ArrowLeftIcon label="" />} />
					</Button>
				</motion.div>
			) : null}
		</AnimatePresence>
	);
}
