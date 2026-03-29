const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const {
	extractPlanWidgetPayloadFromExitPlanToolInput,
} = require("./plan-widget-fallback");

const SERVER_FILE = path.resolve(__dirname, "..", "server.js");
const SERVER_SOURCE = fs.readFileSync(SERVER_FILE, "utf8");

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

const MAYBE_EMIT_EXIT_PLAN_WIDGET_SOURCE = extractArrowFunctionExpression(
	"const maybeEmitExitPlanWidget = ({",
	"const emitTodoQueueData = (payload) => {",
	"maybeEmitExitPlanWidget",
);

function createConsoleStub() {
	return {
		info() {},
		log() {},
		warn() {},
		error() {},
	};
}

function evaluateFunctionSource(functionSource, context) {
	return vm.runInNewContext(`(${functionSource})`, context, {
		filename: SERVER_FILE,
	});
}

function createHarness({ hasEmittedPlanLoadingState = false } = {}) {
	const emittedPlanPayloads = [];
	const emittedLoadingStates = [];
	const context = {
		console: createConsoleStub(),
		extractPlanWidgetPayloadFromExitPlanToolInput,
		latestPlanPayload: null,
		hasExplicitPlanPayload: false,
		hasToolApprovalReadonlyFailure: false,
		latestProgressivePlanFingerprint: "progressive-plan-fingerprint",
		hasEmittedPlanLoadingState,
		emitPlanWidgetData: (payload) => {
			emittedPlanPayloads.push(payload);
		},
		emitPlanWidgetLoading: (loading) => {
			emittedLoadingStates.push(loading);
			context.hasEmittedPlanLoadingState = loading;
		},
	};

	return {
		context,
		emittedLoadingStates,
		emittedPlanPayloads,
		maybeEmitExitPlanWidget: evaluateFunctionSource(
			MAYBE_EMIT_EXIT_PLAN_WIDGET_SOURCE,
			context,
		),
	};
}

test("maybeEmitExitPlanWidget marks deferred exit-plan payloads as explicit plan state", () => {
	const harness = createHarness({ hasEmittedPlanLoadingState: true });
	const result = harness.maybeEmitExitPlanWidget({
		toolCallId: "tool-call-123",
		toolInput: JSON.stringify({
			plan: [
				"# My Day",
				"",
				"## Action items",
				"- [ ] Create route shell",
				"- [ ] Build planner layout",
			].join("\n"),
		}),
		source: "deferred_tool_request",
	});

	assert.equal(result, true);
	assert.equal(harness.context.hasExplicitPlanPayload, true);
	assert.equal(harness.context.latestProgressivePlanFingerprint, null);
	assert.equal(
		harness.context.latestPlanPayload?.deferredToolCallId,
		"tool-call-123",
	);
	assert.equal(harness.emittedPlanPayloads.length, 1);
	assert.equal(
		harness.emittedPlanPayloads[0]?.deferredToolCallId,
		"tool-call-123",
	);
	assert.deepEqual(harness.emittedLoadingStates, [false]);
});

test("maybeEmitExitPlanWidget leaves plan state untouched when tool input is invalid", () => {
	const harness = createHarness({ hasEmittedPlanLoadingState: true });
	const result = harness.maybeEmitExitPlanWidget({
		toolCallId: "tool-call-123",
		toolInput: JSON.stringify({ plan: "No runnable tasks here" }),
		source: "deferred_tool_request",
	});

	assert.equal(result, false);
	assert.equal(harness.context.hasExplicitPlanPayload, false);
	assert.equal(
		harness.context.latestProgressivePlanFingerprint,
		"progressive-plan-fingerprint",
	);
	assert.equal(harness.context.latestPlanPayload, null);
	assert.deepEqual(harness.emittedPlanPayloads, []);
	assert.deepEqual(harness.emittedLoadingStates, []);
});
