const test = require("node:test");
const assert = require("node:assert/strict");
const {
	AGENTS2_OMNI_LIVE_AGENT_ID,
	AGENTS2_OMNI_LIVE_AGENT_NAME,
	AGENTS2_OMNI_LIVE_OUTLINE_PREVIEW_SUMMARY,
	AGENTS2_OMNI_LIVE_OUTLINE_TITLE,
	RFP_DEMO_REPORT_PREVIEW_SUMMARY,
	RFP_DEMO_REPORT_TITLE,
	RFP_DEMO_QUESTION_SESSION_ID,
	RFP_DEMO_QUESTION_TOOL_CALL_ID,
	buildAgents2OmniLiveAgentCreationConfirmationText,
	buildAgents2OmniLiveAgentCreationTrace,
	buildAgents2OmniLiveAgentResultPayload,
	buildAgents2OmniLiveOutlineConfirmationText,
	buildAgents2OmniLiveOutlineTrace,
	buildAgentsRfpDemoAnswerTrace,
	buildAgentsRfpDemoAgentCreationConfirmationText,
	buildAgentsRfpDemoAgentCreationTrace,
	buildAgentsRfpDemoAgentResultPayload,
	buildAgentsRfpDemoQualificationTrace,
	buildAgentsRfpDemoQuestionCardPayload,
	buildAgentsRfpDemoReportConfirmationText,
	getAgentsRfpDemoToolCallDelayMs,
	getAgentsRfpDemoPreloadDelayMs,
	getLatestUserMessageText,
	resolveAgents2OmniLiveChatTurn,
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

const OMNI_101_CONTEXT = [
	"[Active Jira Work Item Context]",
	"Source: /agents2 Omni Live work item modal.",
	"Key: OMNI-101",
	"Title: Live demo: Define live-demo-first landing page narrative",
	"Description: Omni Live needs a public landing page that makes the live demo tangible.",
	"Launch milestones: Developer Preview May 28, Public Beta June 18, GA July 9.",
	"[End Active Jira Work Item Context]",
].join("\n");

const OMNI_AGENT_CREATION_CONTEXT = [
	"[Agents VoiceMate Creation Request]",
	"Source: /agents2 VoiceMate agent onboarding.",
	"Board: Omni Live Launch.",
	"Column: Outline Drafting.",
	"Trigger: On event: ticket enters Outline Drafting.",
	"Expected output: create the agent, add it to this Jira project, attach a landing-page outline, flag missing brand/content inputs, and move ready work toward Experience Build in the local demo flow.",
	"[End Agents VoiceMate Creation Request]",
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

test("detects the Agents2 Omni Live outline turn from OMNI-101 context", () => {
	const turn = resolveAgents2OmniLiveChatTurn({
		contextDescription: OMNI_101_CONTEXT,
		messages: [
			{
				role: "user",
				parts: [{ type: "text", text: "Generate an Omni Live landing-page outline" }],
			},
		],
	});

	assert.equal(turn, "omni-outline-create");
});

test("detects the Agents2 Omni Live outline turn after clarification answers", () => {
	const turn = resolveAgents2OmniLiveChatTurn({
		contextDescription: OMNI_101_CONTEXT,
		messages: [
			{
				role: "user",
				metadata: { source: "clarification-submit" },
				parts: [{
					type: "text",
					text: [
						"Here are my clarification answers for \"Answer these questions to continue\":",
						"",
						"- What format should the landing page output take?: HTML mockup",
						"- Which audience should the hero lead with?: Balanced split",
						"- How prominent should the launch milestones be?: Footer band",
					].join("\n"),
				}],
			},
		],
	});

	assert.equal(turn, "omni-outline-create");
});

test("does not trigger Agents2 Omni Live outline turns without OMNI-101 context", () => {
	const turn = resolveAgents2OmniLiveChatTurn({
		contextDescription: "[Agents2 Board Context]\nOMNI-101: Live demo narrative\n[End Agents2 Board Context]",
		messages: [
			{
				role: "user",
				parts: [{ type: "text", text: "Generate an Omni Live landing-page outline" }],
			},
		],
	});

	assert.equal(turn, null);
});

test("detects the Agents2 VoiceMate creation turn from onboarding context", () => {
	const turn = resolveAgents2OmniLiveChatTurn({
		contextDescription: OMNI_AGENT_CREATION_CONTEXT,
		creationMode: "agent",
		messages: [
			{
				role: "user",
				parts: [{ type: "text", text: "Create VoiceMate to draft landing-page outlines for similar Omni Live launch work items." }],
			},
		],
	});

	assert.equal(turn, "omni-agent-creation");
});

test("detects the RFP demo clarification answer turn by question session", () => {
	const turn = resolveAgentsRfpDemoChatTurn({
		contextDescription: RFP_101_CONTEXT,
		clarification: {
			sessionId: RFP_DEMO_QUESTION_SESSION_ID,
			answers: {
				budget: "Qualified strategic budget",
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
	assert.equal(payload.questions.length, 5);
	assert.deepEqual(
		payload.questions.map((question) => question.id),
		[
			"budget",
			"stakeholder-relationship",
			"campaign-fit",
			"competitive-position",
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
	assert.equal(finalStep.input.questions, 5);
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

test("Agents2 Omni Live outline trace uses generate-html one-pager steps", () => {
	const trace = buildAgents2OmniLiveOutlineTrace();

	assert.deepEqual(
		trace.map((step) => step.toolName),
		[
			"jira.read_work_item",
			"jira.scan_attachments",
			"teamwork_graph.search",
			"omni.map_page_story",
			"omni.check_content_gaps",
			"agent_skill.load",
			"generate_html.distill_fields",
			"generate_html.render_one_pager",
			"generate_html.validate_artifact",
		],
	);
	assert.equal(trace.find((step) => step.toolName === "agent_skill.load")?.label, "Using generate-html skill");
	assert.equal(trace.find((step) => step.toolName === "agent_skill.load")?.input.skill, "generate-html");
	assert.match(trace.map((step) => step.content).join("\n"), /landing-page outline/u);
	assert.match(trace.map((step) => step.outputPreview).join("\n"), /May 28 \/ June 18 \/ July 9/u);
	assert.ok(trace.every((step) => typeof step.outputPreview === "string" && step.outputPreview.length > 0));
});

test("Agents2 VoiceMate creation trace maps the custom agent to Outline Drafting", () => {
	const trace = buildAgents2OmniLiveAgentCreationTrace();
	const result = buildAgents2OmniLiveAgentResultPayload();

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
		trace.filter((step) => step.toolName === "agent_skill.load").map((step) => step.input.skill),
		["create-agent", "create-automation"],
	);
	assert.equal(result.agentId, AGENTS2_OMNI_LIVE_AGENT_ID);
	assert.equal(result.name, AGENTS2_OMNI_LIVE_AGENT_NAME);
	assert.equal(result.assignedColumn, "Outline Drafting");
	assert.match(result.trigger, /ticket enters Outline Drafting/u);
	assert.match(result.tools.join(" "), /generate-html one-pagers/u);
	assert.match(buildAgents2OmniLiveAgentCreationConfirmationText(result), /Created \*\*VoiceMate\*\*/u);
	assert.match(buildAgents2OmniLiveAgentCreationConfirmationText(result), /Omni Live Launch project/u);
	assert.doesNotMatch(trace.map((step) => step.toolName).join("\n"), /generate_pdf/u);
});

test("agent creation trace creates an agent instead of rendering another report", () => {
	const trace = buildAgentsRfpDemoAgentCreationTrace();
	const result = buildAgentsRfpDemoAgentResultPayload();

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
		["Using create-agent skill", "Using create-automation skill"],
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
	assert.match(result.summary, /similar RFP work items/u);
	assert.match(result.trigger, /ticket enters Drafting/u);
	assert.match(result.tools.join(" "), /PDF draft attachment/u);
	assert.match(result.guardrail, /Skips completed tickets/u);
	assert.match(
		trace.find((step) => step.toolName === "agent.write_instructions")?.content ?? "",
		/description, conversation starters/u,
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

test("Agents2 outline confirmation points the user at Rovo Canvas", () => {
	assert.equal(AGENTS2_OMNI_LIVE_OUTLINE_TITLE, "Omni Live landing-page outline");
	assert.match(AGENTS2_OMNI_LIVE_OUTLINE_PREVIEW_SUMMARY, /HTML one-pager landing-page outline/u);
	assert.match(
		buildAgents2OmniLiveOutlineConfirmationText({
			documentId: "doc-omni",
			title: AGENTS2_OMNI_LIVE_OUTLINE_TITLE,
		}),
		/Generated \*\*Omni Live landing-page outline\*\* with the generate-html skill[\s\S]*\[Open it in Rovo Canvas\]\(#rovo-canvas-doc-omni\)[\s\S]*HTML one-pager content brief/u,
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
