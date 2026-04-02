interface PlanningSessionMessagePart {
	type: string;
	text?: string;
	data?: unknown;
}

interface PlanningSessionMessage {
	id: string;
	role: string;
	parts: PlanningSessionMessagePart[];
}

export interface FutureChatPlanningArtifacts {
	hasGeneratedPlan: boolean;
	isAwaitingClarificationAnswers: boolean;
	latestAssistantMessage: PlanningSessionMessage | null;
}

export function getLatestFutureChatAssistantMessageId(
	messages: ReadonlyArray<PlanningSessionMessage>,
): string | null {
	for (let index = messages.length - 1; index >= 0; index -= 1) {
		const message = messages[index];
		if (message.role !== "assistant") {
			continue;
		}

		return message.id;
	}

	return null;
}

function narrowWidgetData(
	part: PlanningSessionMessagePart,
): { type?: unknown; payload?: unknown } | null {
	if (part.type !== "data-widget-data") {
		return null;
	}
	return part.data && typeof part.data === "object"
		? (part.data as { type?: unknown; payload?: unknown })
		: null;
}

export function getFutureChatPlanningArtifactsSinceBaseline(
	messages: ReadonlyArray<PlanningSessionMessage>,
	baselineAssistantMessageId: string | null,
): FutureChatPlanningArtifacts {
	const baselineIndex =
		typeof baselineAssistantMessageId === "string" && baselineAssistantMessageId.trim().length > 0
			? messages.findIndex((message) => message.id === baselineAssistantMessageId)
			: -1;
	const nextMessages =
		baselineIndex >= 0 ? messages.slice(baselineIndex + 1) : [...messages];
	const latestAssistantMessage = nextMessages.findLast(
		(message) => message.role === "assistant",
	) ?? null;
	const latestPlanPayload = nextMessages.findLast((message) =>
		message.role === "assistant" &&
		message.parts.some((part) => {
			const widgetData = narrowWidgetData(part);
			const payload = widgetData?.payload;
			return (
				widgetData?.type === "plan" &&
				typeof payload === "object" &&
				payload !== null &&
				Array.isArray(
					(payload as {
						tasks?: unknown;
					}).tasks,
				) &&
				((payload as {
					tasks?: unknown[];
				}).tasks?.length ?? 0) > 0
			);
		}),
	);
	const latestQuestionCard = nextMessages.findLast((message) =>
		message.role === "assistant" &&
		message.parts.some((part) => {
			const widgetData = narrowWidgetData(part);
			const payload = widgetData?.payload;
			return (
				widgetData?.type === "question-card" &&
				typeof payload === "object" &&
				payload !== null
			);
		}),
	);

	return {
		hasGeneratedPlan: Boolean(latestPlanPayload),
		isAwaitingClarificationAnswers: Boolean(latestQuestionCard),
		latestAssistantMessage,
	};
}
