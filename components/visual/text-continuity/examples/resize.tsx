"use client";

/**
 * A frame you narrow until the sentence rewraps mid-morph. Ported from torph's
 * `resize.tsx` (https://github.com/lochie/torph, MIT).
 */

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";

import TextContinuity from "..";
import { wrap } from "../lib";
import { ResizeFrame } from "./primitives";

const BODY = "Drag the handle to rewrap this sentence.";

// Content widths — the frame's cell is content-box, so padding is already out.
const MIN = 68;
const MAX = 208;

// Each stop is a width at which the text wraps differently.
const STOPS = [MAX, 140, MIN, 140];

const TEXT_CLASS = "text-left text-[0.8125rem] font-medium leading-relaxed text-text";

export function Resize() {
	const [width, setWidth] = useState(MAX);
	const [taken, setTaken] = useState(false);
	const [charWidth, setCharWidth] = useState(6.6);
	const reduced = useReducedMotion();

	const rulerRef = useRef<HTMLSpanElement>(null);

	// Measured, so the wrap stays conservative enough never to outrun the box.
	useLayoutEffect(() => {
		const ruler = rulerRef.current;
		if (ruler) setCharWidth(ruler.getBoundingClientRect().width / BODY.length);
	}, []);

	useEffect(() => {
		if (taken || reduced) return;
		let step = 0;
		const id = window.setInterval(() => {
			step += 1;
			setWidth(STOPS[step % STOPS.length]!);
		}, 1900);
		return () => window.clearInterval(id);
	}, [taken, reduced]);

	const maxChars = Math.max(8, Math.floor(width / charWidth));

	return (
		<ResizeFrame
			className="h-auto"
			cellClassName="px-3.5 py-3"
			label="Frame width"
			valueMin={MIN}
			valueMax={MAX}
			valueNow={width}
			keyStep={16}
			getWidth={() => width}
			onGrab={() => setTaken(true)}
			onResize={(next) => {
				setTaken(true);
				setWidth(Math.round(Math.min(MAX, Math.max(MIN, next))));
			}}
			cellStyle={{
				width,
				// Held off while dragging, or the frame lags the pointer.
				transition: `width ${taken ? 0 : 400}ms cubic-bezier(0.19, 1, 0.22, 1)`,
			}}
		>
			<TextContinuity className={TEXT_CLASS}>{wrap(BODY, maxChars)}</TextContinuity>

			{/* Off-flow copy of the same string in the same font, measured once. */}
			<span
				ref={rulerRef}
				aria-hidden
				className={`${TEXT_CLASS} pointer-events-none invisible absolute whitespace-pre`}
			>
				{BODY}
			</span>
		</ResizeFrame>
	);
}
