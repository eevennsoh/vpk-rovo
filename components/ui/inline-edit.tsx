"use client"

import * as React from "react"
import ArrowUpIcon from "@atlaskit/icon/core/arrow-up"
import CheckMarkIcon from "@atlaskit/icon/core/check-mark"
import CrossIcon from "@atlaskit/icon/core/cross"

import { Button } from "@/components/ui/button"
import { Icon } from "@/components/ui/icon"
import { Input, type InputProps } from "@/components/ui/input"
import { Textarea, type TextareaProps } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

export interface InlineEditProps {
	value: string
	onConfirm?: (value: string) => void
	onCancel?: () => void
	onEdit?: () => void
	validate?: (value: string) => string | undefined
	label?: string
	placeholder?: string
	isRequired?: boolean
	requiredMessage?: string
	disabled?: boolean
	hideActionButtons?: boolean
	keepEditViewOpenOnBlur?: boolean
	readViewFitContainerWidth?: boolean
	startWithEditViewOpen?: boolean
	editButtonLabel?: string
	confirmButtonLabel?: string
	cancelButtonLabel?: string
	multiline?: boolean
	inputProps?: Omit<
		InputProps,
		| "value"
		| "onChange"
		| "placeholder"
		| "autoFocus"
		| "aria-invalid"
		| "aria-describedby"
		| "onBlur"
		| "onKeyDown"
	>
	textareaProps?: Omit<
		TextareaProps,
		| "value"
		| "onChange"
		| "placeholder"
		| "autoFocus"
		| "aria-invalid"
		| "aria-describedby"
		| "onBlur"
		| "onKeyDown"
	>
	className?: string
}

