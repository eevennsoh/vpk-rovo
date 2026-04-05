import type { ChatStatus } from "ai";
import type { RovoAppRunStatus } from "@/lib/rovo-app-types";
import type { RovoUIMessage } from "@/lib/rovo-ui-messages";
import { toNonEmptyString } from "@/lib/utils";

export type RovoAppDirectDelegationPhase =
	| "idle"
	| "requesting"
	| "background";

const DEFAULT_BACKGROUND_DELEGATION_LABEL =
	"RovoDev is still working in the background.";

function formatBackgroundDelegationLabel(
	latestThinkingStatusLabel: string | null | undefined,
): string {
	const normalizedLabel = toNonEmptyString(latestThinkingStatusLabel);
	if (!normalizedLabel) {
		return DEFAULT_BACKGROUND_DELEGATION_LABEL;
	}

	return `RovoDev is still working: ${normalizedLabel}${
		/[.!?]$/u.test(normalizedLabel) ? "" : "."
	}`;
}

export function getLatestRovoAppThinkingStatusLabel(
	messages: ReadonlyArray<Pick<RovoUIMessage, "parts" | "role">>,
): string | null {
	for (let messageIndex = messages.length - 1; messageIndex >= 0; messageIndex -= 1) {
		const message = messages[messageIndex];
		if (message.role !== "assistant") {
			continue;
		}

		for (let partIndex = message.parts.length - 1; partIndex >= 0; partIndex -= 1) {
			const part = message.parts[partIndex];
			if (part.type !== "data-thinking-status") {
				continue;
			}

			return toNonEmptyString(part.data?.label);
		}
	}

	return null;
}

export function resolveRovoAppComposerSubmitState({
	activeRunStatus,
	backgroundDelegationLabelOverride,
	hasObservedTurnComplete = false,
	useChatStatus,
	delegationPhase,
	isAttachedActiveRun = false,
	latestThinkingStatusLabel,
	streamingArtifactStatus,
	backgroundArtifactCount,
}: Readonly<{
	activeRunStatus?: RovoAppRunStatus | null;
	backgroundDelegationLabelOverride?: string | null;
	hasObservedTurnComplete?: boolean;
	useChatStatus: ChatStatus;
	delegationPhase: RovoAppDirectDelegationPhase;
	isAttachedActiveRun?: boolean;
	latestThinkingStatusLabel?: string | null;
	streamingArtifactStatus?: "streaming" | "idle" | null;
	backgroundArtifactCount?: number;
}>): {
	backgroundArtifactLabel: string | null;
	backgroundDelegationLabel: string | null;
	composerStatus: ChatStatus;
	hasBackgroundDelegation: boolean;
} {
	const resolvedBackgroundArtifactCount = backgroundArtifactCount ?? 0;
	const backgroundArtifactLabel =
		resolvedBackgroundArtifactCount > 0
			? resolvedBackgroundArtifactCount === 1
				? "1 artifact generating..."
				: `${resolvedBackgroundArtifactCount} artifacts generating...`
			: null;

	if (useChatStatus === "submitted" || useChatStatus === "streaming") {
		if (hasObservedTurnComplete) {
			return {
				backgroundArtifactLabel,
				backgroundDelegationLabel: null,
				composerStatus: "ready",
				hasBackgroundDelegation: false,
			};
		}

		if (
			useChatStatus === "streaming" &&
			streamingArtifactStatus === "streaming"
		) {
			return {
				backgroundArtifactLabel,
				backgroundDelegationLabel: null,
				composerStatus: "ready",
				hasBackgroundDelegation: false,
			};
		}

		return {
			backgroundArtifactLabel,
			backgroundDelegationLabel: null,
			composerStatus: useChatStatus,
			hasBackgroundDelegation: false,
		};
	}

	if (delegationPhase === "requesting") {
		return {
			backgroundArtifactLabel,
			backgroundDelegationLabel: null,
			composerStatus: "submitted",
			hasBackgroundDelegation: false,
		};
	}

	if (delegationPhase === "background") {
		return {
			backgroundArtifactLabel,
			backgroundDelegationLabel: formatBackgroundDelegationLabel(
				latestThinkingStatusLabel,
			),
			composerStatus: "ready",
			hasBackgroundDelegation: true,
		};
	}

	if (isAttachedActiveRun && activeRunStatus === "streaming") {
		return {
			backgroundArtifactLabel,
			backgroundDelegationLabel: null,
			composerStatus: "streaming",
			hasBackgroundDelegation: false,
		};
	}

	if (
		activeRunStatus === "queued"
		|| activeRunStatus === "background"
		|| activeRunStatus === "streaming"
	) {
		return {
			backgroundArtifactLabel,
			backgroundDelegationLabel:
				backgroundDelegationLabelOverride
				|| formatBackgroundDelegationLabel(latestThinkingStatusLabel),
			composerStatus: "ready",
			hasBackgroundDelegation: true,
		};
	}

	return {
		backgroundArtifactLabel,
		backgroundDelegationLabel: null,
		composerStatus: "ready",
		hasBackgroundDelegation: false,
	};
}
