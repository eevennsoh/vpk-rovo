import type { RoutingDecision } from "@/lib/rovo-ui-messages";

export const ROVO_APP_ARTIFACT_INTENT_LEAK_FALLBACK =
	"I had an internal routing issue while generating that response. Please try again.";

const ROVO_APP_DIRECT_MEDIA_FENCE_PATTERN = /```(?:image|audio)\s*\n[\s\S]*?(?:```|$)/giu;
const ROVO_APP_TOOL_DRIVEN_WIDGET_TYPES = new Set([
	"audio-preview",
	"image-preview",
	"plan",
	"question-card",
]);

export function removeRovoAppDirectMediaFences(rawText: string): {
	removed: boolean;
	text: string;
} {
	if (!rawText.includes("```")) {
		return {
			removed: false,
			text: rawText,
		};
	}

	const sanitizedText = rawText.replace(
		ROVO_APP_DIRECT_MEDIA_FENCE_PATTERN,
		"\n\n"
	);
	if (sanitizedText === rawText) {
		return {
			removed: false,
			text: rawText,
		};
	}

	return {
		removed: true,
		text: sanitizedText.replace(/\n{3,}/g, "\n\n").trim(),
	};
}

export function sanitizeRovoAppAssistantText(rawText: string): string {
	const directMediaResult = removeRovoAppDirectMediaFences(rawText);
	const text = directMediaResult.removed ? directMediaResult.text : rawText;
	const trimmedText = text.trim();
	if (!trimmedText.startsWith("{") || !trimmedText.endsWith("}")) {
		return text;
	}

	try {
		const parsed = JSON.parse(trimmedText) as {
			action?: unknown;
			title?: unknown;
			kind?: unknown;
		};
		const allowedActions = new Set(["chat", "createDocument", "updateDocument"]);
		const isArtifactIntentPayload =
			typeof parsed === "object" &&
			parsed !== null &&
			allowedActions.has(String(parsed.action)) &&
			(parsed.title === null || typeof parsed.title === "string") &&
			(parsed.kind === null ||
				parsed.kind === "text" ||
				parsed.kind === "code" ||
				parsed.kind === "image" ||
				parsed.kind === "sheet");

		return isArtifactIntentPayload
			? ROVO_APP_ARTIFACT_INTENT_LEAK_FALLBACK
			: text;
	} catch {
		return text;
	}
}

export function shouldRenderRovoAppWidget(input: {
	hasWidget: boolean;
	routeDecision: RoutingDecision | null;
	widgetType: string | null;
}): boolean {
	if (!input.hasWidget) {
		return false;
	}

	if (
		typeof input.widgetType === "string" &&
		ROVO_APP_TOOL_DRIVEN_WIDGET_TYPES.has(input.widgetType)
	) {
		return true;
	}

	if (!input.routeDecision) {
		return true;
	}

	return input.routeDecision.presentation === "genui_card";
}

export function shouldRenderRovoAppAssistantActions(input: {
	hasArtifactCard: boolean;
	hasAssistantText: boolean;
	hasInterruption: boolean;
	hasSources: boolean;
	hasWidget: boolean;
	hasWidgetError: boolean;
	isLastAssistant: boolean;
	isResponseInFlight: boolean;
}): boolean {
	if (input.isLastAssistant && input.isResponseInFlight) {
		return false;
	}

	return (
		input.hasAssistantText ||
		input.hasWidget ||
		input.hasWidgetError ||
		input.hasArtifactCard ||
		input.hasSources ||
		input.hasInterruption
	);
}

export function shouldRenderRovoAppVisibleWidget(input: {
	hasWidget: boolean;
	shouldHideResolvedQuestionCard: boolean;
}): boolean {
	return input.hasWidget && !input.shouldHideResolvedQuestionCard;
}

export function shouldRenderRovoAppAssistantMessage(input: {
	hasArtifactCard: boolean;
	hasAssistantText: boolean;
	hasInterruption: boolean;
	hasReasoning: boolean;
	hasSources: boolean;
	hasWidget: boolean;
	hasWidgetError: boolean;
}): boolean {
	return (
		input.hasAssistantText ||
		input.hasReasoning ||
		input.hasWidget ||
		input.hasWidgetError ||
		input.hasArtifactCard ||
		input.hasSources ||
		input.hasInterruption
	);
}
