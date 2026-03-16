const assert = require("node:assert/strict");
const test = require("node:test");

const {
	createUIMessageStream,
	createUIMessageStreamResponse,
} = require("ai");

const {
	isFutureChatDelegationAbortError,
	readFutureChatDelegationResponseStream,
} = require("./future-chat-delegation-stream.ts");

test("readFutureChatDelegationResponseStream parses raw SSE response bodies", async () => {
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

	for await (const message of readFutureChatDelegationResponseStream({
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

test("isFutureChatDelegationAbortError matches browser abort variants", () => {
	const namedAbortError = new Error("The operation was aborted.");
	namedAbortError.name = "AbortError";

	assert.equal(
		isFutureChatDelegationAbortError(
			new DOMException("BodyStreamBuffer was aborted", "AbortError"),
		),
		true,
	);
	assert.equal(isFutureChatDelegationAbortError(namedAbortError), true);
	assert.equal(
		isFutureChatDelegationAbortError(
			new Error("BodyStreamBuffer was aborted while reading the response."),
		),
		true,
	);
	assert.equal(isFutureChatDelegationAbortError(new Error("Delegation failed")), false);
});

test("readFutureChatDelegationResponseStream suppresses abort callbacks", async () => {
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
			for await (const message of readFutureChatDelegationResponseStream({
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
			return isFutureChatDelegationAbortError(error);
		},
	);

	assert.deepEqual(seenErrors, []);
});
