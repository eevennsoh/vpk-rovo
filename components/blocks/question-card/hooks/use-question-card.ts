import { useCallback, useEffect, useRef, useState } from "react";
import type { QuestionCardAnswerValue, QuestionCardAnswers, QuestionCardQuestion } from "../types";
import {
	getNextFocusedIndex,
	getVisibleOptionCount,
} from "../lib/option-slots";
import { shouldAutoFocusCustomInputForQuestion } from "../lib/focus-policy";
import { getQuestionCardPrimaryAction } from "../lib/footer-actions";
import {
	getCustomInputValue,
	getSelectedValues,
	isQuestionAnswered,
} from "../lib/question-helpers";
import { QUESTION_CARD_SKIPPED_VALUE } from "../lib/skipped-answer";

interface UseQuestionCardOptions {
	questions: ReadonlyArray<QuestionCardQuestion>;
	isSubmitting: boolean;
	maxVisibleOptions: number;
	showCustomInput: boolean;
	defaultAnswers?: QuestionCardAnswers;
	onSubmit: (answers: QuestionCardAnswers) => void;
	onDismiss?: () => void;
}

export function useQuestionCard({
	questions,
	isSubmitting,
	maxVisibleOptions,
	showCustomInput,
	defaultAnswers,
	onSubmit,
	onDismiss,
}: Readonly<UseQuestionCardOptions>) {
	const cardRef = useRef<HTMLDivElement>(null);
	const customInputRef = useRef<HTMLInputElement>(null);
	const footerButtonRef = useRef<HTMLButtonElement>(null);
	const previousQuestionIndexRef = useRef<number | null>(null);
	const [navigationDirection, setNavigationDirection] = useState<"forward" | "backward">("forward");
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
		setNavigationDirection("forward");
		resetFocusForNewQuestion();
		setCurrentQuestionIndex((previous) => Math.min(totalQuestions - 1, previous + 1));
	}, [totalQuestions, resetFocusForNewQuestion]);

	const goToPreviousQuestion = useCallback(() => {
		setNavigationDirection("backward");
		resetFocusForNewQuestion();
		setCurrentQuestionIndex((previous) => Math.max(0, previous - 1));
	}, [resetFocusForNewQuestion]);

	const handleSkip = useCallback(() => {
		if (isSubmitting) return;

		const nextAnswers = {
			...answers,
			[currentQuestion.id]: QUESTION_CARD_SKIPPED_VALUE,
		};

		if (canGoToNextQuestion) {
			setAnswers(nextAnswers);
			goToNextQuestion();
		} else {
			const hasAnyRealAnswer = questions.some((question) =>
				isQuestionAnswered(question, nextAnswers) &&
				nextAnswers[question.id] !== QUESTION_CARD_SKIPPED_VALUE
			);
			if (hasAnyRealAnswer) {
				setAnswers(nextAnswers);
				onSubmit(nextAnswers);
			} else {
				onDismiss?.();
			}
		}
	}, [isSubmitting, currentQuestion, canGoToNextQuestion, goToNextQuestion, questions, answers, onSubmit, onDismiss]);

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

	const handleKeyboardOptionSelect = useCallback(
		(optionId: string) => {
			if (currentQuestion.kind === "multi-select") {
				setAnswers((previousAnswers) => {
					const selectedValues = getSelectedValues(previousAnswers[currentQuestion.id]);
					const nextValues = selectedValues.includes(optionId)
						? selectedValues.filter((value) => value !== optionId)
						: [...selectedValues, optionId];

					return {
						...previousAnswers,
						[currentQuestion.id]: nextValues,
					};
				});
				return;
			}

			handleSelectOption(optionId);
		},
		[currentQuestion, handleSelectOption],
	);

	const handleCustomInputFocus = useCallback(() => {
		setFocusedIndex(-1);
	}, []);

	const handleKeyDown = useCallback(
		(event: React.KeyboardEvent) => {
			if (isSubmitting) return;

			const isCustomInputFocused = document.activeElement === customInputRef.current;
			switch (event.key) {
				case "Tab": {
					// Focus cycle: card options → custom input → footer button → card options
					const isFooterButtonFocused = document.activeElement === footerButtonRef.current;
					if (showCustomInput) {
						if (event.shiftKey) {
							if (isFooterButtonFocused) {
								event.preventDefault();
								customInputRef.current?.focus();
								setFocusedIndex(-1);
							} else if (isCustomInputFocused) {
								event.preventDefault();
								cardRef.current?.focus();
								if (visibleOptionCount > 0) {
									setFocusedIndex(visibleOptionCount - 1);
								}
							}
						} else {
							if (isCustomInputFocused) {
								event.preventDefault();
								footerButtonRef.current?.focus();
							} else if (isFooterButtonFocused) {
								event.preventDefault();
								cardRef.current?.focus();
								setFocusedIndex(0);
							} else {
								event.preventDefault();
								setFocusedIndex(-1);
								customInputRef.current?.focus();
							}
						}
					} else {
						// No custom input: card options → footer button → card options
						if (event.shiftKey && isFooterButtonFocused) {
							event.preventDefault();
							cardRef.current?.focus();
							if (visibleOptionCount > 0) {
								setFocusedIndex(visibleOptionCount - 1);
							}
						} else if (!event.shiftKey && !isFooterButtonFocused) {
							event.preventDefault();
							footerButtonRef.current?.focus();
						} else if (!event.shiftKey && isFooterButtonFocused) {
							event.preventDefault();
							cardRef.current?.focus();
							setFocusedIndex(0);
						}
					}
					break;
				}
				case "ArrowUp": {
					event.preventDefault();
					if (isCustomInputFocused) {
						// Move from custom input back to the last visible option
						cardRef.current?.focus();
						if (visibleOptionCount > 0) {
							setFocusedIndex(visibleOptionCount - 1);
						}
						break;
					}
					if (visibleOptionCount === 0) break;
					// Stop at first option — do not wrap around
					if (focusedIndex === 0) break;
					setFocusedIndex((previous) => getNextFocusedIndex(previous, visibleOptionCount, "up"));
					break;
				}
				case "ArrowDown": {
					event.preventDefault();
					if (isCustomInputFocused) break;
					if (visibleOptionCount === 0) break;
					// If at last option and custom input exists, move focus there
					if (showCustomInput && focusedIndex === visibleOptionCount - 1) {
						setFocusedIndex(-1);
						customInputRef.current?.focus();
						break;
					}
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

					// Allow native button activation when footer button (Skip/Next/Submit) is focused
					if (document.activeElement === footerButtonRef.current) {
						break;
					}

					event.preventDefault();
					if (focusedIndex < visibleOptionCount) {
						const option = currentQuestion.options[focusedIndex];
						if (option) {
							handleKeyboardOptionSelect(option.id);
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
					handleSkip();
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
								handleKeyboardOptionSelect(option.id);
							}
						} else if (showCustomInput && index === customOptionIndex) {
							event.preventDefault();
							setFocusedIndex(-1);
							customInputRef.current?.focus();
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
			customOptionIndex,
			currentQuestion,
			canGoToPreviousQuestion,
			canGoToNextQuestion,
			goToPreviousQuestion,
			goToNextQuestion,
			handleKeyboardOptionSelect,
			handleCustomInputSubmit,
			handleSkip,
		],
	);

	return {
		cardRef,
		customInputRef,
		footerButtonRef,
		navigationDirection,
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
		handleCustomInputFocus,
		handleKeyDown,
		onSubmit: () => onSubmit(answers),
	};
}
