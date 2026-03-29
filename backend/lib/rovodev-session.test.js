const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");

const {
	createRovoDevSession,
	ensureRovoDevSession,
	getCurrentRovoDevSession,
	restoreRovoDevSession,
} = require("./rovodev-session");

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

test("createRovoDevSession posts the documented create payload", async () => {
	const requests = [];
	const server = http.createServer(async (req, res) => {
		requests.push(`${req.method} ${req.url}`);
		if (req.method === "POST" && req.url === "/v3/sessions/create") {
			const body = await readJson(req);
			assert.deepEqual(body, { custom_title: "Launch plan" });
			res.writeHead(200, { "Content-Type": "application/json" });
			res.end(JSON.stringify({
				session_id: "session-1",
				title: "Launch plan",
				message: "Session created successfully",
			}));
			return;
		}

		res.writeHead(404, { "Content-Type": "application/json" });
		res.end(JSON.stringify({ detail: "Not Found" }));
	});

	const port = await listen(server);

	try {
		const result = await createRovoDevSession(port, {
			customTitle: "Launch plan",
		});

		assert.deepEqual(result, {
			sessionId: "session-1",
			title: "Launch plan",
			raw: {
				session_id: "session-1",
				title: "Launch plan",
				message: "Session created successfully",
			},
		});
		assert.deepEqual(requests, ["POST /v3/sessions/create"]);
	} finally {
		await close(server);
	}
});

test("restoreRovoDevSession posts the documented restore payload", async () => {
	const requests = [];
	const server = http.createServer(async (req, res) => {
		requests.push(`${req.method} ${req.url}`);
		if (req.method === "POST" && req.url === "/v3/sessions/session-2/restore") {
			res.writeHead(200, { "Content-Type": "application/json" });
			res.end(JSON.stringify({
				session_id: "session-2",
				message: "Session restored successfully",
			}));
			return;
		}

		res.writeHead(404, { "Content-Type": "application/json" });
		res.end(JSON.stringify({ detail: "Not Found" }));
	});

	const port = await listen(server);

	try {
		const result = await restoreRovoDevSession(port, "session-2");

		assert.deepEqual(result, {
			sessionId: "session-2",
			title: null,
			raw: {
				session_id: "session-2",
				message: "Session restored successfully",
			},
		});
		assert.deepEqual(requests, ["POST /v3/sessions/session-2/restore"]);
	} finally {
		await close(server);
	}
});

test("getCurrentRovoDevSession normalizes the current session payload", async () => {
	const requests = [];
	const server = http.createServer(async (req, res) => {
		requests.push(`${req.method} ${req.url}`);
		if (req.method === "GET" && req.url === "/v3/sessions/current_session") {
			res.writeHead(200, { "Content-Type": "application/json" });
			res.end(JSON.stringify({
				session_context: {
					id: "session-3",
				},
				title: "Current session",
			}));
			return;
		}

		res.writeHead(404, { "Content-Type": "application/json" });
		res.end(JSON.stringify({ detail: "Not Found" }));
	});

	const port = await listen(server);

	try {
		const result = await getCurrentRovoDevSession(port);

		assert.deepEqual(result, {
			sessionId: "session-3",
			title: "Current session",
			raw: {
				session_context: {
					id: "session-3",
				},
				title: "Current session",
			},
		});
		assert.deepEqual(requests, ["GET /v3/sessions/current_session"]);
	} finally {
		await close(server);
	}
});

test("getCurrentRovoDevSession falls back to X-Session-ID response header", async () => {
	const requests = [];
	const server = http.createServer(async (req, res) => {
		requests.push(`${req.method} ${req.url}`);
		if (req.method === "GET" && req.url === "/v3/sessions/current_session") {
			res.writeHead(200, {
				"Content-Type": "application/json",
				"X-Session-ID": "session-from-header",
			});
			res.end(JSON.stringify({
				title: "Current session",
			}));
			return;
		}

		res.writeHead(404, { "Content-Type": "application/json" });
		res.end(JSON.stringify({ detail: "Not Found" }));
	});

	const port = await listen(server);

	try {
		const result = await getCurrentRovoDevSession(port);

		assert.deepEqual(result, {
			sessionId: "session-from-header",
			title: "Current session",
			raw: {
				title: "Current session",
			},
		});
		assert.deepEqual(requests, ["GET /v3/sessions/current_session"]);
	} finally {
		await close(server);
	}
});

test("ensureRovoDevSession falls back to session creation when restore returns 404", async () => {
	const requests = [];
	const server = http.createServer(async (req, res) => {
		requests.push(`${req.method} ${req.url}`);
		if (req.method === "POST" && req.url === "/v3/sessions/session-4/restore") {
			res.writeHead(404, { "Content-Type": "application/json" });
			res.end(JSON.stringify({ detail: "Session not found" }));
			return;
		}

		if (req.method === "POST" && req.url === "/v3/sessions/create") {
			res.writeHead(200, { "Content-Type": "application/json" });
			res.end(JSON.stringify({
				session_id: "session-4-created",
				title: "Fallback session",
				message: "Session created successfully",
			}));
			return;
		}

		res.writeHead(404, { "Content-Type": "application/json" });
		res.end(JSON.stringify({ detail: "Not Found" }));
	});

	const port = await listen(server);

	try {
		const result = await ensureRovoDevSession(port, {
			sessionId: "session-4",
			customTitle: "Fallback session",
		});

		assert.deepEqual(result, {
			sessionId: "session-4-created",
			title: "Fallback session",
			raw: {
				session_id: "session-4-created",
				title: "Fallback session",
				message: "Session created successfully",
			},
		});
		assert.deepEqual(requests, [
			"POST /v3/sessions/session-4/restore",
			"POST /v3/sessions/create",
		]);
	} finally {
		await close(server);
	}
});
