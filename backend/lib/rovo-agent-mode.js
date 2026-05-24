/**
 * Rovo Serve agent-mode client.
 *
 * Provides access to the agent-mode endpoints:
 *   GET  /v3/agent-mode      — get current agent mode
 *   PUT  /v3/agent-mode      — set agent mode
 *   GET  /v3/available-modes — list available modes
 */

const { request } = require("./rovo-client");

const SUPPORTED_AGENT_MODES = new Set(["default", "ask", "plan"]);

function isSupportedAgentMode(mode) {
	return typeof mode === "string" && SUPPORTED_AGENT_MODES.has(mode);
}

async function requestAgentModeJson({
	method,
	path,
	body,
	port,
	errorLabel,
}) {
	const response = await request(method, path, body, 10000, port);

	if (response.status !== 200) {
		throw new Error(`${errorLabel} failed (status ${response.status}): ${response.data}`);
	}

	return JSON.parse(response.data);
}

/**
 * Get the current agent mode.
 * @param {number} [port]
 * @returns {Promise<{ mode: "default"|"ask"|"plan"|null, message: string }>}
 */
async function getAgentMode(port) {
	const payload = await requestAgentModeJson({
		method: "GET",
		path: "/v3/agent-mode",
		port,
		errorLabel: "Get agent mode",
	});

	const mode = isSupportedAgentMode(payload.mode) ? payload.mode : null;
	return {
		...payload,
		mode,
	};
}

/**
 * Set the agent mode.
 * @param {number} [port]
 * @param {"default"|"ask"|"plan"} mode
 * @returns {Promise<{ mode: string, message: string }>}
 */
async function setAgentMode(port, mode) {
	if (!isSupportedAgentMode(mode)) {
		throw new Error(`Unsupported agent mode: ${String(mode)}`);
	}

	return requestAgentModeJson({
		method: "PUT",
		path: "/v3/agent-mode",
		body: { mode },
		port,
		errorLabel: "Set agent mode",
	});
}

/**
 * Get available agent modes.
 * @param {number} [port]
 * @returns {Promise<{ modes: Array<{ name: string, description: string, tag?: string }> }>}
 */
async function getAvailableModes(port) {
	const payload = await requestAgentModeJson({
		method: "GET",
		path: "/v3/available-modes",
		port,
		errorLabel: "Get available modes",
	});

	return {
		...payload,
		modes: Array.isArray(payload.modes)
			? payload.modes.filter((mode) => {
				const modeName =
					typeof mode?.mode === "string"
						? mode.mode
						: typeof mode?.name === "string"
							? mode.name
							: null;
				return isSupportedAgentMode(modeName);
			})
			: [],
	};
}

module.exports = {
	getAgentMode,
	setAgentMode,
	getAvailableModes,
};
