"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import BorderBeam, {
	BORDER_BEAM_COLOR_VARIANT_OPTIONS,
	BORDER_BEAM_CONTROL_RANGES,
	BORDER_BEAM_DEFAULTS,
	BORDER_BEAM_FAMILY_OPTIONS,
	BORDER_BEAM_THEME_OPTIONS,
	getBorderBeamDefaultsForSize,
	getBorderBeamSizeOptions,
	type BorderBeamDemoConfig,
	type BorderBeamFamily,
	type BorderBeamSize,
} from "@/components/visual/border-beam";
import { Button } from "@/components/ui/button";
import { GUI } from "@/components/utils/gui";
import { useTheme } from "@/components/utils/theme-wrapper";
import { cn } from "@/lib/utils";

type ResolvedTheme = "dark" | "light";

// Preview stage backdrops, tuned per theme so the beam glow reads on both.
const PREVIEW_SURFACE: Record<ResolvedTheme, string> = {
	dark: "bg-[#0C0D12]",
	light: "bg-[#F7F8F9]",
};

// The wrapped element is intentionally an empty surface: these demos showcase the
// beam and the container shape only — no product copy or iconography.
const SHAPE_BY_SIZE: Record<BorderBeamSize, string> = {
	sm: "size-12 rounded-full",
	md: "h-16 w-full rounded-2xl",
	line: "h-11 w-72 rounded-full",
	"pulse-inner": "h-28 w-full rounded-2xl",
	"pulse-outside": "h-16 w-full rounded-2xl",
};

/**
 * Resolve a demo `theme` config to a concrete light/dark value. `"auto"` follows
 * the app's active theme (the light/dark toggle) rather than only the OS setting,
 * so every preview visibly reacts when the site theme is switched.
 */
function resolveDemoTheme(theme: BorderBeamDemoConfig["theme"], appTheme: ResolvedTheme): ResolvedTheme {
	return theme === "auto" ? appTheme : theme;
}

/**
 * Empty, opaque container the beam wraps. Themed so it reads on both preview
 * stages; `pulse-outside` uses this 1px border as its idle hairline, so the
 * border is always present.
 */
function BeamShape({ theme, className }: Readonly<{ theme: ResolvedTheme; className?: string }>) {
	return (
		<div
			aria-hidden
			className={cn(
				"border",
				theme === "light" ? "border-black/10 bg-white" : "border-white/10 bg-[#1D1D1D]",
				className,
			)}
		/>
	);
}

function renderBeamConfig(config: BorderBeamDemoConfig, themeOverride?: ResolvedTheme) {
	return {
		size: config.size,
		colorVariant: config.colorVariant,
		theme: themeOverride ?? config.theme,
		staticColors: config.staticColors,
		duration: config.duration,
		active: config.active,
		borderRadius: config.autoBorderRadius ? undefined : config.borderRadius,
		brightness: config.brightness,
		saturation: config.saturation,
		hueRange: config.hueRange,
		strength: config.strength,
	};
}

function BorderBeamPreview({
	config,
	children,
	className,
	resolvedTheme,
}: Readonly<{
	config: BorderBeamDemoConfig;
	children: React.ReactNode;
	className?: string;
	resolvedTheme?: ResolvedTheme;
}>) {
	return (
		<div className={cn("min-w-0 p-8", className)} data-border-beam-preview="true">
			<BorderBeam
				className={config.size === "sm" || config.size === "line" ? "mx-auto w-fit" : "mx-auto w-full max-w-md"}
				{...renderBeamConfig(config, resolvedTheme)}
			>
				{children}
			</BorderBeam>
		</div>
	);
}

function BorderBeamMiniDemo({
	config,
	children,
	className,
}: Readonly<{
	config: BorderBeamDemoConfig;
	children: (theme: ResolvedTheme) => React.ReactNode;
	className?: string;
}>) {
	const { actualTheme } = useTheme();
	const resolvedTheme = resolveDemoTheme(config.theme, actualTheme);
	return (
		<div
			className={cn(
				"flex min-h-40 w-full items-center justify-center rounded-lg p-8 transition-colors duration-medium motion-reduce:transition-none",
				PREVIEW_SURFACE[resolvedTheme],
				className,
			)}
		>
			<BorderBeam {...renderBeamConfig(config, resolvedTheme)}>{children(resolvedTheme)}</BorderBeam>
		</div>
	);
}

function getNextSizeForFamily(family: BorderBeamFamily): BorderBeamSize {
	return family === "pulse" ? "pulse-inner" : "md";
}

