import {
	cloneElement,
	isValidElement,
	type ReactElement,
	type ReactNode,
} from "react"
import { cva, type VariantProps } from "class-variance-authority"
import ChevronDownIcon from "@atlaskit/icon/core/chevron-down"

import { Icon } from "@/components/ui/icon"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"

const lozengeToneClasses = {
	neutral: "border-border-bold bg-bg-neutral text-text-subtle",
	success: "border-border-success bg-bg-success text-text-success",
	danger: "border-border-danger bg-bg-danger text-text-danger",
	information: "border-border-information bg-bg-information text-text-information",
	discovery: "border-border-discovery bg-bg-discovery text-text-discovery",
	warning: "border-border-warning bg-bg-warning text-text-warning",
	"accent-red":
		"border-red-200 bg-red-100 text-red-900 dark:border-red-500 dark:bg-red-900 dark:text-red-100",
	"accent-orange":
		"border-orange-200 bg-orange-100 text-orange-900 dark:border-orange-400 dark:bg-orange-900 dark:text-orange-100",
	"accent-yellow":
		"border-yellow-200 bg-yellow-100 text-yellow-900 dark:border-yellow-800 dark:bg-yellow-900 dark:text-yellow-100",
	"accent-lime":
		"border-lime-200 bg-lime-100 text-lime-900 dark:border-lime-400 dark:bg-lime-900 dark:text-lime-100",
	"accent-green":
		"border-green-200 bg-green-100 text-green-900 dark:border-green-500 dark:bg-green-800 dark:text-green-100",
	"accent-teal":
		"border-teal-200 bg-teal-100 text-teal-900 dark:border-teal-500 dark:bg-teal-800 dark:text-teal-100",
	"accent-blue":
		"border-blue-200 bg-blue-100 text-blue-900 dark:border-blue-500 dark:bg-blue-900 dark:text-blue-100",
	"accent-purple":
		"border-purple-200 bg-purple-100 text-purple-900 dark:border-purple-500 dark:bg-purple-900 dark:text-purple-100",
	"accent-magenta":
		"border-pink-200 bg-pink-100 text-pink-900 dark:border-pink-500 dark:bg-pink-900 dark:text-pink-100",
	"accent-gray":
		"border-neutral-200 bg-neutral-100 text-neutral-900 dark:border-neutral-500 dark:bg-neutral-900 dark:text-neutral-100",
} as const

const lozengeLeadingIconToneClasses = {
	neutral: "text-icon-subtle",
	success: "text-icon-success",
	danger: "text-icon-danger",
	information: "text-icon-information",
	discovery: "text-icon-discovery",
	warning: "text-icon-warning",
	"accent-red": "text-red-700 dark:text-red-400",
	"accent-orange": "text-orange-700 dark:text-orange-400",
	"accent-yellow": "text-yellow-700 dark:text-yellow-400",
	"accent-lime": "text-lime-700 dark:text-lime-400",
	"accent-green": "text-green-700 dark:text-green-400",
	"accent-teal": "text-teal-700 dark:text-teal-400",
	"accent-blue": "text-blue-700 dark:text-blue-400",
	"accent-purple": "text-purple-700 dark:text-purple-400",
	"accent-magenta": "text-pink-700 dark:text-pink-400",
	"accent-gray": "text-neutral-700 dark:text-neutral-300",
} as const

