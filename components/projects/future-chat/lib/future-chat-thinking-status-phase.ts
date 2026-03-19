import type { ReasoningPhase } from "@/components/projects/shared/hooks/use-reasoning-phase";

interface ResolveFutureChatThinkingVisibilityOptions {
	isThinkingActive: boolean;
	isResponseInFlight: boolean;
	wasLatched: boolean;
}

interface ResolveFutureChatThinkingStatusPhaseOptions {
	isThinkingActive: boolean;
	hasTurnComplete: boolean;
	isThinkingLifecycleStreaming: boolean;
	hasBackendThinkingActivity: boolean;
	lifecyclePhase: ReasoningPhase;
}

interface ResolveFutureChatThinkingVisibilityResult {
	effectiveIsThinkingActive: boolean;
	nextLatched: boolean;
}

export function resolveFutureChatThinkingVisibility({
	isThinkingActive,
	isResponseInFlight,
	wasLatched,
}: Readonly<ResolveFutureChatThinkingVisibilityOptions>): ResolveFutureChatThinkingVisibilityResult {
	const nextLatched = isThinkingActive ? true : isResponseInFlight ? wasLatched : false;

	return {
		effectiveIsThinkingActive:
			isThinkingActive || (nextLatched && isResponseInFlight),
		nextLatched,
	};
}

export function resolveFutureChatThinkingStatusPhase({
	isThinkingActive,
	hasTurnComplete,
	isThinkingLifecycleStreaming,
	hasBackendThinkingActivity,
	lifecyclePhase,
}: Readonly<ResolveFutureChatThinkingStatusPhaseOptions>): ReasoningPhase {
	if (!isThinkingActive) {
		return "idle";
	}

	if (hasTurnComplete && !isThinkingLifecycleStreaming) {
		return "completed";
	}

	if (!hasBackendThinkingActivity) {
		return isThinkingLifecycleStreaming ? "preload" : "idle";
	}

	return lifecyclePhase;
}
