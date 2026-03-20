"use client";

import { useState } from "react";
import { ChevronRightIcon, ChevronsUpDownIcon, FileIcon, FolderIcon, MaximizeIcon, MinimizeIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function CollapsibleDemo() {
	const [open, setOpen] = useState(false);

	return (
		<Collapsible open={open} onOpenChange={setOpen} className="flex w-56 flex-col gap-2">
			<div className="flex items-center justify-between">
				<span className="text-sm font-medium">Collapsible</span>
				<CollapsibleTrigger render={<Button variant="ghost" size="icon-sm" />}>
					<ChevronsUpDownIcon className="size-4" />
				</CollapsibleTrigger>
			</div>
			<CollapsibleContent>
				<div className="rounded-md border px-3 py-2 text-sm text-muted-foreground">
					Hidden content revealed.
				</div>
			</CollapsibleContent>
		</Collapsible>
	);
}

export function CollapsibleDemoDefault() {
	return (
		<Collapsible className="flex w-[340px] flex-col gap-2">
			<CollapsibleTrigger render={<Button variant="outline">Toggle content</Button>} />
			<CollapsibleContent>
				<p className="text-muted-foreground text-sm">
					This is the collapsible content. It can contain any elements and will
					be shown or hidden when the trigger is clicked.
				</p>
			</CollapsibleContent>
		</Collapsible>
	);
}

export function CollapsibleDemoFileTree() {
	interface FileTreeItem {
		name: string;
		items?: FileTreeItem[];
	}

	const fileTree: FileTreeItem[] = [
		{
			name: "components",
			items: [
				{
					name: "ui",
					items: [
						{ name: "button.tsx" },
						{ name: "card.tsx" },
						{ name: "dialog.tsx" },
						{ name: "input.tsx" },
						{ name: "select.tsx" },
						{ name: "table.tsx" },
					],
				},
				{ name: "login-form.tsx" },
				{ name: "register-form.tsx" },
			],
		},
		{
			name: "lib",
			items: [{ name: "utils.ts" }, { name: "cn.ts" }, { name: "api.ts" }],
		},
		{
			name: "hooks",
			items: [
				{ name: "use-media-query.ts" },
				{ name: "use-debounce.ts" },
				{ name: "use-local-storage.ts" },
			],
		},
		{
			name: "types",
			items: [{ name: "index.d.ts" }, { name: "api.d.ts" }],
		},
		{
			name: "public",
			items: [
				{ name: "favicon.ico" },
				{ name: "logo.svg" },
				{ name: "images" },
			],
		},
		{ name: "app.tsx" },
		{ name: "layout.tsx" },
		{ name: "globals.css" },
		{ name: "package.json" },
		{ name: "tsconfig.json" },
		{ name: "README.md" },
		{ name: ".gitignore" },
	];

	const renderItem = (fileItem: FileTreeItem) => {
		if (fileItem.items) {
			return (
				<Collapsible key={fileItem.name}>
					<CollapsibleTrigger
						render={
							<Button
								variant="ghost"
								size="sm"
								className="group hover:bg-accent hover:text-accent-foreground w-full justify-start transition-none"
							/>
						}
					>
						<ChevronRightIcon className="transition-transform group-data-[state=open]:rotate-90" />
						<FolderIcon />
						{fileItem.name}
					</CollapsibleTrigger>
					<CollapsibleContent className="style-lyra:ml-4 ml-5">
						<div className="flex flex-col gap-1">
							{fileItem.items.map((child) => renderItem(child))}
						</div>
					</CollapsibleContent>
				</Collapsible>
			);
		}
		return (
			<Button
				key={fileItem.name}
				variant="link"
				size="sm"
				className="text-foreground w-full justify-start gap-2"
			>
				<FileIcon />
				<span>{fileItem.name}</span>
			</Button>
		);
	};

	return (
		<Card className="mx-auto w-full max-w-[16rem] gap-2" size="sm">
			<CardHeader>
				<Tabs defaultValue="explorer">
					<TabsList className="w-full">
						<TabsTrigger value="explorer">Explorer</TabsTrigger>
						<TabsTrigger value="settings">Outline</TabsTrigger>
					</TabsList>
				</Tabs>
			</CardHeader>
			<CardContent>
				<div className="flex flex-col gap-1">
					{fileTree.map((item) => renderItem(item))}
				</div>
			</CardContent>
		</Card>
	);
}

export function CollapsibleDemoOpen() {
	return (
		<Collapsible defaultOpen className="flex w-[340px] flex-col gap-2">
			<CollapsibleTrigger render={<Button variant="outline">Toggle content</Button>} />
			<CollapsibleContent>
				<p className="text-muted-foreground text-sm">
					This collapsible starts in the open state. Click the button above to
					collapse this content.
				</p>
			</CollapsibleContent>
		</Collapsible>
	);
}

export function CollapsibleDemoSettings() {
	const [isOpen, setIsOpen] = useState(false);

	return (
		<Card className="mx-auto w-full max-w-xs" size="sm">
			<CardHeader>
				<CardTitle>Radius</CardTitle>
				<CardDescription>
					Set the corner radius of the element.
				</CardDescription>
			</CardHeader>
			<CardContent>
				<Collapsible
					open={isOpen}
					onOpenChange={setIsOpen}
					className="flex items-start gap-2"
				>
					<FieldGroup className="grid w-full grid-cols-2 gap-2">
						<Field>
							<FieldLabel htmlFor="radius-x" className="sr-only">
								Radius X
							</FieldLabel>
							<Input id="radius" placeholder="0" defaultValue={0} />
						</Field>
						<Field>
							<FieldLabel htmlFor="radius-y" className="sr-only">
								Radius Y
							</FieldLabel>
							<Input id="radius" placeholder="0" defaultValue={0} />
						</Field>
						<CollapsibleContent className="col-span-full grid grid-cols-subgrid gap-2">
							<Field>
								<FieldLabel htmlFor="radius-x" className="sr-only">
									Radius X
								</FieldLabel>
								<Input id="radius" placeholder="0" defaultValue={0} />
							</Field>
							<Field>
								<FieldLabel htmlFor="radius-y" className="sr-only">
									Radius Y
								</FieldLabel>
								<Input id="radius" placeholder="0" defaultValue={0} />
							</Field>
						</CollapsibleContent>
					</FieldGroup>
					<CollapsibleTrigger
						render={<Button variant="outline" size="icon" />}
					>
						{isOpen ? <MinimizeIcon /> : <MaximizeIcon />}
					</CollapsibleTrigger>
				</Collapsible>
			</CardContent>
		</Card>
	);
}

export function CollapsibleDemoStyled() {
	return (
		<Collapsible className="flex w-[340px] flex-col gap-2">
			<div className="flex items-center justify-between rounded-lg border p-4">
				<h4 className="text-sm font-semibold">3 items available</h4>
				<CollapsibleTrigger render={<Button variant="ghost" size="sm">Toggle</Button>} />
			</div>
			<CollapsibleContent>
				<div className="flex flex-col gap-2">
					<div className="rounded-md border px-4 py-2 text-sm">Item one</div>
					<div className="rounded-md border px-4 py-2 text-sm">Item two</div>
					<div className="rounded-md border px-4 py-2 text-sm">Item three</div>
				</div>
			</CollapsibleContent>
		</Collapsible>
	);
}
