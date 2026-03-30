import {
	getAllDataParts,
	hasCreatePlanSkillSignal,
	getLatestDataPart,
	getLatestRouteDecision,
	getMessageReasoning,
	getMessageSources,
	getMessageText,
	getThinkingToolCallSummaries,
	getToolFirstWarning,
	getMessageToolParts,
	isMessageTextStreaming,
	type RovoDataPart,
	type RovoRenderableUIMessage,
	type RoutingDecision,
} from "@/lib/rovo-ui-messages";
import {
	extractPlanRenderableText,
	removeActionItemsSection,
	removeLeadingSingleCharacterFragment,
	removeTrailingSingleCharacterLine,
	sanitizeMarkdownArtifactMarkers,
} from "../lib/message-text-utils";

export interface MessageProcessingResult {
	messageText: string;
	rawMessageText: string;
	isStreaming: boolean;
	widgetType: string | undefined;
	isWidgetLoading: boolean;
	isPlanWidgetFlow: boolean;
	isCreatePlanSkillFlow: boolean;
	suggestedQuestions: string[];
	reasoning: ReturnType<typeof getMessageReasoning>;
	sources: ReturnType<typeof getMessageSources>;
	toolFirstWarning: ReturnType<typeof getToolFirstWarning>;
	toolParts: ReturnType<typeof getMessageToolParts>;
	thinkingToolCalls: ReturnType<typeof getThinkingToolCallSummaries>;
	thinkingStatusPart: RovoDataPart<"thinking-status"> | null;
	thinkingEventParts: RovoDataPart<"thinking-event">[];
	widgetDataPart: RovoDataPart<"widget-data"> | null;
	routeDecision: RoutingDecision | null;
}

export function processAssistantMessage(
	message: RovoRenderableUIMessage
): MessageProcessingResult {
	const rawMessageText = getMessageText(message);
	const thinkingStatusPart = getLatestDataPart(message, "data-thinking-status");
	const thinkingEventParts = getAllDataParts(message, "data-thinking-event");
	const isStreaming = isMessageTextStreaming(message);

	const widgetLoadingPart = getLatestDataPart(message, "data-widget-loading");
	const widgetDataPart = getLatestDataPart(message, "data-widget-data");
	const widgetErrorPart = getLatestDataPart(message, "data-widget-error");
	const suggestedQuestionsPart = getLatestDataPart(message, "data-suggested-questions");
	const routeDecision = getLatestRouteDecision(message);

	const widgetType =
		widgetDataPart?.data.type ??
		widgetLoadingPart?.data.type ??
		widgetErrorPart?.data.type;
	const isWidgetLoading = widgetLoadingPart?.data.loading ?? false;
	const normalizedWidgetText = widgetType
		? removeLeadingSingleCharacterFragment(rawMessageText)
		: rawMessageText;
	const isCreatePlanSkillFlow = hasCreatePlanSkillSignal(message);
	const isPlanWidgetFlow =
		widgetType === "plan" ||
		widgetLoadingPart?.data.type === "plan" ||
		widgetErrorPart?.data.type === "plan";
	const planRenderableText =
		widgetType === "plan" && isCreatePlanSkillFlow
			? extractPlanRenderableText(normalizedWidgetText, { maxSummaryLines: 2 })
			: null;

	const baseMessageText =
		widgetType === "question-card"
			? removeTrailingSingleCharacterLine(normalizedWidgetText)
			: widgetType === "plan"
				? isCreatePlanSkillFlow
					? planRenderableText?.text ?? ""
					: removeActionItemsSection(normalizedWidgetText)
				: normalizedWidgetText;

	const toolParts = getMessageToolParts(message);
	const thinkingToolCalls = getThinkingToolCallSummaries(message);
	const messageTextBeforeMarkdownSanitization = baseMessageText;
	const messageText = sanitizeMarkdownArtifactMarkers(
		messageTextBeforeMarkdownSanitization
	);

	return {
		messageText,
		rawMessageText,
		isStreaming,
		widgetType,
		isWidgetLoading,
		isPlanWidgetFlow,
		isCreatePlanSkillFlow,
		suggestedQuestions: suggestedQuestionsPart?.data.questions ?? [],
		reasoning: getMessageReasoning(message),
		sources: getMessageSources(message),
		toolFirstWarning: getToolFirstWarning(message),
		toolParts,
		thinkingToolCalls,
		thinkingStatusPart,
		thinkingEventParts,
		widgetDataPart,
		routeDecision,
	};
}
