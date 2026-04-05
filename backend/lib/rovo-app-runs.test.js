const test = require("node:test");
const assert = require("node:assert/strict");
const { EventEmitter } = require("node:events");

const { createRovoAppRunManager } = require("./rovo-app-runs");

function createMockResponse() {
	const emitter = new EventEmitter();
	const headers = new Map();
	const writes = [];

	return {
		ended: false,
		headers,
		statusCode: null,
		writes,
		end() {
			this.ended = true;
		},
		emit(eventName) {
			emitter.emit(eventName);
		},
		flushHeaders() {},
		once(eventName, listener) {
			emitter.once(eventName, listener);
			return this;
		},
		setHeader(name, value) {
			headers.set(name, value);
		},
		status(code) {
			this.statusCode = code;
			return this;
		},
		write(chunk) {
			writes.push(chunk);
		},
	};
}

test("run manager replays buffered chunks to late subscribers and returns to background when detached", () => {
	const manager = createRovoAppRunManager();
	const run = manager.createRun({
		threadId: "thread-1",
		requestBody: { id: "thread-1", messages: [] },
	});

	manager.enqueueRun(run.threadId);
	manager.markRunStarted(run.threadId, {
		portIndex: 1,
		rovoPort: 8001,
		status: "background",
	});
	manager.appendChunk(run.threadId, "data: first\n\n");

	const firstSubscriber = createMockResponse();
	const firstSubscriberId = manager.attachSubscriber(run.threadId, firstSubscriber);
	assert.ok(firstSubscriberId);
	assert.equal(manager.getRun(run.threadId)?.status, "streaming");
	assert.deepEqual(firstSubscriber.writes, ["data: first\n\n"]);

	manager.appendChunk(run.threadId, "data: second\n\n");
	assert.deepEqual(firstSubscriber.writes, [
		"data: first\n\n",
		"data: second\n\n",
	]);

	firstSubscriber.emit("close");
	assert.equal(manager.getRun(run.threadId)?.status, "background");

	const secondSubscriber = createMockResponse();
	manager.attachSubscriber(run.threadId, secondSubscriber);
	assert.deepEqual(secondSubscriber.writes, [
		"data: first\n\n",
		"data: second\n\n",
	]);
});

test("cancelRun aborts the active run and clears queued entries", () => {
	const manager = createRovoAppRunManager();
	const run = manager.createRun({
		threadId: "thread-2",
		requestBody: { id: "thread-2", messages: [] },
		requestedPortIndex: 2,
	});

	manager.enqueueRun(run.threadId);
	const cancelledRun = manager.cancelRun(run.threadId);
	assert.equal(cancelledRun?.abortController.signal.aborted, true);
	assert.equal(manager.getRun(run.threadId), null);
	assert.deepEqual(manager.listQueuedThreadIds(), []);
});
