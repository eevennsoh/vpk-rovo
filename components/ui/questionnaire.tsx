"use client"

import ArrowLeftIcon from "@atlaskit/icon/core/arrow-left"
import ArrowRightIcon from "@atlaskit/icon/core/arrow-right"
import {
	Questionnaire as QuestionnairePrimitive,
	type QuestionnaireChoiceDefinition,
	type QuestionnaireInputType,
	type QuestionnaireItemDefinition,
	type QuestionnaireItemStatus,
	type QuestionnaireShortcutMode,
} from "@shadcn/react/questionnaire"

import { Button, type ButtonProps } from "@/components/ui/button"
import { Icon } from "@/components/ui/icon"
import { Input } from "@/components/ui/input"
import { Kbd } from "@/components/ui/kbd"
import { cn } from "@/lib/utils"

export type QuestionnaireProps = React.ComponentProps<
	typeof QuestionnairePrimitive.Root
>

function Questionnaire({ className, ...props }: Readonly<QuestionnaireProps>) {
	return (
		<QuestionnairePrimitive.Root
			data-slot="questionnaire"
			className={cn(
				"group/questionnaire flex w-full min-w-0 flex-col gap-4",
				className
			)}
			{...props}
		/>
	)
}

export type QuestionnaireProgressProps = React.ComponentProps<
	typeof QuestionnairePrimitive.Progress
>

function QuestionnaireProgress({
	className,
	...props
}: Readonly<QuestionnaireProgressProps>) {
	return (
		<QuestionnairePrimitive.Progress
			data-slot="questionnaire-progress"
			className={cn(
				"text-muted-foreground text-xs font-medium tabular-nums",
				className
			)}
			{...props}
		/>
	)
}

export type QuestionnaireItemProps = React.ComponentProps<
	typeof QuestionnairePrimitive.Item
>

function QuestionnaireItem({
	className,
	...props
}: Readonly<QuestionnaireItemProps>) {
	return (
		<QuestionnairePrimitive.Item
			data-slot="questionnaire-item"
			// The primitive puts `hidden` + `inert` on every inactive step, and
			// Tailwind preflight enforces `[hidden] { display: none !important }`,
			// so `flex` here cannot resurrect a hidden step.
			className={cn(
				"group/questionnaire-item flex min-w-0 flex-col gap-1 border-0 p-0",
				className
			)}
			{...props}
		/>
	)
}

export type QuestionnaireTitleProps = React.ComponentProps<
	typeof QuestionnairePrimitive.Title
>

function QuestionnaireTitle({
	className,
	...props
}: Readonly<QuestionnaireTitleProps>) {
	return (
		<QuestionnairePrimitive.Title
			data-slot="questionnaire-title"
			// A flex fieldset lays its legend out as a normal flex item, so the
			// default legend inset/notch never applies here.
			className={cn(
				"text-foreground float-none p-0 text-base leading-snug font-medium",
				className
			)}
			{...props}
		/>
	)
}

export type QuestionnaireDescriptionProps = React.ComponentProps<
	typeof QuestionnairePrimitive.Description
>

function QuestionnaireDescription({
	className,
	...props
}: Readonly<QuestionnaireDescriptionProps>) {
	return (
		<QuestionnairePrimitive.Description
			data-slot="questionnaire-description"
			className={cn("text-muted-foreground text-sm leading-normal", className)}
			{...props}
		/>
	)
}

export type QuestionnaireChoicesProps = React.ComponentProps<
	typeof QuestionnairePrimitive.Choices
>

function QuestionnaireChoices({
	className,
	...props
}: Readonly<QuestionnaireChoicesProps>) {
	return (
		<QuestionnairePrimitive.Choices
			data-slot="questionnaire-choices"
			className={cn("mt-2 flex min-w-0 flex-col gap-1.5", className)}
			{...props}
		/>
	)
}

export type QuestionnaireChoiceProps = React.ComponentProps<
	typeof QuestionnairePrimitive.Choice
>

function QuestionnaireChoice({
	className,
	...props
}: Readonly<QuestionnaireChoiceProps>) {
	return (
		<QuestionnairePrimitive.Choice
			data-slot="questionnaire-choice"
			// The native control inside owns focus, so the card carries the ring
			// for it rather than the 16px input drawing its own.
			className={cn(
				"border-input bg-bg-input hover:bg-bg-input-hovered active:bg-bg-input-pressed",
				"has-[:focus-visible]:border-ring has-[:focus-visible]:ring-ring/50 has-[:focus-visible]:ring-3",
				"data-checked:border-border-selected data-checked:bg-bg-selected data-checked:text-text-selected",
				// Border only, no ring: an invalid item marks every one of its
				// choices, and stacked red rings would drown out the error text.
				"data-invalid:border-destructive",
				"data-disabled:pointer-events-none data-disabled:opacity-(--opacity-disabled)",
				"group/questionnaire-choice relative flex min-w-0 cursor-pointer items-start gap-2.5 rounded-lg border px-3 py-2.5 text-sm transition-colors select-none motion-reduce:transition-none",
				className
			)}
			{...props}
		/>
	)
}

export type QuestionnaireChoiceInputProps = React.ComponentProps<
	typeof QuestionnairePrimitive.ChoiceInput
>

function QuestionnaireChoiceInput({
	className,
	...props
}: Readonly<QuestionnaireChoiceInputProps>) {
	return (
		<QuestionnairePrimitive.ChoiceInput
			data-slot="questionnaire-choice-input"
			// Kept as a real native radio/checkbox: the primitive's arrow-key and
			// Enter handling rides on native semantics, and `accent-color` tints
			// the built-in indicator while forced-colors mode still works.
			className={cn(
				"accent-primary mt-0.5 size-4 shrink-0 outline-none disabled:cursor-not-allowed",
				className
			)}
			{...props}
		/>
	)
}

