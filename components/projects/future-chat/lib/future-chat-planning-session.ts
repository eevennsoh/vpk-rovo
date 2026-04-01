interface PlanningSessionMessagePart {
	type?: string;
	text?: string;
	data?: {
		type?: unknown;
		payload?: unknown;
	};
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
	const latestAssistantMessage = [...nextMessages]
		.reverse()
		.find((message) => message.role === "assistant") ?? null;
	const latestPlanPayload = [...nextMessages]
		.reverse()
		.find((message) =>
			message.role === "assistant" &&
			message.parts.some((part) => {
				if (part.type !== "data-widget-data") {
					return false;
				}

				const payload = part.data?.payload;
				return (
					part.data?.type === "plan" &&
					typeof payload === "object" &&
					payload !== null &&
					Array.isArray(payload.tasks) &&
					payload.tasks.length > 0
				);
			}),
		);
	const latestQuestionCard = [...nextMessages]
		.reverse()
		.find((message) =>
			message.role === "assistant" &&
			message.parts.some((part) => {
				if (part.type !== "data-widget-data") {
					return false;
				}

				const payload = part.data?.payload;
				return (
					part.data?.type === "question-card" &&
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
