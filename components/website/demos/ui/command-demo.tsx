import { useState } from "react";
import { BellIcon, CalculatorIcon, CalendarIcon, ClipboardPasteIcon, CodeIcon, CopyIcon, CreditCardIcon, FileTextIcon, FolderIcon, FolderPlusIcon, HelpCircleIcon, HomeIcon, ImageIcon, InboxIcon, LayoutGridIcon, ListIcon, PlusIcon, ScissorsIcon, SettingsIcon, SmileIcon, TrashIcon, UserIcon, ZoomInIcon, ZoomOutIcon } from "@/components/ui/vpk-icons";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator, CommandShortcut } from "@/components/ui/command";

export default function CommandDemo() {
	return (
		<Command className="w-48 rounded-lg border" value="__preview__" onValueChange={() => {}}>
			<CommandInput placeholder="Search..." />
			<CommandList>
				<CommandEmpty>No results found.</CommandEmpty>
				<CommandItem>Calendar</CommandItem>
				<CommandItem>Search</CommandItem>
				<CommandItem>Settings</CommandItem>
			</CommandList>
		</Command>
	);
}

export function CommandDemoBasic() {
	const [open, setOpen] = useState(false);

	return (
		<div className="flex flex-col gap-4">
			<Button
				onClick={() => setOpen(true)}
				variant="outline"
				className="w-fit"
			>
				Open Menu
			</Button>
			<CommandDialog open={open} onOpenChange={setOpen}>
				<Command>
					<CommandInput placeholder="Type a command or search..." />
					<CommandList>
						<CommandEmpty>No results found.</CommandEmpty>
						<CommandGroup heading="Suggestions">
							<CommandItem>Calendar</CommandItem>
							<CommandItem>Search Emoji</CommandItem>
							<CommandItem>Calculator</CommandItem>
						</CommandGroup>
					</CommandList>
				</Command>
			</CommandDialog>
		</div>
	);
}

export function CommandDemoDefault() {
	return (
		<Command className="rounded-lg border shadow-md">
			<CommandInput placeholder="Type a command..." />
			<CommandList>
				<CommandGroup heading="Suggestions">
					<CommandItem>Calendar</CommandItem>
					<CommandItem>Search</CommandItem>
					<CommandItem>Settings</CommandItem>
				</CommandGroup>
			</CommandList>
		</Command>
	);
}

export function CommandDemoEmpty() {
	return (
		<Command className="rounded-lg border shadow-md">
			<CommandInput placeholder="Search..." />
			<CommandList>
				<CommandEmpty>No results found.</CommandEmpty>
			</CommandList>
		</Command>
	);
}

export function CommandDemoGroups() {
	return (
		<Command className="rounded-lg border shadow-md">
			<CommandInput placeholder="Type a command..." />
			<CommandList>
				<CommandGroup heading="Suggestions">
					<CommandItem>Calendar</CommandItem>
					<CommandItem>Search</CommandItem>
					<CommandItem>Calculator</CommandItem>
				</CommandGroup>
				<CommandSeparator />
				<CommandGroup heading="Settings">
					<CommandItem>Profile</CommandItem>
					<CommandItem>Billing</CommandItem>
					<CommandItem>Notifications</CommandItem>
				</CommandGroup>
			</CommandList>
		</Command>
	);
}

export function CommandDemoInline() {
	return (
		<Card className="w-full p-0">
			<CardContent className="p-0">
				<Command>
					<CommandInput placeholder="Type a command or search..." />
					<CommandList>
						<CommandEmpty>No results found.</CommandEmpty>
						<CommandGroup heading="Suggestions">
							<CommandItem>
								<CalendarIcon />
								<span>Calendar</span>
							</CommandItem>
							<CommandItem>
								<SmileIcon />
								<span>Search Emoji</span>
							</CommandItem>
							<CommandItem>
								<CalculatorIcon />
								<span>Calculator</span>
							</CommandItem>
						</CommandGroup>
						<CommandSeparator />
						<CommandGroup heading="Settings">
							<CommandItem>
								<UserIcon />
								<span>Profile</span>
								<CommandShortcut>⌘P</CommandShortcut>
							</CommandItem>
							<CommandItem>
								<CreditCardIcon />
								<span>Billing</span>
								<CommandShortcut>⌘B</CommandShortcut>
							</CommandItem>
							<CommandItem>
								<SettingsIcon />
								<span>Settings</span>
								<CommandShortcut>⌘S</CommandShortcut>
							</CommandItem>
						</CommandGroup>
					</CommandList>
				</Command>
			</CardContent>
		</Card>
	);
}

