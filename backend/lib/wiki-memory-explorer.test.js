"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const {
	buildWikiMemoryDeck,
	buildWikiMemoryExplorer,
	buildWikiMemoryExplorerCsv,
} = require("./wiki-memory-explorer");
const {
	enqueueWikiMemoryProposal,
} = require("./wiki-memory-provider");

test("buildWikiMemoryExplorer returns canonical, compiled, proposal, and linked knowledge nodes", async () => {
	const wikiDir = await fs.mkdtemp(path.join(os.tmpdir(), "wiki-memory-explorer-"));

	await Promise.all([
		fs.mkdir(path.join(wikiDir, "work"), { recursive: true }),
		fs.mkdir(path.join(wikiDir, "profiles"), { recursive: true }),
		fs.mkdir(path.join(wikiDir, "output"), { recursive: true }),
		fs.mkdir(path.join(wikiDir, "entities"), { recursive: true }),
	]);

	await Promise.all([
		fs.writeFile(
			path.join(wikiDir, "work", "context.md"),
			[
				"---",
				'title: "Work Context"',
				'tags: ["work", "memory"]',
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
				"- Keep the runtime loop on [[Rovo]].",
				"",
				"## Recent Changes",
				"",
				"- Added runtime loop note.",
			].join("\n"),
			"utf8",
		),
		fs.writeFile(
			path.join(wikiDir, "profiles", "self.md"),
			[
				"---",
				'title: "Self"',
				'tags: ["profile", "memory"]',
				"---",
				"",
				"# Self",
				"",
				"## Durable Memory",
				"",
				"- Prefers concise implementation notes.",
				"",
				"## Recent Changes",
				"",
				"- Added response preference.",
			].join("\n"),
			"utf8",
		),
		fs.writeFile(
			path.join(wikiDir, "output", "work-context.md"),
			"# Work Context\n\n- Keep the runtime loop on Rovo.\n",
			"utf8",
		),
		fs.writeFile(
			path.join(wikiDir, "output", "profile-context.md"),
			"# Profile Context\n\n- Prefers concise implementation notes.\n",
			"utf8",
		),
		fs.writeFile(
			path.join(wikiDir, "entities", "rovo.md"),
			[
				"---",
				'title: "Rovo"',
				'summary: "Atlassian local agent runtime loop."',
				'tags: ["work", "agent"]',
				"---",
				"",
				"# Rovo",
				"",
				"Local agent runtime loop for development work.",
			].join("\n"),
			"utf8",
		),
	]);

	await enqueueWikiMemoryProposal({
		content: "Keep the runtime loop on Rovo.",
		origin: "durable_workflow",
		reason: "The user reinforced the runtime convention for future turns.",
		sourceThreadId: "thread-1",
		summary: "Keep the runtime loop on Rovo.",
		target: "memory",
		wikiDir,
	});

	const explorer = await buildWikiMemoryExplorer({ wikiDir });

	assert.ok(explorer.nodes.some((node) => node.kind === "canonical-memory"));
	assert.ok(explorer.nodes.some((node) => node.kind === "compiled-context"));
	assert.ok(explorer.nodes.some((node) => node.kind === "raw-proposal"));
	assert.ok(explorer.nodes.some((node) => node.kind === "linked-knowledge"));
	assert.ok(explorer.edges.some((edge) => edge.kind === "proposal_to_canonical"));
	assert.ok(explorer.edges.some((edge) => edge.kind === "canonical_to_compiled"));
	assert.ok(explorer.edges.some((edge) => edge.kind === "wiki_link"));

	const filteredByThread = await buildWikiMemoryExplorer({
		filters: {
			threadId: "thread-1",
		},
		wikiDir,
	});
	assert.ok(filteredByThread.nodes.some((node) => node.kind === "raw-proposal"));
	assert.ok(filteredByThread.nodes.some((node) => node.kind === "canonical-memory"));

	const csv = buildWikiMemoryExplorerCsv(explorer);
	assert.match(csv, /canonical:work/u);
	assert.match(csv, /Work Context/u);

	const deck = buildWikiMemoryDeck({
		explorer,
		selectedNodeIds: ["canonical:work"],
		title: "Work Memory Deck",
	});
	assert.match(deck, /marp: true/u);
	assert.match(deck, /Work Memory Deck/u);
});
