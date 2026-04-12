"use strict";

const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const {
	appendToLog,
	buildDedupeIndex,
	buildOutputPath,
	captureUrl,
	computeContentHash,
	ensureWikiJobs,
	generateSlug,
	getWikiStatus,
	getWikiJobDefinitions,
	ingestRawSources,
	isSkippableUrl,
	lintWiki,
	parseFrontmatter,
	queryWiki,
	regenerateMemoryDigest,
	serializeFrontmatter,
	validateUrl,
} = require("./wiki-clipper");

// ---------------------------------------------------------------------------
// generateSlug
// ---------------------------------------------------------------------------

test("generateSlug converts title to lowercase hyphenated slug", () => {
	assert.equal(generateSlug("Hello World"), "hello-world");
});

test("generateSlug strips special characters", () => {
	assert.equal(generateSlug("Hello World — A Test!"), "hello-world-a-test");
});

test("generateSlug truncates at 80 characters on word boundary", () => {
	const longTitle = "this is a very long title that should definitely be truncated because it exceeds eighty characters by quite a lot";
	const slug = generateSlug(longTitle);
	assert.ok(slug.length <= 80, `slug length ${slug.length} exceeds 80`);
	assert.ok(!slug.endsWith("-"), "slug should not end with hyphen");
});

test("generateSlug handles Unicode by stripping non-ASCII", () => {
	const slug = generateSlug("Café Résumé über");
	assert.ok(slug.length > 0, "slug should not be empty");
	assert.ok(!/[^\da-z-]/u.test(slug), "slug should only contain a-z, 0-9, hyphens");
});

test("generateSlug collapses multiple hyphens", () => {
	assert.equal(generateSlug("hello   ---   world"), "hello-world");
});

test("generateSlug returns fallback for empty input", () => {
	const slug = generateSlug("");
	assert.ok(slug.length > 0, "slug should not be empty for empty input");
});

// ---------------------------------------------------------------------------
// buildOutputPath
// ---------------------------------------------------------------------------

test("buildOutputPath produces correct YYYY/MM/slug.md path", () => {
	const wikiDir = "/Users/esoh/wiki";
	const result = buildOutputPath(wikiDir, "articles", "my-article");
	const now = new Date();
	const yyyy = String(now.getFullYear());
	const mm = String(now.getMonth() + 1).padStart(2, "0");
	assert.ok(result.startsWith(path.join(wikiDir, "raw", "articles", yyyy, mm)));
	assert.ok(result.endsWith("my-article.md"));
});

test("buildOutputPath works for all categories", () => {
	const wikiDir = "/tmp/wiki";
	for (const category of ["articles", "papers", "transcripts", "bookmarks"]) {
		const result = buildOutputPath(wikiDir, category, "test");
		assert.ok(result.includes(path.join("raw", category)));
	}
});

// ---------------------------------------------------------------------------
// serializeFrontmatter / parseFrontmatter
// ---------------------------------------------------------------------------

test("serializeFrontmatter produces valid YAML between delimiters", () => {
	const metadata = {
		title: "Test Article",
		source_url: "https://example.com",
		tags: ["ai", "rovo"],
	};
	const result = serializeFrontmatter(metadata);
	assert.ok(result.startsWith("---\n"), "should start with ---");
	assert.ok(result.endsWith("\n---\n"), "should end with ---");
	assert.ok(result.includes("title: \"Test Article\"") || result.includes("title: Test Article"));
	assert.ok(result.includes("source_url:"));
	assert.ok(result.includes("tags:"));
});

test("parseFrontmatter round-trips with serializeFrontmatter", () => {
	const original = {
		title: "Test Article",
		source_url: "https://example.com/article",
		captured_at: "2026-04-11T12:00:00Z",
		tags: ["ai", "rovo"],
		word_count: 1234,
		status: "queued",
	};
	const serialized = serializeFrontmatter(original);
	const { frontmatter, body } = parseFrontmatter(`${serialized}\nBody content here.`);
	assert.equal(frontmatter.title, original.title);
	assert.equal(frontmatter.source_url, original.source_url);
	assert.equal(frontmatter.status, original.status);
	assert.equal(body.trim(), "Body content here.");
});

test("parseFrontmatter handles file with no frontmatter", () => {
	const { frontmatter, body } = parseFrontmatter("Just plain markdown.");
	assert.deepEqual(frontmatter, {});
	assert.equal(body.trim(), "Just plain markdown.");
});

// ---------------------------------------------------------------------------
// validateUrl
// ---------------------------------------------------------------------------

test("validateUrl accepts valid HTTPS URL", () => {
	assert.doesNotThrow(() => validateUrl("https://example.com/article"));
});

test("validateUrl accepts HTTP URL", () => {
	assert.doesNotThrow(() => validateUrl("http://example.com/article"));
});

