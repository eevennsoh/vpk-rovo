"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");

const {
	MAX_TOOL_ROUNDTRIPS,
	buildFallbackAnswerFromExplorer,
	filterExplorerByNodeIds,
	handleTwgChat,
	mergeExplorers,
	parseSinceFromPrompt,
	tryParseEnvelope,
} = require("./personal-graph-twg-chat");

function createMockRes() {
	const chunks = [];
	let ended = false;
	let headers = null;
	const res = {
		writeHead(status, h) {
			headers = { status, ...h };
		},
		write(chunk) {
			chunks.push(String(chunk));
		},
		end() {
			ended = true;
		},
		get headersSent() {
			return headers !== null;
		},
	};
	res.frames = () => chunks
		.join("")
		.split("\n")
		.filter(Boolean)
		.map((line) => JSON.parse(line));
	res.getEnded = () => ended;
	res.getHeaders = () => headers;
	return res;
}

function createMockGateway(scriptedReplies) {
	let callIndex = 0;
	const calls = [];
	return {
		generateText(args) {
			calls.push(args);
			const reply = scriptedReplies[callIndex] ?? "";
			callIndex += 1;
			if (typeof reply === "function") return Promise.resolve(reply(args));
			return Promise.resolve(reply);
		},
		calls: () => calls,
	};
}

test("tryParseEnvelope parses raw JSON, ```json fences, and recovers from trailing text", () => {
	assert.deepEqual(
		tryParseEnvelope('{"action":"answer","text":"hi"}'),
		{ action: "answer", text: "hi" },
	);
	assert.deepEqual(
		tryParseEnvelope('```json\n{"action":"answer","text":"hi"}\n```'),
		{ action: "answer", text: "hi" },
	);
	assert.deepEqual(
		tryParseEnvelope('Sure! {"action":"answer","text":"hi"}'),
		{ action: "answer", text: "hi" },
	);
	assert.equal(tryParseEnvelope("just words, no json"), null);
});

test("mergeExplorers dedupes by node id and edge id", () => {
	const into = { nodes: [{ id: "a" }], edges: [{ id: "e1" }] };
	mergeExplorers(into, { nodes: [{ id: "a" }, { id: "b" }], edges: [{ id: "e1" }, { id: "e2" }] });
	assert.deepEqual(into.nodes.map((node) => node.id), ["a", "b"]);
	assert.deepEqual(into.edges.map((edge) => edge.id), ["e1", "e2"]);
});

test("filterExplorerByNodeIds keeps only requested ids and edges between them", () => {
	const explorer = {
		generatedAt: "t",
		nodes: [{ id: "a", kind: "entity" }, { id: "b", kind: "source" }, { id: "c", kind: "source" }],
		edges: [
			{ id: "ab", source: "a", target: "b" },
			{ id: "bc", source: "b", target: "c" },
		],
	};
	const filtered = filterExplorerByNodeIds(explorer, ["a", "b"]);
	assert.deepEqual(filtered.nodes.map((node) => node.id), ["a", "b"]);
	assert.deepEqual(filtered.edges.map((edge) => edge.id), ["ab"]);
});

test("buildFallbackAnswerFromExplorer summarizes TWG work graph results", () => {
	const answer = buildFallbackAnswerFromExplorer({
		edges: [
			{ id: "e1", source: "u", target: "issue-1", kind: "worked-on" },
			{ id: "e2", source: "u", target: "page-1", kind: "mentioned-in" },
			{ id: "e3", source: "u", target: "video-1", kind: "viewed" },
		],
		nodes: [
			{ id: "u", title: "Me", kind: "entity" },
			{ id: "issue-1", title: "Ship TWG prompt submit", kind: "source" },
			{ id: "page-1", title: "Personal Graph plan", kind: "source" },
			{ id: "video-1", title: "Team Work Graph demo", kind: "source" },
		],
	});
	assert.match(answer, /found 3 related work items/u);
	assert.match(answer, /Worked on: Ship TWG prompt submit/u);
	assert.match(answer, /Mentioned in: Personal Graph plan/u);
	assert.match(answer, /Also viewed: Team Work Graph demo/u);
});

