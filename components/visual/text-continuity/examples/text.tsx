"use client";

/**
 * Text examples — values whose characters change without a numeric structure to
 * exploit. Ported from torph's `text.tsx` (https://github.com/lochie/torph, MIT).
 */

import { useState } from "react";

import TextContinuity from "..";
import { useCycle } from "../hooks";
import { Split, SplitItem, Stage } from "./primitives";

const INSTALL = ["npm i torph", "pnpm add torph", "yarn add torph", "bun add torph"];

/** Four package managers over one command: the shared suffix never moves. */
export function Install() {
	const index = useCycle(INSTALL.length, 1600);

	return (
		<Stage size="small" mono>
			<span className="select-none text-text-subtlest">$ </span>
			<TextContinuity>{INSTALL[index]!}</TextContinuity>
		</Stage>
	);
}

const VERSIONS = ["v1.2.3", "v1.3.0", "v2.0.0", "v2.0.1"];

/** A semver bump: only the places that actually changed move. */
export function Versions() {
	const index = useCycle(VERSIONS.length, 1400);

	return (
		<Stage mono>
			<TextContinuity>{VERSIONS[index]!}</TextContinuity>
		</Stage>
	);
}

const GLUED = ["819K", "990K", "9.9M", "19.4M"];
const SPACED = ["910 KB", "1.2 MB", "12 MB", "1.25 GB"];

/** A unit glued to its figure, and one spaced away from it — matched differently. */
export function Units() {
	const index = useCycle(4, 1600);

	return (
		<Split>
			<SplitItem>
				<Stage>
					<TextContinuity>{GLUED[index]!}</TextContinuity>
				</Stage>
			</SplitItem>
			<span aria-hidden className="text-text-subtlest">
				–
			</span>
			<SplitItem>
				<Stage>
					<TextContinuity>{SPACED[index]!}</TextContinuity>
				</Stage>
			</SplitItem>
		</Split>
	);
}

/** Fixed saturation and lightness, so picking a swatch moves hue alone. */
function hex(hue: number): string {
	const channel = (n: number) => {
		const k = (n + hue / 30) % 12;
		const c = 0.5 - 0.35 * Math.max(-1, Math.min(k - 3, 9 - k, 1));
		return Math.round(c * 255)
			.toString(16)
			.toUpperCase()
			.padStart(2, "0");
	};

	return `#${channel(0)}${channel(8)}${channel(4)}`;
}

/** Six characters where any of them can change independently of the rest. */
export function HexColour() {
	const [hue, setHue] = useState(0);
	const value = hex(hue);

	return (
		<div className="flex w-full flex-col items-center gap-5">
			<div className="flex items-center gap-3 font-mono text-2xl leading-snug transition-colors duration-fast motion-reduce:transition-none" style={{ color: value }}>
				<TextContinuity>{value}</TextContinuity>
			</div>

			<div className="grid grid-cols-4 gap-2">
				{Array.from({ length: 12 }, (_, i) => i * 30).map((h) => (
					<button
						key={h}
						type="button"
						aria-label={`Hue ${h} degrees`}
						aria-pressed={hue === h}
						className="size-7 rounded-lg outline-2 outline-offset-2 outline-transparent transition-all duration-fast ease-out-practical active:scale-96 aria-pressed:outline-border-bold motion-reduce:transition-none"
						style={{ background: hex(h) }}
						onClick={() => setHue(h)}
					/>
				))}
			</div>
		</div>
	);
}

const CURRENCIES = ["$99.00", "€99.00", "£99.00", "¥99.00"];

/** The symbol changes and the amount holds still — the symbol is its own segment. */
export function CurrencySwap() {
	const index = useCycle(CURRENCIES.length, 1400);

	return (
		<Stage size="large">
			<TextContinuity>{CURRENCIES[index]!}</TextContinuity>
		</Stage>
	);
}
