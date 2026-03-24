const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const { adaptClarificationAnswers } = require("./ask-user-questions-adapter");
const {
	buildQuestionCardPayloadFromRequestUserInput,
} = require("./question-card-payload");
const { MAX_LABEL_LENGTH: CLARIFICATION_MAX_LABEL_LENGTH } = require("./question-card-extractor");
const { getNonEmptyString } = require("./shared-utils");

const SERVER_FILE = path.resolve(__dirname, "..", "server.js");
const SERVER_SOURCE = fs.readFileSync(SERVER_FILE, "utf8");

const SAFE_JSON_PARSE_SOURCE = extractSourceBetweenMarkers(
	"function safeJsonParse(rawValue) {",
	"function extractClassifierJsonCandidate(rawText) {",
);
const NORMALIZE_REQUEST_USER_INPUT_QUESTION_META_SOURCE = extractSourceBetweenMarkers(
	"function normalizeRequestUserInputQuestionMeta(questionMeta) {",
	"function buildRequestUserInputQuestionFingerprintFromMeta(questionMeta) {",
);
const BUILD_REQUEST_USER_INPUT_QUESTION_FINGERPRINT_FROM_META_SOURCE =
	extractSourceBetweenMarkers(
		"function buildRequestUserInputQuestionFingerprintFromMeta(questionMeta) {",
		"function buildRequestUserInputQuestionFingerprintFromInput(questionInput) {",
	);
const BUILD_REQUEST_USER_INPUT_QUESTION_FINGERPRINT_FROM_INPUT_SOURCE =
	extractSourceBetweenMarkers(
		"function buildRequestUserInputQuestionFingerprintFromInput(questionInput) {",
		"function getClarificationSubmissionQuestionFingerprint(clarificationSubmission) {",
	);
const GET_CLARIFICATION_SUBMISSION_QUESTION_FINGERPRINT_SOURCE =
	extractSourceBetweenMarkers(
		"function getClarificationSubmissionQuestionFingerprint(clarificationSubmission) {",
		"function createClarificationFallbackSubmission({",
	);
const CREATE_CLARIFICATION_FALLBACK_SUBMISSION_SOURCE = extractSourceBetweenMarkers(
	"function createClarificationFallbackSubmission({",
	"function parseRovoDevResponseBody(rawValue) {",
);
const PARSE_ROVODEV_RESPONSE_BODY_SOURCE = extractSourceBetweenMarkers(
	"function parseRovoDevResponseBody(rawValue) {",
	"function isDeferredToolResponseAccepted(responseBody) {",
);
const IS_DEFERRED_TOOL_RESPONSE_ACCEPTED_SOURCE = extractSourceBetweenMarkers(
	"function isDeferredToolResponseAccepted(responseBody) {",
	"function buildClarificationResumeDenyMessage(clarificationSubmission) {",
);
const BUILD_CLARIFICATION_RESUME_DENY_MESSAGE_SOURCE = extractSourceBetweenMarkers(
	"function buildClarificationResumeDenyMessage(clarificationSubmission) {",
	"function buildApprovalResumeDecision(approvalSubmission) {",
);
const BUILD_PAUSED_TOOL_CONTINUATION_MESSAGE_INPUT_SOURCE =
	extractSourceBetweenMarkers(
		"function buildPausedToolContinuationMessageInput({",
		"function getLatestAssistantWidgetPayload(messages) {",
	);
const HANDLE_PAUSED_CONTINUATION_SOURCE = extractArrowFunctionExpression(
	"const handlePausedContinuation = async ({ rawEvent, control }) => {",
	"// Synthesise a DeferredToolResponse from clarification answers",
	"handlePausedContinuation",
);
const PATH_A_FALLBACK_SNIPPET_SOURCE = extractSourceBetweenMarkers(
	"const fallbackClarificationSubmission =",
	"} else {",
);

function extractSourceBetweenMarkers(startMarker, endMarker) {
	const startIndex = SERVER_SOURCE.indexOf(startMarker);
	assert.notEqual(
		startIndex,
		-1,
		`Expected to find start marker in server.js: ${startMarker}`,
	);

	const endIndex = SERVER_SOURCE.indexOf(endMarker, startIndex);
	assert.notEqual(
		endIndex,
		-1,
		`Expected to find end marker in server.js: ${endMarker}`,
	);

	return SERVER_SOURCE.slice(startIndex, endIndex).trim();
}