test("parseSinceFromPrompt extracts the TWG lookback window from natural prompts", () => {
	assert.equal(parseSinceFromPrompt("show me what I worked on for the last 7 days"), "7d");
	assert.equal(parseSinceFromPrompt("summarize the past 2 weeks"), "2w");
	assert.equal(parseSinceFromPrompt("what changed last month?"), "1m");
	assert.equal(parseSinceFromPrompt("what did I work on?"), "7d");
});

test("handleTwgChat: default path queries TWG directly and streams a visible answer", async () => {
	const fakeExplorer = {
		edges: [{ id: "e1", source: "u", target: "ari:cloud:jira:c1:issue/1", kind: "worked-on" }],
		generatedAt: "2026-05-07",
		nodes: [
			{ id: "u", title: "Me", kind: "entity", externalUrl: null },
			{ id: "ari:cloud:jira:c1:issue/1", title: "ISSUE-1", kind: "source", externalUrl: "https://x" },
		],
		stats: { nodeCount: 2 },
	};
	const calls = [];
	const fetchSliceImpl = async (slice, params) => {
		calls.push({ params, slice });
		return fakeExplorer;
	};
	const req = { body: { messages: [{ role: "user", content: "show me what I worked on for the last 7 days" }] }, signal: undefined };
	const res = createMockRes();
	await handleTwgChat(req, res, { fetchSliceImpl });

	assert.deepEqual(calls, [{ slice: "context-user", params: { since: "7d" } }]);
	const frames = res.frames();
	assert.deepEqual(frames.map((frame) => frame.type), ["thinking", "tool", "tool_result", "text_delta", "graph", "done"]);
	assert.equal(frames.find((frame) => frame.type === "tool").args.params.since, "7d");
	assert.match(frames.find((frame) => frame.type === "text_delta").delta, /Worked on: ISSUE-1/u);
	assert.equal(res.getEnded(), true);
});

test("handleTwgChat: tool_call → tool_result → answer streams the expected NDJSON frames", async () => {
	const gateway = createMockGateway([
		'{"action":"tool_call","name":"query_twg","arguments":{"slice":"context-user","params":{}}}',
		'{"action":"answer","text":"You worked on 2 issues.","nodeIds":["ari:cloud:jira:c1:issue/1"]}',
	]);
	const fakeExplorer = {
		edges: [{ id: "e1", source: "u", target: "ari:cloud:jira:c1:issue/1", kind: "worked-on" }],
		generatedAt: "2026-05-07",
		nodes: [
			{ id: "u", title: "Me", kind: "entity", externalUrl: null },
			{ id: "ari:cloud:jira:c1:issue/1", title: "ISSUE-1", kind: "source", externalUrl: "https://x" },
		],
		stats: { nodeCount: 2 },
	};
	const fetchSliceImpl = async () => fakeExplorer;
	const req = { body: { messages: [{ role: "user", content: "what did i work on?" }] }, signal: undefined };
	const res = createMockRes();
	await handleTwgChat(req, res, { gateway, fetchSliceImpl, preferGateway: true });

	const frames = res.frames();
	const types = frames.map((frame) => frame.type);
	assert.deepEqual(types, ["thinking", "tool", "tool_result", "thinking", "text_delta", "graph", "done"]);
	const toolFrame = frames.find((frame) => frame.type === "tool");
	assert.equal(toolFrame.name, "query_twg");
	assert.equal(toolFrame.args.slice, "context-user");
	const textDelta = frames.find((frame) => frame.type === "text_delta");
	assert.equal(textDelta.delta, "You worked on 2 issues.");
	const graph = frames.find((frame) => frame.type === "graph");
	assert.equal(graph.explorer.nodes.length, 1);
	assert.equal(graph.explorer.nodes[0].id, "ari:cloud:jira:c1:issue/1");
	assert.equal(res.getEnded(), true);
});

