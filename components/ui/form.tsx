import * as React from "react"

import { cn } from "@/lib/utils"

export type FormProps = React.ComponentProps<"form">

function Form({ className, ...props }: Readonly<FormProps>) {
	return (
		<form
			data-slot="form"
			className={cn("flex flex-col gap-3", className)}
			{...props}
		/>
	)
}

export { Form }
export {
	Field,
	FieldContent,
	FieldDescription,
	FieldError,
	FieldGroup,
	FieldLabel,
	FieldLegend,
	FieldSeparator,
	FieldSet,
	FieldTitle,
} from "@/components/ui/field"
