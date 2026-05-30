"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, type Transition, useReducedMotion } from "motion/react";
import RefreshIcon from "@atlaskit/icon/core/refresh";

import { Button } from "@/components/ui/button";

import { SAMPLE_TEXT, TEXT_EFFECTS, type TextEffectConfig } from "./data";
import { buildPlan, frameToProps, willChangeFor } from "./lib";

type TextEffectsProps = Readonly<{
	config: TextEffectConfig;
	text?: string;
}>;

export default function TextEffects({ config, text = SAMPLE_TEXT }: TextEffectsProps) {
	const spec = TEXT_EFFECTS[config.effect];
	const reduced = useReducedMotion();

	// Bumping the cycle remounts the animated subtree, replaying initial -> animate.
	const [cycle, setCycle] = useState(0);
	const replay = useCallback(() => setCycle((current) => current + 1), []);

	// `whole` effects animate the entire passage as one unit, ignoring splitBy.
	const isWhole = spec.target === "whole";
	const plan = useMemo(
		() => (isWhole ? null : buildPlan(text, config.splitBy, spec.staggerMode)),
		[isWhole, text, config.splitBy, spec.staggerMode],
	);

	const fromProps = useMemo(() => frameToProps(spec.from), [spec]);
	const toProps = useMemo(() => frameToProps(spec.to), [spec]);
	const willChange = useMemo(() => willChangeFor(spec.from, spec.to), [spec]);

	// `steps(1, end)` reveal: opacity holds, then snaps at the very end of the unit.
	const animateTo = useMemo(() => {
		if (!spec.stepped) return toProps;
		const start = spec.from.opacity ?? 0;
		const end = spec.to.opacity ?? 1;
		return { ...toProps, opacity: [start, start, end] };
	}, [spec, toProps]);

	const unitCount = isWhole ? 1 : (plan?.count ?? 1);
	const totalMs = config.durationMs + Math.max(0, unitCount - 1) * config.staggerMs;

	// Remounting the animated subtree replays initial -> animate. `cycle` covers
	// the Replay button and auto-loop; folding in the config makes any control
	// change (effect, split, duration, stagger, loop) replay immediately too.
	const animationKey = `${cycle}:${config.effect}:${config.splitBy}:${config.durationMs}:${config.staggerMs}:${config.autoLoop}:${config.loopDelay}`;

	useEffect(() => {
		if (reduced || !config.autoLoop) return;
		const timer = setTimeout(replay, totalMs + config.loopDelay * 1000);
		return () => clearTimeout(timer);
	}, [cycle, reduced, config.autoLoop, config.loopDelay, totalMs, replay]);

	const transitionFor = (slot: number): Transition => {
		const delay = Math.max(0, slot) * (config.staggerMs / 1000);
		const duration = config.durationMs / 1000;
		if (spec.stepped) {
			return { duration, delay, ease: "linear", times: [0, 0.99, 1] };
		}
		return { duration, delay, ease: [...spec.easing] as [number, number, number, number] };
	};

	return (
		<div className="flex w-full flex-col items-center gap-8">
			<div
				className="text-center text-3xl font-semibold leading-tight tracking-tight text-text sm:text-5xl"
				style={{ maxWidth: "18ch" }}
				lang="en"
			>
				{/* Screen readers get the whole passage; the split/animated glyphs are decorative. */}
				<span className="sr-only">{text}</span>
				{reduced ? (
					<span aria-hidden style={{ whiteSpace: "pre-line" }}>
						{text}
					</span>
				) : (
					<span key={animationKey} aria-hidden>
						{isWhole ? (
							<motion.span
								style={{ display: "inline-block", whiteSpace: "pre-line", willChange }}
								initial={fromProps}
								animate={animateTo}
								transition={transitionFor(0)}
							>
								{text}
							</motion.span>
						) : (
							plan?.lines.map((tokens, lineIndex) => (
								<span key={lineIndex} className="block">
									{tokens.map((token, tokenIndex) =>
										token.animate ? (
											<motion.span
												key={tokenIndex}
												style={{ display: "inline-block", whiteSpace: "pre", willChange }}
												initial={fromProps}
												animate={animateTo}
												transition={transitionFor(token.slot)}
											>
												{token.text}
											</motion.span>
										) : (
											<span key={tokenIndex} style={{ whiteSpace: "pre" }}>
												{token.text}
											</span>
										),
									)}
								</span>
							))
						)}
					</span>
				)}
			</div>
			<Button variant="secondary" onClick={replay} disabled={Boolean(reduced)}>
				<RefreshIcon label="" size="small" />
				Replay
			</Button>
		</div>
	);
}
