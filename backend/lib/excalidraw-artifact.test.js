const test = require("node:test");
const assert = require("node:assert/strict");

const {
	buildExcalidrawArtifactSystemPrompt,
	buildExcalidrawWidgetDescription,
	buildExcalidrawWidgetPayload,
	buildExcalidrawWidgetSystemPrompt,
	deriveExcalidrawTitle,
	isExcalidrawDiagramRequest,
	isExcalidrawArtifactOutput,
	normalizeExcalidrawArtifactOutput,
} = require("./excalidraw-artifact");

test("buildExcalidrawArtifactSystemPrompt asks for raw Excalidraw scene JSON", () => {
	const prompt = buildExcalidrawArtifactSystemPrompt({
		mode: "create",
		title: "Architecture Diagram",
	});

	assert.match(prompt, /Return ONLY valid Excalidraw scene JSON/i);
	assert.match(prompt, /Do not use markdown fences/i);
	assert.match(prompt, /"type":"excalidraw"/i);
});

test("buildExcalidrawWidgetSystemPrompt asks for transient preview scene JSON", () => {
	const prompt = buildExcalidrawWidgetSystemPrompt({
		title: "System Diagram",
	});

	assert.match(prompt, /transient Excalidraw diagram preview/i);
	assert.match(prompt, /Return ONLY valid Excalidraw scene JSON/i);
});

test("normalizeExcalidrawArtifactOutput accepts raw scene JSON", () => {
	const normalized = normalizeExcalidrawArtifactOutput(JSON.stringify({
		type: "excalidraw",
		version: 2,
		elements: [{ id: "node-1", type: "rectangle", x: 0, y: 0 }],
	}));

	assert.ok(normalized);
	const parsed = JSON.parse(normalized);
	assert.equal(parsed.type, "excalidraw");
	assert.equal(parsed.version, 2);
	assert.equal(parsed.source, "rovo-app");
	assert.equal(parsed.appState.viewBackgroundColor, "#ffffff");
	assert.equal(parsed.elements.length, 1);
});

test("normalizeExcalidrawArtifactOutput accepts fenced JSON", () => {
	const normalized = normalizeExcalidrawArtifactOutput([
		"```json",
		JSON.stringify({
			type: "excalidraw",
			version: 2,
			source: "model",
			elements: [{ id: "node-1", type: "text", x: 0, y: 0, text: "Hello" }],
		}),
		"```",
	].join("\n"));

	assert.ok(normalized);
	const parsed = JSON.parse(normalized);
	assert.equal(parsed.source, "model");
	assert.equal(parsed.elements[0].type, "text");
});

test("normalizeExcalidrawArtifactOutput rejects non-scene payloads", () => {
	assert.equal(normalizeExcalidrawArtifactOutput("{\"hello\":\"world\"}"), null);
});

test("isExcalidrawArtifactOutput detects normalized scene JSON", () => {
	assert.equal(
		isExcalidrawArtifactOutput("{\"type\":\"excalidraw\",\"version\":2,\"elements\":[]}"),
		false,
	);
	assert.equal(
		isExcalidrawArtifactOutput("{\"type\":\"excalidraw\",\"version\":2,\"elements\":[{\"id\":\"a\",\"type\":\"rectangle\"}]}"),
		true,
	);
});

test("isExcalidrawDiagramRequest detects diagram prompts", () => {
	assert.equal(isExcalidrawDiagramRequest("Create an architecture diagram for this system"), true);
	assert.equal(isExcalidrawDiagramRequest("Explain the system architecture"), false);
});

test("deriveExcalidrawTitle strips leading request verbs", () => {
	assert.equal(
		deriveExcalidrawTitle("Create an architecture diagram for the auth service"),
		"Auth Service Architecture Diagram",
	);
});

test("buildExcalidrawWidgetDescription specializes common diagram types", () => {
	assert.equal(
		buildExcalidrawWidgetDescription("Create an architecture diagram for the auth service"),
		"Transient system map with labeled nodes and directional flows.",
	);
	assert.equal(
		buildExcalidrawWidgetDescription("Create a sequence diagram for login"),
		"Transient interaction flow between actors and services.",
	);
});

test("buildExcalidrawWidgetPayload adds smart metadata and actions", () => {
	const payload = buildExcalidrawWidgetPayload({
		prompt: "Create an architecture diagram for the auth service",
		normalizedSceneJson: JSON.stringify({
			type: "excalidraw",
			version: 2,
			elements: [{ id: "node-1", type: "rectangle", x: 0, y: 0 }],
		}),
	});

	assert.equal(payload.title, "Auth Service Architecture Diagram");
	assert.equal(payload.description, "Transient system map with labeled nodes and directional flows.");
	assert.equal(payload.iconHint, "diagram");
	assert.equal(payload.contentTypeHint, "ui");
	assert.deepEqual(payload.actions, [
		{
			label: "Open Excalidraw App",
			href: "https://excalidraw.com",
		},
	]);
	assert.equal(payload.body.kind, "excalidraw");
});
