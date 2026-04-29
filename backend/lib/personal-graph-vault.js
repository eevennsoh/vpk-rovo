"use strict";

const fs = require("node:fs");
const path = require("node:path");

const VAULT_ENV_KEY = "PERSONAL_GRAPH_VAULT";
const ENV_LOCAL_PATH = path.join(__dirname, "..", "..", ".env.local");
const RAW_SOURCE_EXTENSIONS = new Set([".html", ".htm", ".md", ".markdown", ".txt"]);

let dotenvLoaded = false;

function getNonEmptyString(value) {
	if (typeof value !== "string") {
		return null;
	}

	const trimmed = value.trim();
	return trimmed.length > 0 ? trimmed : null;
}

function loadEnvLocalIfNeeded() {
	if (dotenvLoaded || getNonEmptyString(process.env[VAULT_ENV_KEY])) {
		return;
	}

	dotenvLoaded = true;
	try {
		require("dotenv").config({ path: ENV_LOCAL_PATH, quiet: true });
	} catch {
		// The standalone smoke command should work when dotenv is installed,
		// but backend callers may also provide the env var directly.
	}
}

function createVaultNotFoundError(reason, cause) {
	const error = new Error(reason);
	error.code = "VAULT_NOT_FOUND";
	if (cause) {
		error.cause = cause;
	}
	return error;
}

function getVaultRoot() {
	loadEnvLocalIfNeeded();

	const configuredRoot = getNonEmptyString(process.env[VAULT_ENV_KEY]);
	if (!configuredRoot) {
		throw createVaultNotFoundError(`${VAULT_ENV_KEY} is not set`);
	}

	const vaultRoot = path.resolve(configuredRoot);
	let stats;
	try {
		stats = fs.statSync(vaultRoot);
	} catch (error) {
		throw createVaultNotFoundError(`Vault path does not exist: ${vaultRoot}`, error);
	}

	if (!stats.isDirectory()) {
		throw createVaultNotFoundError(`Vault path is not a directory: ${vaultRoot}`);
	}

	return vaultRoot;
}

function toPosixPath(value) {
	return value.split(path.sep).join("/");
}

function isPathInside(rootPath, candidatePath) {
	const relativePath = path.relative(rootPath, candidatePath);
	return relativePath === "" || (!relativePath.startsWith("..") && !path.isAbsolute(relativePath));
}

function resolveInside(rootPath, ...segments) {
	const candidatePath = path.resolve(rootPath, ...segments);
	if (!isPathInside(rootPath, candidatePath)) {
		const error = new Error(`Path escapes vault root: ${segments.join("/")}`);
		error.code = "VAULT_PATH_OUTSIDE_ROOT";
		throw error;
	}
	return candidatePath;
}

function listFiles(rootPath, relativeDir, shouldInclude, shouldDescend = () => true) {
	const basePath = resolveInside(rootPath, relativeDir);
	let entries;
	try {
		entries = fs.readdirSync(basePath, { withFileTypes: true });
	} catch (error) {
		if (error?.code === "ENOENT") {
			return [];
		}
		throw error;
	}

	const files = [];
	for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
		if (entry.name.startsWith(".")) {
			continue;
		}

		const fullPath = path.join(basePath, entry.name);
		const relativePath = toPosixPath(path.relative(rootPath, fullPath));
		if (entry.isDirectory()) {
			if (shouldDescend(fullPath, relativePath)) {
				files.push(...listFiles(rootPath, relativePath, shouldInclude, shouldDescend));
			}
			continue;
		}

		if (entry.isFile() && shouldInclude(fullPath, relativePath)) {
			files.push(fullPath);
		}
	}

	return files;
}

function removeMarkdownExtension(value) {
	return value.replace(/\.m(?:arkdown|d)$/iu, "");
}

function buildFileEntry(filePath, vaultRoot, baseDir) {
	const basePath = resolveInside(vaultRoot, baseDir);
	const stats = fs.statSync(filePath);
	const slug = removeMarkdownExtension(toPosixPath(path.relative(basePath, filePath)));

	return {
		name: path.basename(filePath),
		path: filePath,
		relativePath: toPosixPath(path.relative(vaultRoot, filePath)),
		size: stats.size,
		slug,
		updatedAt: stats.mtime.toISOString(),
	};
}

function listRaw() {
	const vaultRoot = getVaultRoot();
	return listFiles(
		vaultRoot,
		"raw",
		(filePath) => RAW_SOURCE_EXTENSIONS.has(path.extname(filePath).toLowerCase()),
		(_dirPath, relativePath) => relativePath !== "raw/assets" && !relativePath.startsWith("raw/assets/"),
	).map((filePath) => buildFileEntry(filePath, vaultRoot, "raw"));
}

