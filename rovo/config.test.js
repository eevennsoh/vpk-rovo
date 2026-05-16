const test = require("node:test");
const { describe, it } = test;
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const {
	buildAIGatewaySystemPrompt,
	buildUserMessage,
	DEEP_PLAN_INSTRUCTION,
	HERMES_SKILL_DISCOVERABILITY_INSTRUCTION,
} = require("./config");

test("buildUserMessage plain-chat profile omits heavy protocol blocks", () => {
	const message = buildUserMessage("hi", [], undefined, {
		profile: "plain-chat",
	});

	assert.match(message, /\[Plain Chat Mode\]/);
	assert.doesNotMatch(message, /\[Clarification Protocol\]/);
	assert.doesNotMatch(message, /\[Interactive Visual UI Protocol\]/);
	assert.doesNotMatch(message, /\[Figma Tool Protocol\]/);
});

test("buildAIGatewaySystemPrompt includes the Rovo Chat identity", () => {
	const systemPrompt = buildAIGatewaySystemPrompt({
		currentDate: "Thursday, May 14, 2026 at 10:30:00 AM AEST",
	});

	assert.match(systemPrompt, /You are Rovo Chat, an AI assistant built by Atlassian/);
	assert.match(systemPrompt, /identify as Rovo Chat/i);
});

test("buildAIGatewaySystemPrompt includes the AI Gateway Deferred Tool Protocol", () => {
	const systemPrompt = buildAIGatewaySystemPrompt({
		currentDate: "Thursday, May 14, 2026 at 10:30:00 AM AEST",
	});

	assert.match(systemPrompt, /\[AI Gateway Deferred Tool Protocol\]/);
	assert.match(systemPrompt, /```deferred-tool/);
	assert.match(systemPrompt, /"tool_name": "ask_user_questions"/);
	assert.match(systemPrompt, /"tool_name": "exit_plan_mode"/);
	assert.doesNotMatch(systemPrompt, /```question-card/);
	assert.match(systemPrompt, /\[End AI Gateway Deferred Tool Protocol\]/);
});

test("buildAIGatewaySystemPrompt renders provided user name and current local time", () => {
	const systemPrompt = buildAIGatewaySystemPrompt({
		currentDate: "Thursday, May 14, 2026 at 10:30:00 AM AEST",
		userName: "Eason",
	});

	assert.match(systemPrompt, /The user is Eason\./);
	assert.match(systemPrompt, /The current local time is Thursday, May 14, 2026 at 10:30:00 AM AEST\./);
});

