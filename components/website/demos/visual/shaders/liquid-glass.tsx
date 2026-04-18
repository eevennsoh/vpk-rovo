"use client";

import type { ComponentPropsWithoutRef, CSSProperties, ReactNode } from "react";
import { useEffect, useId, useMemo, useRef, useState } from "react";

import { cn } from "@/lib/utils";

const DEFAULT_WIDTH = 188;
const DEFAULT_HEIGHT = 607;
const DEFAULT_RADIUS = 81;
const DEFAULT_FILL_COLOR = "#ffffff";
const DEFAULT_FILL_OPACITY = 0.1;
const DEFAULT_DISPLACEMENT_SCALE = -133;
const DEFAULT_BLUR = 4.15;
const DEFAULT_BORDER_OPACITY = 0.7;
const DEFAULT_BORDER_ANGLE = 315;
const INNER_MAP_INSET_RATIO = 0.025;
const INNER_MAP_BLUR_RATIO = 10 / DEFAULT_WIDTH;

function clamp(value: number, min: number, max: number): number {
	return Math.min(Math.max(value, min), max);
}

function round(value: number, precision = 2): number {
	const factor = 10 ** precision;
	return Math.round(value * factor) / factor;
}

function buildColorMix(color: string, opacity: number): string {
	const safeOpacity = clamp(opacity, 0, 1);
	if (safeOpacity <= 0) return "transparent";
	if (safeOpacity >= 1) return color;
	return `color-mix(in srgb, ${color} ${round(safeOpacity * 100, 1)}%, transparent)`;
}

