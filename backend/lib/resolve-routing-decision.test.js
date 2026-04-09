const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const {
	resolveRoutingDecision,
	resolveRoutingDecisionFastPath,
	parseClassifierResponse,
	presentationForIntent,
} = require("./resolve-routing-decision");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeMockClassify(response) {
	return async () => {
		return JSON.stringify(response);
	};
}

function makeSlowClassify(delayMs, response) {
	return async () => {
		await new Promise((resolve) => setTimeout(resolve, delayMs));
		return JSON.stringify(response);
	};
}

function makeFailingClassify(error) {
	return async () => {
		throw error || new Error("classify_failed");
	};
}

// ---------------------------------------------------------------------------
// presentationForIntent
// ---------------------------------------------------------------------------

describe("presentationForIntent", () => {
	it("maps chat → text", () => {
		assert.equal(presentationForIntent("chat"), "text");
	});
	it("maps artifact_create → artifact_preview", () => {
		assert.equal(presentationForIntent("artifact_create"), "artifact_preview");
	});
	it("maps artifact_update → artifact_preview", () => {
		assert.equal(presentationForIntent("artifact_update"), "artifact_preview");
	});
	it("maps genui → genui_card", () => {
		assert.equal(presentationForIntent("genui"), "genui_card");
	});
	it("returns text for unknown intent", () => {
		assert.equal(presentationForIntent("unknown"), "text");
	});
});

// ---------------------------------------------------------------------------
// parseClassifierResponse
// ---------------------------------------------------------------------------

describe("parseClassifierResponse", () => {
	it("parses valid JSON", () => {
		const result = parseClassifierResponse('{"intent":"genui","confidence":0.9,"reason":"chart request"}');
		assert.equal(result.intent, "genui");
		assert.equal(result.confidence, 0.9);
		assert.equal(result.reason, "chart request");
	});

	it("extracts JSON from surrounding text", () => {
		const result = parseClassifierResponse('Here is my answer: {"intent":"chat","confidence":0.8,"reason":"conversational"}');
		assert.equal(result.intent, "chat");
	});

	it("returns null for invalid JSON", () => {
		assert.equal(parseClassifierResponse("not json at all"), null);
	});

	it("returns null for empty input", () => {
		assert.equal(parseClassifierResponse(""), null);
		assert.equal(parseClassifierResponse(null), null);
	});

	it("rejects unknown intents", () => {
		assert.equal(parseClassifierResponse('{"intent":"unknown","confidence":0.9}'), null);
	});

	it("clamps confidence to 0-1", () => {
		const result = parseClassifierResponse('{"intent":"chat","confidence":1.5}');
		assert.equal(result.confidence, 1);
		const result2 = parseClassifierResponse('{"intent":"chat","confidence":-0.5}');
		assert.equal(result2.confidence, 0);
	});
});

// ---------------------------------------------------------------------------
// resolveRoutingDecisionFastPath
// ---------------------------------------------------------------------------

