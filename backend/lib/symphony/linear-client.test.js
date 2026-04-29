"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const { LinearClient } = require("./linear-client");

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
	assert.equal(body.variables.team, "ENG");
	assert.equal(body.variables.labels, undefined);
	assert.deepEqual(issues.map((issue) => issue.identifier), ["ENG-1"]);
});
