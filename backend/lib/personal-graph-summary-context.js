"use strict";

const path = require("node:path");

const summarize = require("./personal-graph-summarize");
const vault = require("./personal-graph-vault");

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

function formatFrontmatter(frontmatter) {
	const entries = Object.entries(frontmatter ?? {})
		.filter(([, value]) => value !== null && value !== undefined && String(value).trim() !== "")
		.slice(0, 12);
	if (entries.length === 0) {
		return "";
	}
	return entries.map(([key, value]) => `- ${key}: ${Array.isArray(value) ? value.join(", ") : String(value)}`).join("\n");
}

function formatNode(node) {
	const lines = [
		`## ${node.title}`,
		"",
		`- id: ${node.id}`,
		`- kind: ${node.kind}`,
		`- provider: ${node.provider}`,
		`- relative path: ${node.relativePath}`,
		node.externalUrl ? `- url: ${node.externalUrl}` : null,
		node.bodyPreview ? "" : null,
		node.bodyPreview ? node.bodyPreview : null,
	];
	const frontmatter = formatFrontmatter(node.frontmatter);
	if (frontmatter) {
		lines.push("", "### Frontmatter", "", frontmatter);
	}
	return lines.filter((line) => line !== null).join("\n");
}

function buildSummaryContextMarkdown(selection) {
	const edgeLines = selection.edges.length > 0
		? selection.edges.map((edge) => {
			const neighborId = edge.source === selection.selectedNode.id ? edge.target : edge.source;
			const neighbor = selection.neighbors.find((node) => node.id === neighborId);
			return `- ${edge.label}: ${selection.selectedNode.title} -> ${neighbor?.title ?? neighborId}`;
		})
		: ["- No one-hop graph neighbors."];

	return [
		"# Personal Graph Summary Context",
		"",
		"Summarize the selected node using its current one-hop graph neighborhood.",
		"",
		"# Selected Node",
		"",
		formatNode(selection.selectedNode),
		"",
		"# One-Hop Neighbors",
		"",
		...(selection.neighbors.length > 0 ? selection.neighbors.map(formatNode) : ["No direct neighbors."]),
		"",
		"# Relationships",
		"",
		...edgeLines,
		"",
	].join("\n");
}

function buildSummaryPrompt(selection) {
	return [
		"You are summarizing a Personal Graph selected node for a second-brain workflow.",
		"Use the selected node as the primary source and the one-hop graph neighbors only as supporting context.",
		"Return markdown with a short heading, a useful summary, and 3-5 actionable takeaways.",
		"Do not mention inaccessible files or claim unsupported facts.",
		"",
		"Graph context:",
		buildSummaryContextMarkdown(selection),
	].join("\n");
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
	assertVaultBoundPath,
	buildMarpDeck,
	buildSummaryContextMarkdown,
	buildSummaryPrompt,
	createSelectionSummarizeInput,
	getSelectedNodeContext,
	summarizeSelection,
};
