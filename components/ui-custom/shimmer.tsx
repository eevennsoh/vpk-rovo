"use client";

import type { CSSProperties, ElementType, HTMLAttributes } from "react";

import { cn } from "@/lib/utils";
import { memo } from "react";

export interface ShimmerProps
	extends Omit<HTMLAttributes<HTMLElement>, "children"> {
	children: string;
	as?: ElementType;
	className?: string;
	/** Seconds for one sweep. Omit to use the utility default (2s). */
	duration?: number;
	/**
	 * Highlight band width, as a multiplier of the text length (the resolved
	 * width is `children.length * spread` pixels). Omit to use the utility
	 * default (`3ch + 40px`).
	 */
	spread?: number;
}

/**
 * Gradient sweep across text, for loading and in-progress states.
 *
 * Rendering is the `shimmer` utility from `shadcn/tailwind.css` — pure CSS, no
 * Motion. `duration` and `spread` are overrides: pass neither and the utility's
 * own defaults apply, which also leaves the class modifiers free. Anything the
 * utility exposes can be layered through `className`:
 *
 * ```tsx
 * <Shimmer className="shimmer-color-blue-500/60">Generating…</Shimmer>
 * <Shimmer className="shimmer-angle-45 shimmer-once">Done.</Shimmer>
 * <Shimmer className="md:shimmer-none">Quiet on desktop</Shimmer>
 * ```
 *
 * Reduced motion is handled by the utility itself, which drops the animation
 * and restores the text fill — no guard needed at the call site.
 *
 * For the per-character 3D wave, use `ShimmerWave`. It is a separate component,
 * not a mode of this one; the two share no rendering.
 */
const ShimmerComponent = ({
	children,
	as: Component = "p",
	className,
	duration,
	spread,
	style: styleProp,
	...props
}: ShimmerProps) => {
	const style: CSSProperties = { ...styleProp };

	if (duration !== undefined) {
		(style as Record<string, string>)["--shimmer-duration"] = `${duration}s`;
	}

	if (spread !== undefined) {
		(style as Record<string, string>)["--shimmer-spread"] =
			`${children.length * spread}px`;
	}

	const PolymorphicShimmer = Component as ElementType<
		HTMLAttributes<HTMLElement>
	>;

	return (
		<PolymorphicShimmer
			className={cn("shimmer relative inline-block text-muted-foreground", className)}
			style={style}
			{...props}
		>
			{children}
		</PolymorphicShimmer>
	);
};

export const Shimmer = memo(ShimmerComponent);
