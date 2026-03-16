const test = require("node:test");
const assert = require("node:assert/strict");

const {
	splitDirectMediaTextForStreaming,
	stripDirectMediaFences,
} = require("./direct-media-fence");

test("splitDirectMediaTextForStreaming keeps narrative and buffers an incomplete media fence", () => {
	const result = splitDirectMediaTextForStreaming(
		"Here you go.\n```image\n{\"prompt\":\"Draw a cat\"}"
	);

	assert.equal(result.visibleText, "Here you go.\n");
	assert.equal(result.pendingText, "```image\n{\"prompt\":\"Draw a cat\"}");
});

test("splitDirectMediaTextForStreaming removes completed direct-media fences from streamed text", () => {
	const result = splitDirectMediaTextForStreaming(
		"Before\n```audio\n{\"text\":\"Hello\"}\n```\nAfter"
	);

	assert.equal(result.pendingText, "");
	assert.equal(result.visibleText, "Before\n\nAfter");
});

test("stripDirectMediaFences removes image and audio fences while preserving surrounding narrative", () => {
	const result = stripDirectMediaFences(
		[
			"Intro",
			"```image",
			"{\"prompt\":\"Sunset\"}",
			"```",
			"Middle",
			"```audio",
			"{\"text\":\"Narration\"}",
			"```",
			"Outro",
		].join("\n")
	);

	assert.equal(result, "Intro\n\nMiddle\n\nOutro");
});
