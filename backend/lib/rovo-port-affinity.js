function createRovoPortAffinity() {
	const preferredPortsByThread = new Map();
	const avoidedPortsByThread = new Map();

	function normalizeThreadId(threadId) {
		return typeof threadId === "string" && threadId.trim().length > 0
			? threadId.trim()
			: null;
	}

	function getPreferredPort(threadId) {
		const key = normalizeThreadId(threadId);
		if (!key) {
			return null;
		}

		const value = preferredPortsByThread.get(key);
		return Number.isInteger(value) && value > 0 ? value : null;
	}

	function getAvoidPorts(threadId) {
		const key = normalizeThreadId(threadId);
		if (!key) {
			return [];
		}

		const rawPorts = avoidedPortsByThread.get(key);
		if (!Array.isArray(rawPorts)) {
			return [];
		}

		return rawPorts.filter((port) => Number.isInteger(port) && port > 0);
	}

	function markSuccess(threadId, port) {
		const key = normalizeThreadId(threadId);
		if (!key || !Number.isInteger(port) || port <= 0) {
			return;
		}

		preferredPortsByThread.set(key, port);
		avoidedPortsByThread.delete(key);
	}

	function markFailure(threadId, port) {
		const key = normalizeThreadId(threadId);
		if (!key || !Number.isInteger(port) || port <= 0) {
			return;
		}

		if (preferredPortsByThread.get(key) === port) {
			preferredPortsByThread.delete(key);
		}

		const existing = avoidedPortsByThread.get(key) ?? [];
		if (!existing.includes(port)) {
			avoidedPortsByThread.set(key, [...existing, port]);
		}
	}

	function clear(threadId) {
		const key = normalizeThreadId(threadId);
		if (!key) {
			return;
		}

		preferredPortsByThread.delete(key);
		avoidedPortsByThread.delete(key);
	}

	return {
		getPreferredPort,
		getAvoidPorts,
		markSuccess,
		markFailure,
		clear,
	};
}

module.exports = {
	createRovoPortAffinity,
};
