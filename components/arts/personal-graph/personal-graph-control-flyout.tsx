"use client";

import type { ReactNode } from "react";
import { AnimatePresence, motion, type Transition } from "motion/react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PixelCloseIcon, PixelConfigureIcon } from "./personal-graph-pixel-icons";

export interface PersonalGraphControlFlyoutAction {
	key: string;
	label: string;
	render: ReactNode;
}

const TRIGGER_TRANSITION: Transition = { type: "spring", stiffness: 500, damping: 30 };
const ITEM_TRANSITION: Transition = { type: "spring", stiffness: 400, damping: 22 };
const STAGGER_INTERVAL = 0.05;

// Cubic bezier curving up and to the right — closer to Motion's reference (~21° top tilt)
// than the dramatic sweep (~56°), settling around ~30° at the top.
// Combined with offsetRotate: "auto 90deg" on each item, the buttons (and their child labels)
// rotate along the path tangent. End-tangent ~(82, -145) yields ~30° clockwise tilt at the top.
const ARC_PATH = "M 0 0 C 0 -92, 20 -185, 102 -330";
// Travel% chosen so consecutive actions are spaced ~48px (40px button + 8px gap) along the arc.
// Approximate arc length ≈ 335. 335 * 0.72 / 5 ≈ 48.2 → ≈ 8px visual gap preserved.
const ARC_TRAVEL_PERCENT = 72;

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
					"size-8 rounded-full border-0 text-text-subtle shadow-none hover:bg-bg-neutral-subtle-hovered",
					"aria-expanded:bg-transparent aria-expanded:text-text-subtle aria-expanded:border-transparent [&_svg]:text-icon-subtle aria-expanded:[&_svg]:text-icon-subtle",
					className,
				)}
				onClick={onToggle}
				size="icon"
				type="button"
				variant="ghost"
			>
				{isOpen ? <PixelCloseIcon /> : <PixelConfigureIcon />}
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
										offsetRotate: "auto 90deg",
										offsetAnchor: "center center",
										willChange: "transform, opacity",
									}}
									transition={{ ...ITEM_TRANSITION, delay: index * STAGGER_INTERVAL }}
								>
									<motion.span
										animate={{ opacity: 1, x: 0 }}
										className="pointer-events-none absolute right-[calc(100%+12px)] top-1/2 hidden -translate-y-1/2 whitespace-nowrap rounded-lg border border-border bg-bg-neutral-subtle px-2.5 py-1 text-xs font-medium text-text shadow-sm sm:block"
										exit={{ opacity: 0, x: 8 }}
										initial={{ opacity: 0, x: 8 }}
										style={{ willChange: "transform, opacity" }}
										transition={{ delay: index * STAGGER_INTERVAL + 0.1, duration: 0.15 }}
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