const lozengeTriggerToneClasses = {
	neutral:
		"border-border-bold bg-bg-neutral text-text-subtle hover:bg-bg-neutral-hovered active:bg-bg-neutral-pressed data-[selected=true]:bg-bg-neutral-hovered",
	success:
		"border-border-success bg-bg-success text-text-success hover:bg-bg-success-hovered active:bg-bg-success-pressed data-[selected=true]:bg-bg-success-hovered",
	danger:
		"border-border-danger bg-bg-danger text-text-danger hover:bg-bg-danger-hovered active:bg-bg-danger-pressed data-[selected=true]:bg-bg-danger-hovered",
	information:
		"border-border-information bg-bg-information text-text-information hover:bg-bg-information-hovered active:bg-bg-information-pressed data-[selected=true]:bg-bg-information-hovered",
	discovery:
		"border-border-discovery bg-bg-discovery text-text-discovery hover:bg-bg-discovery-hovered active:bg-bg-discovery-pressed data-[selected=true]:bg-bg-discovery-hovered",
	warning:
		"border-border-warning bg-bg-warning text-text-warning hover:bg-bg-warning-hovered active:bg-bg-warning-pressed data-[selected=true]:bg-bg-warning-hovered",
	"accent-red":
		"border-red-200 bg-red-100 text-red-900 hover:bg-red-200 active:bg-red-300 data-[selected=true]:bg-red-200 dark:border-red-500 dark:bg-red-900 dark:text-red-100 dark:hover:border-red-300 dark:hover:bg-red-700 dark:active:border-red-200 dark:active:bg-red-600 dark:data-[selected=true]:border-red-200 dark:data-[selected=true]:bg-red-600",
	"accent-orange":
		"border-orange-200 bg-orange-100 text-orange-900 hover:bg-orange-200 active:bg-orange-300 data-[selected=true]:bg-orange-200 dark:border-orange-400 dark:bg-orange-900 dark:text-orange-100 dark:hover:border-orange-200 dark:hover:bg-orange-700 dark:active:border-orange-100 dark:active:bg-orange-600 dark:data-[selected=true]:border-orange-100 dark:data-[selected=true]:bg-orange-600",
	"accent-yellow":
		"border-yellow-200 bg-yellow-100 text-yellow-900 hover:bg-yellow-200 active:bg-yellow-300 data-[selected=true]:bg-yellow-200 dark:border-yellow-800 dark:bg-yellow-900 dark:text-yellow-100 dark:hover:border-yellow-700 dark:hover:bg-yellow-800 dark:active:border-yellow-600 dark:active:bg-yellow-700 dark:data-[selected=true]:border-yellow-600 dark:data-[selected=true]:bg-yellow-700",
	"accent-lime":
		"border-lime-200 bg-lime-100 text-lime-900 hover:bg-lime-200 active:bg-lime-300 data-[selected=true]:bg-lime-200 dark:border-lime-400 dark:bg-lime-900 dark:text-lime-100 dark:hover:border-lime-300 dark:hover:bg-lime-700 dark:active:border-lime-200 dark:active:bg-lime-600 dark:data-[selected=true]:border-lime-200 dark:data-[selected=true]:bg-lime-600",
	"accent-green":
		"border-green-200 bg-green-100 text-green-900 hover:bg-green-200 active:bg-green-300 data-[selected=true]:bg-green-200 dark:border-green-500 dark:bg-green-800 dark:text-green-100 dark:hover:border-green-300 dark:hover:bg-green-700 dark:active:border-green-200 dark:active:bg-green-600 dark:data-[selected=true]:border-green-200 dark:data-[selected=true]:bg-green-600",
	"accent-teal":
		"border-teal-200 bg-teal-100 text-teal-900 hover:bg-teal-200 active:bg-teal-300 data-[selected=true]:bg-teal-200 dark:border-teal-500 dark:bg-teal-800 dark:text-teal-100 dark:hover:border-teal-300 dark:hover:bg-teal-700 dark:active:border-teal-200 dark:active:bg-teal-600 dark:data-[selected=true]:border-teal-200 dark:data-[selected=true]:bg-teal-600",
	"accent-blue":
		"border-blue-200 bg-blue-100 text-blue-900 hover:bg-blue-200 active:bg-blue-300 data-[selected=true]:bg-blue-200 dark:border-blue-500 dark:bg-blue-900 dark:text-blue-100 dark:hover:border-blue-300 dark:hover:bg-blue-700 dark:active:border-blue-200 dark:active:bg-blue-600 dark:data-[selected=true]:border-blue-200 dark:data-[selected=true]:bg-blue-600",
	"accent-purple":
		"border-purple-200 bg-purple-100 text-purple-900 hover:bg-purple-200 active:bg-purple-300 data-[selected=true]:bg-purple-200 dark:border-purple-500 dark:bg-purple-900 dark:text-purple-100 dark:hover:border-purple-300 dark:hover:bg-purple-700 dark:active:border-purple-200 dark:active:bg-purple-600 dark:data-[selected=true]:border-purple-200 dark:data-[selected=true]:bg-purple-600",
	"accent-magenta":
		"border-pink-200 bg-pink-100 text-pink-900 hover:bg-pink-200 active:bg-pink-300 data-[selected=true]:bg-pink-200 dark:border-pink-500 dark:bg-pink-900 dark:text-pink-100 dark:hover:border-pink-300 dark:hover:bg-pink-700 dark:active:border-pink-200 dark:active:bg-pink-600 dark:data-[selected=true]:border-pink-200 dark:data-[selected=true]:bg-pink-600",
	"accent-gray":
		"border-neutral-200 bg-neutral-100 text-neutral-900 hover:bg-neutral-200 active:bg-neutral-300 data-[selected=true]:bg-neutral-200 dark:border-neutral-500 dark:bg-neutral-900 dark:text-neutral-100 dark:hover:border-neutral-300 dark:hover:bg-neutral-700 dark:active:border-neutral-200 dark:active:bg-neutral-600 dark:data-[selected=true]:border-neutral-200 dark:data-[selected=true]:bg-neutral-600",
} as const

