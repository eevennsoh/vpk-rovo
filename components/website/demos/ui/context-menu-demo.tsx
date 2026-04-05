"use client";

import { useState } from "react";
import { ArchiveIcon, ClipboardPasteIcon, CopyIcon, PencilIcon, ScissorsIcon, ShareIcon, TrashIcon } from "@/components/ui/vpk-icons";
import { Button } from "@/components/ui/button";
import { ContextMenu, ContextMenuCheckboxItem, ContextMenuContent, ContextMenuGroup, ContextMenuItem, ContextMenuLabel, ContextMenuRadioGroup, ContextMenuRadioItem, ContextMenuSeparator, ContextMenuShortcut, ContextMenuSub, ContextMenuSubContent, ContextMenuSubTrigger, ContextMenuTrigger } from "@/components/ui/context-menu";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function ContextMenuDemo() {
	return (
		<ContextMenu>
			<ContextMenuTrigger>
				<div className="flex h-16 w-48 items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
					Right click here
				</div>
			</ContextMenuTrigger>
			<ContextMenuContent>
				<ContextMenuItem>Cut</ContextMenuItem>
				<ContextMenuItem>Copy</ContextMenuItem>
				<ContextMenuSeparator />
				<ContextMenuItem>Paste</ContextMenuItem>
			</ContextMenuContent>
		</ContextMenu>
	);
}

export function ContextMenuDemoBasic() {
	return (
		<ContextMenu>
			<ContextMenuTrigger className="flex aspect-[2/0.5] w-full items-center justify-center rounded-lg border text-sm">
				Right click here
			</ContextMenuTrigger>
			<ContextMenuContent>
				<ContextMenuGroup>
					<ContextMenuItem>Back</ContextMenuItem>
					<ContextMenuItem disabled>Forward</ContextMenuItem>
					<ContextMenuItem>Reload</ContextMenuItem>
				</ContextMenuGroup>
			</ContextMenuContent>
		</ContextMenu>
	);
}

export function ContextMenuDemoDefault() {
	return (
		<ContextMenu>
			<ContextMenuTrigger className="flex h-32 w-64 items-center justify-center rounded-lg border border-dashed p-8 text-sm text-muted-foreground">
				Right-click here
			</ContextMenuTrigger>
			<ContextMenuContent>
				<ContextMenuItem>Cut</ContextMenuItem>
				<ContextMenuItem>Copy</ContextMenuItem>
				<ContextMenuItem>Paste</ContextMenuItem>
			</ContextMenuContent>
		</ContextMenu>
	);
}

export function ContextMenuDemoInDialog() {
	return (
		<Dialog>
			<DialogTrigger render={<Button variant="outline" />}>
				Open Dialog
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Context Menu Demo</DialogTitle>
					<DialogDescription>
						Right click on the area below to see the context menu.
					</DialogDescription>
				</DialogHeader>
				<ContextMenu>
					<ContextMenuTrigger className="flex aspect-[2/0.5] w-full items-center justify-center rounded-lg border text-sm">
						Right click here
					</ContextMenuTrigger>
					<ContextMenuContent>
						<ContextMenuGroup>
							<ContextMenuItem>
								<CopyIcon />
								Copy
							</ContextMenuItem>
							<ContextMenuItem>
								<ScissorsIcon />
								Cut
							</ContextMenuItem>
							<ContextMenuItem>
								<ClipboardPasteIcon />
								Paste
							</ContextMenuItem>
						</ContextMenuGroup>
						<ContextMenuSeparator />
						<ContextMenuSub>
							<ContextMenuSubTrigger>More Options</ContextMenuSubTrigger>
							<ContextMenuSubContent>
								<ContextMenuGroup>
									<ContextMenuItem>Save Page...</ContextMenuItem>
									<ContextMenuItem>Create Shortcut...</ContextMenuItem>
									<ContextMenuItem>Name Window...</ContextMenuItem>
								</ContextMenuGroup>
								<ContextMenuSeparator />
								<ContextMenuGroup>
									<ContextMenuItem>Developer Tools</ContextMenuItem>
								</ContextMenuGroup>
							</ContextMenuSubContent>
						</ContextMenuSub>
						<ContextMenuSeparator />
						<ContextMenuGroup>
							<ContextMenuItem variant="destructive">
								<TrashIcon />
								Delete
							</ContextMenuItem>
						</ContextMenuGroup>
					</ContextMenuContent>
				</ContextMenu>
			</DialogContent>
		</Dialog>
	);
}

