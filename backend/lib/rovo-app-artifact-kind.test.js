const test = require("node:test");
const assert = require("node:assert/strict");

const {
	inferRovoAppArtifactKindFromContent,
	inferRovoAppArtifactKindFromRequest,
} = require("./rovo-app-artifact-kind");

test("inferRovoAppArtifactKindFromRequest treats page requests as code artifacts", () => {
	assert.equal(
		inferRovoAppArtifactKindFromRequest("Create me a page about Apple"),
		"code",
	);
	assert.equal(
		inferRovoAppArtifactKindFromRequest("Build a website landing page for oranges"),
		"code",
	);
});

test("inferRovoAppArtifactKindFromRequest keeps table requests as sheets", () => {
	assert.equal(
		inferRovoAppArtifactKindFromRequest("Create a comparison table of apple varieties"),
		"sheet",
	);
});

test("inferRovoAppArtifactKindFromRequest keeps diagram requests out of artifact kinds", () => {
	assert.equal(
		inferRovoAppArtifactKindFromRequest("Draw me a system architecture diagram"),
		"text",
	);
	assert.equal(
		inferRovoAppArtifactKindFromRequest("Create an Excalidraw flowchart"),
		"text",
	);
});

test("inferRovoAppArtifactKindFromContent upgrades HTML output to code", () => {
	assert.equal(
		inferRovoAppArtifactKindFromContent("<!DOCTYPE html><html><head><title>Apple</title></head><body></body></html>", "text"),
		"code",
	);
});

test("inferRovoAppArtifactKindFromRequest treats HTML reports as html artifacts", () => {
	assert.equal(
		inferRovoAppArtifactKindFromRequest("Make an HTML report for this work item"),
		"html",
	);
});

test("inferRovoAppArtifactKindFromContent preserves HTML report artifacts", () => {
	assert.equal(
		inferRovoAppArtifactKindFromContent("<!DOCTYPE html><html><head><title>Report</title></head><body></body></html>", "html"),
		"html",
	);
});

test("inferRovoAppArtifactKindFromContent keeps markdown tables as sheets", () => {
	assert.equal(
		inferRovoAppArtifactKindFromContent("| Fruit | Color |\n| --- | --- |\n| Apple | Red |", "text"),
		"sheet",
	);
});

test("inferRovoAppArtifactKindFromContent keeps excalidraw JSON as excalidraw", () => {
	assert.equal(
		inferRovoAppArtifactKindFromContent("{\"type\":\"excalidraw\",\"version\":2,\"elements\":[]}", "text"),
		"excalidraw",
	);
});
