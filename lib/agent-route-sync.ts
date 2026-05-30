/**
 * Surface-agnostic helpers for reflecting the active agent in the URL via a
 * `?agent=` query param. Agents are a cross-cutting concept (you can select or
 * create one on any surface — studio, rovo, future surfaces), so the agent
 * identity rides as an orthogonal query param layered on top of each surface's
 * existing path-based thread routing (e.g. `/studio/{threadId}?agent={id}`).
 *
 * These functions are pure (no React, no domain knowledge of which agent is the
 * default). The "default agent == no param" policy lives in the consuming hook,
 * which passes `null` here to clear the param.
 */

export const AGENT_QUERY_PARAM = "agent";

/** Read the agent id from a query string or params, or `null` when absent. */
export function getAgentIdFromSearch(search: string | URLSearchParams): string | null {
	const params = typeof search === "string" ? new URLSearchParams(search) : search;
	const raw = params.get(AGENT_QUERY_PARAM)?.trim();
	return raw ? raw : null;
}

/**
 * Return `url` with the agent query param set to `agentId`, or removed when
 * `agentId` is `null`. Path, other query params, and hash are preserved.
 * Accepts absolute or relative URLs.
 */
export function withAgentParam(url: string, agentId: string | null): string {
	// Parse against a dummy origin so relative URLs (the common case) work.
	const parsed = new URL(url, "http://x");
	if (agentId) {
		parsed.searchParams.set(AGENT_QUERY_PARAM, agentId);
	} else {
		parsed.searchParams.delete(AGENT_QUERY_PARAM);
	}
	const query = parsed.searchParams.toString();
	return `${parsed.pathname}${query ? `?${query}` : ""}${parsed.hash}`;
}
