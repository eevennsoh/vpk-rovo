const MIN_TEXT_LENGTH = 40;

const WRITE_BLOCKED_PATTERNS = [
	/write access disabled/i,
	/write operations are currently blocked/i,
	/all write operations[\s\S]{0,40}currently blocked/i,
	/can['']t proceed with implementation until writes are unblocked/i,
	/blocked in readonly mode/i,
	/operation is currently blocked/i,
];

// Strong signals — any single match means inability response
const STRONG_INABILITY_PATTERNS = [
	/i apologize[\s\S]{0,60}(?:don['']t (?:include|have)|not (?:available|included))/i,
	/unfortunately[\s,]+(?:there['']?s no|i (?:don['']t|cannot|can['']t)|this (?:isn['']t|is not))/i,
	/i['']?m unable to/i,
	/tools available to me (?:don['']t|do not)/i,
	/no[\s\S]{0,30}endpoint available/i,
	/beyond my current capabilities/i,
	/i don['']t have (?:the ability|access|a tool|any tool)/i,
	/i (?:don['']t|do not) have (?:the )?(?:capability|functionality)/i,
	/(?:don['']t|do not) currently (?:have|support)/i,
	/there(?:['']s| is) no (?:tool|endpoint|integration|api|way for me)/i,
	/i (?:cannot|can['']t) (?:access|connect to|interact with|retrieve|fetch|list|read|query)/i,
	/(?:isn['']t|is not) (?:something i can|within my (?:capabilities|scope))/i,
	/lack (?:the )?(?:tools|access|capability|ability) to/i,
	/not (?:equipped|configured|set up) to/i,
	...WRITE_BLOCKED_PATTERNS,
];

// Weak signals — need 2+ matches to trigger
const WEAK_INABILITY_PATTERNS = [
	/\blimited to\b/i,
	/\bnot available\b/i,
	/\bnot supported\b/i,
	/\binstead[,]? i can\b/i,
	/\balternatively\b/i,
	/\bhowever[,]? i (?:can|am able)\b/i,
	/\bwhat i can do\b/i,
	/\bi can help (?:you )?with\b/i,
	/\boutsid(?:e of|e) (?:my|the) (?:scope|capabilities)\b/i,
];

// Data-presence signals — override inability detection when content has real data
const DATA_PRESENCE_PATTERNS = [
	/^\d+[.)]\s+\S/m, // Numbered result lists
	/https?:\/\/\S{10,}/i, // URLs (at least 10 chars after protocol)
	/\d+(?:\.\d+)?\s*(?:KB|MB|GB|TB|bytes)\b/i, // File sizes
	/\|\s*\S+\s*\|/m, // Markdown table rows
];

/**
 * Detect whether assistant text is an inability/limitation response
 * (e.g. "I don't have the tools to do that") that should not be
 * wrapped in a GenUI card.
 *
 * @param {string} text - Assistant response text
 * @returns {boolean} true if the text looks like an inability response
 */
function looksLikeInabilityResponse(text) {
	if (typeof text !== "string") {
		return false;
	}

	const trimmed = text.trim();
	if (trimmed.length < MIN_TEXT_LENGTH) {
		return false;
	}

	// Check for data-presence signals first — if the response contains
	// real data (URLs, numbered lists, file sizes), it's not a pure
	// inability response even if it mentions limitations
	for (const pattern of DATA_PRESENCE_PATTERNS) {
		if (pattern.test(trimmed)) {
			return false;
		}
	}

	// Check strong signals — any single match is enough
	for (const pattern of STRONG_INABILITY_PATTERNS) {
		if (pattern.test(trimmed)) {
			return true;
		}
	}

	// Check weak signals — need 2+ matches
	let weakCount = 0;
	for (const pattern of WEAK_INABILITY_PATTERNS) {
		if (pattern.test(trimmed)) {
			weakCount++;
			if (weakCount >= 2) {
				return true;
			}
		}
	}

	return false;
}

function looksLikeWriteBlockedResponse(text) {
	if (typeof text !== "string" || !text.trim()) {
		return false;
	}
	const trimmed = text.trim();
	for (const pattern of WRITE_BLOCKED_PATTERNS) {
		if (pattern.test(trimmed)) {
			return true;
		}
	}
	return false;
}

module.exports = {
	looksLikeInabilityResponse,
	looksLikeWriteBlockedResponse,
};
