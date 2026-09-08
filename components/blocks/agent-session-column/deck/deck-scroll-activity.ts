export const AGENT_SESSION_DECK_SCROLLING_ATTRIBUTE = "data-scrolling";
export const AGENT_SESSION_DECK_SCROLL_IDLE_FALLBACK_MS = 100;

interface AgentSessionDeckScrollPort extends EventTarget {
	toggleAttribute(name: string, force?: boolean): boolean;
}

/**
 * Keeps transformed rows out of pointer hit-testing while their native
 * scrollport is moving. Otherwise each row crossing a stationary pointer opens
 * the shared Base UI preview card and schedules a large React render.
 *
 * Native `scrollend` restores hover precisely. The quiet-period timer is the
 * fallback for browsers that do not dispatch it.
 */
export function subscribeToAgentSessionDeckScrollActivity(
	port: AgentSessionDeckScrollPort,
): () => void {
	let idleTimer: ReturnType<typeof setTimeout> | null = null;
	const supportsScrollEnd = "onscrollend" in port;

	const clearIdleTimer = () => {
		if (idleTimer === null) {
			return;
		}
		clearTimeout(idleTimer);
		idleTimer = null;
	};
	const resumeHover = () => {
		clearIdleTimer();
		port.toggleAttribute(AGENT_SESSION_DECK_SCROLLING_ATTRIBUTE, false);
	};
	const suspendHover = () => {
		port.toggleAttribute(AGENT_SESSION_DECK_SCROLLING_ATTRIBUTE, true);
		if (supportsScrollEnd) {
			return;
		}
		clearIdleTimer();
		idleTimer = setTimeout(resumeHover, AGENT_SESSION_DECK_SCROLL_IDLE_FALLBACK_MS);
	};

	port.addEventListener("scroll", suspendHover, { passive: true });
	if (supportsScrollEnd) {
		port.addEventListener("scrollend", resumeHover);
	}

	return () => {
		port.removeEventListener("scroll", suspendHover);
		if (supportsScrollEnd) {
			port.removeEventListener("scrollend", resumeHover);
		}
		resumeHover();
	};
}
