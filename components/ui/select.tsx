"use client"

import type { ComponentProps } from "react"
import { Select as SelectPrimitive } from "@base-ui/react/select"

import { dropdownStyles } from "@/components/ui/dropdown-menu"
import { Icon } from "@/components/ui/icon"
import { cn } from "@/lib/utils"
import { Spinner } from "@/components/ui/spinner"
import ChevronDownIcon from "@atlaskit/icon/core/chevron-down"
import CheckMarkIcon from "@atlaskit/icon/core/check-mark"
import ChevronUpIcon from "@atlaskit/icon/core/chevron-up"

const Select = SelectPrimitive.Root

type SelectGroupProps = SelectPrimitive.Group.Props

function SelectGroup({ className, ...props }: Readonly<SelectGroupProps>) {
	return (
		<SelectPrimitive.Group
			data-slot="select-group"
			className={cn(dropdownStyles.group, "scroll-my-1", className)}
			{...props}
		/>
	)
}

type SelectValueProps = SelectPrimitive.Value.Props

function SelectValue({ className, ...props }: Readonly<SelectValueProps>) {
	return (
		<SelectPrimitive.Value
			data-slot="select-value"
			className={cn("flex flex-1 text-left", className)}
			{...props}
		/>
	)
}

interface SelectTriggerProps extends SelectPrimitive.Trigger.Props {
	size?: "sm" | "default"
	variant?: "default" | "subtle" | "none"
	isLoading?: boolean
}

function SelectTrigger({
	className,
	size = "default",
	variant = "default",
	isLoading = false,
	children,
	...props
}: Readonly<SelectTriggerProps>) {
	return (
		<SelectPrimitive.Trigger
			data-slot="select-trigger"
			data-size={size}
			data-variant={variant}
			aria-busy={isLoading || undefined}
			className={cn(
				"data-placeholder:text-text-subtlest focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 aria-invalid:border-destructive gap-1.5 rounded-lg bg-transparent py-2 pr-2 pl-2.5 text-sm transition-colors select-none focus-visible:ring-3 aria-invalid:ring-3 data-[size=default]:h-8 data-[size=sm]:h-7 data-[size=sm]:rounded-md *:data-[slot=select-value]:gap-1.5 [&_svg:not([class*='size-'])]:size-4 flex w-fit items-center justify-between whitespace-nowrap outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-(--opacity-disabled) *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center [&_svg]:pointer-events-none [&_svg]:shrink-0",
				"data-[variant=default]:border-input data-[variant=default]:border data-[variant=default]:bg-bg-input data-[variant=default]:hover:bg-bg-input-hovered data-[variant=default]:active:bg-bg-input-pressed",
				"data-[variant=subtle]:border data-[variant=subtle]:border-transparent data-[variant=subtle]:hover:bg-bg-input-hovered data-[variant=subtle]:active:bg-bg-input-pressed",
				"data-[variant=none]:border-0 data-[variant=none]:bg-transparent",
				isLoading && "pointer-events-none opacity-(--opacity-loading)",
				className
			)}
			{...props}
		>
			{children}
			{isLoading ? (
				<Spinner size="xs" className="text-text-subtle" />
			) : (
				<SelectPrimitive.Icon
					render={
						<Icon
							render={<ChevronDownIcon label="" size="small" spacing="none" />}
							label=""
							className="text-text-subtle size-4 pointer-events-none"
						/>
					}
				/>
			)}
		</SelectPrimitive.Trigger>
	)
}

interface SelectContentProps
	extends SelectPrimitive.Popup.Props,
		Pick<
			SelectPrimitive.Positioner.Props,
			"align" | "alignOffset" | "side" | "sideOffset" | "alignItemWithTrigger"
		> {}

