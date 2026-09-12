"use client";

import {
	useMemo,
	useRef,
	useState,
	type CSSProperties,
	type Dispatch,
	type ReactNode,
	type SetStateAction,
} from "react";
import SendIcon from "@atlaskit/icon/core/send";
import { motion, useReducedMotion } from "motion/react";

import { Icon } from "@/components/ui/icon";
import { GUI } from "@/components/utils/gui";
import {
	DEFAULT_LIQUID_METAL_CONFIG,
	LIQUID_METAL_CONTROL_RANGES,
	LIQUID_METAL_PRESET_OPTIONS,
	LIQUID_METAL_REFLECTION_TARGET_MODE_OPTIONS,
	LIQUID_METAL_THEME_OPTIONS,
	LIQUID_METAL_VARIANT_OPTIONS,
	LiquidMetal,
	type LiquidMetalControlConfig,
	type LiquidMetalDemoSurface,
	type LiquidMetalReflectionTargetsMode,
	type MetalFxPreset,
	type MetalFxProps,
	type MetalFxVariant,
} from "@/components/visual/liquid-metal";
import { cn } from "@/lib/utils";

type RequiredLiquidMetalControls = Required<Pick<
	LiquidMetalControlConfig,
	"borderRadius" | "ringCssPx" | "shaderScale"
>>;
type LiquidMetalDemoConfig = LiquidMetalControlConfig & RequiredLiquidMetalControls;
type LiquidMetalConfigKey = keyof LiquidMetalDemoConfig;
type LiquidMetalHostSurface = LiquidMetalDemoSurface | "panel";
type ShowcaseMotion = "none" | "pulse";
type ReflectionTargets = NonNullable<MetalFxProps["reflectionTargets"]>;

const DEFAULT_CONFIG: LiquidMetalDemoConfig = {
	...DEFAULT_LIQUID_METAL_CONFIG,
	borderRadius: LIQUID_METAL_CONTROL_RANGES.borderRadius.defaultValue,
	ringCssPx: LIQUID_METAL_CONTROL_RANGES.ringCssPx.defaultValue,
	shaderScale: LIQUID_METAL_CONTROL_RANGES.shaderScale.defaultValue,
};

function setConfigValue<K extends LiquidMetalConfigKey>(
	setConfig: Dispatch<SetStateAction<LiquidMetalDemoConfig>>,
	key: K,
	value: LiquidMetalDemoConfig[K],
) {
	setConfig((current) => ({
		...current,
		[key]: value,
	}));
}

function getDefaultSurface(variant: MetalFxVariant): LiquidMetalHostSurface {
	return variant === "circle" ? "icon" : "pill";
}

function getHostClass(surface: LiquidMetalHostSurface): string {
	if (surface === "icon") {
		return "size-24 rounded-full";
	}

	if (surface === "toolbar") {
		return "min-h-12 min-w-64 rounded-full px-2 py-1";
	}

	if (surface === "panel") {
		return "min-h-36 w-full max-w-sm rounded-lg p-4";
	}

	return "min-h-14 min-w-52 rounded-full px-6 py-3";
}

function coerceReflectionTargets(refs: readonly unknown[]): ReflectionTargets {
	return refs as ReflectionTargets;
}

function LiquidMetalHost({
	children,
	className,
	config,
	overrides,
	reflectionTargets,
	surface,
}: Readonly<{
	children: ReactNode;
	className?: string;
	config: LiquidMetalDemoConfig;
	overrides?: Partial<LiquidMetalDemoConfig>;
	reflectionTargets?: ReflectionTargets;
	surface?: LiquidMetalHostSurface;
}>) {
	const merged = { ...config, ...overrides };
	const effectiveBorderRadius = merged.variant === "circle" ? 999 : merged.borderRadius;
	const resolvedSurface = surface ?? getDefaultSurface(merged.variant);
	const hostStyle: CSSProperties = {
		borderRadius: effectiveBorderRadius,
	};

	return (
		<LiquidMetal
			variant={merged.variant}
			preset={merged.preset}
			theme={merged.theme}
			strength={merged.strength}
			paused={merged.paused}
			borderRadius={effectiveBorderRadius}
			normalizeHostStyles={merged.normalizeHostStyles}
			reflectionTargets={merged.reflectionTargetsMode === "refs" ? reflectionTargets : undefined}
			disableGlow={merged.disableGlow}
			shaderScale={merged.shaderScale}
			ringCssPx={merged.ringCssPx}
			scale={merged.scale}
			style={hostStyle}
			className={cn(
				"relative isolate inline-flex shrink-0 items-center justify-center overflow-hidden border border-border/70 bg-surface-raised/90 text-text shadow-sm",
				getHostClass(resolvedSurface),
				className,
			)}
		>
			{children}
		</LiquidMetal>
	);
}

