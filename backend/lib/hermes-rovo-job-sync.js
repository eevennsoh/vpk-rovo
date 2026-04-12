const crypto = require("node:crypto");

function hashValue(value) {
	return crypto.createHash("sha1").update(value).digest("hex").slice(0, 12);
}

function getNonEmptyString(value) {
	return typeof value === "string" && value.trim() ? value.trim() : null;
}

function normalizeJobRunMarker(job) {
	const lastRunAt =
		(typeof job.last_run_at === "string" && job.last_run_at.trim())
		|| (typeof job.lastRunAt === "string" && job.lastRunAt.trim())
		|| null;
	const lastStatus =
		(typeof job.last_status === "string" && job.last_status.trim())
		|| (typeof job.lastStatus === "string" && job.lastStatus.trim())
		|| (typeof job.state === "string" && job.state.trim())
		|| null;
	const lastError =
		(typeof job.last_error === "string" && job.last_error.trim())
		|| (typeof job.lastError === "string" && job.lastError.trim())
		|| null;

	if (!lastRunAt && !lastError) {
		return null;
	}

	return `${lastRunAt ?? "no-run"}:${lastStatus ?? "unknown"}:${lastError ?? ""}`;
}

function getThreadStrategy(job) {
	const strategy =
		getNonEmptyString(job.threadStrategy)
		|| getNonEmptyString(job.raw?.threadStrategy);
	return strategy === "fixed" ? "fixed" : "new-per-run";
}

function buildHermesJobResultMessage(job) {
	const marker = normalizeJobRunMarker(job);
	if (!marker) {
		return null;
	}

	const prompt =
		(typeof job.prompt === "string" && job.prompt.trim())
		|| (typeof job.target === "string" && job.target.trim())
		|| null;
	const nextRunAt =
		(typeof job.next_run_at === "string" && job.next_run_at.trim())
		|| (typeof job.nextRunAt === "string" && job.nextRunAt.trim())
		|| null;
	const lastStatus =
		(typeof job.last_status === "string" && job.last_status.trim())
		|| (typeof job.lastStatus === "string" && job.lastStatus.trim())
		|| (typeof job.state === "string" && job.state.trim())
		|| "completed";
	const lastError =
		(typeof job.last_error === "string" && job.last_error.trim())
		|| (typeof job.lastError === "string" && job.lastError.trim())
		|| null;
	const timestamp =
		(typeof job.last_run_at === "string" && job.last_run_at.trim())
		|| (typeof job.lastRunAt === "string" && job.lastRunAt.trim())
		|| new Date().toISOString();
	const responseText =
		getNonEmptyString(job.lastResponseText)
		|| getNonEmptyString(job.last_response_text)
		|| getNonEmptyString(job.raw?.lastResponseText)
		|| getNonEmptyString(job.raw?.last_response_text);
	const lines = responseText
		? [responseText]
		: [
			`Hermes job update: ${typeof job.name === "string" && job.name.trim() ? job.name.trim() : job.id}`,
			`Status: ${lastError ? "failed" : lastStatus}`,
		];
	if (!responseText && prompt) {
		lines.push(`Prompt: ${prompt}`);
	}
	if (!responseText && lastError) {
		lines.push(`Error: ${lastError}`);
	}
	if (!responseText && nextRunAt) {
		lines.push(`Next run: ${nextRunAt}`);
	}

	return {
		id: `hermes-job-result-${job.id}-${hashValue(marker)}`,
		role: "assistant",
		metadata: {
			createdAt: timestamp,
			updatedAt: timestamp,
		},
		parts: [
			{
				type: "text",
				text: lines.join("\n"),
				state: "done",
			},
		],
	};
}

async function ensureJobThread({
	job,
	rovoAppThreadManager,
	persistLinkedThreadId = false,
}) {
	const linkedThreadId = getNonEmptyString(job.linkedThreadId);
	if (persistLinkedThreadId && linkedThreadId) {
		const existingThread = await rovoAppThreadManager.getThread(linkedThreadId);
		if (existingThread) {
			return {
				linkedThreadId,
				shouldPersistLinkedThreadId: false,
			};
		}
	}

	const thread = await rovoAppThreadManager.createThread({
		title:
			typeof job.name === "string" && job.name.trim()
				? job.name.trim()
				: "Hermes job",
		visibility: "private",
	});
	const createdThreadId = getNonEmptyString(thread?.id);
	if (!createdThreadId) {
		return null;
	}

	return {
		linkedThreadId: createdThreadId,
		shouldPersistLinkedThreadId: persistLinkedThreadId,
	};
}

async function syncHermesJobResultsToRovoThreads({
	jobs,
	onJobPosted,
	rovoAppThreadManager,
	threadId,
}) {
	for (const job of jobs) {
		if (!job || job.postResultToThread !== true) {
			continue;
		}

		const runMarker = normalizeJobRunMarker(job);
		if (!runMarker) {
			continue;
		}

		const lastPostedRunMarker =
			getNonEmptyString(job.lastPostedRunMarker)
			|| getNonEmptyString(job.raw?.lastPostedRunMarker);
		if (lastPostedRunMarker === runMarker) {
			continue;
		}

		const message = buildHermesJobResultMessage(job);
		if (!message) {
			continue;
		}

		if (threadId && job.linkedThreadId !== threadId) {
			continue;
		}

		let targetThreadId = null;
		let shouldPersistLinkedThreadId = false;
		if (threadId) {
			targetThreadId = getNonEmptyString(job.linkedThreadId);
		} else if (getThreadStrategy(job) === "fixed" && getNonEmptyString(job.linkedThreadId)) {
			const ensuredThread = await ensureJobThread({
				job,
				persistLinkedThreadId: true,
				rovoAppThreadManager,
			});
			targetThreadId = ensuredThread?.linkedThreadId ?? null;
			shouldPersistLinkedThreadId = ensuredThread?.shouldPersistLinkedThreadId === true;
		} else {
			const ensuredThread = await ensureJobThread({
				job,
				persistLinkedThreadId: false,
				rovoAppThreadManager,
			});
			targetThreadId = ensuredThread?.linkedThreadId ?? null;
		}

		if (!targetThreadId) {
			continue;
		}

		await rovoAppThreadManager.upsertRealtimeMessage(targetThreadId, message);
		if (typeof onJobPosted === "function") {
			await onJobPosted(job, {
				lastPostedRunMarker: runMarker,
				linkedThreadId: shouldPersistLinkedThreadId ? targetThreadId : null,
			});
		}
	}
}

module.exports = {
	buildHermesJobResultMessage,
	syncHermesJobResultsToRovoThreads,
};
