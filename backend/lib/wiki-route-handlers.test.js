"use strict";

const assert = require("node:assert/strict");
const http = require("node:http");
const test = require("node:test");
const express = require("express");

const {
	createWikiRouteHandlers,
} = require("./wiki-route-handlers");

async function withServer(registerRoutes, run) {
	const app = express();
	app.use(express.json());
	registerRoutes(app);

	const server = http.createServer(app);
	await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
	const address = server.address();
	const baseUrl = `http://127.0.0.1:${address.port}`;

	try {
		await run(baseUrl);
	} finally {
		await new Promise((resolve, reject) => {
			server.close((error) => {
				if (error) {
					reject(error);
					return;
				}
				resolve();
			});
		});
	}
}

function createTestHandlers(overrides = {}) {
	return createWikiRouteHandlers({
		ensureFreshWikiQmdIndexImpl: async () => ({
			didSync: false,
			reason: "fresh",
			summary: {
				collections: ["wiki-entities"],
				dbExists: true,
				dbPath: "/tmp/wiki.sqlite",
				errorMessage: null,
				lastSyncedAt: "2026-04-12T00:00:00.000Z",
				latestCanonicalUpdateAt: "2026-04-12T00:00:00.000Z",
				needsEmbedding: 0,
				stale: false,
				totalDocuments: 1,
			},
		}),
		getQmdSyncSummaryImpl: async () => ({
			collections: ["wiki-entities"],
			dbExists: true,
			dbPath: "/tmp/wiki.sqlite",
			errorMessage: null,
			lastSyncedAt: "2026-04-12T00:00:00.000Z",
			latestCanonicalUpdateAt: "2026-04-12T00:00:00.000Z",
			needsEmbedding: 0,
			stale: false,
			totalDocuments: 1,
		}),
		getWikiStatusImpl: async () => ({
			canonicalCounts: {},
			compiledContexts: {},
			files: {},
			generatedAt: "2026-04-12T00:00:00.000Z",
			hasWikiDigestEntry: false,
			proposalCounts: { ingested: 0, queued: 0, total: 0 },
			rawCounts: {},
			recentProposals: [],
			totalCanonicalPages: 0,
			totalRawCaptures: 0,
			wikiDir: "/tmp/wiki",
		}),
		logger: { warn() {} },
		normalizeNaiveWikiSearchResultsImpl: (results) => results,
		queryWikiImpl: async () => ({ results: [] }),
		searchWikiWithQmdImpl: async () => [],
		syncWikiMemoryImpl: async () => ({
			errors: [],
			processed: 0,
			updatedScopes: [],
		}),
		...overrides,
	});
}

test("GET /api/wiki/search returns 400 when query is missing", async () => {
	const handlers = createTestHandlers();

	await withServer((app) => {
		app.get("/api/wiki/search", handlers.handleWikiSearch);
	}, async (baseUrl) => {
		const response = await fetch(`${baseUrl}/api/wiki/search`);
		const payload = await response.json();

		assert.equal(response.status, 400);
		assert.equal(payload.error, "A wiki search query is required.");
	});
});

test("GET /api/wiki/search returns qmd results after freshness check", async () => {
	const freshnessCalls = [];
	const searchCalls = [];
	const handlers = createTestHandlers({
		ensureFreshWikiQmdIndexImpl: async (input) => {
			freshnessCalls.push(input);
			return {
				didSync: false,
				reason: "fresh",
				summary: {
					collections: ["wiki-entities"],
					dbExists: true,
					dbPath: "/tmp/wiki.sqlite",
					errorMessage: null,
					lastSyncedAt: "2026-04-12T00:00:00.000Z",
					latestCanonicalUpdateAt: "2026-04-12T00:00:00.000Z",
					needsEmbedding: 0,
					stale: false,
					totalDocuments: 1,
				},
			};
		},
		searchWikiWithQmdImpl: async (query, options) => {
			searchCalls.push({ options, query });
			return [{
				backend: "qmd",
				collection: "wiki-entities",
				path: "qmd://wiki-entities/atlassian.md",
				score: 0.7,
				snippet: "Atlassian result",
				title: "Atlassian",
			}];
		},
	});

	await withServer((app) => {
		app.get("/api/wiki/search", handlers.handleWikiSearch);
	}, async (baseUrl) => {
		const response = await fetch(`${baseUrl}/api/wiki/search?q=atlassian&limit=5`);
		const payload = await response.json();

		assert.equal(response.status, 200);
		assert.equal(payload.backend, "qmd");
		assert.deepEqual(payload.results, [{
			backend: "qmd",
			collection: "wiki-entities",
			path: "qmd://wiki-entities/atlassian.md",
			score: 0.7,
			snippet: "Atlassian result",
			title: "Atlassian",
		}]);
		assert.equal(freshnessCalls.length, 1);
		assert.deepEqual(searchCalls, [{
			options: { limit: 5 },
			query: "atlassian",
		}]);
	});
});

