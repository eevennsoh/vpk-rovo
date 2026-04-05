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

test("inferRovoAppArtifactKindFromContent upgrades HTML output to code", () => {
	assert.equal(
		inferRovoAppArtifactKindFromContent("<!DOCTYPE html><html><head><title>Apple</title></head><body></body></html>", "text"),
		"code",
	);
});

test("inferRovoAppArtifactKindFromContent keeps markdown tables as sheets", () => {
	assert.equal(
		inferRovoAppArtifactKindFromContent("| Fruit | Color |\n| --- | --- |\n| Apple | Red |", "text"),
		"sheet",
	);
});
