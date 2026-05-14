const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");

const {
	buildGeneratedMediaUrl,
	extractGeneratedVideoPathFromString,
	findGeneratedVideoPathInValue,
	inferGeneratedMediaContentType,
	resolveGeneratedMediaAbsolutePath,
} = require("./generated-media");

test("buildGeneratedMediaUrl returns a route for allowed generated video paths", () => {
	assert.equal(
		buildGeneratedMediaUrl("media/videos/tmp/demo/VPKRovoVideo.mp4"),
		"/api/rovo/generated-media?path=media%2Fvideos%2Ftmp%2Fdemo%2FVPKRovoVideo.mp4",
	);
});

test("buildGeneratedMediaUrl rejects unsupported or out-of-root paths", () => {
	assert.equal(buildGeneratedMediaUrl("../media/videos/demo.mp4"), null);
	assert.equal(buildGeneratedMediaUrl("media/audio/demo.mp3"), null);
	assert.equal(buildGeneratedMediaUrl("media/videos/demo.txt"), null);
});

test("extractGeneratedVideoPathFromString finds video paths embedded in text", () => {
	assert.equal(
		extractGeneratedVideoPathFromString(
			'Output file: "media/videos/tmp/demo/VPKRovoVideo.mp4"',
		),
		"media/videos/tmp/demo/VPKRovoVideo.mp4",
	);
});

test("findGeneratedVideoPathInValue scans nested payloads", () => {
	assert.equal(
		findGeneratedVideoPathInValue({
			spec: {
				elements: {
					path: {
						type: "Code",
						props: { text: "media/videos/tmp/demo/VPKRovoVideo.mp4" },
					},
				},
			},
		}),
		"media/videos/tmp/demo/VPKRovoVideo.mp4",
	);
});

test("inferGeneratedMediaContentType resolves video extensions", () => {
	assert.equal(
		inferGeneratedMediaContentType("media/videos/tmp/demo/VPKRovoVideo.mp4"),
		"video/mp4",
	);
	assert.equal(
		inferGeneratedMediaContentType("media/videos/tmp/demo/VPKRovoVideo.webm"),
		"video/webm",
	);
});

test("resolveGeneratedMediaAbsolutePath keeps requests inside the project root", () => {
	const projectRoot = "/Users/example/project";
	assert.equal(
		resolveGeneratedMediaAbsolutePath(
			projectRoot,
			"media/videos/tmp/demo/VPKRovoVideo.mp4",
		),
		path.resolve(projectRoot, "media/videos/tmp/demo/VPKRovoVideo.mp4"),
	);
	assert.equal(
		resolveGeneratedMediaAbsolutePath(
			projectRoot,
			"media/videos/../../secrets.txt",
		),
		null,
	);
});
