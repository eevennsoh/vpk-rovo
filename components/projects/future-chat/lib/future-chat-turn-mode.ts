export type FutureChatTurnMode = "plain_chat" | "rich_chat" | "unknown";

interface FutureChatTurnMessagePart {
	type: string;
	text?: string;
	data?: unknown;
}

interface FutureChatTurnMessage {
	role: "user" | "assistant" | "system";
	parts: FutureChatTurnMessagePart[];
	metadata?: {
		visibility?: "visible" | "hidden";
	};
}

interface FutureChatTurnModeInput {
	prompt: string;
	hasActiveArtifact: boolean;
	hasAttachments: boolean;
	hasPendingStructuredContinuation: boolean;
	hasStreamingArtifact: boolean;
	hasStructuredTurnBody: boolean;
	isPlanMode: boolean;
	isVoiceTurn: boolean;
}

interface LatestVisibleUserPromptResult {
	index: number;
	text: string;
	hasAttachments: boolean;
}

const CONVERSATIONAL_MESSAGE_PATTERN = new RegExp(
	"^(?:" +
		"h(?:i|ey(?:\\s+there)?|ello|owdy|iya)" +
		"|yo+|sup" +
		"|(?:ok(?:ay)?|sure|got\\s+it|sounds\\s+good|alright|right|cool|nice|great|perfect|awesome|wonderful|excellent|fantastic|amazing|brilliant|lovely|fine)" +
		"|(?:thanks?(?:\\s+(?:a\\s+lot|so\\s+much|very\\s+much))?|ty|cheers|thx|thank\\s+you(?:\\s+(?:so\\s+much|very\\s+much))?)" +
		"|(?:bye|goodbye|see\\s+(?:you|ya)|later|ciao|take\\s+care)" +
		"|(?:ye(?:s|ah?|p)?|nah?|no(?:pe)?|yup|nope|y|n)" +
		"|(?:good\\s+(?:morning|afternoon|evening|night))" +
		"|(?:how\\s+are\\s+you|what(?:'|')?s\\s+up)" +
		"|(?:(?:i(?:'|')?m\\s+)?(?:doing\\s+)?(?:good|well|fine|great|okay))" +
		"|sorry|my\\s+bad|apologies" +
		"|no\\s+(?:worries|problem)" +
	")(?:[!?.,\\s]*)$",
	"i"
);

const PLAIN_QUESTION_PATTERN =
	/^(?:what|who|why|when|where|how|is|are|do|does|did|can|could|should|would|will)\b/i;

const PLAIN_EXPLANATION_PATTERN =
	/^(?:please\s+)?(?:briefly\s+)?(?:explain|summari[sz]e|compare|define|tell me about|give me an overview of)\b/i;

const RISKY_BUILD_ACTION_PATTERN =
	/\b(build|create|generate|make|design|draft|plan|implement|fix|refactor|update|edit|rewrite|convert|visuali[sz]e|chart|graph|plot|render|draw|open|fetch|find)\b/i;

const RISKY_WORK_NOUN_PATTERN =
	/\b(ui|interface|layout|component|page|dashboard|widget|chart|graph|plot|table|kanban|board|timeline|roadmap|form|code|file|document|doc|artifact|report|brief|proposal|spec|sheet|image|audio|logo|illustration|endpoint|api|migration|rollout)\b/i;

function getMessageText(message: Pick<FutureChatTurnMessage, "parts">): string {
	return message.parts
		.filter((part) => part.type === "text" && typeof part.text === "string")
		.map((part) => part.text ?? "")
		.join("\n\n")
		.trim();
}

function isMessageVisibleInTranscript(
	message: Pick<FutureChatTurnMessage, "metadata">
): boolean {
	return message.metadata?.visibility !== "hidden";
}

function hasQuestionCardWidget(message: Pick<FutureChatTurnMessage, "parts">): boolean {
	return message.parts.some((part) => {
		if (part.type !== "data-widget-data") {
			return false;
		}

		const candidate = part as {
			data?: {
				type?: unknown;
				payload?: unknown;
			};
		};
		const payload = candidate.data?.payload;
		return (
			candidate.data?.type === "question-card"
			&& typeof payload === "object"
			&& payload !== null
		);
	});
}

function hasPlanWidget(message: Pick<FutureChatTurnMessage, "parts">): boolean {
	return message.parts.some((part) => {
		if (part.type !== "data-widget-data") {
			return false;
		}

		const candidate = part as {
			data?: {
				type?: unknown;
				payload?: unknown;
			};
		};
		const payload = candidate.data?.payload as {
			tasks?: unknown;
			steps?: unknown;
		} | undefined;
		const taskCandidates = Array.isArray(payload?.tasks)
			? payload.tasks
			: Array.isArray(payload?.steps)
				? payload.steps
				: null;
		return (
			candidate.data?.type === "plan"
			&& Array.isArray(taskCandidates)
			&& taskCandidates.length > 0
		);
	});
}

function messageHasAttachments(message: Pick<FutureChatTurnMessage, "parts">): boolean {
	return message.parts.some((part) => part.type === "file");
}

export function getLatestVisibleFutureChatUserPrompt(
	messages: ReadonlyArray<FutureChatTurnMessage>
): LatestVisibleUserPromptResult | null {
	for (let index = messages.length - 1; index >= 0; index -= 1) {
		const message = messages[index];
		if (message.role !== "user" || !isMessageVisibleInTranscript(message)) {
			continue;
		}

		return {
			index,
			text: getMessageText(message),
			hasAttachments: messageHasAttachments(message),
		};
	}

	return null;
}

export function hasPendingFutureChatStructuredContinuation(
	messages: ReadonlyArray<FutureChatTurnMessage>
): boolean {
	const latestVisibleUserPrompt = getLatestVisibleFutureChatUserPrompt(messages);
	const priorMessages =
		latestVisibleUserPrompt !== null
			? messages.slice(0, latestVisibleUserPrompt.index)
			: messages;

	for (let index = priorMessages.length - 1; index >= 0; index -= 1) {
		const message = priorMessages[index];
		if (message.role !== "assistant") {
			continue;
		}

		return hasQuestionCardWidget(message) || hasPlanWidget(message);
	}

	return false;
}

export function classifyFutureChatTurnMode({
	prompt,
	hasActiveArtifact,
	hasAttachments,
	hasPendingStructuredContinuation,
	hasStreamingArtifact,
	hasStructuredTurnBody,
	isPlanMode,
	isVoiceTurn,
}: FutureChatTurnModeInput): FutureChatTurnMode {
	const trimmedPrompt = prompt.trim();
	if (!trimmedPrompt) {
		return "unknown";
	}

	if (
		isPlanMode
		|| isVoiceTurn
		|| hasActiveArtifact
		|| hasStreamingArtifact
		|| hasPendingStructuredContinuation
		|| hasAttachments
		|| hasStructuredTurnBody
	) {
		return "rich_chat";
	}

	if (CONVERSATIONAL_MESSAGE_PATTERN.test(trimmedPrompt)) {
		return "plain_chat";
	}

	const hasRiskyBuildAction = RISKY_BUILD_ACTION_PATTERN.test(trimmedPrompt);
	const hasRiskyWorkNoun = RISKY_WORK_NOUN_PATTERN.test(trimmedPrompt);
	if (hasRiskyBuildAction || hasRiskyWorkNoun) {
		return "rich_chat";
	}

	if (PLAIN_QUESTION_PATTERN.test(trimmedPrompt) || PLAIN_EXPLANATION_PATTERN.test(trimmedPrompt)) {
		return "plain_chat";
	}

	return "unknown";
}
