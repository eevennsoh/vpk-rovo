"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import Image from "next/image";
import CalendarIcon from "@atlaskit/icon/core/calendar";
import { SheetIcon } from "@/components/ui/vpk-icons";

import {
	GenerativeCard,
	GenerativeCardBody,
	GenerativeCardContent,
	GenerativeCardFooter,
	GenerativeCardHeader,
	GenerativeCardPreview,
} from "@/components/blocks/generative-card";
import { Button } from "@/components/ui/button";
import { ConfluenceLogo } from "@/components/ui/logo";
import { Tile } from "@/components/ui/tile";
import { GUI } from "@/components/utils/gui";
import { cn } from "@/lib/utils";

const INNER_GLOW_STYLE_ID = "gen-card-inner-glow-keyframes";
const DEFAULT_INNER_GLOW_DURATION_MS = 4000;
const DEFAULT_INNER_GLOW_SPREAD = 12;
const DEFAULT_INNER_GLOW_THICKNESS = 12;
const DEFAULT_INNER_GLOW_SOFTNESS = 10;
const DEFAULT_INNER_GLOW_SATURATION = 170;
const DEFAULT_INNER_GLOW_INTENSITY = 1;
const DISTORTION_TINT_PRESETS = [
	{ label: "Rovo blue", color: "#1868DB" },
	{ label: "Rovo orange", color: "#FCA700" },
	{ label: "Rovo purple", color: "#AF59E1" },
	{ label: "Rovo green", color: "#6A9A23" },
] as const;
const DEFAULT_DISTORTION_TINT_PRESET_INDEX = 0;
const DEFAULT_DISTORTION_TINT_STRENGTH = 0.45;
const DEFAULT_DISTORTION_TINT_GRADIENT = true;
const DEFAULT_DISTORTION_EDGE_SAFE_X = 0;
const ARTIFACT_SHEET_PREVIEW = `SHEET
# Apple Inc.: A Comprehensive Overview

- Company: Apple Inc.
- Founded: 1976
- Headquarter: Cupertino
- Focus: Devices, services, ecosystem`;

const INNER_GLOW_KEYFRAMES = `
@property --gen-card-inner-angle {
	syntax: '<angle>';
	initial-value: 0deg;
	inherits: false;
}
@keyframes gen-card-inner-angle-spin {
	to { --gen-card-inner-angle: 1turn; }
}
@keyframes gen-card-inner-opacity {
	0%   { opacity: 0; }
	8%   { opacity: var(--gen-card-inner-peak, 1); }
	88%  { opacity: calc(var(--gen-card-inner-peak, 1) * 0.95); }
	100% { opacity: 0; }
}
@media (prefers-reduced-motion: reduce) {
	@keyframes gen-card-inner-angle-spin {
		to { --gen-card-inner-angle: 0deg; }
	}
	@keyframes gen-card-inner-opacity {
		0%   { opacity: calc(var(--gen-card-inner-peak, 1) * 0.44); }
		100% { opacity: calc(var(--gen-card-inner-peak, 1) * 0.44); }
	}
}
`;

function useInnerGlowStyles() {
	useEffect(() => {
		if (typeof document === "undefined") return;
		let styleEl = document.getElementById(INNER_GLOW_STYLE_ID) as HTMLStyleElement | null;
		if (!styleEl) {
			styleEl = document.createElement("style");
			styleEl.id = INNER_GLOW_STYLE_ID;
			document.head.appendChild(styleEl);
		}
		if (styleEl.textContent !== INNER_GLOW_KEYFRAMES) {
			styleEl.textContent = INNER_GLOW_KEYFRAMES;
		}
	}, []);
}

type GenerativeCardInnerGlowShellProps = Readonly<{
	enabled: boolean;
	durationMs: number;
	spread: number;
	thickness: number;
	softness: number;
	saturation: number;
	intensity: number;
	className?: string;
	children: ReactNode;
}>;

