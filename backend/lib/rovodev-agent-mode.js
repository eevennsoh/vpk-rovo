/**
 * RovoDev Serve agent-mode client.
 *
 * Provides access to the agent-mode endpoints:
 *   GET  /agent-mode      — get current agent mode
 *   PUT  /agent-mode      — set agent mode
 *   GET  /available-modes — list available modes
 */

const { request } = require("./rovodev-client");

/**
 * Get the current agent mode.
 * @param {number} [port]
 * @returns {Promise<{ mode: "default"|"plan"|"ask", message: string }>}
 */
async function getAgentMode(port) {
	const { status, data } = await request("GET", "/agent-mode", undefined, 10000, port);
	if (status !== 200) {
		throw new Error(`Get agent mode failed (status ${status}): ${data}`);
	}
	return JSON.parse(data);
}

/**
 * Set the agent mode.
 * @param {number} [port]
 * @param {"plan"|"default"|"ask"} mode
 * @returns {Promise<{ mode: string, message: string }>}
 */
async function setAgentMode(port, mode) {
	const { status, data } = await request("PUT", "/agent-mode", { mode }, 10000, port);
	if (status !== 200) {
		throw new Error(`Set agent mode failed (status ${status}): ${data}`);
	}
	return JSON.parse(data);
}

/**
 * Get available agent modes.
 * @param {number} [port]
 * @returns {Promise<{ modes: Array<{ name: string, description: string, tag?: string }> }>}
 */
async function getAvailableModes(port) {
	const { status, data } = await request("GET", "/available-modes", undefined, 10000, port);
	if (status !== 200) {
		throw new Error(`Get available modes failed (status ${status}): ${data}`);
	}
	return JSON.parse(data);
}

module.exports = {
	getAgentMode,
	setAgentMode,
	getAvailableModes,
};