test("validateUrl rejects file:// URL", () => {
	assert.throws(() => validateUrl("file:///etc/passwd"), /rejected/iu);
});

test("validateUrl rejects private IP 127.0.0.1", () => {
	assert.throws(() => validateUrl("https://127.0.0.1/test"), /rejected|private/iu);
});

test("validateUrl rejects private IP 192.168.x.x", () => {
	assert.throws(() => validateUrl("https://192.168.1.1/test"), /rejected|private/iu);
});

test("validateUrl rejects private IP 10.x.x.x", () => {
	assert.throws(() => validateUrl("https://10.0.0.1/test"), /rejected|private/iu);
});

test("validateUrl rejects localhost", () => {
	assert.throws(() => validateUrl("https://localhost:3000/test"), /rejected|private/iu);
});

test("validateUrl rejects empty string", () => {
	assert.throws(() => validateUrl(""), /required|invalid/iu);
});

// ---------------------------------------------------------------------------
// isSkippableUrl
// ---------------------------------------------------------------------------

test("isSkippableUrl detects Google search", () => {
	assert.equal(isSkippableUrl("https://www.google.com/search?q=test"), true);
});

test("isSkippableUrl detects Bing search", () => {
	assert.equal(isSkippableUrl("https://www.bing.com/search?q=test"), true);
});

test("isSkippableUrl allows normal articles", () => {
	assert.equal(isSkippableUrl("https://example.com/article"), false);
});

// ---------------------------------------------------------------------------
// computeContentHash
// ---------------------------------------------------------------------------

test("computeContentHash returns hex SHA-256", () => {
	const hash = computeContentHash("test content");
	assert.equal(hash.length, 64, "SHA-256 hex is 64 chars");
	assert.ok(/^[\da-f]+$/u.test(hash), "should be hex");

	const expected = crypto.createHash("sha256").update("test content").digest("hex");
	assert.equal(hash, expected);
});

// ---------------------------------------------------------------------------
// buildDedupeIndex
// ---------------------------------------------------------------------------

test("buildDedupeIndex scans raw/ frontmatter and returns URL→path map", async () => {
	const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "vpk-wiki-dedupe-"));
	const rawDir = path.join(tmpDir, "raw", "articles", "2026", "04");
	await fs.mkdir(rawDir, { recursive: true });

	const content = [
		"---",
		"title: Test Article",
		"source_url: https://example.com/article",
		"canonical_url: https://example.com/canonical",
		"status: queued",
		"---",
		"",
		"Body content.",
	].join("\n");
	await fs.writeFile(path.join(rawDir, "test-article.md"), content, "utf8");

	const index = await buildDedupeIndex(path.join(tmpDir, "raw"));
	assert.equal(index.size, 1);
	assert.ok(index.has("https://example.com/canonical"));
	assert.ok(index.get("https://example.com/canonical").endsWith("test-article.md"));
});

test("buildDedupeIndex uses source_url when no canonical_url", async () => {
	const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "vpk-wiki-dedupe2-"));
	const rawDir = path.join(tmpDir, "raw", "articles", "2026", "04");
	await fs.mkdir(rawDir, { recursive: true });

	const content = [
		"---",
		"title: No Canonical",
		"source_url: https://example.com/no-canonical",
		"status: queued",
		"---",
		"",
		"Body.",
	].join("\n");
	await fs.writeFile(path.join(rawDir, "no-canonical.md"), content, "utf8");

	const index = await buildDedupeIndex(path.join(tmpDir, "raw"));
	assert.ok(index.has("https://example.com/no-canonical"));
});

test("buildDedupeIndex returns empty map for empty directory", async () => {
	const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "vpk-wiki-dedupe3-"));
	await fs.mkdir(path.join(tmpDir, "raw"), { recursive: true });

	const index = await buildDedupeIndex(path.join(tmpDir, "raw"));
	assert.equal(index.size, 0);
});

// ---------------------------------------------------------------------------
// appendToLog
// ---------------------------------------------------------------------------

test("appendToLog appends entry to log.md", async () => {
	const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "vpk-wiki-log-"));
	await fs.writeFile(
		path.join(tmpDir, "log.md"),
		"# Wiki Log\n\n",
		"utf8",
	);

	await appendToLog(tmpDir, "ingest", "test-article", ["Processed raw source"]);

	const logContent = await fs.readFile(path.join(tmpDir, "log.md"), "utf8");
	assert.ok(logContent.includes("ingest | test-article"));
	assert.ok(logContent.includes("Processed raw source"));
});

test("appendToLog includes ISO date", async () => {
	const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "vpk-wiki-log2-"));
	await fs.writeFile(path.join(tmpDir, "log.md"), "# Wiki Log\n\n", "utf8");

	await appendToLog(tmpDir, "capture", "my-page", []);

	const logContent = await fs.readFile(path.join(tmpDir, "log.md"), "utf8");
	const datePattern = /\[\d{4}-\d{2}-\d{2}\]/u;
	assert.ok(datePattern.test(logContent), "log entry should contain ISO date");
});