function GenerativeCardInnerGlowShell({
	enabled,
	durationMs,
	spread,
	thickness,
	softness,
	saturation,
	intensity,
	className,
	children,
}: GenerativeCardInnerGlowShellProps) {
	useInnerGlowStyles();
	const rovoConic = "conic-gradient(from var(--gen-card-inner-angle), #1868DB, #AF59E1, #FCA700, #6A9A23, #1868DB)";
	const peakOpacity = Math.max(0, Math.min(1, intensity));
	const ringInset = -(spread + thickness * 0.5);
	const glowAnimation = `gen-card-inner-angle-spin ${durationMs}ms linear forwards, gen-card-inner-opacity ${durationMs}ms var(--ease-out, ease-out) forwards`;
	const glowVariables = {
		"--gen-card-inner-peak": peakOpacity,
	} as CSSProperties;

	return (
		<div className={cn("relative", className)}>
			{enabled ? (
				<div
					aria-hidden="true"
					className="pointer-events-none absolute inset-0 z-20 overflow-hidden rounded-xl"
					style={glowVariables}
				>
					<div
						style={{
							position: "absolute",
							inset: ringInset,
							borderRadius: 12,
							borderWidth: thickness,
							borderStyle: "solid",
							borderColor: "transparent",
							borderImageSource: rovoConic,
							borderImageSlice: 1,
							filter: `blur(${softness}px) saturate(${saturation}%)`,
							opacity: 0,
							animation: glowAnimation,
							willChange: "opacity",
						}}
					/>
				</div>
			) : null}
			<div className="relative z-10">{children}</div>
		</div>
	);
}

export function GenerativeCardDemo3p() {
	return (
		<GenerativeCard className="mx-auto w-full max-w-[380px]">
			<GenerativeCardHeader
				title="Schedule meeting"
				description="Google Calendar"
				leading={(
					<Tile label="Google Calendar" size="medium" variant="transparent" isInset={false}>
						<Image src="/3p/google-calendar/32.svg" alt="" width={32} height={32} />
					</Tile>
				)}
			/>
			<GenerativeCardBody>
				<GenerativeCardContent>
					<GenerativeCardPreview>Generated content preview</GenerativeCardPreview>
				</GenerativeCardContent>
				<GenerativeCardFooter>
					<Button variant="outline" className="h-8 min-w-[117px]">
						Open preview
					</Button>
				</GenerativeCardFooter>
			</GenerativeCardBody>
		</GenerativeCard>
	);
}

export function GenerativeCardDemo1p() {
	return (
		<GenerativeCard className="mx-auto w-full max-w-[380px]">
			<GenerativeCardHeader
				title="Confluence"
				description="Document collaboration"
				leading={(
					<Tile label="Confluence" size="medium" variant="transparent" isInset={false} hasBorder>
						<ConfluenceLogo size="small" />
					</Tile>
				)}
			/>
			<GenerativeCardBody>
				<GenerativeCardContent>
					<GenerativeCardPreview>Generated content preview</GenerativeCardPreview>
				</GenerativeCardContent>
				<GenerativeCardFooter>
					<Button variant="outline" className="h-8 min-w-[117px]">
						Open preview
					</Button>
				</GenerativeCardFooter>
			</GenerativeCardBody>
		</GenerativeCard>
	);
}

export function GenerativeCardDemoIcon() {
	return (
		<GenerativeCard className="mx-auto w-full max-w-[380px]">
			<GenerativeCardHeader
				title="Team calendar"
				description="View upcoming events"
				leading={(
					<Tile label="Calendar" size="medium" variant="blueSubtle">
						<CalendarIcon label="" />
					</Tile>
				)}
			/>
			<GenerativeCardBody>
				<GenerativeCardContent>
					<GenerativeCardPreview>Generated content preview</GenerativeCardPreview>
				</GenerativeCardContent>
				<GenerativeCardFooter>
					<Button variant="outline" className="h-8 min-w-[117px]">
						Open preview
					</Button>
				</GenerativeCardFooter>
			</GenerativeCardBody>
		</GenerativeCard>
	);
}

