"use client";

import type { ReactNode } from "react";
import {
	getMessageArtifactResult,
	type RovoRenderableUIMessage,
} from "@/lib/rovo-ui-messages";
import { ThreadMessage } from "@/components/projects/shared/thread-message";
import { GenerativeWidgetCard } from "@/components/projects/shared/components/generative-widget-card";
import type { GenerativeCardAnimationProps } from "@/components/projects/shared/components/generative-widget-card";
import type { GenerativeWidgetPrimaryActionPayload } from "@/components/projects/shared/lib/generative-widget";
import { ArtifactResultCard, type ArtifactResult } from "./artifact-result-card";

interface MessageBubbleProps {
	message: RovoRenderableUIMessage;
	onSuggestionClick?: (question: string) => void;
	enableSmartWidgets?: boolean;
	showFollowUpSuggestions?: boolean;
	showThinkingStatusSection?: boolean;
	isThinkingLifecycleStreaming?: boolean;
	generativeCardAnimation?: GenerativeCardAnimationProps;
	onWidgetPrimaryAction?: (
		payload: GenerativeWidgetPrimaryActionPayload
	) => Promise<void> | void;
	onArtifactDialogOpen?: (artifact: ArtifactResult) => void;
	onArtifactDialogClose?: (artifact: ArtifactResult) => void;
}

export default function MessageBubble({
	message,
	onSuggestionClick,
	enableSmartWidgets = false,
	showFollowUpSuggestions = true,
	showThinkingStatusSection = true,
	isThinkingLifecycleStreaming = false,
	generativeCardAnimation,
	onWidgetPrimaryAction,
	onArtifactDialogOpen,
	onArtifactDialogClose,
}: Readonly<MessageBubbleProps>): ReactNode {
	const artifactResult = getMessageArtifactResult(message);
	const renderWidget = enableSmartWidgets
		? (widget: { type: string; data: unknown }) => (
				<GenerativeWidgetCard
					widgetType={widget.type}
					widgetData={widget.data}
					cardAnimation={generativeCardAnimation}
					onPrimaryAction={onWidgetPrimaryAction}
				/>
			)
		: undefined;

	return (
		<ThreadMessage.Root
			message={message}
			surface="sidebar"
			isThinkingLifecycleStreaming={isThinkingLifecycleStreaming}
			renderWidget={renderWidget}
		>
			<ThreadMessage.Reasoning />
			{showThinkingStatusSection ? <ThreadMessage.ThinkingStatus /> : null}
			<ThreadMessage.Widget position="before-content" />
			<ThreadMessage.Content />
			{artifactResult ? (
				<ArtifactResultCard
					artifact={artifactResult}
					onDialogOpen={onArtifactDialogOpen}
					onDialogClose={onArtifactDialogClose}
				/>
			) : null}
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