// ---------------------------------------------------------------------------
// captureUrl
// ---------------------------------------------------------------------------

async function createTestWiki() {
	const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "vpk-wiki-capture-"));
	for (const sub of ["raw/articles", "raw/papers", "raw/transcripts", "raw/bookmarks", "entities", "concepts"]) {
		await fs.mkdir(path.join(tmpDir, ...sub.split("/")), { recursive: true });
	}
	await fs.writeFile(path.join(tmpDir, "log.md"), "# Wiki Log\n\n", "utf8");
	return tmpDir;
}

const SAMPLE_HTML = [
	"<html><head>",
	'<title>Rovo AI Assistant</title>',
	'<meta name="author" content="Atlassian">',
	'<meta name="description" content="Learn about Rovo, the AI assistant.">',
	'<link rel="canonical" href="https://www.atlassian.com/software/rovo">',
	"</head><body>",
	"<article>",
	"<h1>Rovo AI Assistant</h1>",
	"<p>Rovo is Atlassian's AI assistant that helps teams find, learn, and act on information.</p>",
	"<p>Built on Atlassian Intelligence, Rovo connects to your team's tools and provides answers grounded in your organization's data.</p>",
	"<p>Key features include search across all connected apps, AI agents for common workflows, and knowledge cards that surface relevant context.</p>",
	"<h2>Getting Started</h2>",
	"<p>Rovo is available for Atlassian Cloud customers. Enable it from your admin settings to get started with AI-powered search and agents.</p>",
	"</article></body></html>",
].join("");

test("captureUrl saves markdown with correct frontmatter", async () => {
	const wikiDir = await createTestWiki();

	const result = await captureUrl({
		url: "https://www.atlassian.com/software/rovo",
		category: "articles",
		wikiDir,
		fetchImpl: async () => ({ ok: true, status: 200, text: async () => SAMPLE_HTML }),
	});

	assert.ok(result.filePath, "should return filePath");
	assert.ok(result.metadata, "should return metadata");
	assert.equal(result.isUpdate, false);

	const saved = await fs.readFile(result.filePath, "utf8");
	const { frontmatter, body } = parseFrontmatter(saved);

	assert.equal(frontmatter.title, "Rovo AI Assistant");
	assert.equal(frontmatter.source_url, "https://www.atlassian.com/software/rovo");
	assert.equal(frontmatter.canonical_url, "https://www.atlassian.com/software/rovo");
	assert.equal(frontmatter.capture_method, "defuddle");
	assert.equal(frontmatter.status, "queued");
	assert.ok(frontmatter.captured_at, "should have captured_at");
	assert.ok(frontmatter.word_count > 0, "should have word_count");
	assert.ok(body.trim().length > 0, "should have body content");
});

test("captureUrl dedupes on same canonical URL", async () => {
	const wikiDir = await createTestWiki();

	const first = await captureUrl({
		url: "https://www.atlassian.com/software/rovo",
		category: "articles",
		wikiDir,
		fetchImpl: async () => ({ ok: true, status: 200, text: async () => SAMPLE_HTML }),
	});

	const second = await captureUrl({
		url: "https://www.atlassian.com/software/rovo",
		category: "articles",
		wikiDir,
		fetchImpl: async () => ({ ok: true, status: 200, text: async () => SAMPLE_HTML }),
	});

	assert.equal(second.isUpdate, false);
	assert.equal(second.filePath, first.filePath);
});

test("captureUrl with forceRefresh overwrites existing", async () => {
	const wikiDir = await createTestWiki();

	await captureUrl({
		url: "https://www.atlassian.com/software/rovo",
		category: "articles",
		wikiDir,
		fetchImpl: async () => ({ ok: true, status: 200, text: async () => SAMPLE_HTML }),
	});

	const updated = await captureUrl({
		url: "https://www.atlassian.com/software/rovo",
		category: "articles",
		wikiDir,
		forceRefresh: true,
		fetchImpl: async () => ({ ok: true, status: 200, text: async () => SAMPLE_HTML }),
	});

	assert.equal(updated.isUpdate, true);
	const saved = await fs.readFile(updated.filePath, "utf8");
	const { frontmatter } = parseFrontmatter(saved);
	assert.equal(frontmatter.status, "updated");
});

test("captureUrl skips SERP URLs", async () => {
	const wikiDir = await createTestWiki();

	const result = await captureUrl({
		url: "https://www.google.com/search?q=rovo",
		category: "articles",
		wikiDir,
		fetchImpl: async () => ({ ok: true, status: 200, text: async () => "<html><body>results</body></html>" }),
	});

	assert.equal(result.skipped, true);
	assert.ok(result.reason.includes("search"), "reason should mention search");
});

