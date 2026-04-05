"use client";

import AtlaskitBoldIcon from "@atlaskit/icon/core/text-bold";
import AtlaskitItalicIcon from "@atlaskit/icon/core/text-italic";
import AtlaskitUnderlineIcon from "@atlaskit/icon/core/text-underline";
import { AlignCenterIcon, AlignLeftIcon, AlignRightIcon, ArrowDownIcon, ArrowUpIcon, BoldIcon, BookmarkIcon, HeartIcon, ItalicIcon, StarIcon, TrendingUpIcon, UnderlineIcon } from "@/components/ui/vpk-icons";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

export default function ToggleGroupDemo() {
	return (
		<ToggleGroup defaultValue={["center"]}>
			<ToggleGroupItem value="left" aria-label="Left"><AlignLeftIcon className="size-4" /></ToggleGroupItem>
			<ToggleGroupItem value="center" aria-label="Center"><AlignCenterIcon className="size-4" /></ToggleGroupItem>
			<ToggleGroupItem value="right" aria-label="Right"><AlignRightIcon className="size-4" /></ToggleGroupItem>
		</ToggleGroup>
	);
}

export function ToggleGroupDemoBasic() {
	return (
		<ToggleGroup multiple spacing={1}>
			<ToggleGroupItem value="bold" aria-label="Toggle bold">
				<BoldIcon
				/>
			</ToggleGroupItem>
			<ToggleGroupItem value="italic" aria-label="Toggle italic">
				<ItalicIcon
				/>
			</ToggleGroupItem>
			<ToggleGroupItem value="underline" aria-label="Toggle underline">
				<UnderlineIcon
				/>
			</ToggleGroupItem>
		</ToggleGroup>
	);
}

export function ToggleGroupDemoDateRange() {
	return (
		<ToggleGroup
			defaultValue={["today"]}
			variant="outline"
			size="sm"
			spacing={2}
		>
			<ToggleGroupItem value="today" aria-label="Today">
				Today
			</ToggleGroupItem>
			<ToggleGroupItem value="week" aria-label="This Week">
				This Week
			</ToggleGroupItem>
			<ToggleGroupItem value="month" aria-label="This Month">
				This Month
			</ToggleGroupItem>
			<ToggleGroupItem value="year" aria-label="This Year">
				This Year
			</ToggleGroupItem>
		</ToggleGroup>
	);
}

export function ToggleGroupDemoDefault() {
	return (
		<ToggleGroup>
			<ToggleGroupItem value="bold" aria-label="Toggle bold">
				<AtlaskitBoldIcon label="" />
			</ToggleGroupItem>
			<ToggleGroupItem value="italic" aria-label="Toggle italic">
				<AtlaskitItalicIcon label="" />
			</ToggleGroupItem>
			<ToggleGroupItem value="underline" aria-label="Toggle underline">
				<AtlaskitUnderlineIcon label="" />
			</ToggleGroupItem>
		</ToggleGroup>
	);
}

export function ToggleGroupDemoFilter() {
	return (
		<ToggleGroup defaultValue={["all"]} variant="outline" size="sm">
			<ToggleGroupItem value="all" aria-label="All">
				All
			</ToggleGroupItem>
			<ToggleGroupItem value="active" aria-label="Active">
				Active
			</ToggleGroupItem>
			<ToggleGroupItem value="completed" aria-label="Completed">
				Completed
			</ToggleGroupItem>
			<ToggleGroupItem value="archived" aria-label="Archived">
				Archived
			</ToggleGroupItem>
		</ToggleGroup>
	);
}

export function ToggleGroupDemoMultiple() {
	return (
		<ToggleGroup>
			<ToggleGroupItem value="bold" aria-label="Toggle bold">
				<AtlaskitBoldIcon label="" />
			</ToggleGroupItem>
			<ToggleGroupItem value="italic" aria-label="Toggle italic">
				<AtlaskitItalicIcon label="" />
			</ToggleGroupItem>
			<ToggleGroupItem value="underline" aria-label="Toggle underline">
				<AtlaskitUnderlineIcon label="" />
			</ToggleGroupItem>
		</ToggleGroup>
	);
}

