"use client";

import type { CSSProperties, ReactNode } from "react";
import { useEffect, useId, useMemo, useState } from "react";

import { token } from "@/lib/tokens";
import { cn } from "@/lib/utils";

import {
	SQUIRCLE_CORNER_SHAPE_FALLBACK,
	SQUIRCLE_DEFAULT_SMOOTHNESS,
	SQUIRCLE_LARGE_RADIUS_PX,
	buildSvgPathMaskImage,
	buildSuperellipsePath,
	formatCornerShapeSuperellipse,
	mapSmoothnessToExponent,
} from "./squircle-shape";

export { SQUIRCLE_DEFAULT_SMOOTHNESS } from "./squircle-shape";

type SquircleHostStyle = CSSProperties & {
	cornerShape?: string;
};

type SquircleInheritedShapeStyle = CSSProperties & {
	cornerShape?: "inherit";
};

export interface SquircleProps {
	children?: ReactNode;
	width?: number;
	height?: number;
	smoothness?: number;
	strokeWidth?: number;
	strokeColor?: string;
	fillColor?: string;
	className?: string;
	contentClassName?: string;
	style?: CSSProperties;
}

export default function Squircle({
	children,
	width = 240,
	height = 240,
	smoothness = SQUIRCLE_DEFAULT_SMOOTHNESS,
	strokeWidth = 1.5,
	strokeColor = "rgb(255 255 255 / 0.4)",
	fillColor = token("color.background.neutral"),
	className,
	contentClassName,
	style,
}: Readonly<SquircleProps>) {
	const uniqueId = useId().replace(/:/g, "-");
	const clipPathId = `squircle-clip-${uniqueId}`;
	const [cornerShapeSupported, setCornerShapeSupported] = useState(false);

	useEffect(() => {
		if (typeof CSS === "undefined" || typeof CSS.supports !== "function") {
			return;
		}

		setCornerShapeSupported(CSS.supports("corner-shape", "superellipse(2)"));
	}, []);

	const safeStrokeWidth = Math.max(0, strokeWidth);
	const exponent = mapSmoothnessToExponent(smoothness);
	const pathData = useMemo(
		() => buildSuperellipsePath(width, height, exponent, safeStrokeWidth / 2),
		[width, height, exponent, safeStrokeWidth],
	);
	const maskImage = useMemo(
		() => buildSvgPathMaskImage(pathData, width, height),
		[pathData, width, height],
	);
	const cornerShape = useMemo(
		() => formatCornerShapeSuperellipse(smoothness),
		[smoothness],
	);
	const borderRadius = `${SQUIRCLE_LARGE_RADIUS_PX * (cornerShapeSupported ? 1 : SQUIRCLE_CORNER_SHAPE_FALLBACK)}px`;

	const hostStyle: SquircleHostStyle = {
		...style,
		width,
		height,
		position: "relative",
		borderRadius,
		overflow: cornerShapeSupported ? "clip" : "hidden",
	};

	if (cornerShapeSupported) {
		hostStyle.cornerShape = cornerShape;
		hostStyle.backgroundColor = fillColor;
	}

	const inheritedShapeStyle: SquircleInheritedShapeStyle = {
		borderRadius: "inherit",
	};

	if (cornerShapeSupported) {
		inheritedShapeStyle.cornerShape = "inherit";
	}

	const contentClass =
		contentClassName ?? "flex h-full w-full items-center justify-center";

	return (
		<div className={cn("relative shrink-0", className)} style={hostStyle}>
			{cornerShapeSupported ? (
				<>
					{safeStrokeWidth > 0 ? (
						<div
							aria-hidden="true"
							className="pointer-events-none absolute inset-0"
							style={{
								...inheritedShapeStyle,
								boxSizing: "border-box",
								border: `${safeStrokeWidth}px solid ${strokeColor}`,
							}}
						/>
					) : null}
					{children ? (
						<div className={cn("absolute inset-0", contentClass)}>
							{children}
						</div>
					) : null}
				</>
			) : (
				<svg
					aria-hidden="true"
					className="absolute inset-0 h-full w-full"
					preserveAspectRatio="none"
					viewBox={`0 0 ${width} ${height}`}
				>
					<defs>
						<clipPath id={clipPathId} clipPathUnits="userSpaceOnUse">
							<path d={pathData} />
						</clipPath>
					</defs>
					<path
						d={pathData}
						fill={fillColor}
						stroke={safeStrokeWidth > 0 ? strokeColor : "none"}
						strokeWidth={safeStrokeWidth}
						strokeLinejoin="round"
					/>
					{children ? (
						<foreignObject
							x="0"
							y="0"
							width={width}
							height={height}
							clipPath={`url(#${clipPathId})`}
						>
							<div
								className={contentClass}
								style={{
									width: "100%",
									height: "100%",
									overflow: "hidden",
									maskImage,
									WebkitMaskImage: maskImage,
									maskRepeat: "no-repeat",
									WebkitMaskRepeat: "no-repeat",
									maskSize: "100% 100%",
									WebkitMaskSize: "100% 100%",
									maskPosition: "center",
									WebkitMaskPosition: "center",
								}}
							>
								{children}
							</div>
						</foreignObject>
					) : null}
				</svg>
			)}
		</div>
	);
}
