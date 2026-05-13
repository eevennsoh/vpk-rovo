const test = require("node:test");
const assert = require("node:assert/strict");

const {
	getRovoAppPlanningArtifactsSinceBaseline,
	getLatestRovoAppAssistantMessageId,
} = require("./rovo-app-planning-session.ts");

function createTextMessage(id, role, text) {
	return {
		id,
		role,
		parts: [{ type: "text", text, state: "done" }],
	};
}

function createPlanMessage(id, title = "Planner") {
	return {
		id,
		role: "assistant",
		parts: [
			{
				type: "data-widget-data",
				data: {
					type: "plan",
					payload: {
						title,
						tasks: [{ id: "task-1", label: "Do work", blockedBy: [] }],
					},
				},
			},
		],
	};
}

function createQuestionMessage(id) {
	return {
		id,
		role: "assistant",
		parts: [
			{
				type: "data-widget-data",
				data: {
					type: "question-card",
					payload: {
						type: "question-card",
						title: "Clarify",
						questions: [
							{
								id: "scope",
								label: "Scope",
								required: true,
								kind: "single-select",
								options: [{ id: "small", label: "Small" }],
							},
						],
					},
				},
			},
		],
	};
}

test("getLatestRovoAppAssistantMessageId returns the latest assistant id", () => {
	assert.equal(
		getLatestRovoAppAssistantMessageId([
			createTextMessage("user-1", "user", "hello"),
			createTextMessage("assistant-1", "assistant", "hi"),
			createTextMessage("assistant-2", "assistant", "latest"),
		]),
		"assistant-2",
	);
});

test("planning artifacts ignore older plan cards before the baseline assistant message", () => {
	const result = getRovoAppPlanningArtifactsSinceBaseline(
		[
			createTextMessage("user-1", "user", "build something"),
			createPlanMessage("assistant-old-plan"),
			createTextMessage("user-2", "user", "change the title"),
			createTextMessage("assistant-latest-text", "assistant", "I will revise it."),
		],
		"assistant-old-plan",
	);

	assert.equal(result.hasGeneratedPlan, false);
	assert.equal(result.isAwaitingClarificationAnswers, false);
	assert.equal(result.latestAssistantMessage?.id, "assistant-latest-text");
});

test("planning artifacts detect a new plan card after the baseline assistant message", () => {
	const result = getRovoAppPlanningArtifactsSinceBaseline(
		[
			createTextMessage("user-1", "user", "build something"),
			createPlanMessage("assistant-old-plan"),
			createTextMessage("user-2", "user", "change the title"),
			createPlanMessage("assistant-new-plan", "Revised planner"),
		],
		"assistant-old-plan",
	);

	assert.equal(result.hasGeneratedPlan, true);
	assert.equal(result.isAwaitingClarificationAnswers, false);
	assert.equal(result.latestAssistantMessage?.id, "assistant-new-plan");
});

test("planning artifacts detect a new clarification card after the baseline assistant message", () => {
	const result = getRovoAppPlanningArtifactsSinceBaseline(
		[
			createTextMessage("user-1", "user", "build something"),
			createPlanMessage("assistant-old-plan"),
			createTextMessage("user-2", "user", "change the title"),
			createQuestionMessage("assistant-clarify"),
		],
		"assistant-old-plan",
	);

	assert.equal(result.hasGeneratedPlan, false);
	assert.equal(result.isAwaitingClarificationAnswers, true);
	assert.equal(result.latestAssistantMessage?.id, "assistant-clarify");
});
