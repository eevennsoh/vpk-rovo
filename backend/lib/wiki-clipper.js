"use strict";

const crypto = require("node:crypto");
const fs = require("node:fs/promises");
const path = require("node:path");

const WIKI_DIR = "/Users/esoh/wiki";
const MAX_SLUG_LENGTH = 80;

const SERP_PATTERNS = [
	/google\.\w+\/search/iu,
	/bing\.com\/search/iu,
	/duckduckgo\.com\/\?/iu,
	/search\.yahoo\.com\/search/iu,
	/baidu\.com\/s\?/iu,
];

const PRIVATE_HOST_PATTERNS = [
	/^127\./u,
	/^10\./u,
	/^192\.168\./u,
	/^172\.(1[6-9]|2\d|3[01])\./u,
	/^0\./u,
	/^localhost$/iu,
	/\.local$/iu,
];

// ---------------------------------------------------------------------------
// Slug generation
// ---------------------------------------------------------------------------

function generateSlug(title) {
	if (!title || typeof title !== "string" || !title.trim()) {
		return `untitled-${Date.now()}`;
	}

	let slug = title
		.normalize("NFD")
		.replace(/[\u0300-\u036F]/gu, "")    // strip diacritics
		.toLowerCase()
		.replace(/[^\da-z\s-]/gu, "")        // keep only alphanumeric, spaces, hyphens
		.replace(/[\s-]+/gu, "-")             // collapse whitespace/hyphens
		.replace(/^-+|-+$/gu, "");            // trim leading/trailing hyphens

	if (!slug) {
		return `untitled-${Date.now()}`;
	}

	if (slug.length > MAX_SLUG_LENGTH) {
		slug = slug.slice(0, MAX_SLUG_LENGTH);
		const lastHyphen = slug.lastIndexOf("-");
		if (lastHyphen > 0) {
			slug = slug.slice(0, lastHyphen);
		}
	}

	return slug;
}

// ---------------------------------------------------------------------------
// Output path
// ---------------------------------------------------------------------------

function buildOutputPath(wikiDir, category, slug) {
	const now = new Date();
	const yyyy = String(now.getFullYear());
	const mm = String(now.getMonth() + 1).padStart(2, "0");
	return path.join(wikiDir, "raw", category, yyyy, mm, `${slug}.md`);
}

// ---------------------------------------------------------------------------
// Frontmatter serialization
// ---------------------------------------------------------------------------

function serializeValue(value) {
	if (typeof value === "string") {
		if (/[:#\[\]{},"'|>&*!?@`]/u.test(value) || value.includes("\n")) {
			return `"${value.replace(/\\/gu, "\\\\").replace(/"/gu, '\\"')}"`;
		}
		return value;
	}
	if (typeof value === "number" || typeof value === "boolean") {
		return String(value);
	}
	if (Array.isArray(value)) {
		return `[${value.map((item) => serializeValue(item)).join(", ")}]`;
	}
	return String(value);
}

function serializeFrontmatter(metadata) {
	const lines = ["---"];
	for (const [key, value] of Object.entries(metadata)) {
		if (value === undefined || value === null) {
			continue;
		}
		lines.push(`${key}: ${serializeValue(value)}`);
	}
	lines.push("---");
	return `${lines.join("\n")}\n`;
}

function parseFrontmatter(content) {
	if (typeof content !== "string") {
		return { frontmatter: {}, body: "" };
	}

	const match = content.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/u);
	if (!match) {
		return { frontmatter: {}, body: content };
	}

	const yamlBlock = match[1];
	const body = match[2];
	const frontmatter = {};

	for (const line of yamlBlock.split("\n")) {
		const colonIndex = line.indexOf(":");
		if (colonIndex === -1) {
			continue;
		}

		const key = line.slice(0, colonIndex).trim();
		let rawValue = line.slice(colonIndex + 1).trim();

		if (!key) {
			continue;
		}

		// Unquote strings
		if (
			(rawValue.startsWith('"') && rawValue.endsWith('"'))
			|| (rawValue.startsWith("'") && rawValue.endsWith("'"))
		) {
			rawValue = rawValue.slice(1, -1);
		}

		// Parse arrays: [a, b, c]
		if (rawValue.startsWith("[") && rawValue.endsWith("]")) {
			const inner = rawValue.slice(1, -1).trim();
			if (!inner) {
				frontmatter[key] = [];
			} else {
				frontmatter[key] = inner.split(",").map((item) => {
					let trimmed = item.trim();
					if (
						(trimmed.startsWith('"') && trimmed.endsWith('"'))
						|| (trimmed.startsWith("'") && trimmed.endsWith("'"))
					) {
						trimmed = trimmed.slice(1, -1);
					}
					return trimmed;
				});
			}
			continue;
		}

		// Parse numbers
		if (/^\d+$/u.test(rawValue)) {
			frontmatter[key] = Number.parseInt(rawValue, 10);
			continue;
		}

		// Parse booleans
		if (rawValue === "true") {
			frontmatter[key] = true;
			continue;
		}
		if (rawValue === "false") {
			frontmatter[key] = false;
			continue;
		}

		frontmatter[key] = rawValue;
	}

	return { frontmatter, body };
}