export function ToggleGroupDemoOutlineWithIcons() {
	return (
		<ToggleGroup variant="outline" multiple size="sm">
			<ToggleGroupItem value="bold" aria-label="Toggle bold">
				<BoldIcon
				/>
			</ToggleGroupItem>
			<ToggleGroupItem value="italic" aria-label="Toggle italic">
				<ItalicIcon
				/>
			</ToggleGroupItem>
			<ToggleGroupItem value="underline" aria-label="Toggle underline">
				<UnderlineIcon
				/>
			</ToggleGroupItem>
		</ToggleGroup>
	);
}

export function ToggleGroupDemoOutline() {
	return (
		<ToggleGroup variant="outline" defaultValue={["all"]}>
			<ToggleGroupItem value="all" aria-label="Toggle all">
				All
			</ToggleGroupItem>
			<ToggleGroupItem value="missed" aria-label="Toggle missed">
				Missed
			</ToggleGroupItem>
		</ToggleGroup>
	);
}

export function ToggleGroupDemoSizes() {
	return (
		<div className="flex flex-col gap-4">
			<ToggleGroup size="sm" defaultValue={["top"]} variant="outline">
				<ToggleGroupItem value="top" aria-label="Toggle top">
					Top
				</ToggleGroupItem>
				<ToggleGroupItem value="bottom" aria-label="Toggle bottom">
					Bottom
				</ToggleGroupItem>
				<ToggleGroupItem value="left" aria-label="Toggle left">
					Left
				</ToggleGroupItem>
				<ToggleGroupItem value="right" aria-label="Toggle right">
					Right
				</ToggleGroupItem>
			</ToggleGroup>
			<ToggleGroup defaultValue={["top"]} variant="outline">
				<ToggleGroupItem value="top" aria-label="Toggle top">
					Top
				</ToggleGroupItem>
				<ToggleGroupItem value="bottom" aria-label="Toggle bottom">
					Bottom
				</ToggleGroupItem>
				<ToggleGroupItem value="left" aria-label="Toggle left">
					Left
				</ToggleGroupItem>
				<ToggleGroupItem value="right" aria-label="Toggle right">
					Right
				</ToggleGroupItem>
			</ToggleGroup>
		</div>
	);
}

export function ToggleGroupDemoSort() {
	return (
		<ToggleGroup defaultValue={["newest"]} variant="outline" size="sm">
			<ToggleGroupItem value="newest" aria-label="Newest">
				<ArrowDownIcon
				/>
				Newest
			</ToggleGroupItem>
			<ToggleGroupItem value="oldest" aria-label="Oldest">
				<ArrowUpIcon
				/>
				Oldest
			</ToggleGroupItem>
			<ToggleGroupItem value="popular" aria-label="Popular">
				<TrendingUpIcon
				/>
				Popular
			</ToggleGroupItem>
		</ToggleGroup>
	);
}

export function ToggleGroupDemoVerticalOutlineWithIcons() {
	return (
		<ToggleGroup variant="outline" multiple orientation="vertical" size="sm">
			<ToggleGroupItem value="bold" aria-label="Toggle bold">
				<BoldIcon
				/>
			</ToggleGroupItem>
			<ToggleGroupItem value="italic" aria-label="Toggle italic">
				<ItalicIcon
				/>
			</ToggleGroupItem>
			<ToggleGroupItem value="underline" aria-label="Toggle underline">
				<UnderlineIcon
				/>
			</ToggleGroupItem>
		</ToggleGroup>
	);
}

export function ToggleGroupDemoVerticalOutline() {
	return (
		<ToggleGroup
			variant="outline"
			defaultValue={["all"]}
			orientation="vertical"
			size="sm"
		>
			<ToggleGroupItem value="all" aria-label="Toggle all">
				All
			</ToggleGroupItem>
			<ToggleGroupItem value="active" aria-label="Toggle active">
				Active
			</ToggleGroupItem>
			<ToggleGroupItem value="completed" aria-label="Toggle completed">
				Completed
			</ToggleGroupItem>
			<ToggleGroupItem value="archived" aria-label="Toggle archived">
				Archived
			</ToggleGroupItem>
		</ToggleGroup>
	);
}