function InlineEdit({
	value,
	onConfirm,
	onCancel,
	onEdit,
	validate,
	label,
	placeholder = "Click to edit",
	isRequired = false,
	requiredMessage = "This field is required.",
	disabled = false,
	hideActionButtons = false,
	keepEditViewOpenOnBlur = false,
	readViewFitContainerWidth = true,
	startWithEditViewOpen = false,
	editButtonLabel = "Edit value",
	confirmButtonLabel = "Confirm changes",
	cancelButtonLabel = "Cancel changes",
	multiline = false,
	inputProps,
	textareaProps,
	className,
}: Readonly<InlineEditProps>) {
	const [editing, setEditing] = React.useState(startWithEditViewOpen)
	const [draft, setDraft] = React.useState(value)
	const [error, setError] = React.useState<string>()
	const [ariaMessage, setAriaMessage] = React.useState("")
	const rootRef = React.useRef<HTMLDivElement>(null)
	const inputRef = React.useRef<HTMLInputElement>(null)
	const textareaRef = React.useRef<HTMLTextAreaElement>(null)
	const actionPointerRef = React.useRef(false)
	const generatedInputId = React.useId()
	const inputId = inputProps?.id ?? generatedInputId
	const labelId = `${inputId}-label`
	const errorId = `${inputId}-error`

	const runValidation = React.useCallback(
		(nextValue: string) => {
			if (isRequired && nextValue.trim().length === 0) {
				return requiredMessage
			}

			return validate?.(nextValue)
		},
		[isRequired, requiredMessage, validate]
	)

	const finishEditing = React.useCallback(
		(nextValue: string) => {
			const nextError = runValidation(nextValue)
			if (nextError) {
				setError(nextError)
				setAriaMessage(nextError)
				return false
			}

			setError(undefined)
			setAriaMessage("Changes saved.")
			onConfirm?.(nextValue)
			setEditing(false)
			return true
		},
		[onConfirm, runValidation]
	)

	const beginEditing = React.useCallback(() => {
		if (disabled) {
			return
		}

		setDraft(value)
		setError(undefined)
		setAriaMessage("")
		setEditing(true)
		onEdit?.()
	}, [disabled, onEdit, value])

	const cancelEditing = React.useCallback(() => {
		setDraft(value)
		setError(undefined)
		setAriaMessage("Changes discarded.")
		setEditing(false)
		onCancel?.()
	}, [onCancel, value])

	React.useEffect(() => {
		if (!editing) {
			return
		}

		const el = multiline ? textareaRef.current : inputRef.current
		el?.focus()
		if (el instanceof HTMLInputElement) {
			el.select()
		} else if (el instanceof HTMLTextAreaElement) {
			el.setSelectionRange(el.value.length, el.value.length)
		}
	}, [editing, multiline])

	const handleBlur = (event: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
		if (keepEditViewOpenOnBlur) {
			return
		}

		const nextFocused = event.relatedTarget
		if (nextFocused && rootRef.current?.contains(nextFocused)) {
			return
		}

		if (actionPointerRef.current) {
			actionPointerRef.current = false
			return
		}

		finishEditing(draft)
	}

	if (!editing) {
		return (
			<div data-slot="inline-edit" className={cn("flex w-full flex-col gap-1", className)}>
				{label ? (
					<span id={labelId} className="text-text-subtle text-xs leading-4 font-semibold">
						{label}
					</span>
				) : null}
				<button
					type="button"
					aria-labelledby={label ? `${labelId} ${inputId}` : undefined}
					aria-label={label ? undefined : editButtonLabel}
					disabled={disabled}
					data-slot="inline-edit-read-view"
					className={cn(
						"focus-visible:border-ring focus-visible:ring-ring/50 flex rounded-md border border-transparent bg-bg-neutral-subtle px-1.5 text-left text-sm leading-5 outline-none transition-colors focus-visible:ring-3",
						multiline ? "min-h-10 items-start py-2" : "h-10 items-center",
						readViewFitContainerWidth ? "w-full" : "w-fit max-w-full",
						"hover:bg-bg-neutral-subtle-hovered active:bg-bg-neutral-subtle-pressed",
						"disabled:pointer-events-none disabled:bg-bg-disabled disabled:text-text-disabled"
					)}
					onClick={beginEditing}
				>
					<span
						id={inputId}
						className={cn("min-w-0 flex-1", multiline ? "whitespace-pre-wrap" : "truncate", value ? "text-text" : "text-text-subtle")}
					>
						{value || placeholder}
					</span>
				</button>
				{ariaMessage ? <span className="sr-only">{ariaMessage}</span> : null}
			</div>
		)
	}

	const { className: inputClassName, ...restInputProps } = inputProps ?? {}
	const { className: textareaClassName, ...restTextareaProps } = textareaProps ?? {}

	const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
		setDraft(event.target.value)
		if (error) {
			setError(undefined)
		}
	}

	const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
		if (event.key === "Enter" && !multiline) {
			event.preventDefault()
			finishEditing(draft)
		}

		if (event.key === "Escape") {
			event.preventDefault()
			cancelEditing()
		}
	}

	return (
		<div ref={rootRef} data-slot="inline-edit" className={cn("flex w-full flex-col gap-1", className)}>
			{label ? (
				<label id={labelId} htmlFor={inputId} className="text-text-subtle text-xs leading-4 font-semibold">
					{label}
				</label>
			) : null}
			<div className="relative w-full">
				{multiline ? (
					<Textarea
						{...restTextareaProps}
						id={inputId}
						ref={textareaRef}
						value={draft}
						autoFocus
						disabled={disabled}
						placeholder={placeholder}
						aria-invalid={error ? true : undefined}
						aria-describedby={error ? errorId : undefined}
						aria-labelledby={label ? labelId : undefined}
						className={cn(
							error ? "border-destructive" : null,
							textareaClassName
						)}
						onChange={handleChange}
						onBlur={handleBlur}
						onKeyDown={handleKeyDown}
					/>
				) : (
					<Input
						{...restInputProps}
						id={inputId}
						ref={inputRef}
						value={draft}
						autoFocus
						disabled={disabled}
						placeholder={placeholder}
						aria-invalid={error ? true : undefined}
						aria-describedby={error ? errorId : undefined}
						aria-labelledby={label ? labelId : undefined}
						className={cn(
							"h-10 rounded-md data-[variant=default]:border-ring bg-bg-input px-1.5 text-sm focus-visible:ring-0 focus-visible:ring-transparent focus-visible:ring-offset-0",
							error ? "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20" : null,
							inputClassName
						)}
						onChange={handleChange}
						onBlur={handleBlur}
						onKeyDown={handleKeyDown}
					/>
				)}
				{hideActionButtons ? null : (
					<div className="absolute top-full right-0 z-[200] mt-1.5 flex items-center gap-1">
						<div className="size-8 rounded-md bg-surface-overlay shadow-2xl">
							<Button
								type="button"
								variant="ghost"
								size="icon"
								disabled={disabled}
								aria-label={confirmButtonLabel}
								className="text-icon-subtle hover:bg-surface-overlay-hovered active:bg-surface-overlay-pressed hover:text-text size-full rounded-md border-0 bg-surface-overlay shadow-none"
								onMouseDown={() => {
									actionPointerRef.current = true
								}}
								onClick={() => {
									finishEditing(draft)
								}}
							>
								<Icon
									render={multiline ? <ArrowUpIcon label="" size="small" /> : <CheckMarkIcon label="" size="small" />}
									label={confirmButtonLabel}
								/>
							</Button>
						</div>
						<div className="size-8 rounded-md bg-surface-overlay shadow-2xl">
							<Button
								type="button"
								variant="ghost"
								size="icon"
								disabled={disabled}
								aria-label={cancelButtonLabel}
								className="text-icon-subtle hover:bg-surface-overlay-hovered active:bg-surface-overlay-pressed hover:text-text size-full rounded-md border-0 bg-surface-overlay shadow-none"
								onMouseDown={() => {
									actionPointerRef.current = true
								}}
								onClick={cancelEditing}
							>
								<Icon
									render={<CrossIcon label="" size="small" />}
									label={cancelButtonLabel}
								/>
							</Button>
						</div>
					</div>
				)}
			</div>
			{error ? (
				<p id={errorId} className="text-text-danger text-xs leading-4">
					{error}
				</p>
			) : null}
			{ariaMessage ? <span className="sr-only">{ariaMessage}</span> : null}
		</div>
	)
}

export { InlineEdit }
