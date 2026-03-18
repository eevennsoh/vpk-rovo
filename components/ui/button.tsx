"use client"

import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
	"focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 aria-invalid:border-destructive rounded-md border border-transparent bg-clip-padding text-sm font-medium focus-visible:ring-3 aria-invalid:ring-3 [&_svg:not([class*='size-'])]:size-4 inline-flex items-center justify-center whitespace-nowrap transition-all [&_svg]:pointer-events-none shrink-0 [&_svg]:shrink-0 outline-none group/button select-none",
	{
		variants: {
			variant: {
				default:
					"bg-primary text-primary-foreground hover:bg-primary-hovered active:bg-primary-pressed aria-pressed:bg-bg-selected aria-pressed:text-text-selected aria-pressed:border-border-selected aria-expanded:bg-bg-selected aria-expanded:text-text-selected aria-expanded:border-border-selected disabled:pointer-events-none disabled:bg-bg-disabled disabled:text-text-disabled",
				outline:
					"border-border bg-background text-text-subtle [&_svg]:text-icon-subtle hover:bg-surface-hovered active:bg-surface-pressed aria-pressed:bg-bg-selected aria-pressed:text-text-selected aria-pressed:border-border-selected aria-expanded:bg-bg-selected aria-expanded:text-text-selected aria-expanded:border-border-selected disabled:pointer-events-none disabled:opacity-(--opacity-disabled)",
				secondary:
					"bg-secondary text-text-subtle [&_svg]:text-icon-subtle hover:bg-secondary/80 active:bg-secondary/70 aria-pressed:bg-bg-selected aria-pressed:text-text-selected aria-pressed:border-border-selected aria-expanded:bg-bg-selected aria-expanded:text-text-selected aria-expanded:border-border-selected disabled:pointer-events-none disabled:opacity-(--opacity-disabled)",
				ghost:
					"text-text-subtle [&_svg]:text-icon-subtle hover:bg-bg-neutral-subtle-hovered active:bg-bg-neutral-subtle-pressed aria-pressed:bg-bg-selected aria-pressed:text-text-selected aria-pressed:border-border-selected aria-expanded:bg-bg-selected aria-expanded:text-text-selected aria-expanded:border-border-selected disabled:pointer-events-none disabled:opacity-(--opacity-disabled)",
				destructive:
					"bg-bg-danger text-text-danger hover:bg-bg-danger-hovered active:bg-bg-danger-pressed focus-visible:ring-destructive/20 focus-visible:border-border-danger aria-pressed:bg-bg-selected aria-pressed:text-text-selected aria-pressed:border-border-selected disabled:pointer-events-none disabled:opacity-(--opacity-disabled)",
				link: "text-primary underline-offset-4 hover:underline active:text-link-pressed disabled:pointer-events-none disabled:opacity-(--opacity-disabled)",
				warning:
					"bg-warning text-warning-foreground hover:bg-warning-hovered active:bg-warning-pressed aria-pressed:bg-bg-selected aria-pressed:text-text-selected aria-pressed:border-border-selected disabled:pointer-events-none disabled:bg-bg-disabled disabled:text-text-disabled",
				discovery:
					"bg-discovery text-discovery-foreground hover:bg-discovery-hovered active:bg-discovery-pressed aria-pressed:bg-bg-selected aria-pressed:text-text-selected aria-pressed:border-border-selected disabled:pointer-events-none disabled:bg-bg-disabled disabled:text-text-disabled",
			},
			size: {
				default:
					"h-8 gap-1.5 px-3 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
				xs: "h-6 gap-1 rounded-md px-2 text-xs in-data-[slot=button-group]:rounded-md has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
				sm: "h-7 gap-1 rounded-md px-3 text-[0.8rem] in-data-[slot=button-group]:rounded-md has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
				lg: "h-9 gap-1.5 px-3 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
				icon: "size-8",
				"icon-xs":
					"size-6 rounded-md in-data-[slot=button-group]:rounded-md [&_svg:not([class*='size-'])]:size-3",
				"icon-sm":
					"size-7 rounded-md in-data-[slot=button-group]:rounded-md",
				"icon-lg": "size-9",
			},
		},
		defaultVariants: {
			variant: "default",
			size: "default",
		},
	}
)

interface ButtonProps
	extends ButtonPrimitive.Props,
		VariantProps<typeof buttonVariants> {
	isLoading?: boolean
}

function Button({
	className,
	variant,
	size,
	isLoading = false,
	children,
	...props
}: Readonly<ButtonProps>) {
	return (
		<ButtonPrimitive
			data-slot="button"
			aria-busy={isLoading || undefined}
			className={cn(
				buttonVariants({ variant, size }),
				isLoading && "pointer-events-none opacity-(--opacity-loading)",
				className
			)}
			{...props}
		>
			{isLoading && <Spinner />}
			{children}
		</ButtonPrimitive>
	)
}

export { Button, buttonVariants, type ButtonProps }
