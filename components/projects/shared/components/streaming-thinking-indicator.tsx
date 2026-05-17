"use client";

import type { ReactNode } from "react";
import type { getThinkingToolCallSummaries } from "@/lib/rovo-ui-messages";
import type { ReasoningPhaseProps } from "@/components/projects/shared/hooks/use-reasoning-phase";
import { Message } from "@/components/ui-custom/message";
import {
	AdsReasoningTrigger,
	Reasoning,
	ReasoningContent,
	ReasoningSection,
	ReasoningText,
} from "@/components/ui-custom/reasoning";
import { AssistantThinkingToolsSection } from "@/components/projects/shared/components/assistant-thinking-tools-section";
import { getReasoningSectionTitle } from "@/components/projects/shared/lib/reasoning-labels";
import { cn } from "@/lib/utils";

interface StreamingThinkingIndicatorProps {
	reasoningKey: string;
	label: string;
	hasDetails: boolean;
	hasReasoningContent: boolean;
	trimmedReasoningContent: string;
	hasThinkingToolCalls: boolean;
	thinkingToolCalls: ReturnType<typeof getThinkingToolCallSummaries>;
	allowAutoCollapse: boolean;
	lastMessageId?: string;
	containerClassName?: string;
	containerStyle?: React.CSSProperties;
	phaseProps: ReasoningPhaseProps;
}

export function StreamingThinkingIndicator({
	reasoningKey,
	label,
	hasDetails,
	hasReasoningContent,
	trimmedReasoningContent,
	hasThinkingToolCalls,
	thinkingToolCalls,
	allowAutoCollapse,
	lastMessageId,
	containerClassName,
	containerStyle,
	phaseProps,
}: Readonly<StreamingThinkingIndicatorProps>): ReactNode {
	return (
		<div className={cn(containerClassName)} style={containerStyle}>
			<Message from="assistant" className="max-w-full">
				<Reasoning
					key={reasoningKey}
					className="mb-0"
					autoExpandOnDetails
					hasDetails={hasDetails}
					isStreaming={phaseProps.isStreaming}
					streamingWave={phaseProps.streamingWave}
					streamingWaveGradientColor={
						phaseProps.streamingWaveGradientColor
					}
					animatedDots={phaseProps.animatedDots}
					duration={phaseProps.duration}
					defaultOpen={phaseProps.defaultOpen ?? hasDetails}
					allowAutoCollapse={allowAutoCollapse}
					toolsRunning={hasThinkingToolCalls}
				>
					<AdsReasoningTrigger
						label={label}
						showChevron={hasDetails}
						streaming={phaseProps.triggerStreaming}
					/>
					{hasDetails ? (
						<ReasoningContent>
							<div className="space-y-4">
								{hasReasoningContent ? (
									<ReasoningSection title={getReasoningSectionTitle("thinking")}>
										<ReasoningText
											maxVisibleTimelineItems={6}
											text={trimmedReasoningContent}
											timelineMode="auto"
										/>
									</ReasoningSection>
								) : null}
								{hasThinkingToolCalls ? (
									<ReasoningSection title={getReasoningSectionTitle("tools")}>
										<AssistantThinkingToolsSection
											defaultOpenMode="running"
											idPrefix={lastMessageId ?? "stream"}
											thinkingToolCalls={thinkingToolCalls}
										/>
									</ReasoningSection>
								) : null}
							</div>
						</ReasoningContent>
					) : null}
				</Reasoning>
			</Message>
		</div>
	);
}
