import { getMessageText, isMessageVisibleInTranscript, type RovoUIMessage } from "@/lib/rovo-ui-messages";

export interface RovoAppTimelineItem {
	id: string;
	label: string;
	text: string;
	timestampLabel?: string;
}

const ROVO_APP_TIMELINE_TIMESTAMP_FORMATTER = new Intl.DateTimeFormat("en-US", {
	timeStyle: "short",
});

function formatRovoAppTimelineTimestamp(timestamp: string): string | null {
	const parsedTimestamp = Date.parse(timestamp);
	if (!Number.isFinite(parsedTimestamp)) {
		return null;
	}

	return ROVO_APP_TIMELINE_TIMESTAMP_FORMATTER.format(new Date(parsedTimestamp));
}

function getRovoAppTimelineTimestampLabel(
	message: Pick<RovoUIMessage, "metadata">,
): string | null {
	const createdAt = message.metadata?.createdAt;
	if (typeof createdAt === "string" && createdAt.trim().length > 0) {
		const formattedCreatedAt = formatRovoAppTimelineTimestamp(createdAt);
		if (formattedCreatedAt) {
			return formattedCreatedAt;
		}
	}

	const updatedAt = message.metadata?.updatedAt;
	if (typeof updatedAt === "string" && updatedAt.trim().length > 0) {
		return formatRovoAppTimelineTimestamp(updatedAt);
	}

	return null;
}

export function deriveRovoAppTimelineItems(
	messages: ReadonlyArray<RovoUIMessage>,
): RovoAppTimelineItem[] {
	const visibleUserMessages = messages.filter((message) =>
		message.role === "user" && isMessageVisibleInTranscript(message)
	);
	const totalVisibleUserMessages = visibleUserMessages.length;

	return [...visibleUserMessages].reverse().map((message, index) => ({
		id: message.id,
		label: `Prompt ${totalVisibleUserMessages - index}`,
		text: getMessageText(message),
		timestampLabel: getRovoAppTimelineTimestampLabel(message) ?? undefined,
	}));
}
