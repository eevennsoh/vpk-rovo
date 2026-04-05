"use client";

import { useState } from "react";
import { BoldIcon, CheckIcon, CircleDashedIcon, ClipboardPasteIcon, CopyIcon, FileIcon, FolderIcon, ImageIcon, ItalicIcon, LinkIcon, LogOutIcon, SaveIcon, ScissorsIcon, SearchIcon, SettingsIcon, TableIcon, TrashIcon, UnderlineIcon, UserIcon } from "@/components/ui/vpk-icons";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Menubar, MenubarCheckboxItem, MenubarContent, MenubarGroup, MenubarItem, MenubarLabel, MenubarMenu, MenubarRadioGroup, MenubarRadioItem, MenubarSeparator, MenubarShortcut, MenubarSub, MenubarSubContent, MenubarSubTrigger, MenubarTrigger } from "@/components/ui/menubar";

export default function MenubarDemo() {
	return (
		<Menubar>
			<MenubarMenu>
				<MenubarTrigger>File</MenubarTrigger>
				<MenubarContent>
					<MenubarItem>New</MenubarItem>
					<MenubarItem>Open</MenubarItem>
					<MenubarSeparator />
					<MenubarItem>Save</MenubarItem>
				</MenubarContent>
			</MenubarMenu>
			<MenubarMenu>
				<MenubarTrigger>Edit</MenubarTrigger>
				<MenubarContent>
					<MenubarItem>Undo</MenubarItem>
					<MenubarItem>Redo</MenubarItem>
				</MenubarContent>
			</MenubarMenu>
		</Menubar>
	);
}

export function MenubarDemoBasic() {
	return (
		<Menubar>
			<MenubarMenu>
				<MenubarTrigger>File</MenubarTrigger>
				<MenubarContent>
					<MenubarItem>
						New Tab <MenubarShortcut>⌘T</MenubarShortcut>
					</MenubarItem>
					<MenubarItem>
						New Window <MenubarShortcut>⌘N</MenubarShortcut>
					</MenubarItem>
					<MenubarItem disabled>New Incognito Window</MenubarItem>
					<MenubarSeparator />
					<MenubarItem>
						Print... <MenubarShortcut>⌘P</MenubarShortcut>
					</MenubarItem>
				</MenubarContent>
			</MenubarMenu>
			<MenubarMenu>
				<MenubarTrigger>Edit</MenubarTrigger>
				<MenubarContent>
					<MenubarItem>
						Undo <MenubarShortcut>⌘Z</MenubarShortcut>
					</MenubarItem>
					<MenubarItem>
						Redo <MenubarShortcut>⇧⌘Z</MenubarShortcut>
					</MenubarItem>
					<MenubarSeparator />
					<MenubarItem>Cut</MenubarItem>
					<MenubarItem>Copy</MenubarItem>
					<MenubarItem>Paste</MenubarItem>
				</MenubarContent>
			</MenubarMenu>
		</Menubar>
	);
}

export function MenubarDemoDefault() {
	return (
		<Menubar>
			<MenubarMenu>
				<MenubarTrigger>File</MenubarTrigger>
				<MenubarContent>
					<MenubarItem>New</MenubarItem>
					<MenubarItem>Open</MenubarItem>
					<MenubarItem>Save</MenubarItem>
				</MenubarContent>
			</MenubarMenu>
			<MenubarMenu>
				<MenubarTrigger>Edit</MenubarTrigger>
				<MenubarContent>
					<MenubarItem>Undo</MenubarItem>
					<MenubarItem>Redo</MenubarItem>
					<MenubarItem>Cut</MenubarItem>
				</MenubarContent>
			</MenubarMenu>
			<MenubarMenu>
				<MenubarTrigger>View</MenubarTrigger>
				<MenubarContent>
					<MenubarItem>Zoom In</MenubarItem>
					<MenubarItem>Zoom Out</MenubarItem>
				</MenubarContent>
			</MenubarMenu>
		</Menubar>
	);
}

