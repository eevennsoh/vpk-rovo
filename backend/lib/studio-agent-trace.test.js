const test = require("node:test");
const assert = require("node:assert/strict");
const {
	buildStudioAgentCreationTrace,
	__internals: { detectMentionedTools, summarizeQAExchange, deriveAgentNameHint, truncate },
} = require("./studio-agent-trace");

test("buildStudioAgentCreationTrace emits the fixed step skeleton with stable ordering", () => {
	const steps = buildStudioAgentCreationTrace({
		userPrompt: "Build a research agent.",
		messages: [],
	});

	const labels = steps.map((step) => step.label);
	assert.deepEqual(labels, [
		"Reading your brief",
		"Selecting tools",
		"Drafting instructions",
		"Naming the agent",
		"Saving the agent profile",
	]);
});

test("buildStudioAgentCreationTrace inserts 'Reviewing your answers' when a prior assistant question exists", () => {
	const steps = buildStudioAgentCreationTrace({
		userPrompt: "Frontend bugs, please.",
		messages: [
			{ role: "user", content: "Make me a triage agent." },
			{ role: "assistant", content: "What domain should it focus on?" },
		],
	});

	const labels = steps.map((step) => step.label);
	assert.deepEqual(labels, [
		"Reading your brief",
		"Reviewing your answers",
		"Selecting tools",
		"Drafting instructions",
		"Naming the agent",
		"Saving the agent profile",
	]);

	const reviewStep = steps[1];
	assert.match(reviewStep.outputPreview, /What domain/);
	assert.match(reviewStep.outputPreview, /Frontend bugs/);
});

test("buildStudioAgentCreationTrace skips 'Reviewing your answers' when there is no prior assistant turn", () => {
	const steps = buildStudioAgentCreationTrace({
		userPrompt: "Make me an agent.",
		messages: [{ role: "user", content: "Hi" }],
	});

	const labels = steps.map((step) => step.label);
	assert.equal(labels.includes("Reviewing your answers"), false);
});

test("each step has the shape writeThinkingTraceSteps consumes", () => {
	const steps = buildStudioAgentCreationTrace({
		userPrompt: "Build a Confluence summarizer agent.",
	});

	for (const step of steps) {
		assert.equal(typeof step.toolName, "string");
		assert.equal(typeof step.toolCallId, "string");
		assert.equal(typeof step.label, "string");
		assert.ok(step.toolCallId.length > 0);
		assert.ok(step.label.length > 0);
	}
});

test("detectMentionedTools picks up multi-tool prompts", () => {
	assert.deepEqual(
		detectMentionedTools("Pull Jira issues, post to Slack, drop a Confluence page."),
		["Jira", "Confluence", "Slack"],
	);
});

test("detectMentionedTools returns empty when no integrations are mentioned", () => {
	assert.deepEqual(detectMentionedTools("Just a friendly chat agent."), []);
});

test("detectMentionedTools handles empty/non-string input safely", () => {
	assert.deepEqual(detectMentionedTools(""), []);
	assert.deepEqual(detectMentionedTools(undefined), []);
	assert.deepEqual(detectMentionedTools(null), []);
});

test("Selecting tools step reflects detected integrations in the input + preview", () => {
	const steps = buildStudioAgentCreationTrace({
		userPrompt: "An agent that watches GitHub PRs and pings Slack on review requests.",
	});
	const selectStep = steps.find((s) => s.label === "Selecting tools");
	assert.ok(selectStep);
	assert.deepEqual(selectStep.input.mentioned.sort(), ["GitHub", "Slack"].sort());
	assert.match(selectStep.outputPreview, /GitHub/);
	assert.match(selectStep.outputPreview, /Slack/);
});

test("Selecting tools step reports a sensible fallback when no integrations are mentioned", () => {
	const steps = buildStudioAgentCreationTrace({ userPrompt: "Just a helpful tutor." });
	const selectStep = steps.find((s) => s.label === "Selecting tools");
	assert.match(selectStep.outputPreview, /No tool integrations/i);
});

test("deriveAgentNameHint extracts an explicit '<adjective> agent' phrase from the prompt", () => {
	assert.equal(deriveAgentNameHint("Build a research-briefing agent please"), "research-briefing agent");
	assert.equal(deriveAgentNameHint("I need a Jira triage agent"), "Jira triage agent");
});

test("deriveAgentNameHint falls back to a verb-based summary when no explicit pattern is present", () => {
	const hint = deriveAgentNameHint("It summarizes weekly standups for the team");
	assert.match(hint, /agent that summari/i);
});

test("deriveAgentNameHint returns the generic placeholder when nothing matches", () => {
	assert.equal(deriveAgentNameHint(""), "an agent");
	assert.equal(deriveAgentNameHint(undefined), "an agent");
});

test("summarizeQAExchange combines the most recent assistant question and the user's current answer", () => {
	const summary = summarizeQAExchange(
		[
			{ role: "user", content: "First message" },
			{ role: "assistant", content: "Got it — which team owns this?" },
		],
		"Frontend platform.",
	);
	assert.match(summary, /which team/);
	assert.match(summary, /Frontend platform/);
});

test("summarizeQAExchange ignores assistant turns without question marks", () => {
	const summary = summarizeQAExchange(
		[{ role: "assistant", content: "Sounds good." }],
		"Frontend platform.",
	);
	// Falls back to just the answer.
	assert.match(summary, /Frontend platform/);
	assert.equal(/Sounds good/.test(summary), false);
});

test("truncate adds an ellipsis only when content exceeds the limit", () => {
	assert.equal(truncate("short", 50), "short");
	const long = "a".repeat(200);
	const truncated = truncate(long, 50);
	assert.equal(truncated.length, 50);
	assert.equal(truncated.endsWith("…"), true);
});

test("toolCallIds are unique within a single trace so generated eventIds don't collide", () => {
	const steps = buildStudioAgentCreationTrace({
		userPrompt: "Build a research agent.",
		messages: [{ role: "assistant", content: "What domain?" }, { role: "user", content: "AI" }],
	});
	const ids = steps.map((s) => s.toolCallId);
	assert.equal(new Set(ids).size, ids.length, `expected unique toolCallIds, got ${ids.join(", ")}`);
});
