"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const {
	buildWikiMemoryContextDescription,
	enqueueWikiMemoryProposal,
	ingestQueuedWikiMemoryProposals,
	listWikiMemoryProposals,
	regenerateWikiMemoryContext,
} = require("./wiki-memory-provider");

test("enqueueWikiMemoryProposal stores queued proposals under raw/turns", async () => {
	const wikiDir = await fs.mkdtemp(path.join(os.tmpdir(), "wiki-memory-provider-"));

	const proposal = await enqueueWikiMemoryProposal({
		content: "Prefers concise implementation notes.",
		target: "user",
		wikiDir,
	});

	assert.equal(proposal.scope, "profile");
	assert.equal(proposal.status, "queued");

	const proposals = await listWikiMemoryProposals({ wikiDir });
	assert.equal(proposals.length, 1);
	assert.equal(proposals[0].content, "Prefers concise implementation notes.");
	assert.equal(proposals[0].scope, "profile");
});

test("ingestQueuedWikiMemoryProposals updates canonical pages, marks proposals ingested, and regenerates compiled context", async () => {
	const wikiDir = await fs.mkdtemp(path.join(os.tmpdir(), "wiki-memory-provider-ingest-"));
	const qmdCalls = [];

	await enqueueWikiMemoryProposal({
		content: "Keep the runtime loop on RovoDev.",
		target: "memory",
		wikiDir,
	});

	const result = await ingestQueuedWikiMemoryProposals({
		generateTextImpl: async ({ system }) => {
			if (system.includes("maintain the canonical runtime memory")) {
				return [
					"---",
					'title: "Core Memory"',
					"created: \"2026-04-12\"",
					"updated: \"2026-04-12\"",
					'type: "operations"',
					'tags: ["operations", "memory"]',
					"sources: []",
					"---",
					"",
					"# Core Memory",
					"",
					"## Durable Memory",
					"",
					"- Keep the runtime loop on RovoDev.",
					"",
					"## Recent Changes",
					"",
					"- Added runtime loop preference.",
				].join("\n");
			}

			if (system.includes("compile runtime memory")) {
				return "# Runtime Context\n\n- Keep the runtime loop on RovoDev.";
			}

			return "# Profile Context\n\n- No profile context yet.";
		},
		qmdSyncImpl: async (payload) => {
			qmdCalls.push(payload);
		},
		wikiDir,
	});

	assert.equal(result.processed, 1);
	assert.deepEqual(result.updatedScopes, ["operations"]);
	assert.equal(qmdCalls.length, 1);
	assert.equal(qmdCalls[0].collectionName, "wiki-operations");

	const canonicalPage = await fs.readFile(path.join(wikiDir, "operations", "core-memory.md"), "utf8");
	assert.match(canonicalPage, /Keep the runtime loop on RovoDev/u);

	const proposals = await listWikiMemoryProposals({ wikiDir });
	assert.equal(proposals[0].status, "ingested");

	const runtimeContext = await fs.readFile(path.join(wikiDir, "output", "runtime-context.md"), "utf8");
	assert.match(runtimeContext, /Runtime Context/u);
});

test("buildWikiMemoryContextDescription reads compiled artifacts", async () => {
	const wikiDir = await fs.mkdtemp(path.join(os.tmpdir(), "wiki-memory-provider-context-"));

	await regenerateWikiMemoryContext({
		generateTextImpl: async ({ system }) => {
			return system.includes("profile")
				? "# Profile Context\n\n- Prefers concise answers."
				: "# Runtime Context\n\n- Keep the runtime loop on RovoDev.";
		},
		wikiDir,
	});

	const description = await buildWikiMemoryContextDescription({ wikiDir });
	assert.match(description, /\[Hermes Memory\]/u);
	assert.match(description, /Prefers concise answers/u);
	assert.match(description, /runtime loop on RovoDev/u);
});
