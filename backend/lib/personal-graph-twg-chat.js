"use strict";

const { createAIGatewayProvider } = require("./ai-gateway-provider");
const { fetchSlice } = require("./personal-graph-twg-source");

const MAX_TOOL_ROUNDTRIPS = 4;

const SYSTEM_PROMPT = [
	"You are an assistant for a Personal Graph view backed by Atlassian Team Work Graph (TWG).",
	"You can call ONE tool: query_twg(slice, params).",
	"Available slice values: \"context-user\".",
	"Respond ONLY with a single JSON object on a single line. Two shapes are allowed:",
	"  TOOL CALL:  {\"action\":\"tool_call\",\"name\":\"query_twg\",\"arguments\":{\"slice\":\"context-user\",\"params\":{\"since\":\"7d\"}}}",
	"  ANSWER:     {\"action\":\"answer\",\"text\":\"…\",\"nodeIds\":[\"ari:…\",\"ari:…\"]}",
	"Use a tool call to fetch fresh work data when you don't have what you need.",
	"After receiving tool results, return an ANSWER referencing relevant node ARIs from the results in `nodeIds`.",
	"Do not output prose, code fences, or any text outside the JSON object.",
].join("\n");

function tryParseEnvelope(text) {
	if (typeof text !== "string") return null;
	const trimmed = text.trim();
	if (!trimmed) return null;
	const fenced = trimmed.match(/```(?:json)?\s*([\s\S]+?)\s*```/u);
	const candidate = fenced ? fenced[1].trim() : trimmed;
	try {
		const parsed = JSON.parse(candidate);
		if (parsed && typeof parsed === "object" && typeof parsed.action === "string") {
			return parsed;
		}
	} catch {}
	const firstBrace = candidate.indexOf("{");
	const lastBrace = candidate.lastIndexOf("}");
	if (firstBrace >= 0 && lastBrace > firstBrace) {
		try {
			const parsed = JSON.parse(candidate.slice(firstBrace, lastBrace + 1));
			if (parsed && typeof parsed === "object" && typeof parsed.action === "string") {
				return parsed;
			}
		} catch {}
	}
	return null;
}

function summarizeExplorer(explorer) {
	if (!explorer || !Array.isArray(explorer.nodes)) {
		return { count: 0, summary: "(empty)" };
	}
	const byKind = new Map();
	for (const node of explorer.nodes) {
		const key = node.kind ?? "unknown";
		byKind.set(key, (byKind.get(key) ?? 0) + 1);
	}
	const summary = [...byKind.entries()].map(([kind, count]) => `${count} ${kind}`).join(", ");
	return { count: explorer.nodes.length, summary };
}

function compactToolResultForLLM(explorer) {
	if (!explorer || !Array.isArray(explorer.nodes)) return { nodes: [], edges: [] };
	const nodes = explorer.nodes.map((node) => ({
		id: node.id,
		kind: node.kind,
		title: node.title,
		externalUrl: node.externalUrl ?? null,
	}));
	const edges = (explorer.edges ?? []).map((edge) => ({
		source: edge.source,
		target: edge.target,
		kind: edge.kind,
	}));
	return { nodes, edges };
}

function getNodeById(explorer) {
	return new Map((explorer.nodes ?? []).map((node) => [node.id, node]));
}

function getTopEdgeTargets(explorer, edgeKind, limit = 5) {
	const nodesById = getNodeById(explorer);
	const seen = new Set();
	const targets = [];
	for (const edge of explorer.edges ?? []) {
		if (edge.kind !== edgeKind || seen.has(edge.target)) continue;
		const node = nodesById.get(edge.target);
		if (!node || node.kind === "entity") continue;
		seen.add(edge.target);
		targets.push(node);
		if (targets.length >= limit) break;
	}
	return targets;
}

