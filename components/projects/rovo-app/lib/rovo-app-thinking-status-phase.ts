import type { ReasoningPhase } from "@/components/projects/shared/hooks/use-reasoning-phase";

interface ResolveRovoAppThinkingVisibilityOptions {
	isThinkingActive: boolean;
	isResponseInFlight: boolean;
	wasLatched: boolean;
}

interface ResolveRovoAppThinkingStatusPhaseOptions {
	isThinkingActive: boolean;
	hasTurnComplete: boolean;
	isThinkingLifecycleStreaming: boolean;
	hasBackendThinkingActivity: boolean;
	hasAwaitingInputToolCalls: boolean;
	lifecyclePhase: ReasoningPhase;
}

interface ResolveRovoAppThinkingVisibilityResult {
	effectiveIsThinkingActive: boolean;
	nextLatched: boolean;
}

export function resolveRovoAppThinkingVisibility({
	isThinkingActive,
	isResponseInFlight,
	wasLatched,
}: Readonly<ResolveRovoAppThinkingVisibilityOptions>): ResolveRovoAppThinkingVisibilityResult {
	const nextLatched = isThinkingActive ? true : isResponseInFlight ? wasLatched : false;

	return {
		effectiveIsThinkingActive:
			isThinkingActive || (nextLatched && isResponseInFlight),
		nextLatched,
	};
}

export function resolveRovoAppThinkingStatusPhase({
	isThinkingActive,
	hasTurnComplete,
	isThinkingLifecycleStreaming,
	hasBackendThinkingActivity,
	hasAwaitingInputToolCalls,
	lifecyclePhase,
}: Readonly<ResolveRovoAppThinkingStatusPhaseOptions>): ReasoningPhase {
	if (!isThinkingActive) {
		return "idle";
	}

	if (hasAwaitingInputToolCalls) {
		return "thinking";
	}

	if (hasTurnComplete && !isThinkingLifecycleStreaming) {
		return "completed";
	}

	if (!hasBackendThinkingActivity) {
		return isThinkingLifecycleStreaming ? "preload" : "idle";
	}

	return lifecyclePhase;
}
