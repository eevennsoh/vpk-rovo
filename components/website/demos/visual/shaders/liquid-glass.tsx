"use client";

import type { CSSProperties, ReactNode, RefObject } from "react";
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

import {
	buildLiquidGlassChannelScales,
	buildLiquidGlassDisplacementImageHref,
} from "./liquid-glass-utils";

function clamp(value: number, min: number, max: number): number {
	return Math.min(Math.max(value, min), max);
}

function buildColorMix(color: string, opacity: number): string {
	const safe = clamp(opacity, 0, 1);
	if (safe <= 0) return "transparent";
	if (safe >= 1) return color;
	return `color-mix(in srgb, ${color} ${Math.round(safe * 1000) / 10}%, transparent)`;
}

const DROP_SHADOW = "0 8px 30px -12px rgba(0, 0, 0, 0.18)";
const INNER_HIGHLIGHT_TOP = "inset 0 1px 0 rgba(255, 255, 255, 0.7)";
const INNER_HIGHLIGHT_BOTTOM = "inset 0 -1px 0 rgba(0, 0, 0, 0.05)";
const FALLBACK_BACKDROP_FILTER = "blur(14px) saturate(1.4)";
const DEFAULT_POINTER_ACTIVATION_RADIUS = 180;
const DEFAULT_POINTER_EDGE_COLOR = "color-mix(in srgb, var(--ds-surface-overlay) 72%, var(--ds-text) 28%)";
const DEFAULT_POINTER_SPOT_COLOR = "color-mix(in srgb, var(--ds-surface-overlay) 88%, var(--ds-text-inverse) 12%)";
const POINTER_LAYER_TRANSITION = "opacity 160ms ease-out";
const POINTER_SMOOTHING_REST_DELTA = 0.01;
const useIsomorphicLayoutEffect =
	typeof window === "undefined" ? useEffect : useLayoutEffect;

function buildBoxShadow(
	hairlineColor: string,
	dropShadow: string | false,
): string {
	return [
		dropShadow,
		`inset 0 0 0 1px ${hairlineColor}`,
		INNER_HIGHLIGHT_TOP,
		INNER_HIGHLIGHT_BOTTOM,
	]
		.filter(Boolean)
		.join(", ");
}

export interface LiquidGlassPointerLayer {
	type: "edge" | "spot";
	color?: string;
	opacity?: number;
	blendMode?: CSSProperties["mixBlendMode"];
	size?: number | string;
}

export interface LiquidGlassPointerInput {
	kind: "client" | "local";
	x: number;
	y: number;
	active?: boolean;
}

interface LiquidGlassPointerState {
	angle: number;
	strength: number;
	x: number;
	y: number;
}

const DEFAULT_POINTER_LAYERS: readonly LiquidGlassPointerLayer[] = [
	{
		type: "edge",
		color: DEFAULT_POINTER_EDGE_COLOR,
		opacity: 0.42,
		blendMode: "screen",
		size: 1.5,
	},
];

function formatCssLength(value: number | string | undefined, fallback: string): string {
	if (value === undefined) return fallback;
	return typeof value === "number" ? `${value}px` : value;
}

function roundCssNumber(value: number): number {
	return Math.round(value * 1000) / 1000;
}

function getShortestAngleDelta(from: number, to: number): number {
	return ((((to - from) % 360) + 540) % 360) - 180;
}

function getSmoothedPointerState(
	current: LiquidGlassPointerState,
	target: LiquidGlassPointerState,
	amount: number,
): LiquidGlassPointerState {
	return {
		angle: current.angle + getShortestAngleDelta(current.angle, target.angle) * amount,
		strength: current.strength + (target.strength - current.strength) * amount,
		x: current.x + (target.x - current.x) * amount,
		y: current.y + (target.y - current.y) * amount,
	};
}

function isPointerStateSettled(
	current: LiquidGlassPointerState,
	target: LiquidGlassPointerState,
): boolean {
	return Math.abs(current.x - target.x) < POINTER_SMOOTHING_REST_DELTA
		&& Math.abs(current.y - target.y) < POINTER_SMOOTHING_REST_DELTA
		&& Math.abs(current.strength - target.strength) < POINTER_SMOOTHING_REST_DELTA
		&& Math.abs(getShortestAngleDelta(current.angle, target.angle)) < POINTER_SMOOTHING_REST_DELTA;
}

