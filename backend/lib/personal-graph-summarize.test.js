"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");

const { summarizeRaw } = require("./personal-graph-summarize");

test("summarizeRaw returns validated gateway JSON", async () => {
	const aiGatewayProvider = {
		generateText: async () => JSON.stringify({ summary: "Short summary", takeaways: ["One", "Two", "Three"] }),
	};
	assert.deepEqual(await summarizeRaw({ content: "Body" }, { aiGatewayProvider }), {
		summary: "Short summary",
		takeaways: ["One", "Two", "Three"],
	});
});

test("summarizeRaw throws typed error on malformed JSON shape", async () => {
	const aiGatewayProvider = {
		generateText: async () => JSON.stringify({ nope: true }),
	};
	await assert.rejects(
		() => summarizeRaw({ content: "Body" }, { aiGatewayProvider }),
		(error) => error?.code === "MALFORMED_SUMMARY",
	);
});