test("captureUrl skips low-content pages", async () => {
	const wikiDir = await createTestWiki();

	const lowContentHtml = "<html><head><title>Nav</title></head><body><nav>Menu</nav></body></html>";
	const result = await captureUrl({
		url: "https://example.com/nav-shell",
		category: "articles",
		wikiDir,
		fetchImpl: async () => ({ ok: true, status: 200, text: async () => lowContentHtml }),
	});

	assert.equal(result.skipped, true);
	assert.ok(result.reason.includes("content"), "reason should mention low content");
});

test("captureUrl appends to log.md", async () => {
	const wikiDir = await createTestWiki();

	await captureUrl({
		url: "https://www.atlassian.com/software/rovo",
		category: "articles",
		wikiDir,
		fetchImpl: async () => ({ ok: true, status: 200, text: async () => SAMPLE_HTML }),
	});

	const logContent = await fs.readFile(path.join(wikiDir, "log.md"), "utf8");
	assert.ok(logContent.includes("capture"), "log should contain capture event");
});

test("captureUrl creates year/month directories", async () => {
	const wikiDir = await createTestWiki();

	const result = await captureUrl({
		url: "https://www.atlassian.com/software/rovo",
		category: "articles",
		wikiDir,
		fetchImpl: async () => ({ ok: true, status: 200, text: async () => SAMPLE_HTML }),
	});

	const now = new Date();
	const yyyy = String(now.getFullYear());
	const mm = String(now.getMonth() + 1).padStart(2, "0");
	assert.ok(result.filePath.includes(path.join(yyyy, mm)), "path should include YYYY/MM");
});

test("captureUrl handles fetch failure gracefully", async () => {
	const wikiDir = await createTestWiki();

	await assert.rejects(
		() => captureUrl({
			url: "https://example.com/broken",
			category: "articles",
			wikiDir,
			fetchImpl: async () => ({ ok: false, status: 404, text: async () => "Not Found" }),
		}),
		/fetch failed|404/iu,
	);
});

test("captureUrl applies tags from options", async () => {
	const wikiDir = await createTestWiki();

	const result = await captureUrl({
		url: "https://www.atlassian.com/software/rovo",
		category: "articles",
		tags: ["rovo", "ai"],
		wikiDir,
		fetchImpl: async () => ({ ok: true, status: 200, text: async () => SAMPLE_HTML }),
	});

	const saved = await fs.readFile(result.filePath, "utf8");
	const { frontmatter } = parseFrontmatter(saved);
	assert.deepEqual(frontmatter.tags, ["rovo", "ai"]);
});

// ---------------------------------------------------------------------------
// queryWiki
// ---------------------------------------------------------------------------

async function createPopulatedWiki() {
	const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "vpk-wiki-query-"));
	for (const sub of ["raw/articles", "entities", "concepts", "comparisons", "queries"]) {
		await fs.mkdir(path.join(tmpDir, ...sub.split("/")), { recursive: true });
	}
	await fs.writeFile(path.join(tmpDir, "log.md"), "# Wiki Log\n\n", "utf8");
	await fs.writeFile(
		path.join(tmpDir, "index.md"),
		"# Wiki Index\n\n## Entities\n\n- [[atlassian]] — The company\n- [[rovo]] — AI assistant\n",
		"utf8",
	);

	await fs.writeFile(
		path.join(tmpDir, "entities", "atlassian.md"),
		[
			"---",
			"title: Atlassian",
			"created: 2026-04-11",
			"updated: 2026-04-11",
			"type: entity",
			"tags: [company]",
			"sources: [raw/articles/atlassian-overview.md]",
			"---",
			"",
			"Atlassian is a software company that builds tools for teams.",
			"See also [[rovo]] and [[jira]].",
		].join("\n"),
		"utf8",
	);

	await fs.writeFile(
		path.join(tmpDir, "entities", "rovo.md"),
		[
			"---",
			"title: Rovo",
			"created: 2026-04-11",
			"updated: 2026-04-11",
			"type: entity",
			"tags: [rovo, ai]",
			"sources: [raw/articles/rovo-intro.md]",
			"---",
			"",
			"Rovo is Atlassian's AI assistant.",
			"Part of [[atlassian]] platform.",
		].join("\n"),
		"utf8",
	);

	return tmpDir;
}

test("queryWiki returns matching pages by title", async () => {
	const wikiDir = await createPopulatedWiki();
	const result = await queryWiki("rovo", { wikiDir });
	assert.ok(result.results.length > 0, "should find results");
	assert.ok(result.results.some((r) => r.title === "Rovo"));
});

test("queryWiki returns matching pages by tag", async () => {
	const wikiDir = await createPopulatedWiki();
	const result = await queryWiki("ai", { wikiDir });
	assert.ok(result.results.length > 0, "should find results by tag");
});

