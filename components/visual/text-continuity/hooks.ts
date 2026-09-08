"use client";

/**
 * Timing and animation hooks shared by the Text Continuity examples. Ported
 * from torph's demo surface (https://github.com/lochie/torph, MIT), with
 * `usePrefersReducedMotion` swapped for Motion's `useReducedMotion` — the
 * repo convention.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";

/**
 * Advance through `length` values every `interval` ms.
 *
 * Reduced motion holds at index 0, so every sequence rests on a readable value
 * rather than cycling invisibly. torph itself already skips the morph under
 * reduced motion; this stops the *value* from changing at all.
 */
export function useCycle(length: number, interval: number): number {
	const [index, setIndex] = useState(0);
	const reduced = useReducedMotion();

	useEffect(() => {
		if (reduced) return;
		const id = window.setInterval(() => setIndex((i) => (i + 1) % length), interval);
		return () => window.clearInterval(id);
	}, [length, interval, reduced]);

	return reduced ? 0 : index;
}

const FRAME = 1000 / 60;

export type MotionLoop = {
	/** One fixed step. Returning `false` parks the loop until the next `wake()`. */
	step: () => boolean;
	paint: () => void;
};

/**
 * A fixed-step animation loop that parks itself when nothing is moving.
 *
 * Fixed-step so a 120Hz display integrates identically to a 60Hz one, and
 * parked between gestures rather than holding a rAF loop open for a demo at
 * rest — which matters here because the gallery mounts a lot of these at once.
 *
 * Returns a `wake()` to restart it. `setup` runs once on mount, so anything it
 * closes over that changes must live in a ref.
 */
export function useMotionLoop(setup: () => MotionLoop | null): () => void {
	const setupRef = useRef(setup);
	const wakeRef = useRef<() => void>(() => {});

	useEffect(() => {
		const loop = setupRef.current();
		if (!loop) return;

		let raf = 0;
		let last = 0;
		let acc = 0;
		let moving = true;

		const frame = (now: number) => {
			acc = Math.min(acc + (now - last), 120);
			last = now;

			while (acc >= FRAME) {
				moving = loop.step();
				acc -= FRAME;
			}

			loop.paint();
			raf = moving ? requestAnimationFrame(frame) : 0;
		};

		wakeRef.current = () => {
			moving = true;
			if (raf) return;
			last = performance.now();
			acc = 0;
			raf = requestAnimationFrame(frame);
		};

		wakeRef.current();

		return () => {
			wakeRef.current = () => {};
			if (raf) cancelAnimationFrame(raf);
		};
	}, []);

	return useCallback(() => wakeRef.current(), []);
}
