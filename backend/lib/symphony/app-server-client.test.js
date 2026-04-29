"use strict";

const assert = require("node:assert/strict");
const { EventEmitter } = require("node:events");
const { PassThrough } = require("node:stream");
const test = require("node:test");
const { CodexAppServerClient } = require("./app-server-client");

function createFakeChild(onRequest) {
	const child = new EventEmitter();
	child.stdin = new PassThrough();
	child.stdout = new PassThrough();
	child.stderr = new PassThrough();
	child.kill = () => child.emit("exit", 0, null);
	child.stdin.on("data", (chunk) => {
		for (const line of chunk.toString().split("\n")) {
			if (!line.trim()) {
				continue;
			}
			const message = JSON.parse(line);
			onRequest(message, child);
		}
	});
	return child;
}

function createAgentConfig() {
	return {
		agent: {
			approvalPolicy: "never",
			approvalsReviewer: "auto_review",
			model: null,
			reasoningEffort: null,
			sandbox: "workspace-write",
			serviceName: "symphony",
		},
	};
}

test("CodexAppServerClient sends initialize, thread/start, and turn/start requests", async () => {
	const seen = [];
	const child = createFakeChild((message, fakeChild) => {
		seen.push(message);
		if (message.method === "initialize") {
			fakeChild.stdout.write(`${JSON.stringify({ id: message.id, result: { ok: true } })}\n`);
			return;
		}
		if (message.method === "thread/start") {
			fakeChild.stdout.write(`${JSON.stringify({ id: message.id, result: { thread: { id: "thread-1" } } })}\n`);
			return;
		}
		if (message.method === "turn/start") {
			fakeChild.stdout.write(
				`${JSON.stringify({
					id: message.id,
					result: { turn: { id: "turn-1", outputText: "done", status: "completed" } },
				})}\n`,
			);
		}
	});
	const client = new CodexAppServerClient({
		command: "codex app-server",
		spawn: () => child,
	});
	const config = createAgentConfig();

	await client.initialize();
	await client.startThread({ config, cwd: "/repo/worktree", developerInstructions: "Do the work.", issue: { identifier: "ENG-1" } });
	const result = await client.runTurn({ config, cwd: "/repo/worktree", input: "Fix ENG-1" });

	assert.equal(result.threadId, "thread-1");
	assert.equal(result.turnId, "turn-1");
	assert.equal(result.text, "done");
	assert.equal(seen[1].method, "thread/start");
	assert.equal(seen[1].params.approvalPolicy, "never");
	assert.deepEqual(seen[1].params.dynamicTools.map((tool) => tool.name), [
		"linear_graphql",
		"linear_issue_get",
		"linear_workpad_upsert",
		"linear_state_set",
	]);
	assert.equal(seen[1].params.dynamicTools[0].inputSchema.required[0], "query");
	assert.equal(seen[1].params.experimentalRawEvents, false);
	assert.equal(seen[2].params.input[0].text, "Fix ENG-1");
	assert.deepEqual(seen[2].params.input[0].text_elements, []);
});

test("CodexAppServerClient includes JSON-RPC error details", async () => {
	const child = createFakeChild((message, fakeChild) => {
		fakeChild.stdout.write(
			`${JSON.stringify({
				id: message.id,
				error: { code: -32602, message: "missing field `experimentalRawEvents`" },
			})}\n`,
		);
	});
	const client = new CodexAppServerClient({ spawn: () => child });

	await assert.rejects(() => client.initialize(), /missing field `experimentalRawEvents`/);
});

