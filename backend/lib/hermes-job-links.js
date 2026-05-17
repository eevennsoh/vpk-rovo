const fs = require("node:fs/promises");
const path = require("node:path");

function getNonEmptyString(value) {
	return typeof value === "string" && value.trim()
		? value.trim()
		: null;
}

function normalizeJobTrigger(rawTrigger) {
	if (!rawTrigger || typeof rawTrigger !== "object") {
		return null;
	}

	const type = getNonEmptyString(rawTrigger.type);
	if (!type) {
		return null;
	}

	const trigger = { type };
	const board = getNonEmptyString(rawTrigger.board);
	const column = getNonEmptyString(rawTrigger.column);
	const label = getNonEmptyString(rawTrigger.label);
	if (board) {
		trigger.board = board;
	}
	if (column) {
		trigger.column = column;
	}
	if (label) {
		trigger.label = label;
	}
	return trigger;
}

function normalizeJobRunHistory(rawRunHistory) {
	if (!Array.isArray(rawRunHistory)) {
		return [];
	}

	return rawRunHistory
		.map((run) => {
			if (!run || typeof run !== "object") {
				return null;
			}

			const id = getNonEmptyString(run.id);
			if (!id) {
				return null;
			}

			return {
				id,
				jobId: getNonEmptyString(run.jobId),
				source: getNonEmptyString(run.source),
				triggerLabel: getNonEmptyString(run.triggerLabel),
				status: getNonEmptyString(run.status) ?? "completed",
				startedAt: getNonEmptyString(run.startedAt),
				finishedAt: getNonEmptyString(run.finishedAt),
				processedTicketCodes: Array.isArray(run.processedTicketCodes)
					? run.processedTicketCodes.filter((value) => typeof value === "string" && value.trim())
					: [],
				skippedTicketCodes: Array.isArray(run.skippedTicketCodes)
					? run.skippedTicketCodes.filter((value) => typeof value === "string" && value.trim())
					: [],
				failedTicketCodes: Array.isArray(run.failedTicketCodes)
					? run.failedTicketCodes.filter((value) => typeof value === "string" && value.trim())
					: [],
				threadLinks: Array.isArray(run.threadLinks)
					? run.threadLinks
							.map((link) => {
								if (!link || typeof link !== "object") {
									return null;
								}
								const ticketCode = getNonEmptyString(link.ticketCode);
								const threadId = getNonEmptyString(link.threadId);
								return ticketCode && threadId ? { ticketCode, threadId } : null;
							})
							.filter(Boolean)
					: [],
				summary: getNonEmptyString(run.summary),
			};
		})
		.filter(Boolean)
		.slice(0, 10);
}

function normalizeJobLinkRecord(rawRecord) {
	if (!rawRecord || typeof rawRecord !== "object") {
		return null;
	}

	const linkedThreadId =
		getNonEmptyString(rawRecord.linkedThreadId);
	const threadStrategy =
		rawRecord.threadStrategy === "fixed" || rawRecord.threadStrategy === "new-per-run"
			? rawRecord.threadStrategy
			: linkedThreadId
				? "fixed"
				: "new-per-run";

	return {
		artifactTarget:
			getNonEmptyString(rawRecord.artifactTarget),
		lastPostedRunMarker:
			getNonEmptyString(rawRecord.lastPostedRunMarker),
		linkedThreadId,
		postResultToThread: rawRecord.postResultToThread === true,
		runHistory: normalizeJobRunHistory(rawRecord.runHistory),
		surface:
			getNonEmptyString(rawRecord.surface),
		threadStrategy,
		trigger: normalizeJobTrigger(rawRecord.trigger),
		triggerLabel: getNonEmptyString(rawRecord.triggerLabel),
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