export function MenubarDemoDestructive() {
	return (
		<Menubar>
			<MenubarMenu>
				<MenubarTrigger>File</MenubarTrigger>
				<MenubarContent className="w-40">
					<MenubarItem>
						<FileIcon />
						New File <MenubarShortcut>⌘N</MenubarShortcut>
					</MenubarItem>
					<MenubarItem>
						<FolderIcon />
						Open Folder
					</MenubarItem>
					<MenubarSeparator />
					<MenubarItem variant="destructive">
						<TrashIcon />
						Delete File <MenubarShortcut>⌘⌫</MenubarShortcut>
					</MenubarItem>
				</MenubarContent>
			</MenubarMenu>
			<MenubarMenu>
				<MenubarTrigger>Account</MenubarTrigger>
				<MenubarContent>
					<MenubarItem>
						<UserIcon />
						Profile
					</MenubarItem>
					<MenubarItem>
						<SettingsIcon />
						Settings
					</MenubarItem>
					<MenubarSeparator />
					<MenubarItem variant="destructive">
						<LogOutIcon />
						Sign out
					</MenubarItem>
					<MenubarSeparator />
					<MenubarItem variant="destructive">
						<TrashIcon />
						Delete
					</MenubarItem>
				</MenubarContent>
			</MenubarMenu>
		</Menubar>
	);
}

export function MenubarDemoFormat() {
	return (
		<Menubar>
			<MenubarMenu>
				<MenubarTrigger>Format</MenubarTrigger>
				<MenubarContent>
					<MenubarItem>
						<BoldIcon />
						Bold <MenubarShortcut>⌘B</MenubarShortcut>
					</MenubarItem>
					<MenubarItem>
						<ItalicIcon />
						Italic <MenubarShortcut>⌘I</MenubarShortcut>
					</MenubarItem>
					<MenubarItem>
						<UnderlineIcon />
						Underline <MenubarShortcut>⌘U</MenubarShortcut>
					</MenubarItem>
					<MenubarSeparator />
					<MenubarCheckboxItem checked>Strikethrough</MenubarCheckboxItem>
					<MenubarCheckboxItem>Code</MenubarCheckboxItem>
				</MenubarContent>
			</MenubarMenu>
			<MenubarMenu>
				<MenubarTrigger>View</MenubarTrigger>
				<MenubarContent>
					<MenubarCheckboxItem>Show Ruler</MenubarCheckboxItem>
					<MenubarCheckboxItem checked>Show Grid</MenubarCheckboxItem>
					<MenubarSeparator />
					<MenubarItem inset>Zoom In</MenubarItem>
					<MenubarItem inset>Zoom Out</MenubarItem>
				</MenubarContent>
			</MenubarMenu>
		</Menubar>
	);
}

export function MenubarDemoInDialog() {
	return (
		<Dialog>
			<DialogTrigger render={<Button variant="outline" />}>
				Open Dialog
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Menubar Demo</DialogTitle>
					<DialogDescription>
						Use the menubar below to see the menu options.
					</DialogDescription>
				</DialogHeader>
				<Menubar>
					<MenubarMenu>
						<MenubarTrigger>File</MenubarTrigger>
						<MenubarContent>
							<MenubarItem>
								<CopyIcon />
								Copy
							</MenubarItem>
							<MenubarItem>
								<ScissorsIcon />
								Cut
							</MenubarItem>
							<MenubarItem>
								<ClipboardPasteIcon />
								Paste
							</MenubarItem>
							<MenubarSeparator />
							<MenubarSub>
								<MenubarSubTrigger>More Options</MenubarSubTrigger>
								<MenubarSubContent>
									<MenubarItem>Save Page...</MenubarItem>
									<MenubarItem>Create Shortcut...</MenubarItem>
									<MenubarItem>Name Window...</MenubarItem>
									<MenubarSeparator />
									<MenubarItem>Developer Tools</MenubarItem>
								</MenubarSubContent>
							</MenubarSub>
							<MenubarSeparator />
							<MenubarItem variant="destructive">
								<TrashIcon />
								Delete
							</MenubarItem>
						</MenubarContent>
					</MenubarMenu>
					<MenubarMenu>
						<MenubarTrigger>Edit</MenubarTrigger>
						<MenubarContent>
							<MenubarItem>
								Undo <MenubarShortcut>⌘Z</MenubarShortcut>
							</MenubarItem>
							<MenubarItem>
								Redo <MenubarShortcut>⇧⌘Z</MenubarShortcut>
							</MenubarItem>
						</MenubarContent>
					</MenubarMenu>
				</Menubar>
			</DialogContent>
		</Dialog>
	);
}

