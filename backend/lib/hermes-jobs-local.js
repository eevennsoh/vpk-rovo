"use strict";

const crypto = require("node:crypto");
const fs = require("node:fs/promises");
const path = require("node:path");

const { getNonEmptyString } = require("./shared-utils");

const TICK_INTERVAL_MS = 60_000;
const DUE_SOON_RETRY_DELAY_MS = 5 * 60_000;
const MAX_NEXT_OCCURRENCE_STEPS = 60 * 24 * 366;
const WEEKDAY_INDEX = {
	sunday: 0,
	monday: 1,
	tuesday: 2,
	wednesday: 3,
	thursday: 4,
	friday: 5,
	saturday: 6,
};

function createQueue() {
	let tail = Promise.resolve();
	return async function withLock(operation) {
		const next = tail.then(() => operation());
		tail = next.catch(() => {});
		return next;
	};
}

function cloneJson(value) {
	return JSON.parse(JSON.stringify(value));
}

function normalizeJobStatus(value) {
	const normalized = getNonEmptyString(value)?.toLowerCase();
	if (normalized === "running" || normalized === "paused" || normalized === "failed") {
		return normalized;
	}
	return "scheduled";
}

function isValidCronFieldToken(token, min, max) {
	if (token === "*") {
		return true;
	}

	if (!/^\d+$/u.test(token)) {
		return false;
	}

	const value = Number.parseInt(token, 10);
	return Number.isInteger(value) && value >= min && value <= max;
}

function parseCronExpression(schedule) {
	const parts = schedule.trim().split(/\s+/u);
	if (parts.length !== 5) {
		return null;
	}

	const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;
	if (
		!isValidCronFieldToken(minute, 0, 59)
		|| !isValidCronFieldToken(hour, 0, 23)
		|| !isValidCronFieldToken(dayOfMonth, 1, 31)
		|| !isValidCronFieldToken(month, 1, 12)
		|| !isValidCronFieldToken(dayOfWeek, 0, 6)
	) {
		return null;
	}

	return { type: "cron", minute, hour, dayOfMonth, month, dayOfWeek };
}

function parseEverySchedule(schedule) {
	const match = schedule.match(
		/^every\s+(\d+)\s*(m|min|mins|minute|minutes|h|hr|hrs|hour|hours|d|day|days)$/iu,
	);
	if (!match) {
		return null;
	}

	const interval = Number.parseInt(match[1], 10);
	if (!Number.isInteger(interval) || interval <= 0) {
		return null;
	}

	const unitToken = match[2].toLowerCase();
	const unit = unitToken.startsWith("m")
		? "minutes"
		: unitToken.startsWith("h")
			? "hours"
			: "days";

	return {
		type: "every",
		interval,
		unit,
	};
}

function parseWeekdaySchedule(schedule) {
	const match = schedule.match(
		/^(Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday)\s+(\d{1,2}):(\d{2})$/iu,
	);
	if (!match) {
		return null;
	}

	const weekday = WEEKDAY_INDEX[match[1].toLowerCase()];
	const hour = Number.parseInt(match[2], 10);
	const minute = Number.parseInt(match[3], 10);
	if (!Number.isInteger(hour) || hour < 0 || hour > 23) {
		return null;
	}
	if (!Number.isInteger(minute) || minute < 0 || minute > 59) {
		return null;
	}

	return {
		type: "weekday",
		weekday,
		hour,
		minute,
	};
}

function parseSchedule(schedule) {
	const normalized = getNonEmptyString(schedule)?.toLowerCase() ?? "manual";
	if (normalized === "manual") {
		return { type: "manual" };
	}

	return (
		parseEverySchedule(normalized)
		|| parseWeekdaySchedule(schedule)
		|| parseCronExpression(normalized)
	);
}

function validateSchedule(schedule) {
	const parsed = parseSchedule(schedule);
	if (!parsed) {
		const error = new Error(
			"Unsupported schedule format. Use `manual`, `every Nh`, `Sunday 08:00`, or a simple 5-field cron expression.",
		);
		error.code = "INVALID_INPUT";
		throw error;
	}
	return parsed;
}

function matchesCronToken(token, value) {
	return token === "*" || Number.parseInt(token, 10) === value;
}

