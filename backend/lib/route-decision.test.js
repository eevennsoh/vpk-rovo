const test = require("node:test");
const assert = require("node:assert/strict");

const {
	buildRouteDecision,
	createRouteDecisionPart,
} = require("./route-decision");

test("buildRouteDecision normalizes the v2 contract", () => {
	assert.deepEqual(
		buildRouteDecision({
			confidence: 2,
			intent: "genui",
			origin: "voice",
			reason: "intent_task_toolable",
		}),
		{
			intent: "genui",
			presentation: "genui_card",
			confidence: 1,
			reason: "intent_task_toolable",
			origin: "voice",
		},
	);
});

test("buildRouteDecision derives the expected presentation for each v2 intent", () => {
	assert.deepEqual(
		buildRouteDecision({
			intent: "chat",
			reason: "text_route",
		}),
		{
			intent: "chat",
			presentation: "text",
			confidence: 1,
			reason: "text_route",
			origin: "text",
		},
	);

	assert.deepEqual(
		buildRouteDecision({
			intent: "artifact_update",
			origin: "voice",
			reason: "artifact_update_completed",
		}),
		{
			intent: "artifact_update",
			presentation: "artifact_preview",
			confidence: 1,
			reason: "artifact_update_completed",
			origin: "voice",
		},
	);
});

test("createRouteDecisionPart emits only the v2 data-route-decision fields", () => {
	assert.deepEqual(
		createRouteDecisionPart({
			intent: "genui",
			reason: "translation_tool_success",
			confidence: 0.8,
		}),
		{
			type: "data-route-decision",
			data: {
				intent: "genui",
				presentation: "genui_card",
				confidence: 0.8,
				reason: "translation_tool_success",
				origin: "text",
			},
		},
	);
});