export function ContextMenuDemoWithCheckboxes() {
	return (
		<ContextMenu>
			<ContextMenuTrigger className="flex aspect-[2/0.5] w-full items-center justify-center rounded-lg border text-sm">
				Right click here
			</ContextMenuTrigger>
			<ContextMenuContent>
				<ContextMenuGroup>
					<ContextMenuCheckboxItem defaultChecked>
						Show Bookmarks Bar
					</ContextMenuCheckboxItem>
					<ContextMenuCheckboxItem>Show Full URLs</ContextMenuCheckboxItem>
					<ContextMenuCheckboxItem defaultChecked>
						Show Developer Tools
					</ContextMenuCheckboxItem>
				</ContextMenuGroup>
			</ContextMenuContent>
		</ContextMenu>
	);
}

export function ContextMenuDemoWithDestructiveItems() {
	return (
		<ContextMenu>
			<ContextMenuTrigger className="flex aspect-[2/0.5] w-full items-center justify-center rounded-lg border text-sm">
				Right click here
			</ContextMenuTrigger>
			<ContextMenuContent>
				<ContextMenuGroup>
					<ContextMenuItem>
						<PencilIcon />
						Edit
					</ContextMenuItem>
					<ContextMenuItem>
						<ShareIcon />
						Share
					</ContextMenuItem>
				</ContextMenuGroup>
				<ContextMenuSeparator />
				<ContextMenuGroup>
					<ContextMenuItem>
						<ArchiveIcon />
						Archive
					</ContextMenuItem>
					<ContextMenuItem variant="destructive">
						<TrashIcon />
						Delete
					</ContextMenuItem>
				</ContextMenuGroup>
			</ContextMenuContent>
		</ContextMenu>
	);
}

export function ContextMenuDemoWithGroupsLabelsSeparators() {
	return (
		<ContextMenu>
			<ContextMenuTrigger className="flex aspect-[2/0.5] w-full items-center justify-center rounded-lg border text-sm">
				Right click here
			</ContextMenuTrigger>
			<ContextMenuContent>
				<ContextMenuGroup>
					<ContextMenuLabel>File</ContextMenuLabel>
					<ContextMenuItem>
						New File
						<ContextMenuShortcut>⌘N</ContextMenuShortcut>
					</ContextMenuItem>
					<ContextMenuItem>
						Open File
						<ContextMenuShortcut>⌘O</ContextMenuShortcut>
					</ContextMenuItem>
					<ContextMenuItem>
						Save
						<ContextMenuShortcut>⌘S</ContextMenuShortcut>
					</ContextMenuItem>
				</ContextMenuGroup>
				<ContextMenuSeparator />
				<ContextMenuGroup>
					<ContextMenuLabel>Edit</ContextMenuLabel>
					<ContextMenuItem>
						Undo
						<ContextMenuShortcut>⌘Z</ContextMenuShortcut>
					</ContextMenuItem>
					<ContextMenuItem>
						Redo
						<ContextMenuShortcut>⇧⌘Z</ContextMenuShortcut>
					</ContextMenuItem>
				</ContextMenuGroup>
				<ContextMenuSeparator />
				<ContextMenuGroup>
					<ContextMenuItem>
						Cut
						<ContextMenuShortcut>⌘X</ContextMenuShortcut>
					</ContextMenuItem>
					<ContextMenuItem>
						Copy
						<ContextMenuShortcut>⌘C</ContextMenuShortcut>
					</ContextMenuItem>
					<ContextMenuItem>
						Paste
						<ContextMenuShortcut>⌘V</ContextMenuShortcut>
					</ContextMenuItem>
				</ContextMenuGroup>
				<ContextMenuSeparator />
				<ContextMenuGroup>
					<ContextMenuItem variant="destructive">
						Delete
						<ContextMenuShortcut>⌫</ContextMenuShortcut>
					</ContextMenuItem>
				</ContextMenuGroup>
			</ContextMenuContent>
		</ContextMenu>
	);
}

