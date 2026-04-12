/**
 * Session search across Rovo App threads.
 *
 * Provides substring/regex search across thread titles and message content.
 * Returns matches with snippets, match counts, and thread metadata.
 *
 * Used by the VPK-Rovo backend to power the /api/sessions/search endpoint
 * and by the frontend to search within the Rovo App sidebar.
 */

const SNIPPET_CONTEXT_CHARS = 80;
const DEFAULT_LIMIT = 20;

/**
 * Extract all searchable text from a thread's messages.
 * Handles both UI message format (parts array) and simple content strings.
 *
 * @param {Array} messages
 * @returns {string} Concatenated searchable text.
 */
function extractSearchableText(messages) {
	if (!Array.isArray(messages)) {
		return "";
	}

	const segments = [];
	for (const msg of messages) {
		if (!msg || typeof msg !== "object") {
			continue;
		}

		// Handle simple content field
		if (typeof msg.content === "string" && msg.content.trim()) {
			segments.push(msg.content);
		}

		// Handle parts array (UI message format)
		if (Array.isArray(msg.parts)) {
			for (const part of msg.parts) {
				if (part && typeof part.text === "string" && part.text.trim()) {
					segments.push(part.text);
				}
			}
		}
	}

	return segments.join("\n");
}

/**
 * Build a snippet around the first match occurrence.
 *
 * @param {string} text - Full text to extract snippet from.
 * @param {RegExp} pattern - Search pattern.
 * @returns {string} Snippet with match context.
 */
function buildSnippet(text, pattern) {
	pattern.lastIndex = 0;
	const match = pattern.exec(text);
	if (!match) {
		return text.slice(0, SNIPPET_CONTEXT_CHARS * 2).trim();
	}

	const matchStart = match.index;
	const matchEnd = matchStart + match[0].length;
	const snippetStart = Math.max(0, matchStart - SNIPPET_CONTEXT_CHARS);
	const snippetEnd = Math.min(text.length, matchEnd + SNIPPET_CONTEXT_CHARS);

	let snippet = text.slice(snippetStart, snippetEnd).trim();
	if (snippetStart > 0) {
		snippet = `…${snippet}`;
	}
	if (snippetEnd < text.length) {
		snippet = `${snippet}…`;
	}

	// Collapse whitespace
	return snippet.replace(/\s+/gu, " ");
}

/**
 * Count non-overlapping matches of a pattern in text.
 *
 * @param {string} text
 * @param {RegExp} pattern - Must have global flag.
 * @returns {number}
 */
function countMatches(text, pattern) {
	pattern.lastIndex = 0;
	let count = 0;
	while (pattern.exec(text) !== null) {
		count += 1;
	}
	return count;
}

/**
 * Search across threads by content and title.
 *
 * @param {Array<{ id: string, title: string, messages: Array, updatedAt: string }>} threads
 * @param {string} query - Search query string.
 * @param {{ limit?: number }} [options]
 * @returns {Array<{ threadId: string, title: string, snippet: string, matchCount: number, lastMessageAt: string }>}
 */
function searchThreads(threads, query, options) {
	if (!query || typeof query !== "string" || !query.trim()) {
		return [];
	}

	if (!Array.isArray(threads) || threads.length === 0) {
		return [];
	}

	const limit = options?.limit ?? DEFAULT_LIMIT;
	const escapedQuery = query.trim().replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
	const pattern = new RegExp(escapedQuery, "giu");

	const results = [];

	for (const thread of threads) {
		if (!thread || typeof thread !== "object" || !thread.id) {
			continue;
		}

		const title = typeof thread.title === "string" ? thread.title : "";
		const messageText = extractSearchableText(thread.messages);
		const fullText = `${title}\n${messageText}`;

		const matchCount = countMatches(fullText, pattern);
		if (matchCount === 0) {
			continue;
		}

		const snippet = buildSnippet(fullText, pattern);

		results.push({
			threadId: thread.id,
			title: title || "Untitled",
			snippet,
			matchCount,
			lastMessageAt: thread.updatedAt || new Date().toISOString(),
		});
	}

	// Sort by match count desc, then recency desc
	results.sort((a, b) => {
		if (b.matchCount !== a.matchCount) {
			return b.matchCount - a.matchCount;
		}
		return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime();
	});

	return results.slice(0, limit);
}

module.exports = {
	extractSearchableText,
	searchThreads,
};
