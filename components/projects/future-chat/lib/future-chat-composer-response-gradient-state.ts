export type FutureChatComposerResponseGradientPhase = "warmup" | "speaking";
export type FutureChatComposerResponseGradientGenerationState =
	| "idle"
	| "delegating"
	| "generating"
	| "steering"
	| "complete";

export function resolveFutureChatComposerResponseGradientState({
	realtimeGenerationState,
	realtimeVoiceState,
}: {
	realtimeGenerationState: FutureChatComposerResponseGradientGenerationState;
	realtimeVoiceState: "idle" | "connecting" | "listening" | "speaking";
}): {
	phase: FutureChatComposerResponseGradientPhase | null;
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
