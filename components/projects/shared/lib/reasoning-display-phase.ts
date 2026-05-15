import type { ReasoningPhase } from "@/components/projects/shared/hooks/use-reasoning-phase";

interface ResolveThinkingIndicatorVisibilityOptions {
	requestActive: boolean;
	hasThinkingStatusInline: boolean;
	hasBackendThinkingActivity: boolean;
	reasoningPhase: ReasoningPhase;
}

interface ThinkingIndicatorVisibility {
	shouldShowPreloader: boolean;
	shouldShowThinkingStatus: boolean;
	shouldShowAny: boolean;
}

interface IsCompletedAssistantFromPreviousRequestOptions {
	activeRequestStartedAt?: number | null;
	hasTurnComplete: boolean;
	turnCompletedAt?: string | null;
}

function parseTimestampMs(value?: string | null): number | null {
	if (!value) return null;

	const timestampMs = Date.parse(value);
	return Number.isFinite(timestampMs) ? timestampMs : null;
}

export function isCompletedAssistantFromPreviousRequest({
	activeRequestStartedAt,
	hasTurnComplete,
	turnCompletedAt,
}: Readonly<IsCompletedAssistantFromPreviousRequestOptions>): boolean {
	if (!hasTurnComplete) {
		return false;
	}

	if (
		typeof activeRequestStartedAt !== "number" ||
		!Number.isFinite(activeRequestStartedAt)
	) {
		return false;
	}

	const turnCompletedAtMs = parseTimestampMs(turnCompletedAt);
	if (turnCompletedAtMs === null) {
		return false;
	}

	return activeRequestStartedAt > turnCompletedAtMs;
}

export function resolveThinkingIndicatorVisibility({
	requestActive,
	hasThinkingStatusInline,
	hasBackendThinkingActivity,
	reasoningPhase,
}: Readonly<ResolveThinkingIndicatorVisibilityOptions>): ThinkingIndicatorVisibility {
	const shouldShowPreloader =
		requestActive &&
		!hasThinkingStatusInline &&
		!hasBackendThinkingActivity;

	const shouldShowThinkingStatus =
		!hasThinkingStatusInline &&
		hasBackendThinkingActivity &&
		(requestActive || reasoningPhase === "completed");

	return {
		shouldShowPreloader,
		shouldShowThinkingStatus,
		shouldShowAny: shouldShowPreloader || shouldShowThinkingStatus,
	};
}
