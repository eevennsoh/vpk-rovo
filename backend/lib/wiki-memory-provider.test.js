"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const {
	buildWikiMemoryContextDescription,
	deleteWikiMemoryProposal,
	enqueueWikiMemoryProposal,
	getCanonicalWikiMemoryDocuments,
	ingestQueuedWikiMemoryProposals,
	listWikiMemoryProposals,
	pruneCanonicalWikiMemoryBlock,
	syncWikiBackedMemory,
	regenerateWikiMemoryContext,
} = require("./wiki-memory-provider");

test("enqueueWikiMemoryProposal stores queued proposals under raw/", async () => {
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

test("listWikiMemoryProposals scans shared raw folders but only returns memory-marked raw files", async () => {
	const wikiDir = await fs.mkdtemp(path.join(os.tmpdir(), "wiki-memory-provider-shared-raw-"));
	await fs.mkdir(path.join(wikiDir, "raw", "2026", "04"), { recursive: true });

	await fs.writeFile(
		path.join(wikiDir, "raw", "2026", "04", "capture.md"),
		[
			"---",
			'title: "Capture only"',
			"knowledge_status: queued",
			"---",
			"",
			"General knowledge capture that should not be treated as a memory proposal.",
		].join("\n"),
		"utf8",
	);

	await enqueueWikiMemoryProposal({
		content: "Remember the user's preference for concise answers.",
		target: "user",
		wikiDir,
	});

	const proposals = await listWikiMemoryProposals({ wikiDir });
	assert.equal(proposals.length, 1);
	assert.equal(proposals[0].scope, "profile");
});

test("ingestQueuedWikiMemoryProposals updates canonical pages, marks proposals ingested, and regenerates compiled context", async () => {
	const wikiDir = await fs.mkdtemp(path.join(os.tmpdir(), "wiki-memory-provider-ingest-"));
	const qmdCalls = [];

	await enqueueWikiMemoryProposal({
		content: "Keep the runtime loop on Rovo.",
		target: "memory",
		wikiDir,
	});

	const result = await ingestQueuedWikiMemoryProposals({
		generateTextImpl: async ({ system }) => {
			if (system.includes("maintain the canonical work context")) {
				return [
					"---",
					'title: "Work Context"',
					"created: \"2026-04-12\"",
					"updated: \"2026-04-12\"",
					'type: "work"',
					'tags: ["work", "memory"]',
					"sources: []",
					"---",
					"",
					"# Work Context",
					"",
					"## Durable Memory",
					"",
					"- Keep the runtime loop on Rovo.",
					"",
					"## Recent Changes",
					"",
					"- Added runtime loop preference.",
				].join("\n");
			}

			if (system.includes("compile work context")) {
				return "# Work Context\n\n- Keep the runtime loop on Rovo.";
			}

			return "# Profile Context\n\n- No profile context yet.";
		},
		qmdSyncImpl: async (payload) => {
			qmdCalls.push(payload);
		},
		wikiDir,
	});

	assert.equal(result.processed, 1);
	assert.deepEqual(result.updatedScopes, ["work"]);
	assert.equal(qmdCalls.length, 1);
	assert.equal(qmdCalls[0].collectionName, "wiki-work");

	const canonicalPage = await fs.readFile(path.join(wikiDir, "work", "context.md"), "utf8");
	assert.match(canonicalPage, /Keep the runtime loop on Rovo/u);

	const proposals = await listWikiMemoryProposals({ wikiDir });
	assert.equal(proposals[0].status, "ingested");

	const runtimeContext = await fs.readFile(path.join(wikiDir, "output", "work-context.md"), "utf8");
	assert.match(runtimeContext, /Work Context/u);
});

test("buildWikiMemoryContextDescription reads compiled artifacts", async () => {
	const wikiDir = await fs.mkdtemp(path.join(os.tmpdir(), "wiki-memory-provider-context-"));

	await regenerateWikiMemoryContext({
		generateTextImpl: async ({ system }) => {
			return system.includes("profile")
				? "# Profile Context\n\n- Prefers concise answers."
				: "# Work Context\n\n- Keep the runtime loop on Rovo.";
		},
		wikiDir,
	});

	const description = await buildWikiMemoryContextDescription({ wikiDir });
	assert.match(description, /\[Hermes Memory\]/u);
	assert.match(description, /Prefers concise answers/u);
	assert.match(description, /runtime loop on Rovo/u);
});

test("getCanonicalWikiMemoryDocuments parses canonical durable memory blocks from wiki pages", async () => {
	const wikiDir = await fs.mkdtemp(path.join(os.tmpdir(), "wiki-memory-provider-canonical-"));
	await fs.mkdir(path.join(wikiDir, "work"), { recursive: true });
	await fs.writeFile(
		path.join(wikiDir, "work", "context.md"),
		[
			"---",
			'created: "2026-04-12"',
			'kind: "wiki-memory"',
			"sources: []",
			'tags: ["work", "memory"]',
			'title: "Work Context"',
			'type: "work"',
			'updated: "2026-04-13"',
			"---",
			"",
			"```yaml",
			"---",
			'title: "Work Context"',
			"---",
			"```",
			"",
			"# Work Context",
			"",
			"## Durable Memory",
			"",
			"- Keep the runtime loop on Rovo.",
			"",
			"**External browsing constraints:**",
			"- External site screenshots are blocked.",
			"",
			"## Recent Changes",
			"",
			"- Added runtime note.",
			"",
		].join("\n"),
		"utf8",
	);

	const documents = await getCanonicalWikiMemoryDocuments({ wikiDir });

	assert.equal(documents.work.title, "Work Context");
	assert.equal(documents.work.blocks.length, 2);
	assert.match(documents.work.blocks[0].content, /runtime loop on Rovo/u);
	assert.match(documents.work.blocks[1].content, /External browsing constraints/u);
	assert.equal(documents.work.blocks[0].id.startsWith("work-"), true);
	assert.equal(documents.work.canonicalPath, path.join(wikiDir, "work", "context.md"));
});

test("pruneCanonicalWikiMemoryBlock removes canonical memory, preserves raw proposals, and regenerates compiled context", async () => {
	const wikiDir = await fs.mkdtemp(path.join(os.tmpdir(), "wiki-memory-provider-prune-"));
	const qmdCalls = [];

	await fs.mkdir(path.join(wikiDir, "work"), { recursive: true });
	await fs.writeFile(
		path.join(wikiDir, "work", "context.md"),
		[
			"---",
			'created: "2026-04-12"',
			'kind: "wiki-memory"',
			"sources: []",
			'tags: ["work", "memory"]',
			'title: "Work Context"',
			'type: "work"',
			'updated: "2026-04-13"',
			"---",
			"",
			"```yaml",
			"---",
			'title: "Work Context"',
			"---",
			"```",
			"",
			"# Work Context",
			"",
			"## Durable Memory",
			"",
			"- Remove this stale memory.",
			"",
			"- Keep this durable note.",
			"",
			"## Recent Changes",
			"",
			"- Original import.",
			"",
		].join("\n"),
		"utf8",
	);

	const rawProposal = await enqueueWikiMemoryProposal({
		content: "Raw history entry should remain untouched.",
		target: "memory",
		wikiDir,
	});
	const rawProposalBefore = await fs.readFile(rawProposal.path, "utf8");
	const documents = await getCanonicalWikiMemoryDocuments({ wikiDir });
	const removedBlock = documents.work.blocks[0];

	const result = await pruneCanonicalWikiMemoryBlock({
		generateTextImpl: async ({ prompt, system }) => {
			if (system.includes("profile")) {
				return "# Profile Context\n\n- Profile placeholder.";
			}

			return prompt.includes("Keep this durable note.")
				? "# Work Context\n\n- Keep this durable note."
				: "# Work Context\n\n- No runtime memory.";
		},
		qmdSyncImpl: async (payload) => {
			qmdCalls.push(payload);
		},
		revision: documents.work.revision,
		scope: "work",
		blockId: removedBlock.id,
		wikiDir,
	});

	assert.equal(result.memories.work.blocks.length, 1);
	assert.equal(result.removedBlock.id, removedBlock.id);
	assert.equal(qmdCalls.length, 1);
	assert.equal(qmdCalls[0].collectionName, "wiki-work");

	const canonicalPage = await fs.readFile(path.join(wikiDir, "work", "context.md"), "utf8");
	assert.match(canonicalPage, /Keep this durable note/u);
	assert.doesNotMatch(canonicalPage, /```yaml/u);
	assert.match(canonicalPage, /Removed durable memory block/u);

	const logContent = await fs.readFile(path.join(wikiDir, "log.md"), "utf8");
	assert.match(logContent, /memory-prune/u);

	const rawProposalAfter = await fs.readFile(rawProposal.path, "utf8");
	assert.equal(rawProposalAfter, rawProposalBefore);

	const runtimeContext = await fs.readFile(path.join(wikiDir, "output", "work-context.md"), "utf8");
	assert.match(runtimeContext, /Keep this durable note/u);
});

test("pruneCanonicalWikiMemoryBlock writes an empty placeholder when the final block is removed", async () => {
	const wikiDir = await fs.mkdtemp(path.join(os.tmpdir(), "wiki-memory-provider-prune-last-"));
	await fs.mkdir(path.join(wikiDir, "profiles"), { recursive: true });
	await fs.writeFile(
		path.join(wikiDir, "profiles", "self.md"),
		[
			"---",
			'created: "2026-04-12"',
			'kind: "wiki-memory"',
			"sources: []",
			'tags: ["profile", "memory"]',
			'title: "Self"',
			'type: "profile"',
			'updated: "2026-04-13"',
			"---",
			"",
			"# Self",
			"",
			"## Durable Memory",
			"",
			"- User prefers concise answers.",
			"",
			"## Recent Changes",
			"",
			"- Added preference.",
			"",
		].join("\n"),
		"utf8",
	);

	const documents = await getCanonicalWikiMemoryDocuments({ wikiDir });
	await pruneCanonicalWikiMemoryBlock({
		generateTextImpl: async ({ system }) => {
			return system.includes("profile")
				? "# Profile Context\n\n- No profile memory."
				: "# Work Context\n\n- No runtime memory.";
		},
		revision: documents.profile.revision,
		scope: "profile",
		blockId: documents.profile.blocks[0].id,
		wikiDir,
	});

	const canonicalPage = await fs.readFile(path.join(wikiDir, "profiles", "self.md"), "utf8");
	assert.match(canonicalPage, /_No entries yet\._/u);
});

test("deleteWikiMemoryProposal removes a queued raw proposal without changing canonical memory", async () => {
	const wikiDir = await fs.mkdtemp(path.join(os.tmpdir(), "wiki-memory-provider-delete-queued-"));
	const proposal = await enqueueWikiMemoryProposal({
		content: "Queued memory to delete.",
		target: "memory",
		wikiDir,
	});

	const result = await deleteWikiMemoryProposal({
		generateTextImpl: async ({ system }) => {
			return system.includes("profile")
				? "# Profile Context\n\n- No profile context yet."
				: "# Work Context\n\n- No runtime memory.";
		},
		proposalId: proposal.id,
		wikiDir,
	});

	assert.equal(result.proposal.id, proposal.id);
	await assert.rejects(
		fs.access(proposal.path),
		(error) => error?.code === "ENOENT",
	);

	const proposals = await listWikiMemoryProposals({ wikiDir });
	assert.equal(proposals.length, 0);
});

test("deleteWikiMemoryProposal removes an ingested raw proposal and rebuilds canonical memory from remaining sources", async () => {
	const wikiDir = await fs.mkdtemp(path.join(os.tmpdir(), "wiki-memory-provider-delete-ingested-"));

	await enqueueWikiMemoryProposal({
		content: "Keep the runtime loop on Rovo.",
		target: "memory",
		wikiDir,
	});
	await enqueueWikiMemoryProposal({
		content: "External screenshots are blocked.",
		target: "memory",
		wikiDir,
	});

	await ingestQueuedWikiMemoryProposals({
		generateTextImpl: async ({ prompt, system }) => {
			if (system.includes("maintain the canonical work context")) {
				if (prompt.includes("External screenshots are blocked.") && prompt.includes("Keep the runtime loop on Rovo.")) {
					return [
						"# Work Context",
						"",
						"## Durable Memory",
						"",
						"- Keep the runtime loop on Rovo.",
						"",
						"- External screenshots are blocked.",
						"",
						"## Recent Changes",
						"",
						"- Added both runtime memories.",
					].join("\n");
				}

				return [
					"# Work Context",
					"",
					"## Durable Memory",
					"",
					"- Keep the runtime loop on Rovo.",
					"",
					"## Recent Changes",
					"",
					"- Removed external screenshot memory.",
				].join("\n");
			}

			if (system.includes("compile work context")) {
				return prompt.includes("External screenshots are blocked.")
					? "# Work Context\n\n- Keep the runtime loop on Rovo.\n- External screenshots are blocked."
					: "# Work Context\n\n- Keep the runtime loop on Rovo.";
			}

			return "# Profile Context\n\n- No profile context yet.";
		},
		wikiDir,
	});

	const proposalsBeforeDelete = await listWikiMemoryProposals({ wikiDir });
	assert.equal(proposalsBeforeDelete.length, 2);
	const proposalToDelete = proposalsBeforeDelete.find((proposal) => proposal.content.includes("External screenshots are blocked."));
	assert.ok(proposalToDelete);

	const result = await deleteWikiMemoryProposal({
		generateTextImpl: async ({ system }) => {
			if (system.includes("maintain the canonical work context")) {
				return [
					"# Work Context",
					"",
					"## Durable Memory",
					"",
					"- Keep the runtime loop on Rovo.",
					"",
					"## Recent Changes",
					"",
					"- Removed external screenshot memory.",
				].join("\n");
			}

			if (system.includes("compile work context")) {
				return "# Work Context\n\n- Keep the runtime loop on Rovo.";
			}

			return "# Profile Context\n\n- No profile context yet.";
		},
		proposalId: proposalToDelete.id,
		wikiDir,
	});

	assert.equal(result.proposal.id, proposalToDelete.id);

	const proposalsAfterDelete = await listWikiMemoryProposals({ wikiDir });
	assert.equal(proposalsAfterDelete.length, 1);
	assert.match(proposalsAfterDelete[0].content, /runtime loop on Rovo/u);

	const canonicalPage = await fs.readFile(path.join(wikiDir, "work", "context.md"), "utf8");
	assert.match(canonicalPage, /Keep the runtime loop on Rovo/u);
	assert.doesNotMatch(canonicalPage, /External screenshots are blocked/u);

	const runtimeContext = await fs.readFile(path.join(wikiDir, "output", "work-context.md"), "utf8");
	assert.match(runtimeContext, /Keep the runtime loop on Rovo/u);
	assert.doesNotMatch(runtimeContext, /External screenshots are blocked/u);
});

test("syncWikiBackedMemory with force rebuilds canonical memory from current raw sources", async () => {
	const wikiDir = await fs.mkdtemp(path.join(os.tmpdir(), "wiki-memory-provider-force-sync-"));

	await enqueueWikiMemoryProposal({
		content: "Keep the runtime loop on Rovo.",
		target: "memory",
		wikiDir,
	});
	await enqueueWikiMemoryProposal({
		content: "External screenshots are blocked.",
		target: "memory",
		wikiDir,
	});

	await ingestQueuedWikiMemoryProposals({
		generateTextImpl: async ({ prompt, system }) => {
			if (system.includes("maintain the canonical work context")) {
				return prompt.includes("External screenshots are blocked.")
					? [
						"# Work Context",
						"",
						"## Durable Memory",
						"",
						"- Keep the runtime loop on Rovo.",
						"",
						"- External screenshots are blocked.",
						"",
						"## Recent Changes",
						"",
						"- Added both runtime memories.",
					].join("\n")
					: [
						"# Work Context",
						"",
						"## Durable Memory",
						"",
						"- Keep the runtime loop on Rovo.",
						"",
						"## Recent Changes",
						"",
						"- Removed external screenshot memory.",
					].join("\n");
			}

			if (system.includes("compile work context")) {
				return prompt.includes("External screenshots are blocked.")
					? "# Work Context\n\n- Keep the runtime loop on Rovo.\n- External screenshots are blocked."
					: "# Work Context\n\n- Keep the runtime loop on Rovo.";
			}

			return "# Profile Context\n\n- No profile context yet.";
		},
		wikiDir,
	});

	const sources = await listWikiMemoryProposals({ wikiDir });
	const sourceToDelete = sources.find((proposal) => proposal.content.includes("External screenshots are blocked."));
	assert.ok(sourceToDelete);
	await fs.unlink(sourceToDelete.path);

	await syncWikiBackedMemory({
		forceContextRegeneration: true,
		generateTextImpl: async ({ prompt, system }) => {
			if (system.includes("maintain the canonical work context")) {
				return prompt.includes("External screenshots are blocked.")
					? [
						"# Work Context",
						"",
						"## Durable Memory",
						"",
						"- Keep the runtime loop on Rovo.",
						"",
						"- External screenshots are blocked.",
						"",
						"## Recent Changes",
						"",
						"- Added both runtime memories.",
					].join("\n")
					: [
						"# Work Context",
						"",
						"## Durable Memory",
						"",
						"- Keep the runtime loop on Rovo.",
						"",
						"## Recent Changes",
						"",
						"- Removed external screenshot memory.",
					].join("\n");
			}

			if (system.includes("compile work context")) {
				return prompt.includes("External screenshots are blocked.")
					? "# Work Context\n\n- Keep the runtime loop on Rovo.\n- External screenshots are blocked."
					: "# Work Context\n\n- Keep the runtime loop on Rovo.";
			}

			return "# Profile Context\n\n- No profile context yet.";
		},
		wikiDir,
	});

	const canonicalPage = await fs.readFile(path.join(wikiDir, "work", "context.md"), "utf8");
	assert.match(canonicalPage, /Keep the runtime loop on Rovo/u);
	assert.doesNotMatch(canonicalPage, /External screenshots are blocked/u);

	const runtimeContext = await fs.readFile(path.join(wikiDir, "output", "work-context.md"), "utf8");
	assert.match(runtimeContext, /Keep the runtime loop on Rovo/u);
	assert.doesNotMatch(runtimeContext, /External screenshots are blocked/u);
});
