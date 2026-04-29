"use strict";

const http = require("http");
const { URL } = require("url");

function createStatusServer(orchestrator) {
	return http.createServer((req, res) => {
		const url = new URL(req.url, "http://127.0.0.1");
		if (req.url === "/healthz") {
			res.writeHead(200, { "Content-Type": "application/json" });
			res.end(JSON.stringify({ ok: true }));
			return;
		}
		if (url.pathname === "/status") {
			const status = orchestrator.status ? orchestrator.status() : orchestrator.snapshot();
			const issue = url.searchParams.get("issue");
			if (issue && Array.isArray(status.recentEvents)) {
				status.recentEvents = status.recentEvents.filter((event) => event.issueIdentifier === issue || event.issueId === issue);
			}
			res.writeHead(200, { "Content-Type": "application/json" });
			res.end(JSON.stringify(status, null, 2));
			return;
		}

		res.writeHead(404, { "Content-Type": "application/json" });
		res.end(JSON.stringify({ error: "not_found" }));
	});
}

module.exports = {
	createStatusServer,
};