function ArtifactSheetPreview() {
	return (
		<div className="rounded-md bg-surface p-4">
			<div className="max-h-36 overflow-hidden whitespace-pre-wrap font-mono text-[12px] leading-5 text-text-subtle">
				{ARTIFACT_SHEET_PREVIEW}
			</div>
		</div>
	);
}

export function GenerativeCardDemoArtifact() {
	return (
		<GenerativeCard className="mx-auto w-full max-w-[420px]">
			<GenerativeCardHeader
				title="Apple Inc.: A Comprehensive Overview"
				description="Created sheet"
				leading={(
					<Tile label="Sheet" size="medium" variant="greenSubtle">
						<SheetIcon className="size-4" />
					</Tile>
				)}
			/>
			<GenerativeCardBody>
				<GenerativeCardContent>
					<ArtifactSheetPreview />
				</GenerativeCardContent>
				<GenerativeCardFooter>
					<Button variant="outline">
						Open sheet
					</Button>
				</GenerativeCardFooter>
			</GenerativeCardBody>
		</GenerativeCard>
	);
}

export function GenerativeCardDemoArtifactCollapsed() {
	return (
		<GenerativeCard
			className="mx-auto w-full max-w-[420px]"
			defaultExpanded={false}
			size="sm"
		>
			<GenerativeCardHeader
				action={(
					<Button size="xs" type="button" variant="outline">
						Open sheet
					</Button>
				)}
				title="Apple Inc.: A Comprehensive Overview"
				description="Created sheet"
				leading={(
					<Tile label="Sheet" size="small" variant="greenSubtle">
						<SheetIcon className="size-3.5" />
					</Tile>
				)}
			/>
			<GenerativeCardBody>
				<GenerativeCardContent>
					<ArtifactSheetPreview />
				</GenerativeCardContent>
				<GenerativeCardFooter>
					<Button variant="outline">
						Open sheet
					</Button>
				</GenerativeCardFooter>
			</GenerativeCardBody>
		</GenerativeCard>
	);
}

export function GenerativeCardDemoAction() {
	return (
		<GenerativeCard className="mx-auto w-full max-w-[380px]">
			<GenerativeCardHeader
				title="Send message"
				description="Slack"
				leading={(
					<Tile label="Slack" size="medium" variant="transparent" isInset={false}>
						<Image src="/3p/slack/32.svg" alt="" width={32} height={32} />
					</Tile>
				)}
			/>
			<GenerativeCardBody>
				<GenerativeCardContent>
					<GenerativeCardPreview>Generated message preview</GenerativeCardPreview>
				</GenerativeCardContent>
				<GenerativeCardFooter
					action={(
						<Button className="h-8 min-w-[117px]">
							Send
						</Button>
					)}
				>
					<Button variant="outline" className="h-8 min-w-[117px]">
						Open preview
					</Button>
				</GenerativeCardFooter>
			</GenerativeCardBody>
		</GenerativeCard>
	);
}

export default function GenerativeCardDemo() {
	return <GenerativeCardDemoAnimated />;
}

