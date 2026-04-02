const assert = require("node:assert/strict");
const test = require("node:test");

const {
	resolveFutureChatMessageArtifactDisplay,
	resolveFutureChatOrphanArtifactDisplay,
} = require("./future-chat-message-artifacts.ts");

function createAssistantMessage(id, artifactResult = null) {
	return {
		id,
		role: "assistant",
		parts: artifactResult
			? [
					{
						type: "data-artifact-result",
						data: artifactResult,
					},
				]
			: [],
	};
}

function createDocument({
	id,
	title,
	content,
	previewSummary,
	updatedAt,
}) {
	return {
		id,
		threadId: "thread-1",
		title,
		kind: "text",
		previewSummary,
		sourceMessageId: null,
		createdAt: updatedAt,
		updatedAt,
		versions: [
			{
				changeLabel: "Created",
				id: `${id}-version`,
				content,
				createdAt: updatedAt,
				title,
			},
		],
	};
}

test("keeps per-message artifact ownership across create, update, and new create turns", () => {
	const documents = [
		createDocument({
			id: "doc-apple",
			title: "APPLE YO",
			content: "# APPLE YO\n\nUpdated Apple content",
			updatedAt: "2026-03-09T10:10:00.000Z",
		}),
		createDocument({
			id: "doc-orange",
			title: "Orange",
			content: "# Orange\n\nFresh Orange content",
			updatedAt: "2026-03-09T10:20:00.000Z",
		}),
	];
	const messages = [
		createAssistantMessage("assistant-apple-create", {
			action: "create",
			documentId: "doc-apple",
			kind: "text",
			title: "Apple",
		}),
		createAssistantMessage("assistant-apple-update", {
			action: "update",
			documentId: "doc-apple",
			kind: "text",
			title: "APPLE YO",
		}),
		createAssistantMessage("assistant-orange-create", {
			action: "create",
			documentId: "doc-orange",
			kind: "text",
			title: "Orange",
		}),
	];

	const resolvedDisplays = messages.map((message) =>
		resolveFutureChatMessageArtifactDisplay({
			documents,
			message,
			pendingArtifactResult: null,
			streamingArtifact: null,
			streamingArtifactMessageId: null,
		}),
	);

	assert.deepEqual(
		resolvedDisplays.map((display) => display?.documentId),
		["doc-apple", "doc-apple", "doc-orange"],
	);
	assert.deepEqual(
		resolvedDisplays.map((display) => display?.displayMode),
		["preview", "preview", "preview"],
	);
	assert.deepEqual(
		resolvedDisplays.map((display) => display?.title),
		["Apple", "APPLE YO", "Orange"],
	);
});

test("uses pending artifact state for the current streaming assistant turn", () => {
	const display = resolveFutureChatMessageArtifactDisplay({
		documents: [],
		message: createAssistantMessage("assistant-streaming"),
		pendingArtifactResult: {
			action: null,
			documentId: "doc-orange",
			kind: "text",
			title: "Orange",
		},
		streamingArtifact: {
			content: "# Orange\n\nStreaming draft",
			documentId: "doc-orange",
			createdAt: "2026-03-09T10:30:00.000Z",
			kind: "text",
			status: "streaming",
			title: "Orange",
			updatedAt: "2026-03-09T10:30:10.000Z",
		},
		streamingArtifactMessageId: "assistant-streaming",
	});

	assert.equal(display?.documentId, "doc-orange");
	assert.equal(display?.isStreaming, true);
	assert.equal(display?.previewContent, "# Orange\n\nStreaming draft");
	assert.equal(display?.displayMode, "preview");
});

test("keeps the streaming preview content after finish without showing a streaming state", () => {
	const display = resolveFutureChatMessageArtifactDisplay({
		documents: [],
		message: createAssistantMessage("assistant-finished"),
		pendingArtifactResult: {
			action: "create",
			documentId: "doc-orange",
			kind: "text",
			title: "Orange",
		},
		streamingArtifact: {
			content: "# Orange\n\nFinished draft",
			documentId: "doc-orange",
			createdAt: "2026-03-09T10:30:00.000Z",
			kind: "text",
			status: "idle",
			title: "Orange",
			updatedAt: "2026-03-09T10:30:10.000Z",
		},
		streamingArtifactMessageId: "assistant-finished",
	});

	assert.equal(display?.documentId, "doc-orange");
	assert.equal(display?.isStreaming, false);
	assert.equal(display?.previewContent, "# Orange\n\nFinished draft");
});

test("keeps the open artifact message as an inline preview", () => {
	const display = resolveFutureChatMessageArtifactDisplay({
		documents: [
			createDocument({
				id: "doc-orange",
				title: "Orange",
				content: "# Orange\n\nSaved content",
				updatedAt: "2026-03-09T10:40:00.000Z",
			}),
		],
		message: createAssistantMessage("assistant-orange", {
			action: "create",
			documentId: "doc-orange",
			kind: "text",
			title: "Orange",
		}),
		pendingArtifactResult: null,
		streamingArtifact: null,
		streamingArtifactMessageId: null,
	});

	assert.equal(display?.displayMode, "preview");
	assert.equal(display?.previewContent, "# Orange\n\nSaved content");
});

test("exposes previewSummary for react app artifacts", () => {
	const display = resolveFutureChatMessageArtifactDisplay({
		documents: [
			{
				...createDocument({
					id: "doc-dashboard",
					title: "Analytics Dashboard",
					content: "/dashboard-analytics",
					previewSummary: "Monitor KPIs, trends, and campaign performance metrics",
					updatedAt: "2026-03-09T10:45:00.000Z",
				}),
				kind: "react",
			},
		],
		message: createAssistantMessage("assistant-dashboard", {
			action: "create",
			documentId: "doc-dashboard",
			kind: "react",
			title: "Analytics Dashboard",
		}),
		pendingArtifactResult: null,
		streamingArtifact: null,
		streamingArtifactMessageId: null,
	});

	assert.equal(display?.previewContent, "/dashboard-analytics");
	assert.equal(
		display?.previewSummary,
		"Monitor KPIs, trends, and campaign performance metrics",
	);
});

