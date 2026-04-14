"use strict";

const fs = require("node:fs/promises");
const path = require("node:path");

const { DEFAULT_WIKI_DIR, resolveLlmWikiPaths } = require("./qmd");
const {
	getCanonicalWikiMemoryDocuments,
	listWikiMemoryProposals,
	readCompiledContextDocuments,
} = require("./wiki-memory-provider");

const EXCLUDED_WIKI_FILENAMES = new Set(["SCHEMA.md", "index.md", "log.md"]);
const LINKED_KNOWLEDGE_DIRS = new Set([
	"comparisons",
	"concepts",
	"entities",
	"queries",
	"sources",
	"synthesis",
]);
const TOPIC_STOP_WORDS = new Set([
	"about",
	"after",
	"against",
	"also",
	"always",
	"another",
	"before",
	"being",
	"between",
	"brief",
	"canonical",
	"chat",
	"context",
	"current",
	"deck",
	"does",
	"durable",
	"from",
	"have",
	"here",
	"into",
	"just",
	"keep",
	"later",
	"memory",
	"notes",
	"only",
	"other",
	"page",
	"pages",
	"profile",
	"proposal",
	"queued",
	"recent",
	"responses",
	"self",
	"should",
	"source",
	"that",
	"their",
	"there",
	"these",
	"they",
	"this",
	"through",
	"user",
	"wiki",
	"with",
	"work",
]);
const EDGE_KIND_PRIORITY = Object.freeze({
	proposal_to_canonical: 0,
	canonical_to_compiled: 1,
	wiki_link: 2,
	same_thread: 3,
	shared_tag: 4,
	inferred_topic: 5,
	same_scope: 6,
});

function normalizeText(value) {
	return typeof value === "string"
		? value.replace(/\r\n?/gu, "\n").trim()
		: "";
}

function getNonEmptyString(value) {
	return typeof value === "string" && value.trim().length > 0
		? value.trim()
		: null;
}

function ensureArray(value) {
	return Array.isArray(value) ? value : [];
}

