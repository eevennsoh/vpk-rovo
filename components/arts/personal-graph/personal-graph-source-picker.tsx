"use client";

import { Button } from "@/components/ui/button";
import { resolveWaveHighlightColor } from "@/components/ui-custom/lib/shimmer-colors";
import { TWGLoader } from "@/components/ui-custom/twg-loader";
import { motion, useReducedMotion } from "motion/react";
import { useState } from "react";
import { PixelVaultIcon } from "./personal-graph-pixel-icons";

const TWG_LABEL = "Connect Team Work Graph";

// TWG dot palette (blue -> purple -> orange) sampled per character so the
// soft-blur reveal carries a rainbow gradient on hover.
const TWG_RAINBOW_GRADIENT = ["#1868db", "#bf63f3", "#fca700"] as const;

// "Soft Blur" frames (Pixel Point `animate-text` preset): the rainbow rests
// hidden, blurred, and nudged down; on hover each glyph fades up into place.
// Values mirror the showcase spec in components/visual/text-effects/data.ts.
const SOFT_BLUR_HIDDEN = { opacity: 0, y: 16, filter: "blur(12px)" } as const;
const SOFT_BLUR_SHOWN = { opacity: 1, y: 0, filter: "blur(0px)" } as const;

// Enter is per-glyph staggered for the cascading reveal.
const SOFT_BLUR_ENTER_DURATION = 0.9;
const SOFT_BLUR_ENTER_STAGGER = 0.025;
const SOFT_BLUR_ENTER_EASE = [0.22, 1, 0.36, 1] as const;

// Leave is uniform (no stagger) and quick, so an interrupted reveal always
// settles back the same graceful way regardless of how far it got.
const SOFT_BLUR_LEAVE_DURATION = 0.32;
const SOFT_BLUR_LEAVE_EASE = [0, 0.4, 0, 1] as const;

/**
 * Per-character TWG label with an interruptible rainbow "Soft Blur" reveal.
 *
 * A plain in-flow copy owns layout (the button never reflows). The rainbow is
 * an `absolute inset-0` overlay of the same per-glyph boxes that stays
 * permanently mounted and simply animates between a hidden and a shown frame as
 * `active` toggles. Because the glyphs never unmount, Motion always interpolates
 * each one from its current value — so mousing out mid-reveal reverses smoothly
 * instead of snapping (the failure mode of mount/unmount via `AnimatePresence`).
 */
function TwgRainbowSoftBlur({ active, label }: Readonly<{ active: boolean; label: string }>) {
	const reduced = useReducedMotion();
	const characters = Array.from(label);
	const rainbowFor = (index: number) =>
		resolveWaveHighlightColor(TWG_RAINBOW_GRADIENT, index, characters.length);
	const showRainbow = active && !reduced;

	return (
		<span aria-hidden className="relative inline-flex whitespace-pre">
			{/* Layout owner + default appearance; fades under the rainbow so the
			    rising glyphs don't ghost over the resting copy while active. */}
			<span
				className="inline-flex whitespace-pre transition-opacity duration-normal ease-out"
				style={{ opacity: showRainbow ? 0 : 1 }}
			>
				{characters.map((character, index) => (
					<span key={index} className="inline-block whitespace-pre">
						{character}
					</span>
				))}
			</span>

			<span className="absolute inset-0 inline-flex whitespace-pre">
				{characters.map((character, index) => (
					<motion.span
						key={index}
						className="inline-block whitespace-pre"
						style={{
							color: rainbowFor(index),
							willChange: "opacity, transform, filter",
						}}
						initial={false}
						animate={showRainbow ? SOFT_BLUR_SHOWN : SOFT_BLUR_HIDDEN}
						transition={
							active
								? {
										delay: index * SOFT_BLUR_ENTER_STAGGER,
										duration: SOFT_BLUR_ENTER_DURATION,
										ease: [...SOFT_BLUR_ENTER_EASE],
									}
								: {
										duration: SOFT_BLUR_LEAVE_DURATION,
										ease: [...SOFT_BLUR_LEAVE_EASE],
									}
						}
					>
						{character}
					</motion.span>
				))}
			</span>
		</span>
	);
}

interface PersonalGraphSourcePickerProps {
	isBusy?: boolean;
	onPickTwg: () => void;
	onPickVault: () => void;
}

export function PersonalGraphSourcePicker({
	isBusy = false,
	onPickTwg,
	onPickVault,
}: Readonly<PersonalGraphSourcePickerProps>) {
	const [isTwgHovered, setIsTwgHovered] = useState(false);
	const showTwgRainbow = isTwgHovered && !isBusy;

	return (
		<div className="flex flex-wrap items-center justify-center gap-2">
			<Button
				aria-label="Choose Personal Graph vault folder"
				className="rounded-full border-border bg-surface px-4 text-text shadow-none hover:bg-surface-hovered disabled:border-transparent disabled:bg-bg-disabled disabled:text-text-disabled [&_svg]:text-icon-subtle"
				disabled={isBusy}
				onClick={onPickVault}
				size="sm"
				variant="outline"
			>
				<PixelVaultIcon />
				Choose vault folder
			</Button>
			<Button
				aria-label={TWG_LABEL}
				className="rounded-full border-border bg-surface px-4 text-text shadow-none hover:bg-surface-hovered disabled:border-transparent disabled:bg-bg-disabled disabled:text-text-disabled"
				disabled={isBusy}
				isLoading={isBusy}
				onClick={onPickTwg}
				onMouseEnter={() => setIsTwgHovered(true)}
				onMouseLeave={() => setIsTwgHovered(false)}
				size="sm"
				variant="outline"
			>
				<TWGLoader
					className="shrink-0"
					label=""
					size="small"
				/>
				{/* One always-mounted per-character label drives both states, so the
				    rainbow soft-blur on hover shares the default layout exactly and
				    can never reflow (or nudge) the button. */}
				<TwgRainbowSoftBlur active={showTwgRainbow} label={TWG_LABEL} />
			</Button>
		</div>
	);
}
