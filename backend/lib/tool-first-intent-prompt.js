"use strict";

const {
	extractTextFromUiParts,
	getNonEmptyString,
} = require("./shared-utils");

function normalizeSkipSources(skipSources) {
	if (skipSources instanceof Set) {
		return skipSources;
	}

	if (Array.isArray(skipSources)) {
		return new Set(
			skipSources
				.map((entry) => getNonEmptyString(entry)?.toLowerCase() ?? null)
				.filter(Boolean)
		);
	}

	return new Set();
}

function getLatestToolFirstIntentPrompt(messages, { skipSources } = {}) {
	if (!Array.isArray(messages)) {
		return null;
	}

	const normalizedSkipSources = normalizeSkipSources(skipSources);
	let fallbackCandidate = null;

	for (let index = messages.length - 1; index >= 0; index -= 1) {
		const message = messages[index];
		if (!message || message.role !== "user") {
			continue;
		}

		const visibility = getNonEmptyString(message?.metadata?.visibility);
		if (visibility === "hidden") {
			continue;
		}

		const text = extractTextFromUiParts(message.parts);
		if (!text) {
			continue;
		}

		const source = getNonEmptyString(message?.metadata?.source)?.toLowerCase() ?? null;
		const candidate = {
			index,
			text,
			source,
		};
		if (!fallbackCandidate) {
			fallbackCandidate = candidate;
		}

		if (source && normalizedSkipSources.has(source)) {
			continue;
		}

		return candidate;
	}

	return fallbackCandidate;
}

module.exports = {
	getLatestToolFirstIntentPrompt,
};