function createMapDataUrl(width: number, height: number, radius: number): string {
	const safeWidth = Math.max(1, round(width));
	const safeHeight = Math.max(1, round(height));
	const safeRadius = round(clamp(radius, 0, Math.min(safeWidth, safeHeight) / 2));
	const inset = round(Math.min(safeWidth, safeHeight) * INNER_MAP_INSET_RATIO);
	const innerWidth = Math.max(1, round(safeWidth - inset * 2));
	const innerHeight = Math.max(1, round(safeHeight - inset * 2));
	const innerBlur = round(Math.min(safeWidth, safeHeight) * INNER_MAP_BLUR_RATIO);
	const svg = `
<svg viewBox="0 0 ${safeWidth} ${safeHeight}" xmlns="http://www.w3.org/2000/svg">
	<defs>
		<linearGradient id="red" x1="100%" y1="0%" x2="0%" y2="0%">
			<stop offset="0%" stop-color="#0000" />
			<stop offset="100%" stop-color="red" />
		</linearGradient>
		<linearGradient id="blue" x1="0%" y1="0%" x2="0%" y2="100%">
			<stop offset="0%" stop-color="#0000" />
			<stop offset="100%" stop-color="blue" />
		</linearGradient>
	</defs>
	<rect x="0" y="0" width="${safeWidth}" height="${safeHeight}" fill="black" />
	<rect x="0" y="0" width="${safeWidth}" height="${safeHeight}" rx="${safeRadius}" fill="url(#red)" />
	<rect x="0" y="0" width="${safeWidth}" height="${safeHeight}" rx="${safeRadius}" fill="url(#blue)" style="mix-blend-mode:difference" />
	<rect x="${inset}" y="${inset}" width="${innerWidth}" height="${innerHeight}" rx="${safeRadius}" fill="hsl(0 0% 88% / 0.9)" style="filter:blur(${innerBlur}px)" />
</svg>`.trim();

	return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function supportsBackdropUrlFilter(): boolean {
	if (typeof CSS === "undefined" || typeof CSS.supports !== "function") {
		return false;
	}

	try {
		return CSS.supports("backdrop-filter", 'url("#liquid-glass-test")')
			|| CSS.supports("-webkit-backdrop-filter", 'url("#liquid-glass-test")');
	} catch {
		return false;
	}
}

export interface LiquidGlassProps extends Omit<ComponentPropsWithoutRef<"div">, "children" | "color"> {
	children?: ReactNode;
	radius?: number;
	fillColor?: string;
	fillOpacity?: number;
	displacementScale?: number;
	blur?: number;
	borderOpacity?: number;
	borderAngle?: number;
}

export default function LiquidGlass({
	className,
	children,
	radius = DEFAULT_RADIUS,
	fillColor = DEFAULT_FILL_COLOR,
	fillOpacity = DEFAULT_FILL_OPACITY,
	displacementScale = DEFAULT_DISPLACEMENT_SCALE,
	blur = DEFAULT_BLUR,
	borderOpacity = DEFAULT_BORDER_OPACITY,
	borderAngle = DEFAULT_BORDER_ANGLE,
	style,
	role,
	"aria-hidden": ariaHidden,
	"aria-label": ariaLabel,
	"aria-labelledby": ariaLabelledBy,
	...divProps
}: LiquidGlassProps) {
	const rootRef = useRef<HTMLDivElement>(null);
	const rawId = useId();
	const filterId = useMemo(
		() => `liquid-glass-filter-${rawId.replace(/[^a-zA-Z0-9_-]/g, "")}`,
		[rawId],
	);
	const [size, setSize] = useState({ width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT });
	const [supportsFilter, setSupportsFilter] = useState(false);

	useEffect(() => {
		setSupportsFilter(supportsBackdropUrlFilter());
	}, []);

	useEffect(() => {
		const element = rootRef.current;
		if (!element) return;

		const updateSize = () => {
			const nextWidth = element.clientWidth;
			const nextHeight = element.clientHeight;
			if (nextWidth > 0 && nextHeight > 0) {
				setSize((current) => {
					if (current.width === nextWidth && current.height === nextHeight) {
						return current;
					}

					return { width: nextWidth, height: nextHeight };
				});
			}
		};

		updateSize();

		if (typeof ResizeObserver === "undefined") {
			return undefined;
		}

		const observer = new ResizeObserver(() => {
			updateSize();
		});
		observer.observe(element);

		return () => {
			observer.disconnect();
		};
	}, []);

	const clampedRadius = clamp(radius, 0, Math.min(size.width, size.height) / 2);
	const mapDataUrl = useMemo(
		() => createMapDataUrl(size.width, size.height, clampedRadius),
		[size.width, size.height, clampedRadius],
	);
	const fill = buildColorMix(fillColor, fillOpacity);
	const borderColor = buildColorMix("rgb(23 23 23)", borderOpacity);
	const borderStyle: CSSProperties = {
		position: "absolute",
		inset: 0,
		zIndex: 2,
		pointerEvents: "none",
		padding: 1,
		borderRadius: clampedRadius,
		border: "1px solid transparent",
		background: `linear-gradient(${borderAngle}deg, ${borderColor} 0%, transparent 30%, transparent 70%, ${borderColor} 100%) border-box`,
		WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
		mask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
		WebkitMaskComposite: "xor",
		maskComposite: "exclude",
	};
	const glassLayerStyle: CSSProperties = {
		position: "absolute",
		inset: 0,
		zIndex: 1,
		pointerEvents: "none",
		borderRadius: clampedRadius,
		background: fill,
		...(supportsFilter
			? {
				backdropFilter: `url("#${filterId}")`,
				WebkitBackdropFilter: `url("#${filterId}")`,
			}
			: {}),
	};
	const resolvedRole = role ?? (children == null ? "presentation" : undefined);
	const resolvedAriaHidden = ariaHidden ?? (children == null && !ariaLabel && !ariaLabelledBy ? true : undefined);

	return (
		<div
			ref={rootRef}
			role={resolvedRole}
			aria-hidden={resolvedAriaHidden}
			aria-label={ariaLabel}
			aria-labelledby={ariaLabelledBy}
			className={cn("relative isolate block overflow-hidden", className)}
			style={{
				...style,
				position: style?.position ?? "relative",
				display: style?.display ?? "block",
				isolation: style?.isolation ?? "isolate",
				overflow: style?.overflow ?? "hidden",
				borderRadius: clampedRadius,
			}}
			{...divProps}
		>
			<svg
				aria-hidden="true"
				className="pointer-events-none absolute h-0 w-0 overflow-hidden"
				focusable="false"
			>
				<defs>
					<filter id={filterId} colorInterpolationFilters="sRGB">
						<feImage href={mapDataUrl} x="0" y="0" width="100%" height="100%" result="map" />
						<feDisplacementMap in="SourceGraphic" in2="map" scale={displacementScale} xChannelSelector="R" yChannelSelector="B" result="dispRed" />
						<feColorMatrix in="dispRed" type="matrix" values="1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0" result="red" />
						<feDisplacementMap in="SourceGraphic" in2="map" scale={displacementScale} xChannelSelector="R" yChannelSelector="B" result="dispGreen" />
						<feColorMatrix in="dispGreen" type="matrix" values="0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 1 0" result="green" />
						<feDisplacementMap in="SourceGraphic" in2="map" scale={displacementScale} xChannelSelector="R" yChannelSelector="B" result="dispBlue" />
						<feColorMatrix in="dispBlue" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 1 0" result="blue" />
						<feBlend in="red" in2="green" mode="screen" result="rg" />
						<feBlend in="rg" in2="blue" mode="screen" result="output" />
						<feGaussianBlur in="output" stdDeviation={Math.max(0, blur)} />
					</filter>
				</defs>
			</svg>

			<div aria-hidden="true" style={glassLayerStyle} />
			<div aria-hidden="true" style={borderStyle} />
			{children ? <div className="relative z-[3] h-full w-full">{children}</div> : null}
		</div>
	);
}
