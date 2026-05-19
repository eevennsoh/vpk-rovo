const test = require("node:test");
const assert = require("node:assert/strict");
const {
	RFP_DEMO_REPORT_PREVIEW_SUMMARY,
	RFP_DEMO_REPORT_TITLE,
	RFP_DEMO_QUESTION_SESSION_ID,
	RFP_DEMO_QUESTION_TOOL_CALL_ID,
	buildAgentsRfpDemoAnswerTrace,
	buildAgentsRfpDemoAgentCreationConfirmationText,
	buildAgentsRfpDemoAgentCreationTrace,
	buildAgentsRfpDemoAgentResultPayload,
	buildAgentsRfpDemoQualificationTrace,
	buildAgentsRfpDemoQuestionCardPayload,
	buildAgentsRfpDemoReportConfirmationText,
	extractAgentsRfpDemoSelectedKnowledge,
	getAgentsRfpDemoToolCallDelayMs,
	getAgentsRfpDemoPreloadDelayMs,
	getLatestUserMessageText,
	resolveAgentsRfpDemoChatTurn,
} = require("./agents-rfp-demo-chat");

const RFP_101_CONTEXT = [
	"[Active Jira Work Item Context]",
	"Key: RFP-101",
	"Title: Acmecorp: Prepare for bid recommendation for ESM RFP",
	"[End Active Jira Work Item Context]",
].join("\n");

const RFP_HELP_PROMPT = [
	"Should we respond to this RFP? Give me a bid/no-bid recommendation",
	"and qualification DACI covering ITSM, CMDB, asset management,",
	"AI compliance, legal, security, budget, and stakeholder posture.",
].join("\n");
const RFP_SHORT_HELP_PROMPT = "Should we respond to this RFP?";
const RFP_PREPARE_HELP_PROMPT = "Can you recommend whether we should bid on this RFP?";
const RFP_REVIEW_COMPLETE_PROMPT = "Should Atlassian respond to this RFP?";

const RFP_AGENT_CREATION_CONTEXT = [
	"[Agents RFP Demo Local State]",
	"Source: backend-persisted /agents RFP demo state.",
	"Report stage: attached.",
	"Generated attachments on RFP-101: Acmecorp RFP qualification DACI.pdf.",
	"Custom agent: not created.",
	"Trigger: none.",
	"[End Agents RFP Demo Local State]",
].join("\n");

const RFP_AGENT_CREATION_PROMPT = [
	"Create an RFP Drafter for the Drafting column on the Enterprise RFP Response board.",
	"The agent should read each RFP work item and stage reusable report work.",
].join("\n");