export function MenubarDemoInsert() {
	return (
		<Menubar>
			<MenubarMenu>
				<MenubarTrigger>Insert</MenubarTrigger>
				<MenubarContent>
					<MenubarSub>
						<MenubarSubTrigger>
							<ImageIcon />
							Media
						</MenubarSubTrigger>
						<MenubarSubContent>
							<MenubarItem>Image</MenubarItem>
							<MenubarItem>Video</MenubarItem>
							<MenubarItem>Audio</MenubarItem>
						</MenubarSubContent>
					</MenubarSub>
					<MenubarSeparator />
					<MenubarItem>
						<LinkIcon />
						Link <MenubarShortcut>⌘K</MenubarShortcut>
					</MenubarItem>
					<MenubarItem>
						<TableIcon />
						Table
					</MenubarItem>
				</MenubarContent>
			</MenubarMenu>
			<MenubarMenu>
				<MenubarTrigger>Tools</MenubarTrigger>
				<MenubarContent className="w-44">
					<MenubarItem>
						<SearchIcon />
						Find & Replace <MenubarShortcut>⌘F</MenubarShortcut>
					</MenubarItem>
					<MenubarItem>
						<CheckIcon />
						Spell Check
					</MenubarItem>
				</MenubarContent>
			</MenubarMenu>
		</Menubar>
	);
}

export function MenubarDemoSides() {
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
				<Menubar key={side}>
					<MenubarMenu>
						<MenubarTrigger className="capitalize">
							{side.replace("-", " ")}
						</MenubarTrigger>
						<MenubarContent side={side}>
							<MenubarGroup>
								<MenubarItem>New Tab</MenubarItem>
								<MenubarItem>New Window</MenubarItem>
								<MenubarItem>New Incognito Window</MenubarItem>
							</MenubarGroup>
						</MenubarContent>
					</MenubarMenu>
				</Menubar>
			))}
		</div>
	);
}

export function MenubarDemoWithCheckboxes() {
	return (
		<Menubar>
			<MenubarMenu>
				<MenubarTrigger>View</MenubarTrigger>
				<MenubarContent className="w-64">
					<MenubarCheckboxItem>Always Show Bookmarks Bar</MenubarCheckboxItem>
					<MenubarCheckboxItem checked>
						Always Show Full URLs
					</MenubarCheckboxItem>
					<MenubarSeparator />
					<MenubarItem inset>
						Reload <MenubarShortcut>⌘R</MenubarShortcut>
					</MenubarItem>
					<MenubarItem disabled inset>
						Force Reload <MenubarShortcut>⇧⌘R</MenubarShortcut>
					</MenubarItem>
				</MenubarContent>
			</MenubarMenu>
			<MenubarMenu>
				<MenubarTrigger>Format</MenubarTrigger>
				<MenubarContent>
					<MenubarCheckboxItem checked>Strikethrough</MenubarCheckboxItem>
					<MenubarCheckboxItem>Code</MenubarCheckboxItem>
					<MenubarCheckboxItem>Superscript</MenubarCheckboxItem>
				</MenubarContent>
			</MenubarMenu>
		</Menubar>
	);
}

