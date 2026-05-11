const assert = require("node:assert/strict");
const { registerHooks } = require("node:module");
const test = require("node:test");

registerHooks({
	resolve(specifier, context, nextResolve) {
		if (specifier.startsWith("./") && !specifier.endsWith(".ts")) {
			try {
				return nextResolve(`${specifier}.ts`, context);
			} catch {
				return nextResolve(specifier, context);
			}
		}
		return nextResolve(specifier, context);
	},
});

const markdownModule = import("./personal-graph-summary-markdown.ts");

test("Personal Graph summary markdown parser accepts the editorial heading contract", async () => {
	const { parsePersonalGraphSummaryMarkdown } = await markdownModule;
	const parsed = parsePersonalGraphSummaryMarkdown(`# Article title
Short lede.

## What this is
Selected source context.

## Why it matters
The operational reason.

## Connected work
- Neighbor one

## Source evidence
Evidence is limited.`);

	assert.equal(parsed.title, "Article title");
	assert.equal(parsed.lede, "Short lede.");
	assert.deepEqual(parsed.sections.map((section) => section.heading), [
		"What this is",
		"Why it matters",
		"Connected work",
		"Source evidence",
	]);
	assert.match(parsed.sections.at(-1).body, /Evidence is limited/u);
});

test("Personal Graph summary markdown parser strips wrappers and falls back on malformed markdown", async () => {
	const { parsePersonalGraphSummaryMarkdown } = await markdownModule;
	const parsed = parsePersonalGraphSummaryMarkdown(`---
title: raw metadata should not become the title
---
\`\`\`markdown
Malformed article without headings.
\`\`\``);

	assert.equal(parsed.title, "Personal Graph Summary");
	assert.equal(parsed.lede, "");
	assert.deepEqual(parsed.sections, [{
		body: "Malformed article without headings.",
		heading: "Overview",
	}]);
});