function buildLayerColor(color: string, opacity: number): string {
	const safeOpacity = clamp(opacity, 0, 1);
	if (safeOpacity <= 0) return "transparent";
	if (safeOpacity >= 1) return color;
	return `color-mix(in srgb, ${color} ${roundCssNumber(safeOpacity * 100)}%, transparent)`;
}

function getPointerStrength(
	x: number,
	y: number,
	width: number,
	height: number,
	activationRadius: number,
): number {
	if (activationRadius <= 0) return 0;
	const edgeDistanceX = x < 0 ? -x : x > width ? x - width : 0;
	const edgeDistanceY = y < 0 ? -y : y > height ? y - height : 0;
	const edgeDistance = Math.hypot(edgeDistanceX, edgeDistanceY);
	return clamp(1 - edgeDistance / activationRadius, 0, 1);
}

function getPointerAngle(x: number, y: number, width: number, height: number): number {
	const centerX = width / 2;
	const centerY = height / 2;
	const dx = x - centerX;
	const dy = y - centerY;
	return roundCssNumber(90 + (Math.atan2(dy, dx) * 180) / Math.PI);
}

function getResolvedPointerLayers(
	pointerLayers: boolean | readonly LiquidGlassPointerLayer[],
): readonly LiquidGlassPointerLayer[] {
	if (pointerLayers === true) return DEFAULT_POINTER_LAYERS;
	if (pointerLayers === false) return [];
	return pointerLayers;
}

function buildPointerLayerStyle(layer: LiquidGlassPointerLayer): CSSProperties {
	const opacity = layer.opacity ?? 1;
	const commonStyle: CSSProperties = {
		position: "absolute",
		inset: 0,
		zIndex: 1,
		borderRadius: "inherit",
		pointerEvents: "none",
		opacity: "var(--liquid-glass-pointer-strength, 0)",
		transition: POINTER_LAYER_TRANSITION,
		mixBlendMode: layer.blendMode ?? "screen",
	};

	if (layer.type === "edge") {
		const color = buildLayerColor(layer.color ?? DEFAULT_POINTER_EDGE_COLOR, opacity);
		return {
			...commonStyle,
			padding: formatCssLength(layer.size, "1.5px"),
			background: `linear-gradient(var(--liquid-glass-pointer-angle, 135deg), transparent 0%, ${color} 42%, transparent 72%)`,
			WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
			WebkitMaskComposite: "xor",
			maskComposite: "exclude",
		};
	}

	const color = buildLayerColor(layer.color ?? DEFAULT_POINTER_SPOT_COLOR, opacity);
	const size = formatCssLength(layer.size, "180px");
	return {
		...commonStyle,
		background: `radial-gradient(circle ${size} at var(--liquid-glass-pointer-x, 50%) var(--liquid-glass-pointer-y, 50%), ${color} 0%, transparent 68%)`,
	};
}

export interface LiquidGlassProps {
	children?: ReactNode;
	width?: number | string;
	height?: number | string;
	borderRadius?: number;
	borderWidth?: number;
	brightness?: number;
	opacity?: number;
	blur?: number;
	displace?: number;
	backgroundOpacity?: number;
	fallbackBackgroundOpacity?: number;
	saturation?: number;
	distortionScale?: number;
	/** Legacy VPK additive boost applied uniformly before per-channel offsets. */
	dispersion?: number;
	/** Per-channel chromatic offsets matching ReactBits GlassSurface prop names. */
	redOffset?: number;
	greenOffset?: number;
	blueOffset?: number;
	/** Backwards-compatible aliases for older VPK demos. */
	chromaticOffsetR?: number;
	chromaticOffsetG?: number;
	chromaticOffsetB?: number;
	xChannel?: "R" | "G" | "B";
	yChannel?: "R" | "G" | "B";
	borderOpacity?: number;
	borderColor?: string;
	dropShadow?: string | false;
	pointerLayers?: boolean | readonly LiquidGlassPointerLayer[];
	mouseContainer?: RefObject<HTMLElement | null> | null;
	pointerInput?: LiquidGlassPointerInput | null;
	pointerActivationRadius?: number;
	pointerSmoothing?: number;
	className?: string;
	style?: CSSProperties;
}

