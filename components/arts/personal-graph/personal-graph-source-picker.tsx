"use client";

import { Button } from "@/components/ui/button";
import { resolveWaveHighlightColor } from "@/components/ui-custom/lib/shimmer-colors";
import { TWGLoader } from "@/components/ui-custom/twg-loader";
import { motion, useReducedMotion, type Transition } from "motion/react";
import { useState } from "react";
import { PixelVaultIcon } from "./personal-graph-pixel-icons";

const TWG_LABEL = "Connect Team Work Graph";

// TWG dot palette (blue -> purple -> orange) sampled per character so the
// soft-blur reveal carries a rainbow gradient on hover.
const TWG_RAINBOW_GRADIENT = ["#1868db", "#bf63f3", "#fca700"] as const;

// "Soft Blur" frames: the rainbow only fades + blurs, no vertical travel. Keeping
// HIDDEN and SHOWN symmetric (opacity + filter only) means Motion just interpolates
// from each glyph's current value in either direction — fully deterministic on
// rapid hover in/out, with no stateful reset that could race.
const SOFT_BLUR_HIDDEN = { opacity: 0, filter: "blur(12px)" } as const;
const SOFT_BLUR_SHOWN = { opacity: 1, filter: "blur(0px)" } as const;

// Enter is per-glyph staggered for the cascading reveal.
const SOFT_BLUR_ENTER_DURATION = 0.6;
const SOFT_BLUR_ENTER_STAGGER = 0.02;
const SOFT_BLUR_ENTER_EASE = [0.22, 1, 0.36, 1] as const;

// Leave is uniform (no stagger) and slow + gentle, so the rainbow gradient drifts
// back to blur instead of snapping. The rainbow glyphs AND the resting copy share
// this one clock, so they cross-fade as a single motion.
const SOFT_BLUR_LEAVE_DURATION = 0.7;
const SOFT_BLUR_LEAVE_EASE = [0.22, 1, 0.36, 1] as const;

// On hover-in the resting copy ducks out quickly so the rising rainbow owns the
// frame; on hover-out it fades back in on the shared leave clock above.
const RESTING_COPY_ENTER_DURATION = 0.12;

/**
 * Per-character TWG label with an interruptible rainbow "Soft Blur" reveal.
 *
 * A plain in-flow copy owns layout (the button never reflows). The rainbow is
 * an `absolute inset-0` overlay of the same per-glyph boxes that stays
 * permanently mounted and simply animates between a hidden and a shown frame as
 * `active` toggles. The frames differ only in opacity + blur (no transform), so
 * Motion always interpolates each glyph from its current value in either
 * direction — mousing in/out mid-reveal reverses smoothly and behaves the same
 * no matter how rapidly it's toggled (no stateful reset to race).
 */
function TwgRainbowSoftBlur({ active, label }: Readonly<{ active: boolean; label: string }>) {
	const reduced = useReducedMotion();
	const characters = Array.from(label);
	const rainbowFor = (index: number) =>
		resolveWaveHighlightColor(TWG_RAINBOW_GRADIENT, index, characters.length);
	const showRainbow = active && !reduced;
	const leaveTransition: Transition = {
		duration: SOFT_BLUR_LEAVE_DURATION,
		ease: [...SOFT_BLUR_LEAVE_EASE],
	};

	return (
		<span aria-hidden className="pointer-events-none relative inline-flex whitespace-pre">
			{/* Layout owner + default appearance; fades under the rainbow so the
			    glyphs don't ghost over the resting copy while active. Shares the
			    rainbow's leave clock on hover-out so both cross-fade as one. */}
			<motion.span
				className="inline-flex whitespace-pre"
				style={{ willChange: "opacity" }}
				initial={false}
				animate={{ opacity: showRainbow ? 0 : 1 }}
				transition={
					showRainbow
						? { duration: RESTING_COPY_ENTER_DURATION, ease: [...SOFT_BLUR_ENTER_EASE] }
						: leaveTransition
				}
			>
				{characters.map((character, index) => (
					<span key={index} className="inline-block whitespace-pre">
						{character}
					</span>
				))}
			</motion.span>

			<span className="absolute inset-0 inline-flex whitespace-pre">
				{characters.map((character, index) => (
					<motion.span
						key={index}
						className="inline-block whitespace-pre"
						style={{
							color: rainbowFor(index),
							willChange: "opacity, filter",
						}}
						initial={false}
						animate={showRainbow ? SOFT_BLUR_SHOWN : SOFT_BLUR_HIDDEN}
						transition={
							showRainbow
								? {
										delay: index * SOFT_BLUR_ENTER_STAGGER,
										duration: SOFT_BLUR_ENTER_DURATION,
										ease: [...SOFT_BLUR_ENTER_EASE],
									}
								: leaveTransition
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
				className="overflow-hidden rounded-full border-border bg-surface px-4 text-text shadow-none hover:bg-surface-hovered disabled:border-transparent disabled:bg-bg-disabled disabled:text-text-disabled"
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