test("GET /api/wiki/search falls back to naive search when qmd fails", async () => {
	const fallbackCalls = [];
	const handlers = createTestHandlers({
		ensureFreshWikiQmdIndexImpl: async () => {
			throw new Error("qmd unavailable");
		},
		normalizeNaiveWikiSearchResultsImpl: (results) => results.map((result) => ({
			...result,
			backend: "naive",
		})),
		queryWikiImpl: async (query, options) => {
			fallbackCalls.push({ options, query });
			return {
				results: [{
					collection: "wiki-entities",
					path: "/tmp/wiki/entities/atlassian.md",
					score: 1,
					snippet: "Fallback result",
					title: "Atlassian",
				}],
			};
		},
	});

	await withServer((app) => {
		app.get("/api/wiki/search", handlers.handleWikiSearch);
	}, async (baseUrl) => {
		const response = await fetch(`${baseUrl}/api/wiki/search?q=atlassian`);
		const payload = await response.json();

		assert.equal(response.status, 200);
		assert.equal(payload.backend, "naive");
		assert.deepEqual(payload.results, [{
			backend: "naive",
			collection: "wiki-entities",
			path: "/tmp/wiki/entities/atlassian.md",
			score: 1,
			snippet: "Fallback result",
			title: "Atlassian",
		}]);
		assert.deepEqual(fallbackCalls, [{
			options: { limit: 10 },
			query: "atlassian",
		}]);
	});
});

test("POST /api/wiki/sync returns both wiki memory sync status and qmd status", async () => {
	const memorySyncCalls = [];
	const qmdSyncCalls = [];
	const handlers = createTestHandlers({
		ensureFreshWikiQmdIndexImpl: async (input) => {
			qmdSyncCalls.push(input);
			return {
				didSync: true,
				reason: "forced",
				summary: {
					collections: ["wiki-profiles"],
					dbExists: true,
					dbPath: "/tmp/wiki.sqlite",
					errorMessage: null,
					lastSyncedAt: "2026-04-12T00:00:00.000Z",
					latestCanonicalUpdateAt: "2026-04-12T00:00:00.000Z",
					needsEmbedding: 0,
					stale: false,
					totalDocuments: 2,
				},
			};
		},
		syncWikiMemoryImpl: async (input) => {
			memorySyncCalls.push(input);
			return {
				errors: [],
				processed: 2,
				updatedScopes: ["profile", "operations"],
			};
		},
	});

	await withServer((app) => {
		app.post("/api/wiki/sync", handlers.handleWikiSync);
	}, async (baseUrl) => {
		const response = await fetch(`${baseUrl}/api/wiki/sync`, {
			body: JSON.stringify({ force: true }),
			headers: {
				"Content-Type": "application/json",
			},
			method: "POST",
		});
		const payload = await response.json();

		assert.equal(response.status, 200);
		assert.equal(memorySyncCalls.length, 1);
		assert.equal(memorySyncCalls[0].force, true);
		assert.equal(qmdSyncCalls.length, 1);
		assert.equal(payload.memory.processed, 2);
		assert.equal(payload.qmd.totalDocuments, 2);
		assert.equal(payload.sync.didSync, true);
	});
});
