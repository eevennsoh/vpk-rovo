"use client";

import { useState } from "react";
import { BoldIcon, BookmarkIcon, ItalicIcon, UnderlineIcon } from "@/components/ui/vpk-icons";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";

export default function ToggleDemo() {
	const [pressed, setPressed] = useState(false);

	return (
		<Toggle pressed={pressed} onPressedChange={setPressed} aria-label="Bold" size="sm">
			<BoldIcon className="size-4" />
		</Toggle>
	);
}

export function ToggleDemoBasic() {
	return (
		<div className="flex flex-wrap items-center gap-2">
			<Toggle aria-label="Toggle bold" defaultPressed>
				<BoldIcon
				/>
			</Toggle>
			<Toggle aria-label="Toggle italic">
				<ItalicIcon
				/>
			</Toggle>
			<Toggle aria-label="Toggle underline">
				<UnderlineIcon
				/>
			</Toggle>
		</div>
	);
}

export function ToggleDemoDefault() {
	return (
		<Toggle aria-label="Toggle bold">
			<BoldIcon className="size-4" />
		</Toggle>
	);
}

export function ToggleDemoDisabled() {
	return (
		<div className="flex flex-wrap items-center gap-2">
			<Toggle aria-label="Toggle disabled" disabled>
				Disabled
			</Toggle>
			<Toggle variant="outline" aria-label="Toggle disabled outline" disabled>
				Disabled
			</Toggle>
		</div>
	);
}

export function ToggleDemoOutline() {
	return (
		<div className="flex flex-wrap items-center gap-2">
			<Toggle variant="outline" aria-label="Toggle italic">
				<ItalicIcon
				/>
				Italic
			</Toggle>
			<Toggle variant="outline" aria-label="Toggle bold">
				<BoldIcon
				/>
				Bold
			</Toggle>
		</div>
	);
}

export function ToggleDemoSizes() {
	return (
		<div className="flex flex-wrap items-center gap-2">
			<Toggle variant="outline" aria-label="Toggle small" size="sm">
				Small
			</Toggle>
			<Toggle variant="outline" aria-label="Toggle default" size="default">
				Default
			</Toggle>
			<Toggle variant="outline" aria-label="Toggle large" size="lg">
				Large
			</Toggle>
		</div>
	);
}

export function ToggleDemoWithButtonIconText() {
	return (
		<div className="flex flex-col gap-4">
			<div className="flex items-center gap-2">
				<Button size="sm" variant="outline">
					<BoldIcon data-icon="inline-start" />
					Button
				</Button>
				<Toggle variant="outline" aria-label="Toggle sm icon text" size="sm">
					<BoldIcon
					/>
					Toggle
				</Toggle>
			</div>
			<div className="flex items-center gap-2">
				<Button size="default" variant="outline">
					<ItalicIcon data-icon="inline-start" />
					Button
				</Button>
				<Toggle
					variant="outline"
					aria-label="Toggle default icon text"
					size="default"
				>
					<ItalicIcon
					/>
					Toggle
				</Toggle>
			</div>
			<div className="flex items-center gap-2">
				<Button size="lg" variant="outline">
					<UnderlineIcon data-icon="inline-start" />
					Button
				</Button>
				<Toggle variant="outline" aria-label="Toggle lg icon text" size="lg">
					<UnderlineIcon
					/>
					Toggle
				</Toggle>
			</div>
		</div>
	);
}

export function ToggleDemoWithButtonIcon() {
	return (
		<div className="flex flex-col gap-4">
			<div className="flex items-center gap-2">
				<Button variant="outline" size="icon-sm">
					<BoldIcon
					/>
				</Button>
				<Toggle variant="outline" aria-label="Toggle sm icon" size="sm">
					<BoldIcon
					/>
				</Toggle>
			</div>
			<div className="flex items-center gap-2">
				<Button variant="outline" size="icon">
					<ItalicIcon
					/>
				</Button>
				<Toggle
					variant="outline"
					aria-label="Toggle default icon"
					size="default"
				>
					<ItalicIcon
					/>
				</Toggle>
			</div>
			<div className="flex items-center gap-2">
				<Button variant="outline" size="icon-lg">
					<UnderlineIcon
					/>
				</Button>
				<Toggle variant="outline" aria-label="Toggle lg icon" size="lg">
					<UnderlineIcon
					/>
				</Toggle>
			</div>
		</div>
	);
}

export function ToggleDemoWithButtonText() {
	return (
		<div className="flex flex-col gap-4">
			<div className="flex items-center gap-2">
				<Button size="sm" variant="outline">
					Button
				</Button>
				<Toggle variant="outline" aria-label="Toggle sm" size="sm">
					Toggle
				</Toggle>
			</div>
			<div className="flex items-center gap-2">
				<Button size="default" variant="outline">
					Button
				</Button>
				<Toggle variant="outline" aria-label="Toggle default" size="default">
					Toggle
				</Toggle>
			</div>
			<div className="flex items-center gap-2">
				<Button size="lg" variant="outline">
					Button
				</Button>
				<Toggle variant="outline" aria-label="Toggle lg" size="lg">
					Toggle
				</Toggle>
			</div>
		</div>
	);
}

export function ToggleDemoWithIcon() {
	return (
		<div className="flex flex-wrap items-center gap-2">
			<Toggle aria-label="Toggle bookmark" defaultPressed>
				<BookmarkIcon className="group-data-pressed/toggle:fill-accent-foreground" />
			</Toggle>
			<Toggle variant="outline" aria-label="Toggle bookmark outline">
				<BookmarkIcon className="group-data-pressed/toggle:fill-accent-foreground" />
				Bookmark
			</Toggle>
		</div>
	);
}

export function ToggleDemoWithText() {
	return (
		<Toggle aria-label="Toggle bold">
			<BoldIcon className="size-4" /> Bold
		</Toggle>
	);
}
