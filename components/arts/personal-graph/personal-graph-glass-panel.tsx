"use client";

import {
	createContext,
	use,
	useCallback,
	useEffect,
	useRef,
	type CSSProperties,
	type ReactNode,
	type Ref,
	type RefObject,
} from "react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import LiquidGlass, {
	type LiquidGlassProps,
} from "@/components/website/demos/visual/shaders/liquid-glass";
import {
	LIQUID_GLASS_BUTTON_DEFAULT_GLASS_PROPS,
} from "@/components/website/demos/visual/shaders/liquid-glass-button";
import { clamp, cn } from "@/lib/utils";

type PersonalGraphGlassTuningProps = Partial<
	Omit<LiquidGlassProps, "children" | "className" | "height" | "style" | "width">
>;

type PersonalGraphLiquidGlassIconButtonProps = Omit<
	ButtonProps,
	"children" | "className" | "isLoading" | "size" | "variant"
> & {
	children?: ReactNode;
	className?: string;
	glassProps?: PersonalGraphGlassTuningProps;
	isLoading?: boolean;
};

interface PersonalGraphGlassPanelProps {
	children: ReactNode;
	className?: string;
	contentClassName?: string;
	glassProps?: PersonalGraphGlassTuningProps;
	height?: number | string;
	radius?: number;
	width?: number | string;
}

interface PersonalGraphLiquidGlassStageProviderProps {
	children: ReactNode;
	stageRef: RefObject<HTMLElement | null>;
}

const PERSONAL_GRAPH_LIQUID_GLASS_POINTER_ACTIVATION_RADIUS = Number.POSITIVE_INFINITY;
const PERSONAL_GRAPH_LIQUID_GLASS_POINTER_SMOOTHING = 0.2;
const PERSONAL_GRAPH_ICON_BUTTON_RADIUS = 9999;
const PERSONAL_GRAPH_ICON_BUTTON_POINTER_SMOOTHING_REST_DELTA = 0.01;
export const PERSONAL_GRAPH_DEMO_GLASS_PROPS = {
	...LIQUID_GLASS_BUTTON_DEFAULT_GLASS_PROPS,
	displace: 5,
	redOffset: 0,
	greenOffset: 0,
	blueOffset: 0,
	xChannel: "R",
	yChannel: "G",
} satisfies PersonalGraphGlassTuningProps;

export const PERSONAL_GRAPH_CHROMATIC_RGB_GLASS_PROPS = {
	...PERSONAL_GRAPH_DEMO_GLASS_PROPS,
	distortionScale: -180,
	dispersion: 0,
	redOffset: 50,
	greenOffset: -1,
	blueOffset: -19,
} satisfies PersonalGraphGlassTuningProps;

const PERSONAL_GRAPH_LIQUID_GLASS_ICON_BUTTON_PROPS = {
	...PERSONAL_GRAPH_CHROMATIC_RGB_GLASS_PROPS,
	backgroundOpacity: 0,
	borderOpacity: 0,
	fallbackBackgroundOpacity: 0,
} satisfies Partial<LiquidGlassProps>;

const PersonalGraphLiquidGlassStageContext = createContext<RefObject<HTMLElement | null> | null>(null);

interface PersonalGraphIconButtonPointerState {
	angle: number;
	strength: number;
	x: number;
	y: number;
}

function roundCssNumber(value: number): number {
	return Math.round(value * 1000) / 1000;
}

function getShortestAngleDelta(from: number, to: number): number {
	return ((((to - from) % 360) + 540) % 360) - 180;
}

function getSmoothedIconButtonPointerState(
	current: PersonalGraphIconButtonPointerState,
	target: PersonalGraphIconButtonPointerState,
	amount: number,
): PersonalGraphIconButtonPointerState {
	return {
		angle: current.angle + getShortestAngleDelta(current.angle, target.angle) * amount,
		strength: current.strength + (target.strength - current.strength) * amount,
		x: current.x + (target.x - current.x) * amount,
		y: current.y + (target.y - current.y) * amount,
	};
}

