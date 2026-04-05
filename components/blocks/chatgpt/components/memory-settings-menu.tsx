"use client"

import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuLabel,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import {
	Item,
	ItemContent,
	ItemDescription,
	ItemTitle,
} from "@/components/ui/item"
import { SettingsIcon } from "@/components/ui/vpk-icons"

interface MemorySettingsMenuProps {
	memorySetting: "default" | "project-only";
	onMemorySettingChange: (value: "default" | "project-only") => void;
}

export function MemorySettingsMenu({ memorySetting, onMemorySettingChange }: Readonly<MemorySettingsMenuProps>) {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				render={<Button variant="ghost" size="icon" />}
			>
				<SettingsIcon />
				<span className="sr-only">Memory</span>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-72">
				<DropdownMenuGroup>
					<DropdownMenuRadioGroup
						value={memorySetting}
						onValueChange={(value) => {
							onMemorySettingChange(value as "default" | "project-only")
						}}
					>
						<DropdownMenuRadioItem value="default">
							<Item size="xs">
								<ItemContent>
									<ItemTitle>Default</ItemTitle>
									<ItemDescription className="text-xs">
										Project can access memories from outside chats, and
										vice versa.
									</ItemDescription>
								</ItemContent>
							</Item>
						</DropdownMenuRadioItem>
						<DropdownMenuRadioItem value="project-only">
							<Item size="xs">
								<ItemContent>
									<ItemTitle>Project Only</ItemTitle>
									<ItemDescription className="text-xs">
										Project can only access its own memories. Its
										memories are hidden from outside chats.
									</ItemDescription>
								</ItemContent>
							</Item>
						</DropdownMenuRadioItem>
					</DropdownMenuRadioGroup>
				</DropdownMenuGroup>
				<DropdownMenuSeparator />
				<DropdownMenuGroup>
					<DropdownMenuLabel>
						Note that this setting can&apos;t be changed later.
					</DropdownMenuLabel>
				</DropdownMenuGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	)
}