export default function LiquidGlass({
	children,
	width = 200,
	height = 400,
	borderRadius = 50,
	borderWidth = 0.05,
	brightness = 50,
	opacity = 0.93,
	blur = 8,
	displace = 5,
	backgroundOpacity = 0,
	fallbackBackgroundOpacity,
	saturation = 1,
	distortionScale = -90,
	dispersion = 6,
	redOffset,
	greenOffset,
	blueOffset,
	chromaticOffsetR,
	chromaticOffsetG,
	chromaticOffsetB,
	xChannel = "R",
	yChannel = "B",
	borderOpacity = 0.35,
	borderColor = "#000000",
	dropShadow = DROP_SHADOW,
	pointerLayers = false,
	mouseContainer = null,
	pointerInput = null,
	pointerActivationRadius = DEFAULT_POINTER_ACTIVATION_RADIUS,
	pointerSmoothing = 1,
	className,
	style,
}: LiquidGlassProps) {
	const uniqueId = useId().replace(/:/g, "-");
	const filterId = `liquid-glass-filter-${uniqueId}`;
	const redGradId = `liquid-glass-red-${uniqueId}`;
	const blueGradId = `liquid-glass-blue-${uniqueId}`;
	const blurFilterId = `liquid-glass-inner-blur-${uniqueId}`;

	const containerRef = useRef<HTMLDivElement>(null);
	const feImageRef = useRef<SVGFEImageElement>(null);
	const dispRedRef = useRef<SVGFEDisplacementMapElement>(null);
	const dispGreenRef = useRef<SVGFEDisplacementMapElement>(null);
	const dispBlueRef = useRef<SVGFEDisplacementMapElement>(null);
	const gaussianBlurRef = useRef<SVGFEGaussianBlurElement>(null);
	const pointerAnimationFrameRef = useRef<number | null>(null);
	const pointerCurrentRef = useRef<LiquidGlassPointerState | null>(null);
	const pointerTargetRef = useRef<LiquidGlassPointerState | null>(null);

	const [svgSupported, setSvgSupported] = useState(false);
	// `null` until mount — render uses the deterministic CSS blur fallback on
	// the server and first client render to avoid a transparent hydration flash.
	const [backdropSupported, setBackdropSupported] = useState<boolean | null>(
		null,
	);
	const [filterReady, setFilterReady] = useState(false);
	const resolvedPointerLayers = getResolvedPointerLayers(pointerLayers);
	const pointerTrackingEnabled = resolvedPointerLayers.length > 0 || pointerInput !== null;

	const generateDisplacementMap = useCallback(() => {
		const el = containerRef.current;
		const w = el?.offsetWidth ?? 0;
		const h = el?.offsetHeight ?? 0;

		if (w <= 0 || h <= 0) {
			return null;
		}

		// `displace` is passed through as raw pixels — the displacement-map SVG is
		// rendered at the same dimensions as the glass element, and the inner-rect
		// blur is applied via a raw CSS `filter:blur()` (matching Framer's reference).
		return buildLiquidGlassDisplacementImageHref({
			width: w,
			height: h,
			borderRadius,
			borderWidth,
			brightness,
			blur: displace,
			opacity,
			redGradId,
			blueGradId,
			blurFilterId,
		});
	}, [blueGradId, blurFilterId, borderRadius, borderWidth, brightness, displace, opacity, redGradId]);

	const writePointerState = useCallback((state: LiquidGlassPointerState) => {
		const el = containerRef.current;
		if (!el) return;
		el.style.setProperty("--liquid-glass-pointer-x", `${roundCssNumber(state.x)}px`);
		el.style.setProperty("--liquid-glass-pointer-y", `${roundCssNumber(state.y)}px`);
		el.style.setProperty("--liquid-glass-pointer-strength", String(roundCssNumber(state.strength)));
		el.style.setProperty("--liquid-glass-pointer-angle", `${roundCssNumber(state.angle)}deg`);
	}, []);

	const schedulePointerState = useCallback((target: LiquidGlassPointerState) => {
		const smoothingAmount = clamp(pointerSmoothing, 0.01, 1);
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

			const next = getSmoothedPointerState(current, latestTarget, smoothingAmount);
			const settled = isPointerStateSettled(next, latestTarget);
			const resolvedNext = settled ? latestTarget : next;
			pointerCurrentRef.current = resolvedNext;
			writePointerState(resolvedNext);
			pointerAnimationFrameRef.current = settled
				? null
				: requestAnimationFrame(animatePointer);
		};

		pointerAnimationFrameRef.current = requestAnimationFrame(animatePointer);
	}, [pointerSmoothing, writePointerState]);

	const setPointerInactive = useCallback(() => {
		const current = pointerCurrentRef.current ?? pointerTargetRef.current;
		if (!current) {
			const el = containerRef.current;
			if (!el) return;
			el.style.setProperty("--liquid-glass-pointer-strength", "0");
			return;
		}
		schedulePointerState({ ...current, strength: 0 });
	}, [schedulePointerState]);

	const updatePointerFromLocal = useCallback((x: number, y: number, active: boolean) => {
		const el = containerRef.current;
		if (!el) return;
		const width = el.offsetWidth;
		const height = el.offsetHeight;
		if (width <= 0 || height <= 0) return;

		const strength = active
			? getPointerStrength(x, y, width, height, pointerActivationRadius)
			: 0;
		schedulePointerState({
			angle: getPointerAngle(x, y, width, height),
			strength,
			x,
			y,
		});
	}, [pointerActivationRadius, schedulePointerState]);

	const updatePointerFromClient = useCallback((clientX: number, clientY: number, active: boolean) => {
		const el = containerRef.current;
		if (!el) return;
		const rect = el.getBoundingClientRect();
		updatePointerFromLocal(clientX - rect.left, clientY - rect.top, active);
	}, [updatePointerFromLocal]);

	const updateDisplacementMap = useCallback(() => {
		const href = generateDisplacementMap();
		if (!href) {
			setFilterReady(false);
			return;
		}
		feImageRef.current?.setAttribute("href", href);
		setFilterReady(true);
	}, [generateDisplacementMap]);

	useIsomorphicLayoutEffect(() => {
		updateDisplacementMap();

		const channelScales = buildLiquidGlassChannelScales(distortionScale, dispersion, {
			red: redOffset ?? chromaticOffsetR,
			green: greenOffset ?? chromaticOffsetG,
			blue: blueOffset ?? chromaticOffsetB,
		});
		for (const [ref, scale] of [
			[dispRedRef, channelScales.red],
			[dispGreenRef, channelScales.green],
			[dispBlueRef, channelScales.blue],
		] as const) {
			if (!ref.current) continue;
			ref.current.setAttribute("scale", scale.toString());
			ref.current.setAttribute("xChannelSelector", xChannel);
			ref.current.setAttribute("yChannelSelector", yChannel);
		}

		gaussianBlurRef.current?.setAttribute("stdDeviation", blur.toString());
	}, [updateDisplacementMap, distortionScale, dispersion, redOffset, greenOffset, blueOffset, chromaticOffsetR, chromaticOffsetG, chromaticOffsetB, xChannel, yChannel, blur]);

	useIsomorphicLayoutEffect(() => {
		const check = () => {
			if (typeof window === "undefined" || typeof document === "undefined") return false;
			const isWebkit = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
			const isFirefox = /Firefox/.test(navigator.userAgent);
			if (isWebkit || isFirefox) return false;
			const div = document.createElement("div");
			div.style.backdropFilter = `url(#${filterId})`;
			return div.style.backdropFilter !== "";
		};
		setSvgSupported(check());
		setBackdropSupported(
			typeof CSS !== "undefined" &&
				CSS.supports("backdrop-filter", "blur(10px)"),
		);
	}, [filterId]);

	useEffect(() => {
		const el = containerRef.current;
		if (!el) return;
		const observer = new ResizeObserver(() => requestAnimationFrame(updateDisplacementMap));
		observer.observe(el);
		return () => observer.disconnect();
	}, [updateDisplacementMap]);

	useEffect(() => {
		requestAnimationFrame(updateDisplacementMap);
	}, [width, height, updateDisplacementMap]);

	useEffect(() => {
		return () => {
			if (pointerAnimationFrameRef.current === null) return;
			cancelAnimationFrame(pointerAnimationFrameRef.current);
		};
	}, []);

	useEffect(() => {
		if (!pointerTrackingEnabled || !pointerInput) return;
		const active = pointerInput.active ?? true;
		if (pointerInput.kind === "local") {
			updatePointerFromLocal(pointerInput.x, pointerInput.y, active);
		} else {
			updatePointerFromClient(pointerInput.x, pointerInput.y, active);
		}
	}, [pointerInput, pointerTrackingEnabled, updatePointerFromClient, updatePointerFromLocal]);

	useEffect(() => {
		if (!pointerTrackingEnabled || pointerInput) return;
		const target = mouseContainer?.current ?? containerRef.current;
		if (!target) return;

		const handlePointerMove = (event: PointerEvent) => {
			updatePointerFromClient(event.clientX, event.clientY, true);
		};
		const handlePointerLeave = () => {
			setPointerInactive();
		};
		target.addEventListener("pointermove", handlePointerMove, { passive: true });
		target.addEventListener("pointerleave", handlePointerLeave);
		return () => {
			target.removeEventListener("pointermove", handlePointerMove);
			target.removeEventListener("pointerleave", handlePointerLeave);
		};
	}, [mouseContainer, pointerInput, pointerTrackingEnabled, setPointerInactive, updatePointerFromClient]);

	const hairlineColor = buildColorMix(borderColor, borderOpacity);
	const containerStyle: CSSProperties = {
		...style,
		width,
		height,
		borderRadius,
		boxShadow: buildBoxShadow(hairlineColor, dropShadow),
		"--liquid-glass-pointer-x": "50%",
		"--liquid-glass-pointer-y": "50%",
		"--liquid-glass-pointer-strength": "0",
		"--liquid-glass-pointer-angle": "135deg",
	} as CSSProperties;

	if (svgSupported && filterReady) {
		Object.assign(containerStyle, {
			background: `hsl(0 0% 100% / ${backgroundOpacity})`,
			backdropFilter: `url(#${filterId}) saturate(${saturation})`,
			WebkitBackdropFilter: `url(#${filterId}) saturate(${saturation})`,
		});
	} else if (backdropSupported === null || backdropSupported) {
		Object.assign(containerStyle, {
			background: `rgba(255, 255, 255, ${fallbackBackgroundOpacity ?? 0.18})`,
			backdropFilter: FALLBACK_BACKDROP_FILTER,
			WebkitBackdropFilter: FALLBACK_BACKDROP_FILTER,
		});
	} else {
		Object.assign(containerStyle, {
			background: `rgba(255, 255, 255, ${fallbackBackgroundOpacity ?? 0.4})`,
		});
	}

	return (
		<div
			ref={containerRef}
			className={cn("relative block overflow-hidden", className)}
			style={containerStyle}
		>
			<svg
				aria-hidden="true"
				className="pointer-events-none absolute inset-0 -z-10 h-full w-full opacity-0"
				xmlns="http://www.w3.org/2000/svg"
			>
				<defs>
					<filter
						id={filterId}
						colorInterpolationFilters="sRGB"
						x="-50%"
						y="-50%"
						width="200%"
						height="200%"
					>
						<feImage
							ref={feImageRef}
							x="0"
							y="0"
							width="100%"
							height="100%"
							preserveAspectRatio="none"
							result="map"
						/>
						<feDisplacementMap ref={dispRedRef} in="SourceGraphic" in2="map" result="dispRed" />
						<feColorMatrix in="dispRed" type="matrix" values="1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0" result="red" />
						<feDisplacementMap ref={dispGreenRef} in="SourceGraphic" in2="map" result="dispGreen" />
						<feColorMatrix in="dispGreen" type="matrix" values="0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 1 0" result="green" />
						<feDisplacementMap ref={dispBlueRef} in="SourceGraphic" in2="map" result="dispBlue" />
						<feColorMatrix in="dispBlue" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 1 0" result="blue" />
						<feBlend in="red" in2="green" mode="screen" result="rg" />
						<feBlend in="rg" in2="blue" mode="screen" result="output" />
						<feGaussianBlur ref={gaussianBlurRef} in="output" stdDeviation="0" />
					</filter>
				</defs>
			</svg>

			{resolvedPointerLayers.length > 0 ? (
				<>
					{resolvedPointerLayers.map((layer, index) => (
						<span
							key={`${layer.type}-${index}`}
							aria-hidden="true"
							style={buildPointerLayerStyle(layer)}
						/>
					))}
				</>
			) : null}

			{children ? (
				<div className="relative z-3 flex h-full w-full items-center justify-center rounded-[inherit] p-2">
					{children}
				</div>
			) : null}
		</div>
	);
}
