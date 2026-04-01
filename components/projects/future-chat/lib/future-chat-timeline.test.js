const assert = require("node:assert/strict");
const test = require("node:test");

const {
	deriveFutureChatTimelineItems,
} = require("./future-chat-timeline.ts");

function formatExpectedTimestamp(timestamp) {
	return new Intl.DateTimeFormat(undefined, {
		timeStyle: "short",
	}).format(new Date(timestamp));
}

test("derives newest-first timeline items from visible user prompts only", () => {
	const items = deriveFutureChatTimelineItems([
		{
			id: "user-1",
			role: "user",
			metadata: {
				createdAt: "2026-03-31T09:15:00.000Z",
			},
			parts: [{ type: "text", text: "First visible prompt", state: "done" }],
		},
		{
			id: "assistant-1",
			role: "assistant",
			metadata: {
				createdAt: "2026-03-31T09:16:00.000Z",
			},
			parts: [{ type: "text", text: "Assistant reply", state: "done" }],
		},
		{
			id: "user-hidden",
			role: "user",
			metadata: {
				createdAt: "2026-03-31T09:17:00.000Z",
				visibility: "hidden",
			},
			parts: [{ type: "text", text: "Hidden prompt", state: "done" }],
		},
		{
			id: "user-2",
			role: "user",
			metadata: {
				createdAt: "2026-03-31T09:18:00.000Z",
			},
			parts: [{ type: "text", text: "Newest visible prompt", state: "done" }],
		},
	]);

	assert.deepEqual(
		items,
		[
			{
				id: "user-2",
				label: "Prompt 2",
				text: "Newest visible prompt",
				timestampLabel: formatExpectedTimestamp("2026-03-31T09:18:00.000Z"),
			},
			{
				id: "user-1",
				label: "Prompt 1",
				text: "First visible prompt",
				timestampLabel: formatExpectedTimestamp("2026-03-31T09:15:00.000Z"),
			},
		],
	);
});

test("falls back to updatedAt when createdAt is missing or invalid", () => {
	const items = deriveFutureChatTimelineItems([
		{
			id: "user-updated",
			role: "user",
			metadata: {
				createdAt: "not-a-date",
				updatedAt: "2026-03-31T11:45:00.000Z",
			},
			parts: [{ type: "text", text: "Uses updated timestamp", state: "done" }],
		},
	]);

	assert.deepEqual(items, [
		{
			id: "user-updated",
			label: "Prompt 1",
			text: "Uses updated timestamp",
			timestampLabel: formatExpectedTimestamp("2026-03-31T11:45:00.000Z"),
		},
	]);
});