// ---------------------------------------------------------------------------
// URL validation
// ---------------------------------------------------------------------------

function validateUrl(url) {
	if (!url || typeof url !== "string" || !url.trim()) {
		const error = new Error("URL is required.");
		error.code = "INVALID_INPUT";
		throw error;
	}

	let parsed;
	try {
		parsed = new URL(url);
	} catch {
		const error = new Error(`Invalid URL: ${url}`);
		error.code = "INVALID_INPUT";
		throw error;
	}

	if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
		const error = new Error(`URL rejected: unsupported protocol ${parsed.protocol}`);
		error.code = "INVALID_INPUT";
		throw error;
	}

	const hostname = parsed.hostname;
	for (const pattern of PRIVATE_HOST_PATTERNS) {
		if (pattern.test(hostname)) {
			const error = new Error(`URL rejected: private/local address ${hostname}`);
			error.code = "INVALID_INPUT";
			throw error;
		}
	}

	return parsed;
}

function isSkippableUrl(url) {
	return SERP_PATTERNS.some((pattern) => pattern.test(url));
}

// ---------------------------------------------------------------------------
// Content hashing
// ---------------------------------------------------------------------------

function computeContentHash(content) {
	return crypto.createHash("sha256").update(content).digest("hex");
}

// ---------------------------------------------------------------------------
// Dedupe index
// ---------------------------------------------------------------------------

async function walkMarkdownFiles(dir) {
	const files = [];

	let entries;
	try {
		entries = await fs.readdir(dir, { withFileTypes: true });
	} catch {
		return files;
	}

	for (const entry of entries) {
		const fullPath = path.join(dir, entry.name);
		if (entry.isDirectory()) {
			files.push(...(await walkMarkdownFiles(fullPath)));
		} else if (entry.isFile() && entry.name.endsWith(".md")) {
			files.push(fullPath);
		}
	}

	return files;
}

async function buildDedupeIndex(rawDir) {
	const index = new Map();
	const files = await walkMarkdownFiles(rawDir);

	for (const filePath of files) {
		try {
			const content = await fs.readFile(filePath, "utf8");
			const { frontmatter } = parseFrontmatter(content);
			const url = frontmatter.canonical_url || frontmatter.source_url;
			if (url) {
				index.set(url, filePath);
			}
		} catch {
			// Skip unreadable files
		}
	}

	return index;
}

// ---------------------------------------------------------------------------
// Wiki log
// ---------------------------------------------------------------------------

async function appendToLog(wikiDir, action, subject, details = []) {
	const logPath = path.join(wikiDir, "log.md");
	const date = new Date().toISOString().slice(0, 10);
	const lines = [`\n## [${date}] ${action} | ${subject}`];
	for (const detail of details) {
		lines.push(`- ${detail}`);
	}
	lines.push("");

	await fs.appendFile(logPath, lines.join("\n"), "utf8");
}

// ---------------------------------------------------------------------------
// captureUrl
// ---------------------------------------------------------------------------

const MIN_WORD_COUNT = 50;

