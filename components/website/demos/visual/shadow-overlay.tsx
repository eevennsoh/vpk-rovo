"use client";

import { useEffect, useId, useMemo, useRef } from "react";
import {
	animate,
	useMotionValue,
	useReducedMotion,
} from "motion/react";

import { cn } from "@/lib/utils";

export const SHADOW_OVERLAY_PRESET_IDS = [
	"ceBGguIpUU8luwByxuQz79t7To",
	"znMaWHYdlNjI3XmG9UmHCZJ2dF4",
	"EmAMO0OLZ4CWbBHNtkim5etdvjE",
	"7K01o5a0Y1LyKM8iKincpTWSm0",
	"hRNB6XrJT2M7fsVBS1bS1tZpOAs",
	"ekHbDzFghE4uvIjKPrLwFVCfOk",
	"svuE9O4efZ24yHS2buRr3ViibE",
	"UjoQ9C7XN8feIfM14wB310cOJR4",
	"isACzjE1USQFF2bW0oMvLMdMKzA",
	"Z8UyfkF6S9UmBLwaZWMbJdJc3c",
	"Ck9UWgqX5Nc46BxqHHXhJoEMMs",
	"5UnPseCHA2ms40G25VTbksLmUfM",
	"aJy8SKOl9MNn9WhYQLOggwDzMcw",
	"rVXg0zhAlJFlziBLPM0rvdBL8NQ",
	"nLGjGCZybN83O12nVaNpt0AxJgw",
	"gEulGDbGwms4zhp1tGv4BerAI",
	"lUB3IS8TiPeJBP5gV9ZfBoIJ7E",
	"RwER4Vq4vLm4c6J48t9kMFieI",
	"IMPAXiPWHsECHuiQm2Tkywi94",
	"rjdvLhlEdUwNXlqn9KiHCSLYeDw",
	"qOEKe0T3OnLqPe72x2Mpycx5ePk",
	"MRSUqPmzy7IMgTiZy3JsNmgGLY",
	"LjqX4PLHcL524jh3kpnz4toTio",
	"HxlEYnQRYQVXiHiJHtlZ6GRzNg",
	"KKc66YBV1jrvMD3cq7NgJvPzmc",
	"wOmMo3IJcXcrWDLyBW3roBGkkbU",
	"psKeI3qPMv3osKwHZ7jXsWXE",
	"2TstK9EzgkxpUcWVcBd3qF78UDw",
	"FHbxpWYUP15NVTQxR7b88Es9hvA",
	"maeTigdLMJoJJlgi5wKcFMyZQ",
	"OirDHWzfb3BoUZGoUuEktQsBrfw",
	"8kCsbgl3oV2CW69fVtUhAOmhubA",
] as const;

const NOISE_TEXTURE_SRC = "https://framerusercontent.com/images/g0QcWrxr87K0ufOxIUFBakwYA8.png";

export type ShadowOverlayType = "preset" | "custom";
export type ShadowOverlaySizing = "fill" | "stretch";

export type ShadowOverlayAnimation = Readonly<{
	enabled?: boolean;
	scale?: number;
	speed?: number;
}>;

export type ShadowOverlayNoise = Readonly<{
	enabled?: boolean;
	opacity?: number;
	scale?: number;
}>;

export type ShadowOverlayProps = Readonly<{
	type?: ShadowOverlayType;
	presetIndex?: number;
	customImageSrc?: string;
	customImageAlt?: string;
	sizing?: ShadowOverlaySizing;
	color?: string;
	animation?: ShadowOverlayAnimation;
	noise?: ShadowOverlayNoise;
	className?: string;
	style?: React.CSSProperties;
}>;

function mapRange(
	value: number,
	fromLow: number,
	fromHigh: number,
	toLow: number,
	toHigh: number,
): number {
	if (fromLow === fromHigh) {
		return toLow;
	}

	const percentage = (value - fromLow) / (fromHigh - fromLow);
	return toLow + percentage * (toHigh - toLow);
}

function clamp(value: number, min: number, max: number): number {
	return Math.max(min, Math.min(max, value));
}

function getPresetImageUrl(presetIndex: number): string {
	const roundedIndex = Math.round(clamp(presetIndex, 1, SHADOW_OVERLAY_PRESET_IDS.length));
	const imageId = SHADOW_OVERLAY_PRESET_IDS[roundedIndex - 1];
	return `https://framerusercontent.com/images/${imageId}.png?scale-down-to=2048`;
}

function useFilterId() {
	const reactId = useId();
	return `shadow-overlay-${reactId.replace(/:/g, "")}`;
}

