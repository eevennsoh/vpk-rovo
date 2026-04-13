const assert = require("node:assert/strict");
const test = require("node:test");

const {
	buildRovoAppBrowserArtifactKey,
	shouldAutoOpenRovoAppBrowserArtifact,
	shouldShowReopenRovoAppBrowserArtifactControl,
} = require("./rovo-app-browser-preview.ts");

test("browser artifact key is null when no browser state is available", () => {
	assert.equal(
		buildRovoAppBrowserArtifactKey({
			browserState: null,
			messageId: "message-1",
		}),
		null,
	);
});

test("closing the current browser artifact suppresses auto reopen for the same state", () => {
	const browserArtifactKey = buildRovoAppBrowserArtifactKey({
		browserScreenshot: {
			imageUrl: "/api/rovo-app/files/browser-shot",
			timestamp: "2026-04-13T06:00:00.000Z",
			url: "https://boringbar.app/",
		},
		browserState: {
			status: "ready",
			title: "boringbar.app",
			url: "https://boringbar.app/",
			workspaceId: "workspace-1",
		},
		messageId: "message-1",
	});

	assert.equal(
		shouldAutoOpenRovoAppBrowserArtifact({
			browserArtifactKey,
			dismissedBrowserArtifactKey: browserArtifactKey,
			hasWorkspaceDocument: false,
			panelState: "closed",
		}),
		false,
	);
	assert.equal(
		shouldShowReopenRovoAppBrowserArtifactControl({
			browserArtifactKey,
			dismissedBrowserArtifactKey: browserArtifactKey,
			hasWorkspaceDocument: false,
			panelState: "closed",
		}),
		true,
	);
});

test("a newer browser artifact state can auto open after a previous dismissal", () => {
	const dismissedBrowserArtifactKey = buildRovoAppBrowserArtifactKey({
		browserState: {
			status: "ready",
			title: "Example",
			url: "https://example.com",
			workspaceId: "workspace-1",
		},
		messageId: "message-1",
	});
	const nextBrowserArtifactKey = buildRovoAppBrowserArtifactKey({
		browserState: {
			status: "ready",
			title: "Boring Bar",
			url: "https://boringbar.app/",
			workspaceId: "workspace-1",
		},
		messageId: "message-2",
	});

	assert.equal(
		shouldAutoOpenRovoAppBrowserArtifact({
			browserArtifactKey: nextBrowserArtifactKey,
			dismissedBrowserArtifactKey,
			hasWorkspaceDocument: false,
			panelState: "closed",
		}),
		true,
	);
	assert.equal(
		shouldShowReopenRovoAppBrowserArtifactControl({
			browserArtifactKey: nextBrowserArtifactKey,
			dismissedBrowserArtifactKey,
			hasWorkspaceDocument: false,
			panelState: "closed",
		}),
		false,
	);
});
