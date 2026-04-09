const assert = require("node:assert/strict");
const test = require("node:test");

const {
	buildHermesJobResultMessage,
	syncHermesJobResultsToRovoThreads,
} = require("./hermes-rovo-job-sync");

test("buildHermesJobResultMessage prefers persisted job response text", () => {
	const message = buildHermesJobResultMessage({
		id: "job-1",
		lastResponseText: "Hi from the scheduled job",
		lastRunAt: "2026-04-09T07:00:00.000Z",
		lastStatus: "completed",
		name: "Say Hi",
	});

	assert.equal(message?.parts?.[0]?.text, "Hi from the scheduled job");
});

test("syncHermesJobResultsToRovoThreads creates a new thread per run when no fixed thread is configured", async () => {
	const createdThreads = [];
	const upsertCalls = [];
	const postedMetadata = [];
	const threadStore = new Map();
	const job = {
		id: "job-1",
		lastResponseText: "Hi from the scheduled job",
		lastRunAt: "2026-04-09T07:00:00.000Z",
		lastStatus: "completed",
		linkedThreadId: null,
		name: "Say Hi",
		postResultToThread: true,
		threadStrategy: "new-per-run",
	};

	await syncHermesJobResultsToRovoThreads({
		jobs: [job],
		onJobPosted: async (postedJob, metadata) => {
			postedMetadata.push({ jobId: postedJob.id, ...metadata });
		},
		rovoAppThreadManager: {
			createThread: async (input) => {
				createdThreads.push(input);
				const thread = {
					id: "rovo-app-thread-1",
					...input,
				};
				threadStore.set(thread.id, thread);
				return thread;
			},
			getThread: async (threadId) => threadStore.get(threadId) ?? null,
			upsertRealtimeMessage: async (threadId, message) => {
				upsertCalls.push({ threadId, message });
				return message;
			},
		},
	});

	assert.equal(createdThreads.length, 1);
	assert.equal(createdThreads[0].title, "Say Hi");
	assert.equal(job.linkedThreadId, null);
	assert.deepEqual(postedMetadata, [
		{
			jobId: "job-1",
			lastPostedRunMarker: "2026-04-09T07:00:00.000Z:completed:",
			linkedThreadId: null,
		},
	]);
	assert.equal(upsertCalls.length, 1);
	assert.equal(upsertCalls[0].threadId, "rovo-app-thread-1");
	assert.equal(upsertCalls[0].message.parts[0].text, "Hi from the scheduled job");
});

test("syncHermesJobResultsToRovoThreads reuses a fixed linked thread when configured", async () => {
	const upsertCalls = [];
	const postedMetadata = [];

	await syncHermesJobResultsToRovoThreads({
		jobs: [
			{
				id: "job-1",
				lastResponseText: "Hi from the scheduled job",
				lastRunAt: "2026-04-09T07:00:00.000Z",
				lastStatus: "completed",
				linkedThreadId: "thread-fixed-1",
				name: "Say Hi",
				postResultToThread: true,
				threadStrategy: "fixed",
			},
		],
		onJobPosted: async (postedJob, metadata) => {
			postedMetadata.push({ jobId: postedJob.id, ...metadata });
		},
		rovoAppThreadManager: {
			createThread: async () => {
				throw new Error("should not create a new thread for fixed strategy");
			},
			getThread: async (threadId) =>
				threadId === "thread-fixed-1" ? { id: threadId, title: "Existing" } : null,
			upsertRealtimeMessage: async (threadId, message) => {
				upsertCalls.push({ threadId, message });
				return message;
			},
		},
	});

	assert.equal(upsertCalls.length, 1);
	assert.equal(upsertCalls[0].threadId, "thread-fixed-1");
	assert.deepEqual(postedMetadata, [
		{
			jobId: "job-1",
			lastPostedRunMarker: "2026-04-09T07:00:00.000Z:completed:",
			linkedThreadId: null,
		},
	]);
});

test("syncHermesJobResultsToRovoThreads skips runs already posted for the same marker", async () => {
	const upsertCalls = [];

	await syncHermesJobResultsToRovoThreads({
		jobs: [
			{
				id: "job-1",
				lastPostedRunMarker: "2026-04-09T07:00:00.000Z:completed:",
				lastResponseText: "Hi from the scheduled job",
				lastRunAt: "2026-04-09T07:00:00.000Z",
				lastStatus: "completed",
				linkedThreadId: null,
				name: "Say Hi",
				postResultToThread: true,
				threadStrategy: "new-per-run",
			},
		],
		rovoAppThreadManager: {
			createThread: async () => ({ id: "should-not-exist" }),
			getThread: async () => null,
			upsertRealtimeMessage: async (threadId, message) => {
				upsertCalls.push({ threadId, message });
				return message;
			},
		},
	});

	assert.equal(upsertCalls.length, 0);
});

test("syncHermesJobResultsToRovoThreads skips auto-creation during scoped thread sync", async () => {
	const createThreadCalls = [];
	const upsertCalls = [];

	await syncHermesJobResultsToRovoThreads({
		jobs: [
			{
				id: "job-1",
				lastResponseText: "Hi from the scheduled job",
				lastRunAt: "2026-04-09T07:00:00.000Z",
				lastStatus: "completed",
				linkedThreadId: null,
				name: "Say Hi",
				postResultToThread: true,
			},
		],
		rovoAppThreadManager: {
			createThread: async (input) => {
				createThreadCalls.push(input);
				return { id: "should-not-exist" };
			},
			getThread: async () => null,
			upsertRealtimeMessage: async (threadId, message) => {
				upsertCalls.push({ threadId, message });
				return message;
			},
		},
		threadId: "rovo-app-thread-1",
	});

	assert.equal(createThreadCalls.length, 0);
	assert.equal(upsertCalls.length, 0);
});
