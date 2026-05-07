"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const { EventEmitter } = require("node:events");

const {
	TwgAuthError,
	TwgNotFoundError,
	buildTwgExplorer,
	fetchSlice,
	normalizeContextResponse,
} = require("./personal-graph-twg-source");

const FIXTURE = JSON.parse(
	fs.readFileSync(path.join(__dirname, "__fixtures__", "twg-context-user.json"), "utf8"),
);

function createFakeChild({ stdout = "", stderr = "", code = 0, error = null, throwOnSpawn = null } = {}) {
	const spawnImpl = () => {
		if (throwOnSpawn) {
			throw throwOnSpawn;
		}
		const child = new EventEmitter();
		child.stdout = new EventEmitter();
		child.stderr = new EventEmitter();
		queueMicrotask(() => {
			if (error) {
				child.emit("error", error);
				return;
			}
			if (stdout) child.stdout.emit("data", Buffer.from(stdout));
			if (stderr) child.stderr.emit("data", Buffer.from(stderr));
			child.emit("close", code);
		});
		return child;
	};
	return spawnImpl;
}

test("normalizeContextResponse builds root + targets from fixture", () => {
	const explorer = normalizeContextResponse(FIXTURE);
	assert.ok(explorer.nodes.length > 1, "should produce more than just the root node");
	const root = explorer.nodes.find((node) => node.kind === "entity");
	assert.ok(root, "root entity present");
	assert.equal(root.provider, "twg");
	assert.equal(root.externalUrl, null);
	assert.match(root.id, /^ari:cloud:identity::user\//u);

	const allTwg = explorer.nodes.every((node) => node.provider === "twg");
	assert.ok(allTwg, "every node has provider=twg");

	const someEdges = explorer.edges.length > 0;
	assert.ok(someEdges, "produces edges");
	const edgeKinds = new Set(explorer.edges.map((edge) => edge.kind));
	for (const kind of edgeKinds) {
		assert.ok(
			["worked-on", "mentioned-in", "viewed", "attended", "reports-to", "aligned-to", "member-of", "reviewed"].includes(kind),
			`edge kind ${kind} is in the widened union`,
		);
	}
});

test("normalizeContextResponse keeps externalUrl when target has url, null otherwise", () => {
	const explorer = normalizeContextResponse(FIXTURE);
	const withUrl = explorer.nodes.filter((node) => node.externalUrl);
	const withoutUrl = explorer.nodes.filter((node) => !node.externalUrl);
	assert.ok(withUrl.length > 0, "some nodes have external URLs");
	assert.ok(withoutUrl.length > 0, "some nodes have no URL (Confluence pages without hydration)");
	for (const node of withUrl) {
		assert.match(node.externalUrl, /^https?:\/\//u, "externalUrl is a real URL when set");
	}
});

test("normalizeContextResponse drops unmapped relationship names with a warn log", () => {
	const consoleWarn = console.warn;
	const warnings = [];
	console.warn = (...args) => warnings.push(args.join(" "));
	try {
		const payload = {
			data: {
				object: { ari: "ari:cloud:identity::user/me", type: "AtlassianAccountUser", name: "Me" },
				relationshipSummary: [
					{
						relationshipName: "atlassian_user_does_a_brand_new_thing",
						count: 1,
						targets: [{ ari: "ari:cloud:foo::thing/123", type: "Thing" }],
					},
					{
						relationshipName: "atlassian_user_viewed_confluence_page",
						count: 1,
						targets: [{ ari: "ari:cloud:confluence:c1:page/1", type: "ConfluencePage" }],
					},
				],
			},
		};
		const explorer = normalizeContextResponse(payload);
		assert.equal(explorer.nodes.length, 2, "only root + the mapped target remain");
		assert.equal(explorer.edges.length, 1, "only the mapped edge");
		assert.ok(warnings.some((w) => w.includes("atlassian_user_does_a_brand_new_thing")));
		assert.ok(!warnings.some((w) => w.includes("atlassian_user_viewed_confluence_page")));
	} finally {
		console.warn = consoleWarn;
	}
});

test("normalizeContextResponse handles empty relationships → root only", () => {
	const explorer = normalizeContextResponse({
		data: {
			object: { ari: "ari:cloud:identity::user/me", type: "AtlassianAccountUser", name: "Me" },
			relationshipSummary: [],
		},
	});
	assert.equal(explorer.nodes.length, 1);
	assert.equal(explorer.edges.length, 0);
	assert.equal(explorer.stats.nodeCount, 1);
});

test("normalizeContextResponse throws on missing root object", () => {
	assert.throws(() => normalizeContextResponse({ data: {} }), /missing `data.object.ari`/u);
	assert.throws(() => normalizeContextResponse(null), /no JSON payload/u);
});

test("buildTwgExplorer wires CLI output through normalize", async () => {
	const stdout = JSON.stringify(FIXTURE);
	const spawnImpl = createFakeChild({ stdout });
	const explorer = await buildTwgExplorer({ spawnImpl });
	assert.ok(explorer.nodes.length > 1);
	assert.equal(explorer.nodes[0].provider, "twg");
});

test("buildTwgExplorer throws on non-zero exit with stderr captured", async () => {
	const spawnImpl = createFakeChild({ stdout: "", stderr: "boom went the dynamite", code: 1 });
	await assert.rejects(buildTwgExplorer({ spawnImpl }), /exited 1: boom went the dynamite/u);
});

test("buildTwgExplorer maps auth-related stderr to TwgAuthError", async () => {
	const spawnImpl = createFakeChild({ stderr: "error: not authenticated; please run twg login", code: 1 });
	await assert.rejects(buildTwgExplorer({ spawnImpl }), TwgAuthError);
});

test("buildTwgExplorer maps ENOENT on spawn to TwgNotFoundError", async () => {
	const enoent = Object.assign(new Error("spawn twg ENOENT"), { code: "ENOENT" });
	const spawnImpl = createFakeChild({ error: enoent });
	await assert.rejects(buildTwgExplorer({ spawnImpl }), TwgNotFoundError);
});

test("buildTwgExplorer rejects with malformed-JSON message including snippet", async () => {
	const spawnImpl = createFakeChild({ stdout: "<html>oops not json</html>", code: 0 });
	await assert.rejects(buildTwgExplorer({ spawnImpl }), /malformed JSON: <html>oops not json<\/html>/u);
});

test("buildTwgExplorer respects an aborted signal", async () => {
	const controller = new AbortController();
	let spawnedSignal = null;
	const spawnImpl = (_bin, _args, options) => {
		spawnedSignal = options?.signal ?? null;
		const child = new EventEmitter();
		child.stdout = new EventEmitter();
		child.stderr = new EventEmitter();
		options?.signal?.addEventListener("abort", () => {
			child.emit("error", Object.assign(new Error("aborted"), { name: "AbortError" }));
		});
		return child;
	};
	const promise = buildTwgExplorer({ spawnImpl, signal: controller.signal });
	controller.abort();
	await assert.rejects(promise, /aborted/u);
	assert.equal(spawnedSignal, controller.signal, "signal forwarded to spawn");
});

test("fetchSlice('context-user') is an alias of buildTwgExplorer", async () => {
	const stdout = JSON.stringify(FIXTURE);
	const spawnImpl = createFakeChild({ stdout });
	const explorer = await fetchSlice("context-user", {}, { spawnImpl });
	assert.ok(explorer.nodes.length > 1);
});

test("fetchSlice rejects unknown slice names", async () => {
	await assert.rejects(fetchSlice("does-not-exist"), /Unknown TWG slice/u);
});