function AnimatedShowcaseShell({
	active,
	children,
	mode,
}: Readonly<{
	active: boolean;
	children: ReactNode;
	mode: ShowcaseMotion;
}>) {
	const animate = active && mode === "pulse"
		? { scale: [1, 1.045, 1] }
		: { scale: 1 };
	const transition = active && mode === "pulse"
		? { duration: 2.4, ease: "easeInOut" as const, repeat: Number.POSITIVE_INFINITY }
		: { duration: 0 };

	return (
		<motion.div
			animate={animate}
			transition={transition}
			style={{ willChange: "transform" }}
			className="flex items-center justify-center"
		>
			{children}
		</motion.div>
	);
}

function PlaygroundContent({ variant }: Readonly<{ variant: MetalFxVariant }>) {
	if (variant === "circle") {
		return <Icon render={<SendIcon label="" size="medium" />} aria-hidden className="text-current" />;
	}

	return <span className="text-sm font-semibold text-current">Liquid Metal</span>;
}

function ShowcasePill({
	active,
	config,
	label,
	mode,
	preset,
}: Readonly<{
	active: boolean;
	config: LiquidMetalDemoConfig;
	label: string;
	mode: ShowcaseMotion;
	/**
	 * Optional. metal-fx renders every visible instance from one shared GL
	 * canvas, so the material is page-level — examples that omit this
	 * inherit whatever preset the page is showing instead of fighting for
	 * it, which is what an example pinning its own preset would do.
	 */
	preset?: MetalFxPreset;
}>) {
	return (
		<div className="flex flex-col items-center justify-center gap-3">
			<AnimatedShowcaseShell active={active} mode={mode}>
				<LiquidMetalHost
					config={config}
					overrides={{
						...(preset ? { preset } : {}),
						variant: "button",
						borderRadius: 999,
					}}
				>
					<span className="text-sm font-semibold text-current">{label}</span>
				</LiquidMetalHost>
			</AnimatedShowcaseShell>
		</div>
	);
}

function SendCircleShowcase({
	active,
	config,
}: Readonly<{
	active: boolean;
	config: LiquidMetalDemoConfig;
}>) {
	return (
		<div className="flex flex-col items-center justify-center gap-3">
			<AnimatedShowcaseShell active={active} mode="pulse">
				<LiquidMetalHost
					config={config}
					overrides={{ preset: "gold", variant: "circle", borderRadius: 999 }}
					className="size-20 text-amber-950"
				>
					<Icon render={<SendIcon label="" size="medium" />} aria-hidden />
				</LiquidMetalHost>
			</AnimatedShowcaseShell>
		</div>
	);
}

function ProximityShowcase({ config }: Readonly<{ config: LiquidMetalDemoConfig }>) {
	const firstRef = useRef<HTMLDivElement | null>(null);
	const secondRef = useRef<HTMLDivElement | null>(null);
	const thirdRef = useRef<HTMLDivElement | null>(null);
	const reflectionTargets = useMemo(
		() => coerceReflectionTargets([firstRef, secondRef, thirdRef]),
		[],
	);

	return (
		<div className="flex flex-col items-center justify-center gap-3">
			<div className="flex items-center gap-3">
				<div ref={firstRef} className="size-12 rounded-xl bg-bg-neutral" />
				<div ref={secondRef} className="size-12 rounded-xl bg-bg-neutral-hovered" />
				<div ref={thirdRef} className="size-12 rounded-xl bg-bg-neutral" />
			</div>
			<LiquidMetalHost
				config={config}
				overrides={{ preset: "silver", variant: "button", borderRadius: 999, reflectionTargetsMode: "refs" }}
				reflectionTargets={reflectionTargets}
				className="min-w-40 px-5 py-2"
			>
				<span className="text-sm font-semibold text-current">Proximity</span>
			</LiquidMetalHost>
		</div>
	);
}

