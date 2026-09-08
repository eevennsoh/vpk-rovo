"use client";

/**
 * Number examples — values where place-value matching is the whole point.
 * Ported from torph's `numbers.tsx` (https://github.com/lochie/torph, MIT).
 */

import { useEffect, useState } from "react";
import { useReducedMotion } from "motion/react";

import TextContinuity from "..";
import { SETTLE_SPRING } from "../data";
import { useCycle } from "../hooks";
import { Badge, Caption, SplitItem, Stage } from "./primitives";

/** U+2212, not a hyphen — it is the width of the plus it replaces. */
const DELTAS = ["+2.4%", "−0.8%", "+11.2%", "0.0%", "−13.6%"];

/** A signed percentage: the sign is its own segment, so it swaps in place. */
export function Delta() {
	const index = useCycle(DELTAS.length, 1600);
	const value = DELTAS[index]!;
	const tone = value.startsWith("−") ? "text-text-danger" : value.startsWith("+") ? "text-text-success" : "text-text";

	return (
		<Badge className={tone}>
			<TextContinuity ease={SETTLE_SPRING}>{value}</TextContinuity>
		</Badge>
	);
}

const DIMENSIONS = ["320 × 240", "640 × 480", "1280 × 720", "1920 × 1080"];

/** Two numbers around a fixed separator, each resizing independently. */
export function Dimensions() {
	const index = useCycle(DIMENSIONS.length, 1600);

	return (
		<Stage tabular>
			<TextContinuity ease={SETTLE_SPRING}>{DIMENSIONS[index]!}</TextContinuity>
		</Stage>
	);
}

// Fixed, so the server and the first client paint agree; accrual is client-only.
const DEPOSIT = 1204.42172398;
const APY = 0.0418;
const PER_SECOND = (DEPOSIT * APY) / 31_536_000;

const money = (value: number) =>
	value.toLocaleString("en", {
		// Eight fraction digits, because a per-second rate is invisible at two.
		minimumFractionDigits: 8,
		maximumFractionDigits: 8,
	});

/** Eight fraction digits accruing every second — only the low places move. */
export function Earned() {
	const [earned, setEarned] = useState(0);
	const reduced = useReducedMotion();

	useEffect(() => {
		if (reduced) return;
		const started = Date.now();
		const id = window.setInterval(() => setEarned(((Date.now() - started) / 1000) * PER_SECOND), 120);
		return () => window.clearInterval(id);
	}, [reduced]);

	return (
		<SplitItem>
			<Stage tabular>
				<TextContinuity ease={SETTLE_SPRING}>{`$${money(DEPOSIT + earned)}`}</TextContinuity>
			</Stage>
			<Caption>4.18% APY · accruing every second</Caption>
		</SplitItem>
	);
}
