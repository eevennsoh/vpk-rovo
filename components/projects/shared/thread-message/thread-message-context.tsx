"use client";

import { createContext, type ReactNode } from "react";
import type { ReasoningPhase } from "@/components/projects/shared/hooks/use-reasoning-phase";
import type {
	RovoDataPart,
	RovoRenderableUIMessage,
	RovoSourcePart,
	RovoToolPart,
	RoutingDecision,
	ThinkingToolCallSummary,
	ToolFirstWarningData,
} from "@/lib/rovo-ui-messages";

export interface ThreadMessageContextValue {
	/** Original message object. */
	message: RovoRenderableUIMessage;
	/** Display surface (sidebar or fullscreen). */
	surface: "sidebar" | "fullscreen";
	/** Controls how message text renders while streaming. */
	assistantStreamingRenderMode: "rich" | "text-first";

	// ---------- computed text ----------
	/** Fully processed message text (sanitized, artifacts removed). */
	messageText: string;
	/** Raw text from `getMessageText`. */
	rawMessageText: string;

	// ---------- streaming ----------
	/** Whether the message is currently streaming text. */
	isStreaming: boolean;

	// ---------- reasoning ----------
	/** Extracted reasoning data (null if none). */
	reasoning: { text: string; isStreaming: boolean } | null;

	// ---------- thinking status ----------
	/** Latest thinking-status data part (null if none). */
	thinkingStatusPart: RovoDataPart<"thinking-status"> | null;
	/** All thinking-status data parts for accumulated content. */
	allThinkingStatusParts: RovoDataPart<"thinking-status">[];
	/** Resolved label for the thinking-status indicator. */
	resolvedThinkingStatusLabel: string;
	/**
	 * Whether thinking-status data is present and should be displayed.
	 * Computed from data only — independent of consumer composition choice.
	 */
	isThinkingStatusActive: boolean;
	/** Reasoning phase for the thinking-status indicator. */
	thinkingStatusReasoningPhase: ReasoningPhase;
	/** Completed thinking duration in seconds (when available). */
	thinkingStatusDuration: number | undefined;
	/** Whether the backend emitted turn-complete for this message. */
	hasTurnComplete: boolean;
	/** True when tools are done and GenUI is still rendering its widget payload. */
	isPostToolsGenuiGeneration: boolean;
	/** Tool call summaries to show in the thinking-status section (empty array if standalone tools are shown instead). */
	thinkingToolCallsForStatus: ThinkingToolCallSummary[];

	// ---------- sources ----------
	/** Source citations from the message. */
	sources: RovoSourcePart[];

	// ---------- tools ----------
	/** Tool invocation parts. */
	toolParts: RovoToolPart[];
	/** Tool-first warning data (null if none). */
	toolFirstWarning: ToolFirstWarningData | null;
	/** Whether a tool-first warning should display. */
	hasToolFirstWarning: boolean;

	// ---------- suggestions ----------
	/** Follow-up suggested questions. */
	suggestedQuestions: string[];

	// ---------- widget ----------
	/** Pre-rendered widget node (null if nothing to render). */
	renderedWidget: ReactNode;
	/** Pre-rendered loading widget node (null if not loading). */
	loadingWidgetNode: ReactNode;
	/** Widget type identifier. */
	widgetType: string | undefined;
	/** Whether the widget is currently loading. */
	isWidgetLoading: boolean;
	/** Whether the widget loading indicator has timed out (30s with no renderable payload). */
	widgetLoadingTimedOut: boolean;
	/** Whether the plan widget should render before message content. */
	shouldRenderPlanWidgetFirst: boolean;
	/** Whether a widget was rendered (affects feedback/suggestion gating). */
	hasRenderedWidget: boolean;

	// ---------- computed render flags ----------
	/** Whether the message text has content to render. */
	shouldRenderMessageText: boolean;
	/** Whether to render plain text instead of markdown while streaming. */
	shouldRenderPlainTextWhileStreaming: boolean;

	// ---------- route decision ----------
	/** Route decision metadata from the output routing layer (null if not present). */
	routeDecision: RoutingDecision | null;
	/** Whether GenUI failed and the response fell back to text. */
	isFallbackTextRoute: boolean;
}

export const ThreadMessageContext = createContext<ThreadMessageContextValue | null>(null);
