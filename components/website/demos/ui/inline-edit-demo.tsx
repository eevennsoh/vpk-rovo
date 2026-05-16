"use client"

import { useState } from "react"
import { InlineEdit } from "@/components/ui/inline-edit"

export default function InlineEditDemo() {
	const [description, setDescription] = useState(
		"Capture RFP requirements, buyer priorities, win themes, and response notes for the account team."
	)

	return (
		<div className="mx-auto w-full max-w-xl">
			<InlineEdit
				label="Description"
				value={description}
				placeholder="Add RFP requirements, buyer priorities, win themes, and response notes"
				onConfirm={setDescription}
				editButtonLabel="Edit description"
				inputProps={{ id: "inline-edit-rfp-description" }}
				textareaProps={{ variant: "subtle", rows: 4 }}
				readViewClassName="border-transparent bg-transparent hover:bg-bg-input-hovered active:bg-bg-input-pressed"
				className="min-w-0"
				multiline
			/>
		</div>
	)
}

export function InlineEditDemoDefault() {
	const [value, setValue] = useState("Editable text")
	return (
		<div className="w-full">
			<InlineEdit label="Summary" value={value} onConfirm={setValue} />
		</div>
	)
}

export function InlineEditDemoWithPlaceholder() {
	const [value, setValue] = useState("")
	return (
		<div className="w-full">
			<InlineEdit
				label="Description"
				value={value}
				onConfirm={setValue}
				placeholder="Add a description..."
				isRequired
			/>
		</div>
	)
}

export function InlineEditDemoMultiple() {
	const [title, setTitle] = useState("Project alpha")
	const [description, setDescription] = useState("A prototype project")
	return (
		<div className="flex w-full flex-col gap-3">
			<InlineEdit label="Title" value={title} onConfirm={setTitle} />
			<InlineEdit label="Description" value={description} onConfirm={setDescription} />
		</div>
	)
}

export function InlineEditDemoWithCancel() {
	const [value, setValue] = useState("Try editing and cancelling")
	return (
		<div className="w-full">
			<InlineEdit
				label="Description"
				value={value}
				onConfirm={setValue}
				onCancel={() => {
					// onCancel fires when user clicks Cancel
				}}
			/>
		</div>
	)
}

export function InlineEditDemoValidation() {
	const [value, setValue] = useState("")
	return (
		<div className="w-full">
			<InlineEdit
				label="Team name"
				value={value}
				placeholder="Add a name..."
				onConfirm={setValue}
				isRequired
				validate={(nextValue) => {
					if (nextValue.length > 25) {
						return "Keep this under 25 characters."
					}
					return undefined
				}}
			/>
		</div>
	)
}
