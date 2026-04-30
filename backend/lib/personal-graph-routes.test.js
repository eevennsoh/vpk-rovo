"use strict";

const assert = require("node:assert/strict");
const os = require("node:os");
const path = require("node:path");
const express = require("express");
const test = require("node:test");
const {
	createCapturedResponse,
	createInProcessRequest,
} = require("./in-process-http");
const personalGraphRoutes = require("./personal-graph-routes");

function createPersonalGraphTestApp() {
	const app = express();
	app.use(express.json());
	app.use("/api/personal-graph", personalGraphRoutes);
	app.get("/{*splat}", (req, res) => {
		if (req.path.startsWith("/api/")) {
			return res.status(404).json({
				error: `API route not found: ${req.path}`,
			});
		}
		return res.status(404).end();
	});
	return app;
}

async function dispatch(app, { method = "GET", url }) {
	const req = createInProcessRequest({
		headers: { Accept: "application/json" },
	});
	req.method = method;
	req.url = url;
	req.originalUrl = url;

	const res = createCapturedResponse();
	app.handle(req, res, (error) => {
		if (error) {
			res.status(500).json({
				error: error instanceof Error ? error.message : String(error),
			});
			return;
		}
		res.status(404).json({
			error: `API route not found: ${url}`,
		});
	});
	await res.waitForHeaders();
	return res.toWebResponse();
}

test("GET /api/personal-graph/vault is handled by the Personal Graph router", async (t) => {
	const originalVault = process.env.PERSONAL_GRAPH_VAULT;
	const originalSelectedVault = process.env.PERSONAL_GRAPH_SELECTED_VAULT;
	const originalConfigPath = process.env.PERSONAL_GRAPH_VAULT_CONFIG_PATH;
	process.env.PERSONAL_GRAPH_VAULT = "";
	process.env.PERSONAL_GRAPH_SELECTED_VAULT = "";
	process.env.PERSONAL_GRAPH_VAULT_CONFIG_PATH = path.join(
		os.tmpdir(),
		`personal-graph-route-test-${process.pid}.json`,
	);
	t.after(() => {
		if (originalVault === undefined) {
			delete process.env.PERSONAL_GRAPH_VAULT;
		} else {
			process.env.PERSONAL_GRAPH_VAULT = originalVault;
		}
		if (originalSelectedVault === undefined) {
			delete process.env.PERSONAL_GRAPH_SELECTED_VAULT;
		} else {
			process.env.PERSONAL_GRAPH_SELECTED_VAULT = originalSelectedVault;
		}
		if (originalConfigPath === undefined) {
			delete process.env.PERSONAL_GRAPH_VAULT_CONFIG_PATH;
		} else {
			process.env.PERSONAL_GRAPH_VAULT_CONFIG_PATH = originalConfigPath;
		}
	});

	const response = await dispatch(createPersonalGraphTestApp(), {
		url: "/api/personal-graph/vault",
	});
	const body = await response.json();

	assert.equal(response.status, 200);
	assert.equal(body.status, "unconfigured");
	assert.equal(body.message, "Choose a Personal Graph vault folder to get started.");
	assert.equal(body.error, undefined);
});
