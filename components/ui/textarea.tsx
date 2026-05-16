import * as React from "react"

import { cn } from "@/lib/utils"

export interface TextareaProps extends React.ComponentProps<"textarea"> {
	variant?: "default" | "subtle" | "none"
	isCompact?: boolean
	isMonospaced?: boolean
}

function Textarea({
	className,
	variant = "default",
	isCompact = false,
	isMonospaced = false,
	...props
}: Readonly<TextareaProps>) {
	return (
		<textarea
			data-slot="textarea"
			data-variant={variant}
			className={cn(
				"rounded-lg border border-transparent bg-transparent px-2.5 py-2 text-base transition-colors outline-none placeholder:text-muted-foreground md:text-sm flex field-sizing-content min-h-16 w-full",
				"focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-3",
				"aria-invalid:border-destructive aria-invalid:ring-destructive/20 aria-invalid:ring-3",
				"disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-(--opacity-disabled)",
				"read-only:cursor-text",
				"data-[variant=default]:border-input data-[variant=default]:bg-bg-input data-[variant=default]:hover:bg-bg-input-hovered data-[variant=default]:active:bg-bg-input-pressed data-[variant=default]:read-only:hover:border-input data-[variant=default]:read-only:hover:bg-bg-input",
				"data-[variant=subtle]:border-transparent data-[variant=subtle]:hover:bg-bg-input-hovered data-[variant=subtle]:active:bg-bg-input-pressed data-[variant=subtle]:focus-visible:bg-bg-input data-[variant=subtle]:read-only:hover:border-transparent data-[variant=subtle]:read-only:hover:bg-transparent",
				"data-[variant=none]:border-0 data-[variant=none]:hover:bg-transparent data-[variant=none]:active:bg-transparent",
				isCompact && "min-h-12 py-1.5",
				isMonospaced && "font-mono",
				className
			)}
			{...props}
		/>
	)
}

export { Textarea }