function buildFallbackAnswerFromExplorer(explorer) {
	const sourceNodes = (explorer.nodes ?? []).filter((node) => node.kind !== "entity");
	if (sourceNodes.length === 0) {
		return "I queried TWG, but did not find matching work items for that prompt.";
	}

	const workedOnNodes = getTopEdgeTargets(explorer, "worked-on");
	const mentionedNodes = getTopEdgeTargets(explorer, "mentioned-in", 3);
	const viewedNodes = getTopEdgeTargets(explorer, "viewed", 3);
	const lines = [
		`I queried TWG and found ${sourceNodes.length} related work item${sourceNodes.length === 1 ? "" : "s"}.`,
	];

	if (workedOnNodes.length > 0) {
		lines.push(`Worked on: ${workedOnNodes.map((node) => node.title).join("; ")}.`);
	}
	if (mentionedNodes.length > 0) {
		lines.push(`Mentioned in: ${mentionedNodes.map((node) => node.title).join("; ")}.`);
	}
	if (viewedNodes.length > 0) {
		lines.push(`Also viewed: ${viewedNodes.map((node) => node.title).join("; ")}.`);
	}

	return lines.join("\n");
}

function parseSinceFromPrompt(prompt) {
	const normalized = typeof prompt === "string" ? prompt.toLowerCase() : "";
	const explicit = normalized.match(/\b(?:last|past)\s+(\d+)\s*(day|days|d|week|weeks|w|month|months|m)\b/u)
		?? normalized.match(/\b(\d+)\s*(d|w|m)\b/u);
	if (explicit) {
		const count = explicit[1];
		const unit = explicit[2];
		if (unit.startsWith("w")) return `${count}w`;
		if (unit.startsWith("m")) return `${count}m`;
		return `${count}d`;
	}
	if (/\b(?:last|past)\s+week\b/u.test(normalized)) return "1w";
	if (/\b(?:last|past)\s+month\b/u.test(normalized)) return "1m";
	return "7d";
}

function mergeExplorers(into, addition) {
	if (!addition) return into;
	const seenNodes = new Set(into.nodes.map((node) => node.id));
	for (const node of addition.nodes ?? []) {
		if (!seenNodes.has(node.id)) {
			into.nodes.push(node);
			seenNodes.add(node.id);
		}
	}
	const seenEdges = new Set(into.edges.map((edge) => edge.id));
	for (const edge of addition.edges ?? []) {
		if (!seenEdges.has(edge.id)) {
			into.edges.push(edge);
			seenEdges.add(edge.id);
		}
	}
	return into;
}

