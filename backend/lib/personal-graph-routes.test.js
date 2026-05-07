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
const personalGraphQmd = require("./personal-graph-qmd");
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

function setEnvValueForTest(t, key, value) {
	const originalValue = process.env[key];
	process.env[key] = value;

	t.after(() => {
		if (originalValue === undefined) {
			delete process.env[key];
			return;
		}

		process.env[key] = originalValue;
	});
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

function configureSelectedVault(t, vaultRoot) {
	const originalVault = process.env.PERSONAL_GRAPH_VAULT;
	const originalSelectedVault = process.env.PERSONAL_GRAPH_SELECTED_VAULT;
	const originalConfigPath = process.env.PERSONAL_GRAPH_VAULT_CONFIG_PATH;
	const configPath = path.join(
		os.tmpdir(),
		`personal-graph-route-test-${process.pid}-${Date.now()}.json`,
	);
	delete process.env.PERSONAL_GRAPH_VAULT;
	process.env.PERSONAL_GRAPH_SELECTED_VAULT = vaultRoot;
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

	return configPath;
}

test("GET /api/personal-graph/vault is handled by the Personal Graph router", async (t) => {
	const configPath = path.join(os.tmpdir(), `personal-graph-route-test-${process.pid}.json`);
	fs.rmSync(configPath, { force: true });
	t.after(() => {
		fs.rmSync(configPath, { force: true });
	});
	setEnvValueForTest(t, "PERSONAL_GRAPH_VAULT", "/tmp/ignored-personal-graph-env-vault");
	setEnvValueForTest(t, "PERSONAL_GRAPH_SELECTED_VAULT", "");
	setEnvValueForTest(t, "PERSONAL_GRAPH_VAULT_CONFIG_PATH", configPath);

	const response = await dispatch(createPersonalGraphTestApp(), {
		url: "/api/personal-graph/vault",
	});
	const body = await response.json();

	assert.equal(response.status, 200);
	assert.equal(body.status, "unconfigured");
	assert.equal(body.message, "Select a folder to get started.");
	assert.equal(body.error, undefined);
});

test("GET /api/personal-graph/search normalizes non-positive limits", async (t) => {
	const originalSearch = personalGraphQmd.search;
	const observedLimits = [];
	personalGraphQmd.search = async (_query, options) => {
		observedLimits.push(options.limit);
		return [];
	};
	t.after(() => {
		personalGraphQmd.search = originalSearch;
	});

	const response = await dispatch(createPersonalGraphTestApp(), {
		url: "/api/personal-graph/search?q=graph&limit=-1",
	});
	const body = await response.json();

	assert.equal(response.status, 200);
	assert.deepEqual(body, { results: [] });
	assert.deepEqual(observedLimits, [10]);
});

test("POST /api/personal-graph/raw accepts multipart file uploads into the selected vault", async (t) => {
	const vaultRoot = fs.mkdtempSync(path.join(os.tmpdir(), "personal-graph-route-raw-"));
	configureSelectedVault(t, vaultRoot);
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

test("POST /api/personal-graph/vault/reset clears folder picker state without deleting vault files", async (t) => {
	const envRoot = fs.mkdtempSync(path.join(os.tmpdir(), "personal-graph-route-reset-env-"));
	const selectedRoot = fs.mkdtempSync(path.join(os.tmpdir(), "personal-graph-route-reset-selected-"));
	const configPath = configureSelectedVault(t, selectedRoot);
	const selectedRawPath = path.join(selectedRoot, "raw", "capture.md");
	fs.mkdirSync(path.dirname(selectedRawPath), { recursive: true });
	fs.writeFileSync(selectedRawPath, "selected vault source", "utf8");
	fs.writeFileSync(configPath, JSON.stringify({ vaultRoot: selectedRoot }), "utf8");
	process.env.PERSONAL_GRAPH_VAULT = envRoot;
	process.env.PERSONAL_GRAPH_SELECTED_VAULT = selectedRoot;
	t.after(() => {
		fs.rmSync(envRoot, { force: true, recursive: true });
		fs.rmSync(selectedRoot, { force: true, recursive: true });
	});

	const beforeResponse = await dispatch(createPersonalGraphTestApp(), {
		url: "/api/personal-graph/vault",
	});
	const beforeBody = await beforeResponse.json();
	assert.equal(beforeResponse.status, 200);
	assert.equal(beforeBody.root, selectedRoot);
	assert.equal(beforeBody.source, "folder-picker");

	const resetResponse = await dispatch(createPersonalGraphTestApp(), {
		method: "POST",
		url: "/api/personal-graph/vault/reset",
	});
	const resetBody = await resetResponse.json();

	assert.equal(resetResponse.status, 200);
	assert.equal(resetBody.root, null);
	assert.equal(resetBody.source, null);
	assert.equal(resetBody.status, "unconfigured");
	assert.equal(process.env.PERSONAL_GRAPH_SELECTED_VAULT, undefined);
	assert.equal(fs.existsSync(configPath), false);
	assert.equal(fs.readFileSync(selectedRawPath, "utf8"), "selected vault source");
});

function configureTwgEnv(t) {
	const dir = fs.mkdtempSync(path.join(os.tmpdir(), "personal-graph-twg-env-"));
	const sourcePath = path.join(dir, "source.json");
	const cachePath = path.join(dir, "twg-cache.json");
	setEnvValueForTest(t, "PERSONAL_GRAPH_SOURCE_PATH", sourcePath);
	setEnvValueForTest(t, "PERSONAL_GRAPH_TWG_CACHE_PATH", cachePath);
	t.after(() => fs.rmSync(dir, { force: true, recursive: true }));
	return { sourcePath, cachePath };
}

test("GET /api/personal-graph/source defaults to vault when no state file exists", async (t) => {
	configureTwgEnv(t);
	const response = await dispatch(createPersonalGraphTestApp(), {
		url: "/api/personal-graph/source",
	});
	const body = await response.json();
	assert.equal(response.status, 200);
	assert.equal(body.source, "vault");
	assert.equal(body.generatedAt, null);
});

test("POST /api/personal-graph/source persists the active source", async (t) => {
	const { sourcePath } = configureTwgEnv(t);
	const post = await fetch(`${await listen(createPersonalGraphTestApp(), t)}/api/personal-graph/source`, {
		body: JSON.stringify({ source: "twg" }),
		headers: { "Content-Type": "application/json" },
		method: "POST",
	});
	const postBody = await post.json();
	assert.equal(post.status, 200);
	assert.equal(postBody.source, "twg");
	assert.equal(JSON.parse(fs.readFileSync(sourcePath, "utf8")).source, "twg");
});

test("POST /api/personal-graph/source rejects invalid sources", async (t) => {
	configureTwgEnv(t);
	const baseUrl = await listen(createPersonalGraphTestApp(), t);
	const post = await fetch(`${baseUrl}/api/personal-graph/source`, {
		body: JSON.stringify({ source: "nope" }),
		headers: { "Content-Type": "application/json" },
		method: "POST",
	});
	assert.equal(post.status, 400);
});

test("GET /api/personal-graph/explorer returns cached TWG payload when source is twg and cache exists", async (t) => {
	const { sourcePath, cachePath } = configureTwgEnv(t);
	fs.writeFileSync(sourcePath, JSON.stringify({ source: "twg" }), "utf8");
	const cachedExplorer = {
		edges: [],
		generatedAt: "2026-05-07T10:00:00.000Z",
		nodes: [{ id: "ari:cloud:identity::user/me", title: "Me", provider: "twg" }],
		stats: { nodeCount: 1, edgeCount: 0, danglingCount: 0, rawCount: 0, wikiCount: 0 },
	};
	fs.writeFileSync(cachePath, JSON.stringify(cachedExplorer), "utf8");
	const response = await dispatch(createPersonalGraphTestApp(), {
		url: "/api/personal-graph/explorer",
	});
	const body = await response.json();
	assert.equal(response.status, 200);
	assert.equal(body.generatedAt, "2026-05-07T10:00:00.000Z");
	assert.equal(body.nodes.length, 1);
});

test("GET /api/personal-graph/source includes generatedAt when TWG cache is present", async (t) => {
	const { sourcePath, cachePath } = configureTwgEnv(t);
	fs.writeFileSync(sourcePath, JSON.stringify({ source: "twg" }), "utf8");
	fs.writeFileSync(cachePath, JSON.stringify({ generatedAt: "2026-05-07T10:00:00.000Z" }), "utf8");
	const response = await dispatch(createPersonalGraphTestApp(), {
		url: "/api/personal-graph/source",
	});
	const body = await response.json();
	assert.equal(body.source, "twg");
	assert.equal(body.generatedAt, "2026-05-07T10:00:00.000Z");
});
