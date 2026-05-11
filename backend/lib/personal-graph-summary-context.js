"use strict";

const crypto = require("node:crypto");
const path = require("node:path");

const summarize = require("./personal-graph-summarize");
const vault = require("./personal-graph-vault");

const SUMMARY_RENDERER_VERSION = "editorial-html-v1";
const FORBIDDEN_READER_METADATA_PATTERN = /\b(?:id|kind|provider|relativePath|relative path|ari|frontmatter)\s*:/iu;

function createSummaryContextError(message, code) {
	const error = new Error(message);
	error.code = code;
	return error;
}

function isUrl(value) {
	try {
		const parsed = new URL(value);
		return parsed.protocol === "http:" || parsed.protocol === "https:";
	} catch {
		return false;
	}
}

function isPathInside(rootPath, candidatePath) {
	const relativePath = path.relative(rootPath, candidatePath);
	return relativePath === "" || (!relativePath.startsWith("..") && !path.isAbsolute(relativePath));
}

function assertVaultBoundPath(filePath) {
	const vaultRoot = vault.getVaultRoot();
	const resolvedPath = path.resolve(filePath);
	if (!isPathInside(vaultRoot, resolvedPath)) {
		throw createSummaryContextError(
			`summarize input path is outside the configured vault root: ${resolvedPath}`,
			"VAULT_PATH_OUTSIDE_ROOT",
		);
	}
	return resolvedPath;
}

function getSelectedNodeContext(explorer, nodeId) {
	if (!nodeId) {
		throw createSummaryContextError("Select a Personal Graph node before summarizing.", "NODE_SELECTION_REQUIRED");
	}
	if (!explorer || !Array.isArray(explorer.nodes) || !Array.isArray(explorer.edges)) {
		throw createSummaryContextError("Personal Graph explorer is unavailable.", "EXPLORER_UNAVAILABLE");
	}

	const selectedNode = explorer.nodes.find((node) => node.id === nodeId);
	if (!selectedNode) {
		throw createSummaryContextError(`Selected node was not found: ${nodeId}`, "NODE_NOT_FOUND");
	}

	const neighborIds = new Set();
	const edges = [];
	for (const edge of explorer.edges) {
		if (edge.source === selectedNode.id) {
			neighborIds.add(edge.target);
			edges.push(edge);
			continue;
		}
		if (edge.target === selectedNode.id) {
			neighborIds.add(edge.source);
			edges.push(edge);
		}
	}

	const nodesById = new Map(explorer.nodes.map((node) => [node.id, node]));
	const neighbors = [...neighborIds]
		.map((id) => nodesById.get(id))
		.filter(Boolean)
		.sort((left, right) => left.title.localeCompare(right.title));

	return {
		edges,
		neighbors,
		selectedNode,
	};
}

function getReadableNodeType(node) {
	if (node.provider === "twg") {
		const type = typeof node.frontmatter?.type === "string" ? node.frontmatter.type : node.kind;
		return String(type)
			.replace(/([a-z])([A-Z])/gu, "$1 $2")
			.replace(/[-_]+/gu, " ")
			.toLowerCase();
	}
	if (node.kind === "raw") return "raw source";
	if (node.kind === "synthesis") return "synthesis note";
	return `${node.kind} note`;
}

function cleanPromptText(value, fallback = "Untitled source") {
	const text = String(value ?? "").replace(/\s+/gu, " ").trim();
	if (!text) return fallback;
	return text.replace(FORBIDDEN_READER_METADATA_PATTERN, "").trim() || fallback;
}

function formatNodeForPrompt(node) {
	const lines = [
		`## ${cleanPromptText(node.title)}`,
		"",
		`- Readable source type: ${getReadableNodeType(node)}`,
		node.externalUrl ? "- External source link is available." : null,
		node.bodyPreview ? "" : null,
		node.bodyPreview ? cleanPromptText(node.bodyPreview, "") : null,
	];
	return lines.filter((line) => line !== null).join("\n");
}

