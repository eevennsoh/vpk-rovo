"use client";

import { AnimatePresence, MotionConfig, motion, type Transition } from "motion/react";
import { useState } from "react";

import { DIGIT_DISTANCE, isDigit, reconcileDigitKeys, splitGraphemes } from "./lib";

/**
 * Per-digit number morphing, ported from Calligraph's `NumberRenderer`. The
 * non-digit prefix (currency, sign) stays put; each digit rolls vertically in
 * the direction of the change (up when counting up, down when counting down)
 * with a blur+scale, staggered left-to-right.
 */
export function NumberRenderer({
	text,
	transition,
	stagger,
	animateInitial,
	className,
	style,
}: {
	text: string;
	transition: Transition;
	stagger: number;
	animateInitial: boolean;
	className?: string;
	style?: React.CSSProperties;
}) {
	const chars = splitGraphemes(text);

	const [renderState, setRenderState] = useState(() => ({
		digitKeys: chars.map((_, index) => index),
		direction: 1,
		nextId: chars.length,
		text,
	}));

	if (text !== renderState.text) {
		const result = reconcileDigitKeys(
			renderState.text,
			text,
			renderState.digitKeys,
			renderState.nextId,
		);
		setRenderState({
			digitKeys: result.keys,
			direction: result.direction,
			nextId: result.nextId,
			text,
		});
	}

	const digitKeys = renderState.digitKeys;
	const dir = renderState.direction;
	const prefixLen = (() => {
		const idx = chars.findIndex((c) => isDigit(c));
		return idx === -1 ? chars.length : idx;
	})();

	return (
		<MotionConfig transition={transition}>
			<span
				aria-label={text}
				className={className}
				style={{ display: "inline-flex", position: "relative", ...style }}
			>
				<AnimatePresence mode="popLayout" initial={animateInitial}>
					{chars.map((char, i) => {
						const isPrefix = i < prefixLen;
						const outerKey = isPrefix ? `pre-${i}` : `col-${chars.length - 1 - i}`;
						const delay = i * stagger;

						return (
							<motion.span
								key={outerKey}
								layout="position"
								// Morph changed values, not container reflow during resizing.
								layoutDependency={text}
								initial={isPrefix ? false : { opacity: 0 }}
								animate={isPrefix ? undefined : { opacity: 1 }}
								exit={isPrefix ? undefined : { opacity: 0 }}
								style={{ display: "inline-block", position: "relative" }}
							>
								{isPrefix ? (
									<span style={{ display: "inline-block", whiteSpace: "pre" }}>{char}</span>
								) : (
									<AnimatePresence mode="popLayout" initial={animateInitial} propagate>
										<motion.span
											key={digitKeys[i]}
											aria-hidden="true"
											initial={{
												y: isDigit(char) ? (dir > 0 ? DIGIT_DISTANCE : -DIGIT_DISTANCE) : 0,
												filter: "blur(2px)",
												scale: 0.5,
												opacity: 0,
											}}
											animate={{ y: 0, opacity: 1, filter: "blur(0px)", scale: 1, transition: { delay } }}
											exit={{
												y: isDigit(char) ? (dir > 0 ? -DIGIT_DISTANCE : DIGIT_DISTANCE) : 0,
												opacity: 0,
												filter: "blur(2px)",
												scale: 0.5,
												transition: { delay },
											}}
											style={{ display: "inline-block", whiteSpace: "pre", willChange: "transform, opacity, filter" }}
										>
											{char}
										</motion.span>
									</AnimatePresence>
								)}
							</motion.span>
						);
					})}
				</AnimatePresence>
			</span>
		</MotionConfig>
	);
}