test("handleTwgChat: falls back to a visible answer when TWG data arrives without an AI answer", async () => {
	const gateway = createMockGateway([
		'{"action":"tool_call","name":"query_twg","arguments":{"slice":"context-user","params":{}}}',
		'{"action":"tool_call","name":"query_twg","arguments":{"slice":"context-user","params":{}}}',
		'{"action":"tool_call","name":"query_twg","arguments":{"slice":"context-user","params":{}}}',
		'{"action":"tool_call","name":"query_twg","arguments":{"slice":"context-user","params":{}}}',
		'{"action":"tool_call","name":"query_twg","arguments":{"slice":"context-user","params":{}}}',
	]);
	const fakeExplorer = {
		edges: [{ id: "e1", source: "u", target: "ari:cloud:jira:c1:issue/1", kind: "worked-on" }],
		generatedAt: "2026-05-07",
		nodes: [
			{ id: "u", title: "Me", kind: "entity", externalUrl: null },
			{ id: "ari:cloud:jira:c1:issue/1", title: "ISSUE-1", kind: "source", externalUrl: "https://x" },
		],
		stats: { nodeCount: 2 },
	};
	const req = { body: { messages: [{ role: "user", content: "show me what I worked on" }] }, signal: undefined };
	const res = createMockRes();
	await handleTwgChat(req, res, { gateway, fetchSliceImpl: async () => fakeExplorer, preferGateway: true });

	const frames = res.frames();
	const textDelta = frames.find((frame) => frame.type === "text_delta");
	assert.match(textDelta.delta, /I queried TWG and found 1 related work item/u);
	assert.match(textDelta.delta, /Worked on: ISSUE-1/u);
	assert.equal(frames.at(-1).type, "done");
});

test("handleTwgChat: malformed first reply triggers a JSON-only nudge, then answer", async () => {
	const gateway = createMockGateway([
		"oops not json",
		'{"action":"answer","text":"sorry, fixed.","nodeIds":[]}',
	]);
	const req = { body: { messages: [{ role: "user", content: "hi" }] }, signal: undefined };
	const res = createMockRes();
	await handleTwgChat(req, res, { gateway, fetchSliceImpl: async () => ({ nodes: [], edges: [] }), preferGateway: true });

	const types = res.frames().map((frame) => frame.type);
	assert.deepEqual(types, ["thinking", "thinking", "text_delta", "graph", "done"]);
	const calls = gateway.calls();
	assert.equal(calls.length, 2);
	const second = calls[1];
	const lastUser = second.messages.at(-1);
	assert.match(lastUser.content, /not valid JSON/u);
});

test("handleTwgChat: bails after MAX_TOOL_ROUNDTRIPS+1 attempts", async () => {
	const replies = Array.from({ length: MAX_TOOL_ROUNDTRIPS + 2 }, () => "still not json");
	const gateway = createMockGateway(replies);
	const req = { body: { messages: [{ role: "user", content: "hi" }] }, signal: undefined };
	const res = createMockRes();
	await handleTwgChat(req, res, { gateway, fetchSliceImpl: async () => ({ nodes: [], edges: [] }), preferGateway: true });
	const frames = res.frames();
	const thinking = frames.filter((frame) => frame.type === "thinking");
	assert.equal(thinking.length, MAX_TOOL_ROUNDTRIPS + 1);
	const last = frames.at(-1);
	assert.equal(last.type, "done");
});

test("handleTwgChat: empty messages → error frame", async () => {
	const req = { body: { messages: [] }, signal: undefined };
	const res = createMockRes();
	await handleTwgChat(req, res, { gateway: createMockGateway([]), fetchSliceImpl: async () => ({}) });
	const frames = res.frames();
	assert.equal(frames[0].type, "error");
	assert.equal(frames.at(-1).type, "done");
});

test("handleTwgChat: tool error becomes a tool_result with error, loop continues", async () => {
	const gateway = createMockGateway([
		'{"action":"tool_call","name":"query_twg","arguments":{"slice":"context-user","params":{}}}',
		'{"action":"answer","text":"unable to fetch","nodeIds":[]}',
	]);
	const fetchSliceImpl = async () => { throw new Error("twg unreachable"); };
	const req = { body: { messages: [{ role: "user", content: "hi" }] }, signal: undefined };
	const res = createMockRes();
	await handleTwgChat(req, res, { gateway, fetchSliceImpl, preferGateway: true });
	const frames = res.frames();
	const toolResult = frames.find((frame) => frame.type === "tool_result");
	assert.equal(toolResult.error, "twg unreachable");
	const text = frames.find((frame) => frame.type === "text_delta");
	assert.equal(text.delta, "unable to fetch");
});