export function MenubarDemoWithIcons() {
	return (
		<Menubar>
			<MenubarMenu>
				<MenubarTrigger>File</MenubarTrigger>
				<MenubarContent>
					<MenubarItem>
						<FileIcon />
						New File <MenubarShortcut>⌘N</MenubarShortcut>
					</MenubarItem>
					<MenubarItem>
						<FolderIcon />
						Open Folder
					</MenubarItem>
					<MenubarSeparator />
					<MenubarItem>
						<SaveIcon />
						Save <MenubarShortcut>⌘S</MenubarShortcut>
					</MenubarItem>
				</MenubarContent>
			</MenubarMenu>
			<MenubarMenu>
				<MenubarTrigger>More</MenubarTrigger>
				<MenubarContent>
					<MenubarGroup>
						<MenubarItem>
							<CircleDashedIcon />
							Settings
						</MenubarItem>
						<MenubarItem>
							<CircleDashedIcon />
							Help
						</MenubarItem>
						<MenubarSeparator />
						<MenubarItem variant="destructive">
							<CircleDashedIcon />
							Delete
						</MenubarItem>
					</MenubarGroup>
				</MenubarContent>
			</MenubarMenu>
		</Menubar>
	);
}

export function MenubarDemoWithInset() {
	const [showBookmarks, setShowBookmarks] = useState(true);
	const [showUrls, setShowUrls] = useState(false);
	const [theme, setTheme] = useState("system");

	return (
		<Menubar>
			<MenubarMenu>
				<MenubarTrigger>View</MenubarTrigger>
				<MenubarContent className="w-44">
					<MenubarGroup>
						<MenubarLabel>Actions</MenubarLabel>
						<MenubarItem>
							<CopyIcon />
							Copy
						</MenubarItem>
						<MenubarItem>
							<ScissorsIcon />
							Cut
						</MenubarItem>
						<MenubarItem inset>Paste</MenubarItem>
					</MenubarGroup>
					<MenubarSeparator />
					<MenubarGroup>
						<MenubarLabel inset>Appearance</MenubarLabel>
						<MenubarCheckboxItem
							inset
							checked={showBookmarks}
							onCheckedChange={setShowBookmarks}
						>
							Bookmarks
						</MenubarCheckboxItem>
						<MenubarCheckboxItem
							inset
							checked={showUrls}
							onCheckedChange={setShowUrls}
						>
							Full URLs
						</MenubarCheckboxItem>
					</MenubarGroup>
					<MenubarSeparator />
					<MenubarGroup>
						<MenubarLabel inset>Theme</MenubarLabel>
						<MenubarRadioGroup value={theme} onValueChange={setTheme}>
							<MenubarRadioItem inset value="light">
								Light
							</MenubarRadioItem>
							<MenubarRadioItem inset value="dark">
								Dark
							</MenubarRadioItem>
							<MenubarRadioItem inset value="system">
								System
							</MenubarRadioItem>
						</MenubarRadioGroup>
					</MenubarGroup>
					<MenubarSeparator />
					<MenubarSub>
						<MenubarSubTrigger inset>More Options</MenubarSubTrigger>
						<MenubarSubContent>
							<MenubarGroup>
								<MenubarItem>Save Page...</MenubarItem>
								<MenubarItem>Create Shortcut...</MenubarItem>
							</MenubarGroup>
						</MenubarSubContent>
					</MenubarSub>
				</MenubarContent>
			</MenubarMenu>
		</Menubar>
	);
}

