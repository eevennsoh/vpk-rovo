const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const ARTIFACT_RESULT_CARD_SOURCE = fs.readFileSync(
	path.join(__dirname, "artifact-result-card.tsx"),
	"utf8",
);

test("ArtifactResultCard reports dialog lifecycle around generated artifact previews", () => {
	assert.match(
		ARTIFACT_RESULT_CARD_SOURCE,
		/onDialogOpen\?: \(artifact: ArtifactResult\) => void;/,
	);
	assert.match(
		ARTIFACT_RESULT_CARD_SOURCE,
		/onDialogClose\?: \(artifact: ArtifactResult\) => void;/,
	);
	assert.match(
		ARTIFACT_RESULT_CARD_SOURCE,
		/<Dialog open=\{isOpen\} onOpenChange=\{handleOpenChange\}>/,
	);
	assert.match(
		ARTIFACT_RESULT_CARD_SOURCE,
		/if \(open\) \{\s*onDialogOpen\?\.\(artifact\);\s*\} else \{\s*onDialogClose\?\.\(artifact\);/u,
	);
	assert.match(
		ARTIFACT_RESULT_CARD_SOURCE,
		/onClick=\{\(\) => handleOpenChange\(true\)\}/,
	);
	assert.match(
		ARTIFACT_RESULT_CARD_SOURCE,
		/onClick=\{\(\) => handleOpenChange\(false\)\}/,
	);
});