function extractArrowFunctionExpression(startMarker, endMarker, constName) {
	const blockSource = extractSourceBetweenMarkers(startMarker, endMarker);
	const prefix = `const ${constName} = `;
	assert.equal(
		blockSource.startsWith(prefix),
		true,
		`Expected arrow function assignment for ${constName}`,
	);

	const expressionSource = blockSource.slice(prefix.length).trim();
	return expressionSource.endsWith(";")
		? expressionSource.slice(0, -1)
		: expressionSource;
}

function evaluateFunctionSource(functionSource, context) {
	return vm.runInNewContext(`(${functionSource})`, context, {
		filename: SERVER_FILE,
	});
}

function createConsoleStub() {
	return {
		info() {},
		log() {},
		warn() {},
		error() {},
	};
}

function toPlainValue(value) {
	return JSON.parse(JSON.stringify(value));
}

function createServerHelperContext({
	questionMetaStore = new Map(),
	adaptAnswersForToolContract,
} = {}) {
	const context = {
		console: createConsoleStub(),
		getNonEmptyString,
		buildQuestionCardPayloadFromRequestUserInput,
		CLARIFICATION_WIDGET_TYPE: "question-card",
		CLARIFICATION_MAX_PRESET_OPTIONS: 8,
		CLARIFICATION_CUSTOM_OPTION_PLACEHOLDER: "Tell Rovo what to do...",
		CLARIFICATION_MAX_LABEL_LENGTH,
		createClarificationSessionId: () => "clarification-test-session",
		_requestUserInputQuestionMetaStore: questionMetaStore,
	};

	context.safeJsonParse = evaluateFunctionSource(SAFE_JSON_PARSE_SOURCE, context);
	context.normalizeRequestUserInputQuestionMeta = evaluateFunctionSource(
		NORMALIZE_REQUEST_USER_INPUT_QUESTION_META_SOURCE,
		context,
	);
	context.buildRequestUserInputQuestionFingerprintFromMeta =
		evaluateFunctionSource(
			BUILD_REQUEST_USER_INPUT_QUESTION_FINGERPRINT_FROM_META_SOURCE,
			context,
		);
	context.buildRequestUserInputQuestionFingerprintFromInput =
		evaluateFunctionSource(
			BUILD_REQUEST_USER_INPUT_QUESTION_FINGERPRINT_FROM_INPUT_SOURCE,
			context,
		);
	context.getClarificationSubmissionQuestionFingerprint =
		evaluateFunctionSource(
			GET_CLARIFICATION_SUBMISSION_QUESTION_FINGERPRINT_SOURCE,
			context,
		);
	context.createClarificationFallbackSubmission = evaluateFunctionSource(
		CREATE_CLARIFICATION_FALLBACK_SUBMISSION_SOURCE,
		context,
	);
	context.parseRovoDevResponseBody = evaluateFunctionSource(
		PARSE_ROVODEV_RESPONSE_BODY_SOURCE,
		context,
	);
	context.isDeferredToolResponseAccepted = evaluateFunctionSource(
		IS_DEFERRED_TOOL_RESPONSE_ACCEPTED_SOURCE,
		context,
	);
	context.adaptClarificationAnswersForToolContract =
		typeof adaptAnswersForToolContract === "function"
			? adaptAnswersForToolContract
			: (sessionId, answers) =>
				adaptClarificationAnswers(
					sessionId,
					answers,
					questionMetaStore.get(sessionId) || null,
				);
	context.buildClarificationResumeDenyMessage = evaluateFunctionSource(
		BUILD_CLARIFICATION_RESUME_DENY_MESSAGE_SOURCE,
		context,
	);
	context.buildPausedToolContinuationMessageInput = evaluateFunctionSource(
		BUILD_PAUSED_TOOL_CONTINUATION_MESSAGE_INPUT_SOURCE,
		context,
	);

	return context;
}

