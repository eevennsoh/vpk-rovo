import {
	MessageActions,
	MessageCopyAction,
	MessageVoteActions,
} from "@/components/ui-ai/message";

interface AssistantFeedbackActionsProps {
	messageText: string;
}

export function AssistantFeedbackActions({
	messageText,
}: Readonly<AssistantFeedbackActionsProps>): React.ReactElement {
	return (
		<MessageActions>
			<MessageVoteActions onVote={() => {}} />
			<MessageCopyAction text={messageText} />
		</MessageActions>
	);
}
