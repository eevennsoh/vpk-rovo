"use strict";

const crypto = require("node:crypto");
const fs = require("node:fs/promises");
const path = require("node:path");

const { DEFAULT_WIKI_DIR, resolveLlmWikiPaths } = require("./qmd");
const WIKI_DIR = DEFAULT_WIKI_DIR;
const MAX_SLUG_LENGTH = 80;
const KNOWLEDGE_STATUS_KEY = "knowledge_status";
const RAW_TEXT_CONTENT_TYPE_MAP = Object.freeze({
	articles: "article",
	bookmarks: "bookmark",
	captures: "article",
	papers: "paper",
	raw: "article",
	transcripts: "transcript",
});

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

function resolveRawTextContentType(category) {
	if (typeof category !== "string" || category.trim().length === 0) {
		return RAW_TEXT_CONTENT_TYPE_MAP.raw;
	}

	const normalizedCategory = category.trim().toLowerCase();
	return RAW_TEXT_CONTENT_TYPE_MAP[normalizedCategory] ?? RAW_TEXT_CONTENT_TYPE_MAP.raw;
}

function readPipelineStatus(frontmatter, fieldName) {
	if (
		typeof frontmatter?.[fieldName] === "string"
		&& frontmatter[fieldName].trim().length > 0
	) {
		return frontmatter[fieldName].trim();
	}

	if (typeof frontmatter?.status === "string" && frontmatter.status.trim().length > 0) {
		return frontmatter.status.trim();
	}

	return null;
}