function createReplayHarness({
	pausedToolCallRecord,
	clarificationSubmission,
	questionMetaStore,
}) {
	const context = createServerHelperContext({ questionMetaStore });
	const emitRequestUserInputQuestionCardCalls = [];
	const registerPausedRovoDevToolCallCalls = [];
	const updatePlanSessionCalls = [];
	const appendPlanCardIdCalls = [];
	const resumeCalls = [];

	Object.assign(context, {
		pausedToolCallRecord,
		clarificationSubmission,
		threadId: "thread-123",
		rovoDevSessionId: "rovo-session-123",
		sessionMode: "plan",
		hasObservedDeferredToolRequest: false,
		pausedToolCallHandled: false,
		hasEmittedPlanWidget: false,
		isRequestUserInputTool: (toolName) => {
			const normalizedToolName = getNonEmptyString(toolName)?.toLowerCase();
			return normalizedToolName === "ask_user_questions";
		},
		isExitPlanModeTool: () => false,
		getDeferredToolPartInput: (part) => part?.input ?? null,
		extractDeferredPlanWidgetPayload: () => null,
		emitPlanWidgetData: () => {},
		emitRequestUserInputQuestionCard: (payload) => {
			emitRequestUserInputQuestionCardCalls.push(payload);
		},
		registerPausedRovoDevToolCall: (payload) => {
			registerPausedRovoDevToolCallCalls.push(payload);
		},
		updatePlanSession: (threadId, payload) => {
			updatePlanSessionCalls.push({ threadId, payload });
		},
		appendPlanCardId: (threadId, planId) => {
			appendPlanCardIdCalls.push({ threadId, planId });
		},
	});

	const handlePausedContinuation = evaluateFunctionSource(
		HANDLE_PAUSED_CONTINUATION_SOURCE,
		context,
	);

	return {
		context,
		emitRequestUserInputQuestionCardCalls,
		registerPausedRovoDevToolCallCalls,
		updatePlanSessionCalls,
		appendPlanCardIdCalls,
		resumeCalls,
		handlePausedContinuation: (rawEvent) =>
			handlePausedContinuation({
				rawEvent,
				control: {
					port: pausedToolCallRecord.port,
					resume: async (payload) => {
						resumeCalls.push(payload);
						return { resumed: true };
					},
					disconnect: () => {},
					reservePort: () => pausedToolCallRecord.handle || null,
				},
			}),
	};
}

async function runPathAFallbackSnippet(contextOverrides = {}) {
	const context = createServerHelperContext(contextOverrides);
	const rovoDevResumeToolCallsCalls = [];
	const rovoDevRequestCalls = [];
	const replayViaRovoDevCalls = [];
	const requestError = contextOverrides.requestError || null;
	const requestResponse =
		contextOverrides.requestResponse ??
		{
			status: 200,
			data: JSON.stringify({ response: "Deferred tools set" }),
		};

	Object.assign(context, {
		pausedToolCallRecord:
			contextOverrides.pausedToolCallRecord || {
				toolCallId: "tool-call-123",
				port: 8001,
			},
		enrichedContextDescription:
			contextOverrides.enrichedContextDescription ??
			"[ask_user_questions Result]\nUse the clarified answers to continue.",
		clarificationSubmission:
			contextOverrides.clarificationSubmission || null,
		deferredToolResponse:
			contextOverrides.deferredToolResponse || {
				tool_call_id: "tool-call-123",
				result: {
					"What kind of app?": ["Dashboard"],
				},
			},
		rovoDevRequest: async (...args) => {
			rovoDevRequestCalls.push(args);
			if (requestError) {
				throw requestError;
			}
			return requestResponse;
		},
		rovoDevResumeToolCalls: async (...args) => {
			rovoDevResumeToolCallsCalls.push(args);
			return { resumed: true };
		},
		streamCommonOptions:
			contextOverrides.streamCommonOptions || {
				onTextDelta: () => {},
			},
		handlePausedContinuation:
			contextOverrides.handlePausedContinuation || (async () => ({ disconnect: false })),
		replayViaRovoDev: async (args) => {
			replayViaRovoDevCalls.push(args);
		},
	});

	const result = await vm.runInNewContext(
		`(async () => {
			${PATH_A_FALLBACK_SNIPPET_SOURCE}
			return {
				fallbackClarificationSubmission,
				fallbackDenyMessage,
				setChatAccepted,
				setChatFailure,
				shouldUseDenyMessageFallback,
				resumeResponse,
			};
		})()`,
		context,
		{ filename: SERVER_FILE },
	);

	return {
		result,
		rovoDevRequestCalls,
		rovoDevResumeToolCallsCalls,
		replayViaRovoDevCalls,
	};
}

