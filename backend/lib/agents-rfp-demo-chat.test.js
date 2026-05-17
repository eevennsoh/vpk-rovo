const test = require("node:test");
const assert = require("node:assert/strict");
const {
	RFP_DEMO_REPORT_PREVIEW_SUMMARY,
	RFP_DEMO_REPORT_TITLE,
	RFP_DEMO_QUESTION_SESSION_ID,
	RFP_DEMO_QUESTION_TOOL_CALL_ID,
	buildAgentsRfpDemoAnswerTrace,
	buildAgentsRfpDemoQualificationTrace,
	buildAgentsRfpDemoQuestionCardPayload,
	buildAgentsRfpDemoReportConfirmationText,
	getAgentsRfpDemoToolCallDelayMs,
	getAgentsRfpDemoPreloadDelayMs,
	getLatestUserMessageText,
	resolveAgentsRfpDemoChatTurn,
} = require("./agents-rfp-demo-chat");

const RFP_101_CONTEXT = [
	"[Active Jira Work Item Context]",
	"Key: RFP-101",
	"Title: Qualify enterprise service-management RFP",
	"[End Active Jira Work Item Context]",
].join("\n");

const RFP_HELP_PROMPT = [
	"Help me complete this RFP. Give me a bid/no-bid recommendation first,",
	"then draft a first-pass response strategy covering ITSM, CMDB, asset",
	"management, and AI compliance. Use everything in this ticket and the",
	"attached documents.",
].join("\n");

test("detects the real RFP-101 floating-chat help turn from active context", () => {
	const turn = resolveAgentsRfpDemoChatTurn({
		contextDescription: RFP_101_CONTEXT,
		messages: [
			{
				role: "user",
				parts: [{ type: "text", text: RFP_HELP_PROMPT }],
			},
		],
	});

	assert.equal(turn, "qualification-questions");
});

test("does not trigger the RFP demo turn from board fallback context alone", () => {
	const turn = resolveAgentsRfpDemoChatTurn({
		contextDescription: "[Agents Board Context]\nRFP-101: Qualify enterprise service-management RFP\n[End Agents Board Context]",
		messages: [
			{
				role: "user",
				parts: [{ type: "text", text: RFP_HELP_PROMPT }],
			},
		],
	});

	assert.equal(turn, null);
});

test("detects the RFP demo clarification answer turn by question session", () => {
	const turn = resolveAgentsRfpDemoChatTurn({
		contextDescription: RFP_101_CONTEXT,
		clarification: {
			sessionId: RFP_DEMO_QUESTION_SESSION_ID,
			answers: {
				"deal-size": "$2.4M ARR",
			},
		},
		messages: [
			{
				role: "user",
				metadata: { source: "clarification-submit" },
				parts: [{ type: "text", text: "Here are my clarification answers." }],
			},
		],
	});

	assert.equal(turn, "qualification-answer");
});

test("builds the shared question-card payload expected by compact chat", () => {
	const payload = buildAgentsRfpDemoQuestionCardPayload();

	assert.equal(payload.type, "question-card");
	assert.equal(payload.sessionId, RFP_DEMO_QUESTION_SESSION_ID);
	assert.equal(payload.maxRounds, 1);
	assert.equal(payload.questions.length, 4);
	assert.deepEqual(
		payload.questions.map((question) => question.id),
		[
			"deal-size",
			"incumbent",
			"audience",
			"review-posture",
		],
	);
	assert.ok(payload.questions.every((question) => question.options.length > 0));
	assert.ok(payload.questions.some((question) => question.kind === "multi-select"));
});

test("RFP demo tool-call delay varies between one and three seconds", () => {
	assert.equal(getAgentsRfpDemoToolCallDelayMs(() => 0), 1000);
	assert.equal(getAgentsRfpDemoToolCallDelayMs(() => 0.5), 2000);
	assert.equal(getAgentsRfpDemoToolCallDelayMs(() => 1), 3000);
});

test("RFP demo qualification turn preloads before the trace starts", () => {
	assert.equal(getAgentsRfpDemoPreloadDelayMs("qualification-questions"), 2000);
	assert.equal(getAgentsRfpDemoPreloadDelayMs("qualification-answer"), 0);
	assert.equal(getAgentsRfpDemoPreloadDelayMs(null), 0);
});

test("qualification trace leaves ask_user_questions awaiting a question card", () => {
	const trace = buildAgentsRfpDemoQualificationTrace();
	const finalStep = trace.at(-1);

	assert.equal(trace.length, 6);
	assert.equal(finalStep.toolName, "ask_user_questions");
	assert.equal(finalStep.toolCallId, RFP_DEMO_QUESTION_TOOL_CALL_ID);
	assert.equal(finalStep.input.questions, 4);
	assert.equal(finalStep.outputPreview, undefined);
});

test("answer trace produces completed response-building steps", () => {
	const trace = buildAgentsRfpDemoAnswerTrace();

	assert.deepEqual(
		trace.map((step) => step.toolName),
		[
			"rfp.apply_qualification_answers",
			"rfp.build_response_strategy",
			"rfp.flag_reviews",
			"agent_skill.load",
			"vpk_html.distill_fields",
			"vpk_html.render_template",
			"vpk_html.validate_artifact",
		],
	);
	assert.ok(trace.every((step) => typeof step.outputPreview === "string" && step.outputPreview.length > 0));
});

test("report confirmation points the user at Rovo Canvas", () => {
	assert.equal(RFP_DEMO_REPORT_TITLE, "RFP-101 response strategy report");
	assert.match(RFP_DEMO_REPORT_PREVIEW_SUMMARY, /Offline vpk-html report/u);
	assert.match(
		buildAgentsRfpDemoReportConfirmationText({
			documentId: "doc-123",
			title: RFP_DEMO_REPORT_TITLE,
		}),
		/Generated \*\*RFP-101 response strategy report\*\*[\s\S]*\[Open it in Rovo Canvas\]\(#rovo-canvas-doc-123\)/u,
	);
});

test("extracts the latest user message text from AI SDK UI parts", () => {
	const text = getLatestUserMessageText([
		{ role: "user", parts: [{ type: "text", text: "Old" }] },
		{ role: "assistant", parts: [{ type: "text", text: "Reply" }] },
		{ role: "user", parts: [{ type: "text", text: "New" }] },
	]);

	assert.equal(text, "New");
});
