"use client";

import { Separator } from "@/components/ui/separator";

export default function SeparatorDemo() {
	return (
		<div className="flex flex-col gap-2 w-48">
			<span className="text-sm">Above</span>
			<Separator />
			<span className="text-sm">Below</span>
		</div>
	);
}

export function SeparatorDemoDefault() {
	return (
		<div className="flex flex-col gap-4">
			<p className="text-sm">This is the first section of content.</p>
			<Separator />
			<p className="text-sm">This is the second section of content.</p>
		</div>
	);
}

export function SeparatorDemoHorizontal() {
	return (
		<div className="style-lyra:text-xs/relaxed flex flex-col gap-4 text-sm">
			<div className="flex flex-col gap-1">
				<div className="leading-none font-medium">shadcn/ui</div>
				<div className="text-muted-foreground">
					The Foundation for your Design System
				</div>
			</div>
			<Separator />
			<div>
				A set of beautifully designed components that you can customize,
				extend, and build on.
			</div>
		</div>
	);
}

export function SeparatorDemoInList() {
	return (
		<div className="style-lyra:text-xs/relaxed flex flex-col gap-2 text-sm">
			<dl className="flex items-center justify-between">
				<dt>Item 1</dt>
				<dd className="text-muted-foreground">Value 1</dd>
			</dl>
			<Separator />
			<dl className="flex items-center justify-between">
				<dt>Item 2</dt>
				<dd className="text-muted-foreground">Value 2</dd>
			</dl>
			<Separator />
			<dl className="flex items-center justify-between">
				<dt>Item 3</dt>
				<dd className="text-muted-foreground">Value 3</dd>
			</dl>
		</div>
	);
}

export function SeparatorDemoVerticalMenu() {
	return (
		<div className="style-lyra:text-xs/relaxed flex items-center gap-2 text-sm md:gap-4">
			<div className="flex flex-col gap-1">
				<span className="font-medium">Settings</span>
				<span className="text-muted-foreground text-xs">
					Manage preferences
				</span>
			</div>
			<Separator orientation="vertical" />
			<div className="flex flex-col gap-1">
				<span className="font-medium">Account</span>
				<span className="text-muted-foreground text-xs">
					Profile & security
				</span>
			</div>
			<Separator orientation="vertical" />
			<div className="flex flex-col gap-1">
				<span className="font-medium">Help</span>
				<span className="text-muted-foreground text-xs">Support & docs</span>
			</div>
		</div>
	);
}

export function SeparatorDemoVertical() {
	return (
		<div className="style-lyra:text-xs/relaxed flex h-5 items-center gap-4 text-sm">
			<div>Blog</div>
			<Separator orientation="vertical" />
			<div>Docs</div>
			<Separator orientation="vertical" />
			<div>Source</div>
		</div>
	);
}
