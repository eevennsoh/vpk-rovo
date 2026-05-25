import { clamp } from "@/lib/utils";

const ROVO_APP_MOBILE_BREAKPOINT = 768;
export const ROVO_APP_MIN_CHAT_PANE_WIDTH = 360;
export const ROVO_APP_MAX_CHAT_PANE_WIDTH = 560;
export const ROVO_APP_MIN_ARTIFACT_PANE_WIDTH = 440;
const ROVO_APP_PREFERRED_CHAT_PANE_RATIO = 0.45;

export interface RovoAppShellLayout {
	artifactPaneWidth: number;
	artifactPaneX: number;
	chatPaneWidth: number | null;
	mode: "overlay" | "split";
}

export function getRovoAppShellLayout(shellWidth: number): RovoAppShellLayout {
	const safeShellWidth =
		Number.isFinite(shellWidth) && shellWidth > 0 ? Math.round(shellWidth) : 0;

	if (
		safeShellWidth < ROVO_APP_MOBILE_BREAKPOINT ||
		safeShellWidth <
			ROVO_APP_MIN_CHAT_PANE_WIDTH + ROVO_APP_MIN_ARTIFACT_PANE_WIDTH
	) {
		return {
			artifactPaneWidth: safeShellWidth,
			artifactPaneX: 0,
			chatPaneWidth: null,
			mode: "overlay",
		};
	}

	const preferredChatPaneWidth = Math.round(
		safeShellWidth * ROVO_APP_PREFERRED_CHAT_PANE_RATIO,
	);
	const maxChatPaneWidth = Math.max(
		ROVO_APP_MIN_CHAT_PANE_WIDTH,
		safeShellWidth - ROVO_APP_MIN_ARTIFACT_PANE_WIDTH,
	);
	const chatPaneWidth = clamp(
		preferredChatPaneWidth,
		ROVO_APP_MIN_CHAT_PANE_WIDTH,
		Math.min(ROVO_APP_MAX_CHAT_PANE_WIDTH, maxChatPaneWidth),
	);

	return {
		artifactPaneWidth: safeShellWidth - chatPaneWidth,
		artifactPaneX: 0,
		chatPaneWidth,
		mode: "split",
	};
}