export function GenerativeCardDemoAnimated() {
	const [key, setKey] = useState(0);
	const [durationMs, setDurationMs] = useState(2000);
	const [distortionScale, setDistortionScale] = useState(100);
	const [blur, setBlur] = useState(8);
	const [radius, setRadius] = useState(0.4);
	const [edgeSafeX, setEdgeSafeX] = useState(DEFAULT_DISTORTION_EDGE_SAFE_X);
	const [speed, setSpeed] = useState(1.35);
	const [scaleSmoothing, setScaleSmoothing] = useState(0.5);
	const [sweepSmoothing, setSweepSmoothing] = useState(0.5);
	const [distortion, setDistortion] = useState(true);
	const [distortionTintEnabled, setDistortionTintEnabled] = useState(false);
	const [distortionTintGradient, setDistortionTintGradient] = useState(DEFAULT_DISTORTION_TINT_GRADIENT);
	const [distortionTintPreset, setDistortionTintPreset] = useState(DEFAULT_DISTORTION_TINT_PRESET_INDEX);
	const [distortionTintStrength, setDistortionTintStrength] = useState(DEFAULT_DISTORTION_TINT_STRENGTH);
	const [borderTrace, setBorderTrace] = useState(false);
	const [innerGlow, setInnerGlow] = useState(false);
	const [borderDuration, setBorderDuration] = useState(2400);
	const [arcWidth, setArcWidth] = useState(90);
	const [innerGlowDuration, setInnerGlowDuration] = useState(DEFAULT_INNER_GLOW_DURATION_MS);
	const [innerGlowSpread, setInnerGlowSpread] = useState(DEFAULT_INNER_GLOW_SPREAD);
	const [innerGlowThickness, setInnerGlowThickness] = useState(DEFAULT_INNER_GLOW_THICKNESS);
	const [innerGlowSoftness, setInnerGlowSoftness] = useState(DEFAULT_INNER_GLOW_SOFTNESS);
	const [innerGlowSaturation, setInnerGlowSaturation] = useState(DEFAULT_INNER_GLOW_SATURATION);
	const [innerGlowIntensity, setInnerGlowIntensity] = useState(DEFAULT_INNER_GLOW_INTENSITY);
	const hasHydratedRef = useRef(false);
	const clampedTintPresetIndex = Math.max(0, Math.min(DISTORTION_TINT_PRESETS.length - 1, Math.round(distortionTintPreset)));
	const activeTintPreset = DISTORTION_TINT_PRESETS[clampedTintPresetIndex];
	const activeTintMode = distortionTintGradient ? "rovo-gradient" : "solid";
	const activeTintStrength = distortionTintEnabled ? distortionTintStrength : 0;

	const animationValues = useMemo(
		() => ({
			distortion,
			animateDuration: durationMs,
			animateDistortionScale: distortionScale,
			animateBlur: blur,
			animateRadius: radius,
			animateEdgeSafeX: edgeSafeX,
			animateSpeed: speed,
			animateScaleSmoothing: scaleSmoothing,
			animateSweepSmoothing: sweepSmoothing,
			distortionTintEnabled,
			distortionTintMode: activeTintMode,
			distortionTintPreset: activeTintPreset.label,
			distortionTintColor: activeTintPreset.color,
			distortionTintStrength: activeTintStrength,
			innerGlow,
			innerGlowDuration,
			innerGlowSpread,
			innerGlowThickness,
			innerGlowSoftness,
			innerGlowSaturation,
			innerGlowIntensity,
			...(borderTrace ? { borderEffect: "trace", borderEffectDuration: borderDuration, borderEffectArcWidth: arcWidth } : {}),
		}),
		[
			distortion,
			durationMs,
			distortionScale,
			blur,
			radius,
			edgeSafeX,
			speed,
			scaleSmoothing,
			sweepSmoothing,
			distortionTintEnabled,
			activeTintMode,
			activeTintPreset,
			activeTintStrength,
			innerGlow,
			innerGlowDuration,
			innerGlowSpread,
			innerGlowThickness,
			innerGlowSoftness,
			innerGlowSaturation,
			innerGlowIntensity,
			borderTrace,
			borderDuration,
			arcWidth,
		],
	);

	const handleRetry = useCallback(() => {
		setKey((prev) => prev + 1);
	}, []);

	useEffect(() => {
		if (!hasHydratedRef.current) {
			hasHydratedRef.current = true;
			return;
		}

		const timeoutId = window.setTimeout(() => {
			handleRetry();
		}, 75);

		return () => {
			window.clearTimeout(timeoutId);
		};
	}, [animationValues, handleRetry]);

	return (
		<div className="w-full">
			<div className="grid w-full gap-4 xl:grid-cols-[minmax(0,1fr)_380px] xl:items-start">
				<div className="flex min-h-[350px] w-full items-center justify-center rounded-lg bg-surface p-4 sm:p-6 lg:p-8">
					<GenerativeCardInnerGlowShell
						key={key}
						enabled={innerGlow}
						durationMs={innerGlowDuration}
						spread={innerGlowSpread}
						thickness={innerGlowThickness}
						softness={innerGlowSoftness}
						saturation={innerGlowSaturation}
						intensity={innerGlowIntensity}
						className="w-full max-w-[380px]"
					>
						<GenerativeCard
							animate={distortion}
							animateDuration={durationMs}
							animateDistortionScale={distortionScale}
							animateBlur={blur}
							animateRadius={radius}
							animateEdgeSafeX={edgeSafeX}
							animateSpeed={speed}
							animateScaleSmoothing={scaleSmoothing}
							animateSweepSmoothing={sweepSmoothing}
							animateTintMode={activeTintMode}
							animateTintColor={activeTintPreset.color}
							animateTintStrength={activeTintStrength}
							borderEffect={borderTrace ? "trace" : false}
							borderEffectDuration={borderDuration}
							borderEffectArcWidth={arcWidth}
							className="w-full"
						>
							<GenerativeCardHeader
								title="Schedule meeting"
								description="Google Calendar"
								leading={(
									<Tile label="Google Calendar" size="medium" variant="transparent" isInset={false}>
										<Image src="/3p/google-calendar/32.svg" alt="" width={32} height={32} />
									</Tile>
								)}
							/>
							<GenerativeCardBody>
								<GenerativeCardContent>
									<GenerativeCardPreview>
										<Image
											src="/illustration-ai/create/light.svg"
											alt="Generated content illustration"
											width={240}
											height={200}
											className="dark:hidden"
										/>
										<Image
											src="/illustration-ai/create/dark.svg"
											alt="Generated content illustration"
											width={240}
											height={200}
											className="hidden dark:block"
										/>
									</GenerativeCardPreview>
								</GenerativeCardContent>
								<GenerativeCardFooter
									action={(
										<Button className="h-8 min-w-[117px]">
											Send
										</Button>
									)}
								>
									<Button variant="outline" className="h-8 min-w-[117px]">
										Open preview
									</Button>
								</GenerativeCardFooter>
							</GenerativeCardBody>
						</GenerativeCard>
					</GenerativeCardInnerGlowShell>
				</div>
				<div className="w-full rounded-lg bg-surface p-4 sm:p-5 lg:p-6">
					<GUI.Panel title="Animation controls" values={animationValues} onPlay={handleRetry}>
					<GUI.Toggle
						id="distortion"
						label="Distortion"
						description="WebGL bulge + fringe entrance animation."
						checked={distortion}
						onChange={setDistortion}
						valueKeys="distortion"
					/>
					{distortion ? (
						<>
							<GUI.Toggle
								id="distortion-tint"
								label="Distortion tint"
								description="Apply a color tint inside the moving distortion band."
								checked={distortionTintEnabled}
								onChange={setDistortionTintEnabled}
								valueKeys="distortionTintEnabled"
							/>
							{distortionTintEnabled ? (
								<>
									<GUI.Toggle
										id="distortion-tint-gradient"
										label="Use 4-color gradient"
										description="Blend all 4 Rovo colors inside the distortion band."
										checked={distortionTintGradient}
										onChange={setDistortionTintGradient}
										valueKeys="distortionTintMode"
									/>
									{distortionTintGradient ? null : (
									<GUI.Control
										id="distortion-tint-preset"
										label="Tint color preset"
										description="0=Blue, 1=Orange, 2=Purple, 3=Green (Rovo colors)."
										value={clampedTintPresetIndex}
										defaultValue={DEFAULT_DISTORTION_TINT_PRESET_INDEX}
										min={0}
										max={DISTORTION_TINT_PRESETS.length - 1}
										step={1}
										onChange={(next) => {
											setDistortionTintPreset(Math.round(next));
										}}
										valueKeys={["distortionTintPreset", "distortionTintColor"]}
									/>
									)}
									<GUI.Control
										id="distortion-tint-strength"
										label="Tint strength"
										description="Opacity strength of the distortion tint blend."
										value={distortionTintStrength}
										defaultValue={DEFAULT_DISTORTION_TINT_STRENGTH}
										min={0}
										max={1}
										step={0.01}
										onChange={setDistortionTintStrength}
										valueKeys="distortionTintStrength"
									/>
								</>
							) : null}
							<GUI.Control
								id="anim-duration"
								label="Duration"
								description="How long the full top-to-bottom pass takes."
								value={durationMs}
								defaultValue={2000}
								min={100}
								max={3000}
								step={10}
								unit="ms"
								onChange={setDurationMs}
								valueKeys="animateDuration"
							/>
							<GUI.Control
								id="anim-distortion"
								label="Distortion scale"
								description="Maximum displacement strength inside the moving band."
								value={distortionScale}
								defaultValue={100}
								min={-300}
								max={300}
								step={1}
								onChange={setDistortionScale}
								valueKeys="animateDistortionScale"
							/>
							<GUI.Control
								id="anim-blur"
								label="Blur"
								description="Peak blur amount blended into the distortion band."
								value={blur}
								defaultValue={8}
								min={0}
								max={12}
								step={0.05}
								onChange={setBlur}
								valueKeys="animateBlur"
							/>
							<GUI.Control
								id="anim-radius"
								label="Radius"
								description="Band thickness relative to card height."
								value={radius}
								defaultValue={0.4}
								min={0.02}
								max={0.8}
								step={0.01}
								onChange={setRadius}
								valueKeys="animateRadius"
							/>
							<GUI.Control
								id="anim-edge-safe-x"
								label="Edge to edge"
								description="Horizontal side fade. 0 = full edge-to-edge; increase if side artifacts appear."
								value={edgeSafeX}
								defaultValue={DEFAULT_DISTORTION_EDGE_SAFE_X}
								min={0}
								max={0.08}
								step={0.001}
								onChange={setEdgeSafeX}
								valueKeys="animateEdgeSafeX"
							/>
							<GUI.Control
								id="anim-speed"
								label="Speed"
								description="Sweep velocity multiplier from top to bottom."
								value={speed}
								defaultValue={1.35}
								min={-3}
								max={3}
								step={0.05}
								onChange={setSpeed}
								valueKeys="animateSpeed"
							/>
							<GUI.Control
								id="anim-scale-smoothing"
								label="Scale smoothing"
								description="How quickly distortion strength catches up to target values."
								value={scaleSmoothing}
								defaultValue={0.5}
								min={0.01}
								max={1}
								step={0.01}
								onChange={setScaleSmoothing}
								valueKeys="animateScaleSmoothing"
							/>
							<GUI.Control
								id="anim-sweep-smoothing"
								label="Sweep smoothing"
								description="How quickly the band position tracks its target path."
								value={sweepSmoothing}
								defaultValue={0.5}
								min={0.01}
								max={1}
								step={0.01}
								onChange={setSweepSmoothing}
								valueKeys="animateSweepSmoothing"
							/>
						</>
					) : null}
					<GUI.Toggle
						id="border-trace"
						label="Border trace"
						description="Gradient comet tracing the card perimeter."
						checked={borderTrace}
						onChange={setBorderTrace}
						valueKeys="borderEffect"
					/>
					{borderTrace ? (
						<>
							<GUI.Control
								id="border-duration"
								label="Trace duration"
								description="Full cycle duration for the border trace animation."
								value={borderDuration}
								defaultValue={2400}
								min={500}
								max={5000}
								step={50}
								unit="ms"
								onChange={setBorderDuration}
								valueKeys="borderEffectDuration"
							/>
							<GUI.Control
								id="border-arc-width"
								label="Arc width"
								description="Angular width of the visible trace arc in degrees."
								value={arcWidth}
								defaultValue={90}
								min={30}
								max={180}
								step={1}
								unit="°"
								onChange={setArcWidth}
								valueKeys="borderEffectArcWidth"
							/>
						</>
					) : null}
					<GUI.Toggle
						id="inner-glow"
						label="Inner glow"
						description="Contained rotating conic inner edge glow using Rovo colors."
						checked={innerGlow}
						onChange={setInnerGlow}
						valueKeys="innerGlow"
					/>
					{innerGlow ? (
						<>
							<GUI.Control
								id="inner-glow-duration"
								label="Glow duration"
								description="One-shot spin + fade duration for the inner glow."
								value={innerGlowDuration}
								defaultValue={DEFAULT_INNER_GLOW_DURATION_MS}
								min={500}
								max={6000}
								step={50}
								unit="ms"
								onChange={setInnerGlowDuration}
								valueKeys="innerGlowDuration"
							/>
							<GUI.Control
								id="inner-glow-spread"
								label="Glow spread"
								description="How far the blurred ring expands into the card edge."
								value={innerGlowSpread}
								defaultValue={DEFAULT_INNER_GLOW_SPREAD}
								min={2}
								max={20}
								step={0.5}
								unit="px"
								onChange={setInnerGlowSpread}
								valueKeys="innerGlowSpread"
							/>
							<GUI.Control
								id="inner-glow-thickness"
								label="Glow thickness"
								description="Border-image thickness for the glow ring."
								value={innerGlowThickness}
								defaultValue={DEFAULT_INNER_GLOW_THICKNESS}
								min={2}
								max={20}
								step={0.5}
								unit="px"
								onChange={setInnerGlowThickness}
								valueKeys="innerGlowThickness"
							/>
							<GUI.Control
								id="inner-glow-softness"
								label="Glow softness"
								description="Blur amount for soft bloom around the inner edge."
								value={innerGlowSoftness}
								defaultValue={DEFAULT_INNER_GLOW_SOFTNESS}
								min={1}
								max={20}
								step={0.25}
								unit="px"
								onChange={setInnerGlowSoftness}
								valueKeys="innerGlowSoftness"
							/>
							<GUI.Control
								id="inner-glow-saturation"
								label="Glow saturation"
								description="Color saturation for the Rovo conic glow."
								value={innerGlowSaturation}
								defaultValue={DEFAULT_INNER_GLOW_SATURATION}
								min={100}
								max={320}
								step={5}
								unit="%"
								onChange={setInnerGlowSaturation}
								valueKeys="innerGlowSaturation"
							/>
							<GUI.Control
								id="inner-glow-intensity"
								label="Glow intensity"
								description="Peak opacity of the one-shot glow pulse."
								value={innerGlowIntensity}
								defaultValue={DEFAULT_INNER_GLOW_INTENSITY}
								min={0.1}
								max={1}
								step={0.01}
								onChange={setInnerGlowIntensity}
								valueKeys="innerGlowIntensity"
							/>
						</>
					) : null}
					</GUI.Panel>
				</div>
			</div>
		</div>
	);
}

