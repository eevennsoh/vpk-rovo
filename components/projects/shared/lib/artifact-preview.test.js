const test = require("node:test");
const assert = require("node:assert/strict");

const { buildArtifactPreviewBody } = require("./artifact-preview.ts");

test("buildArtifactPreviewBody maps react artifacts to app-url previews", () => {
	const body = buildArtifactPreviewBody({
		content: "/rovo-app/demo",
		kind: "react",
		summary: "Generated app preview ready to open",
	});

	assert.equal(body.kind, "app-url");
	assert.equal(body.url, "/rovo-app/demo");
	assert.equal(body.summary, "Generated app preview ready to open");
});

test("buildArtifactPreviewBody detects excalidraw file content", () => {
	const body = buildArtifactPreviewBody({
		content: JSON.stringify({
			type: "excalidraw",
			version: 2,
			elements: [{ id: "node-1", type: "rectangle", x: 0, y: 0 }],
		}),
		kind: "text",
	});

	assert.equal(body.kind, "excalidraw");
	assert.equal(body.scene.type, "excalidraw");
	assert.equal(body.scene.elements.length, 1);
});
