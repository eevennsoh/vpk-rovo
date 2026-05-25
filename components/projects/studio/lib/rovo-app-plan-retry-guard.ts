const STUCK_PORT_TEXT = "Rovo port is stuck";
const EXPIRED_CLARIFICATION_CODE = "deferred_tool_expired";
const TOOL_FIRST_FAILURE_TEXT = "No relevant integration tool call was observed";
const ROVO_UNAVAILABLE_CODE = "rovo_unavailable";

type RetryGuardMessage = {
	parts: Array<{
		type: string;
		text?: string;
		data?: unknown;
	}>;
};

function getMessageText(message: RetryGuardMessage): string {
	return message.parts
		.filter((part) => part.type === "text" && typeof part.text === "string")
		.map((part) => part.text)
		.join("");
}

function getLatestWidgetErrorCode(message: RetryGuardMessage): string | null {
	for (let index = message.parts.length - 1; index >= 0; index -= 1) {
		const part = message.parts[index];
		if (part.type !== "data-widget-error" || !part.data || typeof part.data !== "object") {
			continue;
		}

		const code = "code" in part.data ? part.data.code : null;
		return typeof code === "string" ? code : null;
	}

	return null;
}

export function shouldSuppressRovoAppPlanRetry(
	message: RetryGuardMessage | null | undefined,
): boolean {
	if (!message) {
		return false;
	}

	const widgetErrorCode = getLatestWidgetErrorCode(message);
	if (
		widgetErrorCode === EXPIRED_CLARIFICATION_CODE ||
		widgetErrorCode === ROVO_UNAVAILABLE_CODE
	) {
		return true;
	}

	const text = getMessageText(message);
	return text.includes(STUCK_PORT_TEXT) || text.includes(TOOL_FIRST_FAILURE_TEXT);
}
