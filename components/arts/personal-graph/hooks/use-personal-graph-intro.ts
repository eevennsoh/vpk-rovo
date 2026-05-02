"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "motion/react";

import {
	getPersonalGraphIntroPhaseAt,
	PERSONAL_GRAPH_INTRO_TIMELINE,
	type PersonalGraphIntroPhase,
} from "./intro-phase";

interface UsePersonalGraphIntroResult {
	phase: PersonalGraphIntroPhase;
	isReducedMotion: boolean;
}

export function usePersonalGraphIntro(): UsePersonalGraphIntroResult {
	const prefersReducedMotion = useReducedMotion() ?? false;
	const [phase, setPhase] = useState<PersonalGraphIntroPhase>("title");

	useEffect(() => {
		if (prefersReducedMotion) {
			setPhase(getPersonalGraphIntroPhaseAt(0, prefersReducedMotion));
			return;
		}

		const timeouts: ReturnType<typeof setTimeout>[] = [];
		for (const step of PERSONAL_GRAPH_INTRO_TIMELINE) {
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
