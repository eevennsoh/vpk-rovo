const test = require("node:test");
const { describe, it } = test;
const assert = require("node:assert/strict");

const { buildUserMessage, DEEP_PLAN_INSTRUCTION } = require("./config");

test("buildUserMessage plain-chat profile omits heavy protocol blocks", () => {
	const message = buildUserMessage("hi", [], undefined, {
		profile: "plain-chat",
	});

	assert.match(message, /\[Plain Chat Mode\]/);
	assert.doesNotMatch(message, /\[Clarification Protocol\]/);
	assert.doesNotMatch(message, /\[Interactive Visual UI Protocol\]/);
	assert.doesNotMatch(message, /\[Figma Tool Protocol\]/);
});

test("buildUserMessage omits GenUI protocol during plan-mode context", () => {
	const message = buildUserMessage(
		"Here are my clarification answers",
		[],
		[
			"[POST-CLARIFICATION — Plan Mode]",
			"Plan mode is enabled.",
			"Proceed directly to plan generation now by calling exit_plan_mode with a concise markdown plan.",
			"[End POST-CLARIFICATION]",
		].join("\n"),
	);

	assert.match(message, /\[Deep Plan Protocol\]/);
	assert.doesNotMatch(message, /\[Interactive Visual UI Protocol\]/);
});

it("buildUserMessage plain-chat profile limits conversation history", () => {
	const history = [
		{ type: "user", content: "one" },
		{ type: "assistant", content: "two" },
		{ type: "user", content: "three" },
		{ type: "assistant", content: "four" },
		{ type: "user", content: "five" },
		{ type: "assistant", content: "six" },
	];

	const message = buildUserMessage("hi", history, undefined, {
		profile: "plain-chat",
	});

	assert.doesNotMatch(message, /User: one/);
	assert.doesNotMatch(message, /Assistant: two/);
	assert.match(message, /User: three/);
	assert.match(message, /Assistant: six/);
});

describe("DEEP_PLAN_INSTRUCTION — Test Case 11: Q&A ordering rules", () => {
	it("is a non-empty string", () => {
		assert.ok(typeof DEEP_PLAN_INSTRUCTION === "string");
		assert.ok(DEEP_PLAN_INSTRUCTION.length > 100);
	});

	it("contains protocol boundaries", () => {
		assert.ok(DEEP_PLAN_INSTRUCTION.includes("[Deep Plan Protocol]"));
		assert.ok(DEEP_PLAN_INSTRUCTION.includes("[End Deep Plan Protocol]"));
	});

	it("rule 1: Q&A BEFORE plan — ask_user_questions before exit_plan_mode", () => {
		assert.ok(
			DEEP_PLAN_INSTRUCTION.includes("ask_user_questions") &&
			DEEP_PLAN_INSTRUCTION.includes("BEFORE") &&
			DEEP_PLAN_INSTRUCTION.includes("exit_plan_mode"),
			"Rule 1 must instruct Q&A before plan",
		);
	});

	it("rule 1 allows additional clarification rounds when details are still missing", () => {
		assert.match(
			DEEP_PLAN_INSTRUCTION,
			/you may call `ask_user_questions` again/i,
		);
	});

	it("rule 2: NEVER Q&A AFTER plan — prohibits ask_user_questions after exit_plan_mode", () => {
		assert.ok(
			DEEP_PLAN_INSTRUCTION.includes("NEVER Q&A AFTER plan"),
			"Rule 2 heading must exist",
		);

		const rule2Match = DEEP_PLAN_INSTRUCTION.match(
			/NEVER Q&A AFTER plan.*?exit_plan_mode.*?do NOT call.*?ask_user_questions/is
		);
		assert.ok(
			rule2Match,
			"Rule 2 must prohibit ask_user_questions after exit_plan_mode in the same turn",
		);
	});

	it("rule 3: MUST use exit_plan_mode — plans must use the tool, not free text", () => {
		assert.ok(
			DEEP_PLAN_INSTRUCTION.includes("MUST use `exit_plan_mode`"),
			"Rule 3 must enforce exit_plan_mode for plans",
		);

		assert.ok(
			DEEP_PLAN_INSTRUCTION.includes("Never output plan content as free-form text"),
			"Rule 3 must prohibit free-form text plans",
		);
	});

	it("rule 5: one plan per turn", () => {
		assert.ok(
			DEEP_PLAN_INSTRUCTION.includes("One plan per turn") ||
			DEEP_PLAN_INSTRUCTION.includes("at most once per turn"),
			"Rule 5 must limit exit_plan_mode to once per turn",
		);
	});

	it("references plan mode rather than enableDeepPlan coupling", () => {
		assert.ok(
			DEEP_PLAN_INSTRUCTION.includes("plan mode is active"),
			"Instruction must reference the serve plan mode contract",
		);
		assert.doesNotMatch(DEEP_PLAN_INSTRUCTION, /enableDeepPlan/);
	});

	it("requires exit_plan_mode as the build handoff", () => {
		assert.match(
			DEEP_PLAN_INSTRUCTION,
			/finish the planning interaction by calling `exit_plan_mode`/i,
		);
	});

	it("states that approval returns the agent to default mode before implementation", () => {
		assert.match(
			DEEP_PLAN_INSTRUCTION,
			/switch you back to `default` mode before implementation/i,
		);
	});
});
