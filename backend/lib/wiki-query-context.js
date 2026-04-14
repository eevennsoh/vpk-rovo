"use strict";

const fs = require("node:fs/promises");
const path = require("node:path");

const {
	DEFAULT_WIKI_DIR,
	resolveLlmWikiPaths,
	resolveQmdCollectionNameForFilePath,
	searchWikiWithQmd,
} = require("./qmd");
const { queryWiki } = require("./wiki-clipper");

const DEFAULT_RESULT_LIMIT = 3;
const DEFAULT_RESULT_CHAR_LIMIT = 1200;
const ALLOWED_QUERY_COLLECTIONS = new Set([
	"wiki-sources",
	"wiki-entities",
	"wiki-concepts",
	"wiki-comparisons",
	"wiki-queries",
	"wiki-synthesis",
]);

function getNonEmptyString(value) {
	return typeof value === "string" && value.trim().length > 0
		? value.trim()
		: null;
}

function truncateText(value, maxChars) {
	if (typeof value !== "string") {
		return "";
	}

	const normalizedValue = value.trim();
	if (normalizedValue.length <= maxChars) {
		return normalizedValue;
	}

	return `${normalizedValue.slice(0, maxChars - 1).trimEnd()}…`;
}

function parseFrontmatter(content) {
	if (typeof content !== "string") {
		return { body: "", frontmatter: {} };
	}

	const match = content.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/u);
	if (!match) {
		return { body: content, frontmatter: {} };
	}

	const frontmatter = {};
	for (const line of match[1].split("\n")) {
		const colonIndex = line.indexOf(":");
		if (colonIndex < 0) {
			continue;
		}

		const key = line.slice(0, colonIndex).trim();
		const rawValue = line.slice(colonIndex + 1).trim();
		if (!key) {
			continue;
		}

		frontmatter[key] = rawValue.replace(/^['"]|['"]$/gu, "");
	}

	return {
		body: match[2],
		frontmatter,
	};
}

function resolveCanonicalFilePath(filePath, { wikiDir = DEFAULT_WIKI_DIR } = {}) {
	const normalizedPath = getNonEmptyString(filePath);
	if (!normalizedPath) {
		return null;
	}

	if (normalizedPath.startsWith("qmd://")) {
		const withoutScheme = normalizedPath.slice("qmd://".length).replace(/^\/+/u, "");
		const [collectionName, ...segments] = withoutScheme.split("/");
		if (!collectionName || segments.length === 0) {
			return null;
		}

		const llmWikiPaths = resolveLlmWikiPaths({ wikiDir });
		const mapping = {
			"wiki-profiles": "profiles",
			"wiki-work": "work",
			"wiki-sources": "sources",
			"wiki-entities": "entities",
			"wiki-concepts": "concepts",
			"wiki-comparisons": "comparisons",
			"wiki-queries": "queries",
			"wiki-synthesis": "synthesis",
		};
		const dirName = mapping[collectionName];
		return dirName ? path.join(llmWikiPaths.wikiDir, dirName, ...segments) : null;
	}

	if (path.isAbsolute(normalizedPath)) {
		return normalizedPath;
	}

	const llmWikiPaths = resolveLlmWikiPaths({ wikiDir });
	return path.join(llmWikiPaths.rootDir, normalizedPath);
}

async function buildWikiQueryContextDescription(
	query,
	{
		resultLimit = DEFAULT_RESULT_LIMIT,
		resultCharLimit = DEFAULT_RESULT_CHAR_LIMIT,
		searchWikiWithQmdImpl = searchWikiWithQmd,
		queryWikiImpl = queryWiki,
		wikiDir = DEFAULT_WIKI_DIR,
	} = {},
) {
	const normalizedQuery = getNonEmptyString(query);
	if (!normalizedQuery) {
		return null;
	}

	let results = [];
	let backend = "naive";
	try {
		results = await searchWikiWithQmdImpl(normalizedQuery, {
			limit: resultLimit,
			wikiDir,
		});
		backend = "qmd";
	} catch {
		const fallback = await queryWikiImpl(normalizedQuery, {
			limit: resultLimit,
			wikiDir,
		});
		results = Array.isArray(fallback?.results) ? fallback.results : [];
		backend = "naive";
	}

	const normalizedResults = Array.isArray(results) ? results.slice(0, resultLimit) : [];
	const resultBlocks = [];

	for (const result of normalizedResults) {
		const collection =
			getNonEmptyString(result?.collection)
			|| resolveQmdCollectionNameForFilePath(result?.path, { wikiDir })
			|| null;
		if (!collection || !ALLOWED_QUERY_COLLECTIONS.has(collection)) {
			continue;
		}

		const filePath = resolveCanonicalFilePath(result?.path, { wikiDir });
		if (!filePath) {
			continue;
		}

		let content = "";
		try {
			content = await fs.readFile(filePath, "utf8");
		} catch {
			continue;
		}

		const parsed = parseFrontmatter(content);
		const body = truncateText(parsed.body, resultCharLimit);
		if (!body) {
			continue;
		}

		const title =
			getNonEmptyString(result?.title)
			|| getNonEmptyString(parsed.frontmatter.title)
			|| path.basename(filePath, ".md");

		resultBlocks.push([
			`### ${title}`,
			`Collection: ${collection}`,
			`Path: ${path.relative(resolveLlmWikiPaths({ wikiDir }).rootDir, filePath).split(path.sep).join("/")}`,
			"",
			body,
		].join("\n"));
	}

	if (resultBlocks.length === 0) {
		return null;
	}

	return [
		"[Wiki Query Context]",
		`Query: ${normalizedQuery}`,
		`Backend: ${backend}`,
		"Use these canonical wiki pages when they are relevant to the current answer. Do not cite them if they are irrelevant.",
		"",
		resultBlocks.join("\n\n"),
		"[End Wiki Query Context]",
	].join("\n");
}

module.exports = {
	buildWikiQueryContextDescription,
	resolveCanonicalFilePath,
};
