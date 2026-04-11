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
	generateSlug,
	isSkippableUrl,
	parseFrontmatter,
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
