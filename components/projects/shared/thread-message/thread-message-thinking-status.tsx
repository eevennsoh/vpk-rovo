"use client";

import { use, type ReactNode } from "react";
import {
	AdsReasoningTrigger,
	Reasoning,
	ReasoningContent,
	ReasoningSection,
	ReasoningText,
} from "@/components/ui-ai/reasoning";
import { getReasoningPropsForPhase } from "@/components/projects/shared/hooks/use-reasoning-phase";
import { getReasoningSectionTitle } from "@/components/projects/shared/lib/reasoning-labels";
import { ThreadMessageContext } from "./thread-message-context";
import { AssistantThinkingToolsSection } from "../components/assistant-thinking-tools-section";
import { AssistantToolsSection } from "../components/assistant-tools-section";
import { resolveThinkingStatusTriggerLabel } from "./lib/thinking-status-state";

export function ThreadMessageThinkingStatus(): ReactNode {
	const {
		message,
		isThinkingStatusActive,
		thinkingStatusReasoningPhase,
		thinkingStatusDuration,
		hasTurnComplete,
		isPostToolsGenuiGeneration,
		allThinkingStatusParts,
		resolvedThinkingStatusLabel,
		toolParts,
		thinkingToolCallsForStatus,
	} = use(ThreadMessageContext)!;

	if (!isThinkingStatusActive) {
		return null;
	}

	const accumulatedContent = allThinkingStatusParts
		.map((part) => part.data.content)
		.filter(Boolean)
		.join("\n\n");
	const hasThinkingText = Boolean(accumulatedContent);
	const hasToolParts = toolParts.length > 0;
	const hasThinkingToolCalls = thinkingToolCallsForStatus.length > 0;
	const hasTools = hasToolParts || hasThinkingToolCalls;
	const hasDetails = hasThinkingText || hasTools;
	const allowAutoCollapse = hasTurnComplete || isPostToolsGenuiGeneration;
	const areAnyToolsRunning = hasTools && (
		thinkingToolCallsForStatus.some(tc =>
			tc.state === "awaiting-input" || tc.state === "running" || tc.state === "approval-requested"
		) ||
		toolParts.some(tp =>
			tp.state === "approval-requested" || tp.state === "input-streaming" || tp.state === "input-available"
		)
	);
	const triggerLabel = resolveThinkingStatusTriggerLabel({
		resolvedLabel: resolvedThinkingStatusLabel,
		reasoningPhase: thinkingStatusReasoningPhase,
		duration: thinkingStatusDuration,
	});

	const phaseProps = getReasoningPropsForPhase(
		thinkingStatusReasoningPhase,
		undefined,
		hasDetails
	);

	return (
		<div>
			<Reasoning
				className="mb-0"
				autoExpandOnDetails
				hasDetails={hasDetails}
				defaultOpen={phaseProps.defaultOpen ?? hasDetails}
				isStreaming={phaseProps.isStreaming}
				streamingWave={phaseProps.streamingWave}
				streamingWaveGradientColor={
					phaseProps.streamingWaveGradientColor
				}
				animatedDots={phaseProps.animatedDots}
				duration={thinkingStatusReasoningPhase === "completed" ? thinkingStatusDuration : undefined}
				allowAutoCollapse={allowAutoCollapse}
				toolsRunning={hasTools ? areAnyToolsRunning : undefined}
			>
				<AdsReasoningTrigger
					label={triggerLabel}
					showChevron={hasDetails}
					streaming={phaseProps.triggerStreaming}
				/>
				{hasDetails ? (
					<ReasoningContent>
						<div className="space-y-4">
							{hasThinkingText ? (
								<ReasoningSection title={getReasoningSectionTitle("thinking")}>
									<ReasoningText
										maxVisibleTimelineItems={6}
										text={accumulatedContent}
										timelineMode="auto"
									/>
								</ReasoningSection>
							) : null}

							{hasTools ? (
								<ReasoningSection title={getReasoningSectionTitle("tools")}>
									{hasToolParts ? (
										<div className="-mx-6">
											<AssistantToolsSection
												messageId={message.id}
												toolParts={toolParts}
												defaultOpenMode="running"
											/>
										</div>
									) : null}
									{hasThinkingToolCalls ? (
										<AssistantThinkingToolsSection
											className="pt-1"
											defaultOpenMode="running"
											idPrefix={message.id}
											thinkingToolCalls={thinkingToolCallsForStatus}
										/>
									) : null}
								</ReasoningSection>
							) : null}
						</div>
					</ReasoningContent>
				) : null}
			</Reasoning>
		</div>
	);
}
