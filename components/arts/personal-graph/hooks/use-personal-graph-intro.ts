"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "motion/react";

export type PersonalGraphIntroPhase =
	| "title"
	| "subtext"
	| "controls"
	| "settle"
	| "search"
	| "graph"
	| "done";

interface PhaseStep {
	phase: PersonalGraphIntroPhase;
	at: number;
}

const PHASE_TIMELINE: ReadonlyArray<PhaseStep> = [
	{ phase: "title", at: 0 },
	{ phase: "subtext", at: 500 },
	{ phase: "controls", at: 900 },
	{ phase: "settle", at: 1700 },
	{ phase: "search", at: 2000 },
	{ phase: "graph", at: 2400 },
	{ phase: "done", at: 3700 },
];

interface UsePersonalGraphIntroResult {
	phase: PersonalGraphIntroPhase;
	isReducedMotion: boolean;
}

export function usePersonalGraphIntro(): UsePersonalGraphIntroResult {
	const prefersReducedMotion = useReducedMotion() ?? false;
	const [phase, setPhase] = useState<PersonalGraphIntroPhase>("title");

	useEffect(() => {
		if (prefersReducedMotion) {
			setPhase("done");
			return;
		}

		const timeouts: ReturnType<typeof setTimeout>[] = [];
		for (const step of PHASE_TIMELINE) {
			if (step.at === 0) {
				setPhase(step.phase);
				continue;
			}
			timeouts.push(
				setTimeout(() => {
					setPhase(step.phase);
				}, step.at),
			);
		}

		return () => {
			for (const id of timeouts) {
				clearTimeout(id);
			}
		};
	}, [prefersReducedMotion]);

	return { phase, isReducedMotion: prefersReducedMotion };
}
