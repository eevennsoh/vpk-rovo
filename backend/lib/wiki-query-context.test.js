"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const {
	buildWikiQueryContextDescription,
} = require("./wiki-query-context");

test("buildWikiQueryContextDescription excludes profile and work collections from per-turn retrieval", async () => {
	const rootDir = await fs.mkdtemp(path.join(os.tmpdir(), "wiki-query-context-"));
	const wikiDir = path.join(rootDir, "wiki");
	await fs.mkdir(path.join(wikiDir, "profiles"), { recursive: true });
	await fs.mkdir(path.join(wikiDir, "work"), { recursive: true });
	await fs.mkdir(path.join(wikiDir, "entities"), { recursive: true });

	await fs.writeFile(
		path.join(wikiDir, "profiles", "self.md"),
		"# Self\n\n- Prefers concise answers.\n",
		"utf8",
	);
	await fs.writeFile(
		path.join(wikiDir, "work", "context.md"),
		"# Work Context\n\n- Keep the runtime loop on RovoDev.\n",
		"utf8",
	);
	await fs.writeFile(
		path.join(wikiDir, "entities", "rovo.md"),
		"# Rovo\n\nRovo is Atlassian's AI assistant.\n",
		"utf8",
	);

	const context = await buildWikiQueryContextDescription("rovo", {
		searchWikiWithQmdImpl: async () => ([
			{
				collection: "wiki-profiles",
				path: path.join(wikiDir, "profiles", "self.md"),
				score: 0.9,
				title: "Self",
			},
			{
				collection: "wiki-work",
				path: path.join(wikiDir, "work", "context.md"),
				score: 0.8,
				title: "Work Context",
			},
			{
				collection: "wiki-entities",
				path: path.join(wikiDir, "entities", "rovo.md"),
				score: 0.7,
				title: "Rovo",
			},
		]),
		wikiDir,
	});

	assert.match(context, /Rovo/u);
	assert.doesNotMatch(context, /Prefers concise answers/u);
	assert.doesNotMatch(context, /Keep the runtime loop on RovoDev/u);
});
