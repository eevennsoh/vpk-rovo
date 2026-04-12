const fs = require("node:fs/promises");
const path = require("node:path");

function normalizeJobLinkRecord(rawRecord) {
	if (!rawRecord || typeof rawRecord !== "object") {
		return null;
	}

	const linkedThreadId =
		typeof rawRecord.linkedThreadId === "string" && rawRecord.linkedThreadId.trim()
			? rawRecord.linkedThreadId.trim()
			: null;
	const threadStrategy =
		rawRecord.threadStrategy === "fixed" || rawRecord.threadStrategy === "new-per-run"
			? rawRecord.threadStrategy
			: linkedThreadId
				? "fixed"
				: "new-per-run";

	return {
		artifactTarget:
			typeof rawRecord.artifactTarget === "string" && rawRecord.artifactTarget.trim()
				? rawRecord.artifactTarget.trim()
				: null,
		lastPostedRunMarker:
			typeof rawRecord.lastPostedRunMarker === "string" && rawRecord.lastPostedRunMarker.trim()
				? rawRecord.lastPostedRunMarker.trim()
				: null,
		linkedThreadId,
		postResultToThread: rawRecord.postResultToThread === true,
		surface:
			typeof rawRecord.surface === "string" && rawRecord.surface.trim()
				? rawRecord.surface.trim()
				: null,
		threadStrategy,
	};
}

function createHermesJobLinkManager({ baseDir }) {
	const filePath = path.join(baseDir, "hermes-job-links.json");

	async function readAll() {
		try {
			const raw = await fs.readFile(filePath, "utf8");
			const parsed = JSON.parse(raw);
			if (!parsed || typeof parsed !== "object") {
				return {};
			}

			return Object.fromEntries(
				Object.entries(parsed)
					.map(([jobId, record]) => [jobId, normalizeJobLinkRecord(record)])
					.filter(([, record]) => record !== null),
			);
		} catch (error) {
			if (error && error.code === "ENOENT") {
				return {};
			}
			throw error;
		}
	}

	async function writeAll(records) {
		await fs.mkdir(path.dirname(filePath), { recursive: true });
		await fs.writeFile(filePath, `${JSON.stringify(records, null, 2)}\n`, "utf8");
	}

	async function getLink(jobId) {
		const records = await readAll();
		return records[jobId] ?? null;
	}

	async function setLink(jobId, record) {
		const records = await readAll();
		const normalizedRecord = normalizeJobLinkRecord(record);
		if (!normalizedRecord) {
			delete records[jobId];
		} else {
			records[jobId] = normalizedRecord;
		}
		await writeAll(records);
		return records[jobId] ?? null;
	}

	async function removeLink(jobId) {
		const records = await readAll();
		delete records[jobId];
		await writeAll(records);
	}

	async function mergeJobsWithLinks(jobs) {
		const records = await readAll();
		return jobs.map((job) => ({
			...job,
			...(records[job.id] ?? {}),
		}));
	}

	return {
		getLink,
		mergeJobsWithLinks,
		removeLink,
		setLink,
	};
}

module.exports = {
	createHermesJobLinkManager,
};