async function captureUrl({
	category = "articles",
	fetchImpl = globalThis.fetch,
	forceRefresh = false,
	tags = [],
	url,
	wikiDir = WIKI_DIR,
} = {}) {
	// 1. Validate
	validateUrl(url);

	if (isSkippableUrl(url)) {
		return { skipped: true, reason: "search-results-page" };
	}

	// 2. Fetch HTML
	const response = await fetchImpl(url);
	if (!response.ok) {
		const error = new Error(`Fetch failed with status ${response.status} for ${url}`);
		error.code = "FETCH_FAILED";
		throw error;
	}
	const html = await response.text();

	// 3. Parse DOM + extract with defuddle
	const { parseHTML } = require("linkedom");
	const { DefuddleClass } = await import("defuddle/node");
	const TurndownService = require("turndown");

	const { document } = parseHTML(html);

	// Extract canonical URL from DOM before defuddle processing
	const canonicalLink = document.querySelector("link[rel=canonical]");
	const canonicalUrl = canonicalLink?.getAttribute("href") || url;

	const instance = new DefuddleClass(document, { url });
	const extracted = instance.parse();

	// 4. Check word count
	const wordCount = extracted.wordCount || 0;
	if (wordCount < MIN_WORD_COUNT) {
		return { skipped: true, reason: "low-content", wordCount };
	}

	// 5. Convert HTML content to markdown
	const turndown = new TurndownService({ headingStyle: "atx", codeBlockStyle: "fenced" });
	const markdownBody = turndown.turndown(extracted.content || "");

	// 6. Generate slug + check dedupe
	const title = extracted.title || "Untitled";
	const slug = generateSlug(title);
	const rawDir = path.join(wikiDir, "raw");
	const dedupeIndex = await buildDedupeIndex(rawDir);

	const dedupeKey = canonicalUrl || url;
	const existingPath = dedupeIndex.get(dedupeKey);

	if (existingPath && !forceRefresh) {
		const existingContent = await fs.readFile(existingPath, "utf8");
		const { frontmatter } = parseFrontmatter(existingContent);
		return { filePath: existingPath, metadata: frontmatter, isUpdate: false };
	}

	// 7. Build metadata
	const metadata = {
		title,
		source_url: url,
		canonical_url: canonicalUrl,
		captured_at: new Date().toISOString(),
		capture_method: "defuddle",
		content_type: category === "bookmarks" ? "bookmark" : "article",
		author: extracted.author || undefined,
		published: extracted.published || undefined,
		description: extracted.description || undefined,
		word_count: wordCount,
		tags: tags.length > 0 ? tags : undefined,
		status: forceRefresh && existingPath ? "updated" : "queued",
	};

	// 8. Write file
	const filePath = existingPath || buildOutputPath(wikiDir, category, slug);
	const dirPath = path.dirname(filePath);
	await fs.mkdir(dirPath, { recursive: true });

	const fileContent = `${serializeFrontmatter(metadata)}\n${markdownBody}\n`;
	await fs.writeFile(filePath, fileContent, "utf8");

	// 9. Log
	await appendToLog(wikiDir, "capture", title, [
		`URL: ${url}`,
		`Path: ${filePath}`,
		forceRefresh && existingPath ? "Action: updated existing" : "Action: new capture",
	]);

	return { filePath, metadata, isUpdate: Boolean(forceRefresh && existingPath) };
}

// ---------------------------------------------------------------------------
// queryWiki
// ---------------------------------------------------------------------------

const WIKI_CONTENT_DIRS = ["entities", "concepts", "comparisons", "queries"];
const RAW_WIKI_CONTENT_DIRS = ["articles", "papers", "transcripts", "assets"];