describe("resolveRoutingDecisionFastPath", () => {
	it("returns chat for empty prompt", () => {
		const result = resolveRoutingDecisionFastPath({ prompt: "" });
		assert.equal(result.intent, "chat");
		assert.equal(result.presentation, "text");
		assert.equal(result.reason, "empty_prompt");
	});

	it("returns chat for whitespace-only prompt", () => {
		const result = resolveRoutingDecisionFastPath({ prompt: "   " });
		assert.equal(result.intent, "chat");
	});

	it("returns artifact_update when activeArtifact exists", () => {
		const result = resolveRoutingDecisionFastPath({
			prompt: "hello",
			activeArtifact: { id: "doc_1", title: "Login", kind: "code" },
		});
		assert.equal(result.intent, "artifact_update");
		assert.equal(result.presentation, "artifact_preview");
		assert.equal(result.confidence, 1);
		assert.equal(result.reason, "active_artifact");
	});

	it("returns artifact_update for any prompt when activeArtifact exists", () => {
		const result = resolveRoutingDecisionFastPath({
			prompt: "make the button red",
			activeArtifact: { id: "doc_1", title: "Login", kind: "code" },
		});
		assert.equal(result.intent, "artifact_update");
		assert.equal(result.presentation, "artifact_preview");
	});

	it("returns genui for diagram requests even when an artifact is open", () => {
		const result = resolveRoutingDecisionFastPath({
			prompt: "Create an architecture diagram for this system",
			activeArtifact: { id: "doc_1", title: "Login", kind: "code" },
		});
		assert.equal(result.intent, "genui");
		assert.equal(result.presentation, "genui_card");
		assert.equal(result.reason, "diagram_request");
	});

	it("returns artifact_create for 'create a new app' when activeArtifact exists", () => {
		const result = resolveRoutingDecisionFastPath({
			prompt: "create a new app",
			activeArtifact: { id: "doc_1", title: "Login", kind: "code" },
		});
		assert.equal(result.intent, "artifact_create");
		assert.equal(result.presentation, "artifact_preview");
		assert.equal(result.confidence, 0.95);
		assert.equal(result.reason, "explicit_new_artifact");
	});

	it("returns artifact_create for 'build another page' when activeArtifact exists", () => {
		const result = resolveRoutingDecisionFastPath({
			prompt: "build another page",
			activeArtifact: { id: "doc_1", title: "Login", kind: "code" },
		});
		assert.equal(result.intent, "artifact_create");
		assert.equal(result.presentation, "artifact_preview");
		assert.equal(result.reason, "explicit_new_artifact");
	});

	it("returns artifact_create for 'make a separate component' when activeArtifact exists", () => {
		const result = resolveRoutingDecisionFastPath({
			prompt: "make a separate component",
			activeArtifact: { id: "doc_1", title: "Login", kind: "code" },
		});
		assert.equal(result.intent, "artifact_create");
		assert.equal(result.reason, "explicit_new_artifact");
	});

	it("returns chat for conversational messages", () => {
		const result = resolveRoutingDecisionFastPath({ prompt: "hello" });
		assert.equal(result.intent, "chat");
		assert.equal(result.presentation, "text");
		assert.equal(result.reason, "conversational_pattern");
	});

	it("returns chat for 'hey there'", () => {
		const result = resolveRoutingDecisionFastPath({ prompt: "hey there" });
		assert.equal(result.intent, "chat");
	});

	it("returns chat for 'thanks!'", () => {
		const result = resolveRoutingDecisionFastPath({ prompt: "thanks!" });
		assert.equal(result.intent, "chat");
	});

	it("returns chat for pure questions", () => {
		const result = resolveRoutingDecisionFastPath({ prompt: "what is React?" });
		assert.equal(result.intent, "chat");
		assert.equal(result.presentation, "text");
	});

	it("returns artifact_create for 'build a login page'", () => {
		const result = resolveRoutingDecisionFastPath({ prompt: "build a login page" });
		assert.equal(result.intent, "artifact_create");
		assert.equal(result.presentation, "artifact_preview");
	});

	it("returns artifact_create for 'create a new component'", () => {
		const result = resolveRoutingDecisionFastPath({ prompt: "create a new component" });
		assert.equal(result.intent, "artifact_create");
		assert.equal(result.presentation, "artifact_preview");
	});

	it("returns genui for 'show Q3 revenue'", () => {
		const result = resolveRoutingDecisionFastPath({ prompt: "show Q3 revenue" });
		assert.equal(result.intent, "genui");
		assert.equal(result.presentation, "genui_card");
	});

	it("returns genui for 'chart of sales data'", () => {
		const result = resolveRoutingDecisionFastPath({ prompt: "chart of sales data" });
		assert.equal(result.intent, "genui");
		assert.equal(result.presentation, "genui_card");
	});

	it("returns genui for 'visualize the breakdown'", () => {
		const result = resolveRoutingDecisionFastPath({ prompt: "visualize the breakdown" });
		assert.equal(result.intent, "genui");
	});

	it("returns genui for 'create a dashboard'", () => {
		const result = resolveRoutingDecisionFastPath({ prompt: "create a dashboard" });
		assert.equal(result.intent, "genui");
		assert.equal(result.presentation, "genui_card");
	});

	it("returns genui for architecture diagram requests", () => {
		const result = resolveRoutingDecisionFastPath({ prompt: "create an architecture diagram for this service" });
		assert.equal(result.intent, "genui");
		assert.equal(result.presentation, "genui_card");
		assert.equal(result.reason, "diagram_request");
	});

	it("returns null for ambiguous prompts", () => {
		const result = resolveRoutingDecisionFastPath({ prompt: "asdfghjkl" });
		assert.equal(result, null);
	});

	it("returns null for moderately ambiguous prompts", () => {
		const result = resolveRoutingDecisionFastPath({ prompt: "tell me about the project status" });
		assert.equal(result, null);
	});

	it("preserves voice origin", () => {
		const result = resolveRoutingDecisionFastPath({ prompt: "hello", origin: "voice" });
		assert.equal(result.origin, "voice");
	});

	it("defaults to text origin", () => {
		const result = resolveRoutingDecisionFastPath({ prompt: "hello" });
		assert.equal(result.origin, "text");
	});
});

