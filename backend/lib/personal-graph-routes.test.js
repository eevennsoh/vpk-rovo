"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
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

async function listen(app, t) {
	const server = app.listen(0, "127.0.0.1");
	t.after(() => new Promise((resolve, reject) => {
		server.close((error) => {
			if (error) {
				reject(error);
				return;
			}
			resolve();
		});
	}));

	await new Promise((resolve, reject) => {
		server.once("listening", resolve);
		server.once("error", reject);
	});

	const address = server.address();
	assert.ok(address && typeof address === "object");
	return `http://127.0.0.1:${address.port}`;
}

function configureVaultEnv(t, vaultRoot) {
	const originalVault = process.env.PERSONAL_GRAPH_VAULT;
	const originalSelectedVault = process.env.PERSONAL_GRAPH_SELECTED_VAULT;
	const originalConfigPath = process.env.PERSONAL_GRAPH_VAULT_CONFIG_PATH;
	const configPath = path.join(
		os.tmpdir(),
		`personal-graph-route-test-${process.pid}-${Date.now()}.json`,
	);
	process.env.PERSONAL_GRAPH_VAULT = vaultRoot;
	process.env.PERSONAL_GRAPH_SELECTED_VAULT = "";
	process.env.PERSONAL_GRAPH_VAULT_CONFIG_PATH = configPath;

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
		fs.rmSync(configPath, { force: true });
		fs.rmSync(vaultRoot, { force: true, recursive: true });
	});
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

test("POST /api/personal-graph/raw accepts multipart file uploads into the selected vault", async (t) => {
	const vaultRoot = fs.mkdtempSync(path.join(os.tmpdir(), "personal-graph-route-raw-"));
	configureVaultEnv(t, vaultRoot);
	const baseUrl = await listen(createPersonalGraphTestApp(), t);
	const boundary = "----personal-graph-route-test";
	const uploadBody = [
		`--${boundary}`,
		"Content-Disposition: form-data; name=\"file\"; filename=\"capture.txt\"",
		"Content-Type: text/plain",
		"",
		"Captured source body.",
		`--${boundary}--`,
		"",
	].join("\r\n");

	const response = await fetch(`${baseUrl}/api/personal-graph/raw`, {
		body: uploadBody,
		headers: { "Content-Type": `multipart/form-data; boundary=${boundary}` },
		method: "POST",
	});
	const body = await response.json();

	assert.equal(response.status, 201);
	assert.equal(body.relativePath, "raw/capture.txt");
	assert.equal(
		fs.readFileSync(path.join(vaultRoot, "raw", "capture.txt"), "utf8"),
		"Captured source body.",
	);
});
