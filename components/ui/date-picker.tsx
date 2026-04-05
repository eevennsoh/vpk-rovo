"use client"

import * as React from "react"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

export interface DatePickerProps {
	value?: Date
	onChange?: (value: Date | undefined) => void
	placeholder?: string
	className?: string
	disabled?: boolean
}

function DatePicker({
	value,
	onChange,
	placeholder = "Select date",
	className,
	disabled,
}: Readonly<DatePickerProps>) {
	const [open, setOpen] = React.useState(false)

	const label = value
		? new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(value)
		: placeholder

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger
				render={
					<Button
						data-slot="date-picker"
						variant="outline"
						disabled={disabled}
						className={cn("min-w-40 justify-start text-left", className)}
					/>
				}
			>
				{label}
			</PopoverTrigger>
			<PopoverContent className="w-auto p-2">
				<Calendar
					mode="single"
					selected={value}
					onSelect={(nextValue) => {
						onChange?.(nextValue)
						setOpen(false)
					}}
				/>
			</PopoverContent>
		</Popover>
	)
}

export { DatePicker }
