const test = require("node:test");
const assert = require("node:assert/strict");

const {
	normalizeIntent,
	parseClassification,
	buildClassifierPrompt,
	classifySmartGenerationIntent,
} = require("./smart-generation-intent");

test("normalizeIntent maps supported values", () => {
	assert.equal(normalizeIntent("normal"), "normal");
	assert.equal(normalizeIntent("genui"), "genui");
	assert.equal(normalizeIntent("audio"), "audio");
	assert.equal(normalizeIntent("image"), "image");
	assert.equal(normalizeIntent("both"), "both");
});

test("normalizeIntent falls back by keyword", () => {
	assert.equal(normalizeIntent("ui-generation"), "genui");
	assert.equal(normalizeIntent("voice output"), "audio");
	assert.equal(normalizeIntent("generate image"), "image");
	assert.equal(normalizeIntent("both outputs"), "both");
	assert.equal(normalizeIntent("something else"), "normal");
});

test("parseClassification reads JSON payload", () => {
	const parsed = parseClassification('{"intent":"genui","confidence":0.91,"reason":"builds UI"}');
	assert.equal(parsed.intent, "genui");
	assert.equal(parsed.confidence, 0.91);
	assert.equal(parsed.reason, "builds UI");
});

test("parseClassification handles non-JSON fallback", () => {
	const parsed = parseClassification("audio");
	assert.equal(parsed.intent, "audio");
	assert.equal(parsed.confidence, null);
});

test("buildClassifierPrompt includes latest message and truncated history", () => {
	const prompt = buildClassifierPrompt({
		latestUserMessage: "Generate a dashboard and narrate it",
		conversationHistory: [
			{ type: "user", content: "Hi" },
			{ type: "assistant", content: "Hello" },
		],
	});
	assert.match(prompt, /Latest user request:/);
	assert.match(prompt, /Generate a dashboard and narrate it/);
	assert.match(prompt, /User: Hi/);
	assert.match(prompt, /Assistant: Hello/);
});

test("classifySmartGenerationIntent returns parsed classifier output", async () => {
	const result = await classifySmartGenerationIntent({
		latestUserMessage: "Create a kanban board",
		conversationHistory: [],
		classify: async () => '{"intent":"genui","confidence":0.88,"reason":"explicit ui request"}',
	});
	assert.equal(result.intent, "genui");
	assert.equal(result.confidence, 0.88);
	assert.equal(result.timedOut, false);
	assert.equal(result.error, null);
});

test("classifySmartGenerationIntent times out to normal", async () => {
	const result = await classifySmartGenerationIntent({
		latestUserMessage: "Create a kanban board",
		conversationHistory: [],
		classify: () => new Promise((resolve) => setTimeout(() => resolve('{"intent":"audio"}'), 30)),
		timeoutMs: 5,
	});
	assert.equal(result.intent, "normal");
	assert.equal(result.timedOut, true);
});

test("classifySmartGenerationIntent aborts classifier call when timeout elapses", async () => {
	let observedAbort = false;
	const result = await classifySmartGenerationIntent({
		latestUserMessage: "Generate a dashboard",
		conversationHistory: [],
		timeoutMs: 5,
		classify: ({ signal }) =>
			new Promise(() => {
				if (!signal) {
					return;
				}
				signal.addEventListener("abort", () => {
					observedAbort = true;
				});
			}),
	});

	assert.equal(result.intent, "normal");
	assert.equal(result.timedOut, true);
	assert.equal(observedAbort, true);
});
