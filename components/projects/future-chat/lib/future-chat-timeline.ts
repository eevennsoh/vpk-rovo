import { getMessageText, isMessageVisibleInTranscript, type RovoUIMessage } from "@/lib/rovo-ui-messages";

export interface FutureChatTimelineItem {
	id: string;
	label: string;
	text: string;
	timestampLabel?: string;
}

function formatFutureChatTimelineTimestamp(timestamp: string): string | null {
	const parsedTimestamp = Date.parse(timestamp);
	if (!Number.isFinite(parsedTimestamp)) {
		return null;
	}

	return new Intl.DateTimeFormat(undefined, {
		timeStyle: "short",
	}).format(new Date(parsedTimestamp));
}

function getFutureChatTimelineTimestampLabel(
	message: Pick<RovoUIMessage, "metadata">,
): string | null {
	const createdAt = message.metadata?.createdAt;
	if (typeof createdAt === "string" && createdAt.trim().length > 0) {
		const formattedCreatedAt = formatFutureChatTimelineTimestamp(createdAt);
		if (formattedCreatedAt) {
			return formattedCreatedAt;
		}
	}

	const updatedAt = message.metadata?.updatedAt;
	if (typeof updatedAt === "string" && updatedAt.trim().length > 0) {
		return formatFutureChatTimelineTimestamp(updatedAt);
	}

	return null;
}

export function deriveFutureChatTimelineItems(
	messages: ReadonlyArray<RovoUIMessage>,
): FutureChatTimelineItem[] {
	const visibleUserMessages = messages.filter((message) =>
		message.role === "user" && isMessageVisibleInTranscript(message)
	);
	const totalVisibleUserMessages = visibleUserMessages.length;

	return [...visibleUserMessages].reverse().map((message, index) => ({
		id: message.id,
		label: `Prompt ${totalVisibleUserMessages - index}`,
		text: getMessageText(message),
		timestampLabel: getFutureChatTimelineTimestampLabel(message) ?? undefined,
	}));
}
