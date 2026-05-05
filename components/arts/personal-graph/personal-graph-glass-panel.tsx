"use client";

import type { ReactNode } from "react";
import LiquidGlass, {
	type LiquidGlassProps,
} from "@/components/website/demos/visual/shaders/liquid-glass";
import { cn } from "@/lib/utils";

type PersonalGraphGlassTuningProps = Partial<
	Omit<LiquidGlassProps, "children" | "className" | "height" | "style" | "width">
>;

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
