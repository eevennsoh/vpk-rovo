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
	neutral: "border-border-bold bg-bg-neutral text-text",
	success: "border-border-success bg-bg-success-subtler text-text-success-bolder",
	danger: "border-border-danger bg-bg-danger-subtler text-text-danger-bolder",
	information: "border-border-information bg-bg-information-subtler text-text-information-bolder",
	discovery: "border-border-discovery bg-bg-discovery-subtler text-text-discovery-bolder",
	warning: "border-border-warning bg-bg-warning-subtler text-text-warning-bolder",
	"accent-red":
		"border-border-accent-red bg-bg-accent-red-subtler text-text-accent-red-bolder",
	"accent-orange":
		"border-border-accent-orange bg-bg-accent-orange-subtler text-text-accent-orange-bolder",
	"accent-yellow":
		"border-border-accent-yellow bg-bg-accent-yellow-subtler text-text-accent-yellow-bolder",
	"accent-lime":
		"border-border-accent-lime bg-bg-accent-lime-subtler text-text-accent-lime-bolder",
	"accent-green":
		"border-border-accent-green bg-bg-accent-green-subtler text-text-accent-green-bolder",
	"accent-teal":
		"border-border-accent-teal bg-bg-accent-teal-subtler text-text-accent-teal-bolder",
	"accent-blue":
		"border-border-accent-blue bg-bg-accent-blue-subtler text-text-accent-blue-bolder",
	"accent-purple":
		"border-border-accent-purple bg-bg-accent-purple-subtler text-text-accent-purple-bolder",
	"accent-magenta":
		"border-border-accent-magenta bg-bg-accent-magenta-subtler text-text-accent-magenta-bolder",
	"accent-gray":
		"border-border-accent-gray bg-bg-accent-gray-subtlest text-text-accent-gray-bolder",
} as const

const lozengeLeadingIconToneClasses = {
	neutral: "text-icon-subtlest",
	success: "text-icon-success",
	danger: "text-icon-danger",
	information: "text-icon-information",
	discovery: "text-icon-discovery",
	warning: "text-icon-warning",
	"accent-red": "text-icon-accent-red",
	"accent-orange": "text-icon-accent-orange",
	"accent-yellow": "text-icon-accent-yellow",
	"accent-lime": "text-icon-accent-lime",
	"accent-green": "text-icon-accent-green",
	"accent-teal": "text-icon-accent-teal",
	"accent-blue": "text-icon-accent-blue",
	"accent-purple": "text-icon-accent-purple",
	"accent-magenta": "text-icon-accent-magenta",
	"accent-gray": "text-icon-accent-gray",
} as const

const lozengeTriggerToneClasses = {
	neutral:
		"border-border-bold bg-bg-neutral text-text hover:bg-bg-neutral-hovered active:bg-bg-neutral-pressed data-[selected=true]:bg-bg-neutral-pressed",
	success:
		"border-border-success bg-bg-success-subtler text-text-success-bolder hover:bg-bg-success-subtler-hovered active:bg-bg-success-subtler-pressed data-[selected=true]:bg-bg-success-subtler-pressed",
	danger:
		"border-border-danger bg-bg-danger-subtler text-text-danger-bolder hover:bg-bg-danger-subtler-hovered active:bg-bg-danger-subtler-pressed data-[selected=true]:bg-bg-danger-subtler-pressed",
	information:
		"border-border-information bg-bg-information-subtler text-text-information-bolder hover:bg-bg-information-subtler-hovered active:bg-bg-information-subtler-pressed data-[selected=true]:bg-bg-information-subtler-pressed",
	discovery:
		"border-border-discovery bg-bg-discovery-subtler text-text-discovery-bolder hover:bg-bg-discovery-subtler-hovered active:bg-bg-discovery-subtler-pressed data-[selected=true]:bg-bg-discovery-subtler-pressed",
	warning:
		"border-border-warning bg-bg-warning-subtler text-text-warning-bolder hover:bg-bg-warning-subtler-hovered active:bg-bg-warning-subtler-pressed data-[selected=true]:bg-bg-warning-subtler-pressed",
	"accent-red":
		"border-border-accent-red bg-bg-accent-red-subtler text-text-accent-red-bolder hover:bg-bg-accent-red-subtler-hovered active:bg-bg-accent-red-subtler-pressed data-[selected=true]:bg-bg-accent-red-subtler-pressed",
	"accent-orange":
		"border-border-accent-orange bg-bg-accent-orange-subtler text-text-accent-orange-bolder hover:bg-bg-accent-orange-subtler-hovered active:bg-bg-accent-orange-subtler-pressed data-[selected=true]:bg-bg-accent-orange-subtler-pressed",
	"accent-yellow":
		"border-border-accent-yellow bg-bg-accent-yellow-subtler text-text-accent-yellow-bolder hover:bg-bg-accent-yellow-subtler-hovered active:bg-bg-accent-yellow-subtler-pressed data-[selected=true]:bg-bg-accent-yellow-subtler-pressed",
	"accent-lime":
		"border-border-accent-lime bg-bg-accent-lime-subtler text-text-accent-lime-bolder hover:bg-bg-accent-lime-subtler-hovered active:bg-bg-accent-lime-subtler-pressed data-[selected=true]:bg-bg-accent-lime-subtler-pressed",
	"accent-green":
		"border-border-accent-green bg-bg-accent-green-subtler text-text-accent-green-bolder hover:bg-bg-accent-green-subtler-hovered active:bg-bg-accent-green-subtler-pressed data-[selected=true]:bg-bg-accent-green-subtler-pressed",
	"accent-teal":
		"border-border-accent-teal bg-bg-accent-teal-subtler text-text-accent-teal-bolder hover:bg-bg-accent-teal-subtler-hovered active:bg-bg-accent-teal-subtler-pressed data-[selected=true]:bg-bg-accent-teal-subtler-pressed",
	"accent-blue":
		"border-border-accent-blue bg-bg-accent-blue-subtler text-text-accent-blue-bolder hover:bg-bg-accent-blue-subtler-hovered active:bg-bg-accent-blue-subtler-pressed data-[selected=true]:bg-bg-accent-blue-subtler-pressed",
	"accent-purple":
		"border-border-accent-purple bg-bg-accent-purple-subtler text-text-accent-purple-bolder hover:bg-bg-accent-purple-subtler-hovered active:bg-bg-accent-purple-subtler-pressed data-[selected=true]:bg-bg-accent-purple-subtler-pressed",
	"accent-magenta":
		"border-border-accent-magenta bg-bg-accent-magenta-subtler text-text-accent-magenta-bolder hover:bg-bg-accent-magenta-subtler-hovered active:bg-bg-accent-magenta-subtler-pressed data-[selected=true]:bg-bg-accent-magenta-subtler-pressed",
	"accent-gray":
		"border-border-accent-gray bg-bg-accent-gray-subtlest text-text-accent-gray-bolder hover:bg-bg-accent-gray-subtlest-hovered active:bg-bg-accent-gray-subtlest-pressed data-[selected=true]:bg-bg-accent-gray-subtlest-pressed",
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
