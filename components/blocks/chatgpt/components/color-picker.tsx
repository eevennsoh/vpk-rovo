"use client"

import type { CSSProperties } from "react"

import { Button } from "@/components/ui/button"
import {
	InputGroupButton,
} from "@/components/ui/input-group"
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover"
import { FolderIcon } from "@/components/ui/vpk-icons"
import { FOLDER_COLORS } from "../data/categories"

interface ColorPickerProps {
	selectedColor: string | null;
	onColorChange: (color: string) => void;
}

export function ColorPicker({ selectedColor, onColorChange }: Readonly<ColorPickerProps>) {
	return (
		<Popover>
			<PopoverTrigger
				render={
					<InputGroupButton variant="ghost" size="icon-xs" />
				}
			>
				<FolderIcon style={
					{ "--color": selectedColor } as CSSProperties
				} className="text-(--color)" />
			</PopoverTrigger>
			<PopoverContent align="start" className="w-60 p-3">
				<div className="flex flex-wrap gap-2">
					{FOLDER_COLORS.map((color) => (
						<Button
							key={color}
							size="icon"
							variant="ghost"
							className="rounded-full p-1"
							style={{ "--color": color } as CSSProperties}
							data-checked={selectedColor === color}
							onClick={() => {
								onColorChange(color)
							}}
						>
							<span className="group-data-[checked=true]/button:ring-offset-background size-5 rounded-full bg-(--color) ring-2 ring-transparent ring-offset-2 ring-offset-(--color) group-data-[checked=true]/button:ring-(--color)" />
							<span className="sr-only">{color}</span>
						</Button>
					))}
				</div>
			</PopoverContent>
		</Popover>
	)
}
