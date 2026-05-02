"use client";

import type { ReactNode } from "react";
import CrossIcon from "@atlaskit/icon/core/cross";
import SettingsIcon from "@atlaskit/icon/core/settings";
import { AnimatePresence, motion, type Transition } from "motion/react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface PersonalGraphControlFlyoutAction {
	key: string;
	label: string;
	render: ReactNode;
}

const TRIGGER_TRANSITION: Transition = { type: "spring", stiffness: 500, damping: 30 };
const ITEM_TRANSITION: Transition = { type: "spring", stiffness: 400, damping: 22 };
const STAGGER_INTERVAL = 0.05;

const ARC_PATH = "M 0 0 C 20 -90, 50 -190, 120 -280";
const ARC_TRAVEL_PERCENT = 90;

interface PersonalGraphControlFlyoutTriggerProps {
	className?: string;
	isOpen: boolean;
	onToggle: () => void;
}

export function PersonalGraphControlFlyoutTrigger({
	className,
	isOpen,
	onToggle,
}: Readonly<PersonalGraphControlFlyoutTriggerProps>) {
	return (
		<motion.span
			animate={{ rotate: isOpen ? 90 : 0 }}
			className="inline-flex"
			style={{ willChange: "transform" }}
			transition={TRIGGER_TRANSITION}
		>
			<Button
				aria-expanded={isOpen}
				aria-label={isOpen ? "Close graph controls" : "Open graph controls"}
				className={cn(
					"size-8 rounded-full border-0 text-text shadow-none hover:bg-bg-neutral-subtle-hovered",
					className,
				)}
				onClick={onToggle}
				size="icon"
				type="button"
				variant="ghost"
			>
				{isOpen ? <CrossIcon label="" /> : <SettingsIcon label="" />}
			</Button>
		</motion.span>
	);
}

interface PersonalGraphControlFlyoutActionsProps {
	actions: ReadonlyArray<PersonalGraphControlFlyoutAction>;
	className?: string;
	isOpen: boolean;
}

export function PersonalGraphControlFlyoutActions({
	actions,
	className,
	isOpen,
}: Readonly<PersonalGraphControlFlyoutActionsProps>) {
	return (
		<div
			aria-hidden={!isOpen}
			className={cn("pointer-events-none absolute z-40", className)}
			style={{ width: 0, height: 0 }}
		>
			<AnimatePresence>
				{isOpen
					? actions.map((action, index) => {
							const distance = ((index + 1) / actions.length) * ARC_TRAVEL_PERCENT;
							return (
								<motion.div
									animate={{ offsetDistance: `${distance}%`, opacity: 1, scale: 1 }}
									aria-label={action.label}
									className="pointer-events-auto absolute"
									exit={{ offsetDistance: "0%", opacity: 0, scale: 0.3 }}
									initial={{ offsetDistance: "0%", opacity: 0, scale: 0.3 }}
									key={action.key}
									style={{
										offsetPath: `path("${ARC_PATH}")`,
										offsetRotate: "0deg",
										offsetAnchor: "center center",
										willChange: "transform, opacity",
									}}
									transition={{ ...ITEM_TRANSITION, delay: index * STAGGER_INTERVAL }}
								>
									<motion.span
										animate={{ opacity: 1, x: 0 }}
										className="pointer-events-none absolute right-[calc(100%+12px)] top-1/2 -translate-y-1/2 whitespace-nowrap rounded-lg border border-border bg-bg-neutral-subtle px-2.5 py-1 text-xs font-medium text-text shadow-sm"
										exit={{ opacity: 0, x: 8 }}
										initial={{ opacity: 0, x: 8 }}
										style={{ willChange: "transform, opacity" }}
										transition={{ delay: index * STAGGER_INTERVAL + 0.1, duration: 0.2 }}
									>
										{action.label}
									</motion.span>
									{action.render}
								</motion.div>
							);
						})
					: null}
			</AnimatePresence>
		</div>
	);
}
