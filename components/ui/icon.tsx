import * as React from "react"

import { cn } from "@/lib/utils"

export interface IconProps extends React.ComponentProps<"span"> {
	render: React.ReactElement
	label?: string
}

function Icon({ className, render, label, ...props }: Readonly<IconProps>) {
	const isDecorative = props["aria-hidden"] === true || !label

	return (
		<span
			data-slot="icon"
			role={isDecorative ? undefined : "img"}
			aria-hidden={isDecorative ? true : undefined}
			aria-label={isDecorative ? undefined : label}
			className={cn("inline-flex items-center justify-center", className)}
			{...props}
		>
			{render}
		</span>
	)
}

export { Icon }