// ---------------------------------------------------------------------------
// resolveRoutingDecision (full — Layer 1 + Layer 2)
// ---------------------------------------------------------------------------

describe("resolveRoutingDecision", () => {
	it("uses fast path for clear conversational prompt", async () => {
		const result = await resolveRoutingDecision({ prompt: "hello" });
		assert.equal(result.intent, "chat");
		assert.equal(result.presentation, "text");
	});

	it("uses fast path for artifact_create", async () => {
		const result = await resolveRoutingDecision({ prompt: "build a login page" });
		assert.equal(result.intent, "artifact_create");
		assert.equal(result.presentation, "artifact_preview");
	});

	it("uses fast path for activeArtifact", async () => {
		const result = await resolveRoutingDecision({
			prompt: "make the button red",
			activeArtifact: { id: "doc_1", title: "Login", kind: "code" },
		});
		assert.equal(result.intent, "artifact_update");
		assert.equal(result.presentation, "artifact_preview");
	});

	it("uses fast path for genui", async () => {
		const result = await resolveRoutingDecision({ prompt: "show Q3 revenue" });
		assert.equal(result.intent, "genui");
		assert.equal(result.presentation, "genui_card");
	});

	it("falls back to chat when no classifier provided and prompt is ambiguous", async () => {
		const result = await resolveRoutingDecision({ prompt: "asdfghjkl" });
		assert.equal(result.intent, "chat");
		assert.equal(result.reason, "no_classifier");
	});

	it("calls LLM classifier for ambiguous prompts", async () => {
		const classify = makeMockClassify({ intent: "artifact_create", confidence: 0.9, reason: "wants_to_build" });
		const result = await resolveRoutingDecision(
			{ prompt: "I need something for tracking tasks" },
			{ classify },
		);
		assert.equal(result.intent, "artifact_create");
		assert.equal(result.presentation, "artifact_preview");
		assert.equal(result.confidence, 0.9);
	});

	it("falls back to chat when LLM confidence is below text threshold", async () => {
		const classify = makeMockClassify({ intent: "artifact_create", confidence: 0.5, reason: "uncertain" });
		const result = await resolveRoutingDecision(
			{ prompt: "I need something for tracking tasks" },
			{ classify },
		);
		assert.equal(result.intent, "chat");
		assert.equal(result.presentation, "text");
		assert.ok(result.reason.startsWith("below_threshold"));
	});

	it("uses higher threshold for voice origin", async () => {
		const classify = makeMockClassify({ intent: "artifact_create", confidence: 0.75, reason: "might_build" });
		const result = await resolveRoutingDecision(
			{ prompt: "I need something for tracking tasks", origin: "voice" },
			{ classify },
		);
		// 0.75 < 0.8 (voice threshold) → fallback to chat
		assert.equal(result.intent, "chat");
		assert.equal(result.origin, "voice");
	});

	it("accepts voice classification above voice threshold", async () => {
		const classify = makeMockClassify({ intent: "artifact_create", confidence: 0.85, reason: "build_request" });
		const result = await resolveRoutingDecision(
			{ prompt: "I need something for tracking tasks", origin: "voice" },
			{ classify },
		);
		assert.equal(result.intent, "artifact_create");
		assert.equal(result.origin, "voice");
	});

	it("falls back to chat on LLM timeout", async () => {
		const classify = makeSlowClassify(200, { intent: "genui", confidence: 0.9 });
		const result = await resolveRoutingDecision(
			{ prompt: "something ambiguous" },
			{ classify, timeoutMs: 50 },
		);
		assert.equal(result.intent, "chat");
		assert.equal(result.reason, "classifier_error");
		assert.equal(result.confidence, 0);
	});

	it("falls back to chat on LLM error", async () => {
		const classify = makeFailingClassify(new Error("API down"));
		const result = await resolveRoutingDecision(
			{ prompt: "something ambiguous" },
			{ classify },
		);
		assert.equal(result.intent, "chat");
		assert.equal(result.reason, "classifier_error");
	});

	it("falls back to chat on unparseable LLM response", async () => {
		const classify = async () => "I don't understand the question";
		const result = await resolveRoutingDecision(
			{ prompt: "something ambiguous" },
			{ classify },
		);
		assert.equal(result.intent, "chat");
		assert.equal(result.reason, "unparseable_response");
	});

	it("chat intent from LLM is accepted even below threshold", async () => {
		const classify = makeMockClassify({ intent: "chat", confidence: 0.3, reason: "conversational" });
		const result = await resolveRoutingDecision(
			{ prompt: "something ambiguous" },
			{ classify },
		);
		// Chat is the safe default — no threshold gating needed
		assert.equal(result.intent, "chat");
	});
});

