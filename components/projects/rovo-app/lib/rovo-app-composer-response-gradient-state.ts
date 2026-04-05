export type RovoAppComposerResponseGradientPhase = "warmup" | "speaking";
export type RovoAppComposerResponseGradientGenerationState =
	| "idle"
	| "delegating"
	| "generating"
	| "steering"
	| "complete";

export function resolveRovoAppComposerResponseGradientState({
	realtimeGenerationState,
	realtimeVoiceState,
}: {
	realtimeGenerationState: RovoAppComposerResponseGradientGenerationState;
	realtimeVoiceState: "idle" | "connecting" | "listening" | "speaking";
}): {
	phase: RovoAppComposerResponseGradientPhase | null;
	visible: boolean;
} {
	const visible =
		realtimeVoiceState === "speaking"
		|| realtimeGenerationState === "generating"
		|| realtimeGenerationState === "complete";

	if (!visible) {
		return {
			phase: null,
			visible: false,
		};
	}

	return {
		phase: realtimeVoiceState === "speaking" ? "speaking" : "warmup",
		visible,
	};
}
