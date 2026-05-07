"use strict";

const { spawn } = require("node:child_process");

const TWG_BIN = process.env.TWG_BIN || "twg";

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
	["LoomVideo", "source"],
	["LoomMeeting", "source"],
]);

function prettifyType(type) {
	if (!type) return "Item";
	return String(type).replace(/([a-z])([A-Z])/gu, "$1 $2");
}

function deriveTitleFromAri(ari, type) {
	if (typeof ari !== "string" || !ari) return prettifyType(type);
	const tail = ari.split("/").filter(Boolean).at(-1) ?? ari;
	return `${prettifyType(type)} ${tail}`;
}

function mapTargetToNode(target) {
	if (!target || typeof target !== "object" || typeof target.ari !== "string" || !target.ari) {
		return null;
	}
	const kind = TARGET_TYPE_TO_NODE_KIND.get(target.type) ?? "source";
	const name = typeof target.name === "string" && target.name.trim() ? target.name.trim() : null;
	const title = name ?? deriveTitleFromAri(target.ari, target.type);
	const externalUrl = typeof target.url === "string" && target.url.trim() ? target.url.trim() : null;
	return {
		bodyPreview: name ? "" : prettifyType(target.type),
		connectionCount: 0,
		dangling: false,
		externalUrl,
		frontmatter: { ari: target.ari, type: target.type ?? null },
		id: target.ari,
		kind,
		label: title,
		missing: false,
		path: null,
		provider: "twg",
		relativePath: target.ari,
		size: 1,
		slug: encodeURIComponent(target.ari),
		title,
		updatedAt: null,
	};
}

function buildEdge(sourceId, targetId, edgeKind, relationshipName) {
	return {
		id: `${edgeKind}:${sourceId}->${targetId}`,
		kind: edgeKind,
		label: relationshipName.replace(/^atlassian_user_/u, "").replace(/_/gu, " "),
		metadata: { relationship: relationshipName },
		relationKinds: [edgeKind],
		source: sourceId,
		target: targetId,
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

	const rootNode = {
		bodyPreview: "",
		connectionCount: 0,
		dangling: false,
		externalUrl: null,
		frontmatter: { ari: rootObject.ari, type: rootObject.type ?? null },
		id: rootObject.ari,
		kind: "entity",
		label: rootObject.name ?? "You",
		missing: false,
		path: null,
		provider: "twg",
		relativePath: rootObject.ari,
		size: 1,
		slug: encodeURIComponent(rootObject.ari),
		title: rootObject.name ?? "You",
		updatedAt: null,
	};

	const nodesById = new Map([[rootNode.id, rootNode]]);
	const edges = [];
	const droppedRelationships = new Set();

	const relationships = Array.isArray(data.relationshipSummary) ? data.relationshipSummary : [];
	for (const relationship of relationships) {
		if (!relationship || typeof relationship.relationshipName !== "string") continue;
		const edgeKind = RELATIONSHIP_TO_EDGE_KIND.get(relationship.relationshipName);
		if (!edgeKind) {
			droppedRelationships.add(relationship.relationshipName);
			continue;
		}
		const targets = Array.isArray(relationship.targets) ? relationship.targets : [];
		for (const target of targets) {
			const node = mapTargetToNode(target);
			if (!node) continue;
			const existing = nodesById.get(node.id);
			if (!existing) {
				nodesById.set(node.id, node);
			}
			edges.push(buildEdge(rootNode.id, node.id, edgeKind, relationship.relationshipName));
		}
	}

	for (const droppedName of droppedRelationships) {
		console.warn(`[personal-graph-twg] dropping unmapped relationship: ${droppedName}`);
	}

	for (const edge of edges) {
		const sourceNode = nodesById.get(edge.source);
		const targetNode = nodesById.get(edge.target);
		if (sourceNode) sourceNode.connectionCount += 1;
		if (targetNode) targetNode.connectionCount += 1;
	}

	const nodes = [...nodesById.values()];
	return {
		edges,
		generatedAt: new Date().toISOString(),
		nodes,
		stats: {
			danglingCount: 0,
			edgeCount: edges.length,
			nodeCount: nodes.length,
			rawCount: 0,
			wikiCount: nodes.filter((node) => node.kind !== "entity").length,
		},
	};
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

async function buildTwgExplorer({ signal, since, spawnImpl } = {}) {
	const payload = await fetchContextUser({ signal, since, spawnImpl });
	return normalizeContextResponse(payload);
}

async function fetchSlice(slice, params = {}, { signal, spawnImpl } = {}) {
	if (slice === "context-user") {
		return buildTwgExplorer({ signal, since: params.since, spawnImpl });
	}
	throw new Error(`Unknown TWG slice: ${slice}`);
}

module.exports = {
	RELATIONSHIP_TO_EDGE_KIND,
	TARGET_TYPE_TO_NODE_KIND,
	TwgAuthError,
	TwgNotFoundError,
	buildTwgExplorer,
	fetchContextUser,
	fetchSlice,
	normalizeContextResponse,
};
