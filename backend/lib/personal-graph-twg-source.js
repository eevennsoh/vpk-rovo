"use strict";

const { spawn } = require("node:child_process");

const TWG_BIN = process.env.TWG_BIN || "twg";
const DEFAULT_TWG_DEPTH = 2;
const DEFAULT_TWG_FANOUT_LIMIT = 10;
const ARTIFACT_TITLE_HYDRATION_CONCURRENCY = 8;
const ARTIFACT_TITLE_HYDRATION_TIMEOUT_MS = 20000;
const DEFAULT_TWG_DEPTH_ENV_KEY = "PERSONAL_GRAPH_TWG_DEFAULT_DEPTH";
const FANOUT_LIMIT_ENV_KEY = "PERSONAL_GRAPH_TWG_FANOUT_LIMIT";
const HYDRATION_TIMEOUT_ENV_KEY = "PERSONAL_GRAPH_TWG_ARTIFACT_HYDRATION_TIMEOUT_MS";
const GENERIC_EDGE_KIND = "related";

const RELATIONSHIP_TO_EDGE_KIND = new Map([
	["atlassian_user_contributed_to_confluence_page", "worked-on"],
	["atlassian_user_contributed_to_confluence_blogpost", "worked-on"],
	["atlassian_user_contributed_to_confluence_whiteboard", "worked-on"],
	["atlassian_user_owns_confluence_page", "worked-on"],
	["atlassian_user_created_jira_work_item", "worked-on"],
	["atlassian_user_updated_jira_work_item", "worked-on"],
	["atlassian_user_reported_jira_work_item", "worked-on"],
	["atlassian_user_assigned_jira_work_item", "worked-on"],
	["atlassian_user_mentioned_in_confluence_page", "mentioned-in"],
	["atlassian_user_mentioned_in_confluence_blogpost", "mentioned-in"],
	["atlassian_user_mentioned_in_jira_work_item", "mentioned-in"],
	["atlassian_user_viewed_confluence_page", "viewed"],
	["atlassian_user_viewed_confluence_blogpost", "viewed"],
	["atlassian_user_viewed_confluence_whiteboard", "viewed"],
	["atlassian_user_viewed_jira_work_item", "viewed"],
	["atlassian_user_viewed_loom_video", "viewed"],
	["atlassian_user_reacted_to_loom_video", "viewed"],
	["atlassian_user_invited_to_loom_meeting", "attended"],
]);

const TARGET_TYPE_TO_NODE_KIND = new Map([
	["AtlassianAccountUser", "entity"],
	["ConfluencePage", "source"],
	["ConfluenceBlogPost", "source"],
	["ConfluenceWhiteboard", "source"],
	["ConfluenceComment", "source"],
	["JiraIssue", "source"],
	["JiraWorkItem", "source"],
	["LoomVideo", "source"],
	["LoomMeeting", "source"],
]);

const TARGET_TYPE_TO_CONTEXT_ROUTE = new Map([
	["AtlassianAccountUser", ["context", "user"]],
	["ConfluencePage", ["context", "confluence", "page"]],
	["ConfluenceBlogPost", ["context", "confluence", "blogpost"]],
	["ConfluenceWhiteboard", ["context", "confluence", "whiteboard"]],
	["JiraIssue", ["context", "jira", "workitem"]],
	["JiraWorkItem", ["context", "jira", "workitem"]],
]);

function prettifyType(type) {
	if (!type) return "Item";
	return String(type).replace(/([a-z])([A-Z])/gu, "$1 $2");
}

function parseConfluenceAri(ari) {
	if (typeof ari !== "string") return null;
	const match = ari.match(/^ari:cloud:confluence:([^:]+):([^/]+)\/(.+)$/u);
	if (!match) return null;
	return {
		cloudId: match[1],
		resourceId: match[3],
	};
}

function deriveTitleFromAri(ari, type) {
	if (typeof ari !== "string" || !ari) return prettifyType(type);
	const tail = ari.split("/").filter(Boolean).at(-1) ?? ari;
	return `${prettifyType(type)} ${tail}`;
}