export function ContextMenuDemoWithIcons() {
	return (
		<ContextMenu>
			<ContextMenuTrigger className="flex aspect-[2/0.5] w-full items-center justify-center rounded-lg border text-sm">
				Right click here
			</ContextMenuTrigger>
			<ContextMenuContent>
				<ContextMenuGroup>
					<ContextMenuItem>
						<CopyIcon />
						Copy
					</ContextMenuItem>
					<ContextMenuItem>
						<ScissorsIcon />
						Cut
					</ContextMenuItem>
					<ContextMenuItem>
						<ClipboardPasteIcon />
						Paste
					</ContextMenuItem>
				</ContextMenuGroup>
				<ContextMenuSeparator />
				<ContextMenuGroup>
					<ContextMenuItem variant="destructive">
						<TrashIcon />
						Delete
					</ContextMenuItem>
				</ContextMenuGroup>
			</ContextMenuContent>
		</ContextMenu>
	);
}

export function ContextMenuDemoWithInset() {
	const [showBookmarks, setShowBookmarks] = useState(true);
	const [showUrls, setShowUrls] = useState(false);
	const [theme, setTheme] = useState("system");

	return (
		<ContextMenu>
			<ContextMenuTrigger className="flex aspect-[2/0.5] w-full items-center justify-center rounded-lg border text-sm">
				Right click here
			</ContextMenuTrigger>
			<ContextMenuContent className="w-44">
				<ContextMenuGroup>
					<ContextMenuLabel>Actions</ContextMenuLabel>
					<ContextMenuItem>
						<CopyIcon />
						Copy
					</ContextMenuItem>
					<ContextMenuItem>
						<ScissorsIcon />
						Cut
					</ContextMenuItem>
					<ContextMenuItem inset>Paste</ContextMenuItem>
				</ContextMenuGroup>
				<ContextMenuSeparator />
				<ContextMenuGroup>
					<ContextMenuLabel inset>Appearance</ContextMenuLabel>
					<ContextMenuCheckboxItem
						inset
						checked={showBookmarks}
						onCheckedChange={setShowBookmarks}
					>
						Bookmarks
					</ContextMenuCheckboxItem>
					<ContextMenuCheckboxItem
						inset
						checked={showUrls}
						onCheckedChange={setShowUrls}
					>
						Full URLs
					</ContextMenuCheckboxItem>
				</ContextMenuGroup>
				<ContextMenuSeparator />
				<ContextMenuGroup>
					<ContextMenuLabel inset>Theme</ContextMenuLabel>
					<ContextMenuRadioGroup value={theme} onValueChange={setTheme}>
						<ContextMenuRadioItem inset value="light">
							Light
						</ContextMenuRadioItem>
						<ContextMenuRadioItem inset value="dark">
							Dark
						</ContextMenuRadioItem>
						<ContextMenuRadioItem inset value="system">
							System
						</ContextMenuRadioItem>
					</ContextMenuRadioGroup>
				</ContextMenuGroup>
				<ContextMenuSeparator />
				<ContextMenuSub>
					<ContextMenuSubTrigger inset>More Options</ContextMenuSubTrigger>
					<ContextMenuSubContent>
						<ContextMenuGroup>
							<ContextMenuItem>Save Page...</ContextMenuItem>
							<ContextMenuItem>Create Shortcut...</ContextMenuItem>
						</ContextMenuGroup>
					</ContextMenuSubContent>
				</ContextMenuSub>
			</ContextMenuContent>
		</ContextMenu>
	);
}

export function ContextMenuDemoWithRadioGroup() {
	const [user, setUser] = useState("pedro");
	const [theme, setTheme] = useState("light");

	return (
		<ContextMenu>
			<ContextMenuTrigger className="flex aspect-[2/0.5] w-full items-center justify-center rounded-lg border text-sm">
				Right click here
			</ContextMenuTrigger>
			<ContextMenuContent>
				<ContextMenuGroup>
					<ContextMenuLabel>People</ContextMenuLabel>
					<ContextMenuRadioGroup value={user} onValueChange={setUser}>
						<ContextMenuRadioItem value="pedro">
							Pedro Duarte
						</ContextMenuRadioItem>
						<ContextMenuRadioItem value="colm">
							Colm Tuite
						</ContextMenuRadioItem>
					</ContextMenuRadioGroup>
				</ContextMenuGroup>
				<ContextMenuSeparator />
				<ContextMenuGroup>
					<ContextMenuLabel>Theme</ContextMenuLabel>
					<ContextMenuRadioGroup value={theme} onValueChange={setTheme}>
						<ContextMenuRadioItem value="light">Light</ContextMenuRadioItem>
						<ContextMenuRadioItem value="dark">Dark</ContextMenuRadioItem>
						<ContextMenuRadioItem value="system">System</ContextMenuRadioItem>
					</ContextMenuRadioGroup>
				</ContextMenuGroup>
			</ContextMenuContent>
		</ContextMenu>
	);
}

