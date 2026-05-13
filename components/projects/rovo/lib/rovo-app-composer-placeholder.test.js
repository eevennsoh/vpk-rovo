const test = require("node:test");
const assert = require("node:assert/strict");

const {
	resolveRovoAppComposerPlaceholder,
} = require("./rovo-app-composer-placeholder.ts");

test("resolveRovoAppComposerPlaceholder uses the preview prompt while the home state is visible", () => {
	assert.deepEqual(
		resolveRovoAppComposerPlaceholder({
			defaultPlaceholder: "Ask, @mention, or / for skills",
			previewPrompt: "Summarize this page into key points.",
			showHomeState: true,
		}),
		{
			activePreviewPrompt: "Summarize this page into key points.",
			placeholder: "Summarize this page into key points.",
		},
	);
});

test("resolveRovoAppComposerPlaceholder drops stale preview text once the home state closes", () => {
	assert.deepEqual(
		resolveRovoAppComposerPlaceholder({
			defaultPlaceholder: "Ask, @mention, or / for skills",
			previewPrompt: "Draft release notes for this update.",
			showHomeState: false,
		}),
		{
			activePreviewPrompt: null,
			placeholder: "Ask, @mention, or / for skills",
		},
	);
});