test("Path A resumes paused clarification via deny_message without queueing DeferredToolResponse", async () => {
	const {
		result,
		rovoDevRequestCalls,
		rovoDevResumeToolCallsCalls,
		replayViaRovoDevCalls,
	} =
		await runPathAFallbackSnippet();

	assert.equal(rovoDevRequestCalls.length, 0);
	assert.equal(result.setChatAccepted, false);
	assert.equal(result.shouldUseDenyMessageFallback, true);
	assert.equal(rovoDevResumeToolCallsCalls.length, 1);
	assert.equal(replayViaRovoDevCalls.length, 1);
	assert.equal(replayViaRovoDevCalls[0].port, 8001);
	assert.equal(replayViaRovoDevCalls[0].portHandle, undefined);
	assert.equal(
		replayViaRovoDevCalls[0].skipReplayUntilToolCallId,
		"tool-call-123",
	);
	assert.equal(typeof replayViaRovoDevCalls[0].onTextDelta, "function");
	assert.equal(typeof replayViaRovoDevCalls[0].onPausedToolCalls, "function");
	assert.deepEqual(toPlainValue(rovoDevResumeToolCallsCalls[0]), [
		8001,
		{
			decisions: [
				{
					tool_call_id: "tool-call-123",
					deny_message: [
						"The user answered the clarification questions.",
						"Use these answers instead of calling the clarification tool again:",
						"- What kind of app?: Dashboard",
					].join("\n"),
				},
			],
		},
	]);
});

test("Path A no longer depends on set_chat_message success for clarification replay", async () => {
	const { result, rovoDevResumeToolCallsCalls, replayViaRovoDevCalls } = await runPathAFallbackSnippet({
		requestResponse: {
			status: 503,
			data: JSON.stringify({ response: "Chat message set" }),
		},
	});

	assert.equal(result.setChatAccepted, false);
	assert.equal(result.shouldUseDenyMessageFallback, true);
	assert.equal(replayViaRovoDevCalls.length, 1);
	assert.deepEqual(toPlainValue(result.fallbackClarificationSubmission), {
		sessionId: "request-user-input-tool-call-123",
		answers: {
			"What kind of app?": ["Dashboard"],
		},
	});
	assert.equal(rovoDevResumeToolCallsCalls.length, 1);
	assert.match(
		rovoDevResumeToolCallsCalls[0][1].decisions[0].deny_message,
		/- What kind of app\?: Dashboard/u,
	);
});

test("Path A ignores set_chat_message transport errors for paused clarification replay", async () => {
	const { result, rovoDevResumeToolCallsCalls, replayViaRovoDevCalls } = await runPathAFallbackSnippet({
		requestError: new Error("network down"),
	});

	assert.equal(result.setChatAccepted, false);
	assert.equal(result.shouldUseDenyMessageFallback, true);
	assert.equal(result.setChatFailure ?? null, null);
	assert.equal(replayViaRovoDevCalls.length, 1);
	assert.equal(rovoDevResumeToolCallsCalls.length, 1);
	assert.match(
		rovoDevResumeToolCallsCalls[0][1].decisions[0].deny_message,
		/The user answered the clarification questions\./u,
	);
});

test("replay duplicate suppression resumes replayed ask_user_questions with deny_message", async () => {
	const clarificationSubmission = {
		sessionId: "request-user-input-tool-call-123",
		answers: {
			"q-1": "dashboard",
		},
	};
	const questionMetaStore = new Map([
		[
			clarificationSubmission.sessionId,
			[
				{
					id: "q-1",
					label: "What kind of app?",
					options: [
						{ id: "dashboard", label: "Dashboard" },
						{ id: "docs", label: "Documentation" },
					],
				},
			],
		],
	]);
	const harness = createReplayHarness({
		pausedToolCallRecord: {
			kind: "clarification",
			toolCallId: "tool-call-123",
			port: 8123,
			handle: null,
		},
		clarificationSubmission,
		questionMetaStore,
	});

	const result = await harness.handlePausedContinuation({
		parts: [
			{
				tool_name: "ask_user_questions",
				tool_call_id: "tool-call-456",
				input: {
					result: {
						questions: [
							{
								id: "q-1",
								question: "What kind of app?",
								options: [
									{ id: "dashboard", label: "Dashboard" },
									{ id: "docs", label: "Documentation" },
								],
							},
						],
					},
				},
			},
		],
	});

	assert.equal(result.disconnect, false);
	assert.equal(harness.resumeCalls.length, 1);
	assert.deepEqual(toPlainValue(harness.resumeCalls[0]), {
		decisions: [
			{
				tool_call_id: "tool-call-456",
				deny_message: [
					"The user answered the clarification questions.",
					"Use these answers instead of calling the clarification tool again:",
					"- What kind of app?: Dashboard",
				].join("\n"),
			},
		],
	});
	assert.equal(harness.emitRequestUserInputQuestionCardCalls.length, 0);
	assert.equal(harness.registerPausedRovoDevToolCallCalls.length, 0);
	assert.equal(harness.updatePlanSessionCalls.length, 0);
	assert.equal(harness.context.hasObservedDeferredToolRequest, false);
	assert.equal(harness.context.pausedToolCallHandled, false);
});

