"use client";

import { type ReactNode } from "react";
import { motion, type MotionProps, useReducedMotion } from "motion/react";

import { cn } from "@/lib/utils";

import {
	getJiraCreateMotion,
	getJiraCreateSlotTransition,
	JIRA_CREATE_MOTION_STYLE,
} from "../lib/jira-create-motion";

export interface JiraCreateEntranceProps {
	/** Play the insert-and-push entrance. Off keeps the slot at rest so callers can keep children mounted. */
	active?: boolean;
	children: ReactNode;
	className?: string;
	enterDelayS?: number;
	itemId?: string;
	onAnimationComplete?: MotionProps["onAnimationComplete"];
}

export function JiraCreateEntrance({
	active = true,
	children,
	className,
	enterDelayS = 0,
	itemId,
	onAnimationComplete,
}: Readonly<JiraCreateEntranceProps>) {
	const shouldReduceMotion = useReducedMotion();
	const motionVariants = getJiraCreateMotion(shouldReduceMotion, enterDelayS);
	const slotTransition = getJiraCreateSlotTransition(shouldReduceMotion, enterDelayS);
	const playEntrance = active && !shouldReduceMotion;

	return (
		<motion.div
			animate={{ height: "auto" }}
			className={cn("w-full min-w-0 shrink-0", active ? "overflow-hidden" : null)}
			data-jira-create-item-id={itemId}
			data-slot="jira-create-slot"
			exit={shouldReduceMotion ? { height: "auto" } : { height: 0 }}
			initial={playEntrance ? { height: 0 } : false}
			style={{ boxSizing: "border-box" }}
			transition={slotTransition}
		>
			<motion.div
				animate="show"
				className={cn("w-full min-w-0", className)}
				data-slot="jira-create-card"
				exit="exit"
				initial={active ? "hidden" : false}
				onAnimationComplete={active ? onAnimationComplete : undefined}
				style={{
					...(active ? JIRA_CREATE_MOTION_STYLE : undefined),
					transformOrigin: "top center",
				}}
				variants={motionVariants.card}
			>
				{children}
			</motion.div>
		</motion.div>
	);
}
