"use client";

import type { CSSProperties, ReactNode } from "react";
import { useCallback, useEffect, useId, useRef, useState } from "react";

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
	dispersion?: number;
	/** Per-channel chromatic offsets added on top of the base displacement scale. Use these
	 * to introduce chromatic-aberration fringes on the red, green, or blue channel
	 * independently. All default to 0 (no offset, matching Framer's reference). */
	chromaticOffsetR?: number;
	chromaticOffsetG?: number;
	chromaticOffsetB?: number;
	borderOpacity?: number;
	borderColor?: string;
	dropShadow?: string | false;
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
	chromaticOffsetR = 0,
	chromaticOffsetG = 0,
	chromaticOffsetB = 0,
	borderOpacity = 0.35,
	borderColor = "#000000",
	dropShadow = DROP_SHADOW,
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

	const [svgSupported, setSvgSupported] = useState(false);
	// `null` until mount — render uses the deterministic "no backdrop-filter"
	// fallback on the server and first client render to match hydration.
	const [backdropSupported, setBackdropSupported] = useState<boolean | null>(
		null,
	);

	const generateDisplacementMap = useCallback(() => {
		const rect = containerRef.current?.getBoundingClientRect();
		const w = rect?.width ?? 0;
		const h = rect?.height ?? 0;

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

	const updateDisplacementMap = useCallback(() => {
		const href = generateDisplacementMap();
		if (!href) return;
		feImageRef.current?.setAttribute("href", href);
	}, [generateDisplacementMap]);

	useEffect(() => {
		updateDisplacementMap();

		const channelScales = buildLiquidGlassChannelScales(distortionScale, dispersion, {
			red: chromaticOffsetR,
			green: chromaticOffsetG,
			blue: chromaticOffsetB,
		});
		for (const [ref, scale] of [
			[dispRedRef, channelScales.red],
			[dispGreenRef, channelScales.green],
			[dispBlueRef, channelScales.blue],
		] as const) {
			if (!ref.current) continue;
			ref.current.setAttribute("scale", scale.toString());
			ref.current.setAttribute("xChannelSelector", "R");
			ref.current.setAttribute("yChannelSelector", "B");
		}

		gaussianBlurRef.current?.setAttribute("stdDeviation", blur.toString());
	}, [updateDisplacementMap, distortionScale, dispersion, chromaticOffsetR, chromaticOffsetG, chromaticOffsetB, blur]);

	useEffect(() => {
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

	const hairlineColor = buildColorMix(borderColor, borderOpacity);
	const containerStyle: CSSProperties = {
		...style,
		width,
		height,
		borderRadius,
		boxShadow: buildBoxShadow(hairlineColor, dropShadow),
	};

	if (svgSupported) {
		Object.assign(containerStyle, {
			background: `hsl(0 0% 100% / ${backgroundOpacity})`,
			backdropFilter: `url(#${filterId}) saturate(${saturation})`,
			WebkitBackdropFilter: `url(#${filterId}) saturate(${saturation})`,
		});
	} else if (backdropSupported) {
		Object.assign(containerStyle, {
			background: `rgba(255, 255, 255, ${fallbackBackgroundOpacity ?? 0.18})`,
			backdropFilter: "blur(14px) saturate(1.4)",
			WebkitBackdropFilter: "blur(14px) saturate(1.4)",
		});
	} else {
		// SSR + first client render land here; matches the
		// `backdropSupported === null` state so hydration is consistent.
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

			{children ? (
				<div className="relative z-3 flex h-full w-full items-center justify-center rounded-[inherit] p-2">
					{children}
				</div>
			) : null}
		</div>
	);
}