const lozengeVariants = cva(
	"inline-flex w-fit max-w-[200px] shrink-0 items-center overflow-hidden whitespace-nowrap border font-normal select-none",
	{
		variants: {
			variant: lozengeToneClasses,
			size: {
				compact: "h-5 rounded-sm px-1 py-0.5 text-xs leading-4",
				spacious: "h-8 rounded-md px-3 py-1 text-sm leading-5",
			},
			// ADS now renders the filled visual by default, but the prop remains for compatibility.
			isBold: {
				true: "",
				false: "",
			},
		},
		defaultVariants: {
			variant: "neutral",
			size: "compact",
			isBold: false,
		},
	}
)

const lozengeTriggerVariants = cva(
	"inline-flex w-fit max-w-[200px] shrink-0 items-center overflow-hidden whitespace-nowrap border font-normal select-none outline-none transition-[background-color,border-color,color,opacity] duration-200 ease-out focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-3 disabled:pointer-events-none disabled:opacity-(--opacity-disabled)",
	{
		variants: {
			variant: lozengeTriggerToneClasses,
			size: {
				compact: "h-5 rounded-sm px-1 py-0.5 text-xs leading-4",
				spacious: "h-8 rounded-md px-3 py-1 text-sm leading-5",
			},
			isBold: {
				true: "",
				false: "",
			},
		},
		defaultVariants: {
			variant: "neutral",
			size: "compact",
			isBold: false,
		},
	}
)

type LozengeVariant = NonNullable<VariantProps<typeof lozengeVariants>["variant"]>
type LozengeSize = NonNullable<VariantProps<typeof lozengeVariants>["size"]>

function renderLozengeIcon(icon: ReactNode) {
	if (!isValidElement(icon)) {
		return icon
	}

	const iconElement = icon as ReactElement<{ className?: string }>

	if (iconElement.type === Icon) {
		return cloneElement(iconElement as ReactElement<React.ComponentProps<typeof Icon>>, {
			className: cn("leading-none", iconElement.props.className),
		})
	}

	return (
		<Icon
			render={iconElement}
			aria-hidden
			className="leading-none"
		/>
	)
}