function matchesCronExpression(parsedSchedule, candidateDate) {
	return (
		matchesCronToken(parsedSchedule.minute, candidateDate.getMinutes())
		&& matchesCronToken(parsedSchedule.hour, candidateDate.getHours())
		&& matchesCronToken(parsedSchedule.dayOfMonth, candidateDate.getDate())
		&& matchesCronToken(parsedSchedule.month, candidateDate.getMonth() + 1)
		&& matchesCronToken(parsedSchedule.dayOfWeek, candidateDate.getDay())
	);
}

function addEveryInterval(referenceDate, parsedSchedule) {
	const nextDate = new Date(referenceDate.getTime());
	if (parsedSchedule.unit === "minutes") {
		nextDate.setMinutes(nextDate.getMinutes() + parsedSchedule.interval);
		return nextDate;
	}
	if (parsedSchedule.unit === "hours") {
		nextDate.setHours(nextDate.getHours() + parsedSchedule.interval);
		return nextDate;
	}
	nextDate.setDate(nextDate.getDate() + parsedSchedule.interval);
	return nextDate;
}

function computeNextWeekdayOccurrence(referenceDate, parsedSchedule) {
	const nextDate = new Date(referenceDate.getTime());
	nextDate.setSeconds(0, 0);
	nextDate.setHours(parsedSchedule.hour, parsedSchedule.minute, 0, 0);
	let dayDelta = parsedSchedule.weekday - nextDate.getDay();
	if (dayDelta < 0 || (dayDelta === 0 && nextDate <= referenceDate)) {
		dayDelta += 7;
	}
	if (dayDelta === 0 && nextDate <= referenceDate) {
		dayDelta = 7;
	}
	nextDate.setDate(nextDate.getDate() + dayDelta);
	return nextDate;
}

function computeNextCronOccurrence(referenceDate, parsedSchedule) {
	const candidateDate = new Date(referenceDate.getTime());
	candidateDate.setSeconds(0, 0);
	candidateDate.setMinutes(candidateDate.getMinutes() + 1);

	for (let index = 0; index < MAX_NEXT_OCCURRENCE_STEPS; index += 1) {
		if (matchesCronExpression(parsedSchedule, candidateDate)) {
			return candidateDate;
		}
		candidateDate.setMinutes(candidateDate.getMinutes() + 1);
	}

	const error = new Error(`Could not compute the next occurrence for schedule: ${referenceDate.toISOString()}`);
	error.code = "INVALID_INPUT";
	throw error;
}

function computeNextRunAt(schedule, {
	now = new Date(),
	referenceDate = now,
} = {}) {
	const parsedSchedule = validateSchedule(schedule);
	if (parsedSchedule.type === "manual") {
		return null;
	}

	if (parsedSchedule.type === "every") {
		return addEveryInterval(referenceDate, parsedSchedule).toISOString();
	}

	if (parsedSchedule.type === "weekday") {
		return computeNextWeekdayOccurrence(referenceDate, parsedSchedule).toISOString();
	}

	return computeNextCronOccurrence(referenceDate, parsedSchedule).toISOString();
}

function createJobId() {
	return `job-${crypto.randomUUID().slice(0, 12)}`;
}

function normalizeJobRecord(job) {
	const nextJob = {
		createdAt: getNonEmptyString(job.createdAt) ?? new Date().toISOString(),
		deliver: getNonEmptyString(job.deliver) ?? "local",
		id: getNonEmptyString(job.id) ?? createJobId(),
		lastError: getNonEmptyString(job.lastError),
		lastResponseText: getNonEmptyString(job.lastResponseText),
		lastRun: job.lastRun && typeof job.lastRun === "object" ? cloneJson(job.lastRun) : null,
		lastRunAt: getNonEmptyString(job.lastRunAt),
		lastStatus: getNonEmptyString(job.lastStatus) ?? getNonEmptyString(job.status) ?? "scheduled",
		name: getNonEmptyString(job.name) ?? "Untitled job",
		nextRunAt: getNonEmptyString(job.nextRunAt),
		prompt: getNonEmptyString(job.prompt) ?? "",
		repeat: job.repeat === true,
		schedule: getNonEmptyString(job.schedule) ?? "manual",
		skills: Array.isArray(job.skills)
			? job.skills.filter((value) => typeof value === "string" && value.trim().length > 0)
			: [],
		status: normalizeJobStatus(job.status),
		updatedAt: getNonEmptyString(job.updatedAt) ?? new Date().toISOString(),
	};

	if (nextJob.status === "paused") {
		nextJob.nextRunAt = null;
	}

	return nextJob;
}

