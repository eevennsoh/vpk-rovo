"use client";

import type { ReactNode } from "react";
import { Spinner } from "@/components/ui/spinner";
import LiquidGlass, {
	type LiquidGlassProps,
} from "@/components/website/demos/visual/shaders/liquid-glass";
import {
	LiquidGlassButton,
	type LiquidGlassButtonProps,
} from "@/components/website/demos/visual/shaders/liquid-glass-button";
import { cn } from "@/lib/utils";

type PersonalGraphGlassTuningProps = Partial<
	Omit<LiquidGlassProps, "children" | "className" | "height" | "style" | "width">
>;

type PersonalGraphLiquidGlassIconButtonProps = Omit<
	LiquidGlassButtonProps,
	"children" | "className"
> & {
	children?: ReactNode;
	className?: string;
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

const PERSONAL_GRAPH_GLASS_SHADOW = "0 28px 80px -44px color-mix(in srgb, var(--ds-text) 54%, transparent)";
const PERSONAL_GRAPH_GLASS_BACKGROUND_OPACITY = 0.003;
const PERSONAL_GRAPH_GLASS_FALLBACK_BACKGROUND_OPACITY = 0.12;
export const PERSONAL_GRAPH_CHROMATIC_RGB_GLASS_PROPS = {
	blur: 4,
	displace: 5,
	distortionScale: -180,
	dispersion: 0,
	redOffset: 50,
	greenOffset: -1,
	blueOffset: -19,
	xChannel: "R",
	yChannel: "G",
} satisfies PersonalGraphGlassTuningProps;

const PERSONAL_GRAPH_LIQUID_GLASS_ICON_BUTTON_PROPS = {
	...PERSONAL_GRAPH_CHROMATIC_RGB_GLASS_PROPS,
	backgroundOpacity: 0.14,
	borderColor: "var(--ds-border)",
	borderOpacity: 0.72,
	distortionScale: -48,
	dropShadow: false,
	opacity: 0.9,
} satisfies Partial<LiquidGlassProps>;

export function PersonalGraphGlassPanel({
	children,
	className,
	contentClassName,
	glassProps,
	height = "auto",
	radius = 24,
	width = "100%",
}: Readonly<PersonalGraphGlassPanelProps>) {
	return (
		<LiquidGlass
			backgroundOpacity={PERSONAL_GRAPH_GLASS_BACKGROUND_OPACITY}
			blur={5}
			borderColor="var(--ds-border-bold)"
			borderOpacity={0.05}
			borderRadius={radius}
			borderWidth={0.05}
			brightness={50}
			className={cn("text-text [&>div]:p-0", className)}
			dispersion={4}
			displace={3}
			distortionScale={-64}
			dropShadow={PERSONAL_GRAPH_GLASS_SHADOW}
			fallbackBackgroundOpacity={PERSONAL_GRAPH_GLASS_FALLBACK_BACKGROUND_OPACITY}
			height={height}
			opacity={0.88}
			saturation={1.03}
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
	...props
}: Readonly<PersonalGraphLiquidGlassIconButtonProps>) {
	return (
		<LiquidGlassButton
			aria-busy={isLoading || undefined}
			className={cn(
				"size-8 min-w-0 rounded-full border-0 p-0 text-text-subtle shadow-none",
				"hover:bg-transparent active:bg-transparent [&_svg]:text-icon-subtle",
				"disabled:text-text-disabled disabled:opacity-(--opacity-disabled)",
				className,
			)}
			disabled={disabled || isLoading}
			glassProps={{
				...PERSONAL_GRAPH_LIQUID_GLASS_ICON_BUTTON_PROPS,
				...glassProps,
			}}
			hoverArea={28}
			magnetDistance={8}
			pressScale={0.9}
			{...props}
		>
			{isLoading ? <Spinner size="sm" /> : children}
		</LiquidGlassButton>
	);
}
