const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const {
	createHermesJobsLocalProvider,
} = require("./hermes-jobs-local");
const { createHermesJobsProvider } = require("./hermes-jobs-provider");

async function createTempManager(options = {}) {
	const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "vpk-hermes-jobs-"));
	const clock = { currentTime: options.startTime ?? new Date("2026-04-05T21:00:00.000Z") };
	const executorCalls = [];
	const settledCalls = [];
	const manager = createHermesJobsLocalProvider({
		baseDir: tempDir,
		executeTask: async (input) => {
			executorCalls.push(input);
			return {
				ok: true,
				text: options.executionText ?? "Hello from Hermes",
			};
		},
		now: () => new Date(clock.currentTime),
		onJobSettled: async (job) => {
			settledCalls.push(job);
		},
		tickIntervalMs: options.tickIntervalMs,
	});

	return {
		clock,
		executorCalls,
		manager,
		settledCalls,
		tempDir,
	};
}

test("createHermesJobsLocalManager supports CRUD and pause/resume actions", async () => {
	const fixture = await createTempManager();
	try {
		const createdJob = await fixture.manager.createHermesJob({
			name: "Nightly summary",
			prompt: "summarise the latest work",
			schedule: "every 1h",
		});

		assert.match(createdJob.id, /^job-/u);
		assert.equal(createdJob.name, "Nightly summary");
		assert.equal(createdJob.enabled, true);
		assert.equal(createdJob.state, "scheduled");
		assert.equal(createdJob.schedule, "every 1h");
		assert.ok(createdJob.nextRunAt);

		const listedJobs = await fixture.manager.listHermesJobs();
		assert.equal(listedJobs.length, 1);
		assert.equal(listedJobs[0].id, createdJob.id);

		const fetchedJob = await fixture.manager.getHermesJob(createdJob.id);
		assert.equal(fetchedJob.id, createdJob.id);
		assert.equal(fetchedJob.raw.prompt, "summarise the latest work");

		const pausedJob = await fixture.manager.performHermesJobAction(createdJob.id, "pause");
		assert.equal(pausedJob.enabled, false);
		assert.equal(pausedJob.state, "paused");
		assert.equal(pausedJob.nextRunAt, null);

		const resumedJob = await fixture.manager.performHermesJobAction(createdJob.id, "resume");
		assert.equal(resumedJob.enabled, true);
		assert.equal(resumedJob.state, "scheduled");
		assert.ok(resumedJob.nextRunAt);

		const updatedJob = await fixture.manager.updateHermesJob(createdJob.id, {
			name: "Updated nightly summary",
			schedule: "Sunday 08:00",
			target: "generate a compact digest",
		});
		assert.equal(updatedJob.name, "Updated nightly summary");
		assert.equal(updatedJob.schedule, "Sunday 08:00");
		assert.equal(updatedJob.raw.target, "generate a compact digest");

		await fixture.manager.deleteHermesJob(createdJob.id);
		await assert.rejects(
			() => fixture.manager.getHermesJob(createdJob.id),
			(error) => error && error.code === "ENOENT",
		);
	} finally {
		await fixture.manager.stopJobTicker();
		await fs.rm(fixture.tempDir, { recursive: true, force: true });
	}
});

test("runDueJobs executes due jobs and advances the next run time", async () => {
	const fixture = await createTempManager({
		startTime: new Date("2026-04-05T21:00:00.000Z"),
	});
	try {
		const job = await fixture.manager.createHermesJob({
			name: "Nightly product summary",
			prompt: "summarise the latest work",
			schedule: "0 22 * * *",
		});

		assert.ok(job.nextRunAt);
		const dueTime = new Date(job.nextRunAt);
		fixture.clock.currentTime = new Date(dueTime.getTime() + 60_000);

		await fixture.manager.runDueJobs();
		await new Promise((resolve) => setTimeout(resolve, 40));
		const completedJob = await fixture.manager.getHermesJob(job.id);
		assert.equal(fixture.executorCalls.length, 1);
		assert.equal(fixture.executorCalls[0].source, "schedule");
		assert.equal(fixture.executorCalls[0].job.id, job.id);

		assert.equal(completedJob.id, job.id);
		assert.equal(completedJob.state, "scheduled");
		assert.equal(completedJob.lastError, null);
		assert.equal(completedJob.lastResponseText, "Hello from Hermes");
		assert.equal(completedJob.lastRun.status, "completed");
		assert.ok(completedJob.nextRunAt);
		assert.ok(new Date(completedJob.nextRunAt).getTime() > dueTime.getTime());
		assert.equal(fixture.settledCalls.length, 1);
		assert.equal(fixture.settledCalls[0].lastResponseText, "Hello from Hermes");
	} finally {
		await fixture.manager.stopJobTicker();
		await fs.rm(fixture.tempDir, { recursive: true, force: true });
	}
});

test("startJobTicker triggers due jobs on an interval", async () => {
	const fixture = await createTempManager({
		startTime: new Date("2026-04-05T21:00:00.000Z"),
		tickIntervalMs: 15,
	});
	try {
		await fixture.manager.createHermesJob({
			name: "Weekly memory prune",
			prompt: "prune redundant entries",
			schedule: "0 22 * * *",
		});
		const currentJob = await fixture.manager.listHermesJobs();
		const dueTime = new Date(currentJob[0].nextRunAt);
		fixture.clock.currentTime = new Date(dueTime.getTime() + 60_000);

		fixture.manager.startJobTicker();
		await new Promise((resolve) => setTimeout(resolve, 500));
		fixture.manager.stopJobTicker();

		assert.ok(fixture.executorCalls.length >= 1);
		const finalJob = await fixture.manager.getHermesJob((await fixture.manager.listHermesJobs())[0].id);
		assert.equal(finalJob.state, "scheduled");
		assert.equal(finalJob.lastRun.status, "completed");
	} finally {
		fixture.manager.stopJobTicker();
		await fs.rm(fixture.tempDir, { recursive: true, force: true });
	}
});

test("createHermesJobsProvider defaults to the local provider", async () => {
	const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "vpk-hermes-jobs-provider-"));
	try {
		const provider = createHermesJobsProvider({
			baseDir: tempDir,
		});
		assert.equal(typeof provider.listHermesJobs, "function");
		assert.equal(typeof provider.performHermesJobAction, "function");
	} finally {
		await fs.rm(tempDir, { recursive: true, force: true });
	}
});
