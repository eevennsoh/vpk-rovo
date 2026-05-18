const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const ARTIFACT_SOURCE = fs.readFileSync(path.join(__dirname, "artifact.tsx"), "utf8");

test("ArtifactCard presents html artifacts as PDFs with acronym casing", () => {
	assert.match(ARTIFACT_SOURCE, /html: "PDF"/u);
	assert.match(ARTIFACT_SOURCE, /function formatArtifactKindActionLabel\(kindLabel: string\): string/u);
	assert.match(ARTIFACT_SOURCE, /\? kindLabel\s*: kindLabel\.toLowerCase\(\);/u);
	assert.match(ARTIFACT_SOURCE, /const actionKindLabel = formatArtifactKindActionLabel\(kindLabel\);/u);
	assert.match(
		ARTIFACT_SOURCE,
		/resolvedOpenCtaLabel = openCtaLabel \?\? `Open \$\{actionKindLabel\}`/u,
	);
	assert.doesNotMatch(ARTIFACT_SOURCE, /html: "HTML report"/u);
	assert.doesNotMatch(ARTIFACT_SOURCE, /Open \$\{kindLabel\.toLowerCase\(\)\}/u);
});

test("ArtifactPanel uses the Rovo Canvas version-history treatment instead of a select trigger", () => {
	assert.match(ARTIFACT_SOURCE, /function ArtifactVersionHistoryPanel/u);
	assert.match(
		ARTIFACT_SOURCE,
		/<TooltipTrigger[\s\S]*render=\{[\s\S]*<Button[\s\S]*aria-label="Version history"[\s\S]*aria-pressed=\{shouldShowVersionHistory \? true : undefined\}[\s\S]*<ClockIcon className="size-4" \/>/u,
	);
	assert.match(
		ARTIFACT_SOURCE,
		/<ArtifactVersionHistoryPanel[\s\S]*document=\{document\}[\s\S]*onVersionChange=\{onVersionChange\}[\s\S]*selectedVersionId=\{selectedVersion\?\.id \?\? null\}/u,
	);
	assert.match(
		ARTIFACT_SOURCE,
		/onClick=\{\(\) => onVersionChange\(version\.id\)\}/u,
	);
	assert.doesNotMatch(ARTIFACT_SOURCE, /SelectTrigger/u);
	assert.doesNotMatch(ARTIFACT_SOURCE, /aria-label="Artifact version"/u);
});
