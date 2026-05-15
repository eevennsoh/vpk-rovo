const test = require("node:test");
const assert = require("node:assert/strict");
const Module = require("node:module");
const path = require("node:path");
const esbuild = require("esbuild");

function loadTsModule(entryPoint) {
	const build = esbuild.buildSync({
		entryPoints: [entryPoint],
		bundle: true,
		platform: "node",
		format: "cjs",
		write: false,
		logLevel: "silent",
	});
	const moduleInstance = new Module(entryPoint);
	moduleInstance.filename = entryPoint;
	moduleInstance.paths = Module._nodeModulePaths(path.dirname(entryPoint));
	moduleInstance._compile(build.outputFiles[0].text, entryPoint);
	return moduleInstance.exports;
}

const {
	resolveAssistantThinkingTraceVisibility: resolveRovoAppThinkingVisibility,
	resolveAssistantThinkingTracePhase: resolveRovoAppThinkingStatusPhase,
} = loadTsModule(path.join(__dirname, "../../shared/lib/assistant-thinking-trace-state.ts"));

test("keeps thinking visible while an in-flight turn briefly loses thinking parts", () => {
	assert.deepEqual(
		resolveRovoAppThinkingVisibility({
			isThinkingActive: false,
			isResponseInFlight: true,
			wasLatched: true,
		}),
		{
			effectiveIsThinkingActive: true,
			nextLatched: true,
		}
	);
});

test("clears the thinking latch after the active turn finishes", () => {
	assert.deepEqual(
		resolveRovoAppThinkingVisibility({
			isThinkingActive: false,
			isResponseInFlight: false,
			wasLatched: true,
		}),
		{
			effectiveIsThinkingActive: false,
			nextLatched: false,
		}
	);
});

test("activates the latch immediately once thinking starts", () => {
	assert.deepEqual(
		resolveRovoAppThinkingVisibility({
			isThinkingActive: true,
			isResponseInFlight: true,
			wasLatched: false,
		}),
		{
			effectiveIsThinkingActive: true,
			nextLatched: true,
		}
	);
});

test("marks persisted completed turns as completed even when lifecycle phase is idle", () => {
	assert.equal(
		resolveRovoAppThinkingStatusPhase({
			isThinkingActive: true,
			hasTurnComplete: true,
			isThinkingLifecycleStreaming: false,
			hasBackendThinkingActivity: true,
			lifecyclePhase: "idle",
		}),
		"completed"
	);
});

test("keeps streaming turns in their live lifecycle phase", () => {
	assert.equal(
		resolveRovoAppThinkingStatusPhase({
			isThinkingActive: true,
			hasTurnComplete: false,
			isThinkingLifecycleStreaming: true,
			hasBackendThinkingActivity: true,
			lifecyclePhase: "thinking",
		}),
		"thinking"
	);
});

test("returns idle when thinking status is not active", () => {
	assert.equal(
		resolveRovoAppThinkingStatusPhase({
			isThinkingActive: false,
			hasTurnComplete: true,
			isThinkingLifecycleStreaming: false,
			hasBackendThinkingActivity: true,
			lifecyclePhase: "completed",
		}),
		"idle"
	);
});
