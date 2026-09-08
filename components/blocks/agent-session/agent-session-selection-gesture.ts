import type { AgentSessionSelectionGesture } from "./agent-session-types";

/**
 * Command on Apple platforms, Control elsewhere. Control-click on a Mac is
 * the platform secondary click, so it must not cherry-pick.
 */
export function isAppleSelectionPlatform(
	platform: string = typeof navigator === "undefined" ? "" : navigator.platform,
): boolean {
	return /Mac|iPhone|iPad/u.test(platform);
}

export function isAdditiveSelectionModifier(
	event: Readonly<{ ctrlKey: boolean; metaKey: boolean }>,
	platform?: string,
): boolean {
	return isAppleSelectionPlatform(platform) ? event.metaKey : event.ctrlKey;
}

export function selectionGestureFromModifierKeys(
	event: Readonly<{ ctrlKey: boolean; metaKey: boolean; shiftKey: boolean }>,
	platform?: string,
): AgentSessionSelectionGesture {
	return {
		additive: isAdditiveSelectionModifier(event, platform),
		range: event.shiftKey,
	};
}
