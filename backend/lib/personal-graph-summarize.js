"use strict";

const { createAIGatewayProvider } = require("./ai-gateway-provider");

const SUMMARIZE_PROMPT = [
	"Summarize this raw source for a personal second-brain librarian.",
	"Return JSON only with shape {\"takeaways\":[string,string,string,string,string],\"summary\":\"string\"}.",
	"Use 3 to 5 concise takeaways. Do not include markdown fences.",
].join("\n");

function parseJsonObject(text) {
	try {
		return JSON.parse(text);
	} catch {
		const match = String(text).match(/\{[\s\S]*\}/u);
		if (match) {
			return JSON.parse(match[0]);
		}
		throw new Error("Model response was not valid JSON.");
	}
}

function validateSummaryShape(value) {
	if (!value || typeof value !== "object") {
		const error = new Error("Summary response was not an object.");
		error.code = "MALFORMED_SUMMARY";
		throw error;
	}
	const takeaways = Array.isArray(value.takeaways)
		? value.takeaways.filter((entry) => typeof entry === "string" && entry.trim()).slice(0, 5)
		: [];
	if (takeaways.length === 0 || typeof value.summary !== "string" || !value.summary.trim()) {
		const error = new Error("Summary response did not include takeaways and summary.");
		error.code = "MALFORMED_SUMMARY";
		throw error;
	}
	return { summary: value.summary.trim(), takeaways };
}

async function summarizeRaw({ content, kind = "markdown", provider } = {}, { aiGatewayProvider } = {}) {
	const gateway = aiGatewayProvider ?? createAIGatewayProvider({ logger: console });
	try {
		const text = await gateway.generateText({
			maxOutputTokens: 900,
			prompt: `Kind: ${kind}\n\n${content}`,
			provider,
			system: SUMMARIZE_PROMPT,
			temperature: 0.2,
		});
		return validateSummaryShape(parseJsonObject(text));
	} catch (error) {
		if (error?.code === "MALFORMED_SUMMARY") {
			throw error;
		}
		const wrapped = new Error(`Failed to summarize raw source: ${error instanceof Error ? error.message : String(error)}`);
		wrapped.code = "SUMMARIZE_FAILED";
		wrapped.cause = error;
		throw wrapped;
	}
}

module.exports = {
	SUMMARIZE_PROMPT,
	summarizeRaw,
	validateSummaryShape,
};