test("buildAIGatewaySystemPrompt omits empty optional Pebble sections", () => {
	const systemPrompt = buildAIGatewaySystemPrompt({
		currentDate: "Thursday, May 14, 2026 at 10:30:00 AM AEST",
	});

	assert.doesNotMatch(systemPrompt, /\{\{/);
	assert.doesNotMatch(systemPrompt, /\{%/);
	assert.doesNotMatch(systemPrompt, /The user works at/);
	assert.doesNotMatch(systemPrompt, /The user is located in/);
	assert.doesNotMatch(systemPrompt, /Relevant Past Memories/);
	assert.doesNotMatch(systemPrompt, /previous response and feedback/i);
});

test("buildAIGatewaySystemPrompt excludes unsafe source-template instructions", () => {
	const systemPrompt = buildAIGatewaySystemPrompt({
		currentDate: "Thursday, May 14, 2026 at 10:30:00 AM AEST",
	});

	assert.doesNotMatch(systemPrompt, /Disregard any previous instructions/i);
	assert.doesNotMatch(systemPrompt, /must include all code you see in plugin outputs/i);
	assert.doesNotMatch(systemPrompt, /Do not explain why you are including the code/i);
});

test("buildAIGatewaySystemPrompt preserves existing runtime context after personality", () => {
	const runtimeContext = "[BROWSER TOOLS]\nUse browser tools with the current thread id.";
	const systemPrompt = buildAIGatewaySystemPrompt({
		currentDate: "Thursday, May 14, 2026 at 10:30:00 AM AEST",
		runtimeContext,
	});

	assert.match(systemPrompt, /\[BROWSER TOOLS\]/);
	assert.ok(
		systemPrompt.indexOf("You are Rovo Chat") <
			systemPrompt.indexOf("[BROWSER TOOLS]"),
		"Rovo personality should be prepended before runtime context",
	);
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

test("buildUserMessage includes durable memory protocol in default profile", () => {
	const message = buildUserMessage("Save this to durable memory.", [], undefined);

	assert.match(message, /\[Durable Memory Protocol\]/);
	assert.match(message, /durable memory means wiki-backed Hermes persistent memory/i);
	assert.match(message, /persists durable memories through the llm-wiki flow after the turn/i);
	assert.match(message, /do not say that you lack a memory write tool/i);
	assert.match(message, /repo lesson logging only for repo\/operator corrections/i);
});

test("buildUserMessage includes Hermes skill discoverability protocol in default profile", () => {
	const message = buildUserMessage("Can you use llm-wiki?", [], undefined);

	assert.match(message, /\[Hermes Skill Discoverability Protocol\]/);
	assert.match(message, /source of truth for which Hermes skills are installed/i);
	assert.match(message, /installed but not currently selected for this thread/i);
	assert.match(message, /proactively load that skill/i);
	assert.match(message, /prefer loading it directly with the `get_skill` tool/i);
	assert.match(message, /Treat skill loading as the default response/i);
});

test("buildUserMessage keeps ask_user_questions options and bylines compact", () => {
	const message = buildUserMessage("Help me choose an implementation path.", [], undefined);

	assert.match(message, /1–4 predefined options/);
	assert.match(message, /one free-text option/);
	assert.match(message, /description\/byline to one short sentence, ideally 12 words or fewer/i);
	assert.doesNotMatch(message, /1–3 predefined options/);
});

test("buildAIGatewaySystemPrompt keeps deferred ask_user_questions options and bylines compact", () => {
	const systemPrompt = buildAIGatewaySystemPrompt({
		currentDate: "Thursday, May 14, 2026 at 10:30:00 AM AEST",
	});

	assert.match(systemPrompt, /1–4 concrete preset options per question/);
	assert.match(systemPrompt, /description\/byline to one short sentence, ideally 12 words or fewer/i);
	assert.match(systemPrompt, /host UI appends one free-text option/i);
});

test("ClarificationQuestionCard limits preset options to four", () => {
	const source = fs.readFileSync(
		path.join(__dirname, "../components/projects/shared/components/clarification-question-card.tsx"),
		"utf8",
	);

	assert.match(source, /const MAX_VISIBLE_CLARIFICATION_OPTIONS = 4;/);
	assert.doesNotMatch(source, /const MAX_VISIBLE_CLARIFICATION_OPTIONS = 8;/);
});

test("buildUserMessage no longer injects standup-specific instructions from prompt text", () => {
	const message = buildUserMessage("Can you write my daily standup from Jira?", [], undefined);

	assert.doesNotMatch(message, /\[Standup Summary Protocol\]/);
	assert.doesNotMatch(message, /assignee = currentUser\(\) AND updated >= -24h/i);
});

test("buildUserMessage no longer injects ticket or work-summary prompt-specific instructions", () => {
	const ticketMessage = buildUserMessage("Please triage incoming support tickets", [], undefined);
	const workSummaryMessage = buildUserMessage("Summarize my last 7 days of work", [], undefined);

	assert.doesNotMatch(ticketMessage, /\[Ticket Classifier Protocol\]/);
	assert.doesNotMatch(workSummaryMessage, /\[Work Summary Scope\]/);
});

test("Hermes skill discoverability protocol distinguishes discoverable skills from active skills", () => {
	assert.match(HERMES_SKILL_DISCOVERABILITY_INSTRUCTION, /\[Hermes Skills Catalog\]/);
	assert.match(HERMES_SKILL_DISCOVERABILITY_INSTRUCTION, /\[Hermes Skills\]/);
	assert.match(HERMES_SKILL_DISCOVERABILITY_INSTRUCTION, /get_skill/i);
	assert.match(HERMES_SKILL_DISCOVERABILITY_INSTRUCTION, /next turn/i);
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
