const assert = require("node:assert/strict");
const test = require("node:test");

const {
	createUIMessageStream,
	createUIMessageStreamResponse,
} = require("ai");

const {
	isRovoAppDelegationAbortError,
	readRovoAppDelegationResponseStream,
} = require("./rovo-app-delegation-stream.ts");

test("readRovoAppDelegationResponseStream parses raw SSE response bodies", async () => {
	const stream = createUIMessageStream({
		execute: async ({ writer }) => {
			writer.write({ type: "text-start", id: "delegated-text" });
			writer.write({
				type: "text-delta",
				id: "delegated-text",
				delta: "Delegated result",
			});
			writer.write({ type: "text-end", id: "delegated-text" });
		},
	});
	const response = createUIMessageStreamResponse({ stream });
	const messages = [];

	for await (const message of readRovoAppDelegationResponseStream({
		stream: response.body,
		terminateOnError: true,
	})) {
		messages.push(message);
	}

	assert.equal(messages.length > 0, true);
	assert.deepEqual(messages.at(-1)?.parts, [
		{
			providerMetadata: undefined,
			state: "done",
			text: "Delegated result",
			type: "text",
		},
	]);
});

test("isRovoAppDelegationAbortError matches browser abort variants", () => {
	const namedAbortError = new Error("The operation was aborted.");
	namedAbortError.name = "AbortError";

	assert.equal(
		isRovoAppDelegationAbortError(
			new DOMException("BodyStreamBuffer was aborted", "AbortError"),
		),
		true,
	);
	assert.equal(isRovoAppDelegationAbortError(namedAbortError), true);
	assert.equal(
		isRovoAppDelegationAbortError(
			new Error("BodyStreamBuffer was aborted while reading the response."),
		),
		true,
	);
	assert.equal(isRovoAppDelegationAbortError(new Error("Delegation failed")), false);
});

test("readRovoAppDelegationResponseStream suppresses abort callbacks", async () => {
	const abortError = new DOMException(
		"BodyStreamBuffer was aborted",
		"AbortError",
	);
	const seenErrors = [];
	const stream = new ReadableStream({
		start(controller) {
			controller.error(abortError);
		},
	});

	await assert.rejects(
		async () => {
			for await (const message of readRovoAppDelegationResponseStream({
				stream,
				onError: (error) => {
					seenErrors.push(error);
				},
				terminateOnError: true,
			})) {
				void message;
			}
		},
		(error) => {
			return isRovoAppDelegationAbortError(error);
		},
	);

	assert.deepEqual(seenErrors, []);
});