test("replay duplicate suppression ignores the original resumed tool call boundary", async () => {
	const harness = createReplayHarness({
		pausedToolCallRecord: {
			kind: "clarification",
			toolCallId: "tool-call-123",
			port: 8123,
			handle: null,
		},
		clarificationSubmission: {
			sessionId: "request-user-input-tool-call-123",
			answers: { "q-1": "dashboard" },
		},
		questionMetaStore: new Map(),
	});

	const result = await harness.handlePausedContinuation({
		parts: [
			{
				tool_name: "ask_user_questions",
				tool_call_id: "tool-call-123",
				input: {
					questions: [
						{
							id: "q-1",
							question: "What kind of app?",
							options: [{ id: "dashboard", label: "Dashboard" }],
						},
					],
				},
			},
		],
	});

	assert.equal(result.disconnect, false);
	assert.equal(harness.resumeCalls.length, 0);
	assert.equal(harness.emitRequestUserInputQuestionCardCalls.length, 0);
	assert.equal(harness.registerPausedRovoDevToolCallCalls.length, 0);
	assert.equal(harness.updatePlanSessionCalls.length, 0);
});

test("replay continuation emits a new clarification card for changed follow-up questions", async () => {
	const clarificationSubmission = {
		sessionId: "request-user-input-tool-call-123",
		answers: {
			"q-1": "dashboard",
		},
	};
	const questionMetaStore = new Map([
		[
			clarificationSubmission.sessionId,
			[
				{
					id: "q-1",
					label: "What kind of app?",
					options: [
						{ id: "dashboard", label: "Dashboard" },
						{ id: "docs", label: "Documentation" },
					],
				},
			],
		],
	]);
	const handle = { release() {} };
	const followUpHarness = createReplayHarness({
		pausedToolCallRecord: {
			kind: "clarification",
			toolCallId: "tool-call-123",
			port: 8123,
			handle,
		},
		clarificationSubmission,
		questionMetaStore,
	});

	const result = await followUpHarness.handlePausedContinuation({
		parts: [
			{
				tool_name: "ask_user_questions",
				tool_call_id: "tool-call-789",
				input: {
					questions: [
						{
							id: "q-2",
							question: "Which deployment target should we use?",
							options: [
								{ id: "cloud", label: "Cloud" },
								{ id: "dc", label: "Data Center" },
							],
						},
					],
				},
			},
		],
	});

	assert.equal(result.disconnect, true);
	assert.equal(followUpHarness.resumeCalls.length, 0);
	assert.deepEqual(toPlainValue(followUpHarness.emitRequestUserInputQuestionCardCalls), [
		{
			toolName: "ask_user_questions",
			toolCallId: "tool-call-789",
			questionInput: {
				questions: [
					{
						id: "q-2",
						question: "Which deployment target should we use?",
						options: [
							{ id: "cloud", label: "Cloud" },
							{ id: "dc", label: "Data Center" },
						],
					},
				],
			},
			source: "deferred_tool_request",
		},
	]);
	assert.equal(followUpHarness.registerPausedRovoDevToolCallCalls.length, 1);
	assert.equal(
		followUpHarness.registerPausedRovoDevToolCallCalls[0].toolCallId,
		"tool-call-789",
	);
	assert.equal(followUpHarness.registerPausedRovoDevToolCallCalls[0].port, 8123);
	assert.equal(followUpHarness.registerPausedRovoDevToolCallCalls[0].handle, handle);
	assert.equal(
		followUpHarness.registerPausedRovoDevToolCallCalls[0].threadId,
		"thread-123",
	);
	assert.equal(
		followUpHarness.registerPausedRovoDevToolCallCalls[0].sessionId,
		"rovo-session-123",
	);
	assert.equal(
		followUpHarness.registerPausedRovoDevToolCallCalls[0].sessionMode,
		"plan",
	);
	assert.equal(
		followUpHarness.registerPausedRovoDevToolCallCalls[0].kind,
		"clarification",
	);
	assert.deepEqual(toPlainValue(followUpHarness.updatePlanSessionCalls), [
		{
			threadId: "thread-123",
			payload: {
				isActive: true,
				phase: "qa",
				deferredToolCallId: "tool-call-789",
			},
		},
	]);
	assert.equal(followUpHarness.context.hasObservedDeferredToolRequest, true);
	assert.equal(followUpHarness.context.pausedToolCallHandled, true);
});