function isIconButtonPointerStateSettled(
	current: PersonalGraphIconButtonPointerState,
	target: PersonalGraphIconButtonPointerState,
): boolean {
	return Math.abs(current.x - target.x) < PERSONAL_GRAPH_ICON_BUTTON_POINTER_SMOOTHING_REST_DELTA
		&& Math.abs(current.y - target.y) < PERSONAL_GRAPH_ICON_BUTTON_POINTER_SMOOTHING_REST_DELTA
		&& Math.abs(current.strength - target.strength) < PERSONAL_GRAPH_ICON_BUTTON_POINTER_SMOOTHING_REST_DELTA
		&& Math.abs(getShortestAngleDelta(current.angle, target.angle)) < PERSONAL_GRAPH_ICON_BUTTON_POINTER_SMOOTHING_REST_DELTA;
}

function getPointerStrength(
	x: number,
	y: number,
	width: number,
	height: number,
	activationRadius: number,
): number {
	if (activationRadius <= 0) {
		return x >= 0 && x <= width && y >= 0 && y <= height ? 1 : 0;
	}
	const edgeDistanceX = x < 0 ? -x : x > width ? x - width : 0;
	const edgeDistanceY = y < 0 ? -y : y > height ? y - height : 0;
	const edgeDistance = Math.hypot(edgeDistanceX, edgeDistanceY);
	return clamp(1 - edgeDistance / activationRadius, 0, 1);
}

function getPointerAngle(x: number, y: number, width: number, height: number): number {
	const dx = x - width / 2;
	const dy = y - height / 2;
	return roundCssNumber(90 + (Math.atan2(dy, dx) * 180) / Math.PI);
}

function setComposedButtonRef(ref: Ref<HTMLButtonElement> | undefined, node: HTMLButtonElement | null) {
	if (!ref) return;
	if (typeof ref === "function") {
		ref(node);
		return;
	}
	ref.current = node;
}

function getPersonalGraphStageTrackingGlassProps(
	stageRef: RefObject<HTMLElement | null> | null,
): PersonalGraphGlassTuningProps {
	return {
		mouseContainer: stageRef,
		pointerActivationRadius: PERSONAL_GRAPH_LIQUID_GLASS_POINTER_ACTIVATION_RADIUS,
		pointerLayers: true,
		pointerSmoothing: PERSONAL_GRAPH_LIQUID_GLASS_POINTER_SMOOTHING,
	};
}

export function PersonalGraphLiquidGlassStageProvider({
	children,
	stageRef,
}: Readonly<PersonalGraphLiquidGlassStageProviderProps>) {
	return (
		<PersonalGraphLiquidGlassStageContext value={stageRef}>
			{children}
		</PersonalGraphLiquidGlassStageContext>
	);
}

export function PersonalGraphGlassPanel({
	children,
	className,
	contentClassName,
	glassProps,
	height = "auto",
	radius = 24,
	width = "100%",
}: Readonly<PersonalGraphGlassPanelProps>) {
	const stageRef = use(PersonalGraphLiquidGlassStageContext);

	return (
		<LiquidGlass
			{...getPersonalGraphStageTrackingGlassProps(stageRef)}
			{...PERSONAL_GRAPH_CHROMATIC_RGB_GLASS_PROPS}
			borderRadius={radius}
			className={cn("text-text [&>div]:p-0", className)}
			height={height}
			width={width}
			{...glassProps}
		>
			<div className={cn("h-full w-full", contentClassName)}>{children}</div>
		</LiquidGlass>
	);
}