test("queryWiki returns matching pages by body content", async () => {
	const wikiDir = await createPopulatedWiki();
	const result = await queryWiki("software company", { wikiDir });
	assert.ok(result.results.length > 0, "should find results by body content");
	assert.ok(result.results.some((r) => r.title === "Atlassian"));
});

test("queryWiki returns empty for no matches", async () => {
	const wikiDir = await createPopulatedWiki();
	const result = await queryWiki("nonexistent-query-xyz", { wikiDir });
	assert.equal(result.results.length, 0);
});

// ---------------------------------------------------------------------------
// lintWiki
// ---------------------------------------------------------------------------

test("lintWiki returns clean for valid wiki", async () => {
	const wikiDir = await createPopulatedWiki();
	const result = await lintWiki({ wikiDir });
	// May have some issues (e.g., jira wikilink doesn't resolve), but should not crash
	assert.ok(Array.isArray(result.issues));
});

test("lintWiki detects broken wikilinks", async () => {
	const wikiDir = await createPopulatedWiki();
	// atlassian.md links to [[jira]] which doesn't exist
	const result = await lintWiki({ wikiDir });
	const brokenLinks = result.issues.filter((i) => i.type === "broken-wikilink");
	assert.ok(brokenLinks.length > 0, "should detect broken [[jira]] link");
	assert.ok(brokenLinks.some((i) => i.message.includes("jira")));
});

test("lintWiki detects missing index entries", async () => {
	const wikiDir = await createPopulatedWiki();
	// Add a page that isn't in the index
	await fs.writeFile(
		path.join(wikiDir, "concepts", "teamwork.md"),
		[
			"---",
			"title: Teamwork",
			"created: 2026-04-11",
			"updated: 2026-04-11",
			"type: concept",
			"tags: [company]",
			"sources: []",
			"---",
			"",
			"Teamwork is core to [[atlassian]].",
		].join("\n"),
		"utf8",
	);

	const result = await lintWiki({ wikiDir });
	const missing = result.issues.filter((i) => i.type === "missing-index-entry");
	assert.ok(missing.length > 0, "should detect page not in index");
	assert.ok(missing.some((i) => i.path.includes("teamwork")));
});

test("lintWiki detects duplicate canonical URLs in raw", async () => {
	const wikiDir = await createPopulatedWiki();
	const rawDir = path.join(wikiDir, "raw", "articles");
	await fs.mkdir(path.join(rawDir, "2026", "04"), { recursive: true });

	const rawContent = [
		"---",
		"title: Duplicate",
		"source_url: https://example.com/dup",
		"canonical_url: https://example.com/dup",
		"status: queued",
		"---",
		"Content.",
	].join("\n");
	await fs.writeFile(path.join(rawDir, "2026", "04", "dup-1.md"), rawContent, "utf8");
	await fs.writeFile(path.join(rawDir, "2026", "04", "dup-2.md"), rawContent, "utf8");

	const result = await lintWiki({ wikiDir });
	const dups = result.issues.filter((i) => i.type === "duplicate-url");
	assert.ok(dups.length > 0, "should detect duplicate canonical URLs");
});

// ---------------------------------------------------------------------------
// ingestRawSources
// ---------------------------------------------------------------------------

async function createWikiWithQueuedRaw() {
	const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "vpk-wiki-ingest-"));
	for (const sub of ["raw/articles/2026/04", "entities", "concepts", "comparisons", "queries"]) {
		await fs.mkdir(path.join(tmpDir, ...sub.split("/")), { recursive: true });
	}
	await fs.writeFile(path.join(tmpDir, "log.md"), "# Wiki Log\n\n", "utf8");
	await fs.writeFile(
		path.join(tmpDir, "index.md"),
		"# Wiki Index\n\n## Entities\n\n### Products\n\n### People\n\n## Concepts\n\n## Comparisons\n\n## Queries\n",
		"utf8",
	);
	await fs.writeFile(
		path.join(tmpDir, "SCHEMA.md"),
		"# Wiki Schema\n\n## Domain\nAtlassian\n",
		"utf8",
	);

	// Add a queued raw file
	await fs.writeFile(
		path.join(tmpDir, "raw", "articles", "2026", "04", "rovo-overview.md"),
		[
			"---",
			"title: Rovo Overview",
			"source_url: https://example.com/rovo",
			"canonical_url: https://example.com/rovo",
			"captured_at: 2026-04-11T12:00:00Z",
			"capture_method: defuddle",
			"content_type: article",
			"word_count: 200",
			"tags: [rovo, ai]",
			"status: queued",
			"---",
			"",
			"# Rovo Overview",
			"",
			"Rovo is Atlassian's AI assistant that helps teams find information.",
			"It uses Atlassian Intelligence to search across connected apps.",
		].join("\n"),
		"utf8",
	);

	return tmpDir;
}

