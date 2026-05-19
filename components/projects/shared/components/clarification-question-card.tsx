"use client";

import { QuestionCard } from "@/components/blocks/question-card/components/question-card";
import type { QuestionCardAnswers } from "@/components/blocks/question-card/components/question-card";
import type { ClarificationAnswers, ParsedQuestionCardPayload } from "@/components/projects/shared/lib/question-card-widget";

interface ClarificationQuestionCardProps {
	questionCard: ParsedQuestionCardPayload;
	isSubmitting?: boolean;
	onSubmit: (answers: ClarificationAnswers) => void;
	onDismiss?: () => void;
}

const MAX_VISIBLE_CLARIFICATION_OPTIONS = 3;

export function ClarificationQuestionCard({ questionCard, isSubmitting, onSubmit, onDismiss }: Readonly<ClarificationQuestionCardProps>): React.ReactElement {
	return (
		<section
			aria-label="Clarification questions — answer or skip to continue chatting"
			aria-live="assertive"
		>
			<QuestionCard
				questions={questionCard.questions}
				isSubmitting={isSubmitting}
				maxVisibleOptions={MAX_VISIBLE_CLARIFICATION_OPTIONS}
				onSubmit={onSubmit as (answers: QuestionCardAnswers) => void}
				onDismiss={onDismiss}
				toolCallId={questionCard.deferredToolCallId}
			/>
		</section>
	);
}
