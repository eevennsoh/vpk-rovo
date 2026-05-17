"use client";

import type { ReactNode } from "react";
import {
	type RovoRenderableUIMessage,
} from "@/lib/rovo-ui-messages";
import { ThreadMessage } from "@/components/projects/shared/thread-message";
import { GenerativeWidgetCard } from "@/components/projects/shared/components/generative-widget-card";
import type { GenerativeCardAnimationProps } from "@/components/projects/shared/components/generative-widget-card";
import type { GenerativeWidgetPrimaryActionPayload } from "@/components/projects/shared/lib/generative-widget";
import { PlanWidgetInlineCard } from "@/components/projects/shared/components/plan-widget-inline-card";
import {
	parsePlanWidgetPayload,
	type ParsedPlanWidgetPayload,
} from "@/components/projects/shared/lib/plan-widget";

interface PlanBuildState {
	isBuildDisabled?: boolean;
	buildDisabledReason?: string;
}

interface MessageBubbleProps {
	message: RovoRenderableUIMessage;
	onSuggestionClick?: (question: string) => void;
	enableSmartWidgets?: boolean;
	showFollowUpSuggestions?: boolean;
	showThinkingStatusSection?: boolean;
	isThinkingLifecycleStreaming?: boolean;
	generativeCardAnimation?: GenerativeCardAnimationProps;
	editingMessageId?: string | null;
	onEditMessage?: (messageId: string, nextText: string) => Promise<void> | void;
	onSetEditingMessageId?: (messageId: string | null) => void;
	onWidgetPrimaryAction?: (
		payload: GenerativeWidgetPrimaryActionPayload
	) => Promise<void> | void;
	onBuildPlan?: (planWidget: ParsedPlanWidgetPayload) => Promise<void> | void;
	resolvePlanBuildState?: (
		planWidget: ParsedPlanWidgetPayload,
		message: RovoRenderableUIMessage
	) => PlanBuildState;
}

export default function MessageBubble({
	message,
	onSuggestionClick,
	enableSmartWidgets = false,
	showFollowUpSuggestions = true,
	showThinkingStatusSection = true,
	isThinkingLifecycleStreaming = false,
	generativeCardAnimation,
	editingMessageId,
	onEditMessage,
	onSetEditingMessageId,
	onWidgetPrimaryAction,
	onBuildPlan,
	resolvePlanBuildState,
}: Readonly<MessageBubbleProps>): ReactNode {
	const hasPlanWidget = message.parts.some(
		(part) =>
			part.type === "data-widget-data" &&
			part.data?.type === "plan",
	);
	const renderWidget =
		enableSmartWidgets || hasPlanWidget
			? (widget: { type: string; data: unknown }, widgetMessage: RovoRenderableUIMessage) => {
					if (widget.type === "plan") {
						const planWidget = parsePlanWidgetPayload(widget.data);
						if (!planWidget) {
							return null;
						}

						const buildState = resolvePlanBuildState?.(planWidget, widgetMessage) ?? {};
						const hasDeferredToolCall = Boolean(
							planWidget.deferredToolCallId ?? planWidget.toolCallId,
						);
						return (
							<PlanWidgetInlineCard
								title={planWidget.title}
								description={planWidget.description}
								shortDescription={planWidget.shortDescription}
								markdown={planWidget.markdown}
								tasks={planWidget.tasks}
								onBuild={
									onBuildPlan && hasDeferredToolCall
										? () => onBuildPlan(planWidget)
										: undefined
								}
								isBuildDisabled={buildState.isBuildDisabled}
								buildDisabledReason={buildState.buildDisabledReason}
								shouldAutoCollapse={buildState.isBuildDisabled === true}
							/>
						);
					}

					if (!enableSmartWidgets) {
						return null;
					}

					return (
						<GenerativeWidgetCard
							widgetType={widget.type}
							widgetData={widget.data}
							cardAnimation={generativeCardAnimation}
							onPrimaryAction={onWidgetPrimaryAction}
						/>
					);
				}
			: undefined;

	return (
		<ThreadMessage.Root
			message={message}
			surface="sidebar"
			isThinkingLifecycleStreaming={isThinkingLifecycleStreaming}
			editingMessageId={editingMessageId}
			onEditMessage={onEditMessage}
			onSetEditingMessageId={onSetEditingMessageId}
			showUserMessagePromptActions
			renderWidget={renderWidget}
		>
			<ThreadMessage.Reasoning />
			{showThinkingStatusSection ? <ThreadMessage.ThinkingStatus /> : null}
			<ThreadMessage.Widget position="before-content" />
			<ThreadMessage.Content />
			<ThreadMessage.Feedback />
			<ThreadMessage.Tools />
			<ThreadMessage.ToolFirstWarning />
			<ThreadMessage.Sources />
			{showFollowUpSuggestions ? (
				<ThreadMessage.Suggestions onSuggestionClick={onSuggestionClick} />
			) : null}
			<ThreadMessage.Widget position="after-content" />
		</ThreadMessage.Root>
	);
}
