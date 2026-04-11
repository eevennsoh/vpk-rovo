const crypto = require("node:crypto");
const fs = require("node:fs/promises");
const path = require("node:path");

const { getRovoAppIndicesRootDir } = require("./rovo-app-storage-paths");
const { validateSkillBundle } = require("./hermes-skills-hub");

const HERMES_SKILL_DRAFTS_DIR = "hermes-skill-drafts";
const INDEX_FILENAME = "index.json";

function createDraftId() {
	return `skill-draft-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;
}

function toNonEmptyString(value) {
	return typeof value === "string" && value.trim().length > 0
		? value.trim()
		: null;
}

function normalizeDraftAction(value) {
	return value === "create" || value === "update" || value === "delete"
		? value
		: null;
}

function normalizeDraftStatus(value) {
	return value === "approved" || value === "rejected" || value === "pending"
		? value
		: "pending";
}

function normalizeDraftBundleFile(file) {
	if (!file || typeof file !== "object") {
		return null;
	}

	const filePath = toNonEmptyString(file.path);
	const content = typeof file.content === "string" ? file.content : null;
	if (!filePath || content === null) {
		return null;
	}

	return {
		path: filePath,
		content,
	};
}

function normalizeDraftRecord(rawRecord) {
	if (!rawRecord || typeof rawRecord !== "object") {
		return null;
	}

	const action = normalizeDraftAction(rawRecord.action);
	const category = toNonEmptyString(rawRecord.category);
	const name = toNonEmptyString(rawRecord.name);
	const id = toNonEmptyString(rawRecord.id);
	if (!action || !category || !name || !id) {
		return null;
	}

	return {
		id,
		status: normalizeDraftStatus(rawRecord.status),
		action,
		category,
		name,
		summary: toNonEmptyString(rawRecord.summary),
		rationale: toNonEmptyString(rawRecord.rationale),
		sourceThreadId: toNonEmptyString(rawRecord.sourceThreadId),
		sourceMessageId: toNonEmptyString(rawRecord.sourceMessageId),
		createdAt: toNonEmptyString(rawRecord.createdAt) ?? new Date().toISOString(),
		updatedAt: toNonEmptyString(rawRecord.updatedAt) ?? new Date().toISOString(),
		reviewedAt: toNonEmptyString(rawRecord.reviewedAt),
		bundleDir: toNonEmptyString(rawRecord.bundleDir),
	};
}

function sortDraftsNewestFirst(left, right) {
	return Date.parse(right.updatedAt) - Date.parse(left.updatedAt);
}

function buildDraftDedupeKey(record) {
	return `${record.action}:${record.category}/${record.name}`;
}

async function rmIfExists(targetPath) {
	await fs.rm(targetPath, { recursive: true, force: true }).catch(() => {});
}

function createHermesSkillDraftManager({ baseDir }) {
	const draftsRootDir = path.join(
		getRovoAppIndicesRootDir(baseDir),
		HERMES_SKILL_DRAFTS_DIR,
	);
	const bundlesRootDir = path.join(draftsRootDir, "bundles");
	const indexPath = path.join(draftsRootDir, INDEX_FILENAME);

	async function ensureDirs() {
		await fs.mkdir(bundlesRootDir, { recursive: true });
	}

	async function readIndex() {
		try {
			const raw = await fs.readFile(indexPath, "utf8");
			const parsed = JSON.parse(raw);
			if (!Array.isArray(parsed)) {
				return [];
			}

			return parsed
				.map(normalizeDraftRecord)
				.filter(Boolean)
				.sort(sortDraftsNewestFirst);
		} catch (error) {
			if (error?.code === "ENOENT") {
				return [];
			}

			throw error;
		}
	}

	async function writeIndex(records) {
		await ensureDirs();
		await fs.writeFile(
			indexPath,
			`${JSON.stringify(records.slice().sort(sortDraftsNewestFirst), null, 2)}\n`,
			"utf8",
		);
	}

	async function writeBundleFiles(draftId, files) {
		const bundleDir = path.join(bundlesRootDir, draftId);
		await rmIfExists(bundleDir);
		await fs.mkdir(bundleDir, { recursive: true });

		for (const file of files) {
			const normalizedFile = normalizeDraftBundleFile(file);
			if (!normalizedFile) {
				continue;
			}

			const targetPath = path.join(bundleDir, normalizedFile.path);
			await fs.mkdir(path.dirname(targetPath), { recursive: true });
			await fs.writeFile(targetPath, normalizedFile.content, "utf8");
		}

		return bundleDir;
	}

	async function readBundleFiles(bundleDir) {
		if (!bundleDir) {
			return [];
		}

		async function walk(currentDir) {
			let entries;
			try {
				entries = await fs.readdir(currentDir, { withFileTypes: true });
			} catch (error) {
				if (error?.code === "ENOENT") {
					return [];
				}
				throw error;
			}

			const files = [];
			for (const entry of entries) {
				if (entry.name.startsWith(".")) {
					continue;
				}

				const entryPath = path.join(currentDir, entry.name);
				if (entry.isDirectory()) {
					files.push(...await walk(entryPath));
					continue;
				}

				if (!entry.isFile()) {
					continue;
				}

				files.push({
					path: path.relative(bundleDir, entryPath).split(path.sep).join("/"),
					content: await fs.readFile(entryPath, "utf8"),
				});
			}

			return files.sort((left, right) => left.path.localeCompare(right.path));
		}

		return walk(bundleDir);
	}

	async function getDraft(draftId) {
		const draft = (await readIndex()).find((candidate) => candidate.id === draftId) ?? null;
		if (!draft) {
			return null;
		}

		return {
			...draft,
			files: await readBundleFiles(draft.bundleDir),
		};
	}

	async function listDrafts({ sourceThreadId, status } = {}) {
		const normalizedThreadId = toNonEmptyString(sourceThreadId);
		const normalizedStatus =
			status === "approved" || status === "pending" || status === "rejected"
				? status
				: null;

		return (await readIndex()).filter((draft) => {
			if (normalizedThreadId && draft.sourceThreadId !== normalizedThreadId) {
				return false;
			}

			if (normalizedStatus && draft.status !== normalizedStatus) {
				return false;
			}

			return true;
		});
	}

	async function listPendingDraftIdsForThread(sourceThreadId) {
		return (await listDrafts({ sourceThreadId, status: "pending" })).map((draft) => draft.id);
	}

	async function upsertDraft(input) {
		const action = normalizeDraftAction(input?.action);
		const category = toNonEmptyString(input?.category);
		const name = toNonEmptyString(input?.name);
		if (!action || !category || !name) {
			const error = new Error("Draft action, category, and name are required.");
			error.code = "INVALID_INPUT";
			throw error;
		}

		const files = Array.isArray(input?.files)
			? input.files.map(normalizeDraftBundleFile).filter(Boolean)
			: [];
		if (action !== "delete") {
			const validation = validateSkillBundle({
				name,
				category,
				files,
			});
			if (!validation.valid) {
				const error = new Error(validation.error);
				error.code = "INVALID_INPUT";
				throw error;
			}
		}

		const existingDrafts = await readIndex();
		const now = new Date().toISOString();
		const nextRecordBase = {
			action,
			category,
			name,
			summary: toNonEmptyString(input?.summary),
			rationale: toNonEmptyString(input?.rationale),
			sourceThreadId: toNonEmptyString(input?.sourceThreadId),
			sourceMessageId: toNonEmptyString(input?.sourceMessageId),
			status: "pending",
			updatedAt: now,
		};
		const dedupeKey = buildDraftDedupeKey(nextRecordBase);
		const existingDraft = existingDrafts.find((draft) =>
			draft.status === "pending" && buildDraftDedupeKey(draft) === dedupeKey,
		);
		const draftId = existingDraft?.id ?? createDraftId();
		const bundleDir = await writeBundleFiles(draftId, files);
		const nextDraft = {
			id: draftId,
			createdAt: existingDraft?.createdAt ?? now,
			reviewedAt: null,
			...nextRecordBase,
			bundleDir,
		};
		const nextDrafts = [
			nextDraft,
			...existingDrafts.filter((draft) => draft.id !== draftId),
		];
		await writeIndex(nextDrafts);
		return {
			...nextDraft,
			files,
		};
	}

	async function updateDraftStatus(draftId, status) {
		const existingDrafts = await readIndex();
		const nextDrafts = existingDrafts.map((draft) =>
			draft.id === draftId
				? {
					...draft,
					status,
					reviewedAt: new Date().toISOString(),
					updatedAt: new Date().toISOString(),
				}
				: draft,
		);
		if (nextDrafts.every((draft) => draft.id !== draftId)) {
			const error = new Error(`Draft not found: ${draftId}`);
			error.code = "ENOENT";
			throw error;
		}

		await writeIndex(nextDrafts);
		return getDraft(draftId);
	}

	async function approveDraft(
		draftId,
		{
			createSkillFromBundleImpl,
			updateSkillFromBundleImpl,
			archiveSkillImpl,
		} = {},
	) {
		const draft = await getDraft(draftId);
		if (!draft) {
			const error = new Error(`Draft not found: ${draftId}`);
			error.code = "ENOENT";
			throw error;
		}

		if (draft.status !== "pending") {
			return draft;
		}

		if (draft.action === "create") {
			await createSkillFromBundleImpl({
				category: draft.category,
				name: draft.name,
				files: draft.files,
			});
		} else if (draft.action === "update") {
			await updateSkillFromBundleImpl({
				category: draft.category,
				name: draft.name,
				files: draft.files,
			});
		} else if (draft.action === "delete") {
			await archiveSkillImpl(draft.category, draft.name);
		}

		return updateDraftStatus(draftId, "approved");
	}

	async function rejectDraft(draftId) {
		return updateDraftStatus(draftId, "rejected");
	}

	async function deleteDraft(draftId) {
		const existingDrafts = await readIndex();
		const draft = existingDrafts.find((candidate) => candidate.id === draftId) ?? null;
		if (!draft) {
			return null;
		}

		await writeIndex(existingDrafts.filter((candidate) => candidate.id !== draftId));
		if (draft.bundleDir) {
			await rmIfExists(draft.bundleDir);
		}
		return draft;
	}

	return {
		getDraft,
		listDrafts,
		listPendingDraftIdsForThread,
		upsertDraft,
		approveDraft,
		rejectDraft,
		deleteDraft,
	};
}

module.exports = {
	createHermesSkillDraftManager,
};
