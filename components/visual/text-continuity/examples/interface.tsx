"use client";

/**
 * Interface examples — controls and surfaces whose label changes length as their
 * state changes. Ported from torph's `interface.tsx`
 * (https://github.com/lochie/torph, MIT).
 */

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import TextContinuity from "..";
import { SETTLE_SPRING } from "../data";
import { useCycle } from "../hooks";
import { wrap } from "../lib";
import { Chip, Stage } from "./primitives";

const FILTERS = ["All Markets", "Markets (1)", "Markets (2)", "Markets (3)"];

/** A count appearing inside a label that was previously a word. */
export function Filters() {
	const index = useCycle(FILTERS.length, 1500);

	return (
		<Chip>
			<TextContinuity>{FILTERS[index]!}</TextContinuity>
		</Chip>
	);
}

const WALLET = ["Connect wallet", "Connecting…", "0xd55a…d2685", "lochie.eth"];

/** A control whose label changes length at every step, with an avatar joining late. */
export function Wallet() {
	const index = useCycle(WALLET.length, 1800);

	return (
		<Chip>
			{/*
			 * `layout` + `mode="popLayout"` rather than animating the avatar's width:
			 * the exiting element pops out of flow immediately and Motion projects the
			 * row's size change as a transform, so the chip still shrinks around the
			 * avatar without the browser redoing layout every frame.
			 */}
			<motion.div layout className="flex items-center">
				<AnimatePresence initial={false} mode="popLayout">
					{index >= 2 ? (
						<motion.span
							key="avatar"
							layout
							aria-hidden
							className="mr-2 block size-5 shrink-0 rounded-full bg-bg-brand-boldest"
							initial={{ opacity: 0, scale: 0.5 }}
							animate={{ opacity: 1, scale: 1 }}
							exit={{ opacity: 0, scale: 0.5 }}
							transition={{ duration: 0.2 }}
							style={{ willChange: "opacity, transform" }}
						/>
					) : null}
				</AnimatePresence>
				<TextContinuity>{WALLET[index]!}</TextContinuity>
			</motion.div>
		</Chip>
	);
}

const RESULTS = [
	{ shown: 24, total: 1208 },
	{ shown: 24, total: 986 },
	{ shown: 12, total: 986 },
	{ shown: 12, total: 47 },
];

/** Two counts inside a sentence, each rolling on its own place value. */
export function ResultsSummary() {
	const index = useCycle(RESULTS.length, 2000);
	const { shown, total } = RESULTS[index]!;

	return (
		<Stage size="small">
			<TextContinuity ease={SETTLE_SPRING}>
				{`Showing ${shown} of ${total.toLocaleString("en")} results`}
			</TextContinuity>
		</Stage>
	);
}

const DOWNLOAD_RUN = 2000;
const DOWNLOAD_TICK = 100;

const easeInQuad = (t: number) => t * t;

type DownloadPhase = "idle" | "downloading" | "done";

const NEXT_PHASE: Record<Exclude<DownloadPhase, "downloading">, [DownloadPhase, number]> = {
	idle: ["downloading", 900],
	done: ["idle", 1600],
};

/** A percentage that becomes a word when it finishes — digits, then letters. */
export function Download() {
	const [phase, setPhase] = useState<DownloadPhase>("idle");
	const [progress, setProgress] = useState(0);
	const reduced = useReducedMotion();

	useEffect(() => {
		if (reduced) return;

		if (phase !== "downloading") {
			const [next, delay] = NEXT_PHASE[phase];
			const timer = window.setTimeout(() => {
				if (next === "idle") setProgress(0);
				setPhase(next);
			}, delay);
			return () => window.clearTimeout(timer);
		}

		const started = Date.now();
		const id = window.setInterval(() => {
			const t = Math.min(1, (Date.now() - started) / DOWNLOAD_RUN);
			setProgress(easeInQuad(t) * 100);
			if (t === 1) setPhase("done");
		}, DOWNLOAD_TICK);
		return () => window.clearInterval(id);
	}, [phase, reduced]);

	const label = phase === "idle" ? "Download" : phase === "done" ? "Downloaded" : `${Math.round(progress)}%`;
	const filled = phase === "done" ? 100 : phase === "downloading" ? progress : 0;

	return (
		<div className="flex w-full max-w-60 flex-col items-center gap-4.5">
			<Chip className="tabular-nums">
				<TextContinuity duration={300} ease="cubic-bezier(0.41, 1.03, 0.6, 1.03)">
					{label}
				</TextContinuity>
			</Chip>

			<div aria-hidden className="h-1 w-full overflow-hidden rounded-full bg-bg-neutral">
				<div
					className="h-full rounded-[inherit] bg-bg-neutral-bold transition-[width] ease-linear motion-reduce:transition-none"
					style={{
						width: `${filled}%`,
						// Emptying for the next run should be instant, not a drain backwards.
						transitionDuration: phase === "downloading" ? `${DOWNLOAD_TICK}ms` : "0ms",
					}}
				/>
			</div>
		</div>
	);
}

const STREAM =
	"The capital of Australia is Canberra, which sits in the Australian Capital Territory between Sydney and Melbourne. It was chosen in 1908 as a compromise between the two rival cities, and Walter Burley Griffin and Marion Mahony Griffin won the competition to design it. Their plan set the city around a lake and a grid of axes and circles, and today it holds Parliament House, the High Court, and the National Gallery.";
const STREAM_WORDS = STREAM.split(" ");

const STREAM_MS = 110;
const STREAM_HOLD = 2400; // Beat on the finished passage before it starts over

/** A passage arriving word by word — each update lands on the morph before it. */
export function Streaming() {
	const [count, setCount] = useState(1);
	const reduced = useReducedMotion();

	useEffect(() => {
		if (reduced) return;
		const done = count >= STREAM_WORDS.length;
		const timer = window.setTimeout(() => setCount((n) => (done ? 1 : n + 1)), done ? STREAM_HOLD : STREAM_MS);
		return () => window.clearTimeout(timer);
	}, [count, reduced]);

	const shown = reduced ? STREAM_WORDS.length : count;

	return (
		<div
			className="flex h-40 w-full max-w-56 items-end text-left text-[0.9375rem] font-medium leading-relaxed text-text"
			style={{ maskImage: "linear-gradient(to bottom, transparent, #000 3rem)" }}
		>
			<TextContinuity>{wrap(STREAM_WORDS.slice(0, shown).join(" "), 28)}</TextContinuity>
		</div>
	);
}
