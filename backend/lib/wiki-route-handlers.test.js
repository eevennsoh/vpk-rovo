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
		buildWikiMemoryBriefImpl: ({ title }) => `# ${title || "Memory Brief"}\n`,
		buildWikiMemoryDeckImpl: ({ title }) => `---\nmarp: true\ntitle: "${title || "Memory Explorer Deck"}"\n---\n`,
		buildWikiMemoryExplorerCsvImpl: () => "\"id\",\"title\"\n\"canonical:work\",\"Work Context\"\n",
		buildWikiMemoryExplorerImpl: async () => ({
			edges: [],
			facets: {
				kinds: [],
				scopes: [],
				statuses: [],
				tags: [],
				threads: [],
			},
			filters: {
				includeLinkedKnowledge: true,
				kind: null,
				scope: null,
				status: null,
				tag: null,
				threadId: null,
			},
			generatedAt: "2026-04-12T00:00:00.000Z",
			nodes: [],
			stats: {
				edgeCount: 0,
				nodeCount: 0,
				totalEdgeCount: 0,
				totalNodeCount: 0,
				visibleKindCounts: {},
				visibleScopeCounts: {},
				visibleStatusCounts: {},
			},
		}),
		captureUrlImpl: async ({ url }) => ({
			captureStatus: "created",
			filePath: "/tmp/llm-wiki/raw/2026/04/capture.md",
			metadata: {
				canonical_url: url,
				source_url: url,
				title: "Captured page",
			},
		}),
		deleteWikiMemoryBlockImpl: async ({ blockId, revision, scope }) => ({
			memories: {
				work: {
					blocks: [],
					canonicalPath: "/tmp/llm-wiki/wiki/work/context.md",
					compiledContext: {
						charCount: 18,
						exists: true,
						path: "/tmp/llm-wiki/output/work-context.md",
						preview: "# Work Context",
						updatedAt: "2026-04-12T00:00:00.000Z",
					},
					exists: true,
					revision: `${scope}:${blockId}:${revision}`,
					scope: "work",
					title: "Work Context",
					updatedAt: "2026-04-12T00:00:00.000Z",
				},
				profile: {
					blocks: [],
					canonicalPath: "/tmp/llm-wiki/wiki/profiles/self.md",
					compiledContext: {
						charCount: 18,
						exists: true,
						path: "/tmp/llm-wiki/output/profile-context.md",
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
				work: {
					blocks: [],
					canonicalPath: "/tmp/llm-wiki/wiki/work/context.md",
					compiledContext: {
						charCount: 18,
						exists: true,
						path: "/tmp/llm-wiki/output/work-context.md",
						preview: "# Work Context",
						updatedAt: "2026-04-12T00:00:00.000Z",
					},
					exists: true,
					revision: "work-rev",
					scope: "work",
					title: "Work Context",
					updatedAt: "2026-04-12T00:00:00.000Z",
				},
				profile: {
					blocks: [],
					canonicalPath: "/tmp/llm-wiki/wiki/profiles/self.md",
					compiledContext: {
						charCount: 18,
						exists: true,
						path: "/tmp/llm-wiki/output/profile-context.md",
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
				path: `/tmp/llm-wiki/raw/${proposalId}.md`,
				scope: "work",
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
			wikiDir: "/tmp/llm-wiki",
		}),
		getWikiMemoriesImpl: async () => ({
			work: {
				blocks: [{
					charCount: 18,
					content: "Keep responses terse.",
					id: "work-1",
					lineCount: 1,
					preview: "Keep responses terse.",
				}],
				canonicalPath: "/tmp/llm-wiki/wiki/work/context.md",
				compiledContext: {
					charCount: 18,
					exists: true,
					path: "/tmp/llm-wiki/output/work-context.md",
					preview: "# Work Context",
					updatedAt: "2026-04-12T00:00:00.000Z",
				},
				exists: true,
				revision: "work-rev",
				scope: "work",
				title: "Work Context",
				updatedAt: "2026-04-12T00:00:00.000Z",
			},
			profile: {
				blocks: [],
				canonicalPath: "/tmp/llm-wiki/wiki/profiles/self.md",
				compiledContext: {
					charCount: 18,
					exists: true,
					path: "/tmp/llm-wiki/output/profile-context.md",
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
		lintWikiImpl: async () => ({
			issues: [],
		}),
		logger: { warn() {} },
		normalizeNaiveWikiSearchResultsImpl: (results) => results,
		queryWikiImpl: async () => ({ results: [] }),
		saveSynthesisPageImpl: async ({ title }) => ({
			path: `/tmp/llm-wiki/wiki/synthesis/${title.toLowerCase().replace(/\s+/gu, "-")}.md`,
			slug: title.toLowerCase().replace(/\s+/gu, "-"),
			title,
		}),
		searchWikiWithQmdImpl: async () => [],
		syncWikiMemoryImpl: async () => ({
			errors: [],
			processed: 0,
			updatedScopes: [],
		}),
		wikiDir: "/tmp/llm-wiki",
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
		assert.equal(payload.memories.work.blocks.length, 1);
		assert.equal(payload.memories.work.canonicalPath, "/tmp/llm-wiki/wiki/work/context.md");
		assert.equal(payload.memories.profile.title, "Self");
	});
});

test("POST /api/wiki/captures returns a normalized created response", async () => {
	const captureCalls = [];
	const handlers = createTestHandlers({
		captureUrlImpl: async (input) => {
			captureCalls.push(input);
			return {
				captureStatus: "created",
				filePath: "/tmp/llm-wiki/raw/2026/04/rovo.md",
				metadata: {
					canonical_url: "https://www.atlassian.com/software/rovo",
					source_url: "https://www.atlassian.com/software/rovo",
					title: "Rovo",
				},
			};
		},
	});

	await withServer((app) => {
		app.post("/api/wiki/captures", handlers.handleWikiCapture);
	}, async (baseUrl) => {
		const response = await fetch(`${baseUrl}/api/wiki/captures`, {
			body: JSON.stringify({ url: "https://www.atlassian.com/software/rovo" }),
			headers: {
				"Content-Type": "application/json",
			},
			method: "POST",
		});
		const payload = await response.json();

		assert.equal(response.status, 201);
		assert.deepEqual(captureCalls, [{
			wikiDir: "/tmp/llm-wiki",
			url: "https://www.atlassian.com/software/rovo",
		}]);
		assert.deepEqual(payload, {
			canonicalUrl: "https://www.atlassian.com/software/rovo",
			reason: null,
			sourceUrl: "https://www.atlassian.com/software/rovo",
			status: "created",
			title: "Rovo",
			wikiPath: "raw/2026/04/rovo.md",
		});
	});
});

test("POST /api/wiki/captures returns existing captures without rewriting", async () => {
	const handlers = createTestHandlers({
		captureUrlImpl: async () => ({
			captureStatus: "existing",
			filePath: "/tmp/llm-wiki/raw/2026/04/rovo.md",
			metadata: {
				canonical_url: "https://www.atlassian.com/software/rovo",
				source_url: "https://www.atlassian.com/software/rovo",
				title: "Rovo",
			},
		}),
	});

	await withServer((app) => {
		app.post("/api/wiki/captures", handlers.handleWikiCapture);
	}, async (baseUrl) => {
		const response = await fetch(`${baseUrl}/api/wiki/captures`, {
			body: JSON.stringify({ url: "https://www.atlassian.com/software/rovo" }),
			headers: {
				"Content-Type": "application/json",
			},
			method: "POST",
		});
		const payload = await response.json();

		assert.equal(response.status, 200);
		assert.equal(payload.status, "existing");
		assert.equal(payload.wikiPath, "raw/2026/04/rovo.md");
	});
});

test("POST /api/wiki/captures returns skipped captures with a reason", async () => {
	const handlers = createTestHandlers({
		captureUrlImpl: async () => ({
			reason: "search-results-page",
			skipped: true,
		}),
	});

	await withServer((app) => {
		app.post("/api/wiki/captures", handlers.handleWikiCapture);
	}, async (baseUrl) => {
		const response = await fetch(`${baseUrl}/api/wiki/captures`, {
			body: JSON.stringify({ url: "https://www.google.com/search?q=rovo" }),
			headers: {
				"Content-Type": "application/json",
			},
			method: "POST",
		});
		const payload = await response.json();

		assert.equal(response.status, 200);
		assert.deepEqual(payload, {
			canonicalUrl: null,
			reason: "search-results-page",
			sourceUrl: "https://www.google.com/search?q=rovo",
			status: "skipped",
			title: null,
			wikiPath: null,
		});
	});
});

test("POST /api/wiki/captures returns 400 for invalid inputs", async () => {
	const handlers = createTestHandlers({
		captureUrlImpl: async () => {
			const error = new Error("URL rejected: private/local address localhost");
			error.code = "INVALID_INPUT";
			throw error;
		},
	});

	await withServer((app) => {
		app.post("/api/wiki/captures", handlers.handleWikiCapture);
	}, async (baseUrl) => {
		const response = await fetch(`${baseUrl}/api/wiki/captures`, {
			body: JSON.stringify({ url: "http://localhost:3000" }),
			headers: {
				"Content-Type": "application/json",
			},
			method: "POST",
		});
		const payload = await response.json();

		assert.equal(response.status, 400);
		assert.equal(payload.error, "URL rejected: private/local address localhost");
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
	const lintCalls = [];
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
				updatedScopes: ["profile", "work"],
			};
		},
		lintWikiImpl: async (input) => {
			lintCalls.push(input);
			return {
				issues: [{ message: "Example lint issue", path: "wiki/index.md", type: "missing-index-entry" }],
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
		assert.equal(lintCalls.length, 1);
		assert.equal(payload.memory.processed, 2);
		assert.equal(payload.lint.issues.length, 1);
		assert.equal(payload.qmd.totalDocuments, 2);
		assert.equal(payload.sync.didSync, true);
	});
});

test("POST /api/wiki/synthesis saves a reusable synthesis page", async () => {
	const saveCalls = [];
	const handlers = createTestHandlers({
		saveSynthesisPageImpl: async (input) => {
			saveCalls.push(input);
			return {
				path: "/tmp/llm-wiki/wiki/synthesis/atlassian-ai.md",
				slug: "atlassian-ai",
				title: input.title,
			};
		},
	});

	await withServer((app) => {
		app.post("/api/wiki/synthesis", handlers.handleWikiSynthesisSave);
	}, async (baseUrl) => {
		const response = await fetch(`${baseUrl}/api/wiki/synthesis`, {
			body: JSON.stringify({
				title: "Atlassian AI",
				content: "# Atlassian AI\n\nReusable synthesis body.",
				sources: ["wiki/sources/atlassian-ai-source.md"],
				tags: ["ai", "atlassian"],
			}),
			headers: {
				"Content-Type": "application/json",
			},
			method: "POST",
		});
		const payload = await response.json();

		assert.equal(response.status, 201);
		assert.equal(saveCalls.length, 1);
		assert.equal(saveCalls[0].title, "Atlassian AI");
		assert.equal(payload.slug, "atlassian-ai");
		assert.equal(payload.path, "wiki/synthesis/atlassian-ai.md");
	});
});

test("DELETE /api/wiki/memories/:scope/blocks/:blockId removes a canonical memory block", async () => {
	const deleteCalls = [];
	const handlers = createTestHandlers({
		deleteWikiMemoryBlockImpl: async (input) => {
			deleteCalls.push(input);
			return {
				memories: {
					work: {
						blocks: [],
						canonicalPath: "/tmp/llm-wiki/wiki/work/context.md",
						compiledContext: {
							charCount: 12,
							exists: true,
							path: "/tmp/llm-wiki/output/work-context.md",
							preview: "# Work Context",
							updatedAt: "2026-04-12T00:00:00.000Z",
						},
						exists: true,
						revision: "work-next-rev",
						scope: "work",
						title: "Work Context",
						updatedAt: "2026-04-12T00:00:00.000Z",
					},
					profile: {
						blocks: [],
						canonicalPath: "/tmp/llm-wiki/wiki/profiles/self.md",
						compiledContext: {
							charCount: 12,
							exists: true,
							path: "/tmp/llm-wiki/output/profile-context.md",
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
		const response = await fetch(`${baseUrl}/api/wiki/memories/work/blocks/work-1`, {
			body: JSON.stringify({ revision: "work-rev" }),
			headers: {
				"Content-Type": "application/json",
			},
			method: "DELETE",
		});
		const payload = await response.json();

		assert.equal(response.status, 200);
		assert.equal(deleteCalls.length, 1);
		assert.equal(deleteCalls[0].blockId, "work-1");
		assert.equal(deleteCalls[0].revision, "work-rev");
		assert.equal(deleteCalls[0].scope, "work");
		assert.equal(typeof deleteCalls[0].logger.warn, "function");
		assert.equal(payload.removedBlock.id, "work-1");
		assert.equal(payload.memories.work.revision, "work-next-rev");
		assert.equal(payload.wiki.wikiDir, "/tmp/llm-wiki");
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
		const response = await fetch(`${baseUrl}/api/wiki/memories/work/blocks/work-1`, {
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
					work: {
						blocks: [],
						canonicalPath: "/tmp/llm-wiki/wiki/work/context.md",
						compiledContext: {
							charCount: 12,
							exists: true,
							path: "/tmp/llm-wiki/output/work-context.md",
							preview: "# Work Context",
							updatedAt: "2026-04-12T00:00:00.000Z",
						},
						exists: true,
						revision: "work-next-rev",
						scope: "work",
						title: "Work Context",
						updatedAt: "2026-04-12T00:00:00.000Z",
					},
					profile: {
						blocks: [],
						canonicalPath: "/tmp/llm-wiki/wiki/profiles/self.md",
						compiledContext: {
							charCount: 12,
							exists: true,
							path: "/tmp/llm-wiki/output/profile-context.md",
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
					path: `/tmp/llm-wiki/raw/${input.proposalId}.md`,
					scope: "work",
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
		assert.equal(payload.wiki.wikiDir, "/tmp/llm-wiki");
	});
});

test("GET /api/wiki/memory-explorer returns the normalized explorer snapshot", async () => {
	const handlers = createTestHandlers({
		buildWikiMemoryExplorerImpl: async ({ filters }) => ({
			edges: [],
			facets: {
				kinds: [{ count: 1, label: "canonical memory", value: "canonical-memory" }],
				scopes: [],
				statuses: [],
				tags: [],
				threads: [],
			},
			filters,
			generatedAt: "2026-04-12T00:00:00.000Z",
			nodes: [{
				bodyPreview: "Keep the runtime loop on RovoDev.",
				charCount: 32,
				connectionCount: 1,
				createdAt: null,
				id: "canonical:work",
				kind: "canonical-memory",
				label: "Work memory",
				metadata: {},
				path: "/tmp/llm-wiki/wiki/work/context.md",
				relativePath: "wiki/work/context.md",
				scope: "work",
				sourceMessageId: null,
				sourceThreadId: null,
				status: null,
				summary: "Keep the runtime loop on RovoDev.",
				tags: ["work", "memory"],
				target: null,
				title: "Work Context",
				topics: ["runtime", "rovodev"],
				updatedAt: "2026-04-12T00:00:00.000Z",
				wikiLinks: [],
			}],
			stats: {
				edgeCount: 0,
				nodeCount: 1,
				totalEdgeCount: 0,
				totalNodeCount: 1,
				visibleKindCounts: { "canonical-memory": 1 },
				visibleScopeCounts: { work: 1 },
				visibleStatusCounts: {},
			},
		}),
	});

	await withServer((app) => {
		app.get("/api/wiki/memory-explorer", handlers.handleWikiMemoryExplorer);
	}, async (baseUrl) => {
		const response = await fetch(`${baseUrl}/api/wiki/memory-explorer?scope=work&includeLinkedKnowledge=false`);
		const payload = await response.json();

		assert.equal(response.status, 200);
		assert.equal(payload.explorer.nodes.length, 1);
		assert.equal(payload.explorer.filters.scope, "work");
		assert.equal(payload.explorer.filters.includeLinkedKnowledge, false);
	});
});

test("POST /api/wiki/memory-explorer/brief returns generated markdown", async () => {
	const handlers = createTestHandlers({
		buildWikiMemoryBriefImpl: ({ title }) => `# ${title}\n\n- Keep the runtime loop on RovoDev.\n`,
	});

	await withServer((app) => {
		app.post("/api/wiki/memory-explorer/brief", handlers.handleWikiMemoryBrief);
	}, async (baseUrl) => {
		const response = await fetch(`${baseUrl}/api/wiki/memory-explorer/brief`, {
			body: JSON.stringify({
				filters: { scope: "work" },
				selectedNodeIds: ["canonical:work"],
				title: "Work Memory Brief",
			}),
			headers: {
				"Content-Type": "application/json",
			},
			method: "POST",
		});
		const payload = await response.json();

		assert.equal(response.status, 200);
		assert.match(payload.brief.content, /Work Memory Brief/u);
		assert.deepEqual(payload.brief.selectedNodeIds, ["canonical:work"]);
	});
});