function buildOutputPath(wikiDir, category, slug) {
	const { rawDir } = resolveLlmWikiPaths({ wikiDir });
	const now = new Date();
	const yyyy = String(now.getFullYear());
	const mm = String(now.getMonth() + 1).padStart(2, "0");
	return path.join(
		rawDir,
		yyyy,
		mm,
		`${slug}.md`,
	);
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
	const paths = resolveLlmWikiPaths({ wikiDir });
	const logPath = path.join(paths.wikiDir, "log.md");
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
	category = "raw",
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
	const { rawDir } = resolveLlmWikiPaths({ wikiDir });
	const dedupeIndex = await buildDedupeIndex(rawDir);

	const dedupeKey = canonicalUrl || url;
	const existingPath = dedupeIndex.get(dedupeKey);

	if (existingPath && !forceRefresh) {
		const existingContent = await fs.readFile(existingPath, "utf8");
		const { frontmatter } = parseFrontmatter(existingContent);
		return {
			captureStatus: "existing",
			filePath: existingPath,
			metadata: frontmatter,
			isUpdate: false,
		};
	}

	// 7. Build metadata
	const metadata = {
		title,
		source_url: url,
		canonical_url: canonicalUrl,
		captured_at: new Date().toISOString(),
		capture_method: "defuddle",
		content_type: resolveRawTextContentType(category),
		author: extracted.author || undefined,
		published: extracted.published || undefined,
		description: extracted.description || undefined,
		word_count: wordCount,
		tags: tags.length > 0 ? tags : undefined,
		[KNOWLEDGE_STATUS_KEY]: forceRefresh && existingPath ? "updated" : "queued",
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

	return {
		captureStatus: forceRefresh && existingPath ? "updated" : "created",
		filePath,
		metadata,
		isUpdate: Boolean(forceRefresh && existingPath),
	};
}

// ---------------------------------------------------------------------------
// queryWiki
// ---------------------------------------------------------------------------

const WIKI_CONTENT_DIRS = [
	"profiles",
	"work",
	"sources",
	"entities",
	"concepts",
	"comparisons",
	"queries",
	"synthesis",
];
async function queryWiki(query, { limit, wikiDir = WIKI_DIR } = {}) {
	if (!query || typeof query !== "string" || !query.trim()) {
		return { results: [] };
	}

	const normalizedQuery = query.toLowerCase().trim();
	const terms = normalizedQuery.split(/\s+/u);
	const results = [];

	for (const dir of WIKI_CONTENT_DIRS) {
		const { wikiDir: canonicalWikiDir } = resolveLlmWikiPaths({ wikiDir });
		const dirPath = path.join(canonicalWikiDir, dir);
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
	const resolvedLimit = Number.isInteger(limit) && limit > 0 ? limit : results.length;
	return { results: results.slice(0, resolvedLimit) };
}

// ---------------------------------------------------------------------------
// lintWiki
// ---------------------------------------------------------------------------

async function lintWiki({ wikiDir = WIKI_DIR } = {}) {
	const issues = [];

	// 1. Read index.md
	let indexContent = "";
	try {
		const { wikiDir: canonicalWikiDir } = resolveLlmWikiPaths({ wikiDir });
		indexContent = await fs.readFile(path.join(canonicalWikiDir, "index.md"), "utf8");
	} catch {
		issues.push({ type: "missing-file", path: "index.md", message: "index.md not found" });
	}

	// 2. Collect all canonical pages
	const { wikiDir: canonicalWikiDir, rawDir } = resolveLlmWikiPaths({ wikiDir });
	const allPages = [];
	for (const dir of WIKI_CONTENT_DIRS) {
		const dirPath = path.join(canonicalWikiDir, dir);
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
	source: "sources",
	entity: "entities",
	concept: "concepts",
	comparison: "comparisons",
	query: "queries",
	synthesis: "synthesis",
};

function getDateOnly(value) {
	if (typeof value !== "string" || value.trim().length === 0) {
		return null;
	}

	const match = value.trim().match(/^(\d{4}-\d{2}-\d{2})/u);
	return match?.[1] ?? null;
}

function toRelativeRawPath(filePath, wikiDir) {
	const { rootDir, rawDir } = resolveLlmWikiPaths({ wikiDir });
	const relativeToRoot = path.relative(rootDir, filePath).split(path.sep).join("/");
	if (relativeToRoot && !relativeToRoot.startsWith("..")) {
		return relativeToRoot;
	}

	const relativeToRaw = path.relative(rawDir, filePath).split(path.sep).join("/");
	return relativeToRaw && !relativeToRaw.startsWith("..")
		? `raw/${relativeToRaw}`
		: filePath;
}

function buildSourcePageFromRaw(filePath, rawFrontmatter, rawBody, { wikiDir = WIKI_DIR } = {}) {
	const rawTitle =
		typeof rawFrontmatter?.title === "string" && rawFrontmatter.title.trim()
			? rawFrontmatter.title.trim()
			: path.basename(filePath, ".md");
	const sourceSlug = `${generateSlug(rawTitle)}-source`;
	const relativeRawPath = toRelativeRawPath(filePath, wikiDir);
	const created = getDateOnly(rawFrontmatter?.captured_at) ?? getDateOnly(rawFrontmatter?.created_at) ?? new Date().toISOString().slice(0, 10);
	const tags = Array.isArray(rawFrontmatter?.tags)
		? Array.from(new Set(["source", ...rawFrontmatter.tags.map((tag) => String(tag).trim()).filter(Boolean)]))
		: ["source"];
	const metadataLines = [
		typeof rawFrontmatter?.source_url === "string" && rawFrontmatter.source_url.trim()
			? `- Source URL: ${rawFrontmatter.source_url.trim()}`
			: null,
		typeof rawFrontmatter?.canonical_url === "string" && rawFrontmatter.canonical_url.trim()
			? `- Canonical URL: ${rawFrontmatter.canonical_url.trim()}`
			: null,
		typeof rawFrontmatter?.captured_at === "string" && rawFrontmatter.captured_at.trim()
			? `- Captured: ${rawFrontmatter.captured_at.trim()}`
			: null,
		typeof rawFrontmatter?.content_type === "string" && rawFrontmatter.content_type.trim()
			? `- Content type: ${rawFrontmatter.content_type.trim()}`
			: null,
	].filter(Boolean);

	return {
		slug: sourceSlug,
		type: "source",
		frontmatter: {
			title: rawTitle,
			created,
			updated: new Date().toISOString().slice(0, 10),
			type: "source",
			tags,
			sources: [relativeRawPath],
		},
		body: [
			`# ${rawTitle}`,
			"",
			"## Source Metadata",
			"",
			...(metadataLines.length > 0 ? metadataLines : ["- No source metadata captured."]),
			"",
			"## Extract",
			"",
			rawBody.trim() || "_No extracted body available._",
			"",
		].join("\n"),
		indexEntry: `- [[${sourceSlug}]] — Canonical source summary for ${rawTitle}`,
	};
}

function buildDerivationPrompt(sourcePage, schemaContent, indexContent) {
	return [
		"You are a wiki editor. Given the canonical source page below, derive any additional canonical wiki pages that should exist.",
		"",
		"## Wiki Schema",
		schemaContent,
		"",
		"## Current Index",
		indexContent,
		"",
		"## Canonical Source Page Frontmatter",
		JSON.stringify(sourcePage.frontmatter, null, 2),
		"",
		"## Canonical Source Page Body",
		sourcePage.body,
		"",
		"## Instructions",
		"Generate a JSON object with these fields:",
		'- pages: array of zero or more canonical pages to create/update',
		'- each page must include slug, type, frontmatter, body, and indexEntry',
		'- type must be one of "entity", "concept", "comparison", "query", "synthesis"',
		"- frontmatter must include title, created, updated, type, tags, and sources",
		"- body should use markdown and include [[wikilinks]] where appropriate",
		'- indexEntry should be one line for index.md (e.g., "- [[slug]] — description")',
		"",
		"If no additional canonical pages should be derived from this source, return `{ \"pages\": [] }`.",
		"Do not recreate the source page itself in the pages array.",
		"Return ONLY the JSON object, no other text.",
	].join("\n");
}

function writeCanonicalPage(pageData, canonicalWikiDir) {
	const targetDir = TYPE_TO_DIR[pageData.type] || "entities";
	const canonicalPath = path.join(canonicalWikiDir, targetDir, `${pageData.slug}.md`);
	const canonicalContent = `${serializeFrontmatter(pageData.frontmatter)}\n${pageData.body}\n`;
	return fs.writeFile(canonicalPath, canonicalContent, "utf8").then(() => canonicalPath);
}

async function saveSynthesisPage({
	content,
	sources = [],
	tags = [],
	title,
	wikiDir = WIKI_DIR,
} = {}) {
	const resolvedTitle =
		typeof title === "string" && title.trim().length > 0
			? title.trim()
			: null;
	const resolvedContent =
		typeof content === "string" && content.trim().length > 0
			? content.trim()
			: null;
	if (!resolvedTitle || !resolvedContent) {
		const error = new Error("A synthesis title and content are required.");
		error.code = "INVALID_INPUT";
		throw error;
	}

	const { wikiDir: canonicalWikiDir } = resolveLlmWikiPaths({ wikiDir });
	await fs.mkdir(path.join(canonicalWikiDir, "synthesis"), { recursive: true });
	const slug = generateSlug(resolvedTitle);
	const synthesisPath = path.join(canonicalWikiDir, "synthesis", `${slug}.md`);
	const now = new Date().toISOString().slice(0, 10);
	const normalizedSources = Array.isArray(sources)
		? sources.map((value) => String(value).trim()).filter(Boolean)
		: [];
	const normalizedTags = Array.isArray(tags)
		? Array.from(new Set(["synthesis", ...tags.map((value) => String(value).trim()).filter(Boolean)]))
		: ["synthesis"];

	const pageData = {
		slug,
		type: "synthesis",
		frontmatter: {
			title: resolvedTitle,
			created: now,
			updated: now,
			type: "synthesis",
			tags: normalizedTags,
			sources: normalizedSources,
		},
		body: resolvedContent,
		indexEntry: `- [[${slug}]] — ${resolvedTitle}`,
	};

	await writeCanonicalPage(pageData, canonicalWikiDir);
	let indexContent = "";
	const indexPath = path.join(canonicalWikiDir, "index.md");
	try {
		indexContent = await fs.readFile(indexPath, "utf8");
	} catch {
		indexContent = "# Wiki Index\n\n## Synthesis\n";
	}

	if (!indexContent.includes(`[[${slug}]]`)) {
		indexContent += `${pageData.indexEntry}\n`;
		await fs.writeFile(indexPath, indexContent, "utf8");
	}

	await appendToLog(wikiDir, "synthesis-save", resolvedTitle, [
		`Canonical: ${synthesisPath}`,
		...(normalizedSources.length > 0 ? [`Sources: ${normalizedSources.join(", ")}`] : []),
	]);

	return {
		path: synthesisPath,
		slug,
		title: resolvedTitle,
	};
}

function updateFrontmatterField(content, fieldName, nextValue) {
	const fieldPattern = new RegExp(`^(${fieldName}:\\s*).+$`, "mu");
	if (fieldPattern.test(content)) {
		return content.replace(fieldPattern, `$1${nextValue}`);
	}

	const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/u);
	if (!frontmatterMatch) {
		return content;
	}

	return content.replace(/^---\n([\s\S]*?)\n---/u, (_match, block) => {
		return `---\n${block}\n${fieldName}: ${nextValue}\n---`;
	});
}

async function ingestRawSources({
	executorImpl,
	qmdSyncImpl,
	wikiDir = WIKI_DIR,
} = {}) {
	// Default executor: use runRovoDevBackgroundTask with structured JSON parsing
	const executor = executorImpl || (async ({ prompt }) => {
		const { runRovoDevBackgroundTask, parseStructuredJsonResponse } = require("./rovo-task-executor");
		return runRovoDevBackgroundTask({
			prompt,
			selectedSkillIds: ["research/llm-wiki"],
			parseStructuredResult: parseStructuredJsonResponse,
			system: "You are a wiki editor. Return ONLY a JSON object. For derivation prompts return { pages: [...] }. No other text.",
		});
	});
	const { rawDir, wikiDir: canonicalWikiDir } = resolveLlmWikiPaths({ wikiDir });
	const rawFiles = await walkMarkdownFiles(rawDir);

	// Read schema and index for LLM context
	let schemaContent = "";
	let indexContent = "";
	try {
			schemaContent = await fs.readFile(path.join(canonicalWikiDir, "SCHEMA.md"), "utf8");
	} catch {
		// No schema — proceed without
	}
	try {
			indexContent = await fs.readFile(path.join(canonicalWikiDir, "index.md"), "utf8");
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

		const knowledgeStatus = readPipelineStatus(frontmatter, KNOWLEDGE_STATUS_KEY);

		// Only process raw sources queued for knowledge ingest.
		if (knowledgeStatus !== "queued" && knowledgeStatus !== "updated") {
			skipped += 1;
			continue;
		}

		try {
			const sourcePage = buildSourcePageFromRaw(filePath, frontmatter, body, { wikiDir });
			const writtenPaths = [];
			const updatedCollections = new Set();

			const sourceCanonicalPath = await writeCanonicalPage(sourcePage, canonicalWikiDir);
			writtenPaths.push({
				pageData: sourcePage,
				path: sourceCanonicalPath,
			});
			if (sourcePage.indexEntry && !indexContent.includes(`[[${sourcePage.slug}]]`)) {
				indexContent += `${sourcePage.indexEntry}\n`;
				await fs.writeFile(path.join(canonicalWikiDir, "index.md"), indexContent, "utf8");
			}
			updatedCollections.add("source");

			const prompt = buildDerivationPrompt(sourcePage, schemaContent, indexContent);
			const executorResult = await executor({ prompt });

			let derivationData = executorResult.structuredResult;
			if (!derivationData && executorResult.responseText) {
				const { parseStructuredJsonResponse } = require("./rovo-task-executor");
				derivationData = parseStructuredJsonResponse(executorResult.responseText);
			}

			let derivedPages = Array.isArray(derivationData?.pages)
				? derivationData.pages
				: derivationData && !Array.isArray(derivationData) && derivationData.slug && derivationData.type && derivationData.body
					? [derivationData]
					: [];
			derivedPages = derivedPages.filter((pageData) => {
				return pageData
					&& typeof pageData === "object"
					&& typeof pageData.slug === "string"
					&& typeof pageData.type === "string"
					&& pageData.type !== "source"
					&& typeof pageData.body === "string";
			});

			for (const pageData of derivedPages) {
				const canonicalPath = await writeCanonicalPage(pageData, canonicalWikiDir);
				writtenPaths.push({ pageData, path: canonicalPath });
				if (pageData.indexEntry && !indexContent.includes(`[[${pageData.slug}]]`)) {
					indexContent += `${pageData.indexEntry}\n`;
					await fs.writeFile(path.join(canonicalWikiDir, "index.md"), indexContent, "utf8");
				}
				updatedCollections.add(pageData.type);
			}

			const updatedContent = updateFrontmatterField(content, KNOWLEDGE_STATUS_KEY, "ingested");
			await fs.writeFile(filePath, updatedContent, "utf8");

			await appendToLog(wikiDir, "ingest", sourcePage.frontmatter?.title || sourcePage.slug, [
				`Source: ${filePath}`,
				...writtenPaths.map(({ pageData, path }) => `Canonical: ${path} (${pageData.type})`),
			]);
			const syncQmdIndex = qmdSyncImpl || (async ({ pageType }) => {
				const {
					resolveQmdCollectionNameForCanonicalType,
					syncWikiQmdIndex,
				} = require("./qmd");
				const collectionName = resolveQmdCollectionNameForCanonicalType(pageType);
				if (!collectionName) {
					return;
				}

				await syncWikiQmdIndex({
					collectionNames: [collectionName],
					wikiDir,
				});
			});

			try {
				for (const { pageData, path } of writtenPaths) {
					await syncQmdIndex({
						canonicalPath: path,
						pageData,
						pageType: pageData.type,
						wikiDir,
					});
				}
			} catch (error) {
				console.warn(
					"[wiki-clipper] Failed to refresh qmd index after ingest:",
					error instanceof Error ? error.message : error,
				);
			}

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

async function getWikiStatus({
	wikiDir = WIKI_DIR,
} = {}) {
	const { getWikiMemoryStatus } = require("./wiki-memory-provider");

	const paths = resolveLlmWikiPaths({ wikiDir });
	const [
		indexFile,
		logFile,
		schemaFile,
		canonicalEntries,
		rawTextCount,
		rawAssetCount,
		memoryStatus,
	] = await Promise.all([
		readFileSummary(path.join(paths.wikiDir, "index.md")),
		readFileSummary(path.join(paths.wikiDir, "log.md")),
		readFileSummary(path.join(paths.wikiDir, "SCHEMA.md")),
		Promise.all(
			WIKI_CONTENT_DIRS.map(async (section) => ([
				section,
				await countMarkdownFiles(path.join(paths.wikiDir, section)),
			])),
		),
		countMarkdownFiles(paths.rawDir),
		countMarkdownFiles(path.join(paths.rawDir, "assets")),
		getWikiMemoryStatus({ wikiDir: paths.wikiDir }),
	]);

	const canonicalCounts = buildCountRecord(canonicalEntries);
	const rawCounts = {
		raw: Math.max(0, rawTextCount - rawAssetCount),
		assets: rawAssetCount,
	};

	return {
		wikiDir: paths.rootDir,
		generatedAt: new Date().toISOString(),
		canonicalCounts,
		rawCounts: {
			raw: rawTextCount,
			assets: rawCounts.assets ?? 0,
		},
		totalCanonicalPages: sumCountRecord(canonicalCounts),
		totalRawCaptures: rawTextCount,
		hasWikiDigestEntry: Object.values(memoryStatus.compiledContexts ?? {}).some((context) => context?.exists === true),
		hasCompiledContextArtifacts: Object.values(memoryStatus.compiledContexts ?? {}).some((context) => context?.exists === true),
		files: {
			index: indexFile,
			log: logFile,
			schema: schemaFile,
		},
		compiledContexts: memoryStatus.compiledContexts,
		proposalCounts: memoryStatus.proposalCounts,
		recentProposals: memoryStatus.recentProposals,
	};
}

async function regenerateMemoryDigest({
	generateTextImpl,
	logger = console,
	wikiDir = WIKI_DIR,
} = {}) {
	const { regenerateWikiMemoryContext } = require("./wiki-memory-provider");
	const compiledContexts = await regenerateWikiMemoryContext({
		generateTextImpl,
		logger,
		wikiDir,
	});
	return {
		compiledContexts,
		entriesWritten: Object.values(compiledContexts).filter((context) => context?.exists === true).length,
	};
}

// ---------------------------------------------------------------------------
// Job definitions
// ---------------------------------------------------------------------------

function getWikiJobDefinitions() {
	return [
		{
			name: "wiki-nightly-ingest",
			schedule: "0 2 * * *",
			prompt: "Run the wiki ingest process: scan llm-wiki/raw/ for files with knowledge_status queued or updated, create/update canonical source pages first, derive any canonical entity/concept/comparison/query/synthesis pages, update wiki/index.md, mark knowledge_status as ingested when processed, and lint the wiki afterward.",
			skills: ["research/llm-wiki"],
			repeat: true,
		},
		{
			name: "wiki-memory-sync",
			schedule: "*/5 * * * *",
			prompt: "Process queued wiki-backed memory proposals discovered under llm-wiki/raw/, update canonical memory pages, refresh qmd collections, regenerate compiled context artifacts, and lint the canonical wiki plus memory pages afterward.",
			skills: ["research/llm-wiki"],
			repeat: true,
		},
		{
			name: "wiki-digest-regen",
			schedule: "0 6 * * *",
			prompt: "Regenerate the compiled wiki-backed memory context artifacts from canonical wiki pages and lint the canonical wiki afterward.",
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
	saveSynthesisPage,
	serializeFrontmatter,
	validateUrl,
};
