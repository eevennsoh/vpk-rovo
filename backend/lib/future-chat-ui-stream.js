const {
	parseJsonEventStream,
	readUIMessageStream,
	uiMessageChunkSchema,
} = require("ai");

function unwrapUiMessageChunk(result) {
	if (result && typeof result === "object") {
		if (result.success === true) {
			return result.value;
		}
		if (result.success === false) {
			if (result.error instanceof Error) {
				throw result.error;
			}

			const details =
				result.rawValue !== undefined
					? ` Received: ${JSON.stringify(result.rawValue)}`
					: "";
			throw new Error(`Invalid Future Chat UI message chunk.${details}`);
		}
	}

	throw new Error("Unexpected Future Chat UI message chunk shape.");
}

function toUiMessageChunkStream(stream) {
	return parseJsonEventStream({
		schema: uiMessageChunkSchema,
		stream,
	}).pipeThrough(
		new TransformStream({
			transform(result, controller) {
				controller.enqueue(unwrapUiMessageChunk(result));
			},
		}),
	);
}

function createTappedChunkStream(stream, onChunk) {
	const chunkStream = toUiMessageChunkStream(stream);
	if (typeof onChunk !== "function") {
		return chunkStream;
	}

	return chunkStream.pipeThrough(
		new TransformStream({
			transform(chunk, controller) {
				onChunk(chunk);
				controller.enqueue(chunk);
			},
		}),
	);
}

function upsertMessage(messages, nextMessage) {
	const existingIndex = messages.findIndex((message) => message.id === nextMessage.id);
	if (existingIndex === -1) {
		return [...messages, nextMessage];
	}

	return messages.map((message) =>
		message.id === nextMessage.id ? nextMessage : message,
	);
}

async function collectUiMessagesFromResponseStream({
	initialMessages = [],
	onChunk,
	stream,
}) {
	const messages = Array.isArray(initialMessages) ? [...initialMessages] : [];

	for await (const message of readUIMessageStream({
		stream: createTappedChunkStream(stream, onChunk),
	})) {
		messages.splice(0, messages.length, ...upsertMessage(messages, message));
	}

	return messages;
}

module.exports = {
	collectUiMessagesFromResponseStream,
	createTappedChunkStream,
	toUiMessageChunkStream,
};
