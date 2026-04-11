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
// Exports
// ---------------------------------------------------------------------------

module.exports = {
	WIKI_DIR,
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
};
