import { Suggestion, Suggestions } from "@/components/ui-custom/suggestion";
import { cn } from "@/lib/utils";
import AiChatIcon from "@atlaskit/icon/core/ai-chat";

interface AssistantSuggestionsSectionProps {
	className?: string;
	messageId: string;
	suggestedQuestions: ReadonlyArray<string>;
	onSuggestionClick?: (question: string) => void;
}

export function AssistantSuggestionsSection({
	className,
	messageId,
	suggestedQuestions,
	onSuggestionClick,
}: Readonly<AssistantSuggestionsSectionProps>): React.ReactElement {
	return (
		<Suggestions className={cn("py-4", className)} orientation="vertical">
			{suggestedQuestions.map((question, index) => (
				<Suggestion
					key={`${messageId}-suggestion-${question}-${index}`}
					className="gap-2 !rounded-[min(var(--radius-md),12px)]"
					onClick={onSuggestionClick}
					suggestion={question}
					variant="outline"
				>
					<AiChatIcon label="" size="small" />
					<span className="font-medium">{question}</span>
				</Suggestion>
			))}
		</Suggestions>
	);
}