export function GenerativeCardDemoAnimatedExample() {
	const [key, setKey] = useState(0);

	return (
		<div className="flex w-full flex-col items-center gap-3">
			<GenerativeCard
				key={key}
				animate
				className="w-full max-w-[380px]"
			>
				<GenerativeCardHeader
					title="Schedule meeting"
					description="Google Calendar"
					leading={(
						<Tile label="Google Calendar" size="medium" variant="transparent" isInset={false}>
							<Image src="/3p/google-calendar/32.svg" alt="" width={32} height={32} />
						</Tile>
					)}
				/>
				<GenerativeCardBody>
					<GenerativeCardContent>
						<GenerativeCardPreview>
							<Image
								src="/illustration-ai/create/light.svg"
								alt="Generated content illustration"
								width={240}
								height={200}
								className="dark:hidden"
							/>
							<Image
								src="/illustration-ai/create/dark.svg"
								alt="Generated content illustration"
								width={240}
								height={200}
								className="hidden dark:block"
							/>
						</GenerativeCardPreview>
					</GenerativeCardContent>
					<GenerativeCardFooter
						action={(
							<Button className="h-8 min-w-[117px]">
								Send
							</Button>
						)}
					>
						<Button variant="outline" className="h-8 min-w-[117px]">
							Open preview
						</Button>
					</GenerativeCardFooter>
				</GenerativeCardBody>
			</GenerativeCard>
			<Button
				type="button"
				variant="outline"
				size="sm"
				className="h-8"
				onClick={() => setKey((prev) => prev + 1)}
			>
				Retry animation
			</Button>
		</div>
	);
}