function getNonEmptyString(value) {
	if (typeof value !== "string") return null;
	const trimmed = value.trim();
	return trimmed ? trimmed : null;
}

function getPositiveIntegerFromEnv(key, fallback) {
	const rawValue = getNonEmptyString(process.env[key]);
	if (!rawValue) return fallback;
	const parsed = Number.parseInt(rawValue, 10);
	return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function getDefaultDepth() {
	return Math.min(2, getPositiveIntegerFromEnv(DEFAULT_TWG_DEPTH_ENV_KEY, DEFAULT_TWG_DEPTH));
}

function getFanoutLimit() {
	return getPositiveIntegerFromEnv(FANOUT_LIMIT_ENV_KEY, DEFAULT_TWG_FANOUT_LIMIT);
}

function getNodeType(node) {
	return getNonEmptyString(node?.frontmatter?.type) ?? getNonEmptyString(node?.type);
}

function getObjectDisplayTitle(object) {
	return (
		getNonEmptyString(object?.name) ??
		getNonEmptyString(object?.title) ??
		getNonEmptyString(object?.displayName)
	);
}

function mapObjectToNode(object, { fallbackTitle = null } = {}) {
	if (!object || typeof object !== "object" || typeof object.ari !== "string" || !object.ari) {
		return null;
	}
	const kind = TARGET_TYPE_TO_NODE_KIND.get(object.type) ?? "source";
	const displayTitle = getObjectDisplayTitle(object);
	const title = displayTitle ?? fallbackTitle ?? deriveTitleFromAri(object.ari, object.type);
	const externalUrl = getNonEmptyString(object.url);
	return {
		bodyPreview: displayTitle ? "" : prettifyType(object.type),
		connectionCount: 0,
		dangling: false,
		externalUrl,
		frontmatter: { ari: object.ari, type: object.type ?? null },
		id: object.ari,
		kind,
		label: title,
		missing: false,
		path: null,
		provider: "twg",
		relativePath: object.ari,
		size: 1,
		slug: encodeURIComponent(object.ari),
		title,
		updatedAt: null,
	};
}

function getConfluenceArtifactArgs(node) {
	const nodeType = getNodeType(node);
	const ari = getNonEmptyString(node?.frontmatter?.ari) ?? getNonEmptyString(node?.id);
	const parsedAri = parseConfluenceAri(ari);
	const resourceId = parsedAri?.resourceId ?? getNonEmptyString(node?.id);
	if (!resourceId) return null;

	const siteArgs = parsedAri?.cloudId ? ["--site", parsedAri.cloudId] : [];
	if (nodeType === "ConfluencePage") {
		return [
			"confluence",
			"page",
			"get",
			"--page",
			resourceId,
			...siteArgs,
			"--body",
			"none",
			"--comments",
			"none",
			"--skip-ancestors",
			"--output",
			"json",
		];
	}
	if (nodeType === "ConfluenceBlogPost") {
		return ["confluence", "blog", "get", resourceId, ...siteArgs, "--output", "json"];
	}
	if (nodeType === "ConfluenceWhiteboard") {
		return ["confluence", "whiteboard", "get", resourceId, ...siteArgs, "--output", "json"];
	}
	if (nodeType === "ConfluenceSpace") {
		return ["confluence", "space", "get", resourceId, ...siteArgs, "--output", "json"];
	}
	return null;
}

function getWebUrlFromArtifactData(data) {
	const webUrl = getNonEmptyString(data?.webUrl) ?? getNonEmptyString(data?.url);
	if (webUrl) return webUrl;

	const links = data?.links && typeof data.links === "object" ? data.links : data?._links;
	const base = getNonEmptyString(links?.base);
	const webUi = getNonEmptyString(links?.webUi) ?? getNonEmptyString(links?.webui);
	if (base && webUi) return `${base}${webUi}`;
	return null;
}

function hasDerivedArtifactTitle(node) {
	const nodeType = getNodeType(node);
	const ari = getNonEmptyString(node?.frontmatter?.ari) ?? getNonEmptyString(node?.id);
	const title = getNonEmptyString(node?.title) ?? getNonEmptyString(node?.label);
	return Boolean(nodeType && ari && title === deriveTitleFromAri(ari, nodeType));
}

function shouldHydrateArtifactTitle(node) {
	return Boolean(getConfluenceArtifactArgs(node) && (!getNonEmptyString(node?.title) || hasDerivedArtifactTitle(node)));
}

function createArtifactHydrationSignal(parentSignal) {
	const controller = new AbortController();
	let parentAbortHandler = null;
	const timeout = setTimeout(() => {
		controller.abort(new Error("TWG artifact title hydration timed out"));
	}, getPositiveIntegerFromEnv(HYDRATION_TIMEOUT_ENV_KEY, ARTIFACT_TITLE_HYDRATION_TIMEOUT_MS));

	if (parentSignal?.aborted) {
		controller.abort(parentSignal.reason);
	} else if (parentSignal) {
		parentAbortHandler = () => controller.abort(parentSignal.reason);
		parentSignal.addEventListener("abort", parentAbortHandler, { once: true });
	}

	return {
		clear() {
			clearTimeout(timeout);
			if (parentAbortHandler) {
				parentSignal.removeEventListener("abort", parentAbortHandler);
			}
		},
		signal: controller.signal,
	};
}

async function hydrateArtifactNode(node, { signal, spawnImpl } = {}) {
	const args = getConfluenceArtifactArgs(node);
	if (!args) return node;
	const hydrationSignal = createArtifactHydrationSignal(signal);
	try {
		const stdout = await runTwg(args, { signal: hydrationSignal.signal, spawnImpl });
		const payload = parseJsonOrThrow(stdout, args);
		const data = payload?.data && typeof payload.data === "object" ? payload.data : {};
		const title = getNonEmptyString(data.title) ?? getNonEmptyString(data.name);
		const externalUrl = getWebUrlFromArtifactData(data);
		if (!title && !externalUrl) return node;
		return {
			...node,
			bodyPreview: title ? "" : node.bodyPreview,
			externalUrl: externalUrl ?? node.externalUrl,
			label: title ?? node.label,
			title: title ?? node.title,
		};
	} catch {
		return node;
	} finally {
		hydrationSignal.clear();
	}
}

async function mapWithConcurrency(items, limit, mapper) {
	const results = new Array(items.length);
	let nextIndex = 0;
	const workerCount = Math.min(Math.max(1, limit), items.length);
	await Promise.all(Array.from({ length: workerCount }, async () => {
		while (nextIndex < items.length) {
			const currentIndex = nextIndex;
			nextIndex += 1;
			results[currentIndex] = await mapper(items[currentIndex], currentIndex);
		}
	}));
	return results;
}

function getArtifactTitleHydrationTargets(nodes, limit) {
	const targets = nodes
		.filter(shouldHydrateArtifactTitle)
		.sort((left, right) => (
			(right.connectionCount ?? 0) - (left.connectionCount ?? 0) ||
			String(left.title ?? left.id).localeCompare(String(right.title ?? right.id))
		));
	const resolvedLimit = Number.isInteger(limit) && limit > 0 ? limit : targets.length;
	return targets.slice(0, resolvedLimit);
}

async function hydrateTwgArtifactTitles(explorer, { limit, signal, spawnImpl } = {}) {
	const nodes = Array.isArray(explorer?.nodes) ? explorer.nodes : [];
	const targets = getArtifactTitleHydrationTargets(nodes, limit);
	if (targets.length === 0) return explorer;

	const hydratedNodes = await mapWithConcurrency(
		targets,
		ARTIFACT_TITLE_HYDRATION_CONCURRENCY,
		(node) => hydrateArtifactNode(node, { signal, spawnImpl }),
	);
	const hydratedNodesById = new Map(hydratedNodes.map((node) => [node.id, node]));
	const nodesById = new Map(nodes.map((node) => [node.id, hydratedNodesById.get(node.id) ?? node]));
	return finalizeExplorer(nodesById, explorer.edges ?? [], explorer.generatedAt);
}

function classifyRelationshipToEdgeKind(relationshipName) {
	const mapped = RELATIONSHIP_TO_EDGE_KIND.get(relationshipName);
	if (mapped) return mapped;

	const normalized = String(relationshipName ?? "").toLowerCase().replace(/[^a-z0-9]+/gu, "_");
	if (/mentioned/u.test(normalized)) return "mentioned-in";
	if (/viewed|reacted/u.test(normalized)) return "viewed";
	if (/invited|attended|meeting/u.test(normalized)) return "attended";
	if (/reports?_to|manager/u.test(normalized)) return "reports-to";
	if (/aligned|goal|project/u.test(normalized)) return "aligned-to";
	if (/member|belongs_to|team/u.test(normalized)) return "member-of";
	if (/review|approved|approver/u.test(normalized)) return "reviewed";
	if (/contributed|created|updated|assigned|reported|owned|owns/u.test(normalized)) return "worked-on";
	return GENERIC_EDGE_KIND;
}

function formatRelationshipLabel(relationshipName) {
	return String(relationshipName ?? "related")
		.replace(/^atlassian_user_/u, "")
		.replace(/^atlassian_/u, "")
		.replace(/_/gu, " ");
}

function buildEdge(sourceId, targetId, edgeKind, relationshipName) {
	return {
		id: `${edgeKind}:${sourceId}->${targetId}`,
		kind: edgeKind,
		label: formatRelationshipLabel(relationshipName),
		metadata: { relationship: relationshipName, relationships: [relationshipName] },
		relationKinds: [edgeKind],
		source: sourceId,
		target: targetId,
	};
}

function mergeEdgeMetadata(existing, next) {
	const relationships = new Set([
		...(Array.isArray(existing.metadata?.relationships) ? existing.metadata.relationships : []),
		existing.metadata?.relationship,
		...(Array.isArray(next.metadata?.relationships) ? next.metadata.relationships : []),
		next.metadata?.relationship,
	].filter((value) => typeof value === "string" && value.trim()));
	return {
		...existing,
		label: existing.label || next.label,
		metadata: {
			...existing.metadata,
			...next.metadata,
			relationship: existing.metadata?.relationship ?? next.metadata?.relationship,
			relationships: [...relationships],
		},
		relationKinds: [...new Set([...existing.relationKinds, ...next.relationKinds])],
	};
}

function finalizeExplorer(nodesById, edgeEntries, generatedAt = new Date().toISOString()) {
	const edgesById = new Map();
	for (const edge of edgeEntries) {
		if (!edge || typeof edge.id !== "string") continue;
		const existing = edgesById.get(edge.id);
		edgesById.set(edge.id, existing ? mergeEdgeMetadata(existing, edge) : edge);
	}

	const nodes = [...nodesById.values()].map((node) => ({ ...node, connectionCount: 0 }));
	const finalizedNodesById = new Map(nodes.map((node) => [node.id, node]));
	const edges = [...edgesById.values()].filter((edge) => (
		finalizedNodesById.has(edge.source) && finalizedNodesById.has(edge.target)
	));
	for (const edge of edges) {
		const sourceNode = finalizedNodesById.get(edge.source);
		const targetNode = finalizedNodesById.get(edge.target);
		if (sourceNode) sourceNode.connectionCount += 1;
		if (targetNode) targetNode.connectionCount += 1;
	}

	return {
		edges,
		generatedAt,
		nodes,
		stats: {
			danglingCount: nodes.filter((node) => node.dangling).length,
			edgeCount: edges.length,
			nodeCount: nodes.length,
			rawCount: nodes.filter((node) => node.kind === "raw").length,
			wikiCount: nodes.filter((node) => node.kind !== "entity" && node.kind !== "raw").length,
		},
	};
}

function normalizeContextResponse(payload) {
	if (!payload || typeof payload !== "object") {
		throw new Error("twg context returned no JSON payload");
	}
	const data = payload.data;
	if (!data || typeof data !== "object") {
		throw new Error("twg context payload missing `data`");
	}
	const rootObject = data.object;
	if (!rootObject || typeof rootObject.ari !== "string") {
		throw new Error("twg context payload missing `data.object.ari`");
	}

	const rootNode = mapObjectToNode(rootObject, {
		fallbackTitle: rootObject.type === "AtlassianAccountUser" ? "You" : null,
	});

	const nodesById = new Map([[rootNode.id, rootNode]]);
	const edgeEntries = [];

	const relationships = Array.isArray(data.relationshipSummary) ? data.relationshipSummary : [];
	for (const relationship of relationships) {
		if (!relationship || typeof relationship.relationshipName !== "string") continue;
		const edgeKind = classifyRelationshipToEdgeKind(relationship.relationshipName);
		const targets = Array.isArray(relationship.targets) ? relationship.targets : [];
		for (const target of targets) {
			const node = mapObjectToNode(target);
			if (!node) continue;
			const existing = nodesById.get(node.id);
			if (!existing) {
				nodesById.set(node.id, node);
			}
			const isInbound = relationship.direction === "inbound";
			edgeEntries.push(buildEdge(
				isInbound ? node.id : rootNode.id,
				isInbound ? rootNode.id : node.id,
				edgeKind,
				relationship.relationshipName,
			));
		}
	}

	return finalizeExplorer(nodesById, edgeEntries);
}

class TwgAuthError extends Error {
	constructor(message) {
		super(message);
		this.name = "TwgAuthError";
		this.code = "TWG_AUTH_REQUIRED";
	}
}

class TwgNotFoundError extends Error {
	constructor(message) {
		super(message);
		this.name = "TwgNotFoundError";
		this.code = "TWG_NOT_FOUND";
	}
}

function looksLikeAuthError(stderr) {
	return /\b(login|unauthorized|not authenticated|401|403)\b/iu.test(stderr);
}

function runTwg(args, { signal, spawnImpl = spawn } = {}) {
	return new Promise((resolve, reject) => {
		let child;
		try {
			child = spawnImpl(TWG_BIN, args, { signal });
		} catch (error) {
			reject(error);
			return;
		}

		const stdoutChunks = [];
		const stderrChunks = [];
		child.stdout?.on?.("data", (chunk) => stdoutChunks.push(chunk));
		child.stderr?.on?.("data", (chunk) => stderrChunks.push(chunk));
		child.on?.("error", (error) => {
			if (error?.code === "ENOENT") {
				reject(new TwgNotFoundError(
					`twg CLI not found on PATH (looked for "${TWG_BIN}"). Install via twg-install.sh or set TWG_BIN.`,
				));
				return;
			}
			reject(error);
		});
		child.on?.("close", (code) => {
			const stdout = Buffer.concat(stdoutChunks).toString("utf8");
			const stderr = Buffer.concat(stderrChunks).toString("utf8");
			if (code === 0) {
				resolve(stdout);
				return;
			}
			if (looksLikeAuthError(stderr) || (code !== 0 && stdout.trim() === "" && looksLikeAuthError(stdout + stderr))) {
				reject(new TwgAuthError(`twg ${args.join(" ")} requires authentication. Run \`twg login\`.`));
				return;
			}
			reject(new Error(`twg ${args.join(" ")} exited ${code}: ${stderr.trim() || stdout.trim().slice(0, 200)}`));
		});
	});
}

function parseJsonOrThrow(stdout, args) {
	try {
		return JSON.parse(stdout);
	} catch (error) {
		const snippet = stdout.slice(0, 200).replace(/\s+/gu, " ");
		const wrapped = new Error(`twg ${args.join(" ")} returned malformed JSON: ${snippet}`);
		wrapped.cause = error;
		throw wrapped;
	}
}

async function fetchContextUser({ signal, since = "7d", spawnImpl } = {}) {
	const args = ["context", "user", "me", "--output", "json", "--since", since];
	const stdout = await runTwg(args, { signal, spawnImpl });
	return parseJsonOrThrow(stdout, args);
}

function getTwgContextArgsForNode(node) {
	const nodeType = getNodeType(node);
	const ari = getNonEmptyString(node?.id) ?? getNonEmptyString(node?.frontmatter?.ari);
	if (!nodeType || !ari) {
		return null;
	}
	const route = TARGET_TYPE_TO_CONTEXT_ROUTE.get(nodeType);
	if (!route) {
		return null;
	}
	return [...route, ari];
}

async function fetchContextForNode(node, { signal, since = "7d", spawnImpl } = {}) {
	const routeArgs = getTwgContextArgsForNode(node);
	if (!routeArgs) {
		return null;
	}
	const args = [...routeArgs, "--output", "json", "--since", since];
	const stdout = await runTwg(args, { signal, spawnImpl });
	return parseJsonOrThrow(stdout, args);
}

function hasBetterNodeHydration(nextNode, existingNode) {
	if (!existingNode) return true;
	if (!existingNode.externalUrl && nextNode.externalUrl) return true;
	if (!getNonEmptyString(existingNode.title) && getNonEmptyString(nextNode.title)) return true;
	if (existingNode.title === deriveTitleFromAri(existingNode.id, existingNode.frontmatter?.type) && nextNode.title !== existingNode.title) {
		return true;
	}
	if (!getNonEmptyString(existingNode.bodyPreview) && getNonEmptyString(nextNode.bodyPreview)) return true;
	return false;
}

function mergeTwgNodes(existingNode, nextNode) {
	if (!existingNode) return nextNode;
	const preferNext = hasBetterNodeHydration(nextNode, existingNode);
	const base = preferNext ? { ...existingNode, ...nextNode } : { ...nextNode, ...existingNode };
	return {
		...base,
		connectionCount: 0,
		dangling: Boolean(existingNode.dangling && nextNode.dangling),
		externalUrl: existingNode.externalUrl || nextNode.externalUrl || null,
		frontmatter: {
			...(existingNode.frontmatter && typeof existingNode.frontmatter === "object" ? existingNode.frontmatter : {}),
			...(nextNode.frontmatter && typeof nextNode.frontmatter === "object" ? nextNode.frontmatter : {}),
		},
		label: preferNext && nextNode.label ? nextNode.label : existingNode.label || nextNode.label,
		provider: "twg",
		title: preferNext && nextNode.title ? nextNode.title : existingNode.title || nextNode.title,
	};
}

function mergeTwgExplorers(base, expansion) {
	const nodesById = new Map();
	for (const node of [...(base?.nodes ?? []), ...(expansion?.nodes ?? [])]) {
		if (!node || typeof node.id !== "string") continue;
		nodesById.set(node.id, mergeTwgNodes(nodesById.get(node.id), node));
	}
	return finalizeExplorer(nodesById, [...(base?.edges ?? []), ...(expansion?.edges ?? [])]);
}

function getSupportedExpansionNodes(explorer, rootNodeId, fanoutLimit) {
	const limit = Math.max(0, fanoutLimit);
	return (explorer.nodes ?? [])
		.filter((node) => node.id !== rootNodeId && getTwgContextArgsForNode(node))
		.slice(0, limit);
}

async function buildTwgExplorer({ depth, fanoutLimit, hydrateArtifactTitles = true, signal, since, spawnImpl } = {}) {
	const payload = await fetchContextUser({ signal, since, spawnImpl });
	let explorer = normalizeContextResponse(payload);
	const resolvedDepth = depth === undefined ? getDefaultDepth() : Math.min(2, Math.max(1, Number.parseInt(depth, 10) || 1));
	if (resolvedDepth < 2) {
		return hydrateArtifactTitles ? hydrateTwgArtifactTitles(explorer, { signal, spawnImpl }) : explorer;
	}

	const rootNodeId = payload?.data?.object?.ari;
	const resolvedFanoutLimit = fanoutLimit === undefined ? getFanoutLimit() : Math.max(0, Number.parseInt(fanoutLimit, 10) || 0);
	for (const node of getSupportedExpansionNodes(explorer, rootNodeId, resolvedFanoutLimit)) {
		const expansionPayload = await fetchContextForNode(node, { signal, since, spawnImpl });
		if (!expansionPayload) continue;
		explorer = mergeTwgExplorers(explorer, normalizeContextResponse(expansionPayload));
	}
	return hydrateArtifactTitles ? hydrateTwgArtifactTitles(explorer, { signal, spawnImpl }) : explorer;
}

async function expandTwgExplorerNode({ explorer, hydrateArtifactTitles = true, nodeId, signal, since, spawnImpl } = {}) {
	if (!explorer || typeof explorer !== "object") {
		const error = new Error("Team Work Graph expansion requires a cached explorer.");
		error.code = "TWG_CACHE_REQUIRED";
		throw error;
	}
	const resolvedNodeId = getNonEmptyString(nodeId);
	if (!resolvedNodeId) {
		const error = new Error("A TWG nodeId is required.");
		error.code = "NODE_SELECTION_REQUIRED";
		throw error;
	}
	const node = (explorer.nodes ?? []).find((entry) => entry.id === resolvedNodeId);
	if (!node) {
		const error = new Error(`TWG node not found: ${resolvedNodeId}`);
		error.code = "NODE_NOT_FOUND";
		throw error;
	}

	const routeArgs = getTwgContextArgsForNode(node);
	if (!routeArgs) {
		return {
			addedEdgeCount: 0,
			addedNodeCount: 0,
			expandedNodeId: resolvedNodeId,
			explorer,
		};
	}

	const beforeNodeIds = new Set((explorer.nodes ?? []).map((entry) => entry.id));
	const beforeEdgeIds = new Set((explorer.edges ?? []).map((entry) => entry.id));
	const payload = await fetchContextForNode(node, { signal, since, spawnImpl });
	const merged = mergeTwgExplorers(explorer, normalizeContextResponse(payload));
	const hydrated = hydrateArtifactTitles ? await hydrateTwgArtifactTitles(merged, { signal, spawnImpl }) : merged;
	return {
		addedEdgeCount: hydrated.edges.filter((edge) => !beforeEdgeIds.has(edge.id)).length,
		addedNodeCount: hydrated.nodes.filter((entry) => !beforeNodeIds.has(entry.id)).length,
		expandedNodeId: resolvedNodeId,
		explorer: hydrated,
	};
}

async function fetchSlice(slice, params = {}, { hydrateArtifactTitles = true, signal, spawnImpl } = {}) {
	if (slice === "context-user") {
		return buildTwgExplorer({ hydrateArtifactTitles, signal, since: params.since, spawnImpl });
	}
	throw new Error(`Unknown TWG slice: ${slice}`);
}

module.exports = {
	DEFAULT_TWG_DEPTH,
	DEFAULT_TWG_DEPTH_ENV_KEY,
	DEFAULT_TWG_FANOUT_LIMIT,
	FANOUT_LIMIT_ENV_KEY,
	GENERIC_EDGE_KIND,
	RELATIONSHIP_TO_EDGE_KIND,
	TARGET_TYPE_TO_CONTEXT_ROUTE,
	TARGET_TYPE_TO_NODE_KIND,
	TwgAuthError,
	TwgNotFoundError,
	buildTwgExplorer,
	expandTwgExplorerNode,
	fetchContextForNode,
	fetchContextUser,
	fetchSlice,
	getTwgContextArgsForNode,
	hydrateTwgArtifactTitles,
	mergeTwgExplorers,
	normalizeContextResponse,
};