export default function BorderBeamDemo() {
	const [config, setConfig] = useState<BorderBeamDemoConfig>(BORDER_BEAM_DEFAULTS);
	const { actualTheme, setTheme } = useTheme();
	const resolvedTheme = resolveDemoTheme(config.theme, actualTheme);

	// Border Beam reads best on a dark surface, so switch the app to dark once on
	// landing (persisted). Runs a single time so it never fights a manual toggle
	// back to light for previewing.
	const didForceDarkRef = useRef(false);
	useEffect(() => {
		if (didForceDarkRef.current) return;
		didForceDarkRef.current = true;
		setTheme("dark");
	}, [setTheme]);
	const sizeOptions = useMemo(() => getBorderBeamSizeOptions(config.family), [config.family]);
	const values = useMemo(() => ({
		...config,
		borderRadius: config.autoBorderRadius ? "auto" : config.borderRadius,
	}), [config]);

	const updateConfig = <K extends keyof BorderBeamDemoConfig>(
		key: K,
		value: BorderBeamDemoConfig[K],
	) => {
		setConfig((current) => ({ ...current, [key]: value }));
	};

	const applyFamily = (family: BorderBeamFamily) => {
		const nextSize = getNextSizeForFamily(family);
		setConfig((current) => ({
			...current,
			...getBorderBeamDefaultsForSize(nextSize),
			family,
			size: nextSize,
		}));
	};

	const applySize = (size: BorderBeamSize) => {
		setConfig((current) => ({
			...current,
			...getBorderBeamDefaultsForSize(size),
			colorVariant: current.colorVariant,
			theme: current.theme,
			staticColors: current.staticColors,
			active: current.active,
			autoBorderRadius: current.autoBorderRadius,
			hueRange: current.hueRange,
			strength: current.strength,
			size,
		}));
	};

	return (
		<div className="mx-auto flex w-full max-w-5xl flex-col gap-4 p-4 sm:p-6">
			<div
				className={cn(
					"overflow-hidden rounded-lg border border-border transition-colors duration-medium motion-reduce:transition-none",
					PREVIEW_SURFACE[resolvedTheme],
				)}
			>
				<BorderBeamPreview config={config} resolvedTheme={resolvedTheme} className="mx-auto max-w-2xl">
					<BeamShape theme={resolvedTheme} className={SHAPE_BY_SIZE[config.size]} />
				</BorderBeamPreview>
			</div>

			<GUI.Panel title="Border Beam controls" values={values}>
				<GUI.Section title="Playback" borderTop={false}>
					<div className="flex flex-wrap items-center gap-2">
						<Button
							type="button"
							variant="secondary"
							aria-pressed={config.active}
							onClick={() => updateConfig("active", !config.active)}
						>
							{config.active ? "Pause" : "Play"}
						</Button>
					</div>
					<GUI.Select
						id="border-beam-family"
						label="Family"
						value={config.family}
						options={BORDER_BEAM_FAMILY_OPTIONS}
						onChange={applyFamily}
						valueKeys="family"
					/>
					<GUI.Select
						id="border-beam-size"
						label="Size"
						value={config.size}
						options={sizeOptions}
						onChange={applySize}
						valueKeys="size"
					/>
					<GUI.Select
						id="border-beam-theme"
						label="Theme"
						value={config.theme}
						options={BORDER_BEAM_THEME_OPTIONS}
						onChange={(theme) => updateConfig("theme", theme)}
						valueKeys="theme"
					/>
					<GUI.Control
						id="border-beam-duration"
						label="Duration"
						value={config.duration}
						defaultValue={getBorderBeamDefaultsForSize(config.size).duration}
						{...BORDER_BEAM_CONTROL_RANGES.duration}
						onChange={(duration) => updateConfig("duration", duration)}
						valueKeys="duration"
					/>
					<GUI.Toggle
						id="border-beam-active"
						label="Active"
						checked={config.active}
						onChange={(active) => updateConfig("active", active)}
						valueKeys="active"
					/>
				</GUI.Section>

				<GUI.Section title="Color">
					<GUI.Select
						id="border-beam-color-variant"
						label="Variant"
						value={config.colorVariant}
						options={BORDER_BEAM_COLOR_VARIANT_OPTIONS}
						onChange={(colorVariant) => updateConfig("colorVariant", colorVariant)}
						valueKeys="colorVariant"
					/>
					<GUI.Toggle
						id="border-beam-static-colors"
						label="Static colors"
						checked={config.staticColors}
						onChange={(staticColors) => updateConfig("staticColors", staticColors)}
						valueKeys="staticColors"
					/>
					<GUI.Control
						id="border-beam-brightness"
						label="Brightness"
						value={config.brightness}
						defaultValue={getBorderBeamDefaultsForSize(config.size).brightness}
						{...BORDER_BEAM_CONTROL_RANGES.brightness}
						onChange={(brightness) => updateConfig("brightness", brightness)}
						valueKeys="brightness"
					/>
					<GUI.Control
						id="border-beam-saturation"
						label="Saturation"
						value={config.saturation}
						defaultValue={getBorderBeamDefaultsForSize(config.size).saturation}
						{...BORDER_BEAM_CONTROL_RANGES.saturation}
						onChange={(saturation) => updateConfig("saturation", saturation)}
						valueKeys="saturation"
					/>
					<GUI.Control
						id="border-beam-hue-range"
						label="Hue range"
						value={config.hueRange}
						defaultValue={30}
						{...BORDER_BEAM_CONTROL_RANGES.hueRange}
						onChange={(hueRange) => updateConfig("hueRange", hueRange)}
						valueKeys="hueRange"
					/>
				</GUI.Section>

				<GUI.Section title="Geometry">
					<GUI.Toggle
						id="border-beam-auto-radius"
						label="Auto radius"
						checked={config.autoBorderRadius}
						onChange={(autoBorderRadius) => updateConfig("autoBorderRadius", autoBorderRadius)}
						valueKeys="autoBorderRadius"
					/>
					<GUI.Control
						id="border-beam-border-radius"
						label="Border radius"
						value={config.borderRadius}
						defaultValue={getBorderBeamDefaultsForSize(config.size).borderRadius}
						disabled={config.autoBorderRadius}
						{...BORDER_BEAM_CONTROL_RANGES.borderRadius}
						onChange={(borderRadius) => updateConfig("borderRadius", borderRadius)}
						valueKeys="borderRadius"
					/>
					<GUI.Control
						id="border-beam-strength"
						label="Strength"
						value={config.strength}
						defaultValue={BORDER_BEAM_DEFAULTS.strength}
						{...BORDER_BEAM_CONTROL_RANGES.strength}
						onChange={(strength) => updateConfig("strength", strength)}
						valueKeys="strength"
					/>
				</GUI.Section>
			</GUI.Panel>
		</div>
	);
}