function buildSummaryContextMarkdown(selection) {
	const edgeLines = selection.edges.length > 0
		? selection.edges.map((edge) => {
			const neighborId = edge.source === selection.selectedNode.id ? edge.target : edge.source;
			const neighbor = selection.neighbors.find((node) => node.id === neighborId);
			return `- ${cleanPromptText(edge.label, "related to")}: ${cleanPromptText(selection.selectedNode.title)} -> ${cleanPromptText(neighbor?.title ?? "Unknown neighbor")}`;
		})
		: ["- No one-hop graph neighbors."];

	return [
		"# Personal Graph Summary Context",
		"",
		"Summarize the selected node using its current one-hop graph neighborhood.",
		"",
		"# Selected Node",
		"",
		formatNodeForPrompt(selection.selectedNode),
		"",
		"# One-Hop Neighbors",
		"",
		...(selection.neighbors.length > 0 ? selection.neighbors.map(formatNodeForPrompt) : ["No direct neighbors."]),
		"",
		"# Relationships",
		"",
		...edgeLines,
		"",
	].join("\n");
}

function buildSummaryPrompt(selection) {
	return [
		"You are writing an editorial Personal Graph article for a second-brain workflow.",
		"Use only the selected node and supplied one-hop graph context. Do not invent images, links, people, dates, or relationships.",
		"Use source titles and human-readable relationship labels. If evidence is thin, say so plainly.",
		"Do not print raw IDs, ARIs, provider, kind, relativePath, frontmatter keys, YAML frontmatter, or implementation metadata.",
		"Do not wrap the whole answer in a markdown code fence.",
		"Return markdown using this section contract:",
		"# <article title>",
		"<short lede>",
		"",
		"## What this is",
		"...",
		"",
		"## Why it matters",
		"...",
		"",
		"## Connected work",
		"...",
		"",
		"## Source evidence",
		"...",
		"",
		"Graph context:",
		buildSummaryContextMarkdown(selection),
	].join("\n");
}

