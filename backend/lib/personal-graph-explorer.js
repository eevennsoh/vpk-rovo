"use strict";

const {
	listRaw,
	listWiki,
	readPage,
} = require("./personal-graph-vault");

const WIKI_FOLDER_KINDS = new Map([
	["concept", "concept"],
	["concepts", "concept"],
	["entities", "entity"],
	["entity", "entity"],
	["source", "source"],
	["sources", "source"],
	["syntheses", "synthesis"],
	["synthesis", "synthesis"],
]);

function asStringArray(value) {
	if (Array.isArray(value)) {
		return value.filter((entry) => typeof entry === "string" && entry.trim()).map((entry) => entry.trim());
	}

	return typeof value === "string" && value.trim() ? [value.trim()] : [];
}

function removeContentExtension(value) {
	return value.replace(/\.(?:html?|m(?:arkdown|d)|txt)$/iu, "");
}

function normalizeLookupKey(value) {
	return removeContentExtension(String(value ?? ""))
		.replace(/\\/gu, "/")
		.replace(/^\/+/u, "")
		.replace(/^wiki\//iu, "")
		.replace(/^raw\//iu, "")
		.trim()
		.toLowerCase();
}

function getWikiKind(slug, frontmatter) {
	const frontmatterType = typeof frontmatter.type === "string" ? frontmatter.type.trim().toLowerCase() : "";
	if (WIKI_FOLDER_KINDS.has(frontmatterType)) {
		return WIKI_FOLDER_KINDS.get(frontmatterType);
	}

	const [folder] = slug.split("/");
	return WIKI_FOLDER_KINDS.get(folder?.toLowerCase()) ?? "synthesis";
}

function getTitle(page, fallbackName) {
	if (typeof page.frontmatter.title === "string" && page.frontmatter.title.trim()) {
		return page.frontmatter.title.trim();
	}

	const heading = page.body.match(/^#\s+(.+)$/mu);
	if (heading?.[1]) {
		return heading[1].trim();
	}

	return fallbackName.replace(/\.(?:m(?:arkdown|d))$/iu, "");
}

function extractWikiLinks(text) {
	const links = [];
	const pattern = /\[\[([^\]]+)\]\]/gu;
	let match;
	while ((match = pattern.exec(text)) !== null) {
		const target = match[1].split("|")[0].split("#")[0].trim();
		if (target) {
			links.push(target);
		}
	}
	return links;
}

function addEdge(edgeMap, source, target, kind, label) {
	if (!source || !target || source === target) {
		return;
	}

	const pair = [source, target].sort().join("<->");
	const key = `${kind}:${pair}`;
	if (edgeMap.has(key)) {
		return;
	}

	edgeMap.set(key, {
		id: key,
		kind,
		label,
		metadata: {},
		relationKinds: [kind],
		source,
		target,
	});
}

function buildExplorer() {
	const rawEntries = listRaw();
	const wikiEntries = listWiki();
	const nodes = new Map();
	const wikiBySlug = new Map();
	const wikiByBasename = new Map();
	const rawBySlug = new Map();
	const edgeMap = new Map();

	for (const entry of rawEntries) {
		const id = `raw:${entry.slug}`;
		const node = {
			bodyPreview: "",
			connectionCount: 0,
			dangling: false,
			externalUrl: null,
			frontmatter: {},
			id,
			kind: "raw",
			label: entry.name,
			missing: false,
			path: entry.path,
			provider: "vault",
			relativePath: entry.relativePath,
			size: entry.size,
			slug: entry.slug,
			title: entry.name,
			updatedAt: entry.updatedAt,
		};
		nodes.set(id, node);
		rawBySlug.set(normalizeLookupKey(entry.slug), node);
		rawBySlug.set(normalizeLookupKey(entry.relativePath), node);
	}

	for (const entry of wikiEntries) {
		const page = readPage(entry.slug);
		const id = `wiki:${page.slug}`;
		const node = {
			bodyPreview: page.body.trim().slice(0, 220),
			connectionCount: 0,
			dangling: false,
			externalUrl: null,
			frontmatter: page.frontmatter,
			id,
			kind: getWikiKind(page.slug, page.frontmatter),
			label: getTitle(page, entry.name),
			missing: false,
			path: page.path,
			provider: "vault",
			relativePath: page.relativePath,
			size: entry.size,
			slug: page.slug,
			title: getTitle(page, entry.name),
			updatedAt: page.updatedAt,
			wikiLinks: extractWikiLinks(page.body),
		};
		nodes.set(id, node);
		wikiBySlug.set(normalizeLookupKey(page.slug), node);

		const basenameKey = normalizeLookupKey(page.slug.split("/").at(-1));
		if (!wikiByBasename.has(basenameKey)) {
			wikiByBasename.set(basenameKey, []);
		}
		wikiByBasename.get(basenameKey).push(node);
	}

	for (const node of nodes.values()) {
		if (!node.id.startsWith("wiki:")) {
			continue;
		}

		const sources = [...asStringArray(node.frontmatter.sources), ...asStringArray(node.frontmatter.source)];
		for (const source of sources) {
			const target = rawBySlug.get(normalizeLookupKey(source));
			if (target) {
				addEdge(edgeMap, node.id, target.id, "frontmatter_source", "source");
			}
		}

		for (const link of node.wikiLinks ?? []) {
			const exactMatch = wikiBySlug.get(normalizeLookupKey(link));
			const basenameMatches = wikiByBasename.get(normalizeLookupKey(link));
			const target = exactMatch ?? (basenameMatches?.length === 1 ? basenameMatches[0] : null);
			if (target) {
				addEdge(edgeMap, node.id, target.id, "wiki_link", "wikilink");
				continue;
			}

			const missingSlug = removeContentExtension(link.replace(/\\/gu, "/").replace(/^wiki\//iu, ""));
			const missingId = `wiki:${missingSlug}`;
			if (!nodes.has(missingId)) {
				nodes.set(missingId, {
					bodyPreview: "",
					connectionCount: 0,
					dangling: true,
					externalUrl: null,
					frontmatter: {},
					id: missingId,
					kind: getWikiKind(missingSlug, {}),
					label: missingSlug.split("/").at(-1) ?? missingSlug,
					missing: true,
					path: null,
					provider: "vault",
					relativePath: `wiki/${missingSlug}.md`,
					size: 0,
					slug: missingSlug,
					title: missingSlug.split("/").at(-1) ?? missingSlug,
					updatedAt: null,
					wikiLinks: [],
				});
			}
			addEdge(edgeMap, node.id, missingId, "wiki_link", "missing wikilink");
		}
	}

	const edges = [...edgeMap.values()];
	for (const edge of edges) {
		nodes.get(edge.source).connectionCount += 1;
		nodes.get(edge.target).connectionCount += 1;
	}

	const resolvedNodes = [...nodes.values()].map((node) => ({
		...node,
		dangling: Boolean(node.dangling || node.connectionCount === 0),
	}));

	return {
		edges: edges.sort((left, right) => left.id.localeCompare(right.id)),
		generatedAt: new Date().toISOString(),
		nodes: resolvedNodes.sort((left, right) => left.id.localeCompare(right.id)),
		stats: {
			danglingCount: resolvedNodes.filter((node) => node.dangling).length,
			edgeCount: edges.length,
			nodeCount: resolvedNodes.length,
			rawCount: rawEntries.length,
			wikiCount: wikiEntries.length,
		},
	};
}

module.exports = {
	buildExplorer,
};
