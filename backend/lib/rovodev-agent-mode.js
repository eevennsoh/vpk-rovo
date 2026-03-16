/**
 * RovoDev Serve agent-mode client.
 *
 * Provides access to the agent-mode endpoints:
 *   GET  /v3/agent-mode      — get current agent mode
 *   PUT  /v3/agent-mode      — set agent mode
 *   GET  /v3/available-modes — list available modes
 */

const { request } = require("./rovodev-client");

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
 * @returns {Promise<{ mode: "default"|"plan"|"ask", message: string }>}
 */
async function getAgentMode(port) {
	return requestAgentModeJson({
		method: "GET",
		path: "/v3/agent-mode",
		port,
		errorLabel: "Get agent mode",
	});
}

/**
 * Set the agent mode.
 * @param {number} [port]
 * @param {"plan"|"default"|"ask"} mode
 * @returns {Promise<{ mode: string, message: string }>}
 */
async function setAgentMode(port, mode) {
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
	return requestAgentModeJson({
		method: "GET",
		path: "/v3/available-modes",
		port,
		errorLabel: "Get available modes",
	});
}

module.exports = {
	getAgentMode,
	setAgentMode,
	getAvailableModes,
};