async function queryWiki(query, { wikiDir = WIKI_DIR } = {}) {
	if (!query || typeof query !== "string" || !query.trim()) {
		return { results: [] };
	}

	const normalizedQuery = query.toLowerCase().trim();
	const terms = normalizedQuery.split(/\s+/u);
	const results = [];

	for (const dir of WIKI_CONTENT_DIRS) {
		const dirPath = path.join(wikiDir, dir);
		const files = await walkMarkdownFiles(dirPath);

		for (const filePath of files) {
			try {
				const content = await fs.readFile(filePath, "utf8");
				const { frontmatter, body } = parseFrontmatter(content);
				const title = (frontmatter.title || "").toLowerCase();
				const tagsStr = Array.isArray(frontmatter.tags)
					? frontmatter.tags.join(" ").toLowerCase()
					: "";
				const bodyLower = body.toLowerCase();

				const searchable = `${title} ${tagsStr} ${bodyLower}`;
				const matchCount = terms.filter((term) => searchable.includes(term)).length;

				if (matchCount === 0) {
					continue;
				}

				// Extract snippet around first match
				const firstTermIndex = terms.reduce((best, term) => {
					const idx = bodyLower.indexOf(term);
					return idx >= 0 && (best < 0 || idx < best) ? idx : best;
				}, -1);

				const snippetStart = Math.max(0, firstTermIndex - 40);
				const snippet = body.slice(snippetStart, snippetStart + 120).trim();

				results.push({
					title: frontmatter.title || path.basename(filePath, ".md"),
					path: filePath,
					snippet: snippet || body.slice(0, 120).trim(),
					score: matchCount / terms.length,
				});
			} catch {
				// Skip unreadable files
			}
		}
	}

	results.sort((a, b) => b.score - a.score);
	return { results };
}

// ---------------------------------------------------------------------------
// lintWiki
// ---------------------------------------------------------------------------

async function lintWiki({ wikiDir = WIKI_DIR } = {}) {
	const issues = [];

	// 1. Read index.md
	let indexContent = "";
	try {
		indexContent = await fs.readFile(path.join(wikiDir, "index.md"), "utf8");
	} catch {
		issues.push({ type: "missing-file", path: "index.md", message: "index.md not found" });
	}

	// 2. Collect all canonical pages
	const allPages = [];
	for (const dir of WIKI_CONTENT_DIRS) {
		const dirPath = path.join(wikiDir, dir);
		const files = await walkMarkdownFiles(dirPath);
		for (const filePath of files) {
			try {
				const content = await fs.readFile(filePath, "utf8");
				const { frontmatter, body } = parseFrontmatter(content);
				allPages.push({ filePath, frontmatter, body, slug: path.basename(filePath, ".md") });
			} catch {
				issues.push({ type: "unreadable", path: filePath, message: "Could not read file" });
			}
		}
	}

	// Collect all known slugs for wikilink resolution
	const knownSlugs = new Set(allPages.map((p) => p.slug));

	// 3. Check each page
	for (const page of allPages) {
		// Check frontmatter fields
		for (const field of ["title", "created", "updated", "type", "tags"]) {
			if (page.frontmatter[field] === undefined || page.frontmatter[field] === "") {
				issues.push({
					type: "missing-frontmatter",
					path: page.filePath,
					message: `Missing required field: ${field}`,
				});
			}
		}

		// Check index entry
		if (!indexContent.includes(`[[${page.slug}]]`)) {
			issues.push({
				type: "missing-index-entry",
				path: page.filePath,
				message: `Page "${page.slug}" not found in index.md`,
			});
		}

		// Check wikilinks resolve
		const wikilinks = page.body.match(/\[\[([^\]]+)\]\]/gu) || [];
		for (const link of wikilinks) {
			const target = link.slice(2, -2).toLowerCase();
			if (!knownSlugs.has(target)) {
				issues.push({
					type: "broken-wikilink",
					path: page.filePath,
					message: `Broken wikilink [[${target}]] — page does not exist`,
				});
			}
		}
	}

	// 4. Check for duplicate canonical URLs in raw/
	const rawDir = path.join(wikiDir, "raw");
	const rawFiles = await walkMarkdownFiles(rawDir);
	const urlToFiles = new Map();

	for (const filePath of rawFiles) {
		try {
			const content = await fs.readFile(filePath, "utf8");
			const { frontmatter } = parseFrontmatter(content);
			const url = frontmatter.canonical_url || frontmatter.source_url;
			if (url) {
				if (!urlToFiles.has(url)) {
					urlToFiles.set(url, []);
				}
				urlToFiles.get(url).push(filePath);
			}
		} catch {
			// Skip
		}
	}

	for (const [url, files] of urlToFiles) {
		if (files.length > 1) {
			issues.push({
				type: "duplicate-url",
				path: files[1],
				message: `Duplicate canonical URL "${url}" — also in ${files[0]}`,
			});
		}
	}

	return { issues };
}