export type QuestionnaireChoiceLabelProps = React.ComponentProps<
	typeof QuestionnairePrimitive.ChoiceLabel
>

function QuestionnaireChoiceLabel({
	className,
	...props
}: Readonly<QuestionnaireChoiceLabelProps>) {
	return (
		<QuestionnairePrimitive.ChoiceLabel
			data-slot="questionnaire-choice-label"
			// A second span is treated as supporting copy, matching the choice
			// shape the upstream example documents.
			className={cn(
				"[&>span+span]:text-muted-foreground [&>span+span]:text-xs",
				"flex min-w-0 flex-1 flex-col gap-0.5 leading-snug",
				className
			)}
			{...props}
		/>
	)
}

export type QuestionnaireChoiceShortcutProps = React.ComponentProps<
	typeof QuestionnairePrimitive.ChoiceShortcut
>

function QuestionnaireChoiceShortcut({
	className,
	render,
	...props
}: Readonly<QuestionnaireChoiceShortcutProps>) {
	return (
		<QuestionnairePrimitive.ChoiceShortcut
			data-slot="questionnaire-choice-shortcut"
			className={cn("ms-auto shrink-0 self-center", className)}
			render={render ?? <Kbd />}
			{...props}
		/>
	)
}

export type QuestionnaireInputProps = React.ComponentProps<
	typeof QuestionnairePrimitive.Input
>

function QuestionnaireInput({
	className,
	render,
	...props
}: Readonly<QuestionnaireInputProps>) {
	return (
		<QuestionnairePrimitive.Input
			data-slot="questionnaire-input"
			className={cn("mt-0.5", className)}
			render={render ?? <Input />}
			{...props}
		/>
	)
}

export type QuestionnaireErrorProps = React.ComponentProps<
	typeof QuestionnairePrimitive.Error
>

function QuestionnaireError({
	className,
	...props
}: Readonly<QuestionnaireErrorProps>) {
	return (
		<QuestionnairePrimitive.Error
			data-slot="questionnaire-error"
			className={cn("text-destructive mt-1 text-sm font-normal", className)}
			{...props}
		/>
	)
}

export interface QuestionnairePreviousProps
	extends React.ComponentProps<typeof QuestionnairePrimitive.Previous>,
		Pick<ButtonProps, "variant" | "size"> {}

function QuestionnairePrevious({
	children,
	render,
	variant = "ghost",
	size = "default",
	...props
}: Readonly<QuestionnairePreviousProps>) {
	return (
		<QuestionnairePrimitive.Previous
			data-slot="questionnaire-previous"
			render={render ?? <Button variant={variant} size={size} />}
			{...props}
		>
			{children ?? (
				<>
					<Icon
						render={<ArrowLeftIcon label="" size="small" />}
						label=""
						data-icon="inline-start"
					/>
					Back
				</>
			)}
		</QuestionnairePrimitive.Previous>
	)
}

export interface QuestionnaireSkipProps
	extends React.ComponentProps<typeof QuestionnairePrimitive.Skip>,
		Pick<ButtonProps, "variant" | "size"> {}

function QuestionnaireSkip({
	children,
	render,
	variant = "ghost",
	size = "default",
	...props
}: Readonly<QuestionnaireSkipProps>) {
	return (
		<QuestionnairePrimitive.Skip
			data-slot="questionnaire-skip"
			render={render ?? <Button variant={variant} size={size} />}
			{...props}
		>
			{children ?? "Skip"}
		</QuestionnairePrimitive.Skip>
	)
}

export interface QuestionnaireNextProps
	extends React.ComponentProps<typeof QuestionnairePrimitive.Next>,
		Pick<ButtonProps, "variant" | "size"> {}

function QuestionnaireNext({
	children,
	render,
	variant = "default",
	size = "default",
	...props
}: Readonly<QuestionnaireNextProps>) {
	return (
		<QuestionnairePrimitive.Next
			data-slot="questionnaire-next"
			render={render ?? <Button variant={variant} size={size} />}
			{...props}
		>
			{children ?? (
				<>
					Next
					<Icon
						render={<ArrowRightIcon label="" size="small" />}
						label=""
						data-icon="inline-end"
					/>
				</>
			)}
		</QuestionnairePrimitive.Next>
	)
}

export interface QuestionnaireSubmitProps
	extends React.ComponentProps<typeof QuestionnairePrimitive.Submit>,
		Pick<ButtonProps, "variant" | "size"> {}

function QuestionnaireSubmit({
	children,
	render,
	variant = "default",
	size = "default",
	...props
}: Readonly<QuestionnaireSubmitProps>) {
	return (
		<QuestionnairePrimitive.Submit
			data-slot="questionnaire-submit"
			render={render ?? <Button variant={variant} size={size} />}
			{...props}
		>
			{children ?? "Submit"}
		</QuestionnairePrimitive.Submit>
	)
}

export type {
	QuestionnaireChoiceDefinition,
	QuestionnaireInputType,
	QuestionnaireItemDefinition,
	QuestionnaireItemStatus,
	QuestionnaireShortcutMode,
}

export {
	Questionnaire,
	QuestionnaireProgress,
	QuestionnaireItem,
	QuestionnaireTitle,
	QuestionnaireDescription,
	QuestionnaireChoices,
	QuestionnaireChoice,
	QuestionnaireChoiceInput,
	QuestionnaireChoiceLabel,
	QuestionnaireChoiceShortcut,
	QuestionnaireInput,
	QuestionnaireError,
	QuestionnairePrevious,
	QuestionnaireSkip,
	QuestionnaireNext,
	QuestionnaireSubmit,
}
