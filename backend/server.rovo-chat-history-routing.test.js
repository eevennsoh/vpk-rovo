const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const SERVER_SOURCE = fs.readFileSync(
	path.join(process.cwd(), "backend/server.js"),
	"utf8",
);

function getFunctionSource(functionName) {
	const declaration = `async function ${functionName}`;
	const start = SERVER_SOURCE.indexOf(declaration);
	assert.notEqual(start, -1, `Expected ${functionName} declaration`);

	let depth = 0;
	let bodyStarted = false;
	for (let index = start; index < SERVER_SOURCE.length; index += 1) {
		const char = SERVER_SOURCE[index];
		if (char === "{") {
			depth += 1;
			bodyStarted = true;
		} else if (char === "}") {
			depth -= 1;
			if (bodyStarted && depth === 0) {
				return SERVER_SOURCE.slice(start, index + 1);
			}
		}
	}

	throw new Error(`Could not parse ${functionName} source`);
}

test("compact rovo chat starts managed runs on AI Gateway without a RovoDev gate", () => {
	const proxySource = getFunctionSource("proxyRovoAppChatRequest");

	assert.match(proxySource, /createRun\(\{\s*backend:\s*"ai-gateway"/su);
	assert.doesNotMatch(proxySource, /createRovoDevUnavailableError|resolveRovoAppPortAvailability|enqueueRun/u);
});

test("RFP demo floating-chat turns stream before creating a managed run", () => {
	const proxySource = getFunctionSource("proxyRovoAppChatRequest");
	const demoBranchIndex = proxySource.indexOf("const agentsRfpDemoTurn = !existingRun");
	const streamIndex = proxySource.indexOf("streamAgentsRfpDemoChatTurn(res, agentsRfpDemoTurn);", demoBranchIndex);
	const createRunIndex = proxySource.indexOf("rovoAppRunManager.createRun", demoBranchIndex);

	assert.notEqual(demoBranchIndex, -1);
	assert.notEqual(streamIndex, -1);
	assert.notEqual(createRunIndex, -1);
	assert.ok(streamIndex < createRunIndex);
});

test("managed rovo chat persists the resolved backend before streaming", () => {
	const executeSource = getFunctionSource("executeRovoAppManagedRun");

	const chatPreferenceIndex = executeSource.indexOf(
		"requestBody.backendPreference = await resolveRovoAppTurnBackendPreference",
	);
	const chatPersistIndex = executeSource.indexOf(
		"await persistRovoAppRunBackend(threadId, requestBody.backendPreference)",
		chatPreferenceIndex,
	);
	const dispatchIndex = executeSource.indexOf(
		"const response = await dispatchChatSdkRequestInProcess",
		chatPreferenceIndex,
	);

	assert.notEqual(chatPreferenceIndex, -1);
	assert.notEqual(chatPersistIndex, -1);
	assert.notEqual(dispatchIndex, -1);
	assert.match(executeSource, /isPlanModeActive:\s*requestIsPlanMode \|\| autoPlanTriggered/su);
	assert.ok(chatPersistIndex < dispatchIndex);
});

test("managed artifact turns persist delegated backend ownership before handling", () => {
	const executeSource = getFunctionSource("executeRovoAppManagedRun");

	const artifactPreferenceIndex = executeSource.indexOf(
		"const artifactBackendPreference",
	);
	const artifactPersistIndex = executeSource.indexOf(
		"await persistRovoAppRunBackend(threadId, artifactBackendPreference)",
		artifactPreferenceIndex,
	);
	const artifactHandlerIndex = executeSource.indexOf(
		"const handled = await handleRovoAppArtifactToolRequest",
		artifactPreferenceIndex,
	);

	assert.notEqual(artifactPreferenceIndex, -1);
	assert.notEqual(artifactPersistIndex, -1);
	assert.notEqual(artifactHandlerIndex, -1);
	assert.ok(artifactPersistIndex < artifactHandlerIndex);
});