function toPublicJob(job) {
	const normalizedJob = normalizeJobRecord(job);
	const publicJob = {
		...normalizedJob,
		enabled: normalizedJob.status !== "paused",
		error: normalizedJob.lastError,
		last_run: normalizedJob.lastRun ? cloneJson(normalizedJob.lastRun) : null,
		last_error: normalizedJob.lastError,
		last_response_text: normalizedJob.lastResponseText,
		last_run_at: normalizedJob.lastRunAt,
		last_status: normalizedJob.lastStatus,
		next_run_at: normalizedJob.nextRunAt,
		state: normalizedJob.status,
		target: normalizedJob.prompt,
		updated_at: normalizedJob.updatedAt,
	};
	publicJob.raw = cloneJson(publicJob);
	return publicJob;
}

function filterJobs(jobs, searchParams) {
	if (!searchParams || typeof searchParams !== "object") {
		return jobs;
	}

	const statusFilter = getNonEmptyString(searchParams.status)?.toLowerCase() ?? null;
	const enabledFilter = searchParams.enabled;
	return jobs.filter((job) => {
		if (statusFilter && job.status.toLowerCase() !== statusFilter) {
			return false;
		}

		if (enabledFilter !== undefined) {
			const enabled = !(job.status === "paused");
			const normalizedEnabledFilter = enabledFilter === true || enabledFilter === "true" || enabledFilter === "1";
			if (enabled !== normalizedEnabledFilter) {
				return false;
			}
		}

		return true;
	});
}

