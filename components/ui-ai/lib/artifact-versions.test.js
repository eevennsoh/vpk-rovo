const assert = require("node:assert/strict");
const test = require("node:test");

const {
	formatArtifactVersionLabel,
	formatArtifactVersionSummaryLabel,
	getArtifactVersionTitle,
} = require("./artifact-versions.ts");

test("getArtifactVersionTitle prefers the selected version title snapshot", () => {
	assert.equal(
		getArtifactVersionTitle({
			document: { title: "Current title" },
			version: { title: "Historical title" },
		}),
		"Historical title",
	);
});

test("formatArtifactVersionLabel includes version number and change label", () => {
	const label = formatArtifactVersionLabel({
		document: {
			versions: [
				{
					id: "version-1",
				},
				{
					id: "version-2",
				},
			],
		},
		referenceDate: new Date("2026-03-09T00:02:00.000Z"),
		version: {
			changeLabel: "Renamed title",
			createdAt: "2026-03-09T00:00:00.000Z",
			id: "version-2",
		},
	});

	assert.match(label, /^Version 2 • Renamed title • /);
});

test("formatArtifactVersionSummaryLabel omits the version number for header summaries", () => {
	const label = formatArtifactVersionSummaryLabel({
		referenceDate: new Date("2026-03-09T00:02:00.000Z"),
		version: {
			changeLabel: "Renamed title",
			createdAt: "2026-03-09T00:00:00.000Z",
		},
	});

	assert.match(label, /^Renamed title • /);
});