export default function ShadowOverlay({
	type = "preset",
	presetIndex = 1,
	customImageSrc,
	customImageAlt,
	sizing = "fill",
	color = "#424240",
	animation = { enabled: true, scale: 50, speed: 30 },
	noise = { enabled: false, opacity: 0.5, scale: 1 },
	className,
	style,
}: ShadowOverlayProps) {
	const filterId = useFilterId();
	const reduceMotion = useReducedMotion();
	const hueRotateRef = useRef<SVGFEColorMatrixElement | null>(null);
	const hueRotateMotionValue = useMotionValue(180);

	const animationScale = clamp(animation.scale ?? 50, 1, 100);
	const animationSpeed = clamp(animation.speed ?? 30, 1, 100);
	const animationEnabled = Boolean(animation.enabled)
		&& animationScale > 0
		&& !reduceMotion;
	const displacementScale = animationEnabled
		? mapRange(animationScale, 1, 100, 20, 100)
		: 0;
	const animationDuration = mapRange(animationSpeed, 1, 100, 1000, 50);

	const imageSrc = type === "custom" ? customImageSrc : getPresetImageUrl(presetIndex);
	const maskSize = sizing === "stretch" ? "100% 100%" : "cover";
	const noiseEnabled = Boolean(noise.enabled) && (noise.opacity ?? 0) > 0;

	useEffect(() => {
		if (!hueRotateRef.current || !animationEnabled) {
			return undefined;
		}

		hueRotateMotionValue.set(0);
		const controls = animate(hueRotateMotionValue, 360, {
			duration: animationDuration / 25,
			repeat: Infinity,
			repeatType: "loop",
			repeatDelay: 0,
			ease: "linear",
			delay: 0,
			onUpdate: (value) => {
				hueRotateRef.current?.setAttribute("values", String(value));
			},
		});

		return () => {
			controls.stop();
		};
	}, [animationDuration, animationEnabled, hueRotateMotionValue]);

	const maskStyle = useMemo<React.CSSProperties>(
		() => ({
			backgroundColor: color,
			maskImage: imageSrc ? `url("${imageSrc}")` : undefined,
			WebkitMaskImage: imageSrc ? `url("${imageSrc}")` : undefined,
			maskSize,
			WebkitMaskSize: maskSize,
			maskRepeat: "no-repeat",
			WebkitMaskRepeat: "no-repeat",
			maskPosition: "center",
			WebkitMaskPosition: "center",
			width: "100%",
			height: "100%",
		}),
		[color, imageSrc, maskSize],
	);

	return (
		<div
			className={cn("relative h-full w-full overflow-hidden", className)}
			style={style}
		>
			<div
				className="absolute"
				style={{
					inset: -displacementScale,
					filter: animationEnabled ? `url(#${filterId}) blur(4px)` : "none",
				}}
			>
				{animationEnabled ? (
					<svg
						aria-hidden="true"
						focusable="false"
						className="absolute size-0"
					>
						<defs>
							<filter id={filterId}>
								<feTurbulence
									result="undulation"
									numOctaves="2"
									baseFrequency={`${mapRange(animationScale, 0, 100, 0.001, 0.0005)},${mapRange(animationScale, 0, 100, 0.004, 0.002)}`}
									seed="0"
									type="turbulence"
								/>
								<feColorMatrix
									ref={hueRotateRef}
									in="undulation"
									result="rotated-undulation"
									type="hueRotate"
									values="180"
								/>
								<feColorMatrix
									in="rotated-undulation"
									result="circulation"
									type="matrix"
									values="4 0 0 0 1  4 0 0 0 1  4 0 0 0 1  1 0 0 0 0"
								/>
								<feDisplacementMap
									in="SourceGraphic"
									in2="circulation"
									scale={displacementScale}
									result="dist"
								/>
								<feDisplacementMap
									in="dist"
									in2="undulation"
									scale={displacementScale}
									result="output"
								/>
							</filter>
						</defs>
					</svg>
				) : null}
				{imageSrc ? (
					<div
						role={customImageAlt ? "img" : undefined}
						aria-label={customImageAlt || undefined}
						style={maskStyle}
					/>
				) : null}
			</div>
			{noiseEnabled ? (
				<div
					aria-hidden="true"
					className="absolute inset-0"
					style={{
						backgroundImage: `url("${NOISE_TEXTURE_SRC}")`,
						backgroundRepeat: "repeat",
						backgroundSize: `${(noise.scale ?? 1) * 200}px`,
						opacity: (noise.opacity ?? 0) / 2,
					}}
				/>
			) : null}
		</div>
	);
}
