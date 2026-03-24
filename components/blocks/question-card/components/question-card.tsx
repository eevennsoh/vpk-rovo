"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProgressIndicator } from "@/components/ui/progress-indicator";
import { cn } from "@/lib/utils";
import CheckMarkIcon from "@atlaskit/icon/core/check-mark";
import ChevronLeftIcon from "@atlaskit/icon/core/chevron-left";
import ChevronRightIcon from "@atlaskit/icon/core/chevron-right";
import CrossIcon from "@atlaskit/icon/core/cross";
import { getVisibleOptionCount } from "@/components/blocks/question-card/lib/option-slots";
import { getCustomInputValue, getSelectedValues } from "@/components/blocks/question-card/lib/question-helpers";
import { useQuestionCard } from "@/components/blocks/question-card/hooks/use-question-card";
import type { QuestionCardAnswerValue, QuestionCardAnswers, QuestionCardQuestion } from "../types";

// Re-export types for backward compatibility
export type { QuestionCardOption, QuestionCardQuestion, QuestionCardAnswerValue, QuestionCardAnswers } from "../types";

// ---------------------------------------------------------------------------
// Component props
// ---------------------------------------------------------------------------

export interface QuestionCardProps extends Omit<React.ComponentProps<"div">, "onSubmit"> {
	/** Ordered list of questions to present. */
	questions: ReadonlyArray<QuestionCardQuestion>;
	/** When `true`, all interactions are disabled and a loading state is shown. */
	isSubmitting?: boolean;
	/** Called with the collected answers when the user completes all questions or clicks Submit. */
	onSubmit: (answers: QuestionCardAnswers) => void;
	/** Called when the user dismisses the card (Escape, Skip for deferred cards, or header close). When omitted, the dismiss button is hidden. */
	onDismiss?: () => void;
	/** When set, Skip closes the whole card (deferred clarification); parent should cancel the tool in `onDismiss`. */
	toolCallId?: string;
	/** Maximum number of pre-defined options to display per question. Additional options are truncated. @default 4 */
	maxVisibleOptions?: number;
	/** Placeholder text for the free-form custom input row. @default "Tell Rovo what to do..." */
	customInputPlaceholder?: string;
	/** Whether to show the free-form custom input row after the option list. @default true */
	showCustomInput?: boolean;
	/** Initial answers to pre-populate. Keys are question IDs. */
	defaultAnswers?: QuestionCardAnswers;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEFAULT_MAX_VISIBLE_OPTIONS = 4;
const DEFAULT_CUSTOM_INPUT_PLACEHOLDER = "Tell Rovo what to do...";

// ---------------------------------------------------------------------------
// QuestionOptionRow (internal)
// ---------------------------------------------------------------------------

interface QuestionOptionRowProps {
	index: number;
	label: string;
	description?: string;
	selected: boolean;
	focused: boolean;
	disabled: boolean;
	kind: QuestionCardQuestion["kind"];
	onPress: () => void;
	onMouseEnter: () => void;
}

function QuestionOptionRow({
	index,
	label,
	description,
	selected,
	focused,
	disabled,
	kind,
	onPress,
	onMouseEnter,
}: Readonly<QuestionOptionRowProps>): React.ReactElement {
	const isMultiSelect = kind === "multi-select";

	return (
		<li data-slot="question-card-option">
			<button
				type="button"
				aria-pressed={selected}
				disabled={disabled}
				onClick={onPress}
				onMouseEnter={onMouseEnter}
				tabIndex={-1}
				className={cn(
					"flex w-full items-center gap-4 rounded-lg px-2 py-1.5 text-left disabled:cursor-not-allowed disabled:opacity-50",
					selected ? "bg-bg-selected" : focused ? "bg-bg-neutral-subtle-hovered" : disabled ? "bg-surface" : "bg-surface hover:bg-bg-neutral-subtle-hovered",
				)}
			>
				<span
					data-slot="question-card-option-index"
					className={cn(
						"inline-flex size-5 shrink-0 items-center justify-center rounded-[4px] border bg-surface text-sm leading-5 font-medium",
						selected ? "border-border-selected text-text-selected" : "border-border text-text",
					)}
				>
					{index + 1}
				</span>
				<span data-slot="question-card-option-content" className="min-w-0 flex-1">
					<span className={cn("block truncate text-sm leading-5 font-medium", selected ? "text-text-selected" : "text-text")}>{label}</span>
					{description ? <span className={cn("block text-sm leading-5 font-normal", selected ? "text-text-selected" : "text-text-subtle")}>{description}</span> : null}
				</span>
				{isMultiSelect ? (
					<span
						data-slot="question-card-option-checkbox"
						aria-hidden="true"
						className={cn(
							"inline-flex size-4 shrink-0 items-center justify-center rounded-sm border transition-colors",
							selected ? "border-primary bg-primary text-primary-foreground" : "border-input bg-bg-input",
						)}
					>
						{selected ? <CheckMarkIcon label="" size="small" /> : null}
					</span>
				) : null}
			</button>
		</li>
	);
}

// ---------------------------------------------------------------------------
// QuestionInput (internal)
// ---------------------------------------------------------------------------

interface QuestionInputProps {
	question: QuestionCardQuestion;
	answerValue: QuestionCardAnswerValue | undefined;
	focusedIndex: number;
	customOptionIndex: number;
	isSubmitting: boolean;
	customInputRef: React.RefObject<HTMLInputElement | null>;
	maxVisibleOptions: number;
	customInputPlaceholder: string;
	showCustomInput: boolean;
	onFocusIndex: (index: number) => void;
	onAnswerChange: (value: QuestionCardAnswerValue, options?: Readonly<{ autoAdvance?: boolean }>) => void;
}

function QuestionInput({
	question,
	answerValue,
	focusedIndex,
	customOptionIndex,
	isSubmitting,
	customInputRef,
	maxVisibleOptions,
	customInputPlaceholder,
	showCustomInput,
	onFocusIndex,
	onAnswerChange,
}: Readonly<QuestionInputProps>): React.ReactElement {
	const selectedValues = getSelectedValues(answerValue);
	const visibleOptionCount = getVisibleOptionCount(question.options.length, maxVisibleOptions);
	const visibleOptions = question.options.slice(0, visibleOptionCount);
	const customInputValue = getCustomInputValue(question, answerValue);
	const isTextOnlyMode = visibleOptionCount === 0;

	return (
		<ul data-slot="question-card-options" className="m-0 flex list-none flex-col gap-1 p-0" role="group" aria-label={question.label}>
			{visibleOptions.map((option, index) => {
				const isSelected = selectedValues.includes(option.id);
				return (
					<QuestionOptionRow
						key={option.id}
						index={index}
						label={option.label}
						description={option.description}
						selected={isSelected}
						focused={focusedIndex === index}
						disabled={isSubmitting}
						kind={question.kind}
						onMouseEnter={() => onFocusIndex(index)}
						onPress={() => {
							if (question.kind === "single-select") {
								onAnswerChange(option.id, { autoAdvance: true });
								return;
							}

							const nextValues = isSelected ? selectedValues.filter((value) => value !== option.id) : [...selectedValues, option.id];
							onAnswerChange(nextValues);
						}}
					/>
				);
			})}
			{showCustomInput ? (
				<li
					data-slot="question-card-custom-input"
					className={cn("flex h-8 items-center rounded-lg", isTextOnlyMode ? "px-1" : "gap-4 pl-2")}
					onMouseEnter={() => {
						onFocusIndex(customOptionIndex);
						customInputRef.current?.focus();
					}}
				>
					{isTextOnlyMode ? null : (
						<span className="inline-flex size-5 shrink-0 items-center justify-center rounded-[4px] border border-border bg-surface text-sm leading-5 font-medium text-text">{customOptionIndex + 1}</span>
					)}
					<Input
						ref={customInputRef}
						aria-label={`${question.label} custom answer`}
						value={customInputValue}
						onChange={(event) => onAnswerChange((event.target as HTMLInputElement).value)}
						onFocus={() => onFocusIndex(customOptionIndex)}
						disabled={isSubmitting}
						placeholder={question.placeholder ?? customInputPlaceholder}
						className="h-8 border-input bg-bg-input text-sm leading-5"
					/>
				</li>
			) : null}
		</ul>
	);
}

// ---------------------------------------------------------------------------
// QuestionCard
// ---------------------------------------------------------------------------

function QuestionCard({
	questions,
	isSubmitting = false,
	onSubmit,
	onDismiss,
	toolCallId,
	maxVisibleOptions = DEFAULT_MAX_VISIBLE_OPTIONS,
	customInputPlaceholder = DEFAULT_CUSTOM_INPUT_PLACEHOLDER,
	showCustomInput = true,
	defaultAnswers,
	className,
	...props
}: Readonly<QuestionCardProps>): React.ReactElement {
	const {
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
		customOptionIndex,
		showSubmitButton,
		goToNextQuestion,
		goToPreviousQuestion,
		handleSkip,
		handleAnswerChange,
		handleKeyDown,
		onSubmit: handleSubmit,
	} = useQuestionCard({
		questions,
		isSubmitting,
		maxVisibleOptions,
		showCustomInput,
		defaultAnswers,
		onSubmit,
		onDismiss,
		toolCallId,
	});

	return (
		<div
			ref={cardRef}
			data-slot="question-card"
			data-testid="question-card"
			tabIndex={0}
			role="dialog"
			aria-modal="true"
			aria-label={`Question ${safeQuestionIndex + 1} of ${totalQuestions}: ${currentQuestion.label}`}
			onKeyDown={handleKeyDown}
			className={cn("mx-auto w-full overflow-hidden rounded-xl border border-border bg-surface shadow-[0_-2px_50px_8px_rgba(30,31,33,0.08)] outline-none", className)}
			{...props}
		>
			<header data-slot="question-card-header" className="px-4 pb-4 pt-4">
				<div className="flex items-center justify-between gap-2">
					<div className="min-w-0">
						<h2 className="text-sm leading-5 font-bold text-text">{currentQuestion.label}</h2>
						{currentQuestion.description ? (
							<p className="mt-0.5 text-sm font-normal text-text-subtle">{currentQuestion.description}</p>
						) : null}
					</div>
					{onDismiss ? (
						<Button aria-label="Dismiss questions" size="icon" variant="ghost" disabled={isSubmitting} className="-mr-1 -mt-1 shrink-0" onClick={onDismiss} tabIndex={-1}>
							<CrossIcon label="" size="small" />
						</Button>
					) : null}
				</div>
			</header>

			<div data-slot="question-card-body" className="px-3 pb-4">
				<QuestionInput
					question={currentQuestion}
					answerValue={answers[currentQuestion.id]}
					focusedIndex={focusedIndex}
					customOptionIndex={customOptionIndex}
					isSubmitting={isSubmitting}
					customInputRef={customInputRef}
					maxVisibleOptions={maxVisibleOptions}
					customInputPlaceholder={customInputPlaceholder}
					showCustomInput={showCustomInput}
					onFocusIndex={setFocusedIndex}
					onAnswerChange={handleAnswerChange}
				/>
			</div>

			<footer data-slot="question-card-footer" className="flex h-16 items-center justify-between border-t border-border p-4">
				{hasMultipleQuestions ? (
					<div className="flex items-center gap-2">
						<button
							type="button"
							aria-label="Previous question"
							disabled={!canGoToPreviousQuestion || isSubmitting}
							onClick={goToPreviousQuestion}
							tabIndex={-1}
							className="inline-flex size-5 items-center justify-center rounded text-icon-subtle hover:bg-bg-neutral-subtle-hovered disabled:cursor-not-allowed disabled:opacity-50"
						>
							<ChevronLeftIcon label="Previous question" size="small" />
						</button>
						<ProgressIndicator steps={totalQuestions} currentStep={safeQuestionIndex} size="md" />
						<button
							type="button"
							aria-label="Next question"
							disabled={!canGoToNextQuestion || isSubmitting}
							onClick={goToNextQuestion}
							tabIndex={-1}
							className="inline-flex size-5 items-center justify-center rounded text-icon-subtle hover:bg-bg-neutral-subtle-hovered disabled:cursor-not-allowed disabled:opacity-50"
						>
							<ChevronRightIcon label="Next question" size="small" />
						</button>
					</div>
				) : (
					<div aria-hidden />
				)}

				{showSubmitButton ? (
					<Button disabled={isSubmitting} onClick={handleSubmit} tabIndex={-1}>
						{isSubmitting ? "Submitting..." : "Submit"}
					</Button>
				) : (
					<Button variant="outline" disabled={isSubmitting} onClick={handleSkip} tabIndex={-1}>
						Skip
					</Button>
				)}
			</footer>
		</div>
	);
}

export { QuestionCard };
