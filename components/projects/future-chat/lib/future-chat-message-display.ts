import type { RoutingDecision } from "@/lib/rovo-ui-messages";

export const FUTURE_CHAT_ARTIFACT_INTENT_LEAK_FALLBACK =
	"I had an internal routing issue while generating that response. Please try again.";

const FUTURE_CHAT_DIRECT_MEDIA_FENCE_PATTERN = /```(?:image|audio)\s*\n[\s\S]*?(?:```|$)/giu;
const FUTURE_CHAT_TOOL_DRIVEN_WIDGET_TYPES = new Set([
	"audio-preview",
	"image-preview",
	"plan",
	"question-card",
]);

export function removeFutureChatDirectMediaFences(rawText: string): {
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
		FUTURE_CHAT_DIRECT_MEDIA_FENCE_PATTERN,
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

export function sanitizeFutureChatAssistantText(rawText: string): string {
	const directMediaResult = removeFutureChatDirectMediaFences(rawText);
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
			? FUTURE_CHAT_ARTIFACT_INTENT_LEAK_FALLBACK
			: text;
	} catch {
		return text;
	}
}

export function shouldRenderFutureChatWidget(input: {
	hasWidget: boolean;
	routeDecision: RoutingDecision | null;
	widgetType: string | null;
}): boolean {
	if (!input.hasWidget) {
		return false;
	}

	if (
		typeof input.widgetType === "string" &&
		FUTURE_CHAT_TOOL_DRIVEN_WIDGET_TYPES.has(input.widgetType)
	) {
		return true;
	}

	if (!input.routeDecision) {
		return true;
	}

	return input.routeDecision.presentation === "genui_card";
}
