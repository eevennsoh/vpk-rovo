"use client"

import * as React from "react"

import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select"

export interface TimePickerProps {
	value?: string
	onChange?: (value: string) => void
	placeholder?: string
	stepMinutes?: 15 | 30 | 60
	disabled?: boolean
	/** Positioner stacking class for the time list. Raise above nested popovers. */
	contentPositionerClassName?: string
}

function buildTimeOptions(stepMinutes: TimePickerProps["stepMinutes"]) {
	const step = stepMinutes ?? 30
	const options: string[] = []
	for (let minutes = 0; minutes < 24 * 60; minutes += step) {
		const hour = Math.floor(minutes / 60)
		const minute = minutes % 60
		options.push(`${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`)
	}
	return options
}

function TimePicker({
	value,
	onChange,
	placeholder = "Select time",
	stepMinutes = 30,
	disabled,
	contentPositionerClassName,
}: Readonly<TimePickerProps>) {
	const options = React.useMemo(() => buildTimeOptions(stepMinutes), [stepMinutes])

	return (
		<Select
			data-slot="time-picker"
			value={value ?? ""}
			onValueChange={(nextValue) => {
				if (nextValue !== null) {
					onChange?.(nextValue)
				}
			}}
			disabled={disabled}
		>
			<SelectTrigger className="min-w-32">
				<SelectValue placeholder={placeholder} />
			</SelectTrigger>
			<SelectContent positionerClassName={contentPositionerClassName}>
				{options.map((option) => (
					<SelectItem key={option} value={option}>
						{option}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	)
}

export { TimePicker }