function slugify(value) {
	const normalized = normalizeText(value)
		.toLowerCase()
		.replace(/[`*_~[\]{}()<>]+/gu, " ")
		.replace(/[^a-z0-9]+/gu, "-")
		.replace(/^-+|-+$/gu, "");
	return normalized || "untitled";
}

function normalizeKey(value) {
	return slugify(value).replace(/-/gu, "");
}

function stripMarkdownCodeFence(content) {
	const normalizedContent = normalizeText(content);
	const fencedMatch = normalizedContent.match(/^```(?:markdown|md|yaml|yml)?\s*([\s\S]*?)```$/u);
	return fencedMatch?.[1] ? fencedMatch[1].trim() : normalizedContent;
}

function stripLeadingDuplicatedFrontmatterFence(content) {
	if (typeof content !== "string" || content.length === 0) {
		return "";
	}

	return content
		.replace(/\r\n?/gu, "\n")
		.trimStart()
		.replace(/^```(?:yaml|yml)?\s*---\n[\s\S]*?\n---\s*```\n*/u, "")
		.replace(/^yaml\s*\n---\n[\s\S]*?\n---\n*/u, "")
		.trimStart();
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
		let rawValue = line.slice(colonIndex + 1).trim();
		if (!key) {
			continue;
		}

		if (
			(rawValue.startsWith("\"") && rawValue.endsWith("\""))
			|| (rawValue.startsWith("'") && rawValue.endsWith("'"))
		) {
			rawValue = rawValue.slice(1, -1);
		}

		if (rawValue.startsWith("[") && rawValue.endsWith("]")) {
			const inner = rawValue.slice(1, -1).trim();
			frontmatter[key] = inner.length === 0
				? []
				: inner.split(",").map((item) => item.trim().replace(/^['"]|['"]$/gu, ""));
			continue;
		}

		frontmatter[key] = rawValue;
	}

	return {
		body: match[2],
		frontmatter,
	};
}

async function walkMarkdownFiles(dirPath) {
	let entries;
	try {
		entries = await fs.readdir(dirPath, { withFileTypes: true });
	} catch (error) {
		if (error?.code === "ENOENT") {
			return [];
		}

		throw error;
	}

	const files = [];
	for (const entry of entries) {
		const fullPath = path.join(dirPath, entry.name);
		if (entry.isDirectory()) {
			files.push(...(await walkMarkdownFiles(fullPath)));
			continue;
		}

		if (entry.isFile() && entry.name.endsWith(".md")) {
			files.push(fullPath);
		}
	}

	return files;
}

async function readMarkdownDocument(filePath) {
	try {
		const content = await fs.readFile(filePath, "utf8");
		const stats = await fs.stat(filePath);
		const parsed = parseFrontmatter(content);
		return {
			body: parsed.body,
			content,
			exists: true,
			frontmatter: parsed.frontmatter,
			path: filePath,
			updatedAt: stats.mtime.toISOString(),
		};
	} catch (error) {
		if (error?.code === "ENOENT") {
			return {
				body: "",
				content: "",
				exists: false,
				frontmatter: {},
				path: filePath,
				updatedAt: null,
			};
		}

		throw error;
	}
}

function toRelativePath(filePath, rootDir) {
	if (typeof filePath !== "string" || !filePath.trim()) {
		return "";
	}

	const relativePath = path.relative(rootDir, filePath);
	if (!relativePath || relativePath.startsWith("..")) {
		return filePath;
	}

	return relativePath.split(path.sep).join("/");
}

function extractTitleFromMarkdown(body, filePath) {
	const headingMatch = normalizeText(body).match(/^#\s+(.+)$/mu);
	if (headingMatch?.[1]) {
		return headingMatch[1].trim();
	}

	const basename = path.basename(filePath || "", ".md").replace(/[-_]+/gu, " ").trim();
	return basename || "Untitled";
}

function extractSummaryFromMarkdown(body) {
	const strippedBody = normalizeText(
		stripLeadingDuplicatedFrontmatterFence(stripMarkdownCodeFence(body)),
	);
	if (!strippedBody) {
		return "";
	}

	const lines = strippedBody
		.split("\n")
		.map((line) => line.trim())
		.filter(Boolean)
		.filter((line) => !/^#+\s/u.test(line))
		.filter((line) => !/^---$/u.test(line));
	const summary = lines[0] ?? "";
	return summary.length > 180 ? `${summary.slice(0, 177).trimEnd()}...` : summary;
}

function extractWikiLinks(content) {
	const links = new Set();
	for (const match of normalizeText(content).matchAll(/\[\[([^[\]]+)\]\]/gu)) {
		const rawValue = match[1]?.trim();
		if (!rawValue) {
			continue;
		}

		const linkTarget = rawValue.split("|")[0]?.split("#")[0]?.trim();
		if (linkTarget) {
			links.add(linkTarget);
		}
	}
	return Array.from(links);
}

function normalizeTags(value) {
	return Array.from(
		new Set(
			ensureArray(value)
				.map((item) => getNonEmptyString(item))
				.filter(Boolean)
				.map((item) => item.toLowerCase()),
		),
	);
}

function extractTopicTokens(...inputs) {
	const tokens = new Set();
	for (const input of inputs) {
		const normalizedInput = normalizeText(input).toLowerCase();
		if (!normalizedInput) {
			continue;
		}

		for (const token of normalizedInput.split(/[^a-z0-9]+/u)) {
			if (
				token.length < 4
				|| TOPIC_STOP_WORDS.has(token)
				|| /^\d+$/u.test(token)
			) {
				continue;
			}
			tokens.add(token);
		}
	}
	return Array.from(tokens).sort();
}

function createBaseNode(input) {
	return {
		bodyPreview: input.bodyPreview ?? "",
		charCount: input.charCount ?? 0,
		connectionCount: 0,
		createdAt: input.createdAt ?? null,
		id: input.id,
		kind: input.kind,
		label: input.label,
		metadata: input.metadata ?? {},
		path: input.path ?? "",
		relativePath: input.relativePath ?? "",
		scope: input.scope ?? null,
		sourceMessageId: input.sourceMessageId ?? null,
		sourceThreadId: input.sourceThreadId ?? null,
		status: input.status ?? null,
		summary: input.summary ?? "",
		tags: Array.isArray(input.tags) ? input.tags : [],
		target: input.target ?? null,
		title: input.title,
		topics: Array.isArray(input.topics) ? input.topics : [],
		updatedAt: input.updatedAt ?? null,
		wikiLinks: Array.isArray(input.wikiLinks) ? input.wikiLinks : [],
	};
}

function buildCanonicalNodes(memoryDocuments, rootDir) {
	return ["profile", "work"].map((scope) => {
		const document = memoryDocuments?.[scope];
		const title = document?.title ?? (scope === "profile" ? "Self" : "Work Context");
		const blocks = Array.isArray(document?.blocks) ? document.blocks : [];
		const summary = blocks[0]?.preview ?? "";
		const blockContent = blocks.map((block) => block.content).join("\n\n");
		return createBaseNode({
			bodyPreview: blocks.map((block) => block.preview).join("\n"),
			charCount: blocks.reduce((total, block) => total + (block.charCount ?? 0), 0),
			id: `canonical:${scope}`,
			kind: "canonical-memory",
			label: scope === "profile" ? "Profile memory" : "Work memory",
			metadata: {
				blockCount: blocks.length,
				canonicalPath: document?.canonicalPath ?? "",
				revision: document?.revision ?? "",
			},
			path: document?.canonicalPath ?? "",
			relativePath: toRelativePath(document?.canonicalPath ?? "", rootDir),
			scope,
			summary,
			tags: [scope, "memory", "canonical"],
			title,
			topics: extractTopicTokens(title, summary, blockContent),
			updatedAt: document?.updatedAt ?? null,
			wikiLinks: extractWikiLinks(blockContent),
		});
	});
}

function buildCompiledNodes(compiledContexts, rootDir) {
	return ["profile", "work"]
		.map((scope) => {
			const document = compiledContexts?.[scope];
			if (!document?.path) {
				return null;
			}

			return createBaseNode({
				bodyPreview: document.preview ?? "",
				charCount: document.charCount ?? 0,
				id: `compiled:${scope}`,
				kind: "compiled-context",
				label: scope === "profile" ? "Profile prompt context" : "Work prompt context",
				metadata: {
					exists: document.exists === true,
				},
				path: document.path,
				relativePath: toRelativePath(document.path, rootDir),
				scope,
				summary: document.preview ?? "",
				tags: [scope, "memory", "compiled"],
				title: scope === "profile" ? "Profile Context" : "Work Context",
				topics: extractTopicTokens(document.preview ?? "", scope),
				updatedAt: document.updatedAt ?? null,
			});
		})
		.filter(Boolean);
}

function buildProposalNodes(proposals, rootDir) {
	return proposals.map((proposal) => {
		const summary = getNonEmptyString(proposal.summary) ?? proposal.content.slice(0, 160);
		const bodyPreview = normalizeText(proposal.content);
		return createBaseNode({
			bodyPreview,
			charCount: bodyPreview.length,
			createdAt: proposal.createdAt ?? null,
			id: `proposal:${proposal.id}`,
			kind: "raw-proposal",
			label: proposal.status === "ingested" ? "Ingested proposal" : "Queued proposal",
			metadata: {
				action: proposal.action,
				id: proposal.id,
				ingestedAt: proposal.ingestedAt ?? null,
				origin: proposal.origin ?? null,
				reason: proposal.reason ?? null,
			},
			path: proposal.path ?? "",
			relativePath: toRelativePath(proposal.path ?? "", rootDir),
			scope: proposal.scope ?? null,
			sourceMessageId: proposal.sourceMessageId ?? null,
			sourceThreadId: proposal.sourceThreadId ?? null,
			status: proposal.status ?? null,
			summary,
			tags: normalizeTags([
				...(Array.isArray(proposal.tags) ? proposal.tags : []),
				proposal.scope,
				proposal.status,
				proposal.target,
				proposal.origin,
			]),
			target: proposal.target ?? null,
			title: summary,
			topics: extractTopicTokens(summary, bodyPreview, proposal.reason ?? ""),
			updatedAt: proposal.ingestedAt ?? proposal.createdAt ?? null,
		});
	});
}

async function buildLinkedKnowledgeNodes({ rootDir, wikiDir }) {
	const files = await walkMarkdownFiles(wikiDir);
	const nodes = [];

	for (const filePath of files) {
		const relativePath = toRelativePath(filePath, rootDir);
		const relativeWikiPath = toRelativePath(filePath, wikiDir);
		const topLevelDir = relativeWikiPath.split("/")[0];
		if (
			!LINKED_KNOWLEDGE_DIRS.has(topLevelDir)
			|| EXCLUDED_WIKI_FILENAMES.has(path.basename(filePath))
		) {
			continue;
		}

		const document = await readMarkdownDocument(filePath);
		if (!document.exists) {
			continue;
		}

		const sanitizedBody = stripLeadingDuplicatedFrontmatterFence(document.body);
		const title = getNonEmptyString(document.frontmatter.title) ?? extractTitleFromMarkdown(sanitizedBody, filePath);
		const summary = getNonEmptyString(document.frontmatter.summary) ?? extractSummaryFromMarkdown(sanitizedBody);
		const tags = normalizeTags(document.frontmatter.tags);
		const wikiLinks = extractWikiLinks(sanitizedBody);

		nodes.push(
			createBaseNode({
				bodyPreview: summary,
				charCount: normalizeText(sanitizedBody).length,
				createdAt: getNonEmptyString(document.frontmatter.created),
				id: `knowledge:${relativePath}`,
				kind: "linked-knowledge",
				label: topLevelDir.replace(/-/gu, " "),
				metadata: {
					category: topLevelDir,
				},
				path: filePath,
				relativePath,
				summary,
				tags,
				title,
				topics: extractTopicTokens(title, summary, tags.join(" ")),
				updatedAt: getNonEmptyString(document.frontmatter.updated) ?? document.updatedAt,
				wikiLinks,
			}),
		);
	}

	return nodes;
}

function buildNodeAliases(node) {
	const aliases = new Set();
	const title = getNonEmptyString(node.title);
	if (title) {
		aliases.add(normalizeKey(title));
	}

	if (node.relativePath) {
		const withoutExtension = node.relativePath.replace(/\.md$/u, "");
		aliases.add(normalizeKey(withoutExtension));
		aliases.add(normalizeKey(path.basename(withoutExtension)));
	}

	if (node.kind === "canonical-memory") {
		aliases.add(node.scope === "profile" ? "self" : "workcontext");
		aliases.add(node.scope === "profile" ? "profile" : "work");
	}

	return Array.from(aliases).filter(Boolean);
}

function createEdgeStore(nodes) {
	const edgeMap = new Map();
	const nodeConnectionCount = new Map(nodes.map((node) => [node.id, 0]));

	function addEdge(source, target, kind, metadata = {}) {
		if (!source || !target || source === target) {
			return;
		}

		const isSymmetric =
			kind === "shared_tag"
			|| kind === "same_thread"
			|| kind === "inferred_topic"
			|| kind === "same_scope";
		const [resolvedSource, resolvedTarget] = isSymmetric && source > target
			? [target, source]
			: [source, target];
		const key = `${resolvedSource}::${resolvedTarget}`;
		const existing = edgeMap.get(key);

		if (!existing) {
			edgeMap.set(key, {
				id: `edge:${key}`,
				kind,
				label: kind.replace(/_/gu, " "),
				metadata: {
					...metadata,
				},
				relationKinds: [kind],
				source: resolvedSource,
				target: resolvedTarget,
			});
			nodeConnectionCount.set(resolvedSource, (nodeConnectionCount.get(resolvedSource) ?? 0) + 1);
			nodeConnectionCount.set(resolvedTarget, (nodeConnectionCount.get(resolvedTarget) ?? 0) + 1);
			return;
		}

		if (!existing.relationKinds.includes(kind)) {
			existing.relationKinds.push(kind);
		}
		existing.metadata = {
			...existing.metadata,
			...metadata,
		};

		const currentPriority = EDGE_KIND_PRIORITY[existing.kind] ?? Number.MAX_SAFE_INTEGER;
		const nextPriority = EDGE_KIND_PRIORITY[kind] ?? Number.MAX_SAFE_INTEGER;
		if (nextPriority < currentPriority) {
			existing.kind = kind;
			existing.label = kind.replace(/_/gu, " ");
		}
	}

	return {
		addEdge,
		getEdges() {
			return Array.from(edgeMap.values());
		},
		getNodeConnectionCounts() {
			return nodeConnectionCount;
		},
	};
}

function buildExplorerGraph(nodes) {
	const edgeStore = createEdgeStore(nodes);
	const nodeById = new Map(nodes.map((node) => [node.id, node]));
	const aliasToNodeId = new Map();

	for (const node of nodes) {
		for (const alias of buildNodeAliases(node)) {
			if (!aliasToNodeId.has(alias)) {
				aliasToNodeId.set(alias, node.id);
			}
		}
	}

	for (const node of nodes) {
		if (node.kind === "raw-proposal" && node.scope) {
			edgeStore.addEdge(node.id, `canonical:${node.scope}`, "proposal_to_canonical", {
				scope: node.scope,
			});
		}

		if (node.kind === "compiled-context" && node.scope) {
			edgeStore.addEdge(`canonical:${node.scope}`, node.id, "canonical_to_compiled", {
				scope: node.scope,
			});
		}

		for (const rawLink of ensureArray(node.wikiLinks)) {
			const linkedNodeId = aliasToNodeId.get(normalizeKey(rawLink));
			if (linkedNodeId && linkedNodeId !== node.id) {
				edgeStore.addEdge(node.id, linkedNodeId, "wiki_link", {
					link: rawLink,
				});
			}
		}
	}

	const nodesByThread = new Map();
	const nodesByTag = new Map();
	const nodesByScope = new Map();
	const nodesByTopic = new Map();

	for (const node of nodes) {
		if (node.sourceThreadId) {
			if (!nodesByThread.has(node.sourceThreadId)) {
				nodesByThread.set(node.sourceThreadId, []);
			}
			nodesByThread.get(node.sourceThreadId).push(node.id);
		}

		for (const tag of ensureArray(node.tags)) {
			if (!nodesByTag.has(tag)) {
				nodesByTag.set(tag, []);
			}
			nodesByTag.get(tag).push(node.id);
		}

		if (node.scope) {
			if (!nodesByScope.has(node.scope)) {
				nodesByScope.set(node.scope, []);
			}
			nodesByScope.get(node.scope).push(node.id);
		}

		for (const topic of ensureArray(node.topics)) {
			if (!nodesByTopic.has(topic)) {
				nodesByTopic.set(topic, []);
			}
			nodesByTopic.get(topic).push(node.id);
		}
	}

	for (const [threadId, nodeIds] of nodesByThread.entries()) {
		for (let index = 0; index < nodeIds.length; index += 1) {
			for (let offset = index + 1; offset < nodeIds.length; offset += 1) {
				edgeStore.addEdge(nodeIds[index], nodeIds[offset], "same_thread", {
					threadId,
				});
			}
		}
	}

	for (const [tag, nodeIds] of nodesByTag.entries()) {
		if (nodeIds.length < 2) {
			continue;
		}

		for (let index = 0; index < nodeIds.length; index += 1) {
			for (let offset = index + 1; offset < nodeIds.length; offset += 1) {
				edgeStore.addEdge(nodeIds[index], nodeIds[offset], "shared_tag", {
					tag,
				});
			}
		}
	}

	for (const [scope, nodeIds] of nodesByScope.entries()) {
		const scopeNodes = nodeIds.map((nodeId) => nodeById.get(nodeId)).filter(Boolean);
		const canonicalNode = scopeNodes.find((node) => node.kind === "canonical-memory");
		if (!canonicalNode) {
			continue;
		}

		for (const node of scopeNodes) {
			if (
				node.id !== canonicalNode.id
				&& node.kind === "linked-knowledge"
			) {
				edgeStore.addEdge(canonicalNode.id, node.id, "same_scope", {
					scope,
				});
			}
		}
	}

	for (const [topic, nodeIds] of nodesByTopic.entries()) {
		if (nodeIds.length < 2) {
			continue;
		}

		for (let index = 0; index < nodeIds.length; index += 1) {
			for (let offset = index + 1; offset < nodeIds.length; offset += 1) {
				edgeStore.addEdge(nodeIds[index], nodeIds[offset], "inferred_topic", {
					topic,
				});
			}
		}
	}

	const edges = edgeStore.getEdges();
	const connectionCounts = edgeStore.getNodeConnectionCounts();
	const hydratedNodes = nodes.map((node) => ({
		...node,
		connectionCount: connectionCounts.get(node.id) ?? 0,
	}));

	return {
		edges,
		nodes: hydratedNodes,
	};
}

function normalizeExplorerFilters(rawFilters = {}) {
	const filters = rawFilters && typeof rawFilters === "object"
		? rawFilters
		: {};

	return {
		includeLinkedKnowledge:
			filters.includeLinkedKnowledge === false
				? false
				: filters.includeLinkedKnowledge === true
					? true
					: getNonEmptyString(filters.includeLinkedKnowledge) === "false"
						? false
						: true,
		kind: getNonEmptyString(filters.kind),
		scope: getNonEmptyString(filters.scope),
		status: getNonEmptyString(filters.status),
		tag: getNonEmptyString(filters.tag)?.toLowerCase() ?? null,
		threadId: getNonEmptyString(filters.threadId),
	};
}

function nodeMatchesFilters(node, filters) {
	if (filters.kind && node.kind !== filters.kind) {
		return false;
	}
	if (filters.scope && node.scope !== filters.scope) {
		return false;
	}
	if (filters.status && node.status !== filters.status) {
		return false;
	}
	if (filters.tag && !ensureArray(node.tags).includes(filters.tag)) {
		return false;
	}
	if (filters.threadId && node.sourceThreadId !== filters.threadId) {
		return false;
	}
	return true;
}

function applyExplorerFilters(snapshot, filters) {
	const normalizedFilters = normalizeExplorerFilters(filters);
	const directMatches = snapshot.nodes.filter((node) => {
		if (!normalizedFilters.includeLinkedKnowledge && node.kind === "linked-knowledge") {
			return false;
		}
		return nodeMatchesFilters(node, normalizedFilters);
	});

	const visibleIds = new Set(directMatches.map((node) => node.id));
	if (normalizedFilters.threadId || normalizedFilters.tag) {
		for (const edge of snapshot.edges) {
			if (!(visibleIds.has(edge.source) || visibleIds.has(edge.target))) {
				continue;
			}

			const sourceNode = snapshot.nodes.find((node) => node.id === edge.source);
			const targetNode = snapshot.nodes.find((node) => node.id === edge.target);
			for (const candidateNode of [sourceNode, targetNode]) {
				if (!candidateNode) {
					continue;
				}
				if (!normalizedFilters.includeLinkedKnowledge && candidateNode.kind === "linked-knowledge") {
					continue;
				}
				if (
					candidateNode.kind === "canonical-memory"
					|| candidateNode.kind === "compiled-context"
					|| edge.kind === "wiki_link"
				) {
					visibleIds.add(candidateNode.id);
				}
			}
		}
	}

	const visibleNodes = snapshot.nodes.filter((node) => visibleIds.has(node.id));
	const visibleNodeIds = new Set(visibleNodes.map((node) => node.id));
	const visibleEdges = snapshot.edges.filter((edge) => visibleNodeIds.has(edge.source) && visibleNodeIds.has(edge.target));

	return {
		edges: visibleEdges,
		nodes: visibleNodes,
	};
}

function buildFacetEntries(countMap, labelFormatter = (value) => value) {
	return Array.from(countMap.entries())
		.map(([value, count]) => ({
			count,
			label: labelFormatter(value),
			value,
		}))
		.sort((left, right) => right.count - left.count || left.label.localeCompare(right.label));
}

function buildExplorerFacets(nodes) {
	const kindCounts = new Map();
	const scopeCounts = new Map();
	const statusCounts = new Map();
	const tagCounts = new Map();
	const threadCounts = new Map();

	for (const node of nodes) {
		kindCounts.set(node.kind, (kindCounts.get(node.kind) ?? 0) + 1);
		if (node.scope) {
			scopeCounts.set(node.scope, (scopeCounts.get(node.scope) ?? 0) + 1);
		}
		if (node.status) {
			statusCounts.set(node.status, (statusCounts.get(node.status) ?? 0) + 1);
		}
		if (node.sourceThreadId) {
			threadCounts.set(node.sourceThreadId, (threadCounts.get(node.sourceThreadId) ?? 0) + 1);
		}
		for (const tag of ensureArray(node.tags)) {
			tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
		}
	}

	return {
		kinds: buildFacetEntries(kindCounts, (value) => value.replace(/-/gu, " ")),
		scopes: buildFacetEntries(scopeCounts, (value) => value),
		statuses: buildFacetEntries(statusCounts, (value) => value),
		tags: buildFacetEntries(tagCounts, (value) => value),
		threads: buildFacetEntries(threadCounts, (value) => value),
	};
}

function buildExplorerStats(allNodes, allEdges, visibleNodes, visibleEdges) {
	const visibleKinds = Object.create(null);
	const visibleScopes = Object.create(null);
	const visibleStatuses = Object.create(null);

	for (const node of visibleNodes) {
		visibleKinds[node.kind] = (visibleKinds[node.kind] ?? 0) + 1;
		if (node.scope) {
			visibleScopes[node.scope] = (visibleScopes[node.scope] ?? 0) + 1;
		}
		if (node.status) {
			visibleStatuses[node.status] = (visibleStatuses[node.status] ?? 0) + 1;
		}
	}

	return {
		edgeCount: visibleEdges.length,
		nodeCount: visibleNodes.length,
		totalEdgeCount: allEdges.length,
		totalNodeCount: allNodes.length,
		visibleKindCounts: visibleKinds,
		visibleScopeCounts: visibleScopes,
		visibleStatusCounts: visibleStatuses,
	};
}

function sortNodesForOutput(nodes) {
	return [...nodes].sort((left, right) => {
		const updatedLeft = left.updatedAt || left.createdAt || "";
		const updatedRight = right.updatedAt || right.createdAt || "";
		return updatedRight.localeCompare(updatedLeft) || left.title.localeCompare(right.title);
	});
}

async function buildWikiMemoryExplorer({
	filters,
	wikiDir = DEFAULT_WIKI_DIR,
} = {}) {
	const normalizedFilters = normalizeExplorerFilters(filters);
	const paths = resolveLlmWikiPaths({ wikiDir });
	const [memoryDocuments, proposals, compiledContexts, linkedKnowledgeNodes] = await Promise.all([
		getCanonicalWikiMemoryDocuments({ wikiDir }),
		listWikiMemoryProposals({ wikiDir }),
		readCompiledContextDocuments({ wikiDir }),
		normalizedFilters.includeLinkedKnowledge
			? buildLinkedKnowledgeNodes({ rootDir: paths.rootDir, wikiDir: paths.wikiDir })
			: Promise.resolve([]),
	]);

	const allNodes = [
		...buildCanonicalNodes(memoryDocuments, paths.rootDir),
		...buildCompiledNodes(compiledContexts, paths.rootDir),
		...buildProposalNodes(proposals, paths.rootDir),
		...linkedKnowledgeNodes,
	];
	const graph = buildExplorerGraph(allNodes);
	const filtered = applyExplorerFilters(graph, normalizedFilters);

	return {
		edges: filtered.edges,
		facets: buildExplorerFacets(graph.nodes),
		filters: normalizedFilters,
		generatedAt: new Date().toISOString(),
		nodes: sortNodesForOutput(filtered.nodes),
		stats: buildExplorerStats(graph.nodes, graph.edges, filtered.nodes, filtered.edges),
	};
}

function buildWikiMemoryExplorerCsv(explorer) {
	const rows = [
		[
			"id",
			"kind",
			"title",
			"scope",
			"status",
			"target",
			"summary",
			"tags",
			"sourceThreadId",
			"relativePath",
			"connectionCount",
			"updatedAt",
		],
		...sortNodesForOutput(explorer.nodes).map((node) => [
			node.id,
			node.kind,
			node.title,
			node.scope ?? "",
			node.status ?? "",
			node.target ?? "",
			node.summary ?? "",
			ensureArray(node.tags).join("|"),
			node.sourceThreadId ?? "",
			node.relativePath ?? "",
			String(node.connectionCount ?? 0),
			node.updatedAt ?? node.createdAt ?? "",
		]),
	];

	return rows
		.map((row) => row.map((cell) => `"${String(cell ?? "").replace(/"/gu, "\"\"")}"`).join(","))
		.join("\n");
}

