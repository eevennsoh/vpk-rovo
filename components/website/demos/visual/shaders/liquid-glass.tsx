"use client";

import type { CSSProperties, ReactNode } from "react";
import { useCallback, useEffect, useId, useRef, useState } from "react";

import { cn } from "@/lib/utils";

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

function buildBoxShadow(hairlineColor: string): string {
	return [
		DROP_SHADOW,
		`inset 0 0 0 1px ${hairlineColor}`,
		INNER_HIGHLIGHT_TOP,
		INNER_HIGHLIGHT_BOTTOM,
	].join(", ");
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
	saturation?: number;
	distortionScale?: number;
	dispersion?: number;
	borderOpacity?: number;
	borderColor?: string;
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
	displace = 0,
	backgroundOpacity = 0,
	saturation = 1,
	distortionScale = -90,
	dispersion = 6,
	borderOpacity = 0.35,
	borderColor = "#000000",
	className,
	style,
}: LiquidGlassProps) {
	const uniqueId = useId().replace(/:/g, "-");
	const filterId = `liquid-glass-filter-${uniqueId}`;
	const redGradId = `liquid-glass-red-${uniqueId}`;
	const blueGradId = `liquid-glass-blue-${uniqueId}`;

	const containerRef = useRef<HTMLDivElement>(null);
	const feImageRef = useRef<SVGFEImageElement>(null);
	const dispRedRef = useRef<SVGFEDisplacementMapElement>(null);
	const dispGreenRef = useRef<SVGFEDisplacementMapElement>(null);
	const dispBlueRef = useRef<SVGFEDisplacementMapElement>(null);
	const gaussianBlurRef = useRef<SVGFEGaussianBlurElement>(null);

	const [svgSupported, setSvgSupported] = useState(false);

	const generateDisplacementMap = useCallback(() => {
		const rect = containerRef.current?.getBoundingClientRect();
		const w = rect?.width ?? 0;
		const h = rect?.height ?? 0;

		if (w <= 0 || h <= 0) {
			return null;
		}

		// Render the displacement map at a higher internal resolution for smoother
		// gradient sampling, then let `preserveAspectRatio="none"` scale it back to
		// the container size. This removes the staircase artifacts seen at small
		// sizes without forcing the actual filter to run at higher cost.
		const aspectRatio = w / h;
		const longSide = 800;
		const innerW = aspectRatio >= 1 ? longSide : Math.round(longSide * aspectRatio);
		const innerH = aspectRatio >= 1 ? Math.round(longSide / aspectRatio) : longSide;
		const minSide = Math.min(innerW, innerH);
		const scaledRadius = (borderRadius / Math.min(w, h)) * minSide;
		const edgeSize = minSide * (borderWidth * 0.5);

		const svg = `
<svg viewBox="0 0 ${innerW} ${innerH}" xmlns="http://www.w3.org/2000/svg">
	<defs>
		<linearGradient id="${redGradId}" x1="100%" y1="0%" x2="0%" y2="0%">
			<stop offset="0%" stop-color="#0000"/>
			<stop offset="100%" stop-color="red"/>
		</linearGradient>
		<linearGradient id="${blueGradId}" x1="0%" y1="0%" x2="0%" y2="100%">
			<stop offset="0%" stop-color="#0000"/>
			<stop offset="100%" stop-color="blue"/>
		</linearGradient>
	</defs>
	<rect x="0" y="0" width="${innerW}" height="${innerH}" fill="black"/>
	<rect x="0" y="0" width="${innerW}" height="${innerH}" rx="${scaledRadius}" fill="url(#${redGradId})"/>
	<rect x="0" y="0" width="${innerW}" height="${innerH}" rx="${scaledRadius}" fill="url(#${blueGradId})" style="mix-blend-mode:difference"/>
	<rect x="${edgeSize}" y="${edgeSize}" width="${innerW - edgeSize * 2}" height="${innerH - edgeSize * 2}" rx="${scaledRadius}" fill="hsl(0 0% ${brightness}% / ${opacity})" style="filter:blur(${blur}px)"/>
</svg>`;

		return `data:image/svg+xml,${encodeURIComponent(svg)}`;
	}, [blueGradId, borderRadius, borderWidth, brightness, blur, opacity, redGradId]);

	const updateDisplacementMap = useCallback(() => {
		const href = generateDisplacementMap();
		if (!href) return;
		feImageRef.current?.setAttribute("href", href);
	}, [generateDisplacementMap]);

	useEffect(() => {
		updateDisplacementMap();

		const scale = distortionScale + dispersion;
		for (const ref of [dispRedRef, dispGreenRef, dispBlueRef]) {
			if (ref.current) {
				ref.current.setAttribute("scale", scale.toString());
				ref.current.setAttribute("xChannelSelector", "R");
				ref.current.setAttribute("yChannelSelector", "B");
			}
		}

		gaussianBlurRef.current?.setAttribute("stdDeviation", displace.toString());
	}, [updateDisplacementMap, distortionScale, dispersion, displace]);

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
		boxShadow: buildBoxShadow(hairlineColor),
	};

	if (svgSupported) {
		Object.assign(containerStyle, {
			background: `hsl(0 0% 100% / ${backgroundOpacity})`,
			backdropFilter: `url(#${filterId}) saturate(${saturation})`,
			WebkitBackdropFilter: `url(#${filterId}) saturate(${saturation})`,
		});
	} else {
		const supportsBackdrop =
			typeof CSS !== "undefined" && CSS.supports("backdrop-filter", "blur(10px)");
		if (supportsBackdrop) {
			Object.assign(containerStyle, {
				background: "rgba(255, 255, 255, 0.18)",
				backdropFilter: "blur(14px) saturate(1.4)",
				WebkitBackdropFilter: "blur(14px) saturate(1.4)",
			});
		} else {
			Object.assign(containerStyle, {
				background: "rgba(255, 255, 255, 0.4)",
			});
		}
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
						x="0%"
						y="0%"
						width="100%"
						height="100%"
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
						<feGaussianBlur ref={gaussianBlurRef} in="output" stdDeviation="0.7" />
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
