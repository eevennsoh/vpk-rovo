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

function normalizeNonEmptyString(value) {
	if (typeof value !== "string") {
		return null;
	}

	const trimmedValue = value.trim();
	return trimmedValue.length > 0 ? trimmedValue : null;
}

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

function recordPlanWidgetEmission(threadId, { deferredToolCallId, planCardId } = {}) {
	if (!threadId) {
		return { ...DEFAULT_SESSION };
	}

	const session = getPlanSession(threadId);
	const normalizedDeferredToolCallId = normalizeNonEmptyString(deferredToolCallId);
	const normalizedPlanCardId = normalizeNonEmptyString(planCardId);

	session.isActive = true;
	session.phase = "plan";
	if (normalizedDeferredToolCallId) {
		session.deferredToolCallId = normalizedDeferredToolCallId;
	}
	if (
		normalizedPlanCardId &&
		!session.planCardIds.includes(normalizedPlanCardId)
	) {
		session.planCardIds = [...session.planCardIds, normalizedPlanCardId];
	}

	return session;
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
 * Returns true when the plan session for `threadId` is in the execution
 * phase. During execution, all GenUI card routing must be suppressed so
 * that plan task outputs route to the artifact panel instead.
 *
 * @param {string} threadId
 * @returns {boolean}
 */
function isPlanExecutionPhase(threadId) {
	if (!threadId) return false;
	const session = getPlanSession(threadId);
	return session.isActive && session.phase === "execution";
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
	recordPlanWidgetEmission,
	clearPlanSession,
	shouldRestorePlanModeOnResume,
	isPlanExecutionPhase,
	_resetForTest,
};