function stableJson(value) {
	if (Array.isArray(value)) {
		return `[${value.map(stableJson).join(",")}]`;
	}
	if (value && typeof value === "object") {
		return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(",")}}`;
	}
	return JSON.stringify(value);
}

function hashValue(value) {
	return crypto.createHash("sha256").update(stableJson(value)).digest("hex").slice(0, 24);
}

function getNodePreviewHash(node) {
	return hashValue({
		bodyPreview: node.bodyPreview ?? "",
		title: node.title ?? "",
	});
}

function createSourceFingerprint({ explorer, selection, source, workWindow = null } = {}) {
	if (!selection?.selectedNode) {
		throw createSummaryContextError("Selected node context is required to fingerprint a summary.", "NODE_SELECTION_REQUIRED");
	}
	const selectedNode = selection.selectedNode;
	const neighborEntries = selection.neighbors.map((node) => ({
		id: node.id,
		preview: getNodePreviewHash(node),
		title: node.title ?? "",
		updatedAt: node.updatedAt ?? null,
	}));
	const payload = {
		neighbors: neighborEntries,
		node: {
			id: selectedNode.id,
			preview: getNodePreviewHash(selectedNode),
			title: selectedNode.title ?? "",
			updatedAt: selectedNode.updatedAt ?? null,
		},
		provider: source ?? selectedNode.provider,
		rendererVersion: SUMMARY_RENDERER_VERSION,
		twgGeneratedAt: (source ?? selectedNode.provider) === "twg" ? explorer?.generatedAt ?? null : null,
		workWindow: (source ?? selectedNode.provider) === "twg" ? workWindow ?? "7d" : null,
	};
	return hashValue(payload);
}

function readSelectedVaultRawInput(node) {
	const raw = vault.readRaw(node.relativePath);
	const parsed = vault.parseFrontmatter(raw.content);
	const frontmatterUrl = typeof parsed.frontmatter.url === "string" ? parsed.frontmatter.url.trim() : "";
	if (isUrl(frontmatterUrl)) {
		return { input: frontmatterUrl, inputKind: "url" };
	}
	return {
		input: assertVaultBoundPath(raw.path),
		inputKind: "vault-file",
	};
}

function createSelectionSummarizeInput(explorer, nodeId) {
	const selection = getSelectedNodeContext(explorer, nodeId);
	const contextMarkdown = buildSummaryContextMarkdown(selection);
	const prompt = buildSummaryPrompt(selection);
	const node = selection.selectedNode;

	if (node.provider === "vault" && node.kind === "raw") {
		return {
			...readSelectedVaultRawInput(node),
			cleanup: () => {},
			contextMarkdown,
			prompt,
			selection,
		};
	}

	const tempPath = summarize.writeTemporarySummaryInput(contextMarkdown, { kind: "markdown", prefix: "context" });
	return {
		cleanup: () => {
			require("node:fs").rmSync(tempPath, { force: true });
		},
		contextMarkdown,
		input: tempPath,
		inputKind: "context-file",
		prompt,
		selection,
	};
}

function buildMarpDeck({
	length = "medium",
	selection,
	summary,
	takeaways = [],
	title,
} = {}) {
	if (!selection?.selectedNode) {
		throw createSummaryContextError("Selected node context is required to build a deck.", "NODE_SELECTION_REQUIRED");
	}
	const deckTitle = title || `${selection.selectedNode.title} Summary`;
	const visibleTakeaways = takeaways.length > 0
		? takeaways.slice(0, 5)
		: ["Review the generated summary and decide whether it should become a wiki source note."];
	const neighborLines = selection.neighbors.length > 0
		? selection.neighbors.slice(0, 8).map((node) => `- **${node.title}** (${node.kind})`)
		: ["- No one-hop neighbors in the current graph."];

	return [
		"---",
		"marp: true",
		"paginate: true",
		`title: "${deckTitle.replace(/"/gu, '\\"')}"`,
		"theme: default",
		"---",
		"",
		`# ${deckTitle}`,
		"",
		`Summary length: ${length}`,
		"",
		"---",
		"",
		"## Summary",
		"",
		String(summary ?? "").trim() || "No summary preview was provided.",
		"",
		"---",
		"",
		"## Takeaways",
		"",
		...visibleTakeaways.map((takeaway) => `- ${takeaway}`),
		"",
		"---",
		"",
		"## Graph Context",
		"",
		`Selected node: **${selection.selectedNode.title}** (${selection.selectedNode.kind})`,
		"",
		...neighborLines,
		"",
		"---",
		"",
		"## Source",
		"",
		`- Provider: ${selection.selectedNode.provider}`,
		`- Path: ${selection.selectedNode.relativePath}`,
		selection.selectedNode.externalUrl ? `- URL: ${selection.selectedNode.externalUrl}` : "- URL: not available",
		"",
	].join("\n");
}

async function summarizeSelection({
	execFileImpl,
	explorer,
	length,
	nodeId,
	signal,
} = {}) {
	const prepared = createSelectionSummarizeInput(explorer, nodeId);
	try {
		const summary = await summarize.runSummarizeCli({
			execFileImpl,
			input: prepared.input,
			length,
			prompt: prepared.prompt,
			signal,
		});
		return {
			...summary,
			contextMarkdown: prepared.contextMarkdown,
			inputKind: prepared.inputKind,
			node: prepared.selection.selectedNode,
			selection: prepared.selection,
		};
	} finally {
		prepared.cleanup();
	}
}

module.exports = {
	SUMMARY_RENDERER_VERSION,
	assertVaultBoundPath,
	buildMarpDeck,
	buildSummaryContextMarkdown,
	buildSummaryPrompt,
	createSourceFingerprint,
	createSelectionSummarizeInput,
	getSelectedNodeContext,
	summarizeSelection,
};
