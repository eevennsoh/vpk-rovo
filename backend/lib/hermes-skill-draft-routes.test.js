const assert = require("node:assert/strict");
const http = require("node:http");
const test = require("node:test");
const express = require("express");

const {
	registerHermesSkillDraftRoutes,
} = require("./hermes-skill-draft-routes");

async function withServer(fn, dependencies) {
	const app = express();
	app.use(express.json());
	registerHermesSkillDraftRoutes(app, dependencies);
	const server = http.createServer(app);
	await new Promise((resolve) => server.listen(0, resolve));
	const address = server.address();
	const baseUrl = `http://127.0.0.1:${address.port}`;

	try {
		await fn(baseUrl);
	} finally {
		await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
	}
}

test("draft routes list and load drafts", async () => {
	const dependencies = {
		draftManager: {
			listDrafts: async () => [{ id: "draft-1", status: "pending" }],
			getDraft: async (draftId) => draftId === "draft-1" ? { id: "draft-1", status: "pending", files: [] } : null,
		},
	};

	await withServer(async (baseUrl) => {
		const listResponse = await fetch(`${baseUrl}/api/skills/drafts`);
		assert.equal(listResponse.status, 200);
		assert.deepEqual(await listResponse.json(), {
			drafts: [{ id: "draft-1", status: "pending" }],
		});

		const detailResponse = await fetch(`${baseUrl}/api/skills/drafts/draft-1`);
		assert.equal(detailResponse.status, 200);
		assert.equal((await detailResponse.json()).draft.id, "draft-1");

		const notFoundResponse = await fetch(`${baseUrl}/api/skills/drafts/missing`);
		assert.equal(notFoundResponse.status, 404);
	}, dependencies);
});

test("draft routes approve, reject, and delete drafts while syncing thread pending ids", async () => {
	const syncedThreadIds = [];
	const dependencies = {
		createSkillFromBundleImpl: async () => {},
		updateSkillFromBundleImpl: async () => {},
		archiveSkillImpl: async () => {},
		syncThreadPendingSkillDraftIdsImpl: async (threadId) => {
			syncedThreadIds.push(threadId);
		},
		draftManager: {
			approveDraft: async (draftId) => ({
				id: draftId,
				status: "approved",
				sourceThreadId: "thread-1",
			}),
			rejectDraft: async (draftId) => ({
				id: draftId,
				status: "rejected",
				sourceThreadId: "thread-1",
			}),
			deleteDraft: async (draftId) => ({
				id: draftId,
				status: "rejected",
				sourceThreadId: "thread-1",
			}),
			listDrafts: async () => [],
			getDraft: async () => null,
		},
	};

	await withServer(async (baseUrl) => {
		const approveResponse = await fetch(`${baseUrl}/api/skills/drafts/draft-1/approve`, { method: "POST" });
		assert.equal(approveResponse.status, 200);
		assert.equal((await approveResponse.json()).draft.status, "approved");

		const rejectResponse = await fetch(`${baseUrl}/api/skills/drafts/draft-1/reject`, { method: "POST" });
		assert.equal(rejectResponse.status, 200);
		assert.equal((await rejectResponse.json()).draft.status, "rejected");

		const deleteResponse = await fetch(`${baseUrl}/api/skills/drafts/draft-1`, { method: "DELETE" });
		assert.equal(deleteResponse.status, 200);
		assert.equal((await deleteResponse.json()).draft.id, "draft-1");
	}, dependencies);

	assert.deepEqual(syncedThreadIds, ["thread-1", "thread-1", "thread-1"]);
});