export function MenubarDemoWithRadio() {
	const [user, setUser] = useState("benoit");
	const [theme, setTheme] = useState("system");

	return (
		<Menubar>
			<MenubarMenu>
				<MenubarTrigger>Profiles</MenubarTrigger>
				<MenubarContent>
					<MenubarRadioGroup value={user} onValueChange={setUser}>
						<MenubarRadioItem value="andy">Andy</MenubarRadioItem>
						<MenubarRadioItem value="benoit">Benoit</MenubarRadioItem>
						<MenubarRadioItem value="luis">Luis</MenubarRadioItem>
					</MenubarRadioGroup>
					<MenubarSeparator />
					<MenubarItem inset>Edit...</MenubarItem>
					<MenubarItem inset>Add Profile...</MenubarItem>
				</MenubarContent>
			</MenubarMenu>
			<MenubarMenu>
				<MenubarTrigger>Theme</MenubarTrigger>
				<MenubarContent>
					<MenubarRadioGroup value={theme} onValueChange={setTheme}>
						<MenubarRadioItem value="light">Light</MenubarRadioItem>
						<MenubarRadioItem value="dark">Dark</MenubarRadioItem>
						<MenubarRadioItem value="system">System</MenubarRadioItem>
					</MenubarRadioGroup>
				</MenubarContent>
			</MenubarMenu>
		</Menubar>
	);
}

export function MenubarDemoWithShortcuts() {
	return (
		<Menubar>
			<MenubarMenu>
				<MenubarTrigger>File</MenubarTrigger>
				<MenubarContent>
					<MenubarItem>
						New Tab <MenubarShortcut>⌘T</MenubarShortcut>
					</MenubarItem>
					<MenubarItem>
						New Window <MenubarShortcut>⌘N</MenubarShortcut>
					</MenubarItem>
					<MenubarItem>
						Print... <MenubarShortcut>⌘P</MenubarShortcut>
					</MenubarItem>
				</MenubarContent>
			</MenubarMenu>
			<MenubarMenu>
				<MenubarTrigger>Edit</MenubarTrigger>
				<MenubarContent>
					<MenubarItem>
						Undo <MenubarShortcut>⌘Z</MenubarShortcut>
					</MenubarItem>
					<MenubarItem>
						Redo <MenubarShortcut>⇧⌘Z</MenubarShortcut>
					</MenubarItem>
					<MenubarSeparator />
					<MenubarItem>
						Cut <MenubarShortcut>⌘X</MenubarShortcut>
					</MenubarItem>
					<MenubarItem>
						Copy <MenubarShortcut>⌘C</MenubarShortcut>
					</MenubarItem>
					<MenubarItem>
						Paste <MenubarShortcut>⌘V</MenubarShortcut>
					</MenubarItem>
				</MenubarContent>
			</MenubarMenu>
		</Menubar>
	);
}

export function MenubarDemoWithSubmenu() {
	return (
		<Menubar>
			<MenubarMenu>
				<MenubarTrigger>File</MenubarTrigger>
				<MenubarContent>
					<MenubarSub>
						<MenubarSubTrigger>Share</MenubarSubTrigger>
						<MenubarSubContent>
							<MenubarItem>Email link</MenubarItem>
							<MenubarItem>Messages</MenubarItem>
							<MenubarItem>Notes</MenubarItem>
						</MenubarSubContent>
					</MenubarSub>
					<MenubarSeparator />
					<MenubarItem>
						Print... <MenubarShortcut>⌘P</MenubarShortcut>
					</MenubarItem>
				</MenubarContent>
			</MenubarMenu>
			<MenubarMenu>
				<MenubarTrigger>Edit</MenubarTrigger>
				<MenubarContent>
					<MenubarItem>
						Undo <MenubarShortcut>⌘Z</MenubarShortcut>
					</MenubarItem>
					<MenubarItem>
						Redo <MenubarShortcut>⇧⌘Z</MenubarShortcut>
					</MenubarItem>
					<MenubarSeparator />
					<MenubarSub>
						<MenubarSubTrigger>Find</MenubarSubTrigger>
						<MenubarSubContent>
							<MenubarItem>Find...</MenubarItem>
							<MenubarItem>Find Next</MenubarItem>
							<MenubarItem>Find Previous</MenubarItem>
						</MenubarSubContent>
					</MenubarSub>
					<MenubarSeparator />
					<MenubarItem>Cut</MenubarItem>
					<MenubarItem>Copy</MenubarItem>
					<MenubarItem>Paste</MenubarItem>
				</MenubarContent>
			</MenubarMenu>
		</Menubar>
	);
}
