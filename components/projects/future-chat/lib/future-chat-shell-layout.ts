import { clamp } from "@/lib/utils";

const FUTURE_CHAT_MOBILE_BREAKPOINT = 768;
const FUTURE_CHAT_MIN_CHAT_PANE_WIDTH = 360;
const FUTURE_CHAT_MAX_CHAT_PANE_WIDTH = 560;
const FUTURE_CHAT_MIN_ARTIFACT_PANE_WIDTH = 440;
const FUTURE_CHAT_PREFERRED_CHAT_PANE_RATIO = 0.42;

export interface FutureChatShellLayout {
	artifactPaneWidth: number;
	artifactPaneX: number;
	chatPaneWidth: number | null;
	mode: "overlay" | "split";
}

export function getFutureChatShellLayout(shellWidth: number): FutureChatShellLayout {
	const safeShellWidth =
		Number.isFinite(shellWidth) && shellWidth > 0 ? Math.round(shellWidth) : 0;

	if (
		safeShellWidth < FUTURE_CHAT_MOBILE_BREAKPOINT ||
		safeShellWidth <
			FUTURE_CHAT_MIN_CHAT_PANE_WIDTH + FUTURE_CHAT_MIN_ARTIFACT_PANE_WIDTH
	) {
		return {
			artifactPaneWidth: safeShellWidth,
			artifactPaneX: 0,
			chatPaneWidth: null,
			mode: "overlay",
		};
	}

	const preferredChatPaneWidth = Math.round(
		safeShellWidth * FUTURE_CHAT_PREFERRED_CHAT_PANE_RATIO,
	);
	const maxChatPaneWidth = Math.max(
		FUTURE_CHAT_MIN_CHAT_PANE_WIDTH,
		safeShellWidth - FUTURE_CHAT_MIN_ARTIFACT_PANE_WIDTH,
	);
	const chatPaneWidth = clamp(
		preferredChatPaneWidth,
		FUTURE_CHAT_MIN_CHAT_PANE_WIDTH,
		Math.min(FUTURE_CHAT_MAX_CHAT_PANE_WIDTH, maxChatPaneWidth),
	);

	return {
		artifactPaneWidth: safeShellWidth - chatPaneWidth,
		artifactPaneX: chatPaneWidth,
		chatPaneWidth,
		mode: "split",
	};
}

