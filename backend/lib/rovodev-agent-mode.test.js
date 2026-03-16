const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");

const {
	getAgentMode,
	setAgentMode,
	getAvailableModes,
} = require("./rovodev-agent-mode");

function listen(server) {
	return new Promise((resolve, reject) => {
		server.listen(0, "127.0.0.1", () => {
			const address = server.address();
			if (!address || typeof address !== "object") {
				reject(new Error("Failed to read test server address"));
				return;
			}
			resolve(address.port);
		});
	});
}

function close(server) {
	return new Promise((resolve, reject) => {
		server.close((error) => {
			if (error) {
				reject(error);
				return;
			}
			resolve();
		});
	});
}

function readJson(req) {
	return new Promise((resolve, reject) => {
		let raw = "";
		req.setEncoding("utf8");
		req.on("data", (chunk) => {
			raw += chunk;
		});
		req.on("end", () => {
			try {
				resolve(raw ? JSON.parse(raw) : null);
			} catch (error) {
				reject(error);
			}
		});
		req.on("error", reject);
	});
}

test("setAgentMode targets the versioned v3 endpoint and supports plan mode", async () => {
	const requests = [];
	const server = http.createServer(async (req, res) => {
		requests.push(`${req.method} ${req.url}`);
		if (req.method === "PUT" && req.url === "/v3/agent-mode") {
			const body = await readJson(req);
			assert.deepEqual(body, { mode: "plan" });
			res.writeHead(200, { "Content-Type": "application/json" });
			res.end(JSON.stringify({
				mode: "plan",
				message: "Agent mode changed to plan",
			}));
			return;
		}

		res.writeHead(404, { "Content-Type": "application/json" });
		res.end(JSON.stringify({ detail: "Not Found" }));
	});

	const port = await listen(server);

	try {
		const result = await setAgentMode(port, "plan");
		assert.deepEqual(result, {
			mode: "plan",
			message: "Agent mode changed to plan",
		});
		assert.deepEqual(requests, ["PUT /v3/agent-mode"]);
	} finally {
		await close(server);
	}
});

test("agent-mode helpers fail immediately when the v3 endpoint is unavailable", async () => {
	const requests = [];
	const server = http.createServer(async (req, res) => {
		requests.push(`${req.method} ${req.url}`);
		if (
			req.url === "/v3/agent-mode" ||
			req.url === "/v3/available-modes"
		) {
			res.writeHead(404, { "Content-Type": "application/json" });
			res.end(JSON.stringify({ detail: "Not Found" }));
			return;
		}

		res.writeHead(404, { "Content-Type": "application/json" });
		res.end(JSON.stringify({ detail: "Not Found" }));
	});

	const port = await listen(server);

	try {
		await assert.rejects(() => getAgentMode(port), /Get agent mode failed \(status 404\)/);
		await assert.rejects(() => setAgentMode(port, "plan"), /Set agent mode failed \(status 404\)/);
		await assert.rejects(
			() => getAvailableModes(port),
			/Get available modes failed \(status 404\)/
		);
		assert.deepEqual(requests, [
			"GET /v3/agent-mode",
			"PUT /v3/agent-mode",
			"GET /v3/available-modes",
		]);
	} finally {
		await close(server);
	}
});
