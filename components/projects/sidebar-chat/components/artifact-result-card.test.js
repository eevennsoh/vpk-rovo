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
		/const handleOpenArtifact = \(\) => \{/,
	);
	assert.match(
		ARTIFACT_RESULT_CARD_SOURCE,
		/handleOpenChange\(true\);/,
	);
	assert.match(
		ARTIFACT_RESULT_CARD_SOURCE,
		/onClick=\{\(\) => handleOpenChange\(false\)\}/,
	);
});

test("ArtifactResultCard opens HTML reports in an embedded Rovo Canvas dialog", () => {
	assert.match(
		ARTIFACT_RESULT_CARD_SOURCE,
		/import \{ ArtifactCard, ARTIFACT_KIND_LABELS, type ArtifactKind \} from "@\/components\/ui-ai\/artifact";/u,
	);
	assert.match(
		ARTIFACT_RESULT_CARD_SOURCE,
		/import \{ RovoCanvas, type RovoCanvasStatus, type RovoCanvasVersion, type RovoCanvasView \} from "@\/components\/blocks\/rovo-canvas\/page";/u,
	);
	assert.doesNotMatch(ARTIFACT_RESULT_CARD_SOURCE, /import RovoPage/u);
	assert.match(
		ARTIFACT_RESULT_CARD_SOURCE,
		/const shouldOpenInRovoCanvas = artifact\.kind === "html";/u,
	);
	assert.match(
		ARTIFACT_RESULT_CARD_SOURCE,
		/window\.addEventListener\("rovo:open-canvas-artifact", handleCanvasLink\);/u,
	);
	assert.match(
		ARTIFACT_RESULT_CARD_SOURCE,
		/window\.setTimeout\(\(\) => \{\s*if \(!event\.defaultPrevented\) \{\s*handleOpenChange\(true\);/u,
	);
	assert.match(
		ARTIFACT_RESULT_CARD_SOURCE,
		/const openCanvasEvent = new CustomEvent\("rovo:open-canvas-artifact", \{[\s\S]*cancelable: true,[\s\S]*documentId: artifact\.documentId,[\s\S]*threadId: canvasThreadId,[\s\S]*source: "artifact-result-card",/u,
	);
	assert.match(
		ARTIFACT_RESULT_CARD_SOURCE,
		/if \(openCanvasEvent\.defaultPrevented\) \{\s*return;\s*\}/u,
	);
	assert.match(
		ARTIFACT_RESULT_CARD_SOURCE,
		/<RovoCanvas[\s\S]*open=\{isOpen\}[\s\S]*onOpenChange=\{handleOpenChange\}[\s\S]*kind="report"[\s\S]*views=\{canvasViews\}/u,
	);
	assert.match(
		ARTIFACT_RESULT_CARD_SOURCE,
		/<ArtifactCard[\s\S]*displayMode="preview"[\s\S]*onOpen=\{handleOpenArtifact\}[\s\S]*previewSummary=\{document\?\.previewSummary \?\? undefined\}[\s\S]*versionNumber=\{document\?\.versions\.length \?\? 1\}/u,
	);
	assert.doesNotMatch(
		ARTIFACT_RESULT_CARD_SOURCE,
		/router\.push/u,
	);
	assert.doesNotMatch(
		ARTIFACT_RESULT_CARD_SOURCE,
		/Open in Canvas/u,
	);
});