export function ContextMenuDemoWithShortcuts() {
	return (
		<ContextMenu>
			<ContextMenuTrigger className="flex aspect-[2/0.5] w-full items-center justify-center rounded-lg border text-sm">
				Right click here
			</ContextMenuTrigger>
			<ContextMenuContent>
				<ContextMenuGroup>
					<ContextMenuItem>
						Back
						<ContextMenuShortcut>⌘[</ContextMenuShortcut>
					</ContextMenuItem>
					<ContextMenuItem disabled>
						Forward
						<ContextMenuShortcut>⌘]</ContextMenuShortcut>
					</ContextMenuItem>
					<ContextMenuItem>
						Reload
						<ContextMenuShortcut>⌘R</ContextMenuShortcut>
					</ContextMenuItem>
				</ContextMenuGroup>
				<ContextMenuSeparator />
				<ContextMenuGroup>
					<ContextMenuItem>
						Save
						<ContextMenuShortcut>⌘S</ContextMenuShortcut>
					</ContextMenuItem>
					<ContextMenuItem>
						Save As...
						<ContextMenuShortcut>⇧⌘S</ContextMenuShortcut>
					</ContextMenuItem>
				</ContextMenuGroup>
			</ContextMenuContent>
		</ContextMenu>
	);
}

export function ContextMenuDemoWithSides() {
	return (
		<div className="flex flex-wrap justify-center gap-2">
			{(
				[
					"inline-start",
					"left",
					"top",
					"bottom",
					"right",
					"inline-end",
				] as const
			).map((side) => (
				<ContextMenu key={side}>
					<ContextMenuTrigger className="flex aspect-[2/0.5] items-center justify-center rounded-lg border p-4 text-sm capitalize">
						{side.replace("-", " ")}
					</ContextMenuTrigger>
					<ContextMenuContent side={side}>
						<ContextMenuGroup>
							<ContextMenuItem>Back</ContextMenuItem>
							<ContextMenuItem>Forward</ContextMenuItem>
							<ContextMenuItem>Reload</ContextMenuItem>
						</ContextMenuGroup>
					</ContextMenuContent>
				</ContextMenu>
			))}
		</div>
	);
}

export function ContextMenuDemoWithSubmenu() {
	return (
		<ContextMenu>
			<ContextMenuTrigger className="flex aspect-[2/0.5] w-full items-center justify-center rounded-lg border text-sm">
				Right click here
			</ContextMenuTrigger>
			<ContextMenuContent>
				<ContextMenuGroup>
					<ContextMenuItem>
						Copy
						<ContextMenuShortcut>⌘C</ContextMenuShortcut>
					</ContextMenuItem>
					<ContextMenuItem>
						Cut
						<ContextMenuShortcut>⌘X</ContextMenuShortcut>
					</ContextMenuItem>
				</ContextMenuGroup>
				<ContextMenuSub>
					<ContextMenuSubTrigger>More Tools</ContextMenuSubTrigger>
					<ContextMenuSubContent>
						<ContextMenuGroup>
							<ContextMenuItem>Save Page...</ContextMenuItem>
							<ContextMenuItem>Create Shortcut...</ContextMenuItem>
							<ContextMenuItem>Name Window...</ContextMenuItem>
						</ContextMenuGroup>
						<ContextMenuSeparator />
						<ContextMenuGroup>
							<ContextMenuItem>Developer Tools</ContextMenuItem>
						</ContextMenuGroup>
						<ContextMenuSeparator />
						<ContextMenuGroup>
							<ContextMenuItem variant="destructive">Delete</ContextMenuItem>
						</ContextMenuGroup>
					</ContextMenuSubContent>
				</ContextMenuSub>
			</ContextMenuContent>
		</ContextMenu>
	);
}
