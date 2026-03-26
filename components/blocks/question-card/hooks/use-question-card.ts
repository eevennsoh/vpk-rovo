import { useCallback, useEffect, useRef, useState } from "react";
import type { QuestionCardAnswerValue, QuestionCardAnswers, QuestionCardQuestion } from "../types";
import {
	getNextFocusedIndex,
	getVisibleOptionCount,
} from "../lib/option-slots";
import { shouldAutoFocusCustomInputForQuestion } from "../lib/focus-policy";
import { getQuestionCardPrimaryAction } from "../lib/footer-actions";
import { getCustomInputValue, isQuestionAnswered } from "../lib/question-helpers";

interface UseQuestionCardOptions {
	questions: ReadonlyArray<QuestionCardQuestion>;
	isSubmitting: boolean;
	maxVisibleOptions: number;
	showCustomInput: boolean;
	defaultAnswers?: QuestionCardAnswers;
	onSubmit: (answers: QuestionCardAnswers) => void;
	onDismiss?: () => void;
	/** When set, Skip ends the whole card (deferred clarification); parent should cancel the tool in `onDismiss`. */
	toolCallId?: string;
}

export function useQuestionCard({
	questions,
	isSubmitting,
	maxVisibleOptions,
	showCustomInput,
	defaultAnswers,
	onSubmit,
	onDismiss,
	toolCallId,
}: Readonly<UseQuestionCardOptions>) {
	const cardRef = useRef<HTMLDivElement>(null);
	const customInputRef = useRef<HTMLInputElement>(null);
	const previousQuestionIndexRef = useRef<number | null>(null);
	const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
	const [answers, setAnswers] = useState<QuestionCardAnswers>(defaultAnswers ?? {});
	const [focusedIndex, setFocusedIndex] = useState(0);

	const totalQuestions = questions.length;
	const hasMultipleQuestions = totalQuestions > 1;
	const safeQuestionIndex = Math.min(Math.max(0, currentQuestionIndex), totalQuestions - 1);
	const currentQuestion = questions[safeQuestionIndex];
	const canGoToPreviousQuestion = safeQuestionIndex > 0;
	const canGoToNextQuestion = safeQuestionIndex < totalQuestions - 1;
	const visibleOptionCount = getVisibleOptionCount(currentQuestion.options.length, maxVisibleOptions);
	const customOptionIndex = visibleOptionCount;
	const customInputValue = getCustomInputValue(currentQuestion, answers[currentQuestion.id]);
	const hasCustomInputText = Boolean(customInputValue && customInputValue.trim().length > 0);

	const allQuestionsAnswered = questions.every((question) => isQuestionAnswered(question, answers));
	const primaryAction = getQuestionCardPrimaryAction(allQuestionsAnswered, hasCustomInputText);

	useEffect(() => {
		cardRef.current?.focus();
	}, []);

	useEffect(() => {
		const previousQuestionIndex = previousQuestionIndexRef.current;
		const hasQuestionChanged = previousQuestionIndex !== null && previousQuestionIndex !== safeQuestionIndex;
		previousQuestionIndexRef.current = safeQuestionIndex;

		if (!hasQuestionChanged) {
			return;
		}

		const shouldAutoFocusCustomInput = shouldAutoFocusCustomInputForQuestion({
			optionCount: currentQuestion.options.length,
			maxVisibleOptions,
			showCustomInput,
		});
		if (shouldAutoFocusCustomInput) {
			customInputRef.current?.focus();
			return;
		}

		if (document.activeElement === customInputRef.current || cardRef.current?.contains(document.activeElement)) {
			cardRef.current?.focus();
		}
	}, [safeQuestionIndex, currentQuestion, maxVisibleOptions, showCustomInput]);

	const resetFocusForNewQuestion = useCallback(() => {
		setFocusedIndex(0);
	}, []);

	const goToNextQuestion = useCallback(() => {
		resetFocusForNewQuestion();
		setCurrentQuestionIndex((previous) => Math.min(totalQuestions - 1, previous + 1));
	}, [totalQuestions, resetFocusForNewQuestion]);

	const goToPreviousQuestion = useCallback(() => {
		resetFocusForNewQuestion();
		setCurrentQuestionIndex((previous) => Math.max(0, previous - 1));
	}, [resetFocusForNewQuestion]);

	const handleSkip = useCallback(() => {
		if (isSubmitting) return;

		// Deferred clarification: Skip ends the whole card; the shell dismiss
		// handler cancels the deferred tool (spec §2.4). Do not advance questions.
		if (toolCallId) {
			onDismiss?.();
			return;
		}

		if (canGoToNextQuestion) {
			goToNextQuestion();
		} else {
			onDismiss?.();
		}
	}, [isSubmitting, canGoToNextQuestion, goToNextQuestion, toolCallId, onDismiss]);

	const handleSelectOption = useCallback(
		(optionId: string) => {
			if (isSubmitting) return;

			const nextAnswers = { ...answers, [currentQuestion.id]: optionId };
			setAnswers(nextAnswers);

			if (canGoToNextQuestion) {
				goToNextQuestion();
				return;
			}

			const allAnswered = questions.every((question) => (question.id === currentQuestion.id ? true : isQuestionAnswered(question, nextAnswers)));
			if (allAnswered) {
				onSubmit(nextAnswers);
			}
		},
		[isSubmitting, answers, currentQuestion, canGoToNextQuestion, goToNextQuestion, questions, onSubmit],
	);

	const handleCustomInputSubmit = useCallback(
		(value: string) => {
			if (isSubmitting || !value.trim()) return;

			const nextAnswers = { ...answers, [currentQuestion.id]: value.trim() };
			setAnswers(nextAnswers);

			if (canGoToNextQuestion) {
				goToNextQuestion();
				return;
			}

			const allAnswered = questions.every((question) => (question.id === currentQuestion.id ? true : isQuestionAnswered(question, nextAnswers)));
			if (allAnswered) {
				onSubmit(nextAnswers);
			}
		},
		[isSubmitting, answers, currentQuestion, canGoToNextQuestion, goToNextQuestion, questions, onSubmit],
	);

	const handleAnswerChange = useCallback(
		(answerValue: QuestionCardAnswerValue, options?: Readonly<{ autoAdvance?: boolean }>) => {
			if (isSubmitting) return;

			setAnswers((previousAnswers) => ({
				...previousAnswers,
				[currentQuestion.id]: answerValue,
			}));

			if (options?.autoAdvance && currentQuestion.kind === "single-select") {
				if (canGoToNextQuestion) {
					goToNextQuestion();
				} else {
					const nextAnswers = {
						...answers,
						[currentQuestion.id]: answerValue,
					};
					const allAnswered = questions.every((question) => (question.id === currentQuestion.id ? true : isQuestionAnswered(question, nextAnswers)));
					if (allAnswered) {
						onSubmit(nextAnswers);
					}
				}
			}
		},
		[isSubmitting, currentQuestion, canGoToNextQuestion, goToNextQuestion, answers, questions, onSubmit],
	);

	const handleKeyDown = useCallback(
		(event: React.KeyboardEvent) => {
			if (isSubmitting) return;

			const isCustomInputFocused = document.activeElement === customInputRef.current;
			switch (event.key) {
				case "Tab": {
					// Tab moves to the footer custom input; Shift+Tab moves back to the card.
					if (showCustomInput) {
						if (event.shiftKey && isCustomInputFocused) {
							event.preventDefault();
							cardRef.current?.focus();
						} else if (!event.shiftKey && !isCustomInputFocused) {
							event.preventDefault();
							customInputRef.current?.focus();
						} else if (!event.shiftKey && isCustomInputFocused) {
							event.preventDefault();
							cardRef.current?.focus();
							setFocusedIndex(0);
						}
					} else {
						event.preventDefault();
					}
					break;
				}
				case "ArrowUp": {
					if (isCustomInputFocused) return;
					if (visibleOptionCount === 0) return;
					event.preventDefault();
					setFocusedIndex((previous) => getNextFocusedIndex(previous, visibleOptionCount, "up"));
					break;
				}
				case "ArrowDown": {
					if (isCustomInputFocused) return;
					if (visibleOptionCount === 0) return;
					event.preventDefault();
					setFocusedIndex((previous) => getNextFocusedIndex(previous, visibleOptionCount, "down"));
					break;
				}
				case "Enter": {
					if (isCustomInputFocused) {
						event.preventDefault();
						const inputValue = customInputRef.current?.value ?? "";
						handleCustomInputSubmit(inputValue);
						return;
					}

					event.preventDefault();
					if (focusedIndex < visibleOptionCount) {
						const option = currentQuestion.options[focusedIndex];
						if (option) {
							handleSelectOption(option.id);
						}
					}
					break;
				}
				case "ArrowLeft": {
					if (isCustomInputFocused) return;
					event.preventDefault();
					if (canGoToPreviousQuestion) {
						goToPreviousQuestion();
					}
					break;
				}
				case "ArrowRight": {
					if (isCustomInputFocused) return;
					event.preventDefault();
					if (canGoToNextQuestion) {
						goToNextQuestion();
					}
					break;
				}
				case "Escape": {
					event.preventDefault();
					if (isCustomInputFocused) {
						cardRef.current?.focus();
						return;
					}
					onDismiss?.();
					break;
				}
				default: {
					if (isCustomInputFocused) break;
					const digit = Number(event.key);
					if (digit >= 1 && digit <= 9) {
						const index = digit - 1;
						if (index < visibleOptionCount) {
							event.preventDefault();
							const option = currentQuestion.options[index];
							if (option) {
								handleSelectOption(option.id);
							}
						}
					}
					break;
				}
			}
		},
		[
			isSubmitting,
			showCustomInput,
			focusedIndex,
			visibleOptionCount,
			currentQuestion,
			canGoToPreviousQuestion,
			canGoToNextQuestion,
			goToPreviousQuestion,
			goToNextQuestion,
			handleSelectOption,
			handleCustomInputSubmit,
			onDismiss,
		],
	);

	return {
		cardRef,
		customInputRef,
		answers,
		focusedIndex,
		setFocusedIndex,
		currentQuestion,
		safeQuestionIndex,
		totalQuestions,
		hasMultipleQuestions,
		canGoToPreviousQuestion,
		canGoToNextQuestion,
		visibleOptionCount,
		customInputValue,
		customOptionIndex,
		primaryAction,
		goToNextQuestion,
		goToPreviousQuestion,
		handleSkip,
		handleAnswerChange,
		handleKeyDown,
		onSubmit: () => onSubmit(answers),
	};
}
