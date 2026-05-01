"use client";

import type { ReactNode } from "react";
import LiquidGlass from "@/components/website/demos/visual/shaders/liquid-glass";
import { cn } from "@/lib/utils";

interface PersonalGraphGlassPanelProps {
	children: ReactNode;
	className?: string;
	contentClassName?: string;
	height?: number | string;
	radius?: number;
	width?: number | string;
}

const PERSONAL_GRAPH_GLASS_SHADOW = "0 28px 80px -44px color-mix(in srgb, var(--ds-text) 54%, transparent)";

export function PersonalGraphGlassPanel({
	children,
	className,
	contentClassName,
	height = "auto",
	radius = 24,
	width = "100%",
}: Readonly<PersonalGraphGlassPanelProps>) {
	return (
		<LiquidGlass
			backgroundOpacity={0.012}
			blur={8}
			borderColor="var(--ds-border-bold)"
			borderOpacity={0.13}
			borderRadius={radius}
			borderWidth={0.05}
			brightness={68}
			className={cn("text-text", className)}
			dispersion={8}
			displace={7}
			distortionScale={-118}
			dropShadow={PERSONAL_GRAPH_GLASS_SHADOW}
			fallbackBackgroundOpacity={0.055}
			height={height}
			opacity={0.78}
			saturation={1.18}
			width={width}
		>
			<div className={cn("h-full w-full", contentClassName)}>{children}</div>
		</LiquidGlass>
	);
}
