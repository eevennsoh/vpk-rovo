const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

const {
	shouldGateToolFirstQuestionCard,
	buildToolFirstQuestionCardPayload,
	buildToolFirstClarificationInstruction,
} = require("./tool-first-question-gate");
const { resolveToolFirstPolicy } = require("./tool-first-genui-policy");

const SKIP_SOURCES = new Set(["clarification-submit"]);

describe("shouldGateToolFirstQuestionCard", () => {
	it("should NOT gate when policy is not matched", () => {
		const policy = resolveToolFirstPolicy({ prompt: "Tell me a joke" });
		const result = shouldGateToolFirstQuestionCard({
			prompt: "Tell me a joke",
			toolFirstPolicy: policy,
			latestUserMessageSource: "user",
			gateSkipSources: SKIP_SOURCES,
		});
		assert.equal(result.shouldGate, false);
		assert.equal(result.unsatisfiedHints.length, 0);
	});

	it("should NOT gate when source is clarification-submit", () => {
		const policy = resolveToolFirstPolicy({ prompt: "Send a Slack message" });
		const result = shouldGateToolFirstQuestionCard({
			prompt: "Send a Slack message",
			toolFirstPolicy: policy,
			latestUserMessageSource: "clarification-submit",
			gateSkipSources: SKIP_SOURCES,
		});
		assert.equal(result.shouldGate, false);
	});

	it("should NOT gate for prompts that previously matched local tool-first domains", () => {
		for (const prompt of [
			"Send a Slack message",
			"Create a Confluence page",
			"Create a Jira issue",
			"Schedule a meeting on Google Calendar",
			"Get Figma design context",
		]) {
			const policy = resolveToolFirstPolicy({ prompt });
			const result = shouldGateToolFirstQuestionCard({
				prompt,
				toolFirstPolicy: policy,
				latestUserMessageSource: "user",
				gateSkipSources: SKIP_SOURCES,
			});
			assert.equal(result.shouldGate, false, `Expected no gating for "${prompt}"`);
			assert.equal(result.unsatisfiedHints.length, 0);
		}
	});
});

describe("buildToolFirstQuestionCardPayload", () => {
	it("returns null when unsatisfiedHints is empty", () => {
		const result = buildToolFirstQuestionCardPayload({
			unsatisfiedHints: [],
			domainLabels: ["Slack"],
			sessionId: "test-session",
		});
		assert.equal(result, null);
	});

	it("returns valid payload with correct structure", () => {
		const result = buildToolFirstQuestionCardPayload({
			unsatisfiedHints: [
				{
					id: "channel",
					label: "Which channel or person?",
					description: "Specify the Slack channel or person to message.",
					suggestedOptions: [
						{ id: "general", label: "#general" },
						{ id: "random", label: "#random" },
					],
				},
				{
					id: "message-content",
					label: "What should the message say?",
					description: "Specify the content of the message.",
					suggestedOptions: [
						{ id: "specify", label: "I'll type the message" },
					],
				},
			],
			domainLabels: ["Slack"],
			sessionId: "test-session-123",
		});

		assert.ok(result !== null);
		assert.equal(result.type, "question-card");
		assert.equal(result.title, "Before I use Slack...");
		assert.equal(result.description, "Answer these so I can execute the right action.");
		assert.equal(result.sessionId, "test-session-123");
		assert.equal(result.questions.length, 2);
		assert.equal(result.questions[0].id, "channel");
		assert.equal(result.questions[0].label, "Which channel or person?");
		assert.equal(result.questions[0].options.length, 2);
		assert.equal(result.questions[1].id, "message-content");
	});

	it("handles multiple domain labels", () => {
		const result = buildToolFirstQuestionCardPayload({
			unsatisfiedHints: [
				{
					id: "channel",
					label: "Which channel?",
					suggestedOptions: [],
				},
			],
			domainLabels: ["Slack", "Confluence"],
			sessionId: "test-multi",
		});

		assert.ok(result !== null);
		assert.equal(result.title, "Before I use Slack, Confluence...");
	});
});

describe("buildToolFirstClarificationInstruction", () => {
	it("returns null for empty hints", () => {
		const result = buildToolFirstClarificationInstruction({
			unsatisfiedHints: [],
			domainLabels: ["Slack"],
		});
		assert.equal(result, null);
	});

	it("builds ask-user-questions directive with missing detail labels", () => {
		const result = buildToolFirstClarificationInstruction({
			unsatisfiedHints: [
				{ id: "channel", label: "Which channel or person?" },
				{ id: "message-content", label: "What should the message say?" },
			],
			domainLabels: ["Slack"],
		});

		assert.ok(typeof result === "string" && result.length > 0);
		assert.match(result, /ask_user_questions tool/i);
		assert.match(result, /request_user_input/i);
		assert.match(result, /Which channel or person\?/);
		assert.match(result, /What should the message say\?/);
	});

	it("de-duplicates repeated hint ids", () => {
		const result = buildToolFirstClarificationInstruction({
			unsatisfiedHints: [
				{ id: "space", label: "Which Confluence space?" },
				{ id: "space", label: "Which Confluence space?" },
			],
			domainLabels: ["Confluence"],
		});

		assert.ok(typeof result === "string");
		assert.equal(
			(result.match(/Which Confluence space\?/g) || []).length,
			1
		);
	});
});