function LiquidMetalControls({
	config,
	onConfigChange,
}: Readonly<{
	config: LiquidMetalDemoConfig;
	onConfigChange: Dispatch<SetStateAction<LiquidMetalDemoConfig>>;
}>) {
	return (
		<GUI.Panel title="Liquid Metal controls" values={{ ...config }}>
			<GUI.Section title="Material" borderTop={false}>
				<GUI.Select
					id="liquid-metal-variant"
					label="Variant"
					value={config.variant}
					options={LIQUID_METAL_VARIANT_OPTIONS}
					onChange={(variant) => setConfigValue(onConfigChange, "variant", variant)}
					valueKeys="variant"
				/>
				<GUI.Select
					id="liquid-metal-preset"
					label="Preset"
					value={config.preset}
					options={LIQUID_METAL_PRESET_OPTIONS}
					onChange={(preset) => setConfigValue(onConfigChange, "preset", preset)}
					valueKeys="preset"
				/>
				<GUI.Select
					id="liquid-metal-theme"
					label="Theme"
					value={config.theme}
					options={LIQUID_METAL_THEME_OPTIONS}
					onChange={(theme) => setConfigValue(onConfigChange, "theme", theme)}
					valueKeys="theme"
				/>
				<GUI.Control
					id="liquid-metal-strength"
					label="Strength"
					value={config.strength}
					defaultValue={DEFAULT_CONFIG.strength}
					min={LIQUID_METAL_CONTROL_RANGES.strength.min}
					max={LIQUID_METAL_CONTROL_RANGES.strength.max}
					step={LIQUID_METAL_CONTROL_RANGES.strength.step}
					onChange={(strength) => setConfigValue(onConfigChange, "strength", strength)}
					valueKeys="strength"
				/>
			</GUI.Section>

			<GUI.Section title="Playback">
				<GUI.Toggle
					id="liquid-metal-paused"
					label="Paused"
					checked={config.paused}
					onChange={(paused) => setConfigValue(onConfigChange, "paused", paused)}
					valueKeys="paused"
				/>
				<GUI.Toggle
					id="liquid-metal-disable-glow"
					label="Disable glow"
					checked={config.disableGlow}
					onChange={(disableGlow) => setConfigValue(onConfigChange, "disableGlow", disableGlow)}
					valueKeys="disableGlow"
				/>
			</GUI.Section>

			<GUI.Section title="Host">
				<GUI.Control
					id="liquid-metal-border-radius"
					label="Radius"
					value={config.borderRadius}
					defaultValue={DEFAULT_CONFIG.borderRadius}
					min={LIQUID_METAL_CONTROL_RANGES.borderRadius.min}
					max={LIQUID_METAL_CONTROL_RANGES.borderRadius.max}
					step={LIQUID_METAL_CONTROL_RANGES.borderRadius.step}
					unit="px"
					onChange={(borderRadius) => setConfigValue(onConfigChange, "borderRadius", borderRadius)}
					valueKeys="borderRadius"
				/>
				<GUI.Control
					id="liquid-metal-scale"
					label="Scale"
					value={config.scale}
					defaultValue={DEFAULT_CONFIG.scale}
					min={LIQUID_METAL_CONTROL_RANGES.scale.min}
					max={LIQUID_METAL_CONTROL_RANGES.scale.max}
					step={LIQUID_METAL_CONTROL_RANGES.scale.step}
					onChange={(scale) => setConfigValue(onConfigChange, "scale", scale)}
					valueKeys="scale"
				/>
				<GUI.Toggle
					id="liquid-metal-normalize-host-styles"
					label="Normalize host"
					checked={config.normalizeHostStyles}
					onChange={(normalizeHostStyles) => setConfigValue(onConfigChange, "normalizeHostStyles", normalizeHostStyles)}
					valueKeys="normalizeHostStyles"
				/>
			</GUI.Section>

			<GUI.Section title="Reflection and shader">
				<GUI.Select
					id="liquid-metal-reflection-targets"
					label="Reflection targets"
					value={config.reflectionTargetsMode}
					options={LIQUID_METAL_REFLECTION_TARGET_MODE_OPTIONS}
					onChange={(reflectionTargetsMode: LiquidMetalReflectionTargetsMode) => setConfigValue(onConfigChange, "reflectionTargetsMode", reflectionTargetsMode)}
					valueKeys="reflectionTargetsMode"
				/>
				<GUI.Control
					id="liquid-metal-shader-scale"
					label="Shader scale"
					value={config.shaderScale}
					defaultValue={DEFAULT_CONFIG.shaderScale}
					min={LIQUID_METAL_CONTROL_RANGES.shaderScale.min}
					max={LIQUID_METAL_CONTROL_RANGES.shaderScale.max}
					step={LIQUID_METAL_CONTROL_RANGES.shaderScale.step}
					onChange={(shaderScale) => setConfigValue(onConfigChange, "shaderScale", shaderScale)}
					valueKeys="shaderScale"
				/>
				<GUI.Control
					id="liquid-metal-ring-css-px"
					label="Ring"
					value={config.ringCssPx}
					defaultValue={DEFAULT_CONFIG.ringCssPx}
					min={LIQUID_METAL_CONTROL_RANGES.ringCssPx.min}
					max={LIQUID_METAL_CONTROL_RANGES.ringCssPx.max}
					step={LIQUID_METAL_CONTROL_RANGES.ringCssPx.step}
					unit="px"
					onChange={(ringCssPx) => setConfigValue(onConfigChange, "ringCssPx", ringCssPx)}
					valueKeys="ringCssPx"
				/>
			</GUI.Section>
		</GUI.Panel>
	);
}

