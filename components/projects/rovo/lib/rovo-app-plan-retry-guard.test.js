const test = require("node:test");
const assert = require("node:assert/strict");

const {
	shouldSuppressRovoAppPlanRetry,
} = require("./rovo-app-plan-retry-guard.ts");

test("suppresses plan retry for stuck port assistant failures", () => {
	assert.equal(
		shouldSuppressRovoAppPlanRetry({
			parts: [
				{
					type: "text",
					text: "\n\n⚠️ This request couldn't be completed — the RovoDev port is stuck. Please try again.",
					state: "done",
				},
			],
		}),
		true,
	);
});

test("suppresses plan retry for expired clarification widget errors", () => {
	assert.equal(
		shouldSuppressRovoAppPlanRetry({
			parts: [
				{
					type: "data-widget-error",
					data: {
						type: "question-card",
						code: "deferred_tool_expired",
						message: "Expired",
						canRetry: true,
					},
				},
			],
		}),
		true,
	);
});

test("suppresses plan retry for tool-first fallback failures", () => {
	assert.equal(
		shouldSuppressRovoAppPlanRetry({
			parts: [
				{
					type: "text",
					text: "I couldn't verify a successful Confluence tool result after 1 attempt. No relevant integration tool call was observed in this response.",
					state: "done",
				},
			],
		}),
		true,
	);
});

test("does not suppress plan retry for normal non-plan assistant text", () => {
	assert.equal(
		shouldSuppressRovoAppPlanRetry({
			parts: [
				{
					type: "text",
					text: "I couldn't verify a successful Jira result.",
					state: "done",
				},
			],
		}),
		false,
	);
});