// ---------------------------------------------------------------------------
// ingestRawSources
// ---------------------------------------------------------------------------

const TYPE_TO_DIR = {
	entity: "entities",
	concept: "concepts",
	comparison: "comparisons",
	query: "queries",
};

function buildIngestPrompt(rawFrontmatter, rawBody, schemaContent, indexContent) {
	return [
		"You are a wiki editor. Given the raw captured article below, generate a canonical wiki page.",
		"",
		"## Wiki Schema",
		schemaContent,
		"",
		"## Current Index",
		indexContent,
		"",
		"## Raw Article Frontmatter",
		JSON.stringify(rawFrontmatter, null, 2),
		"",
		"## Raw Article Content",
		rawBody,
		"",
		"## Instructions",
		"Generate a JSON object with these fields:",
		'- slug: lowercase hyphenated page name (e.g., "rovo")',
		'- type: one of "entity", "concept", "comparison", "query"',
		"- frontmatter: object with title, created (YYYY-MM-DD), updated (YYYY-MM-DD), type, tags (array), sources (array of raw file paths)",
		"- body: markdown content with at least 2 [[wikilinks]] to other pages",
		'- indexEntry: one line for index.md (e.g., "- [[slug]] — description")',
		"",
		"Return ONLY the JSON object, no other text.",
	].join("\n");
}

function updateRawFileStatus(content, newStatus) {
	return content.replace(
		/^(status:\s*).+$/mu,
		`$1${newStatus}`,
	);
}

async function ingestRawSources({
	executorImpl,
	wikiDir = WIKI_DIR,
} = {}) {
	// Default executor: use runRovoDevBackgroundTask with structured JSON parsing
	const executor = executorImpl || (async ({ prompt }) => {
		const { runRovoDevBackgroundTask, parseStructuredJsonResponse } = require("./rovo-task-executor");
		return runRovoDevBackgroundTask({
			prompt,
			selectedSkillIds: ["research/llm-wiki"],
			parseStructuredResult: parseStructuredJsonResponse,
			system: "You are a wiki editor. Return ONLY a JSON object with fields: slug, type, frontmatter, body, indexEntry. No other text.",
		});
	});
	const rawDir = path.join(wikiDir, "raw");
	const rawFiles = await walkMarkdownFiles(rawDir);

	// Read schema and index for LLM context
	let schemaContent = "";
	let indexContent = "";
	try {
		schemaContent = await fs.readFile(path.join(wikiDir, "SCHEMA.md"), "utf8");
	} catch {
		// No schema — proceed without
	}
	try {
		indexContent = await fs.readFile(path.join(wikiDir, "index.md"), "utf8");
	} catch {
		// No index — proceed without
	}

	let processed = 0;
	let skipped = 0;
	const errors = [];

	for (const filePath of rawFiles) {
		let content;
		try {
			content = await fs.readFile(filePath, "utf8");
		} catch {
			errors.push(`Could not read ${filePath}`);
			continue;
		}

		const { frontmatter, body } = parseFrontmatter(content);

		// Only process queued or updated files
		if (frontmatter.status !== "queued" && frontmatter.status !== "updated") {
			skipped += 1;
			continue;
		}

		try {
			// Call LLM to generate canonical page
			const prompt = buildIngestPrompt(frontmatter, body, schemaContent, indexContent);
			const executorResult = await executor({ prompt });

			// Parse structured result
			let pageData = executorResult.structuredResult;
			if (!pageData && executorResult.responseText) {
				const { parseStructuredJsonResponse } = require("./rovo-task-executor");
				pageData = parseStructuredJsonResponse(executorResult.responseText);
			}

			if (!pageData || !pageData.slug || !pageData.type || !pageData.body) {
				errors.push(`Invalid LLM response for ${filePath}`);
				continue;
			}

			// Write canonical page
			const targetDir = TYPE_TO_DIR[pageData.type] || "entities";
			const canonicalPath = path.join(wikiDir, targetDir, `${pageData.slug}.md`);
			const canonicalContent = `${serializeFrontmatter(pageData.frontmatter)}\n${pageData.body}\n`;
			await fs.writeFile(canonicalPath, canonicalContent, "utf8");

			// Update index.md
			if (pageData.indexEntry && !indexContent.includes(`[[${pageData.slug}]]`)) {
				indexContent += `${pageData.indexEntry}\n`;
				await fs.writeFile(path.join(wikiDir, "index.md"), indexContent, "utf8");
			}

			// Update raw file status
			const updatedContent = updateRawFileStatus(content, "ingested");
			await fs.writeFile(filePath, updatedContent, "utf8");

			// Log
			await appendToLog(wikiDir, "ingest", pageData.frontmatter?.title || pageData.slug, [
				`Source: ${filePath}`,
				`Canonical: ${canonicalPath}`,
				`Type: ${pageData.type}`,
			]);

			processed += 1;
		} catch (error) {
			errors.push(`${filePath}: ${error.message}`);
		}
	}

	return { processed, skipped, errors };
}