test("CodexAppServerClient handles Symphony dynamic Linear tool calls", async () => {
	const responses = [];
	const child = createFakeChild((message) => {
		responses.push(message);
	});
	const client = new CodexAppServerClient({
		config: {
			tracker: {
				doneState: "Done",
				landingStates: ["Merging"],
				mergeState: "Merging",
				terminalStates: ["Done"],
			},
		},
		issue: { id: "issue-1", identifier: "ENG-1" },
		linearClient: {
			async getIssue(issueId) {
				return { id: issueId, identifier: "ENG-1" };
			},
			async linearGraphql(query, variables) {
				return { query, variables };
			},
			async updateIssueState(issueId, stateName) {
				return { id: issueId, stateName };
			},
			async upsertWorkpadComment(issueId, body) {
				return { body, id: "comment-1", issueId };
			},
		},
		spawn: () => child,
	});
	client.start();

	client.handleLine(
		JSON.stringify({
			id: 7,
			method: "item/tool/call",
			params: {
				arguments: { query: "query Test", variables: { id: "1" } },
				namespace: "symphony",
				tool: "linear_graphql",
			},
		}),
	);
	client.handleLine(
		JSON.stringify({
			id: 8,
			method: "item/tool/call",
			params: {
				arguments: JSON.stringify({ query: "query Comments", variables: { issueId: "issue-1" } }),
				tool: "linear_graphql",
			},
		}),
	);
	client.handleLine(
		JSON.stringify({
			id: 9,
			method: "item/tool/call",
			params: {
				arguments: {},
				tool: "linear_issue_get",
			},
		}),
	);
	client.handleLine(
		JSON.stringify({
			id: 10,
			method: "item/tool/call",
			params: {
				arguments: { body: "## Codex Workpad\nState" },
				tool: "linear_workpad_upsert",
			},
		}),
	);
	client.handleLine(
		JSON.stringify({
			id: 11,
			method: "item/tool/call",
			params: {
				arguments: { stateName: "Human Review" },
				tool: "linear_state_set",
			},
		}),
	);
	client.handleLine(
		JSON.stringify({
			id: 12,
			method: "item/tool/call",
			params: {
				arguments: { stateName: "Merging" },
				tool: "linear_state_set",
			},
		}),
	);

	await new Promise((resolve) => setImmediate(resolve));
	responses.sort((left, right) => left.id - right.id);
	assert.equal(responses.length, 6);
	assert.equal(responses[0].id, 7);
	assert.equal(responses[0].result.success, true);
	assert.match(responses[0].result.contentItems[0].text, /query Test/);
	assert.equal(responses[1].id, 8);
	assert.equal(responses[1].result.success, true);
	assert.match(responses[1].result.contentItems[0].text, /query Comments/);
	assert.equal(responses[2].id, 9);
	assert.match(responses[2].result.contentItems[0].text, /ENG-1/);
	assert.equal(responses[3].id, 10);
	assert.match(responses[3].result.contentItems[0].text, /Codex Workpad/);
	assert.equal(responses[4].id, 11);
	assert.match(responses[4].result.contentItems[0].text, /Human Review/);
	assert.equal(responses[5].id, 12);
	assert.equal(responses[5].result.success, false);
	assert.match(responses[5].result.contentItems[0].text, /reserved/);
});

test("CodexAppServerClient waits for asynchronous turn/completed notification", async () => {
	const child = createFakeChild((message, fakeChild) => {
		if (message.method === "initialize") {
			fakeChild.stdout.write(`${JSON.stringify({ id: message.id, result: {} })}\n`);
			return;
		}
		if (message.method === "thread/start") {
			fakeChild.stdout.write(`${JSON.stringify({ id: message.id, result: { thread: { id: "thread-async" } } })}\n`);
			return;
		}
		if (message.method === "turn/start") {
			fakeChild.stdout.write(`${JSON.stringify({ id: message.id, result: { turn: { id: "turn-async", status: "running" } } })}\n`);
			setImmediate(() => {
				fakeChild.stdout.write(
					`${JSON.stringify({
						method: "item/agentMessage/delta",
						params: { threadId: "thread-async", turnId: "turn-async", itemId: "item-1", delta: "async " },
					})}\n`,
				);
				fakeChild.stdout.write(
					`${JSON.stringify({
						method: "item/agentMessage/delta",
						params: { threadId: "thread-async", turnId: "turn-async", itemId: "item-1", delta: "done" },
					})}\n`,
				);
				fakeChild.stdout.write(
					`${JSON.stringify({
						method: "turn/completed",
						params: { threadId: "thread-async", turn: { id: "turn-async", items: [], status: "completed" } },
					})}\n`,
				);
			});
		}
	});
	const client = new CodexAppServerClient({ spawn: () => child });
	const config = createAgentConfig();

	await client.initialize();
	await client.startThread({ config, cwd: "/repo", developerInstructions: "", issue: { identifier: "ENG-2" } });
	const result = await client.runTurn({ config, cwd: "/repo", input: "go" });

	assert.equal(result.text, "async done");
	assert.equal(result.success, true);
});

test("CodexAppServerClient rejects pending turn wait when app-server exits", async () => {
	const child = createFakeChild((message, fakeChild) => {
		if (message.method === "thread/start") {
			fakeChild.stdout.write(`${JSON.stringify({ id: message.id, result: { thread: { id: "thread-stop" } } })}\n`);
			return;
		}
		if (message.method === "turn/start") {
			fakeChild.stdout.write(`${JSON.stringify({ id: message.id, result: { turn: { id: "turn-stop", status: "running" } } })}\n`);
			setImmediate(() => fakeChild.emit("exit", null, "SIGTERM"));
		}
	});
	const client = new CodexAppServerClient({ spawn: () => child });
	const config = createAgentConfig();

	await client.startThread({ config, cwd: "/repo", developerInstructions: "", issue: { identifier: "ENG-3" } });
	await assert.rejects(
		() => client.runTurn({ config, cwd: "/repo", input: "stop" }),
		/Codex app-server stopped before turn completed/,
	);
});