test("detects the real RFP-101 floating-chat qualification turn from active context", () => {
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

test("detects the short RFP-101 qualification turn from active context", () => {
	const turn = resolveAgentsRfpDemoChatTurn({
		contextDescription: RFP_101_CONTEXT,
		messages: [
			{
				role: "user",
				parts: [{ type: "text", text: RFP_SHORT_HELP_PROMPT }],
			},
		],
	});

	assert.equal(turn, "qualification-questions");
});

test("detects the simple RFP-101 bid recommendation turn from active context", () => {
	const turn = resolveAgentsRfpDemoChatTurn({
		contextDescription: RFP_101_CONTEXT,
		messages: [
			{
				role: "user",
				parts: [{ type: "text", text: RFP_PREPARE_HELP_PROMPT }],
			},
		],
	});

	assert.equal(turn, "qualification-questions");
});

test("detects the RFP-101 should-we-respond greeting turn from active context", () => {
	const turn = resolveAgentsRfpDemoChatTurn({
		contextDescription: RFP_101_CONTEXT,
		messages: [
			{
				role: "user",
				parts: [{ type: "text", text: RFP_REVIEW_COMPLETE_PROMPT }],
			},
		],
	});

	assert.equal(turn, "qualification-questions");
});

test("does not trigger the RFP demo turn for passive RFP questions", () => {
	for (const prompt of [
		"Who owns this RFP?",
		"Who should prepare this RFP?",
	]) {
		const turn = resolveAgentsRfpDemoChatTurn({
			contextDescription: RFP_101_CONTEXT,
			messages: [
				{
					role: "user",
					parts: [{ type: "text", text: prompt }],
				},
			],
		});

		assert.equal(turn, null, prompt);
	}
});

test("detects the RFP demo agent creation turn from attached report state", () => {
	const turn = resolveAgentsRfpDemoChatTurn({
		contextDescription: RFP_AGENT_CREATION_CONTEXT,
		creationMode: "agent",
		messages: [
			{
				role: "user",
				parts: [{ type: "text", text: RFP_AGENT_CREATION_PROMPT }],
			},
		],
	});

	assert.equal(turn, "agent-creation");
});

test("does not treat generic agent creation as the RFP demo agent turn", () => {
	const turn = resolveAgentsRfpDemoChatTurn({
		contextDescription: RFP_AGENT_CREATION_CONTEXT,
		creationMode: "agent",
		messages: [
			{
				role: "user",
				parts: [{ type: "text", text: "Create an agent for legal review." }],
			},
		],
	});

	assert.equal(turn, null);
});

test("does not trigger the RFP demo turn from board fallback context alone", () => {
	const turn = resolveAgentsRfpDemoChatTurn({
		contextDescription: "[Agents Board Context]\nRFP-101: Acmecorp: Prepare for bid recommendation for ESM RFP\n[End Agents Board Context]",
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
				"knowledge-source": "reusable-answer-library",
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
	assert.equal(payload.questions.length, 3);
	assert.deepEqual(
		payload.questions.map((question) => question.id),
		[
			"agent-focus",
			"knowledge-source",
			"review-posture",
		],
	);
	assert.ok(payload.questions.every((question) => question.options.length > 0));
	assert.ok(payload.questions.every((question) => question.options.length <= 3));
	assert.deepEqual(
		payload.questions[1].options.map((option) => option.label),
		[
			"Reusable answer library",
			"Customer/account context",
			"Product and security evidence",
		],
	);
	assert.ok(payload.questions.every((question) => question.kind === "single-select"));
});

test("extracts selected RFP knowledge from clarification answers for agent creation", () => {
	assert.equal(
		extractAgentsRfpDemoSelectedKnowledge({
			clarification: {
				answers: {
					"knowledge-source": "product-security-evidence",
				},
			},
		}),
		"Product and security evidence",
	);
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
	assert.equal(finalStep.input.questions, 3);
	assert.equal(finalStep.outputPreview, undefined);
});

test("answer trace produces completed qualification DACI steps", () => {
	const trace = buildAgentsRfpDemoAnswerTrace();

	assert.deepEqual(
		trace.map((step) => step.toolName),
		[
			"rfp.apply_qualification_answers",
			"rfp.build_bid_recommendation",
			"rfp.flag_reviews",
			"agent_skill.load",
			"generate_pdf.distill_fields",
			"generate_pdf.render_document",
			"generate_pdf.validate_artifact",
		],
	);
	assert.equal(trace.find((step) => step.toolName === "agent_skill.load")?.label, "Using generate-pdf skill");
	assert.equal(trace.find((step) => step.toolName === "agent_skill.load")?.input.skill, "generate-pdf");
	assert.ok(trace.every((step) => typeof step.outputPreview === "string" && step.outputPreview.length > 0));
});

test("agent creation trace creates an agent instead of rendering another report", () => {
	const trace = buildAgentsRfpDemoAgentCreationTrace({
		selectedKnowledge: "Product and security evidence",
	});
	const result = buildAgentsRfpDemoAgentResultPayload({
		selectedKnowledge: "Product and security evidence",
	});

	assert.deepEqual(
		trace.map((step) => step.toolName),
		[
			"jira.inspect_board_column",
			"agent_skill.load",
			"agent.define_trigger",
			"agent.configure_tools",
			"agent.write_instructions",
			"teamwork_graph.link_knowledge",
			"agent_skill.load",
			"agent.define_rerun_policy",
			"agent.persist_definition",
		],
	);
	assert.deepEqual(
		trace.filter((step) => step.toolName === "agent_skill.load").map((step) => step.label),
		["Using agent-creator skill", "Using create-automation skill"],
	);
	assert.ok(
		trace
			.filter((step) => step.toolName === "agent_skill.load")
			.every((step) => step.delayMs === 4500),
	);
	assert.ok(trace.every((step) => typeof step.outputPreview === "string" && step.outputPreview.length > 0));
	assert.equal(result.agentId, "rfp-drafting-agent");
	assert.equal(result.name, "RFP Drafter");
	assert.match(result.description, /Drafts first-pass RFP response packages/u);
	assert.deepEqual(result.conversationStarters, [
		"Draft the response package for the next Drafting ticket.",
		"Summarize blockers before this RFP can move to Review.",
		"Create reusable answer snippets from the attached RFP packet.",
	]);
	assert.equal(result.assignedColumn, "Drafting");
	assert.equal(result.action, "create");
	assert.equal(result.knowledgePath, ".agents/knowledge/rfp-drafting-agent/");
	assert.equal(result.selectedKnowledge, "Product and security evidence");
	assert.deepEqual(result.seedKnowledge, [
		".agents/knowledge/rfp-drafting-agent/product-security-evidence.md",
	]);
	assert.match(result.summary, /similar RFP work items/u);
	assert.match(result.trigger, /ticket enters Drafting/u);
	assert.match(result.tools.join(" "), /PDF draft attachment/u);
	assert.match(result.guardrail, /Skips completed tickets/u);
	assert.match(
		trace.find((step) => step.toolName === "agent.write_instructions")?.content ?? "",
		/description, conversation starters/u,
	);
	assert.equal(
		trace.find((step) => step.toolName === "teamwork_graph.link_knowledge")?.input.selectedKnowledge,
		"Product and security evidence",
	);
	assert.match(buildAgentsRfpDemoAgentCreationConfirmationText(result), /Created \*\*RFP Drafter\*\*/u);
	assert.match(buildAgentsRfpDemoAgentCreationConfirmationText(result), /added it to the Enterprise RFP Response project/u);
	assert.match(buildAgentsRfpDemoAgentCreationConfirmationText(result), /PDF draft/u);
	assert.doesNotMatch(
		trace.map((step) => step.toolName).join("\n"),
		/generate_pdf\.render_document/u,
	);
	assert.doesNotMatch(buildAgentsRfpDemoAgentCreationConfirmationText(result), /approval/u);
});

test("report confirmation points the user at Rovo Canvas", () => {
	assert.equal(RFP_DEMO_REPORT_TITLE, "Acmecorp RFP qualification DACI");
	assert.match(RFP_DEMO_REPORT_PREVIEW_SUMMARY, /PDF-ready one-pager/u);
	assert.match(
		buildAgentsRfpDemoReportConfirmationText({
			documentId: "doc-123",
			title: RFP_DEMO_REPORT_TITLE,
		}),
		/Generated \*\*Acmecorp RFP qualification DACI\*\* with the generate-pdf skill[\s\S]*\[Open it in Rovo Canvas\]\(#rovo-canvas-doc-123\)[\s\S]*qualification DACI/u,
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