export function BorderBeamDemoRotateLarge() {
	const config = getBorderBeamDefaultsForSize("md");
	return (
		<BorderBeamMiniDemo config={{ ...config, strength: 0.8 }}>
			{(theme) => <BeamShape theme={theme} className="h-16 w-96 rounded-2xl" />}
		</BorderBeamMiniDemo>
	);
}

export function BorderBeamDemoRotateSmall() {
	const config = getBorderBeamDefaultsForSize("sm");
	return (
		<BorderBeamMiniDemo config={{ ...config, strength: 0.9 }}>
			{(theme) => <BeamShape theme={theme} className="size-12 rounded-full" />}
		</BorderBeamMiniDemo>
	);
}

export function BorderBeamDemoLineSearch() {
	const config = getBorderBeamDefaultsForSize("line");
	return (
		<BorderBeamMiniDemo config={{ ...config, strength: 0.95 }}>
			{(theme) => <BeamShape theme={theme} className="h-11 w-72 rounded-full" />}
		</BorderBeamMiniDemo>
	);
}

export function BorderBeamDemoPulseInnerWorking() {
	const config = getBorderBeamDefaultsForSize("pulse-inner");
	return (
		<BorderBeamMiniDemo config={{ ...config, strength: 0.76 }}>
			{(theme) => <BeamShape theme={theme} className="h-28 w-96 rounded-2xl" />}
		</BorderBeamMiniDemo>
	);
}

export function BorderBeamDemoPulsePill() {
	const config = getBorderBeamDefaultsForSize("pulse-inner");
	return (
		<BorderBeamMiniDemo config={{ ...config, strength: 0.82 }}>
			{(theme) => <BeamShape theme={theme} className="h-11 w-40 rounded-full" />}
		</BorderBeamMiniDemo>
	);
}

export function BorderBeamDemoPulseOutside() {
	const config = getBorderBeamDefaultsForSize("pulse-outside");
	return (
		<BorderBeamMiniDemo config={{ ...config, strength: 0.8 }}>
			{(theme) => <BeamShape theme={theme} className="h-16 w-96 rounded-2xl" />}
		</BorderBeamMiniDemo>
	);
}