export function CommandDemoManyGroupsAndItems() {
	const [open, setOpen] = useState(false);

	return (
		<div className="flex flex-col gap-4">
			<Button
				onClick={() => setOpen(true)}
				variant="outline"
				className="w-fit"
			>
				Open Menu
			</Button>
			<CommandDialog open={open} onOpenChange={setOpen}>
				<Command>
					<CommandInput placeholder="Type a command or search..." />
					<CommandList>
						<CommandEmpty>No results found.</CommandEmpty>
						<CommandGroup heading="Navigation">
							<CommandItem>
								<HomeIcon />
								<span>Home</span>
								<CommandShortcut>⌘H</CommandShortcut>
							</CommandItem>
							<CommandItem>
								<InboxIcon />
								<span>Inbox</span>
								<CommandShortcut>⌘I</CommandShortcut>
							</CommandItem>
							<CommandItem>
								<FileTextIcon />
								<span>Documents</span>
								<CommandShortcut>⌘D</CommandShortcut>
							</CommandItem>
							<CommandItem>
								<FolderIcon />
								<span>Folders</span>
								<CommandShortcut>⌘F</CommandShortcut>
							</CommandItem>
						</CommandGroup>
						<CommandSeparator />
						<CommandGroup heading="Actions">
							<CommandItem>
								<PlusIcon />
								<span>New File</span>
								<CommandShortcut>⌘N</CommandShortcut>
							</CommandItem>
							<CommandItem>
								<FolderPlusIcon />
								<span>New Folder</span>
								<CommandShortcut>⇧⌘N</CommandShortcut>
							</CommandItem>
							<CommandItem>
								<CopyIcon />
								<span>Copy</span>
								<CommandShortcut>⌘C</CommandShortcut>
							</CommandItem>
							<CommandItem>
								<ScissorsIcon />
								<span>Cut</span>
								<CommandShortcut>⌘X</CommandShortcut>
							</CommandItem>
							<CommandItem>
								<ClipboardPasteIcon />
								<span>Paste</span>
								<CommandShortcut>⌘V</CommandShortcut>
							</CommandItem>
							<CommandItem>
								<TrashIcon />
								<span>Delete</span>
								<CommandShortcut>⌫</CommandShortcut>
							</CommandItem>
						</CommandGroup>
						<CommandSeparator />
						<CommandGroup heading="View">
							<CommandItem>
								<LayoutGridIcon />
								<span>Grid View</span>
							</CommandItem>
							<CommandItem>
								<ListIcon />
								<span>List View</span>
							</CommandItem>
							<CommandItem>
								<ZoomInIcon />
								<span>Zoom In</span>
								<CommandShortcut>⌘+</CommandShortcut>
							</CommandItem>
							<CommandItem>
								<ZoomOutIcon />
								<span>Zoom Out</span>
								<CommandShortcut>⌘-</CommandShortcut>
							</CommandItem>
						</CommandGroup>
						<CommandSeparator />
						<CommandGroup heading="Account">
							<CommandItem>
								<UserIcon />
								<span>Profile</span>
								<CommandShortcut>⌘P</CommandShortcut>
							</CommandItem>
							<CommandItem>
								<CreditCardIcon />
								<span>Billing</span>
								<CommandShortcut>⌘B</CommandShortcut>
							</CommandItem>
							<CommandItem>
								<SettingsIcon />
								<span>Settings</span>
								<CommandShortcut>⌘S</CommandShortcut>
							</CommandItem>
							<CommandItem>
								<BellIcon />
								<span>Notifications</span>
							</CommandItem>
							<CommandItem>
								<HelpCircleIcon />
								<span>Help & Support</span>
							</CommandItem>
						</CommandGroup>
						<CommandSeparator />
						<CommandGroup heading="Tools">
							<CommandItem>
								<CalculatorIcon />
								<span>Calculator</span>
							</CommandItem>
							<CommandItem>
								<CalendarIcon />
								<span>Calendar</span>
							</CommandItem>
							<CommandItem>
								<ImageIcon />
								<span>Image Editor</span>
							</CommandItem>
							<CommandItem>
								<CodeIcon />
								<span>Code Editor</span>
							</CommandItem>
						</CommandGroup>
					</CommandList>
				</Command>
			</CommandDialog>
		</div>
	);
}

export function CommandDemoWithGroups() {
	const [open, setOpen] = useState(false);

	return (
		<div className="flex flex-col gap-4">
			<Button
				onClick={() => setOpen(true)}
				variant="outline"
				className="w-fit"
			>
				Open Menu
			</Button>
			<CommandDialog open={open} onOpenChange={setOpen}>
				<Command>
					<CommandInput placeholder="Type a command or search..." />
					<CommandList>
						<CommandEmpty>No results found.</CommandEmpty>
						<CommandGroup heading="Suggestions">
							<CommandItem>
								<CalendarIcon />
								<span>Calendar</span>
							</CommandItem>
							<CommandItem>
								<SmileIcon />
								<span>Search Emoji</span>
							</CommandItem>
							<CommandItem>
								<CalculatorIcon />
								<span>Calculator</span>
							</CommandItem>
						</CommandGroup>
						<CommandSeparator />
						<CommandGroup heading="Settings">
							<CommandItem>
								<UserIcon />
								<span>Profile</span>
								<CommandShortcut>⌘P</CommandShortcut>
							</CommandItem>
							<CommandItem>
								<CreditCardIcon />
								<span>Billing</span>
								<CommandShortcut>⌘B</CommandShortcut>
							</CommandItem>
							<CommandItem>
								<SettingsIcon />
								<span>Settings</span>
								<CommandShortcut>⌘S</CommandShortcut>
							</CommandItem>
						</CommandGroup>
					</CommandList>
				</Command>
			</CommandDialog>
		</div>
	);
}

export function CommandDemoWithShortcuts() {
	const [open, setOpen] = useState(false);

	return (
		<div className="flex flex-col gap-4">
			<Button
				onClick={() => setOpen(true)}
				variant="outline"
				className="w-fit"
			>
				Open Menu
			</Button>
			<CommandDialog open={open} onOpenChange={setOpen}>
				<Command>
					<CommandInput placeholder="Type a command or search..." />
					<CommandList>
						<CommandEmpty>No results found.</CommandEmpty>
						<CommandGroup heading="Settings">
							<CommandItem>
								<UserIcon />
								<span>Profile</span>
								<CommandShortcut>⌘P</CommandShortcut>
							</CommandItem>
							<CommandItem>
								<CreditCardIcon />
								<span>Billing</span>
								<CommandShortcut>⌘B</CommandShortcut>
							</CommandItem>
							<CommandItem>
								<SettingsIcon />
								<span>Settings</span>
								<CommandShortcut>⌘S</CommandShortcut>
							</CommandItem>
						</CommandGroup>
					</CommandList>
				</Command>
			</CommandDialog>
		</div>
	);
}