export function GenerativeCardDemoTrace() {
	const traceDurationMs = 4000;
	const [key, setKey] = useState(0);

	return (
		<div className="flex w-full flex-col items-center gap-3">
			<GenerativeCard
				key={key}
				borderEffect="trace"
				borderEffectDuration={traceDurationMs}
				className="w-full max-w-[380px]"
			>
				<GenerativeCardHeader
					title="Schedule meeting"
					description="Google Calendar"
					leading={(
						<Tile label="Google Calendar" size="medium" variant="transparent" isInset={false}>
							<Image src="/3p/google-calendar/32.svg" alt="" width={32} height={32} />
						</Tile>
					)}
				/>
				<GenerativeCardBody>
					<GenerativeCardContent>
						<GenerativeCardPreview>
							<Image
								src="/illustration-ai/create/light.svg"
								alt="Generated content illustration"
								width={240}
								height={200}
								className="dark:hidden"
							/>
							<Image
								src="/illustration-ai/create/dark.svg"
								alt="Generated content illustration"
								width={240}
								height={200}
								className="hidden dark:block"
							/>
						</GenerativeCardPreview>
					</GenerativeCardContent>
					<GenerativeCardFooter
						action={(
							<Button className="h-8 min-w-[117px]">
								Send
							</Button>
						)}
					>
						<Button variant="outline" className="h-8 min-w-[117px]">
							Open preview
						</Button>
					</GenerativeCardFooter>
				</GenerativeCardBody>
			</GenerativeCard>
			<Button
				type="button"
				variant="outline"
				size="sm"
				className="h-8"
				onClick={() => {
					setKey((prev) => prev + 1);
				}}
			>
				Retry animation
			</Button>
		</div>
	);
}

