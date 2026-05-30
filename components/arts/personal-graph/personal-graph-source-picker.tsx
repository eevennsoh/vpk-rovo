"use client";

import { Button } from "@/components/ui/button";
import { resolveWaveHighlightColor } from "@/components/ui-custom/lib/shimmer-colors";
import { TWGLoader } from "@/components/ui-custom/twg-loader";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useState } from "react";
import { PixelVaultIcon } from "./personal-graph-pixel-icons";

const TWG_LABEL = "Connect Team Work Graph";

// TWG dot palette (blue -> purple -> orange) sampled per character so the
// soft-blur reveal carries a rainbow gradient on hover.
const TWG_RAINBOW_GRADIENT = ["#1868db", "#bf63f3", "#fca700"] as const;

// "Soft Blur" entrance (Pixel Point `animate-text` preset): each glyph fades
// up from below while a gentle blur resolves. Values mirror the showcase spec
// in components/visual/text-effects/data.ts (`soft-blur-in`).
const SOFT_BLUR_DURATION = 0.9;
const SOFT_BLUR_STAGGER = 0.025;
const SOFT_BLUR_EASE = [0.22, 1, 0.36, 1] as const;
const SOFT_BLUR_FROM = { opacity: 0, y: 16, filter: "blur(12px)" } as const;
const SOFT_BLUR_TO = { opacity: 1, y: 0, filter: "blur(0px)" } as const;

// Exit is uniform (no per-glyph stagger) so an interrupted reveal always lands
// the same way: each glyph settles to rest (y 0, blur 0) and softly dissolves,
// revealing the crisp default label underneath. ADS `--ease-out` for the
// "settling into place" feel; short enough to feel responsive on mouse-out.
const SOFT_BLUR_EXIT_DURATION = 0.32;
const SOFT_BLUR_EXIT_EASE = [0, 0.4, 0, 1] as const;
const SOFT_BLUR_EXIT = {
	opacity: 0,
	y: 0,
	filter: "blur(2px)",
	transition: { duration: SOFT_BLUR_EXIT_DURATION, ease: [...SOFT_BLUR_EXIT_EASE] },
} as const;

/**
 * Per-character TWG label with an interruptible rainbow "Soft Blur" reveal.
 *
 * Layout is owned by an always-in-flow plain copy, so the button never reflows.
 * The rainbow lives in an `absolute inset-0` overlay with byte-for-byte
 * identical per-glyph boxes, mounted through `AnimatePresence` so it has a real
 * enter *and* exit. Motion interpolates from each glyph's current value on
 * interruption, so mousing out mid-reveal lands gracefully instead of snapping.
 */
function TwgRainbowSoftBlur({ active, label }: Readonly<{ active: boolean; label: string }>) {
	const reduced = useReducedMotion();
	const characters = Array.from(label);
	const rainbowFor = (index: number) =>
		resolveWaveHighlightColor(TWG_RAINBOW_GRADIENT, index, characters.length);

	return (
		<span aria-hidden className="relative inline-flex whitespace-pre">
			{/* Layout owner + default appearance; fades under the rainbow so the
			    rising glyphs don't ghost over the resting copy while active. */}
			<span
				className="inline-flex whitespace-pre transition-opacity duration-normal ease-out"
				style={{ opacity: active && !reduced ? 0 : 1 }}
			>
				{characters.map((character, index) => (
					<span key={index} className="inline-block whitespace-pre">
						{character}
					</span>
				))}
			</span>

			<AnimatePresence>
				{active ? (
					<motion.span key="rainbow" className="absolute inset-0 inline-flex whitespace-pre">
						{characters.map((character, index) => (
							<motion.span
								key={index}
								className="inline-block whitespace-pre"
								style={{
									color: rainbowFor(index),
									willChange: "opacity, transform, filter",
								}}
								initial={reduced ? false : SOFT_BLUR_FROM}
								animate={SOFT_BLUR_TO}
								exit={reduced ? { opacity: 0 } : SOFT_BLUR_EXIT}
								transition={
									reduced
										? { duration: 0 }
										: {
												delay: index * SOFT_BLUR_STAGGER,
												duration: SOFT_BLUR_DURATION,
												ease: [...SOFT_BLUR_EASE],
											}
								}
							>
								{character}
							</motion.span>
						))}
					</motion.span>
				) : null}
			</AnimatePresence>
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
				className="rounded-full border-border bg-surface px-4 text-text shadow-none hover:bg-surface disabled:border-transparent disabled:bg-bg-disabled disabled:text-text-disabled [&_svg]:text-icon-subtle"
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
				className="rounded-full border-border bg-surface px-4 text-text shadow-none hover:bg-surface disabled:border-transparent disabled:bg-bg-disabled disabled:text-text-disabled"
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