function resolveExplorerSelection(explorer, selectedNodeIds) {
	const requestedNodeIds = Array.isArray(selectedNodeIds)
		? selectedNodeIds.filter((nodeId) => typeof nodeId === "string" && nodeId.trim().length > 0)
		: [];
	if (requestedNodeIds.length === 0) {
		return sortNodesForOutput(explorer.nodes);
	}

	const requestedIdSet = new Set(requestedNodeIds);
	return sortNodesForOutput(explorer.nodes.filter((node) => requestedIdSet.has(node.id)));
}

function buildWikiMemoryBrief({
	audience = null,
	explorer,
	selectedNodeIds,
	title = "Memory Brief",
} = {}) {
	const selectedNodes = resolveExplorerSelection(explorer, selectedNodeIds);
	const sections = [
		`# ${title}`,
		"",
		`Generated: ${explorer.generatedAt}`,
		audience ? `Audience: ${audience}` : null,
		"",
		"## Snapshot",
		"",
		`- Visible nodes: ${explorer.stats.nodeCount}`,
		`- Visible edges: ${explorer.stats.edgeCount}`,
		`- Canonical memory nodes: ${explorer.stats.visibleKindCounts["canonical-memory"] ?? 0}`,
		`- Raw proposals: ${explorer.stats.visibleKindCounts["raw-proposal"] ?? 0}`,
		`- Linked knowledge nodes: ${explorer.stats.visibleKindCounts["linked-knowledge"] ?? 0}`,
		"",
	];

	const groupedNodes = new Map();
	for (const node of selectedNodes) {
		if (!groupedNodes.has(node.kind)) {
			groupedNodes.set(node.kind, []);
		}
		groupedNodes.get(node.kind).push(node);
	}

	for (const [kind, nodes] of groupedNodes.entries()) {
		sections.push(`## ${kind.replace(/-/gu, " ")}`);
		sections.push("");
		for (const node of nodes.slice(0, 12)) {
			const detailBits = [
				node.scope ? `scope: ${node.scope}` : null,
				node.status ? `status: ${node.status}` : null,
				node.target ? `target: ${node.target}` : null,
				node.sourceThreadId ? `thread: ${node.sourceThreadId}` : null,
			].filter(Boolean);
			sections.push(`- **${node.title}**${detailBits.length > 0 ? ` (${detailBits.join(", ")})` : ""}`);
			if (node.summary) {
				sections.push(`  ${node.summary}`);
			}
		}
		sections.push("");
	}

	return sections.filter((line) => line !== null).join("\n").trim();
}

