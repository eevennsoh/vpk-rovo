export type RealtimeAssistantTextSource = "none" | "text" | "audio_transcript";

export interface RealtimeAssistantTextStreamState {
	hasStarted: boolean;
	itemId: string | null;
	responseId: string | null;
	source: RealtimeAssistantTextSource;
	transcript: string;
}

export interface RealtimeAssistantTextDelta {
	delta: string;
	itemId?: string | null;
	responseId?: string | null;
	source: Exclude<RealtimeAssistantTextSource, "none">;
}

export interface RealtimeAssistantTextDeltaResult {
	messageId: string | null;
	shouldEmitStart: boolean;
	state: RealtimeAssistantTextStreamState;
}

export function createRealtimeAssistantTextStreamState(): RealtimeAssistantTextStreamState {
	return {
		hasStarted: false,
		itemId: null,
		responseId: null,
		source: "none",
		transcript: "",
	};
}

function resetAssistantTextBoundary(
	state: RealtimeAssistantTextStreamState,
	{
		itemId,
		responseId,
	}: {
		itemId?: string | null;
		responseId?: string | null;
	},
): RealtimeAssistantTextStreamState {
	return {
		...createRealtimeAssistantTextStreamState(),
		itemId: itemId ?? null,
		responseId: responseId ?? null,
	};
}

export function reduceRealtimeAssistantTextDelta(
	state: RealtimeAssistantTextStreamState,
	{
		delta,
		itemId,
		responseId,
		source,
	}: RealtimeAssistantTextDelta,
): RealtimeAssistantTextDeltaResult {
	let nextState = state;

	if (responseId) {
		if (state.responseId !== responseId) {
			nextState = resetAssistantTextBoundary(state, {
				itemId,
				responseId,
			});
		} else if (!state.itemId && itemId) {
			nextState = {
				...state,
				itemId,
			};
		}
	} else if (itemId && state.itemId !== itemId) {
		nextState = resetAssistantTextBoundary(state, {
			itemId,
		});
	}

	if (nextState.source === "text" && source === "audio_transcript") {
		return {
			messageId: nextState.itemId,
			shouldEmitStart: false,
			state: nextState,
		};
	}

	const shouldEmitStart = !nextState.hasStarted;
	nextState = {
		...nextState,
		hasStarted: true,
		source,
		transcript: `${nextState.transcript}${delta}`,
	};

	return {
		messageId: nextState.itemId,
		shouldEmitStart,
		state: nextState,
	};
}

export function finalizeRealtimeAssistantText(
	state: RealtimeAssistantTextStreamState,
): {
	messageId: string | null;
	text: string;
} {
	return {
		messageId: state.itemId,
		text: state.transcript,
	};
}
