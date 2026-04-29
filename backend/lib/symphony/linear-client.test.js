"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const { LinearClient, findWorkpadComment } = require("./linear-client");

test("LinearClient filters configured labels client-side after GraphQL state query", async () => {
	const requests = [];
	const client = new LinearClient({
		apiKey: "lin_123",
		fetchImpl: async (url, request) => {
			requests.push({ request, url });
			return {
				ok: true,
				status: 200,
				async text() {
					return JSON.stringify({
						data: {
							issues: {
								nodes: [
									{
										id: "1",
										identifier: "ENG-1",
										comments: {
											nodes: [
												{
													body: "Needs the review note too.",
													createdAt: "2026-04-29T01:00:00.000Z",
													id: "comment-1",
													updatedAt: "2026-04-29T01:00:00.000Z",
													user: { email: "reviewer@example.com", id: "user-1", name: "Reviewer" },
												},
											],
										},
										labels: { nodes: [{ name: "symphony" }] },
										state: { name: "Todo" },
										title: "Run me",
									},
									{
										id: "2",
										identifier: "ENG-2",
										labels: { nodes: [{ name: "other" }] },
										state: { name: "Todo" },
										title: "Skip me",
									},
								],
							},
						},
					});
				},
			};
		},
	});

	const issues = await client.searchIssues({
		activeStates: ["Todo"],
		labels: ["symphony"],
		team: "ENG",
	});

	const body = JSON.parse(requests[0].request.body);
	assert.equal(requests[0].request.headers.Authorization, "lin_123");
	assert.match(body.query, /comments\(last: 25, orderBy: createdAt\)/);
	assert.equal(body.variables.team, "ENG");
	assert.deepEqual(body.variables.stateNames, ["Todo"]);
	assert.equal(body.variables.labels, undefined);
	assert.deepEqual(issues.map((issue) => issue.identifier), ["ENG-1"]);
	assert.deepEqual(issues[0].comments, [
		{
			body: "Needs the review note too.",
			createdAt: "2026-04-29T01:00:00.000Z",
			id: "comment-1",
			updatedAt: "2026-04-29T01:00:00.000Z",
			user: { email: "reviewer@example.com", id: "user-1", name: "Reviewer" },
		},
	]);
});

test("findWorkpadComment finds the single Codex workpad comment", () => {
	assert.equal(findWorkpadComment([{ body: "Note" }, { id: "c1", body: "## Codex Workpad\nState" }]).id, "c1");
	assert.equal(findWorkpadComment([{ body: "# Codex Workpad" }]), null);
});

test("LinearClient upserts an existing Codex workpad comment", async () => {
	const requests = [];
	const client = new LinearClient({
		apiKey: "lin_123",
		fetchImpl: async (_url, request) => {
			const body = JSON.parse(request.body);
			requests.push(body);
			if (/query SymphonyIssue/.test(body.query)) {
				return {
					ok: true,
					status: 200,
					async text() {
						return JSON.stringify({
							data: {
								issue: {
									id: "issue-1",
									identifier: "ENG-1",
									comments: { nodes: [{ id: "comment-1", body: "## Codex Workpad\nOld" }] },
									labels: { nodes: [] },
									state: { name: "Todo" },
								},
							},
						});
					},
				};
			}
			return {
				ok: true,
				status: 200,
				async text() {
					return JSON.stringify({
						data: {
							commentUpdate: {
								comment: { id: "comment-1", body: "## Codex Workpad\nNew", updatedAt: "2026-04-29T00:00:00.000Z" },
							},
						},
					});
				},
			};
		},
	});

	const comment = await client.upsertWorkpadComment("issue-1", "## Codex Workpad\nNew");

	assert.equal(comment.id, "comment-1");
	assert.match(requests[1].query, /commentUpdate/);
	assert.equal(requests[1].variables.commentId, "comment-1");
});
