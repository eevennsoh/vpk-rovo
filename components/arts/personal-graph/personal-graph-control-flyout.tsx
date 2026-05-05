"use client";

import { useCallback, useLayoutEffect, useRef, type ReactNode } from "react";
import { AnimatePresence, motion, useIsPresent, type Transition } from "motion/react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PersonalGraphGlassPanel } from "./personal-graph-glass-panel";
import { PixelCloseIcon, PixelConfigureIcon } from "./personal-graph-pixel-icons";

export interface PersonalGraphControlFlyoutAction {
	key: string;
	label: string;
	render: ReactNode;
}

const TRIGGER_TRANSITION: Transition = { type: "spring", stiffness: 500, damping: 30 };
const ITEM_TRANSITION: Transition = { type: "spring", stiffness: 400, damping: 22 };
const STAGGER_INTERVAL = 0.05;
const ACTION_SCALE_INITIAL = 0.34;
const ARC_ORIGIN_VISIBILITY_THRESHOLD_PERCENT = 2;
const ARC_EXIT_BEHIND_TRIGGER_THRESHOLD_PERCENT = 40;
const ACTION_ACTIVE_Z_INDEX = 40;
const ACTION_BEHIND_TRIGGER_Z_INDEX = 0;

// Cubic bezier curving up and to the right — closer to Motion's reference (~21° top tilt)
// than the dramatic sweep (~56°), settling around ~30° at the top.
// Combined with offsetRotate: "auto 90deg" on each item, the buttons (and their child labels)
// rotate along the path tangent. End-tangent ~(82, -145) yields ~30° clockwise tilt at the top.
const ARC_PATH = "M 0 0 C 0 -92, 20 -185, 102 -330";
// Step% chosen so consecutive 32px controls are spaced ~44px center-to-center,
// leaving a ~12px visual gap along the arc.
const ARC_ACTION_STEP_PERCENT = 12.6;

const ACTION_GLASS_BUTTON_CLASS_NAME = cn(
	"relative isolate inline-flex size-8 items-center justify-center rounded-full",
	"[&_button]:relative [&_button]:z-10 [&_button]:size-8",
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
			<PersonalGraphGlassPanel
				className="rounded-full"
				contentClassName="flex size-8 items-center justify-center"
				height={32}
				radius={9999}
				width={32}
			>
				{children}
			</PersonalGraphGlassPanel>
		</span>
	);
}

function getOffsetDistancePercent(offsetDistance: unknown): number {
	if (typeof offsetDistance === "number") return offsetDistance;
	if (typeof offsetDistance !== "string") return 0;
	const parsedDistance = Number.parseFloat(offsetDistance);
	return Number.isFinite(parsedDistance) ? parsedDistance : 0;
}

function getFlyoutActionEnterDelay(index: number): number {
	return index * STAGGER_INTERVAL;
}

function getFlyoutActionExitDelay(index: number): number {
	return getFlyoutActionEnterDelay(index);
}

interface PersonalGraphControlFlyoutActionItemProps {
	children: ReactNode;
	distance: number;
	index: number;
	label: string;
}

function PersonalGraphControlFlyoutActionItem({
	children,
	distance,
	index,
	label,
}: Readonly<PersonalGraphControlFlyoutActionItemProps>) {
	const itemRef = useRef<HTMLDivElement>(null);
	const isPresent = useIsPresent();
	const enterDelay = getFlyoutActionEnterDelay(index);
	const exitDelay = getFlyoutActionExitDelay(index);
	const updateOriginVisibility = useCallback((offsetDistance: unknown) => {
		const item = itemRef.current;
		if (!item) return;
		const distancePercent = getOffsetDistancePercent(offsetDistance);
		const isOpeningAtOrigin = isPresent && distancePercent < ARC_ORIGIN_VISIBILITY_THRESHOLD_PERCENT;
		const isExitingNearTrigger = !isPresent && distancePercent < ARC_EXIT_BEHIND_TRIGGER_THRESHOLD_PERCENT;
		item.style.zIndex = isExitingNearTrigger
			? ACTION_BEHIND_TRIGGER_Z_INDEX.toString()
			: ACTION_ACTIVE_Z_INDEX.toString();
		item.style.visibility = isOpeningAtOrigin ? "hidden" : "";
		item.style.pointerEvents = isOpeningAtOrigin || isExitingNearTrigger ? "none" : "";
	}, [isPresent]);

	useLayoutEffect(() => {
		const item = itemRef.current;
		if (!item || isPresent) return;
		updateOriginVisibility(getComputedStyle(item).offsetDistance);
	}, [isPresent, updateOriginVisibility]);

	return (
		<motion.div
			animate={{
				offsetDistance: `${distance}%`,
				scale: 1,
				transition: { ...ITEM_TRANSITION, delay: enterDelay },
			}}
			aria-label={label}
			className="pointer-events-auto absolute"
			exit={{
				offsetDistance: "0%",
				scale: ACTION_SCALE_INITIAL,
				transition: { ...ITEM_TRANSITION, delay: exitDelay },
			}}
			initial={{ offsetDistance: "0%", scale: ACTION_SCALE_INITIAL }}
			onUpdate={(latest) => updateOriginVisibility(latest.offsetDistance)}
			ref={itemRef}
			style={{
				offsetPath: `path("${ARC_PATH}")`,
				offsetRotate: "auto 90deg",
				offsetAnchor: "center center",
				transformOrigin: "center",
				visibility: "hidden",
				willChange: "transform",
				zIndex: ACTION_ACTIVE_Z_INDEX,
			}}
		>
			{children}
		</motion.div>
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
			className="relative z-50 inline-flex"
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
			className={cn("pointer-events-none absolute", className)}
			style={{ width: 0, height: 0 }}
		>
			<AnimatePresence>
				{isOpen
					? actions.map((action, index) => {
							const distance = (index + 1) * ARC_ACTION_STEP_PERCENT;
							return (
								<PersonalGraphControlFlyoutActionItem
									distance={distance}
									index={index}
									key={action.key}
									label={action.label}
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
								</PersonalGraphControlFlyoutActionItem>
							);
						})
					: null}
			</AnimatePresence>
		</div>
	);
}