// ---------------------------------------------------------------------------
// Test matrix from spec
// ---------------------------------------------------------------------------

describe("test matrix from spec", () => {
	it("'hello' with no artifact → chat / text", async () => {
		const result = await resolveRoutingDecision({ prompt: "hello" });
		assert.equal(result.intent, "chat");
		assert.equal(result.presentation, "text");
	});

	it("'build a login page' with no artifact → artifact_create / artifact_preview", async () => {
		const result = await resolveRoutingDecision({ prompt: "build a login page" });
		assert.equal(result.intent, "artifact_create");
		assert.equal(result.presentation, "artifact_preview");
	});

	it("'make the button red' with active artifact → artifact_update / artifact_preview", async () => {
		const result = await resolveRoutingDecision({
			prompt: "make the button red",
			activeArtifact: { id: "doc_1", title: "Login", kind: "code" },
		});
		assert.equal(result.intent, "artifact_update");
		assert.equal(result.presentation, "artifact_preview");
	});

	it("'show Q3 revenue' with no artifact → genui / genui_card", async () => {
		const result = await resolveRoutingDecision({ prompt: "show Q3 revenue" });
		assert.equal(result.intent, "genui");
		assert.equal(result.presentation, "genui_card");
	});

	it("'asdfghjkl' with no artifact → chat / text", async () => {
		const classify = makeMockClassify({ intent: "chat", confidence: 0.9, reason: "gibberish" });
		const result = await resolveRoutingDecision({ prompt: "asdfghjkl" }, { classify });
		assert.equal(result.intent, "chat");
		assert.equal(result.presentation, "text");
	});

	it("'what is React?' with no artifact → chat / text", async () => {
		const result = await resolveRoutingDecision({ prompt: "what is React?" });
		assert.equal(result.intent, "chat");
		assert.equal(result.presentation, "text");
	});

	it("'chart of sales data' with no artifact → genui / genui_card", async () => {
		const result = await resolveRoutingDecision({ prompt: "chart of sales data" });
		assert.equal(result.intent, "genui");
		assert.equal(result.presentation, "genui_card");
	});

	it("'visualize the breakdown' with no artifact → genui / genui_card", async () => {
		const result = await resolveRoutingDecision({ prompt: "visualize the breakdown" });
		assert.equal(result.intent, "genui");
		assert.equal(result.presentation, "genui_card");
	});

	it("'create a dashboard' with no artifact → genui / genui_card", async () => {
		const result = await resolveRoutingDecision({ prompt: "create a dashboard" });
		assert.equal(result.intent, "genui");
		assert.equal(result.presentation, "genui_card");
	});
});