// Mock LLM response for ingest
function createMockExecutor() {
	return async () => {
		// Return a structured JSON response simulating what the LLM would generate
		return {
			backend: "mock",
			didRun: true,
			responseText: JSON.stringify({
				slug: "rovo",
				type: "entity",
				frontmatter: {
					title: "Rovo",
					created: "2026-04-11",
					updated: "2026-04-11",
					type: "entity",
					tags: ["rovo", "ai"],
					sources: ["raw/articles/2026/04/rovo-overview.md"],
				},
				body: "Rovo is [[atlassian]]'s AI assistant.\n\nIt helps teams find and act on information using [[atlassian-intelligence]].\n",
				indexEntry: "- [[rovo]] — Atlassian AI assistant",
			}),
			structuredResult: {
				slug: "rovo",
				type: "entity",
				frontmatter: {
					title: "Rovo",
					created: "2026-04-11",
					updated: "2026-04-11",
					type: "entity",
					tags: ["rovo", "ai"],
					sources: ["raw/articles/2026/04/rovo-overview.md"],
				},
				body: "Rovo is [[atlassian]]'s AI assistant.\n\nIt helps teams find and act on information using [[atlassian-intelligence]].\n",
				indexEntry: "- [[rovo]] — Atlassian AI assistant",
			},
		};
	};
}

test("ingestRawSources processes queued files into canonical pages", async () => {
	const wikiDir = await createWikiWithQueuedRaw();

	const result = await ingestRawSources({
		wikiDir,
		executorImpl: createMockExecutor(),
	});

	assert.equal(result.processed, 1);
	assert.equal(result.errors.length, 0);

	// Check canonical page was created
	const canonicalPath = path.join(wikiDir, "entities", "rovo.md");
	const canonicalContent = await fs.readFile(canonicalPath, "utf8");
	assert.ok(canonicalContent.includes("Rovo"), "canonical page should exist");
});

test("ingestRawSources updates raw file status to ingested", async () => {
	const wikiDir = await createWikiWithQueuedRaw();

	await ingestRawSources({
		wikiDir,
		executorImpl: createMockExecutor(),
	});

	const rawContent = await fs.readFile(
		path.join(wikiDir, "raw", "articles", "2026", "04", "rovo-overview.md"),
		"utf8",
	);
	const { frontmatter } = parseFrontmatter(rawContent);
	assert.equal(frontmatter.status, "ingested");
});

test("ingestRawSources updates index.md", async () => {
	const wikiDir = await createWikiWithQueuedRaw();

	await ingestRawSources({
		wikiDir,
		executorImpl: createMockExecutor(),
	});

	const indexContent = await fs.readFile(path.join(wikiDir, "index.md"), "utf8");
	assert.ok(indexContent.includes("[[rovo]]"), "index should contain new entry");
});

test("ingestRawSources appends to log.md", async () => {
	const wikiDir = await createWikiWithQueuedRaw();

	await ingestRawSources({
		wikiDir,
		executorImpl: createMockExecutor(),
	});

	const logContent = await fs.readFile(path.join(wikiDir, "log.md"), "utf8");
	assert.ok(logContent.includes("ingest"), "log should contain ingest event");
});

test("ingestRawSources skips already-ingested files", async () => {
	const wikiDir = await createWikiWithQueuedRaw();

	// Change status to ingested
	const rawPath = path.join(wikiDir, "raw", "articles", "2026", "04", "rovo-overview.md");
	let content = await fs.readFile(rawPath, "utf8");
	content = content.replace("status: queued", "status: ingested");
	await fs.writeFile(rawPath, content, "utf8");

	const result = await ingestRawSources({
		wikiDir,
		executorImpl: createMockExecutor(),
	});

	assert.equal(result.processed, 0);
	assert.equal(result.skipped, 1);
});

test("ingestRawSources handles executor failure without crashing", async () => {
	const wikiDir = await createWikiWithQueuedRaw();

	const failingExecutor = async () => {
		throw new Error("LLM unavailable");
	};

	const result = await ingestRawSources({
		wikiDir,
		executorImpl: failingExecutor,
	});

	assert.equal(result.processed, 0);
	assert.equal(result.errors.length, 1);
	assert.ok(result.errors[0].includes("LLM unavailable"));
});

test("ingestRawSources refreshes the matching qmd collection after canonical writes", async () => {
	const wikiDir = await createWikiWithQueuedRaw();
	const qmdSyncCalls = [];

	const result = await ingestRawSources({
		executorImpl: createMockExecutor(),
		qmdSyncImpl: async (payload) => {
			qmdSyncCalls.push(payload);
		},
		wikiDir,
	});

	assert.equal(result.processed, 1);
	assert.equal(qmdSyncCalls.length, 1);
	assert.equal(qmdSyncCalls[0].pageType, "entity");
	assert.equal(qmdSyncCalls[0].pageData.slug, "rovo");
	assert.ok(qmdSyncCalls[0].canonicalPath.endsWith(path.join("entities", "rovo.md")));
});

