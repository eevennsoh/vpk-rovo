const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const {
	createHermesSkillDraftManager,
} = require("./hermes-skill-drafts");

async function withTempBaseDir(fn) {
	const baseDir = await fs.mkdtemp(path.join(os.tmpdir(), "vpk-hermes-skill-drafts-"));
	try {
		await fn(baseDir);
	} finally {
		await fs.rm(baseDir, { recursive: true, force: true });
	}
}

test("upsertDraft creates and deduplicates pending drafts by target action", async () => {
	await withTempBaseDir(async (baseDir) => {
		const manager = createHermesSkillDraftManager({ baseDir });
		const firstDraft = await manager.upsertDraft({
			action: "create",
			category: "research",
			name: "llm-wiki-helper",
			rationale: "Reusable wiki ingestion workflow.",
			summary: "Wiki helper",
			sourceThreadId: "thread-1",
			files: [
				{
					path: "SKILL.md",
					content: "# Wiki Helper\n\nUse this skill for wiki ingestion.",
				},
			],
		});
		const secondDraft = await manager.upsertDraft({
			action: "create",
			category: "research",
			name: "llm-wiki-helper",
			rationale: "Updated rationale.",
			sourceThreadId: "thread-1",
			files: [
				{
					path: "SKILL.md",
					content: "# Wiki Helper\n\nUpdated draft.",
				},
			],
		});

		assert.equal(firstDraft.id, secondDraft.id);
		assert.equal((await manager.listDrafts()).length, 1);
		assert.equal((await manager.getDraft(firstDraft.id))?.files[0]?.content.includes("Updated draft"), true);
	});
});

test("approveDraft delegates to live skill handlers and marks the draft approved", async () => {
	await withTempBaseDir(async (baseDir) => {
		const manager = createHermesSkillDraftManager({ baseDir });
		const createdDraft = await manager.upsertDraft({
			action: "create",
			category: "research",
			name: "llm-wiki-helper",
			rationale: "Reusable wiki ingestion workflow.",
			sourceThreadId: "thread-1",
			files: [
				{
					path: "SKILL.md",
					content: "# Wiki Helper\n\nUse this skill for wiki ingestion.",
				},
			],
		});
		let createCalls = 0;
		const approvedDraft = await manager.approveDraft(createdDraft.id, {
			createSkillFromBundleImpl: async (bundle) => {
				createCalls += 1;
				assert.equal(bundle.category, "research");
				assert.equal(bundle.name, "llm-wiki-helper");
			},
			updateSkillFromBundleImpl: async () => {
				assert.fail("update should not run for create draft");
			},
			archiveSkillImpl: async () => {
				assert.fail("archive should not run for create draft");
			},
		});

		assert.equal(createCalls, 1);
		assert.equal(approvedDraft?.status, "approved");
		assert.equal((await manager.listPendingDraftIdsForThread("thread-1")).length, 0);
	});
});

test("rejectDraft and deleteDraft update thread-scoped pending draft state", async () => {
	await withTempBaseDir(async (baseDir) => {
		const manager = createHermesSkillDraftManager({ baseDir });
		const draft = await manager.upsertDraft({
			action: "delete",
			category: "research",
			name: "old-skill",
			rationale: "Archive obsolete skill.",
			sourceThreadId: "thread-2",
			files: [],
		});

		assert.deepEqual(await manager.listPendingDraftIdsForThread("thread-2"), [draft.id]);
		const rejected = await manager.rejectDraft(draft.id);
		assert.equal(rejected?.status, "rejected");
		assert.deepEqual(await manager.listPendingDraftIdsForThread("thread-2"), []);
		const deleted = await manager.deleteDraft(draft.id);
		assert.equal(deleted?.id, rejected?.id);
		assert.equal(deleted?.status, "rejected");
		assert.equal(await manager.getDraft(draft.id), null);
	});
});
