import { Message as UiMessage, MessageContent } from "@/components/ui-ai/message";
import { AnswerCard } from "@/components/blocks/answer-card/components/answer-card";
import { Button } from "@/components/ui/button";
import type { RovoMessageMetadata } from "@/lib/rovo-ui-messages";
import DeleteIcon from "@atlaskit/icon/core/delete";

interface UserMessageBubbleProps {
	messageText: string;
	metadata?: RovoMessageMetadata;
	onDelete?: () => void;
}

function getClarificationSummaryRows(
	metadata: RovoMessageMetadata | undefined
): Array<{ question: string; answer: string; status?: "skipped" }> {
	if (!metadata || metadata.source !== "clarification-submit") {
		return [];
	}

	if (!Array.isArray(metadata.clarificationSummary)) {
		return [];
	}

	return metadata.clarificationSummary.filter((summaryRow) => {
		return (
			typeof summaryRow?.question === "string" &&
			summaryRow.question.trim().length > 0 &&
			typeof summaryRow?.answer === "string" &&
			summaryRow.answer.trim().length > 0
		);
	});
}

export function UserMessageBubble({
	messageText,
	metadata,
	onDelete,
}: Readonly<UserMessageBubbleProps>): React.ReactElement {
	const isDismissed = metadata?.clarificationStatus === "dismissed";
	const clarificationSummaryRows = isDismissed ? [] : getClarificationSummaryRows(metadata);
	const showClarificationSummary = isDismissed || clarificationSummaryRows.length > 0;

	return (
		<div className="group/user-msg relative w-full">
			{onDelete ? (
				<span className="absolute -left-8 top-1/2 hidden -translate-y-1/2 group-hover/user-msg:block">
					<Button
						aria-label="Delete message"
						variant="ghost"
						size="icon-sm"
						className="rounded-full text-icon-subtle [&_svg]:size-3"
						onClick={onDelete}
					>
						<DeleteIcon size="small" label="" />
					</Button>
				</span>
			) : null}
			<UiMessage from="user">
				{showClarificationSummary ? (
					<AnswerCard
						label={isDismissed ? "Questions dismissed" : undefined}
						rows={clarificationSummaryRows}
					/>
				) : (
					<MessageContent>{messageText}</MessageContent>
				)}
			</UiMessage>
		</div>
	);
}
