import { Suggestions, Suggestion } from "@/components/ui-ai/suggestion";
import AiChatIcon from "@atlaskit/icon/core/ai-chat";

const iconSuggestionClassName = "gap-2 !rounded-[min(var(--radius-md),12px)]";

export default function SuggestionDemo() {
	return <SuggestionDemoVertical />;
}

export function SuggestionDemoVertical() {
	return (
		<Suggestions orientation="vertical">
			<Suggestion
				className={iconSuggestionClassName}
				suggestion="How do I set up a new project?"
			>
				<AiChatIcon label="" size="small" />
				<span className="font-medium">How do I set up a new project?</span>
			</Suggestion>
			<Suggestion
				className={iconSuggestionClassName}
				suggestion="Explain the architecture"
			>
				<AiChatIcon label="" size="small" />
				<span className="font-medium">Explain the architecture</span>
			</Suggestion>
			<Suggestion
				className={iconSuggestionClassName}
				suggestion="Help me debug this issue"
			>
				<AiChatIcon label="" size="small" />
				<span className="font-medium">Help me debug this issue</span>
			</Suggestion>
		</Suggestions>
	);
}

export function SuggestionDemoWithIcons() {
	return (
		<div className="flex w-full justify-center">
			<Suggestions style={{ width: "fit-content", maxWidth: "100%" }}>
				<Suggestion className={iconSuggestionClassName} suggestion="Find information">
					<AiChatIcon label="" size="small" />
					<span className="font-medium">Find information</span>
				</Suggestion>
				<Suggestion className={iconSuggestionClassName} suggestion="Measure productivity">
					<AiChatIcon label="" size="small" />
					<span className="font-medium">Measure productivity</span>
				</Suggestion>
				<Suggestion className={iconSuggestionClassName} suggestion="Find People">
					<AiChatIcon label="" size="small" />
					<span className="font-medium">Find People</span>
				</Suggestion>
			</Suggestions>
		</div>
	);
}