function createHermesJobsLocalProvider({
	baseDir,
	executeTask,
	logger = console,
	now = () => new Date(),
	onJobSettled,
	tickIntervalMs = TICK_INTERVAL_MS,
} = {}) {
	if (typeof baseDir !== "string" || baseDir.trim().length === 0) {
		throw new Error("createHermesJobsLocalProvider requires a baseDir.");
	}

	const filePath = path.join(baseDir, "hermes-jobs.json");
	const withLock = createQueue();
	const activeJobRuns = new Map();
	let tickerId = null;

	async function readRecords() {
		try {
			const rawText = await fs.readFile(filePath, "utf8");
			const parsed = JSON.parse(rawText);
			if (!Array.isArray(parsed)) {
				return [];
			}
			return parsed.map(normalizeJobRecord);
		} catch (error) {
			if (error?.code === "ENOENT") {
				return [];
			}
			throw error;
		}
	}

	async function writeRecords(records) {
		await fs.mkdir(path.dirname(filePath), { recursive: true });
		await fs.writeFile(filePath, `${JSON.stringify(records, null, 2)}\n`, "utf8");
	}

	async function listRecords() {
		return withLock(() => readRecords());
	}

	async function updateRecord(jobId, updater) {
		return withLock(async () => {
			const records = await readRecords();
			const index = records.findIndex((record) => record.id === jobId);
			if (index < 0) {
				const error = new Error(`Hermes job ${jobId} was not found.`);
				error.code = "ENOENT";
				throw error;
			}

			const previousRecord = records[index];
			const nextRecord = normalizeJobRecord(updater(cloneJson(previousRecord)));
			nextRecord.updatedAt = now().toISOString();
			records[index] = nextRecord;
			await writeRecords(records);
			return cloneJson(nextRecord);
		});
	}

	async function persistRecord(record) {
		return withLock(async () => {
			const records = await readRecords();
			const nextRecord = normalizeJobRecord(record);
			nextRecord.updatedAt = now().toISOString();
			records.push(nextRecord);
			await writeRecords(records);
			return cloneJson(nextRecord);
		});
	}

	async function removeRecord(jobId) {
		return withLock(async () => {
			const records = await readRecords();
			const remainingRecords = records.filter((record) => record.id !== jobId);
			if (remainingRecords.length === records.length) {
				const error = new Error(`Hermes job ${jobId} was not found.`);
				error.code = "ENOENT";
				throw error;
			}
			await writeRecords(remainingRecords);
		});
	}

	async function runJobInternal(jobId, trigger = "manual", context = null) {
		if (activeJobRuns.has(jobId)) {
			return activeJobRuns.get(jobId);
		}

		const normalizedContext = context && typeof context === "object" ? cloneJson(context) : null;
		const job = await updateRecord(jobId, (currentJob) => ({
			...currentJob,
			lastError: null,
			lastRun: {
				startedAt: now().toISOString(),
				finishedAt: null,
				context: normalizedContext,
				error: null,
				status: "running",
				trigger,
			},
			lastRunAt: now().toISOString(),
			lastStatus: "running",
			status: "running",
		}));

		const executionPromise = (async () => {
			try {
				let executionResult = null;
				if (typeof executeTask === "function") {
					executionResult = await executeTask({
						context: normalizedContext,
						job,
						prompt: job.prompt,
						selectedSkillIds: job.skills,
						source: trigger,
					});
				}

				const completedAt = now();
				const completedJob = await updateRecord(jobId, (currentJob) => ({
					...currentJob,
					lastError: null,
					lastResponseText: getNonEmptyString(executionResult?.text),
					lastRun: {
						...(currentJob.lastRun ?? {}),
						context: normalizedContext,
						error: null,
						finishedAt: completedAt.toISOString(),
						status: "completed",
						trigger,
					},
					lastRunAt: completedAt.toISOString(),
					lastStatus: "completed",
					nextRunAt: computeNextRunAt(currentJob.schedule, {
						now: completedAt,
						referenceDate: completedAt,
					}),
					status: currentJob.status === "paused" ? "paused" : "scheduled",
				}));
				if (typeof onJobSettled === "function") {
					try {
						await onJobSettled(toPublicJob(completedJob));
					} catch (error) {
						logger.warn?.("[HERMES_JOBS_LOCAL] onJobSettled failed after completion", {
							error: error instanceof Error ? error.message : String(error),
							jobId,
						});
					}
				}
			} catch (error) {
				const failedAt = now();
				const failedJob = await updateRecord(jobId, (currentJob) => ({
					...currentJob,
					lastError: error instanceof Error ? error.message : String(error),
					lastResponseText: null,
					lastRun: {
						...(currentJob.lastRun ?? {}),
						context: normalizedContext,
						error: error instanceof Error ? error.message : String(error),
						finishedAt: failedAt.toISOString(),
						status: "failed",
						trigger,
					},
					lastRunAt: failedAt.toISOString(),
					lastStatus: "failed",
					nextRunAt: currentJob.schedule === "manual"
						? null
						: new Date(failedAt.getTime() + DUE_SOON_RETRY_DELAY_MS).toISOString(),
					status: "failed",
				}));
				if (typeof onJobSettled === "function") {
					try {
						await onJobSettled(toPublicJob(failedJob));
					} catch (settledError) {
						logger.warn?.("[HERMES_JOBS_LOCAL] onJobSettled failed after failure", {
							error: settledError instanceof Error ? settledError.message : String(settledError),
							jobId,
						});
					}
				}
				logger.warn?.("[HERMES_JOBS_LOCAL] Job execution failed", {
					error: error instanceof Error ? error.message : String(error),
					jobId,
				});
			} finally {
				activeJobRuns.delete(jobId);
			}
		})();

		activeJobRuns.set(jobId, executionPromise);
		return executionPromise;
	}

	async function tickDueJobs() {
		const currentDate = now();
		const records = await listRecords();
		const dueJobRuns = [];
		for (const record of records) {
			if (record.status === "paused" || record.status === "running") {
				continue;
			}
			if (!record.nextRunAt) {
				continue;
			}
			if (new Date(record.nextRunAt) > currentDate) {
				continue;
			}
			dueJobRuns.push(runJobInternal(record.id, "schedule"));
		}
		return Promise.all(dueJobRuns);
	}

	return {
		async listHermesJobs(searchParams) {
			const records = await listRecords();
			return filterJobs(records, searchParams)
				.sort((left, right) => String(right.updatedAt).localeCompare(String(left.updatedAt)))
				.map(toPublicJob);
		},

		async createHermesJob(input) {
			const createdAt = now();
			const schedule = getNonEmptyString(input?.schedule) ?? "manual";
			validateSchedule(schedule);
			const prompt = getNonEmptyString(input?.prompt) ?? getNonEmptyString(input?.target) ?? "";
			const record = await persistRecord({
				createdAt: createdAt.toISOString(),
				deliver: getNonEmptyString(input?.deliver) ?? "local",
				id: createJobId(),
				lastError: null,
				lastRun: null,
				lastRunAt: null,
				lastStatus: "scheduled",
				name: getNonEmptyString(input?.name) ?? "Untitled job",
				nextRunAt: computeNextRunAt(schedule, {
					now: createdAt,
					referenceDate: createdAt,
				}),
				prompt,
				repeat: input?.repeat === true,
				schedule,
				skills: Array.isArray(input?.skills) ? input.skills : [],
				status: "scheduled",
				updatedAt: createdAt.toISOString(),
			});
			return toPublicJob(record);
		},

		async getHermesJob(jobId) {
			const records = await listRecords();
			const record = records.find((candidate) => candidate.id === jobId);
			if (!record) {
				const error = new Error(`Hermes job ${jobId} was not found.`);
				error.code = "ENOENT";
				throw error;
			}
			return toPublicJob(record);
		},

		async updateHermesJob(jobId, input) {
			const updatedRecord = await updateRecord(jobId, (currentJob) => {
				const schedule = "schedule" in (input ?? {})
					? getNonEmptyString(input?.schedule) ?? "manual"
					: currentJob.schedule;
				validateSchedule(schedule);

				const nextStatus = currentJob.status === "paused"
					? "paused"
					: normalizeJobStatus(input?.status ?? currentJob.status);
				const nextJob = {
					...currentJob,
					deliver: "deliver" in (input ?? {})
						? getNonEmptyString(input?.deliver) ?? "local"
						: currentJob.deliver,
					name: "name" in (input ?? {})
						? getNonEmptyString(input?.name) ?? "Untitled job"
						: currentJob.name,
					prompt: "prompt" in (input ?? {})
						? getNonEmptyString(input?.prompt) ?? ""
						: "target" in (input ?? {})
							? getNonEmptyString(input?.target) ?? ""
						: currentJob.prompt,
					repeat: "repeat" in (input ?? {})
						? input.repeat === true
						: currentJob.repeat,
					schedule,
					skills: Array.isArray(input?.skills) ? input.skills : currentJob.skills,
					status: nextStatus,
				};

				if (nextStatus === "paused" || schedule === "manual") {
					nextJob.nextRunAt = null;
				} else if ("schedule" in (input ?? {})) {
					nextJob.nextRunAt = computeNextRunAt(schedule, {
						now: now(),
						referenceDate: now(),
					});
				}

				return nextJob;
			});
			return toPublicJob(updatedRecord);
		},

		async deleteHermesJob(jobId) {
			await removeRecord(jobId);
		},

		async performHermesJobAction(jobId, action) {
			if (action === "run") {
				const pendingJob = await updateRecord(jobId, (currentJob) => ({
					...currentJob,
					lastError: null,
					status: "running",
				}));
				void runJobInternal(jobId, "manual");
				return toPublicJob(pendingJob);
			}

			if (action === "pause") {
				const pausedJob = await updateRecord(jobId, (currentJob) => ({
					...currentJob,
					lastStatus: "paused",
					nextRunAt: null,
					status: "paused",
				}));
				return toPublicJob(pausedJob);
			}

			if (action === "resume") {
				const resumedJob = await updateRecord(jobId, (currentJob) => ({
					...currentJob,
					lastError: null,
					lastStatus: "scheduled",
					nextRunAt: computeNextRunAt(currentJob.schedule, {
						now: now(),
						referenceDate: now(),
					}),
					status: "scheduled",
				}));
				return toPublicJob(resumedJob);
			}

			const error = new Error(`Unsupported Hermes job action: ${action}`);
			error.code = "INVALID_INPUT";
			throw error;
		},

		async runHermesJob(jobId, trigger = "manual", context = null) {
			await runJobInternal(jobId, trigger, context);
			return this.getHermesJob(jobId);
		},

		startJobTicker() {
			if (tickerId !== null) {
				return;
			}
			tickerId = setInterval(() => {
				void tickDueJobs().catch((error) => {
					logger.warn?.("[HERMES_JOBS_LOCAL] Ticker failed", {
						error: error instanceof Error ? error.message : String(error),
					});
				});
			}, tickIntervalMs);
			if (typeof tickerId.unref === "function") {
				tickerId.unref();
			}
		},

		async runDueJobs() {
			await tickDueJobs();
			return this.listHermesJobs();
		},

		stopJobTicker() {
			if (tickerId !== null) {
				clearInterval(tickerId);
				tickerId = null;
			}
		},

		getProviderStatus() {
			return {
				available: true,
				filePath,
				mode: "embedded",
				tickerRunning: tickerId !== null,
			};
		},
	};
}

module.exports = {
	TICK_INTERVAL_MS,
	computeNextRunAt,
	createHermesJobsLocalProvider,
	parseSchedule,
	validateSchedule,
};