export function PersonalGraphLiquidGlassIconButton({
	children,
	className,
	disabled,
	glassProps,
	isLoading = false,
	onBlur,
	onKeyDown,
	onKeyUp,
	onPointerCancel,
	onPointerDown,
	onPointerUp,
	ref: externalRef,
	style,
	...props
}: Readonly<PersonalGraphLiquidGlassIconButtonProps>) {
	const stageRef = use(PersonalGraphLiquidGlassStageContext);
	const buttonRef = useRef<HTMLButtonElement>(null);
	const pointerAnimationFrameRef = useRef<number | null>(null);
	const pointerCurrentRef = useRef<PersonalGraphIconButtonPointerState | null>(null);
	const pointerTargetRef = useRef<PersonalGraphIconButtonPointerState | null>(null);
	const isDisabled = disabled || isLoading;
	const stageTrackingGlassProps = getPersonalGraphStageTrackingGlassProps(stageRef);
	const resolvedGlassProps = {
		...PERSONAL_GRAPH_LIQUID_GLASS_ICON_BUTTON_PROPS,
		...stageTrackingGlassProps,
		...glassProps,
	} satisfies PersonalGraphGlassTuningProps;
	const composedButtonRef = useCallback((node: HTMLButtonElement | null) => {
		buttonRef.current = node;
		setComposedButtonRef(externalRef, node);
	}, [externalRef]);

	const writePointerState = useCallback((state: PersonalGraphIconButtonPointerState) => {
		const button = buttonRef.current;
		if (!button) return;
		button.style.setProperty("--liquid-glass-button-pointer-x", `${roundCssNumber(state.x)}px`);
		button.style.setProperty("--liquid-glass-button-pointer-y", `${roundCssNumber(state.y)}px`);
		button.style.setProperty("--liquid-glass-button-strength", String(roundCssNumber(state.strength)));
		button.style.setProperty("--liquid-glass-button-angle", `${roundCssNumber(state.angle)}deg`);
	}, []);

	const schedulePointerState = useCallback((target: PersonalGraphIconButtonPointerState) => {
		const smoothingAmount = clamp(
			PERSONAL_GRAPH_LIQUID_GLASS_POINTER_SMOOTHING,
			0.01,
			1,
		);
		pointerTargetRef.current = target;

		if (smoothingAmount >= 1) {
			if (pointerAnimationFrameRef.current !== null) {
				cancelAnimationFrame(pointerAnimationFrameRef.current);
				pointerAnimationFrameRef.current = null;
			}
			pointerCurrentRef.current = target;
			writePointerState(target);
			return;
		}

		if (!pointerCurrentRef.current) {
			pointerCurrentRef.current = target;
			writePointerState(target);
			return;
		}

		if (pointerAnimationFrameRef.current !== null) return;

		const animatePointer = () => {
			const current = pointerCurrentRef.current;
			const latestTarget = pointerTargetRef.current;
			if (!current || !latestTarget) {
				pointerAnimationFrameRef.current = null;
				return;
			}

			const next = getSmoothedIconButtonPointerState(current, latestTarget, smoothingAmount);
			const settled = isIconButtonPointerStateSettled(next, latestTarget);
			const resolvedNext = settled ? latestTarget : next;
			pointerCurrentRef.current = resolvedNext;
			writePointerState(resolvedNext);
			pointerAnimationFrameRef.current = settled
				? null
				: requestAnimationFrame(animatePointer);
		};

		pointerAnimationFrameRef.current = requestAnimationFrame(animatePointer);
	}, [writePointerState]);

	const setPointerInactive = useCallback(() => {
		const current = pointerCurrentRef.current ?? pointerTargetRef.current;
		if (!current) {
			buttonRef.current?.style.setProperty("--liquid-glass-button-strength", "0");
			return;
		}
		schedulePointerState({ ...current, strength: 0 });
	}, [schedulePointerState]);

	const updatePointer = useCallback((clientX: number, clientY: number, active: boolean) => {
		const button = buttonRef.current;
		if (!button) return;
		const rect = button.getBoundingClientRect();
		if (rect.width <= 0 || rect.height <= 0) return;
		const x = clientX - rect.left;
		const y = clientY - rect.top;
		schedulePointerState({
			angle: getPointerAngle(x, y, rect.width, rect.height),
			strength: isDisabled || !active
				? 0
				: getPointerStrength(
						x,
						y,
						rect.width,
						rect.height,
						PERSONAL_GRAPH_LIQUID_GLASS_POINTER_ACTIVATION_RADIUS,
					),
			x,
			y,
		});
	}, [isDisabled, schedulePointerState]);

	const setPressed = useCallback((pressed: boolean) => {
		buttonRef.current?.style.setProperty(
			"--liquid-glass-button-pressed",
			pressed ? "1" : "0",
		);
	}, []);

	useEffect(() => {
		if (isDisabled) {
			setPressed(false);
			setPointerInactive();
			return;
		}
		const target = stageRef?.current ?? buttonRef.current;
		if (!target) return;

		const handlePointerMove = (event: PointerEvent) => {
			updatePointer(event.clientX, event.clientY, true);
		};
		target.addEventListener("pointermove", handlePointerMove, { passive: true });
		target.addEventListener("pointerleave", setPointerInactive);
		return () => {
			target.removeEventListener("pointermove", handlePointerMove);
			target.removeEventListener("pointerleave", setPointerInactive);
		};
	}, [isDisabled, setPointerInactive, setPressed, stageRef, updatePointer]);

	useEffect(() => {
		return () => {
			if (pointerAnimationFrameRef.current === null) return;
			cancelAnimationFrame(pointerAnimationFrameRef.current);
		};
	}, []);

	return (
		<Button
			aria-busy={isLoading || undefined}
			className={cn(
				"relative isolate min-w-0 overflow-hidden rounded-full border-0 p-0 shadow-none",
				className,
			)}
			disabled={isDisabled}
			onBlur={(event) => {
				setPressed(false);
				setPointerInactive();
				onBlur?.(event);
			}}
			onKeyDown={(event) => {
				if (event.key === " " || event.key === "Enter") setPressed(true);
				onKeyDown?.(event);
			}}
			onKeyUp={(event) => {
				if (event.key === " " || event.key === "Enter") setPressed(false);
				onKeyUp?.(event);
			}}
			onPointerCancel={(event) => {
				setPressed(false);
				setPointerInactive();
				onPointerCancel?.(event);
			}}
			onPointerDown={(event) => {
				setPressed(true);
				onPointerDown?.(event);
			}}
			onPointerUp={(event) => {
				setPressed(false);
				onPointerUp?.(event);
			}}
			ref={composedButtonRef}
			size="icon"
			style={{
				...style,
				"--liquid-glass-button-pointer-x": "50%",
				"--liquid-glass-button-pointer-y": "50%",
				"--liquid-glass-button-strength": "0",
				"--liquid-glass-button-pressed": "0",
				"--liquid-glass-button-angle": "135deg",
			} as CSSProperties}
			variant="ghost"
			{...props}
		>
			<LiquidGlass
				{...resolvedGlassProps}
				borderRadius={PERSONAL_GRAPH_ICON_BUTTON_RADIUS}
				className="pointer-events-none absolute inset-0"
				height="100%"
				pointerLayers={isDisabled ? false : resolvedGlassProps.pointerLayers}
				style={{
					borderRadius: PERSONAL_GRAPH_ICON_BUTTON_RADIUS,
					zIndex: 0,
				}}
				width="100%"
			/>
			<span
				aria-hidden="true"
				className="pointer-events-none absolute inset-0 rounded-[inherit]"
				style={{
					padding: 1.5,
					background:
						"linear-gradient(var(--liquid-glass-button-angle, 135deg), transparent 0%, color-mix(in srgb, var(--ds-surface-overlay) 52%, var(--ds-text-inverse) 48%) 42%, transparent 72%)",
					opacity:
						"calc(var(--liquid-glass-button-strength, 0) * 0.48 + var(--liquid-glass-button-pressed, 0) * 0.18)",
					transition: "opacity var(--duration-normal) var(--ease-out)",
					WebkitMask:
						"linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
					WebkitMaskComposite: "xor",
					maskComposite: "exclude",
					zIndex: 1,
				}}
			/>
			<span className="relative z-10 inline-flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap">
				{isLoading ? <Spinner size="sm" /> : children}
			</span>
		</Button>
	);
}
