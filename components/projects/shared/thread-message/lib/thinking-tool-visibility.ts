import type { ThinkingToolCallSummary } from "@/lib/rovo-ui-messages";

const REQUEST_USER_INPUT_TOOL_NAME_PATTERN =
	/(?:^|\.)(?:request_user_input|ask_user_questions|ask_user_question)$/i;

function isRequestUserInputToolName(toolName: unknown): boolean {
	return (
		typeof toolName === "string" &&
		REQUEST_USER_INPUT_TOOL_NAME_PATTERN.test(toolName.trim())
	);
}

export function filterThinkingToolCallsForVisibleWidget({
	thinkingToolCalls,
	widgetType,
}: Readonly<{
	thinkingToolCalls: ReadonlyArray<ThinkingToolCallSummary>;
	widgetType: string | undefined;
}>): ThinkingToolCallSummary[] {
	if (widgetType !== "question-card") {
		return [...thinkingToolCalls];
	}

	return thinkingToolCalls.filter(
		(toolCall) =>
			!isRequestUserInputToolName(toolCall.toolName) ||
			toolCall.state === "awaiting-input",
	);
}
