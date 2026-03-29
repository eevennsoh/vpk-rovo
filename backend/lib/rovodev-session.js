const { request } = require("./rovodev-client");

function normalizeSessionId(rawValue) {
	if (typeof rawValue === "string" && rawValue.trim()) {
		return rawValue.trim();
	}

	return null;
}

function normalizeSessionHeaderSessionId(headers) {
	if (!headers || typeof headers !== "object") {
		return null;
	}

	const rawHeaderValue = headers["x-session-id"];
	if (Array.isArray(rawHeaderValue)) {
		for (const value of rawHeaderValue) {
			const normalizedValue = normalizeSessionId(value);
			if (normalizedValue) {
				return normalizedValue;
			}
		}
		return null;
	}

	return normalizeSessionId(rawHeaderValue);
}

function normalizeSessionResponse(data, headers) {
	if (!data || typeof data !== "object") {
		const headerSessionId = normalizeSessionHeaderSessionId(headers);
		if (!headerSessionId) {
			return null;
		}

		return {
			sessionId: headerSessionId,
			title: null,
			raw: data,
		};
	}

	const sessionId =
		normalizeSessionId(data.session_id) ||
		normalizeSessionId(data.sessionId) ||
		normalizeSessionId(data.session_context?.id) ||
		normalizeSessionHeaderSessionId(headers);
	if (!sessionId) {
		return null;
	}

	return {
		sessionId,
		title:
			typeof data.title === "string" && data.title.trim()
				? data.title.trim()
				: null,
		raw: data,
	};
}

function createHttpStatusError(message, status, endpoint, data) {
	const error = new Error(message);
	error.status = status;
	error.statusCode = status;
	error.endpoint = endpoint;
	if (typeof data === "string" && data.length > 0) {
		error.response = data;
	}
	return error;
}

async function requestSessionJson(method, path, body, timeoutMs, port) {
	const { status, data, headers } = await request(method, path, body, timeoutMs, port);
	if (status !== 200) {
		throw createHttpStatusError(
			`${method} ${path} failed (status ${status}): ${data}`,
			status,
			path,
			data,
		);
	}

	const parsed = data ? JSON.parse(data) : null;
	return normalizeSessionResponse(parsed, headers);
}

async function createRovoDevSession(port, { customTitle, timeoutMs = 10_000 } = {}) {
	const body =
		typeof customTitle === "string" && customTitle.trim()
			? { custom_title: customTitle.trim() }
			: undefined;
	return requestSessionJson("POST", "/v3/sessions/create", body, timeoutMs, port);
}

async function getCurrentRovoDevSession(port, { timeoutMs = 10_000 } = {}) {
	return requestSessionJson("GET", "/v3/sessions/current_session", undefined, timeoutMs, port);
}

async function restoreRovoDevSession(port, sessionId, { timeoutMs = 10_000 } = {}) {
	const normalizedSessionId = normalizeSessionId(sessionId);
	if (!normalizedSessionId) {
		throw new Error("A non-empty sessionId is required to restore a RovoDev session.");
	}

	return requestSessionJson(
		"POST",
		`/v3/sessions/${encodeURIComponent(normalizedSessionId)}/restore`,
		undefined,
		timeoutMs,
		port,
	);
}

async function ensureRovoDevSession(port, {
	sessionId,
	customTitle,
	timeoutMs = 10_000,
} = {}) {
	const normalizedSessionId = normalizeSessionId(sessionId);
	if (normalizedSessionId) {
		try {
			return await restoreRovoDevSession(port, normalizedSessionId, { timeoutMs });
		} catch (error) {
			const status =
				typeof error?.status === "number"
					? error.status
					: typeof error?.statusCode === "number"
						? error.statusCode
						: null;
			if (status !== 404) {
				throw error;
			}
		}
	}

	return createRovoDevSession(port, { customTitle, timeoutMs });
}

module.exports = {
	createRovoDevSession,
	ensureRovoDevSession,
	getCurrentRovoDevSession,
	normalizeSessionId,
	restoreRovoDevSession,
};
