"use client";

/**
 * A split you drag — one budget divided between two sides, both figures moving
 * against each other. Ported from torph's `matter.tsx`
 * (https://github.com/lochie/torph, MIT). Haptics calls omitted.
 */

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";

import { cn } from "@/lib/utils";

import TextContinuity from "..";
import { useMotionLoop } from "../hooks";
import { clamp } from "../lib";
import { FOCUS_RING } from "./primitives";

const BUDGET = 1000;

const SPLIT_MIN = 0.14;
const SPLIT_STIFFNESS = 0.24;
const SPLIT_DAMPING = 0.56;
const SPLIT_EVERY = 2600;
const SPLITS = [0.64, 0.28, 0.5, 0.83];

const SPLIT_VALUE_CLASS = "text-[1.375rem] font-bold tabular-nums whitespace-nowrap";

export function SplitBar() {
	const [split, setSplit] = useState(SPLITS[0]!);
	const [taken, setTaken] = useState(false);
	const reduced = useReducedMotion();

	const barRef = useRef<HTMLDivElement>(null);
	const leftRef = useRef<HTMLDivElement>(null);
	const rightRef = useRef<HTMLDivElement>(null);

	const state = useRef({
		split: SPLITS[0]!,
		vel: 0,
		target: SPLITS[0]!,
		grabbed: false,
		shown: SPLITS[0]!,
		step: 0,
	});

	const wake = useMotionLoop(() => {
		const left = leftRef.current;
		const right = rightRef.current;
		if (!left || !right) return null;
		const s = state.current;

		return {
			step: () => {
				if (s.grabbed) return true;
				s.vel = (s.vel + (s.target - s.split) * SPLIT_STIFFNESS) * SPLIT_DAMPING;
				s.split += s.vel;
				if (Math.abs(s.vel) < 0.0004 && Math.abs(s.target - s.split) < 0.001) {
					s.split = s.target;
					s.vel = 0;
					return false;
				}
				return true;
			},
			paint: () => {
				s.split = clamp(s.split, SPLIT_MIN, 1 - SPLIT_MIN);
				left.style.flexGrow = `${s.split}`;
				right.style.flexGrow = `${1 - s.split}`;

				const next = Math.round(s.split * 100) / 100;
				if (next === s.shown) return;
				s.shown = next;
				setSplit(next);
			},
		};
	});

	useEffect(() => {
		if (taken || reduced) return;
		const id = window.setInterval(() => {
			const s = state.current;
			s.step += 1;
			s.target = SPLITS[s.step % SPLITS.length]!;
			wake();
		}, SPLIT_EVERY);
		return () => window.clearInterval(id);
	}, [taken, reduced, wake]);

	const release = () => {
		const s = state.current;
		if (!s.grabbed) return;
		s.grabbed = false;
		s.target = s.split;
		wake();
	};

	const left = Math.round(BUDGET * split);

	return (
		<div className="flex h-16 w-full max-w-88 items-stretch" ref={barRef}>
			<div
				className="flex items-center justify-start overflow-hidden rounded-l-xl bg-primary px-3.5"
				ref={leftRef}
			>
				<TextContinuity className={cn(SPLIT_VALUE_CLASS, "text-primary-foreground")}>
					{`$${left.toLocaleString("en")}`}
				</TextContinuity>
			</div>

			<span
				className={cn(
					"relative w-3 flex-none cursor-col-resize touch-none bg-surface-sunken",
					"after:absolute after:left-1/2 after:top-1/2 after:h-6 after:w-0.5 after:-translate-x-1/2 after:-translate-y-1/2 after:rounded-full after:bg-icon-subtlest after:content-['']",
					FOCUS_RING,
				)}
				role="slider"
				tabIndex={0}
				aria-label="Split"
				aria-valuemin={0}
				aria-valuemax={BUDGET}
				aria-valuenow={left}
				aria-valuetext={`$${left.toLocaleString("en")} of $${BUDGET.toLocaleString("en")}`}
				onKeyDown={(event) => {
					const step = event.key === "ArrowLeft" ? -0.04 : event.key === "ArrowRight" ? 0.04 : 0;
					if (!step) return;
					event.preventDefault();
					const s = state.current;
					setTaken(true);
					s.target = clamp(s.target + step, SPLIT_MIN, 1 - SPLIT_MIN);
					wake();
				}}
				onPointerDown={(event) => {
					event.currentTarget.setPointerCapture(event.pointerId);
					setTaken(true);
					state.current.grabbed = true;
					wake();
				}}
				onPointerMove={(event) => {
					const bar = barRef.current;
					const s = state.current;
					if (!bar || !s.grabbed) return;
					const rect = bar.getBoundingClientRect();
					s.split = clamp((event.clientX - rect.left) / rect.width, SPLIT_MIN, 1 - SPLIT_MIN);
				}}
				onPointerUp={release}
				onPointerCancel={release}
			/>

			<div
				className="flex items-center justify-end overflow-hidden rounded-r-xl bg-bg-neutral px-3.5"
				ref={rightRef}
			>
				<TextContinuity className={cn(SPLIT_VALUE_CLASS, "text-text")}>
					{`$${(BUDGET - left).toLocaleString("en")}`}
				</TextContinuity>
			</div>
		</div>
	);
}
