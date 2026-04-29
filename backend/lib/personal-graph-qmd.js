"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { execFile } = require("node:child_process");

const { getVaultRoot, listWiki, parseFrontmatter } = require("./personal-graph-vault");

function getCollectionName() {
	return process.env.PERSONAL_GRAPH_QMD_COLLECTION || "personal-graph";
}

function readWikiEntry(entry) {
	const text = fs.readFileSync(entry.path, "utf8");
	const parsed = parseFrontmatter(text);
	const title = typeof parsed.frontmatter.title === "string" && parsed.frontmatter.title.trim()
		? parsed.frontmatter.title.trim()
		: path.basename(entry.relativePath, path.extname(entry.relativePath));
	return { ...entry, parsed, text, title };
}

function toSearchResult(entry, score, query) {
	const normalized = entry.parsed.body.replace(/\s+/gu, " ").trim();
	const index = normalized.toLowerCase().indexOf(query.toLowerCase());
	const excerpt = index >= 0
		? normalized.slice(Math.max(0, index - 80), index + 200)
		: normalized.slice(0, 240);
	return {
		excerpt,
		path: entry.relativePath,
		score,
		slug: entry.slug,
		title: entry.title,
	};
}

async function grepSearch(query, { limit = 10 } = {}) {
	if (typeof query !== "string" || !query.trim()) {
		return [];
	}
	const terms = query.toLowerCase().split(/\s+/u).filter(Boolean);
	return listWiki()
		.map(readWikiEntry)
		.map((entry) => {
			const haystack = `${entry.title}\n${entry.text}`.toLowerCase();
			const score = terms.reduce((sum, term) => sum + (haystack.includes(term) ? 1 : 0), 0);
			return { entry, score };
		})
		.filter((result) => result.score > 0)
		.sort((left, right) => right.score - left.score || left.entry.title.localeCompare(right.entry.title))
		.slice(0, limit)
		.map((result) => toSearchResult(result.entry, result.score, query));
}

function parseQmdResults(stdout, { limit = 10 } = {}) {
	const parsed = JSON.parse(stdout);
	const rows = Array.isArray(parsed) ? parsed : Array.isArray(parsed.results) ? parsed.results : [];
	return rows.slice(0, limit).map((row) => {
		const rawPath = row.path ?? row.filepath ?? row.file ?? "";
		const relativePath = String(rawPath).includes("/wiki/")
			? String(rawPath).split("/wiki/").at(-1)
			: String(rawPath).replace(/^wiki\//u, "");
		return {
			excerpt: row.excerpt ?? row.snippet ?? row.bestChunk ?? "",
			path: `wiki/${relativePath}`,
			score: typeof row.score === "number" ? row.score : 0,
			slug: relativePath.replace(/\.m(?:arkdown|d)$/iu, ""),
			title: row.title ?? path.basename(relativePath, path.extname(relativePath)),
		};
	});
}

function runQmdCli(args, { execFileImpl = execFile } = {}) {
	return new Promise((resolve, reject) => {
		execFileImpl("qmd", args, { encoding: "utf8", maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
			if (error) {
				error.stderr = stderr;
				reject(error);
				return;
			}
			resolve(stdout);
		});
	});
}

async function search(query, { execFileImpl, fetchImpl = fetch, limit = 10 } = {}) {
	const mcpUrl = process.env.PERSONAL_GRAPH_QMD_MCP_URL;
	if (mcpUrl) {
		const url = new URL("/search", mcpUrl);
		url.searchParams.set("q", query);
		url.searchParams.set("limit", String(limit));
		const response = await fetchImpl(url);
		if (!response.ok) {
			throw new Error(`qmd MCP search failed: ${response.status}`);
		}
		const data = await response.json();
		return Array.isArray(data?.results) ? data.results : data;
	}

	try {
		const stdout = await runQmdCli([
			"search",
			query,
			"--collection",
			getCollectionName(),
			"--limit",
			String(limit),
			"--json",
		], { execFileImpl });
		return parseQmdResults(stdout, { limit });
	} catch {
		return grepSearch(query, { limit });
	}
}

async function relatedPages(text, opts = {}) {
	return search(text, opts);
}

async function ensureCollection({ execFileImpl } = {}) {
	const vaultRoot = getVaultRoot();
	const wikiRoot = path.join(vaultRoot, "wiki");
	try {
		await runQmdCli(["collection", "add", wikiRoot, "--name", getCollectionName()], { execFileImpl });
		await runQmdCli(["embed", "--collection", getCollectionName()], { execFileImpl });
		return { backend: "qmd", collection: getCollectionName(), status: "ready" };
	} catch (error) {
		if (error?.code === "ENOENT") {
			return { backend: "grep", collection: getCollectionName(), status: "fallback" };
		}
		throw error;
	}
}

module.exports = {
	ensureCollection,
	grepSearch,
	relatedPages,
	search,
};
