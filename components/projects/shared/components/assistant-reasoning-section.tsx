import type { ReasoningPhase } from "@/components/projects/shared/hooks/use-reasoning-phase";
import { getReasoningPropsForPhase } from "@/components/projects/shared/hooks/use-reasoning-phase";
import {
	Reasoning,
	AdsReasoningTrigger,
	ReasoningContent,
} from "@/components/ui-ai/reasoning";

interface AssistantReasoningSectionProps {
	reasoning: { text: string; isStreaming: boolean };
}

export function AssistantReasoningSection({
	reasoning,
}: Readonly<AssistantReasoningSectionProps>): React.ReactElement {
	const phase: ReasoningPhase = reasoning.isStreaming
		? reasoning.text
			? "thinking"
			: "preload"
		: "completed";
	const phaseProps = getReasoningPropsForPhase(phase, undefined, true);

	return (
		<Reasoning
			className="px-6 pt-2"
			defaultOpen={phaseProps.defaultOpen ?? false}
			isStreaming={phaseProps.isStreaming}
			streamingWave={phaseProps.streamingWave}
			streamingWaveGradientColor={phaseProps.streamingWaveGradientColor}
			animatedDots={phaseProps.animatedDots}
		>
			<AdsReasoningTrigger showChevron={!!reasoning.text} streaming={phaseProps.triggerStreaming} />
			<ReasoningContent>{reasoning.text}</ReasoningContent>
		</Reasoning>
	);
}
