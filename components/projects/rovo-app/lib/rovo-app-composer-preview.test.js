const test = require("node:test");
const assert = require("node:assert/strict");

const {
	resolveRovoAppComposerPreviewHeight,
} = require("./rovo-app-composer-preview.ts");

test("resolveRovoAppComposerPreviewHeight preserves the base height for short previews", () => {
	assert.equal(
		resolveRovoAppComposerPreviewHeight({
			baseComposerHeight: 108,
			baseTextareaHeight: 24,
			previewPromptHeight: 20,
		}),
		108,
	);
});

test("resolveRovoAppComposerPreviewHeight grows the composer for tall preview prompts", () => {
	assert.equal(
		resolveRovoAppComposerPreviewHeight({
			baseComposerHeight: 108,
			baseTextareaHeight: 24,
			previewPromptHeight: 72,
		}),
		156,
	);
});

test("resolveRovoAppComposerPreviewHeight returns null for incomplete measurements", () => {
	assert.equal(
		resolveRovoAppComposerPreviewHeight({
			baseComposerHeight: 0,
			baseTextareaHeight: 24,
			previewPromptHeight: 72,
		}),
		null,
	);
});
