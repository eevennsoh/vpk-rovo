const COMPLETE_DIRECT_MEDIA_FENCE_PATTERN = /```(?:image|audio)\s*\n[\s\S]*?```/giu;
const PENDING_DIRECT_MEDIA_FENCE_PATTERN = /```(?:image|audio)\s*\n[\s\S]*$/iu;

function normalizeDirectMediaFenceWhitespace(text) {
	return text
		.replace(/[ \t]+\n/g, "\n")
		.replace(/\n{3,}/g, "\n\n")
		.trim();
}

function collapseDirectMediaFenceNewlines(text) {
	return text.replace(/\n{3,}/g, "\n\n");
}

function splitDirectMediaTextForStreaming(text) {
	if (typeof text !== "string" || text.length === 0) {
		return {
			pendingText: "",
			visibleText: "",
		};
	}

	const textWithCompletedFencesRemoved = text.replace(
		COMPLETE_DIRECT_MEDIA_FENCE_PATTERN,
		"\n\n"
	);
	const pendingFenceMatch = textWithCompletedFencesRemoved.match(
		PENDING_DIRECT_MEDIA_FENCE_PATTERN
	);

	if (!pendingFenceMatch || pendingFenceMatch.index === undefined) {
		return {
			pendingText: "",
			visibleText: collapseDirectMediaFenceNewlines(textWithCompletedFencesRemoved),
		};
	}

	return {
		pendingText: textWithCompletedFencesRemoved.slice(pendingFenceMatch.index),
		visibleText: collapseDirectMediaFenceNewlines(
			textWithCompletedFencesRemoved.slice(0, pendingFenceMatch.index)
		),
	};
}

function stripDirectMediaFences(text) {
	if (typeof text !== "string" || text.length === 0) {
		return "";
	}

	const withoutCompletedFences = text.replace(
		COMPLETE_DIRECT_MEDIA_FENCE_PATTERN,
		"\n\n"
	);
	const withoutPendingFence = withoutCompletedFences.replace(
		PENDING_DIRECT_MEDIA_FENCE_PATTERN,
		"\n\n"
	);

	return normalizeDirectMediaFenceWhitespace(withoutPendingFence);
}

module.exports = {
	splitDirectMediaTextForStreaming,
	stripDirectMediaFences,
};
