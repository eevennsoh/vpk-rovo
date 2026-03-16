import {
	parseJsonEventStream,
	readUIMessageStream,
	uiMessageChunkSchema,
	type UIMessageChunk,
} from "ai";
import type { RovoUIMessage } from "@/lib/rovo-ui-messages";

const BODY_STREAM_BUFFER_ABORTED_MESSAGE = "BodyStreamBuffer was aborted";

type ParsedUiMessageChunkResult =
	| {
			success: true;
			value: UIMessageChunk;
	  }
	| {
			error?: unknown;
			rawValue?: unknown;
			success: false;
	  };

function unwrapUiMessageChunk(result: unknown): UIMessageChunk {
	if (result && typeof result === "object") {
		const parsedResult = result as ParsedUiMessageChunkResult;
		if (parsedResult.success === true) {
			return parsedResult.value;
		}
		if (parsedResult.success === false) {
			if (parsedResult.error instanceof Error) {
				throw parsedResult.error;
			}

			const details =
				parsedResult.rawValue !== undefined
					? ` Received: ${JSON.stringify(parsedResult.rawValue)}`
					: "";
			throw new Error(`Invalid delegated UI message chunk.${details}`);
		}
	}

	throw new Error("Delegated response stream yielded an unexpected chunk shape.");
}

function toUiMessageChunkStream(
	stream: ReadableStream<Uint8Array<ArrayBufferLike>>,
): ReadableStream<UIMessageChunk> {
	return parseJsonEventStream({
		schema: uiMessageChunkSchema,
		stream,
	}).pipeThrough(
		new TransformStream<unknown, UIMessageChunk>({
			transform(result, controller) {
				controller.enqueue(unwrapUiMessageChunk(result));
			},
		}),
	);
}

export function isFutureChatDelegationAbortError(error: unknown): boolean {
	if (typeof error === "string") {
		return error.includes(BODY_STREAM_BUFFER_ABORTED_MESSAGE);
	}

	if (!error || typeof error !== "object") {
		return false;
	}

	const abortLikeError = error as {
		code?: unknown;
		message?: unknown;
		name?: unknown;
	};

	if (abortLikeError.name === "AbortError" || abortLikeError.code === "ABORT_ERR") {
		return true;
	}

	return (
		typeof abortLikeError.message === "string"
		&& abortLikeError.message.includes(BODY_STREAM_BUFFER_ABORTED_MESSAGE)
	);
}

export function readFutureChatDelegationResponseStream({
	onError,
	stream,
	terminateOnError = false,
}: {
	onError?: (error: unknown) => void;
	stream: ReadableStream<Uint8Array<ArrayBufferLike>>;
	terminateOnError?: boolean;
}) {
	return readUIMessageStream<RovoUIMessage>({
		onError: (error) => {
			if (isFutureChatDelegationAbortError(error)) {
				return;
			}

			onError?.(error);
		},
		stream: toUiMessageChunkStream(stream),
		terminateOnError,
	});
}