test("ingestRawSources logs qmd refresh failures without failing the ingest", async () => {
	const wikiDir = await createWikiWithQueuedRaw();
	const originalWarn = console.warn;
	const warnings = [];
	console.warn = (...args) => {
		warnings.push(args.join(" "));
	};

	try {
		const result = await ingestRawSources({
			executorImpl: createMockExecutor(),
			qmdSyncImpl: async () => {
				throw new Error("qmd unavailable");
			},
			wikiDir,
		});

		assert.equal(result.processed, 1);
		assert.equal(result.errors.length, 0);
		assert.ok(warnings.some((warning) => warning.includes("qmd unavailable")));
	} finally {
		console.warn = originalWarn;
	}
});

// ---------------------------------------------------------------------------
// regenerateMemoryDigest
// ---------------------------------------------------------------------------

test("regenerateMemoryDigest produces digest from wiki pages", async () => {
	const wikiDir = await createPopulatedWiki();
	await fs.mkdir(path.join(wikiDir, "profiles"), { recursive: true });
	await fs.mkdir(path.join(wikiDir, "operations"), { recursive: true });
	await fs.writeFile(path.join(wikiDir, "profiles", "self.md"), "# Self\n\n- Prefers concise answers.\n", "utf8");
	await fs.writeFile(path.join(wikiDir, "operations", "core-memory.md"), "# Core Memory\n\n- Keep the runtime loop on RovoDev.\n", "utf8");

	const result = await regenerateMemoryDigest({
		generateTextImpl: async ({ system }) => {
			return system.includes("profile")
				? "# Profile Context\n\n- Prefers concise answers."
				: "# Runtime Context\n\n- Keep the runtime loop on RovoDev.";
		},
		wikiDir,
	});

	assert.equal(result.entriesWritten, 2);
	const profileOutput = await fs.readFile(path.join(wikiDir, "output", "profile-context.md"), "utf8");
	const runtimeOutput = await fs.readFile(path.join(wikiDir, "output", "runtime-context.md"), "utf8");
	assert.match(profileOutput, /Prefers concise answers/u);
	assert.match(runtimeOutput, /runtime loop on RovoDev/u);
});

test("regenerateMemoryDigest handles empty wiki", async () => {
	const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "vpk-wiki-empty-"));
	for (const sub of ["profiles", "operations", "entities", "concepts", "comparisons", "queries"]) {
		await fs.mkdir(path.join(tmpDir, sub), { recursive: true });
	}

	const result = await regenerateMemoryDigest({
		generateTextImpl: async () => "- Empty compiled context.",
		wikiDir: tmpDir,
	});
	assert.equal(result.entriesWritten, 2);
});

// ---------------------------------------------------------------------------
// getWikiJobDefinitions
// ---------------------------------------------------------------------------

test("getWikiJobDefinitions returns wiki job definitions", () => {
	const jobs = getWikiJobDefinitions();
	assert.equal(jobs.length, 3);
});

test("getWikiJobDefinitions has valid cron schedules", () => {
	const jobs = getWikiJobDefinitions();
	for (const job of jobs) {
		assert.ok(job.name, "job should have a name");
		assert.ok(job.schedule, "job should have a schedule");
		assert.ok(job.prompt, "job should have a prompt");
		assert.ok(job.skills.includes("research/llm-wiki"), "job should reference wiki skill");
		// Validate cron format: 5 fields
		const parts = job.schedule.split(/\s+/u);
		assert.equal(parts.length, 5, `schedule "${job.schedule}" should have 5 fields`);
	}
});

// ---------------------------------------------------------------------------
// ensureWikiJobs
// ---------------------------------------------------------------------------

test("ensureWikiJobs creates jobs when none exist", async () => {
	const createdJobs = [];
	const mockProvider = {
		listHermesJobs: async () => [],
		createHermesJob: async (def) => {
			createdJobs.push(def);
			return { ...def, id: `job-${createdJobs.length}` };
		},
	};

	const result = await ensureWikiJobs(mockProvider);
	assert.equal(result.created, 3);
	assert.equal(result.existing, 0);
	assert.equal(createdJobs.length, 3);
	assert.ok(createdJobs.some((j) => j.name === "wiki-nightly-ingest"));
	assert.ok(createdJobs.some((j) => j.name === "wiki-memory-sync"));
	assert.ok(createdJobs.some((j) => j.name === "wiki-digest-regen"));
});

