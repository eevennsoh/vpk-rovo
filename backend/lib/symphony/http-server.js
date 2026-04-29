"use strict";

const http = require("http");

function createStatusServer(orchestrator) {
	return http.createServer((req, res) => {
		if (req.url === "/healthz") {
			res.writeHead(200, { "Content-Type": "application/json" });
			res.end(JSON.stringify({ ok: true }));
			return;
		}
		if (req.url === "/status") {
			res.writeHead(200, { "Content-Type": "application/json" });
			res.end(JSON.stringify(orchestrator.snapshot(), null, 2));
			return;
		}

		res.writeHead(404, { "Content-Type": "application/json" });
		res.end(JSON.stringify({ error: "not_found" }));
	});
}

module.exports = {
	createStatusServer,
};