export function ToggleGroupDemoVerticalWithSpacing() {
	return (
		<ToggleGroup
			size="sm"
			defaultValue={["top"]}
			variant="outline"
			orientation="vertical"
			spacing={1}
		>
			<ToggleGroupItem value="top" aria-label="Toggle top">
				Top
			</ToggleGroupItem>
			<ToggleGroupItem value="bottom" aria-label="Toggle bottom">
				Bottom
			</ToggleGroupItem>
			<ToggleGroupItem value="left" aria-label="Toggle left">
				Left
			</ToggleGroupItem>
			<ToggleGroupItem value="right" aria-label="Toggle right">
				Right
			</ToggleGroupItem>
		</ToggleGroup>
	);
}

export function ToggleGroupDemoVertical() {
	return (
		<ToggleGroup multiple orientation="vertical" spacing={1}>
			<ToggleGroupItem value="bold" aria-label="Toggle bold">
				<BoldIcon
				/>
			</ToggleGroupItem>
			<ToggleGroupItem value="italic" aria-label="Toggle italic">
				<ItalicIcon
				/>
			</ToggleGroupItem>
			<ToggleGroupItem value="underline" aria-label="Toggle underline">
				<UnderlineIcon
				/>
			</ToggleGroupItem>
		</ToggleGroup>
	);
}

export function ToggleGroupDemoWithIcons() {
	return (
		<ToggleGroup multiple variant="outline" spacing={2} size="sm">
			<ToggleGroupItem
				value="star"
				aria-label="Toggle star"
				className="aria-pressed:*:[svg]:fill-foreground aria-pressed:*:[svg]:stroke-foreground aria-pressed:bg-transparent"
			>
				<StarIcon
				/>
				Star
			</ToggleGroupItem>
			<ToggleGroupItem
				value="heart"
				aria-label="Toggle heart"
				className="aria-pressed:*:[svg]:fill-foreground aria-pressed:*:[svg]:stroke-foreground aria-pressed:bg-transparent"
			>
				<HeartIcon
				/>
				Heart
			</ToggleGroupItem>
			<ToggleGroupItem
				value="bookmark"
				aria-label="Toggle bookmark"
				className="aria-pressed:*:[svg]:fill-foreground aria-pressed:*:[svg]:stroke-foreground aria-pressed:bg-transparent"
			>
				<BookmarkIcon
				/>
				Bookmark
			</ToggleGroupItem>
		</ToggleGroup>
	);
}

export function ToggleGroupDemoWithInputAndSelect() {
	const items = [
		{ label: "All", value: "all" },
		{ label: "Active", value: "active" },
		{ label: "Archived", value: "archived" },
	];
	return (
		<div className="flex items-center gap-2">
			<Input type="search" placeholder="Search..." className="flex-1" />
			<Select items={items} defaultValue={items[0]}>
				<SelectTrigger className="w-32">
					<SelectValue />
				</SelectTrigger>
				<SelectContent>
					<SelectGroup>
						{items.map((item) => (
							<SelectItem key={item.value} value={item.value}>
								{item.label}
							</SelectItem>
						))}
					</SelectGroup>
				</SelectContent>
			</Select>
			<ToggleGroup defaultValue={["grid"]} variant="outline">
				<ToggleGroupItem value="grid" aria-label="Grid view">
					Grid
				</ToggleGroupItem>
				<ToggleGroupItem value="list" aria-label="List view">
					List
				</ToggleGroupItem>
			</ToggleGroup>
		</div>
	);
}

export function ToggleGroupDemoWithSpacing() {
	return (
		<ToggleGroup
			size="sm"
			defaultValue={["top"]}
			variant="outline"
			spacing={2}
		>
			<ToggleGroupItem value="top" aria-label="Toggle top">
				Top
			</ToggleGroupItem>
			<ToggleGroupItem value="bottom" aria-label="Toggle bottom">
				Bottom
			</ToggleGroupItem>
			<ToggleGroupItem value="left" aria-label="Toggle left">
				Left
			</ToggleGroupItem>
			<ToggleGroupItem value="right" aria-label="Toggle right">
				Right
			</ToggleGroupItem>
		</ToggleGroup>
	);
}
