const test = require("node:test");
const assert = require("node:assert/strict");

const { withCanonicalPreviewBody } = require("./widget-preview-payload");

test("withCanonicalPreviewBody adds body.kind json-render for genui payloads", () => {
	const spec = {
		root: "main",
		elements: {
			main: {
				type: "Card",
				props: { title: "Overview" },
				children: [],
			},
		},
	};

	const payload = withCanonicalPreviewBody("genui-preview", {
		spec,
		summary: "Rendered interactive preview",
		source: "test",
	});

	assert.deepEqual(payload.body, {
		kind: "json-render",
		spec,
	});
	assert.equal(payload.spec, spec);
});

test("withCanonicalPreviewBody adds body.kind audio for audio widgets", () => {
	const payload = withCanonicalPreviewBody("audio-preview", {
		audioUrl: "https://example.com/voice.mp3",
		mimeType: "audio/mpeg",
		transcript: "Hello world",
	});

	assert.deepEqual(payload.body, {
		kind: "audio",
		audioUrl: "https://example.com/voice.mp3",
		mimeType: "audio/mpeg",
		transcript: "Hello world",
	});
});

test("withCanonicalPreviewBody adds body.kind image for image widgets", () => {
	const payload = withCanonicalPreviewBody("image-preview", {
		images: [{ url: "data:image/png;base64,abc", mimeType: "image/png" }],
		prompt: "Architecture diagram",
	});

	assert.deepEqual(payload.body, {
		kind: "image",
		images: [{ url: "data:image/png;base64,abc", mimeType: "image/png" }],
		prompt: "Architecture diagram",
	});
});

test("withCanonicalPreviewBody adds body.kind video for direct video widgets", () => {
	const payload = withCanonicalPreviewBody("video-preview", {
		videoUrl: "/api/rovo/generated-media?path=media%2Fvideos%2Fdemo.mp4",
		mimeType: "video/mp4",
		fileName: "demo.mp4",
	});

	assert.deepEqual(payload.body, {
		kind: "video",
		videoUrl: "/api/rovo/generated-media?path=media%2Fvideos%2Fdemo.mp4",
		mimeType: "video/mp4",
		fileName: "demo.mp4",
	});
});

test("withCanonicalPreviewBody infers generated video bodies from genui specs", () => {
	const payload = withCanonicalPreviewBody("genui-preview", {
		spec: {
			root: "main",
			elements: {
				main: { type: "Card", props: { title: "Output" }, children: ["path"] },
				path: {
					type: "Code",
					props: { text: "media/videos/tmp/demo/VPKRovoVideo.mp4" },
					children: [],
				},
			},
		},
	});

	assert.deepEqual(payload.body, {
		kind: "video",
		videoUrl:
			"/api/rovo/generated-media?path=media%2Fvideos%2Ftmp%2Fdemo%2FVPKRovoVideo.mp4",
		mimeType: "video/mp4",
		fileName: "VPKRovoVideo.mp4",
	});
});

test("withCanonicalPreviewBody preserves payloads that already declare body", () => {
	const payload = withCanonicalPreviewBody("genui-preview", {
		body: {
			kind: "json-render",
			spec: { root: "main", elements: { main: { type: "Card", props: {}, children: [] } } },
		},
		summary: "Ready",
	});

	assert.equal(payload.summary, "Ready");
	assert.equal(payload.body.kind, "json-render");
});
