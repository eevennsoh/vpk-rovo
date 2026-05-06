"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, type ReactNode } from "react";
import {
	AnimatePresence,
	motion,
	useIsPresent,
	useMotionValue,
	useReducedMotion,
	useSpring,
	type MotionStyle,
	type Transition,
} from "motion/react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
	PERSONAL_GRAPH_CHROMATIC_RGB_GLASS_PROPS,
	PersonalGraphGlassPanel,
} from "./personal-graph-glass-panel";
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
const ACTION_MAGNET_DISTANCE = 10;
const ACTION_MAGNET_HOVER_AREA = 24;
const ACTION_MAGNET_SPRING = {
	damping: 50,
	stiffness: 900,
	mass: 0.5,
	restDelta: 0.001,
} as const;

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

function getActionMagnetRect(element: HTMLSpanElement): DOMRect {
	const actionRect = element.getBoundingClientRect();
	const label = element.querySelector<HTMLSpanElement>(
		"[data-personal-graph-flyout-label]",
	);
	const labelRect = label?.getBoundingClientRect();

	if (
		!labelRect ||
		labelRect.width <= 0 ||
		labelRect.height <= 0
	) {
		return actionRect;
	}

	const left = Math.min(actionRect.left, labelRect.left);
	const top = Math.min(actionRect.top, labelRect.top);
	const right = Math.max(actionRect.right, labelRect.right);
	const bottom = Math.max(actionRect.bottom, labelRect.bottom);

	return DOMRect.fromRect({
		x: left,
		y: top,
		width: right - left,
		height: bottom - top,
	});
}

function usePersonalGraphFlyoutActionMagnet() {
	const shouldReduceMotion = useReducedMotion();
	const actionRef = useRef<HTMLSpanElement>(null);
	const actionMagnetX = useMotionValue(0);
	const actionMagnetY = useMotionValue(0);
	const actionSpringX = useSpring(actionMagnetX, ACTION_MAGNET_SPRING);
	const actionSpringY = useSpring(actionMagnetY, ACTION_MAGNET_SPRING);

	useEffect(() => {
		if (shouldReduceMotion) {
			actionMagnetX.set(0);
			actionMagnetY.set(0);
			return;
		}
		if (typeof document === "undefined") return;

		const handleMove = (event: MouseEvent) => {
			const element = actionRef.current;
			if (!element) return;
			const rect = getActionMagnetRect(element);
			if (rect.width <= 0 || rect.height <= 0) return;

			const isWithinActivation =
				event.clientX >= rect.left - ACTION_MAGNET_HOVER_AREA &&
				event.clientX <= rect.right + ACTION_MAGNET_HOVER_AREA &&
				event.clientY >= rect.top - ACTION_MAGNET_HOVER_AREA &&
				event.clientY <= rect.bottom + ACTION_MAGNET_HOVER_AREA;

			if (isWithinActivation) {
				const dx = event.clientX - (rect.left + rect.width / 2);
				const dy = event.clientY - (rect.top + rect.height / 2);
				const ratioX = Math.max(-1, Math.min(1, dx / (rect.width / 2)));
				const ratioY = Math.max(-1, Math.min(1, dy / (rect.height / 2)));
				actionMagnetX.set(ratioX * ACTION_MAGNET_DISTANCE);
				actionMagnetY.set(ratioY * ACTION_MAGNET_DISTANCE);
				return;
			}

			actionMagnetX.set(0);
			actionMagnetY.set(0);
		};

		document.addEventListener("mousemove", handleMove, { passive: true });
		return () => {
			document.removeEventListener("mousemove", handleMove);
			actionMagnetX.set(0);
			actionMagnetY.set(0);
		};
	}, [shouldReduceMotion, actionMagnetX, actionMagnetY]);

	const magnetStyle: MotionStyle = {
		x: actionSpringX,
		y: actionSpringY,
	};

	return { actionRef, magnetStyle };
}

function PersonalGraphControlFlyoutActionMagnet({
	children,
}: Readonly<{ children: ReactNode }>) {
	const { actionRef, magnetStyle } = usePersonalGraphFlyoutActionMagnet();

	return (
		<motion.span
			className="relative inline-flex items-center justify-center"
			ref={actionRef}
			style={{ ...magnetStyle, willChange: "transform" }}
		>
			{children}
		</motion.span>
	);
}

function PersonalGraphControlFlyoutActionGlass({
	children,
}: Readonly<{ children: ReactNode }>) {
	return (
		<span className={ACTION_GLASS_BUTTON_CLASS_NAME}>
			<PersonalGraphGlassPanel
				className="rounded-full"
				contentClassName="flex size-8 items-center justify-center"
				glassProps={PERSONAL_GRAPH_CHROMATIC_RGB_GLASS_PROPS}
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
	disabled?: boolean;
	isOpen: boolean;
	onToggle: () => void;
}

export function PersonalGraphControlFlyoutTrigger({
	className,
	disabled = false,
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
				disabled={disabled}
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
									<PersonalGraphControlFlyoutActionMagnet>
										<motion.span
											animate={{ opacity: 1, x: 0 }}
											className="pointer-events-none absolute right-[calc(100%+12px)] top-1/2 hidden -translate-y-1/2 whitespace-nowrap rounded-md bg-bg-neutral-bold px-3 py-1.5 text-xs text-text-inverse shadow-md sm:block"
											data-personal-graph-flyout-label=""
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
									</PersonalGraphControlFlyoutActionMagnet>
								</PersonalGraphControlFlyoutActionItem>
							);
						})
					: null}
			</AnimatePresence>
		</div>
	);
}