// ---------------------------------------------------------------------------
// regenerateMemoryDigest
// ---------------------------------------------------------------------------

const DIGEST_PREFIX = "[wiki-digest]";

async function readFileSummary(filePath) {
	try {
		const stats = await fs.stat(filePath);
		return {
			exists: stats.isFile(),
			path: filePath,
			updatedAt: stats.mtime.toISOString(),
		};
	} catch (error) {
		if (error && error.code === "ENOENT") {
			return {
				exists: false,
				path: filePath,
				updatedAt: null,
			};
		}

		throw error;
	}
}

async function countMarkdownFiles(dirPath) {
	const files = await walkMarkdownFiles(dirPath);
	return files.length;
}

function buildCountRecord(entries) {
	return Object.fromEntries(entries);
}

function sumCountRecord(record) {
	return Object.values(record).reduce((total, value) => total + value, 0);
}

function getMemoryEntryText(entry) {
	if (typeof entry === "string") {
		return entry;
	}

	if (typeof entry?.content === "string") {
		return entry.content;
	}

	if (typeof entry?.text === "string") {
		return entry.text;
	}

	return "";
}

async function getWikiStatus({
	memoryImpl,
	wikiDir = WIKI_DIR,
} = {}) {
	const memory = memoryImpl || (() => {
		const { getHermesMemory } = require("./hermes-memory");
		return {
			getMemory: getHermesMemory,
		};
	})();

	const [
		indexFile,
		logFile,
		schemaFile,
		canonicalEntries,
		rawEntries,
		memoryRecord,
	] = await Promise.all([
		readFileSummary(path.join(wikiDir, "index.md")),
		readFileSummary(path.join(wikiDir, "log.md")),
		readFileSummary(path.join(wikiDir, "SCHEMA.md")),
		Promise.all(
			WIKI_CONTENT_DIRS.map(async (section) => ([
				section,
				await countMarkdownFiles(path.join(wikiDir, section)),
			])),
		),
		Promise.all(
			RAW_WIKI_CONTENT_DIRS.map(async (section) => ([
				section,
				await countMarkdownFiles(path.join(wikiDir, "raw", section)),
			])),
		),
		memory.getMemory("memory"),
	]);

	const canonicalCounts = buildCountRecord(canonicalEntries);
	const rawCounts = buildCountRecord(rawEntries);
	const memoryEntries = Array.isArray(memoryRecord?.entries) ? memoryRecord.entries : [];

	return {
		wikiDir,
		generatedAt: new Date().toISOString(),
		canonicalCounts,
		rawCounts,
		totalCanonicalPages: sumCountRecord(canonicalCounts),
		totalRawCaptures: sumCountRecord(rawCounts),
		hasWikiDigestEntry: memoryEntries.some((entry) => getMemoryEntryText(entry).includes(DIGEST_PREFIX)),
		files: {
			index: indexFile,
			log: logFile,
			schema: schemaFile,
		},
	};
}

