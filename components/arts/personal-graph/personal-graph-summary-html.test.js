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

const htmlModule = import("./personal-graph-summary-html.ts");

function node(id, title, overrides = {}) {
	return {
		bodyPreview: `${title} preview with <script>alert(1)</script>`,
		connectionCount: 1,
		dangling: false,
		externalUrl: null,
		frontmatter: {},
		id,
		kind: "source",
		label: title,
		missing: false,
		path: null,
		provider: "vault",
		relativePath: `${id}.md`,
		size: 1,
		slug: id,
		title,
		updatedAt: "2026-05-10T00:00:00.000Z",
		...overrides,
	};
}

function edge(source, target) {
	return {
		id: `${source}->${target}`,
		kind: "related",
		label: "supports",
		metadata: {},
		relationKinds: ["related"],
		source,
		target,
	};
}

test("Personal Graph summary HTML builder returns a self-contained article document", async () => {
	const { buildPersonalGraphSummaryHtmlDocument } = await htmlModule;
	const selected = node("selected", "Selected <Source>");
	const neighbor = node("neighbor", "Neighbor", {
		externalUrl: "https://example.com/source",
		frontmatter: { thumbnail: "data:image/svg+xml;base64,PHN2Zy8+" },
	});
	const document = buildPersonalGraphSummaryHtmlDocument({
		articleMarkdown: `# Editorial title
Lede with **bold** context.

## What this is
The source explains the work.

## Source evidence
Only supplied graph evidence is used.`,
		edges: [edge("selected", "neighbor")],
		generatedAt: "2026-05-10T10:00:00.000Z",
		length: "medium",
		neighbors: [neighbor],
		node: selected,
		provider: "vault",
		sourceFingerprint: "fingerprint",
	});

	assert.equal(document.title, "Editorial title");
	assert.equal(document.filename, "editorial-title.html");
	assert.match(document.html, /^<!doctype html>/u);
	assert.match(document.html, /<style>/u);
	assert.match(document.html, /<svg class="relationship-diagram"/u);
	assert.match(document.html, /<details class="evidence" id="source-evidence">/u);
	assert.match(document.html, /<summary>Source evidence<\/summary>/u);
	assert.match(document.html, /data-node-id="neighbor"/u);
	assert.match(document.html, /target="_blank" rel="noreferrer"|rel="noreferrer" target="_blank"/u);
	assert.match(document.html, /window\.parent\.postMessage/u);
	assert.doesNotMatch(document.html, /<script>alert\(1\)<\/script>/u);
	assert.match(document.html, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/u);
	assert.doesNotMatch(document.html, /sourceFingerprint/u);
});

test("Personal Graph summary HTML builder preserves evidence metadata while suppressing unsafe links", async () => {
	const { buildPersonalGraphSummaryHtmlDocument } = await htmlModule;
	const selected = node("selected", "Selected source", {
		externalUrl: "https://example.com/selected",
		frontmatter: { type: "ConfluencePage" },
	});
	const safeNeighbor = node("safe", "Safe neighbor", {
		externalUrl: "https://example.com/safe",
		frontmatter: { type: "JiraIssue" },
		kind: "entity",
	});
	const unsafeNeighbor = node("unsafe", "Unsafe neighbor", {
		externalUrl: "javascript:alert(1)",
		kind: "raw",
	});

	const document = buildPersonalGraphSummaryHtmlDocument({
		articleMarkdown: `# Launch & Risk
The **summary** lede.

## What this is
Selected context.

## Source evidence
- Evidence one`,
		edges: [edge("selected", "safe")],
		generatedAt: "2026-05-12T00:00:00.000Z",
		length: "medium",
		neighbors: [safeNeighbor, unsafeNeighbor],
		node: selected,
		provider: "twg",
		sourceFingerprint: "fingerprint",
		sourceNotice: "TWG context is limited.",
		workWindow: "last 7 days",
	});

	assert.equal(document.title, "Launch & Risk");
	assert.equal(document.filename, "launch-risk.html");
	assert.match(document.html, /<title>Launch &amp; Risk<\/title>/u);
	assert.match(document.html, /<h1>Launch &amp; Risk<\/h1>/u);
	assert.match(document.html, /<p class="lede">The <strong>summary<\/strong> lede\.<\/p>/u);
	assert.match(document.html, /<h2 id="what-this-is">What this is<\/h2>/u);
	assert.match(document.html, /TWG context is limited/u);
	assert.match(document.html, /Team Work Graph/u);
	assert.match(document.html, /last 7 days/u);
	assert.match(document.html, /<text class="edge-label"[^>]*>supports<\/text>/u);
	assert.deepEqual(
		Array.from(document.html.matchAll(/data-node-id="([^"]+)"/gu), (match) => match[1]),
		["selected", "safe", "unsafe"],
	);
	assert.deepEqual(
		Array.from(document.html.matchAll(/<a class="source-card-link"[^>]*href="([^"]+)"/gu), (match) => match[1]),
		["https://example.com/selected", "https://example.com/safe"],
	);
	assert.doesNotMatch(document.html, /javascript:alert/u);
});

test("Personal Graph summary HTML context derives one-hop neighbors from the selected node", async () => {
	const { getPersonalGraphSummaryHtmlContext } = await htmlModule;
	const selected = node("selected", "Selected");
	const neighbor = node("neighbor", "Neighbor");
	const unrelated = node("unrelated", "Unrelated");
	const context = getPersonalGraphSummaryHtmlContext({
		edges: [edge("selected", "neighbor"), edge("neighbor", "unrelated")],
		generatedAt: "2026-05-10T00:00:00.000Z",
		nodes: [selected, neighbor, unrelated],
		stats: { danglingCount: 0, edgeCount: 2, nodeCount: 3, rawCount: 0, wikiCount: 3 },
	}, selected);

	assert.deepEqual(context.neighbors.map((candidate) => candidate.id), ["neighbor"]);
	assert.deepEqual(context.edges.map((candidate) => candidate.id), ["selected->neighbor"]);
});
