"use client";

import { useMemo, useState } from "react";
import { FileIcon } from "@/components/ui/vpk-icons";
import { Item, ItemActions, ItemContent, ItemGroup, ItemMedia, ItemTitle } from "@/components/ui/item";
import { Progress, ProgressLabel, ProgressValue } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";

export default function ProgressDemo() {
	return <Progress value={65} className="w-48" />;
}

export function ProgressDemoControlled() {
	const [value, setValue] = useState(50);

	return (
		<div className="flex w-full flex-col gap-4">
			<Progress value={value} className="w-full" />
			<Slider value={value} onValueChange={(value) => setValue(value as number)} min={0} max={100} step={1} />
		</div>
	);
}

export function ProgressDemoDefault() {
	return <Progress value={60} className="w-full max-w-md" />;
}

export function ProgressDemoFileUploadList() {
	const files = useMemo(
		() => [
			{
				id: "1",
				name: "document.pdf",
				progress: 45,
				timeRemaining: "2m 30s",
			},
			{
				id: "2",
				name: "presentation.pptx",
				progress: 78,
				timeRemaining: "45s",
			},
			{
				id: "3",
				name: "spreadsheet.xlsx",
				progress: 12,
				timeRemaining: "5m 12s",
			},
			{
				id: "4",
				name: "image.jpg",
				progress: 100,
				timeRemaining: "Complete",
			},
		],
		[],
	);

	return (
		<ItemGroup>
			{files.map((file) => (
				<Item key={file.id} size="xs" className="px-0">
					<ItemMedia variant="icon">
						<FileIcon className="size-5" />
					</ItemMedia>
					<ItemContent className="inline-block truncate">
						<ItemTitle className="inline">{file.name}</ItemTitle>
					</ItemContent>
					<ItemContent>
						<Progress value={file.progress} className="w-32" />
					</ItemContent>
					<ItemActions className="w-16 justify-end">
						<span className="text-text-subtle text-sm">{file.timeRemaining}</span>
					</ItemActions>
				</Item>
			))}
		</ItemGroup>
	);
}

export function ProgressDemoProgressBar() {
	return (
		<div className="flex w-full flex-col gap-4">
			<Progress value={0} />
			<Progress value={25} className="w-full" />
			<Progress value={50} />
			<Progress value={75} />
			<Progress value={100} />
		</div>
	);
}

export function ProgressDemoWithLabel() {
	return (
		<Progress value={56}>
			<ProgressLabel>Upload progress</ProgressLabel>
			<ProgressValue />
		</Progress>
	);
}

export function ProgressDemoZero() {
	return <Progress value={0} className="w-full max-w-md" />;
}
