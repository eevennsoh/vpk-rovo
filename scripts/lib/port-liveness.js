const net = require("node:net");

const DEFAULT_HOST = "127.0.0.1";
const DEFAULT_TIMEOUT_MS = 250;

function probePortAlive(port, { host = DEFAULT_HOST, timeoutMs = DEFAULT_TIMEOUT_MS } = {}) {
	return new Promise((resolve) => {
		const numericPort = Number(port);
		if (!Number.isInteger(numericPort) || numericPort <= 0) {
			resolve(false);
			return;
		}

		const socket = net.createConnection({ port: numericPort, host });
		let settled = false;
		const finish = (alive) => {
			if (settled) return;
			settled = true;
			socket.destroy();
			resolve(alive);
		};

		socket.once("connect", () => finish(true));
		socket.once("error", () => finish(false));
		socket.setTimeout(timeoutMs, () => finish(false));
	});
}

module.exports = {
	probePortAlive,
};