function buildWikiMemoryDeck({
	explorer,
	selectedNodeIds,
	title = "Memory Explorer Deck",
} = {}) {
	const selectedNodes = resolveExplorerSelection(explorer, selectedNodeIds);
	const canonicalNodes = selectedNodes.filter((node) => node.kind === "canonical-memory");
	const proposalNodes = selectedNodes.filter((node) => node.kind === "raw-proposal");
	const knowledgeNodes = selectedNodes.filter((node) => node.kind === "linked-knowledge");

	return [
		"---",
		"marp: true",
		"paginate: true",
		`title: "${title.replace(/"/gu, '\\"')}"`,
		"theme: default",
		"---",
		"",
		`# ${title}`,
		"",
		`Generated ${explorer.generatedAt}`,
		"",
		"---",
		"",
		"## Corpus Snapshot",
		"",
		`- ${explorer.stats.nodeCount} visible nodes`,
		`- ${explorer.stats.edgeCount} visible edges`,
		`- ${canonicalNodes.length} canonical memory nodes`,
		`- ${proposalNodes.length} raw proposals`,
		`- ${knowledgeNodes.length} linked knowledge nodes`,
		"",
		"---",
		"",
		"## Canonical Memory",
		"",
		...(canonicalNodes.length > 0
			? canonicalNodes.slice(0, 8).map((node) => `- **${node.title}**: ${node.summary || "No summary yet."}`)
			: ["- No canonical memory nodes selected."]),
		"",
		"---",
		"",
		"## Recent Proposal Activity",
		"",
		...(proposalNodes.length > 0
			? proposalNodes.slice(0, 8).map((node) => {
				const detail = [node.status, node.scope, node.target].filter(Boolean).join(" · ");
				return `- **${node.title}**${detail ? ` (${detail})` : ""}`;
			})
			: ["- No proposal activity selected."]),
		"",
		"---",
		"",
		"## Linked Knowledge",
		"",
		...(knowledgeNodes.length > 0
			? knowledgeNodes.slice(0, 8).map((node) => `- **${node.title}**: ${node.summary || "No summary yet."}`)
			: ["- No linked knowledge nodes selected."]),
		"",
	].join("\n");
}

module.exports = {
	buildWikiMemoryBrief,
	buildWikiMemoryDeck,
	buildWikiMemoryExplorer,
	buildWikiMemoryExplorerCsv,
	normalizeExplorerFilters,
};