function MainPlayground({
	config,
	motionActive,
	onConfigChange,
}: Readonly<{
	config: LiquidMetalDemoConfig;
	motionActive: boolean;
	onConfigChange: Dispatch<SetStateAction<LiquidMetalDemoConfig>>;
}>) {
	return (
		<div className="mx-auto flex w-full max-w-2xl flex-col gap-8">
			<div className="relative flex min-h-[420px] w-full items-center justify-center overflow-hidden rounded-3xl border border-border bg-surface px-6 py-8">
				<AnimatedShowcaseShell active={motionActive} mode={config.variant === "circle" ? "pulse" : "none"}>
					<LiquidMetalHost config={config} className="text-current">
						<PlaygroundContent variant={config.variant} />
					</LiquidMetalHost>
				</AnimatedShowcaseShell>
			</div>
			<LiquidMetalControls config={config} onConfigChange={onConfigChange} />
		</div>
	);
}

export function LiquidMetalDemoChromaticPill() {
	return (
		<ShowcasePill
			active
			config={DEFAULT_CONFIG}
			label="Static"
			mode="none"
		/>
	);
}

export function LiquidMetalDemoSilverPill() {
	return (
		<ShowcasePill
			active
			config={DEFAULT_CONFIG}
			label="Pulsing"
			mode="pulse"
		/>
	);
}

export function LiquidMetalDemoGoldSend() {
	return <SendCircleShowcase active config={DEFAULT_CONFIG} />;
}

export function LiquidMetalDemoChatReflection() {
	return <ProximityShowcase config={{ ...DEFAULT_CONFIG, theme: "dark", reflectionTargetsMode: "refs" }} />;
}

export default function LiquidMetalDemo() {
	const [config, setConfig] = useState<LiquidMetalDemoConfig>(DEFAULT_CONFIG);
	const shouldReduceMotion = useReducedMotion();
	const resolvedConfig = useMemo<LiquidMetalDemoConfig>(() => ({
		...config,
		paused: config.paused || Boolean(shouldReduceMotion),
	}), [config, shouldReduceMotion]);
	const motionActive = !resolvedConfig.paused;

	return (
		<MainPlayground
			config={resolvedConfig}
			motionActive={motionActive}
			onConfigChange={setConfig}
		/>
	);
}
