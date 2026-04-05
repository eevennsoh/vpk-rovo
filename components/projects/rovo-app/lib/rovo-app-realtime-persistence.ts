interface RealtimeTextLike {
	state?: string;
	type?: string;
}

interface RealtimeMessageLike {
	parts?: ReadonlyArray<RealtimeTextLike>;
}

export function hasStreamingRealtimeMessages(
	messages: ReadonlyArray<RealtimeMessageLike>,
): boolean {
	return messages.some((message) =>
		(message.parts ?? []).some(
			(part) => part.type === "text" && part.state === "streaming",
		),
	);
}

export function shouldHydratePersistedRealtimeMessages({
	currentMessages,
	currentVersion,
	requestVersion,
}: {
	currentMessages: ReadonlyArray<RealtimeMessageLike>;
	currentVersion: number;
	requestVersion: number;
}): boolean {
	if (requestVersion !== currentVersion) {
		return false;
	}

	return !hasStreamingRealtimeMessages(currentMessages);
}
