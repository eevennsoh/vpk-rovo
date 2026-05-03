"use client";

import type { ReactNode } from "react";
import { AnimatePresence, motion, type Transition } from "motion/react";
import LiquidGlass, {
	type LiquidGlassProps,
} from "@/components/website/demos/visual/shaders/liquid-glass";
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

const ACTION_GLASS_PROPS: Partial<LiquidGlassProps> = {
	borderRadius: 9999,
	borderWidth: 0.05,
	brightness: 54,
	opacity: 0.9,
	blur: 4,
	backgroundOpacity: 0.16,
	fallbackBackgroundOpacity: 0.18,
	saturation: 1.08,
	distortionScale: -48,
	dispersion: 4,
	borderColor: "var(--ds-border)",
	borderOpacity: 0.85,
	dropShadow: "0 18px 42px -28px color-mix(in srgb, var(--ds-text) 66%, transparent)",
};

const ACTION_GLASS_BUTTON_CLASS_NAME = cn(
	"relative isolate inline-flex size-10 items-center justify-center rounded-full",
	"[&_button]:relative [&_button]:z-10 [&_button]:size-10",
	"[&_button]:rounded-full [&_button]:border-transparent [&_button]:bg-transparent",
	"[&_button]:text-text [&_button]:shadow-none",
	"[&_button:hover]:bg-transparent [&_button:active]:bg-transparent",
	"[&_button[aria-expanded=true]]:bg-transparent",
	"[&_button:disabled]:bg-transparent [&_button:disabled]:text-text-disabled",
	"[&_button_svg]:text-icon-subtle",
);

function PersonalGraphControlFlyoutActionGlass({
	children,
}: Readonly<{ children: ReactNode }>) {
	return (
		<span className={ACTION_GLASS_BUTTON_CLASS_NAME}>
			<LiquidGlass
				{...ACTION_GLASS_PROPS}
				className="pointer-events-none absolute inset-0 -z-10 rounded-full"
				height="100%"
				width="100%"
			/>
			{children}
		</span>
	);
}

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
										className="pointer-events-none absolute right-[calc(100%+12px)] top-1/2 -translate-y-1/2 whitespace-nowrap rounded-md bg-bg-neutral-bold px-3 py-1.5 text-xs text-text-inverse shadow-md"
										exit={{ opacity: 0, x: 8 }}
										initial={{ opacity: 0, x: 8 }}
										style={{ willChange: "transform, opacity" }}
										transition={{ delay: index * STAGGER_INTERVAL + 0.1, duration: 0.15 }}
									>
										{action.label}
									</motion.span>
									<PersonalGraphControlFlyoutActionGlass>
										{action.render}
									</PersonalGraphControlFlyoutActionGlass>
								</motion.div>
							);
						})
					: null}
			</AnimatePresence>
		</div>
	);
}
