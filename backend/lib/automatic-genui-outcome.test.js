const test = require("node:test");
const assert = require("node:assert/strict");

const { resolveAutomaticGenuiOutcome } = require("./automatic-genui-outcome");

test("resolveAutomaticGenuiOutcome returns widget output for renderable non-low-confidence specs", () => {
	const outcome = resolveAutomaticGenuiOutcome({
		genuiResult: {
			spec: {
				root: "main",
				elements: {
					main: {
						type: "Card",
						props: { title: "Overview" },
						children: [],
					},
				},
			},
			quality: "high_confidence",
		},
		successSource: "two-step-genui-llm-default",
		successSummary: "Generated interactive view",
	});

	assert.deepEqual(outcome, {
		kind: "widget",
		spec: {
			root: "main",
			elements: {
				main: {
					type: "Card",
					props: { title: "Overview" },
					children: [],
				},
			},
		},
		summary: "Generated interactive view",
		source: "two-step-genui-llm-default",
	});
});

test("resolveAutomaticGenuiOutcome fails low-confidence specs instead of masking them with fallback widgets", () => {
	const outcome = resolveAutomaticGenuiOutcome({
		genuiResult: {
			spec: {
				root: "main",
				elements: {
					main: {
						type: "Card",
						props: { title: "Overview" },
						children: [],
					},
				},
			},
			quality: "low_confidence",
		},
		successSource: "two-step-genui-llm-default",
		successSummary: "Generated interactive view",
	});

	assert.deepEqual(outcome, {
		kind: "failure",
		code: "low_confidence_spec",
		message: "I couldn't produce a renderable interactive summary from tool output.",
	});
});

test("resolveAutomaticGenuiOutcome fails when no renderable spec exists", () => {
	const outcome = resolveAutomaticGenuiOutcome({
		genuiResult: {
			spec: null,
			quality: "unknown",
		},
		successSource: "two-step-genui-llm-default",
		successSummary: "Generated interactive view",
	});

	assert.deepEqual(outcome, {
		kind: "failure",
		code: "missing_renderable_spec",
		message: "I couldn't produce a renderable interactive summary from tool output.",
	});
});
