"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const {
	getLatestToolFirstIntentPrompt,
} = require("./tool-first-intent-prompt");

test("returns the latest visible non-synthetic user prompt when available", () => {
	const result = getLatestToolFirstIntentPrompt(
		[
			{
				role: "user",
				parts: [{ type: "text", text: "create me a new app" }],
			},
			{
				role: "assistant",
				parts: [{ type: "text", text: "What kind of app?" }],
			},
			{
				role: "user",
				metadata: { source: "clarification-submit" },
				parts: [{ type: "text", text: "Here are my answers..." }],
			},
		],
		{
			skipSources: new Set(["clarification-submit", "plan-approval-submit"]),
		}
	);

	assert.deepEqual(result, {
		index: 0,
		text: "create me a new app",
		source: null,
	});
});

test("skips plan approval continuation prompts when selecting tool-first intent", () => {
	const result = getLatestToolFirstIntentPrompt(
		[
			{
				role: "user",
				parts: [{ type: "text", text: "build a Jira dashboard for the exec team" }],
			},
			{
				role: "assistant",
				parts: [{ type: "text", text: "Here is the plan." }],
			},
			{
				role: "user",
				metadata: { source: "plan-approval-submit" },
				parts: [{ type: "text", text: "I reviewed the plan and submitted an approval decision." }],
			},
		],
		{
			skipSources: new Set(["clarification-submit", "plan-approval-submit"]),
		}
	);

	assert.deepEqual(result, {
		index: 0,
		text: "build a Jira dashboard for the exec team",
		source: null,
	});
});

test("ignores hidden messages when selecting the tool-first intent prompt", () => {
	const result = getLatestToolFirstIntentPrompt(
		[
			{
				role: "user",
				parts: [{ type: "text", text: "show my Google Calendar events tomorrow" }],
			},
			{
				role: "user",
				metadata: { visibility: "hidden" },
				parts: [{ type: "text", text: "hidden synthetic prompt" }],
			},
		],
		{
			skipSources: new Set(["clarification-submit", "plan-approval-submit"]),
		}
	);

	assert.deepEqual(result, {
		index: 0,
		text: "show my Google Calendar events tomorrow",
		source: null,
	});
});

test("falls back to the latest visible prompt when every candidate is synthetic", () => {
	const result = getLatestToolFirstIntentPrompt(
		[
			{
				role: "user",
				metadata: { source: "clarification-submit" },
				parts: [{ type: "text", text: "Here are my clarification answers." }],
			},
		],
		{
			skipSources: new Set(["clarification-submit", "plan-approval-submit"]),
		}
	);

	assert.deepEqual(result, {
		index: 0,
		text: "Here are my clarification answers.",
		source: "clarification-submit",
	});
});
