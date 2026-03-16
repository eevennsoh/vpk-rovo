const test = require("node:test");
const assert = require("node:assert/strict");

const {
	getLatestRouteDecision,
	isRoutingDecision,
} = require("./rovo-ui-messages.ts");

function createMessage(parts) {
	return {
		id: "assistant-1",
		role: "assistant",
		parts,
	};
}

test("isRoutingDecision accepts only the strict v2 route-decision shape", () => {
	assert.equal(
		isRoutingDecision({
			intent: "genui",
			presentation: "genui_card",
			confidence: 0.9,
			reason: "intent_task_toolable",
			origin: "text",
		}),
		true,
	);

	assert.equal(
		isRoutingDecision({
			reason: "intent_task_toolable",
			experience: "generative_ui",
			timestamp: "2026-03-16T00:00:00.000Z",
		}),
		false,
	);
});

test("getLatestRouteDecision returns the latest valid v2 route decision", () => {
	const decision = getLatestRouteDecision(
		createMessage([
			{
				type: "data-route-decision",
				data: {
					intent: "chat",
					presentation: "text",
					confidence: 0.9,
					reason: "intent_text_default",
					origin: "text",
				},
			},
			{
				type: "data-route-decision",
				data: {
					intent: "genui",
					presentation: "genui_card",
					confidence: 1,
					reason: "intent_task_toolable",
					origin: "voice",
				},
			},
		]),
	);

	assert.deepEqual(decision, {
		intent: "genui",
		presentation: "genui_card",
		confidence: 1,
		reason: "intent_task_toolable",
		origin: "voice",
	});
});

test("getLatestRouteDecision ignores malformed legacy route decisions", () => {
	const decision = getLatestRouteDecision(
		createMessage([
			{
				type: "data-route-decision",
				data: {
					intent: "genui",
					presentation: "genui_card",
					confidence: 0.88,
					reason: "genui_verb_data_noun",
					origin: "text",
				},
			},
			{
				type: "data-route-decision",
				data: {
					experience: "text",
					reason: "fallback_ui_failed",
				},
			},
		]),
	);

	assert.deepEqual(decision, {
		intent: "genui",
		presentation: "genui_card",
		confidence: 0.88,
		reason: "genui_verb_data_noun",
		origin: "text",
	});
});

test("getLatestRouteDecision returns null when no v2 payload exists", () => {
	assert.equal(
		getLatestRouteDecision(
			createMessage([
				{
					type: "data-route-decision",
					data: {
						experience: "text",
						reason: "intent_task_toolable",
					},
				},
			]),
		),
		null,
	);
});