function filterExplorerByNodeIds(explorer, nodeIds) {
	if (!Array.isArray(nodeIds) || nodeIds.length === 0) return explorer;
	const wanted = new Set(nodeIds);
	const nodes = explorer.nodes.filter((node) => wanted.has(node.id));
	const nodeIdSet = new Set(nodes.map((node) => node.id));
	const edges = explorer.edges.filter((edge) => nodeIdSet.has(edge.source) && nodeIdSet.has(edge.target));
	return {
		edges,
		generatedAt: explorer.generatedAt,
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

function frame(res, payload) {
	res.write(`${JSON.stringify(payload)}\n`);
}

async function handleDirectTwgChat(req, res, { fetchSliceImpl, prompt }) {
	const params = { since: parseSinceFromPrompt(prompt) };
	frame(res, { type: "thinking", step: 1 });
	frame(res, { type: "tool", name: "query_twg", args: { slice: "context-user", params } });

	let explorer;
	try {
		explorer = await fetchSliceImpl("context-user", params, { signal: req.signal });
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		frame(res, { type: "tool_result", error: errorMessage, count: 0, summary: "(error)" });
		frame(res, { type: "error", error: errorMessage });
		frame(res, { type: "done" });
		res.end();
		return;
	}

	const { count, summary } = summarizeExplorer(explorer);
	frame(res, { type: "tool_result", count, summary });
	frame(res, { type: "text_delta", delta: buildFallbackAnswerFromExplorer(explorer) });
	frame(res, { type: "graph", explorer });
	frame(res, { type: "done" });
	res.end();
}

async function handleTwgChat(req, res, { gateway = null, fetchSliceImpl = fetchSlice, preferGateway = false } = {}) {
	res.writeHead(200, {
		"Cache-Control": "no-cache, no-transform",
		Connection: "keep-alive",
		"Content-Type": "application/x-ndjson; charset=utf-8",
	});

	const incomingMessages = Array.isArray(req.body?.messages) ? req.body.messages : [];
	const userMessages = incomingMessages
		.filter((message) => message && typeof message === "object" && typeof message.content === "string")
		.map((message) => ({
			role: message.role === "assistant" ? "assistant" : "user",
			content: message.content,
		}));

	if (userMessages.length === 0) {
		frame(res, { type: "error", error: "No user messages provided." });
		frame(res, { type: "done" });
		res.end();
		return;
	}

	const latestUserPrompt =
		userMessages.findLast((message) => message.role === "user")?.content ?? userMessages.at(-1)?.content ?? "";
	if (!preferGateway) {
		await handleDirectTwgChat(req, res, { fetchSliceImpl, prompt: latestUserPrompt });
		return;
	}

	const aiGateway = gateway ?? createAIGatewayProvider({ logger: console });
	const accumulated = { edges: [], generatedAt: new Date().toISOString(), nodes: [], stats: {} };
	const conversation = [...userMessages];
	let answerText = "";
	let answerNodeIds = [];
	let bailed = false;

	for (let step = 1; step <= MAX_TOOL_ROUNDTRIPS + 1; step += 1) {
		frame(res, { type: "thinking", step });
		let envelope = null;
		try {
			const text = await aiGateway.generateText({
				maxOutputTokens: 1600,
				messages: conversation,
				signal: req.signal,
				system: SYSTEM_PROMPT,
				temperature: 0.2,
			});
			envelope = tryParseEnvelope(text);
			if (!envelope) {
				conversation.push({
					role: "user",
					content: "Your previous reply was not valid JSON. Reply ONLY with the JSON envelope described in the system message.",
				});
				continue;
			}
		} catch (error) {
			frame(res, { type: "error", error: error instanceof Error ? error.message : String(error) });
			bailed = true;
			break;
		}

		if (envelope.action === "tool_call" && envelope.name === "query_twg") {
			const slice = envelope.arguments?.slice ?? "context-user";
			const params = envelope.arguments?.params ?? {};
			frame(res, { type: "tool", name: "query_twg", args: { slice, params } });
			let toolExplorer;
			try {
				toolExplorer = await fetchSliceImpl(slice, params, { signal: req.signal });
			} catch (error) {
				const errorMessage = error instanceof Error ? error.message : String(error);
				frame(res, { type: "tool_result", error: errorMessage, count: 0, summary: "(error)" });
				conversation.push({
					role: "user",
					content: `Tool error: ${errorMessage}. Decide whether to retry or answer.`,
				});
				continue;
			}
			const { count, summary } = summarizeExplorer(toolExplorer);
			frame(res, { type: "tool_result", count, summary });
			mergeExplorers(accumulated, toolExplorer);
			conversation.push({
				role: "user",
				content: `Tool result for ${slice}: ${JSON.stringify(compactToolResultForLLM(toolExplorer))}`,
			});
			continue;
		}

		if (envelope.action === "answer") {
			answerText = typeof envelope.text === "string" ? envelope.text : "";
			answerNodeIds = Array.isArray(envelope.nodeIds) ? envelope.nodeIds.filter((id) => typeof id === "string") : [];
			break;
		}

		conversation.push({
			role: "user",
			content: "Unrecognized action. Reply with action=tool_call or action=answer.",
		});
	}

	if (!bailed) {
		if (!answerText && accumulated.nodes.length > 0) {
			answerText = buildFallbackAnswerFromExplorer(accumulated);
		}
		if (answerText) {
			frame(res, { type: "text_delta", delta: answerText });
		}
		const focused = filterExplorerByNodeIds(accumulated, answerNodeIds);
		frame(res, { type: "graph", explorer: focused.nodes.length > 0 ? focused : accumulated });
	}
	frame(res, { type: "done" });
	res.end();
}

module.exports = {
	MAX_TOOL_ROUNDTRIPS,
	SYSTEM_PROMPT,
	buildFallbackAnswerFromExplorer,
	filterExplorerByNodeIds,
	handleTwgChat,
	mergeExplorers,
	parseSinceFromPrompt,
	tryParseEnvelope,
};
