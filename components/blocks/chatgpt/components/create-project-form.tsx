"use client"

import { useState } from "react"

import { Example } from "@/components/example"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import {
	Card,
	CardAction,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card"
import {
	Field,
	FieldDescription,
	FieldGroup,
	FieldLabel,
} from "@/components/ui/field"
import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
} from "@/components/ui/input-group"
import {
	CircleCheckIcon,
	LightbulbIcon,
} from "@/components/ui/vpk-icons"
import { CATEGORIES } from "../data/categories"
import { MemorySettingsMenu } from "./memory-settings-menu"
import { ColorPicker } from "./color-picker"

export function CreateProjectForm() {
	const [projectName, setProjectName] = useState("")
	const [selectedCategory, setSelectedCategory] = useState<string | null>(
		CATEGORIES[0].id
	)
	const [memorySetting, setMemorySetting] = useState<
		"default" | "project-only"
	>("default")
	const [selectedColor, setSelectedColor] = useState<string | null>(
		"var(--foreground)"
	)

	return (
		<Example title="Create Project" className="items-center justify-center">
			<Card className="w-full max-w-sm">
				<CardHeader>
					<CardTitle>Create Project</CardTitle>
					<CardDescription>
						Start a new project to keep chats, files, and custom instructions in
						one place.
					</CardDescription>
					<CardAction>
						<MemorySettingsMenu
							memorySetting={memorySetting}
							onMemorySettingChange={setMemorySetting}
						/>
					</CardAction>
				</CardHeader>
				<CardContent>
					<FieldGroup>
						<Field>
							<FieldLabel htmlFor="project-name" className="sr-only">
								Project Name
							</FieldLabel>
							<InputGroup>
								<InputGroupInput
									id="project-name"
									placeholder="Copenhagen Trip"
									value={projectName}
									onChange={(e) => {
										setProjectName(e.target.value)
									}}
								/>
								<InputGroupAddon>
									<ColorPicker
										selectedColor={selectedColor}
										onColorChange={setSelectedColor}
									/>
								</InputGroupAddon>
							</InputGroup>
							<FieldDescription className="flex flex-wrap gap-2">
								{CATEGORIES.map((category) => (
									<Badge
										key={category.id}
										variant={
											selectedCategory === category.id ? "default" : "outline"
										}
										data-checked={selectedCategory === category.id}
										render={
											<button
												onClick={() => {
													setSelectedCategory(
														selectedCategory === category.id
															? null
															: category.id
													)
												}}
											/>
										}
									>
										<CircleCheckIcon data-icon="inline-start" className="hidden group-data-[checked=true]/badge:inline" />
										{category.label}
									</Badge>
								))}
							</FieldDescription>
						</Field>
						<Field>
							<Alert className="bg-muted">
								<LightbulbIcon />
								<AlertDescription className="text-xs">
									Projects keep chats, files, and custom instructions in one
									place. Use them for ongoing work, or just to keep things tidy.
								</AlertDescription>
							</Alert>
						</Field>
					</FieldGroup>
				</CardContent>
			</Card>
		</Example>
	)
}