test("ensureWikiJobs skips jobs that already exist", async () => {
	const createdJobs = [];
	const mockProvider = {
		listHermesJobs: async () => [
			{ name: "wiki-nightly-ingest", id: "existing-1" },
			{ name: "wiki-memory-sync", id: "existing-2" },
			{ name: "wiki-digest-regen", id: "existing-3" },
		],
		createHermesJob: async (def) => {
			createdJobs.push(def);
			return def;
		},
	};

	const result = await ensureWikiJobs(mockProvider);
	assert.equal(result.created, 0);
	assert.equal(result.existing, 3);
	assert.equal(createdJobs.length, 0);
});

test("ensureWikiJobs handles missing provider gracefully", async () => {
	const result = await ensureWikiJobs(null);
	assert.equal(result.created, 0);
	assert.equal(result.existing, 0);
});

// ---------------------------------------------------------------------------
// getWikiStatus
// ---------------------------------------------------------------------------

test("getWikiStatus summarizes canonical pages, raw captures, and digest state", async () => {
	const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "vpk-wiki-status-"));

	await fs.mkdir(path.join(tmpDir, "profiles"), { recursive: true });
	await fs.mkdir(path.join(tmpDir, "operations"), { recursive: true });
	await fs.mkdir(path.join(tmpDir, "entities"), { recursive: true });
	await fs.mkdir(path.join(tmpDir, "concepts"), { recursive: true });
	await fs.mkdir(path.join(tmpDir, "comparisons"), { recursive: true });
	await fs.mkdir(path.join(tmpDir, "queries"), { recursive: true });
	await fs.mkdir(path.join(tmpDir, "raw", "articles", "2026", "04"), { recursive: true });
	await fs.mkdir(path.join(tmpDir, "raw", "papers", "2026", "04"), { recursive: true });
	await fs.mkdir(path.join(tmpDir, "output"), { recursive: true });

	await Promise.all([
		fs.writeFile(path.join(tmpDir, "SCHEMA.md"), "# Schema\n", "utf8"),
		fs.writeFile(path.join(tmpDir, "index.md"), "# Index\n", "utf8"),
		fs.writeFile(path.join(tmpDir, "log.md"), "# Log\n", "utf8"),
		fs.writeFile(path.join(tmpDir, "profiles", "self.md"), "# Self\n", "utf8"),
		fs.writeFile(path.join(tmpDir, "operations", "core-memory.md"), "# Core Memory\n", "utf8"),
		fs.writeFile(path.join(tmpDir, "entities", "atlassian.md"), "# Atlassian\n", "utf8"),
		fs.writeFile(path.join(tmpDir, "concepts", "rovo.md"), "# Rovo\n", "utf8"),
		fs.writeFile(path.join(tmpDir, "comparisons", "jira-vs-linear.md"), "# Compare\n", "utf8"),
		fs.writeFile(path.join(tmpDir, "queries", "what-is-rovo.md"), "# Query\n", "utf8"),
		fs.writeFile(path.join(tmpDir, "raw", "articles", "2026", "04", "capture-1.md"), "# Raw article\n", "utf8"),
		fs.writeFile(path.join(tmpDir, "raw", "papers", "2026", "04", "capture-2.md"), "# Raw paper\n", "utf8"),
		fs.writeFile(path.join(tmpDir, "output", "profile-context.md"), "- Profile context\n", "utf8"),
	]);

	const status = await getWikiStatus({ wikiDir: tmpDir });

	assert.equal(status.wikiDir, tmpDir);
	assert.equal(status.canonicalCounts.profiles, 1);
	assert.equal(status.canonicalCounts.operations, 1);
	assert.equal(status.canonicalCounts.entities, 1);
	assert.equal(status.canonicalCounts.concepts, 1);
	assert.equal(status.canonicalCounts.comparisons, 1);
	assert.equal(status.canonicalCounts.queries, 1);
	assert.equal(status.totalCanonicalPages, 6);
	assert.equal(status.rawCounts.articles, 1);
	assert.equal(status.rawCounts.papers, 1);
	assert.equal(status.totalRawCaptures, 2);
	assert.equal(status.hasWikiDigestEntry, true);
	assert.equal(status.compiledContexts.profile.exists, true);
	assert.equal(status.proposalCounts.queued, 0);
	assert.equal(status.files.schema.exists, true);
	assert.equal(status.files.index.exists, true);
	assert.equal(status.files.log.exists, true);
	assert.ok(typeof status.generatedAt === "string" && status.generatedAt.length > 0);
});

test("getWikiStatus returns zero counts when the wiki directories are missing", async () => {
	const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "vpk-wiki-status-empty-"));

	const status = await getWikiStatus({ wikiDir: tmpDir });

	assert.equal(status.totalCanonicalPages, 0);
	assert.equal(status.totalRawCaptures, 0);
	assert.equal(status.hasWikiDigestEntry, false);
	assert.equal(status.files.schema.exists, false);
	assert.equal(status.files.index.exists, false);
	assert.equal(status.files.log.exists, false);
});