// ---------------------------------------------------------------------------
// Clarification flow (D6): low confidence → chat → RovoDev → question/plan cards
// ---------------------------------------------------------------------------

describe("clarification flow routing", () => {
	it("ambiguous 'create something' routes to chat for clarification", async () => {
		const classify = makeMockClassify({ intent: "artifact_create", confidence: 0.5, reason: "vague" });
		const result = await resolveRoutingDecision(
			{ prompt: "create something" },
			{ classify },
		);
		// Below threshold → falls back to chat, enabling RovoDev clarification
		assert.equal(result.intent, "chat");
		assert.equal(result.presentation, "text");
		// Confidence is preserved so frontend can detect fallback
		assert.ok(result.confidence < 0.7);
	});

	it("vague voice request also routes to chat for clarification", async () => {
		const classify = makeMockClassify({ intent: "artifact_create", confidence: 0.7, reason: "maybe" });
		const result = await resolveRoutingDecision(
			{ prompt: "build me something", origin: "voice" },
			{ classify },
		);
		// 0.7 < 0.8 (voice threshold) → chat fallback
		assert.equal(result.intent, "chat");
		assert.equal(result.presentation, "text");
		assert.equal(result.origin, "voice");
	});

	it("after clarification, clear artifact request routes correctly", async () => {
		// "build a login page" is a clear artifact pattern (build + page),
		// regardless of prior clarification history
		const result = await resolveRoutingDecision({
			prompt: "build a login page with auth",
			recentHistory: [
				{ role: "user", content: "build me something" },
				{ role: "assistant", content: "What kind of thing?" },
				{ role: "user", content: "build a login page with auth" },
			],
		});
		assert.equal(result.intent, "artifact_create");
		assert.equal(result.presentation, "artifact_preview");
	});
});

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------

describe("edge cases", () => {
	it("null context → chat", async () => {
		const result = await resolveRoutingDecision(null);
		assert.equal(result.intent, "chat");
	});

	it("undefined context → chat", async () => {
		const result = await resolveRoutingDecision(undefined);
		assert.equal(result.intent, "chat");
	});

	it("empty string prompt → chat", async () => {
		const result = await resolveRoutingDecision({ prompt: "" });
		assert.equal(result.intent, "chat");
	});

	it("activeArtifact without id is ignored", async () => {
		const result = await resolveRoutingDecision({
			prompt: "hello",
			activeArtifact: { title: "Login" },
		});
		assert.equal(result.intent, "chat");
		assert.notEqual(result.reason, "active_artifact");
	});

	it("fast path and full path agree on deterministic cases", async () => {
		const prompts = [
			{ prompt: "hello" },
			{ prompt: "build a login page" },
			{ prompt: "show Q3 revenue" },
			{ prompt: "create a dashboard" },
			{ prompt: "", },
		];

		for (const ctx of prompts) {
			const fast = resolveRoutingDecisionFastPath(ctx);
			const full = await resolveRoutingDecision(ctx);
			if (fast) {
				assert.equal(fast.intent, full.intent, `Mismatch for "${ctx.prompt}"`);
				assert.equal(fast.presentation, full.presentation, `Presentation mismatch for "${ctx.prompt}"`);
			}
		}
	});
});