function SelectContent({
	className,
	children,
	side = "bottom",
	sideOffset = 4,
	align = "center",
	alignOffset = 0,
	alignItemWithTrigger = true,
	...props
}: Readonly<SelectContentProps>) {
	return (
		<SelectPrimitive.Portal>
			<SelectPrimitive.Positioner
				side={side}
				sideOffset={sideOffset}
				align={align}
				alignOffset={alignOffset}
				alignItemWithTrigger={alignItemWithTrigger}
				className="isolate z-50"
			>
				<SelectPrimitive.Popup
					data-slot="select-content"
					data-align-trigger={alignItemWithTrigger}
					className={cn(
						dropdownStyles.popup,
						"relative isolate data-[align-trigger=true]:w-(--anchor-width) data-[align-trigger=true]:animate-none",
						className
					)}
					{...props}
				>
					<SelectScrollUpButton />
					<SelectPrimitive.List>{children}</SelectPrimitive.List>
					<SelectScrollDownButton />
				</SelectPrimitive.Popup>
			</SelectPrimitive.Positioner>
		</SelectPrimitive.Portal>
	)
}

interface SelectLabelProps extends SelectPrimitive.GroupLabel.Props {
	inset?: boolean
}

function SelectLabel({ className, inset, ...props }: Readonly<SelectLabelProps>) {
	return (
		<SelectPrimitive.GroupLabel
			data-slot="select-label"
			data-inset={inset}
			className={cn(dropdownStyles.label, "data-inset:pl-8", className)}
			{...props}
		/>
	)
}

type SelectItemProps = SelectPrimitive.Item.Props

function SelectItem({
	className,
	children,
	...props
}: Readonly<SelectItemProps>) {
	return (
		<SelectPrimitive.Item
			data-slot="select-item"
			className={cn(
				dropdownStyles.selectableItem,
				"data-selected:bg-bg-selected data-selected:data-highlighted:bg-bg-selected-hovered data-selected:active:bg-bg-selected-pressed",
				className
			)}
			{...props}
		>
			<span className={dropdownStyles.indicator}>
				<SelectPrimitive.ItemIndicator>
					<Icon
						render={<CheckMarkIcon label="" size="small" />}
						label="Selected"
						className="text-text-selected"
					/>
				</SelectPrimitive.ItemIndicator>
			</span>
			<SelectPrimitive.ItemText className="flex flex-1 gap-2 shrink-0 whitespace-nowrap">
				{children}
			</SelectPrimitive.ItemText>
		</SelectPrimitive.Item>
	)
}

type SelectSeparatorProps = SelectPrimitive.Separator.Props

function SelectSeparator({
	className,
	...props
}: Readonly<SelectSeparatorProps>) {
	return (
		<SelectPrimitive.Separator
			data-slot="select-separator"
			className={cn(dropdownStyles.separator, "pointer-events-none", className)}
			{...props}
		/>
	)
}

type SelectScrollUpButtonProps = ComponentProps<typeof SelectPrimitive.ScrollUpArrow>

function SelectScrollUpButton({
	className,
	...props
}: Readonly<SelectScrollUpButtonProps>) {
	return (
		<SelectPrimitive.ScrollUpArrow
			data-slot="select-scroll-up-button"
			className={cn(
				"bg-popover z-10 flex cursor-default items-center justify-center py-1 [&_svg:not([class*='size-'])]:size-4 top-0 w-full",
				className
			)}
			{...props}
		>
			<ChevronUpIcon label="" size="small" spacing="none" />
		</SelectPrimitive.ScrollUpArrow>
	)
}

type SelectScrollDownButtonProps = ComponentProps<typeof SelectPrimitive.ScrollDownArrow>

function SelectScrollDownButton({
	className,
	...props
}: Readonly<SelectScrollDownButtonProps>) {
	return (
		<SelectPrimitive.ScrollDownArrow
			data-slot="select-scroll-down-button"
			className={cn(
				"bg-popover z-10 flex cursor-default items-center justify-center py-1 [&_svg:not([class*='size-'])]:size-4 bottom-0 w-full",
				className
			)}
			{...props}
		>
			<ChevronDownIcon label="" size="small" spacing="none" />
		</SelectPrimitive.ScrollDownArrow>
	)
}

export {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectScrollDownButton,
	SelectScrollUpButton,
	SelectSeparator,
	SelectTrigger,
	SelectValue,
	type SelectGroupProps,
	type SelectValueProps,
	type SelectTriggerProps,
	type SelectContentProps,
	type SelectLabelProps,
	type SelectItemProps,
	type SelectSeparatorProps,
	type SelectScrollUpButtonProps,
	type SelectScrollDownButtonProps,
}