export function GenerativeCardDemoInnerGlow() {
	const durationMs = DEFAULT_INNER_GLOW_DURATION_MS;
	const [key, setKey] = useState(0);

	return (
		<div className="flex w-full flex-col items-center gap-3">
			<GenerativeCardInnerGlowShell
				key={key}
				enabled
				durationMs={durationMs}
				spread={DEFAULT_INNER_GLOW_SPREAD}
				thickness={DEFAULT_INNER_GLOW_THICKNESS}
				softness={DEFAULT_INNER_GLOW_SOFTNESS}
				saturation={DEFAULT_INNER_GLOW_SATURATION}
				intensity={DEFAULT_INNER_GLOW_INTENSITY}
				className="w-full max-w-[380px]"
			>
				<GenerativeCard
					className="w-full"
				>
					<GenerativeCardHeader
						title="Schedule meeting"
						description="Google Calendar"
						leading={(
							<Tile label="Google Calendar" size="medium" variant="transparent" isInset={false}>
								<Image src="/3p/google-calendar/32.svg" alt="" width={32} height={32} />
							</Tile>
						)}
					/>
					<GenerativeCardBody>
						<GenerativeCardContent>
							<GenerativeCardPreview>
								<Image
									src="/illustration-ai/create/light.svg"
									alt="Generated content illustration"
									width={240}
									height={200}
									className="dark:hidden"
								/>
								<Image
									src="/illustration-ai/create/dark.svg"
									alt="Generated content illustration"
									width={240}
									height={200}
									className="hidden dark:block"
								/>
							</GenerativeCardPreview>
						</GenerativeCardContent>
						<GenerativeCardFooter
							action={(
								<Button className="h-8 min-w-[117px]">
									Send
								</Button>
							)}
						>
							<Button variant="outline" className="h-8 min-w-[117px]">
								Open preview
							</Button>
						</GenerativeCardFooter>
					</GenerativeCardBody>
				</GenerativeCard>
			</GenerativeCardInnerGlowShell>
			<Button
				type="button"
				variant="outline"
				size="sm"
				className="h-8"
				onClick={() => {
					setKey((prev) => prev + 1);
				}}
			>
				Retry animation
			</Button>
		</div>
	);
}
