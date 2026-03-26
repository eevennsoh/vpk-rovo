export type QuestionCardPrimaryAction = "skip" | "next" | "submit";

/**
 * Determine the footer primary CTA:
 * - "submit" when every question has an answer
 * - "next" when the current question has custom input text (advances to next question)
 * - "skip" otherwise
 */
export function getQuestionCardPrimaryAction(
	allQuestionsAnswered: boolean,
	hasCustomInputText: boolean,
): QuestionCardPrimaryAction {
	if (allQuestionsAnswered) return "submit";
	if (hasCustomInputText) return "next";
	return "skip";
}