async function regenerateMemoryDigest({
	memoryImpl,
	wikiDir = WIKI_DIR,
} = {}) {
	// Default memory impl: use Hermes memory system
	const memory = memoryImpl || (() => {
		const { addHermesMemoryEntry, getHermesMemory, removeHermesMemoryEntry } = require("./hermes-memory");
		return {
			getMemory: (target) => getHermesMemory(target),
			addEntry: (target, content) => addHermesMemoryEntry(target, { content }),
			removeEntry: (target, entryId) => removeHermesMemoryEntry(target, entryId),
		};
	})();
	// 1. Read all canonical wiki pages
	const pages = [];
	for (const dir of WIKI_CONTENT_DIRS) {
		const dirPath = path.join(wikiDir, dir);
		const files = await walkMarkdownFiles(dirPath);
		for (const filePath of files) {
			try {
				const content = await fs.readFile(filePath, "utf8");
				const { frontmatter } = parseFrontmatter(content);
				pages.push({
					title: frontmatter.title || path.basename(filePath, ".md"),
					type: frontmatter.type || dir.replace(/s$/u, ""),
					tags: frontmatter.tags || [],
					updated: frontmatter.updated || "",
				});
			} catch {
				// Skip unreadable files
			}
		}
	}

	// 2. Remove old wiki-digest entries from memory
	const currentMemory = await memory.getMemory("memory");
	for (const entry of currentMemory.entries || []) {
		if (entry.content && entry.content.startsWith(DIGEST_PREFIX)) {
			await memory.removeEntry("memory", entry.id);
		}
	}

	// 3. Build condensed digest
	if (pages.length === 0) {
		return { entriesWritten: 0 };
	}

	const byType = {};
	for (const page of pages) {
		const type = page.type;
		if (!byType[type]) {
			byType[type] = [];
		}
		byType[type].push(page.title);
	}

	const digestLines = [`${DIGEST_PREFIX} Wiki knowledge base (${pages.length} pages)`];
	for (const [type, titles] of Object.entries(byType)) {
		digestLines.push(`${type}: ${titles.join(", ")}`);
	}

	// Add recent captures info
	const allTags = [...new Set(pages.flatMap((p) => p.tags))];
	if (allTags.length > 0) {
		digestLines.push(`Topics covered: ${allTags.join(", ")}`);
	}

	const digestText = digestLines.join(". ");

	// 4. Write new digest entry
	await memory.addEntry("memory", digestText);

	return { entriesWritten: 1 };
}

// ---------------------------------------------------------------------------
// Job definitions
// ---------------------------------------------------------------------------

function getWikiJobDefinitions() {
	return [
		{
			name: "wiki-nightly-ingest",
			schedule: "0 2 * * *",
			prompt: "Run the wiki ingest process: scan wiki/raw/ for files with status queued or updated, generate canonical wiki pages from each, update index.md, and set raw file status to ingested.",
			skills: ["research/llm-wiki"],
			repeat: true,
		},
		{
			name: "wiki-digest-regen",
			schedule: "0 6 * * *",
			prompt: "Regenerate the wiki memory digest: read all canonical wiki pages, produce a condensed summary, and write to Hermes core memory. Do not modify user memory.",
			skills: ["research/llm-wiki"],
			repeat: true,
		},
	];
}

async function ensureWikiJobs(jobsProvider) {
	if (!jobsProvider || typeof jobsProvider.listHermesJobs !== "function") {
		return { created: 0, existing: 0 };
	}

	const existingJobs = await jobsProvider.listHermesJobs();
	const existingNames = new Set(existingJobs.map((job) => job.name));
	const definitions = getWikiJobDefinitions();

	let created = 0;
	let existing = 0;

	for (const def of definitions) {
		if (existingNames.has(def.name)) {
			existing += 1;
			continue;
		}
		await jobsProvider.createHermesJob(def);
		created += 1;
	}

	return { created, existing };
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

module.exports = {
	WIKI_DIR,
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
};
