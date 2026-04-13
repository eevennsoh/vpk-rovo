import type { RovoAppPanelState } from "@/lib/rovo-app-types";
import type { RovoDataParts } from "@/lib/rovo-ui-messages";

export function buildRovoAppBrowserArtifactKey(input: {
	browserScreenshot?: RovoDataParts["browser-screenshot"] | null;
	browserState: RovoDataParts["browser-state"] | null;
	messageId: string | null;
}): string | null {
	if (!input.browserState || !input.messageId) {
		return null;
	}

	return JSON.stringify({
		messageId: input.messageId,
		screenshotImageUrl: input.browserScreenshot?.imageUrl ?? null,
		screenshotTimestamp: input.browserScreenshot?.timestamp ?? null,
		status: input.browserState.status,
		title: input.browserState.title,
		url: input.browserState.url,
		workspaceId: input.browserState.workspaceId ?? null,
	});
}

export function shouldAutoOpenRovoAppBrowserArtifact(input: {
	browserArtifactKey: string | null;
	dismissedBrowserArtifactKey: string | null;
	hasWorkspaceDocument: boolean;
	panelState: RovoAppPanelState;
}): boolean {
	return (
		input.panelState === "closed" &&
		!input.hasWorkspaceDocument &&
		Boolean(input.browserArtifactKey) &&
		input.browserArtifactKey !== input.dismissedBrowserArtifactKey
	);
}

export function shouldShowReopenRovoAppBrowserArtifactControl(input: {
	browserArtifactKey: string | null;
	dismissedBrowserArtifactKey: string | null;
	hasWorkspaceDocument: boolean;
	panelState: RovoAppPanelState;
}): boolean {
	return (
		input.panelState === "closed" &&
		!input.hasWorkspaceDocument &&
		Boolean(input.browserArtifactKey) &&
		input.browserArtifactKey === input.dismissedBrowserArtifactKey
	);
}
