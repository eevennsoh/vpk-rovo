/**
 * Frontend-side helpers for the browser browsing feature.
 *
 * The browser is managed entirely by the Playwright MCP server on the backend.
 * This module provides only utility functions for working with browser data
 * parts in the chat message stream.
 */

/**
 * Extracts a hostname from a URL for display purposes.
 */
export function extractBrowserHostname(url: string): string {
	try {
		return new URL(url).hostname;
	} catch {
		return url;
	}
}