export function BorderBeamDemoMonoPulseSearch() {
	const config = getBorderBeamDefaultsForSize("pulse-inner");
	return (
		<BorderBeamMiniDemo config={{ ...config, colorVariant: "mono", strength: 0.9 }}>
			{(theme) => <BeamShape theme={theme} className="h-11 w-72 rounded-full" />}
		</BorderBeamMiniDemo>
	);
}

export function BorderBeamDemoCompactGallery() {
	const rotate = getBorderBeamDefaultsForSize("md");
	const pulse = getBorderBeamDefaultsForSize("pulse-inner");
	const outside = getBorderBeamDefaultsForSize("pulse-outside");
	const { actualTheme } = useTheme();

	return (
		<div
			className={cn(
				"grid w-full gap-3 p-6 transition-colors duration-medium motion-reduce:transition-none md:grid-cols-3",
				PREVIEW_SURFACE[actualTheme],
			)}
		>
			<BorderBeamMiniDemo config={{ ...rotate, colorVariant: "ocean", strength: 0.8 }} className="min-h-36 p-5">
				{(theme) => <BeamShape theme={theme} className="h-16 w-44 rounded-2xl" />}
			</BorderBeamMiniDemo>
			<BorderBeamMiniDemo config={{ ...pulse, colorVariant: "sunset", strength: 0.85 }} className="min-h-36 p-5">
				{(theme) => <BeamShape theme={theme} className="h-11 w-40 rounded-full" />}
			</BorderBeamMiniDemo>
			<BorderBeamMiniDemo config={{ ...outside, colorVariant: "colorful", strength: 0.78 }} className="min-h-36 p-5">
				{(theme) => <BeamShape theme={theme} className="size-12 rounded-full" />}
			</BorderBeamMiniDemo>
		</div>
	);
}

export function BorderBeamDemoPlayPause() {
	const config = getBorderBeamDefaultsForSize("md");
	const { actualTheme } = useTheme();
	const resolvedTheme = resolveDemoTheme(config.theme, actualTheme);
	const [active, setActive] = useState(true);
	return (
		<div
			className={cn(
				"flex min-h-40 w-full flex-col items-center justify-center gap-4 rounded-lg p-8 transition-colors duration-medium motion-reduce:transition-none",
				PREVIEW_SURFACE[resolvedTheme],
			)}
		>
			<BorderBeam {...renderBeamConfig({ ...config, strength: 0.85, active }, resolvedTheme)}>
				<BeamShape theme={resolvedTheme} className="h-16 w-96 rounded-2xl" />
			</BorderBeam>
			<Button
				type="button"
				variant="secondary"
				aria-pressed={active}
				onClick={() => setActive((prev) => !prev)}
			>
				{active ? "Pause beam" : "Play beam"}
			</Button>
		</div>
	);
}

export function BorderBeamDemoStrengthLadder() {
	const config = getBorderBeamDefaultsForSize("md");
	const strengths = [0.35, 0.65, 1] as const;
	const { actualTheme } = useTheme();
	return (
		<div
			className={cn(
				"grid w-full gap-3 p-6 transition-colors duration-medium motion-reduce:transition-none md:grid-cols-3",
				PREVIEW_SURFACE[actualTheme],
			)}
		>
			{strengths.map((strength) => (
				<BorderBeamMiniDemo key={strength} config={{ ...config, strength }} className="min-h-36 p-5">
					{(theme) => <BeamShape theme={theme} className="h-16 w-44 rounded-2xl" />}
				</BorderBeamMiniDemo>
			))}
		</div>
	);
}

export function BorderBeamDemoReflection() {
	const config = getBorderBeamDefaultsForSize("pulse-outside");
	const { actualTheme } = useTheme();
	const resolvedTheme = resolveDemoTheme(config.theme, actualTheme);
	const variants = ["colorful", "ocean"] as const;
	return (
		<div
			className={cn(
				"flex min-h-52 w-full flex-col items-center justify-center gap-3 rounded-lg p-10 transition-colors duration-medium motion-reduce:transition-none",
				PREVIEW_SURFACE[resolvedTheme],
			)}
		>
			{variants.map((colorVariant) => (
				<BorderBeam
					key={colorVariant}
					{...renderBeamConfig({ ...config, colorVariant, strength: 0.95 }, resolvedTheme)}
				>
					<BeamShape theme={resolvedTheme} className="h-14 w-72 rounded-2xl" />
				</BorderBeam>
			))}
		</div>
	);
}