function listWiki() {
	const vaultRoot = getVaultRoot();
	return listFiles(vaultRoot, "wiki", (filePath) => {
		const extension = path.extname(filePath).toLowerCase();
		return extension === ".md" || extension === ".markdown";
	}).map((filePath) => buildFileEntry(filePath, vaultRoot, "wiki"));
}

function parseQuotedValue(value) {
	const trimmed = value.trim();
	if (
		(trimmed.startsWith("\"") && trimmed.endsWith("\""))
		|| (trimmed.startsWith("'") && trimmed.endsWith("'"))
	) {
		return trimmed.slice(1, -1);
	}

	return trimmed;
}

function parseInlineList(value) {
	const inner = value.slice(1, -1).trim();
	if (!inner) {
		return [];
	}

	return inner
		.split(",")
		.map((item) => parseQuotedValue(item))
		.filter(Boolean);
}

function parseFrontmatter(text) {
	if (typeof text !== "string") {
		return { body: "", frontmatter: {} };
	}

	const normalizedText = text.replace(/\r\n?/gu, "\n");
	const match = normalizedText.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/u);
	if (!match) {
		return { body: normalizedText, frontmatter: {} };
	}

	const frontmatter = {};
	let listKey = null;
	for (const line of match[1].split("\n")) {
		const trimmedLine = line.trim();
		if (!trimmedLine || trimmedLine.startsWith("#")) {
			continue;
		}

		const listItemMatch = trimmedLine.match(/^-\s+(.+)$/u);
		if (listItemMatch && listKey) {
			frontmatter[listKey].push(parseQuotedValue(listItemMatch[1]));
			continue;
		}

		listKey = null;
		const colonIndex = line.indexOf(":");
		if (colonIndex < 0) {
			continue;
		}

		const key = line.slice(0, colonIndex).trim();
		const rawValue = line.slice(colonIndex + 1).trim();
		if (!key) {
			continue;
		}

		if (!rawValue) {
			frontmatter[key] = [];
			listKey = key;
			continue;
		}

		if (rawValue.startsWith("[") && rawValue.endsWith("]")) {
			frontmatter[key] = parseInlineList(rawValue);
			continue;
		}

		frontmatter[key] = parseQuotedValue(rawValue);
	}

	return {
		body: match[2],
		frontmatter,
	};
}

function normalizeWikiSlug(slug) {
	const rawSlug = getNonEmptyString(slug);
	if (!rawSlug) {
		const error = new Error("A wiki page slug is required");
		error.code = "INVALID_PAGE_SLUG";
		throw error;
	}

	let normalizedSlug;
	try {
		normalizedSlug = decodeURIComponent(rawSlug);
	} catch {
		normalizedSlug = rawSlug;
	}

	normalizedSlug = normalizedSlug
		.replace(/\\/gu, "/")
		.replace(/^\/+/u, "")
		.replace(/^wiki\//u, "");

	if (!/\.m(?:arkdown|d)$/iu.test(normalizedSlug)) {
		normalizedSlug = `${normalizedSlug}.md`;
	}

	return normalizedSlug;
}

function readPage(slug) {
	const vaultRoot = getVaultRoot();
	const wikiRoot = resolveInside(vaultRoot, "wiki");
	const normalizedSlug = normalizeWikiSlug(slug);
	const pagePath = resolveInside(wikiRoot, normalizedSlug);

	let content;
	try {
		content = fs.readFileSync(pagePath, "utf8");
	} catch (error) {
		if (error?.code === "ENOENT") {
			const pageError = new Error(`Wiki page not found: ${normalizedSlug}`);
			pageError.code = "PAGE_NOT_FOUND";
			pageError.cause = error;
			throw pageError;
		}
		throw error;
	}

	const stats = fs.statSync(pagePath);
	const parsed = parseFrontmatter(content);
	return {
		body: parsed.body,
		content,
		frontmatter: parsed.frontmatter,
		path: pagePath,
		relativePath: toPosixPath(path.relative(vaultRoot, pagePath)),
		slug: removeMarkdownExtension(toPosixPath(path.relative(wikiRoot, pagePath))),
		updatedAt: stats.mtime.toISOString(),
	};
}

module.exports = {
	getVaultRoot,
	listRaw,
	listWiki,
	parseFrontmatter,
	readPage,
};
