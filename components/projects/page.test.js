const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const PROJECT_LAYOUT_SOURCE = fs.readFileSync(path.join(__dirname, "page.tsx"), "utf8");

test("hideFloatingRovo suppresses the layout-owned floating chat surface", () => {
	assert.match(
		PROJECT_LAYOUT_SOURCE,
		/const showFloatingChat = !isEmbedded && !hideFloatingRovo && !hideRovoAction && isFloatingChatActive;/,
	);
	assert.match(
		PROJECT_LAYOUT_SOURCE,
		/\{showFloatingChat \? \(\s*<RovoFloatingChat[\s\S]*\/>\s*\) : null\}/,
	);
});

test("project layout forwards chat context bars to sidebar and floating chat", () => {
	assert.match(
		PROJECT_LAYOUT_SOURCE,
		/chatContextBar\?: ChatContextBarDescriptor \| null;/,
	);
	assert.match(
		PROJECT_LAYOUT_SOURCE,
		/<ChatPanel[\s\S]*chatContextBar=\{chatContextBar\}/,
	);
	assert.match(
		PROJECT_LAYOUT_SOURCE,
		/<RovoFloatingChat[\s\S]*chatContextBar=\{chatContextBar\}/,
	);
});

test("project layout forwards artifact dialog lifecycle to both chat surfaces", () => {
	assert.match(
		PROJECT_LAYOUT_SOURCE,
		/onArtifactDialogOpen\?: \(\) => void;/,
	);
	assert.match(
		PROJECT_LAYOUT_SOURCE,
		/preserveFloatingSurfaceOnArtifactDialogOpen\?: boolean;/,
	);
	assert.match(
		PROJECT_LAYOUT_SOURCE,
		/<ChatPanel[\s\S]*onArtifactDialogOpen=\{onArtifactDialogOpen\}[\s\S]*preserveFloatingSurfaceOnArtifactDialogOpen=\{preserveFloatingSurfaceOnArtifactDialogOpen\}/,
	);
	assert.match(
		PROJECT_LAYOUT_SOURCE,
		/<RovoFloatingChat[\s\S]*onArtifactDialogOpen=\{onArtifactDialogOpen\}[\s\S]*preserveFloatingSurfaceOnArtifactDialogOpen=\{preserveFloatingSurfaceOnArtifactDialogOpen\}/,
	);
});
