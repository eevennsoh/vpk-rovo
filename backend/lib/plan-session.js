"use strict";

/** @type {Map<string, { isActive: boolean; phase: "qa" | "plan" | "execution" | null; deferredToolCallId: string | null; planCardIds: string[]; acceptedPlanId: string | null }>} */
const _planSessions = new Map();

const DEFAULT_SESSION = Object.freeze({
	isActive: false,
	phase: null,
	deferredToolCallId: null,
	planCardIds: [],
	acceptedPlanId: null,
});

function getPlanSession(threadId) {
	if (!threadId) {
		return { ...DEFAULT_SESSION };
	}
	if (!_planSessions.has(threadId)) {
		_planSessions.set(threadId, {
			isActive: false,
			phase: null,
			deferredToolCallId: null,
			planCardIds: [],
			acceptedPlanId: null,
		});
	}
	return _planSessions.get(threadId);
}

function updatePlanSession(threadId, updates) {
	if (!threadId) return;
	const session = getPlanSession(threadId);
	Object.assign(session, updates);
}

function clearPlanSession(threadId) {
	if (!threadId) return;
	_planSessions.delete(threadId);
}

/**
 * On deferred-tool resume turns the original request's `isPlanMode` flag
 * is absent. This helper checks whether the persisted plan session should
 * re-activate `resolvedPlanModeActive` so downstream GenUI blocking and
 * prompt instructions stay correct.
 *
 * @param {{ pausedToolCallRecord: unknown; resolvedPlanModeActive: boolean; threadId: string }} ctx
 * @returns {{ shouldRestore: boolean; phase: string | null }}
 */
function shouldRestorePlanModeOnResume({ pausedToolCallRecord, resolvedPlanModeActive, threadId }) {
	if (!pausedToolCallRecord || resolvedPlanModeActive) {
		return { shouldRestore: false, phase: null };
	}

	const planSession = getPlanSession(threadId);
	if (planSession.isActive) {
		return { shouldRestore: true, phase: planSession.phase };
	}

	return { shouldRestore: false, phase: null };
}

/**
 * Reset the internal session store. Only for tests.
 */
function _resetForTest() {
	_planSessions.clear();
}

module.exports = {
	getPlanSession,
	updatePlanSession,
	clearPlanSession,
	shouldRestorePlanModeOnResume,
	_resetForTest,
};