test("falls back to the latest plan shortDescription for legacy react artifacts", () => {
	const display = resolveFutureChatMessageArtifactDisplay({
		documents: [
			{
				...createDocument({
					id: "doc-legacy-dashboard",
					title: "Dashboard-analytics",
					content: "/dashboard-analytics",
					updatedAt: "2026-03-09T10:46:00.000Z",
				}),
				kind: "react",
			},
		],
		fallbackPreviewSummary: "Monitor KPIs, trends, and campaign performance metrics",
		message: createAssistantMessage("assistant-legacy-dashboard", {
			action: "create",
			documentId: "doc-legacy-dashboard",
			kind: "react",
			title: "Dashboard-analytics",
		}),
		pendingArtifactResult: null,
		streamingArtifact: null,
		streamingArtifactMessageId: null,
	});

	assert.equal(display?.previewContent, "/dashboard-analytics");
	assert.equal(
		display?.previewSummary,
		"Monitor KPIs, trends, and campaign performance metrics",
	);
});

test("falls back to the last assistant message when the active document has no source message", () => {
	const display = resolveFutureChatOrphanArtifactDisplay({
		activeDocumentId: "doc-orange",
		documents: [
			createDocument({
				id: "doc-orange",
				title: "Orange",
				content: "# Orange\n\nSaved content",
				updatedAt: "2026-03-09T10:40:00.000Z",
			}),
		],
		messages: [
			{
				id: "user-1",
				role: "user",
				parts: [{ type: "text", text: "Make me a document", state: "done" }],
			},
			{
				id: "assistant-1",
				role: "assistant",
				parts: [{ type: "text", text: "Working on it", state: "done" }],
			},
		],
	});

	assert.equal(display?.anchorMessageId, "assistant-1");
	assert.equal(display?.documentId, "doc-orange");
	assert.equal(display?.displayMode, "preview");
});

test("falls back to the newest unanchored document when activeDocumentId is missing", () => {
	const display = resolveFutureChatOrphanArtifactDisplay({
		activeDocumentId: null,
		documents: [
			createDocument({
				id: "doc-older",
				title: "Older",
				content: "# Older\n\nSaved content",
				updatedAt: "2026-03-09T10:40:00.000Z",
			}),
			createDocument({
				id: "doc-newer",
				title: "Newer",
				content: "# Newer\n\nLatest content",
				updatedAt: "2026-03-09T10:50:00.000Z",
			}),
		],
		messages: [
			{
				id: "assistant-1",
				role: "assistant",
				metadata: {
					createdAt: "2026-03-09T10:39:00.000Z",
				},
				parts: [{ type: "text", text: "Your document is ready", state: "done" }],
			},
		],
	});

	assert.equal(display?.anchorMessageId, "assistant-1");
	assert.equal(display?.documentId, "doc-newer");
	assert.equal(display?.title, "Newer");
});

test("does not treat plan-preview documents with a source message as orphan artifacts", () => {
	const display = resolveFutureChatOrphanArtifactDisplay({
		activeDocumentId: "doc-plan",
		documents: [
			{
				...createDocument({
					id: "doc-plan",
					title: "Plan preview",
					content: "# Plan",
					updatedAt: "2026-03-09T10:50:00.000Z",
				}),
				sourceMessageId: "assistant-1",
			},
		],
		messages: [
			{
				id: "assistant-1",
				role: "assistant",
				metadata: {
					createdAt: "2026-03-09T10:49:00.000Z",
				},
				parts: [{ type: "text", text: "Here is your plan", state: "done" }],
			},
		],
	});

	assert.equal(display, null);
});

test("anchors orphaned artifacts to the assistant message closest to document completion time", () => {
	const display = resolveFutureChatOrphanArtifactDisplay({
		activeDocumentId: null,
		documents: [
			createDocument({
				id: "doc-apple",
				title: "Apple Overview",
				content: "# Apple Overview",
				updatedAt: "2026-03-09T10:50:00.000Z",
			}),
		],
		messages: [
			{
				id: "assistant-early",
				role: "assistant",
				metadata: {
					createdAt: "2026-03-09T10:40:00.000Z",
				},
				parts: [{ type: "text", text: "Creating the page now", state: "done" }],
			},
			{
				id: "assistant-ready",
				role: "assistant",
				metadata: {
					createdAt: "2026-03-09T10:50:20.000Z",
				},
				parts: [{ type: "text", text: "The page is ready", state: "done" }],
			},
			{
				id: "assistant-late",
				role: "assistant",
				metadata: {
					createdAt: "2026-03-09T11:10:00.000Z",
				},
				parts: [{ type: "text", text: "Anything else?", state: "done" }],
			},
		],
	});

	assert.equal(display?.anchorMessageId, "assistant-ready");
	assert.equal(display?.documentId, "doc-apple");
});

test("does not create an orphan fallback when a message already owns the artifact", () => {
	const display = resolveFutureChatOrphanArtifactDisplay({
		activeDocumentId: "doc-orange",
		documents: [
			createDocument({
				id: "doc-orange",
				title: "Orange",
				content: "# Orange\n\nSaved content",
				updatedAt: "2026-03-09T10:40:00.000Z",
			}),
		],
		messages: [
			createAssistantMessage("assistant-orange", {
				action: "create",
				documentId: "doc-orange",
				kind: "text",
				title: "Orange",
			}),
		],
	});

	assert.equal(display, null);
});
