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
		deleteWikiMemoryBlockImpl: async ({ blockId, revision, scope }) => ({
			memories: {
				operations: {
					blocks: [],
					canonicalPath: "/tmp/wiki/operations/core-memory.md",
					compiledContext: {
						charCount: 18,
						exists: true,
						path: "/tmp/wiki/output/runtime-context.md",
						preview: "# Runtime Context",
						updatedAt: "2026-04-12T00:00:00.000Z",
					},
					exists: true,
					revision: `${scope}:${blockId}:${revision}`,
					scope: "operations",
					title: "Runtime Memory",
					updatedAt: "2026-04-12T00:00:00.000Z",
				},
				profile: {
					blocks: [],
					canonicalPath: "/tmp/wiki/profiles/self.md",
					compiledContext: {
						charCount: 18,
						exists: true,
						path: "/tmp/wiki/output/profile-context.md",
						preview: "# Profile Context",
						updatedAt: "2026-04-12T00:00:00.000Z",
					},
					exists: true,
					revision: "profile:seed",
					scope: "profile",
					title: "Self",
					updatedAt: "2026-04-12T00:00:00.000Z",
				},
			},
			removedBlock: {
				charCount: 10,
				content: "Old block",
				id: blockId,
				lineCount: 1,
				preview: "Old block",
			},
		}),
		deleteWikiMemoryProposalImpl: async ({ proposalId }) => ({
			memories: {
				operations: {
					blocks: [],
					canonicalPath: "/tmp/wiki/operations/core-memory.md",
					compiledContext: {
						charCount: 18,
						exists: true,
						path: "/tmp/wiki/output/runtime-context.md",
						preview: "# Runtime Context",
						updatedAt: "2026-04-12T00:00:00.000Z",
					},
					exists: true,
					revision: "operations-rev",
					scope: "operations",
					title: "Runtime Memory",
					updatedAt: "2026-04-12T00:00:00.000Z",
				},
				profile: {
					blocks: [],
					canonicalPath: "/tmp/wiki/profiles/self.md",
					compiledContext: {
						charCount: 18,
						exists: true,
						path: "/tmp/wiki/output/profile-context.md",
						preview: "# Profile Context",
						updatedAt: "2026-04-12T00:00:00.000Z",
					},
					exists: true,
					revision: "profile:seed",
					scope: "profile",
					title: "Self",
					updatedAt: "2026-04-12T00:00:00.000Z",
				},
			},
			proposal: {
				action: "add",
				content: "Old memory",
				createdAt: "2026-04-12T00:00:00.000Z",
				id: proposalId,
				path: `/tmp/wiki/raw/turns/${proposalId}.md`,
				scope: "operations",
				sourceMessageId: null,
				sourceThreadId: null,
				status: "ingested",
				summary: "Old memory",
			},
		}),
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
		getWikiMemoriesImpl: async () => ({
			operations: {
				blocks: [{
					charCount: 18,
					content: "Keep responses terse.",
					id: "operations-1",
					lineCount: 1,
					preview: "Keep responses terse.",
				}],
				canonicalPath: "/tmp/wiki/operations/core-memory.md",
				compiledContext: {
					charCount: 18,
					exists: true,
					path: "/tmp/wiki/output/runtime-context.md",
					preview: "# Runtime Context",
					updatedAt: "2026-04-12T00:00:00.000Z",
				},
				exists: true,
				revision: "operations-rev",
				scope: "operations",
				title: "Runtime Memory",
				updatedAt: "2026-04-12T00:00:00.000Z",
			},
			profile: {
				blocks: [],
				canonicalPath: "/tmp/wiki/profiles/self.md",
				compiledContext: {
					charCount: 18,
					exists: true,
					path: "/tmp/wiki/output/profile-context.md",
					preview: "# Profile Context",
					updatedAt: "2026-04-12T00:00:00.000Z",
				},
				exists: true,
				revision: "profile-rev",
				scope: "profile",
				title: "Self",
				updatedAt: "2026-04-12T00:00:00.000Z",
			},
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

test("GET /api/wiki/memories returns canonical wiki memory documents", async () => {
	const handlers = createTestHandlers();

	await withServer((app) => {
		app.get("/api/wiki/memories", handlers.handleWikiMemories);
	}, async (baseUrl) => {
		const response = await fetch(`${baseUrl}/api/wiki/memories`);
		const payload = await response.json();

		assert.equal(response.status, 200);
		assert.equal(payload.memories.operations.blocks.length, 1);
		assert.equal(payload.memories.operations.canonicalPath, "/tmp/wiki/operations/core-memory.md");
		assert.equal(payload.memories.profile.title, "Self");
	});
});

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

test("DELETE /api/wiki/memories/:scope/blocks/:blockId removes a canonical memory block", async () => {
	const deleteCalls = [];
	const handlers = createTestHandlers({
		deleteWikiMemoryBlockImpl: async (input) => {
			deleteCalls.push(input);
			return {
				memories: {
					operations: {
						blocks: [],
						canonicalPath: "/tmp/wiki/operations/core-memory.md",
						compiledContext: {
							charCount: 12,
							exists: true,
							path: "/tmp/wiki/output/runtime-context.md",
							preview: "# Runtime Context",
							updatedAt: "2026-04-12T00:00:00.000Z",
						},
						exists: true,
						revision: "operations-next-rev",
						scope: "operations",
						title: "Runtime Memory",
						updatedAt: "2026-04-12T00:00:00.000Z",
					},
					profile: {
						blocks: [],
						canonicalPath: "/tmp/wiki/profiles/self.md",
						compiledContext: {
							charCount: 12,
							exists: true,
							path: "/tmp/wiki/output/profile-context.md",
							preview: "# Profile Context",
							updatedAt: "2026-04-12T00:00:00.000Z",
						},
						exists: true,
						revision: "profile-rev",
						scope: "profile",
						title: "Self",
						updatedAt: "2026-04-12T00:00:00.000Z",
					},
				},
				removedBlock: {
					charCount: 10,
					content: "Old block",
					id: input.blockId,
					lineCount: 1,
					preview: "Old block",
				},
			};
		},
	});

	await withServer((app) => {
		app.delete("/api/wiki/memories/:scope/blocks/:blockId", handlers.handleWikiMemoryBlockDelete);
	}, async (baseUrl) => {
		const response = await fetch(`${baseUrl}/api/wiki/memories/operations/blocks/operations-1`, {
			body: JSON.stringify({ revision: "operations-rev" }),
			headers: {
				"Content-Type": "application/json",
			},
			method: "DELETE",
		});
		const payload = await response.json();

		assert.equal(response.status, 200);
		assert.equal(deleteCalls.length, 1);
		assert.equal(deleteCalls[0].blockId, "operations-1");
		assert.equal(deleteCalls[0].revision, "operations-rev");
		assert.equal(deleteCalls[0].scope, "operations");
		assert.equal(typeof deleteCalls[0].logger.warn, "function");
		assert.equal(payload.removedBlock.id, "operations-1");
		assert.equal(payload.memories.operations.revision, "operations-next-rev");
		assert.equal(payload.wiki.wikiDir, "/tmp/wiki");
	});
});

test("DELETE /api/wiki/memories/:scope/blocks/:blockId returns 409 for stale revisions", async () => {
	const handlers = createTestHandlers({
		deleteWikiMemoryBlockImpl: async () => {
			const error = new Error("Canonical memory changed since this page was loaded.");
			error.code = "REVISION_CONFLICT";
			throw error;
		},
	});

	await withServer((app) => {
		app.delete("/api/wiki/memories/:scope/blocks/:blockId", handlers.handleWikiMemoryBlockDelete);
	}, async (baseUrl) => {
		const response = await fetch(`${baseUrl}/api/wiki/memories/operations/blocks/operations-1`, {
			body: JSON.stringify({ revision: "stale-rev" }),
			headers: {
				"Content-Type": "application/json",
			},
			method: "DELETE",
		});
		const payload = await response.json();

		assert.equal(response.status, 409);
		assert.equal(payload.error, "Canonical memory changed since this page was loaded.");
	});
});

test("DELETE /api/wiki/memories/proposals/:proposalId removes a raw memory proposal", async () => {
	const deleteCalls = [];
	const handlers = createTestHandlers({
		deleteWikiMemoryProposalImpl: async (input) => {
			deleteCalls.push(input);
			return {
				memories: {
					operations: {
						blocks: [],
						canonicalPath: "/tmp/wiki/operations/core-memory.md",
						compiledContext: {
							charCount: 12,
							exists: true,
							path: "/tmp/wiki/output/runtime-context.md",
							preview: "# Runtime Context",
							updatedAt: "2026-04-12T00:00:00.000Z",
						},
						exists: true,
						revision: "operations-next-rev",
						scope: "operations",
						title: "Runtime Memory",
						updatedAt: "2026-04-12T00:00:00.000Z",
					},
					profile: {
						blocks: [],
						canonicalPath: "/tmp/wiki/profiles/self.md",
						compiledContext: {
							charCount: 12,
							exists: true,
							path: "/tmp/wiki/output/profile-context.md",
							preview: "# Profile Context",
							updatedAt: "2026-04-12T00:00:00.000Z",
						},
						exists: true,
						revision: "profile-rev",
						scope: "profile",
						title: "Self",
						updatedAt: "2026-04-12T00:00:00.000Z",
					},
				},
				proposal: {
					action: "add",
					createdAt: "2026-04-12T00:00:00.000Z",
					id: input.proposalId,
					path: `/tmp/wiki/raw/turns/${input.proposalId}.md`,
					scope: "operations",
					sourceMessageId: null,
					sourceThreadId: null,
					status: "ingested",
					summary: "Old memory",
				},
			};
		},
	});

	await withServer((app) => {
		app.delete("/api/wiki/memories/proposals/:proposalId", handlers.handleWikiMemoryProposalDelete);
	}, async (baseUrl) => {
		const response = await fetch(`${baseUrl}/api/wiki/memories/proposals/proposal-1`, {
			method: "DELETE",
		});
		const payload = await response.json();

		assert.equal(response.status, 200);
		assert.equal(deleteCalls.length, 1);
		assert.equal(deleteCalls[0].proposalId, "proposal-1");
		assert.equal(typeof deleteCalls[0].logger.warn, "function");
		assert.equal(payload.proposal.id, "proposal-1");
		assert.equal(payload.wiki.wikiDir, "/tmp/wiki");
	});
});
