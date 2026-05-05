"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const { run } = require("./personal-graph-librarian");

const TEST_VAULT_CONFIG_PATH = path.join(os.tmpdir(), `personal-graph-librarian-test-${process.pid}.json`);
fs.rmSync(TEST_VAULT_CONFIG_PATH, { force: true });
process.env.PERSONAL_GRAPH_VAULT_CONFIG_PATH = TEST_VAULT_CONFIG_PATH;
delete process.env.PERSONAL_GRAPH_SELECTED_VAULT;

function withVault(t) {
	const originalSelectedVault = process.env.PERSONAL_GRAPH_SELECTED_VAULT;
	const vaultRoot = fs.mkdtempSync(path.join(os.tmpdir(), "personal-graph-librarian-"));
	fs.mkdirSync(path.join(vaultRoot, "raw"), { recursive: true });
	fs.mkdirSync(path.join(vaultRoot, "wiki", "sources"), { recursive: true });
	fs.writeFileSync(path.join(vaultRoot, "raw", "source.md"), "---\ntitle: Source\n---\n\nRaw body.", "utf8");
	process.env.PERSONAL_GRAPH_SELECTED_VAULT = vaultRoot;
	t.after(() => {
		if (originalSelectedVault === undefined) delete process.env.PERSONAL_GRAPH_SELECTED_VAULT;
		else process.env.PERSONAL_GRAPH_SELECTED_VAULT = originalSelectedVault;
		fs.rmSync(vaultRoot, { force: true, recursive: true });
	});
	return vaultRoot;
}

test("run emits summarize, related, and writes on confirmation", async (t) => {
	const vaultRoot = withVault(t);
	const events = [];
	for await (const event of run({
		confirmation: true,
		qmdImpl: { relatedPages: async () => [] },
		sourcePath: "raw/source.md",
		summarizeImpl: async () => ({ summary: "Summary", takeaways: ["A", "B", "C"] }),
	})) {
		events.push(event);
	}

	assert.ok(events.some((event) => event.type === "summary"));
	assert.equal(events.at(-1).type, "done");
	assert.ok(fs.existsSync(path.join(vaultRoot, "wiki", "sources", "source.md")));
	assert.match(fs.readFileSync(path.join(vaultRoot, "wiki", "log.md"), "utf8"), /"type":"ingest"/u);
});

test("run does not duplicate log entries for the same raw source", async (t) => {
	const vaultRoot = withVault(t);
	const options = {
		confirmation: true,
		qmdImpl: { relatedPages: async () => [] },
		sourcePath: "raw/source.md",
		summarizeImpl: async () => ({ summary: "Summary", takeaways: ["A", "B", "C"] }),
	};
	for await (const event of run(options)) assert.ok(event.type);
	for await (const event of run(options)) assert.ok(event.type);
	const logText = fs.readFileSync(path.join(vaultRoot, "wiki", "log.md"), "utf8").trim();
	assert.equal(logText.split("\n").length, 1);
});

test("run normalizes executed log status after confirmation", async (t) => {
	const vaultRoot = withVault(t);
	for await (const event of run({
		aiGatewayProvider: {
			generateText: async () => JSON.stringify({
				log: {
					source: "raw/source.md",
					status: "awaiting_confirmation",
					type: "ingest",
				},
				pages: [
					{
						content: "---\ntitle: Source\n---\n\n# Source",
						slug: "sources/source",
					},
				],
			}),
		},
		confirmation: true,
		qmdImpl: { relatedPages: async () => [] },
		sourcePath: "raw/source.md",
		summarizeImpl: async () => ({ summary: "Summary", takeaways: ["A"] }),
	})) {
		assert.ok(event.type);
	}

	const [entry] = fs.readFileSync(path.join(vaultRoot, "wiki", "log.md"), "utf8")
		.trim()
		.split("\n")
		.map((line) => JSON.parse(line));
	assert.equal(entry.status, "completed");
});
