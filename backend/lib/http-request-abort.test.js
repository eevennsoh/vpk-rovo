const assert = require("node:assert/strict");
const { EventEmitter } = require("node:events");
const test = require("node:test");

const { createAbortControllerFromRequest } = require("./http-request-abort");

test("createAbortControllerFromRequest aborts when the request is aborted", () => {
	const req = new EventEmitter();
	const res = new EventEmitter();
	res.writableFinished = false;
	const { abortController } = createAbortControllerFromRequest(req, res);

	assert.equal(abortController.signal.aborted, false);

	req.emit("aborted");

	assert.equal(abortController.signal.aborted, true);
});

test("createAbortControllerFromRequest aborts when the response closes early", () => {
	const req = new EventEmitter();
	const res = new EventEmitter();
	res.writableFinished = false;
	const { abortController } = createAbortControllerFromRequest(req, res);

	res.emit("close");

	assert.equal(abortController.signal.aborted, true);
});

test("createAbortControllerFromRequest ignores request close without an abort event", () => {
	const req = new EventEmitter();
	const res = new EventEmitter();
	res.writableFinished = false;
	const { abortController } = createAbortControllerFromRequest(req, res);

	req.emit("close");

	assert.equal(abortController.signal.aborted, false);
});

test("createAbortControllerFromRequest ignores response close after finish", () => {
	const req = new EventEmitter();
	const res = new EventEmitter();
	res.writableFinished = true;
	const { abortController } = createAbortControllerFromRequest(req, res);

	res.emit("close");

	assert.equal(abortController.signal.aborted, false);
});

test("createAbortControllerFromRequest cleanup removes listeners", () => {
	const req = new EventEmitter();
	const res = new EventEmitter();
	res.writableFinished = false;
	const { abortController, cleanup } = createAbortControllerFromRequest(req, res);

	cleanup();
	req.emit("aborted");
	res.emit("close");

	assert.equal(abortController.signal.aborted, false);
	assert.equal(req.listenerCount("aborted"), 0);
	assert.equal(res.listenerCount("close"), 0);
});
