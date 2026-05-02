export type PersonalGraphIntroPhase =
	| "title"
	| "subtext"
	| "controls"
	| "settle"
	| "search"
	| "graph"
	| "done";

export interface PersonalGraphIntroPhaseStep {
	phase: PersonalGraphIntroPhase;
	at: number;
}

export const PERSONAL_GRAPH_INTRO_TIMELINE: ReadonlyArray<PersonalGraphIntroPhaseStep> = [
	{ phase: "title", at: 0 },
	{ phase: "subtext", at: 500 },
	{ phase: "controls", at: 900 },
	{ phase: "settle", at: 1700 },
	{ phase: "search", at: 2000 },
	{ phase: "graph", at: 2400 },
	{ phase: "done", at: 3700 },
];

export function getPersonalGraphIntroPhaseAt(
	elapsedMs: number,
	prefersReducedMotion = false,
): PersonalGraphIntroPhase {
	if (prefersReducedMotion) return "done";
	if (!Number.isFinite(elapsedMs) || elapsedMs <= 0) return "title";

	let currentPhase: PersonalGraphIntroPhase = "title";
	for (const step of PERSONAL_GRAPH_INTRO_TIMELINE) {
		if (elapsedMs < step.at) break;
		currentPhase = step.phase;
	}
	return currentPhase;
}