function LozengeContent({
	variant,
	size,
	icon,
	metric,
	children,
	trailing,
}: Readonly<{
	variant: LozengeVariant
	size: LozengeSize
	icon?: ReactNode
	metric?: string | number
	children?: ReactNode
	trailing?: ReactNode
}>) {
	return (
		<span
			className={cn(
				"flex min-w-0 items-center",
				size === "compact" ? "gap-1" : "gap-1.5"
			)}
		>
			{icon != null ? (
				<span
					data-slot="lozenge-leading-icon"
					className={cn(
						"inline-flex shrink-0 self-center items-center justify-center leading-none",
						lozengeLeadingIconToneClasses[variant]
					)}
				>
					{renderLozengeIcon(icon)}
				</span>
			) : null}
			{children != null ? <span className="truncate">{children}</span> : null}
			{metric != null ? <span className="shrink-0">{metric}</span> : null}
			{trailing}
		</span>
	)
}

export interface LozengeProps
	extends React.ComponentProps<"span">,
		VariantProps<typeof lozengeVariants> {
	maxWidth?: string | number
	icon?: ReactNode
	metric?: string | number
}

function Lozenge({
	className,
	variant = "neutral",
	size = "compact",
	isBold = false,
	maxWidth,
	icon,
	metric,
	children,
	style,
	...props
}: Readonly<LozengeProps>) {
	const resolvedVariant = variant ?? "neutral"
	const resolvedSize = size ?? "compact"

	return (
		<span
			data-slot="lozenge"
			data-variant={resolvedVariant}
			data-size={resolvedSize}
			className={cn(
				lozengeVariants({ variant: resolvedVariant, size: resolvedSize, isBold }),
				metric != null && resolvedSize === "compact" && "pr-px",
				className
			)}
			style={maxWidth != null ? { ...style, maxWidth } : style}
			{...props}
		>
			<LozengeContent
				variant={resolvedVariant}
				size={resolvedSize}
				icon={icon}
				metric={metric}
			>
				{children}
			</LozengeContent>
		</span>
	)
}

export interface LozengeDropdownTriggerProps
	extends React.ComponentProps<"button">,
		VariantProps<typeof lozengeTriggerVariants> {
	icon?: ReactNode
	isLoading?: boolean
	isSelected?: boolean
	maxWidth?: string | number
	metric?: string | number
}

function LozengeDropdownTrigger({
	className,
	variant = "neutral",
	size = "compact",
	isBold = false,
	icon,
	isLoading = false,
	isSelected,
	maxWidth,
	metric,
	children,
	style,
	disabled,
	"aria-expanded": ariaExpanded,
	...props
}: Readonly<LozengeDropdownTriggerProps>) {
	const resolvedVariant = variant ?? "neutral"
	const resolvedSize = size ?? "compact"
	const isOpen = isSelected || ariaExpanded === true || ariaExpanded === "true"

	return (
		<button
			type="button"
			data-slot="lozenge-dropdown-trigger"
			data-variant={resolvedVariant}
			data-size={resolvedSize}
			data-selected={isOpen ? "true" : undefined}
			aria-busy={isLoading || undefined}
			aria-expanded={ariaExpanded}
			disabled={disabled || isLoading}
			className={cn(
				lozengeTriggerVariants({ variant: resolvedVariant, size: resolvedSize, isBold }),
				isLoading && "opacity-(--opacity-loading)",
				metric != null && resolvedSize === "compact" && "pr-px",
				className
			)}
			style={maxWidth != null ? { ...style, maxWidth } : style}
			{...props}
		>
			<LozengeContent
				variant={resolvedVariant}
				size={resolvedSize}
				icon={icon}
				metric={metric}
				trailing={
					isLoading ? (
						<Spinner
							className="shrink-0 text-current"
							label="Loading"
							size={resolvedSize === "compact" ? "xs" : "sm"}
						/>
					) : (
						<Icon
							render={<ChevronDownIcon label="" size="small" />}
							aria-hidden
							className="shrink-0 text-current"
						/>
					)
				}
			>
				{children}
			</LozengeContent>
		</button>
	)
}

export {
	Lozenge,
	LozengeDropdownTrigger,
	lozengeVariants,
}
