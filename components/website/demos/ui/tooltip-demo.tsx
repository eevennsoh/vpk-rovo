"use client";

import AddIcon from "@atlaskit/icon/core/add";
import { InfoIcon, SaveIcon } from "@/components/ui/vpk-icons";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export default function TooltipDemo() {
	return (
		<TooltipProvider>
			<Tooltip>
				<TooltipTrigger render={<Button variant="outline" size="sm" />}>
					Hover me
				</TooltipTrigger>
				<TooltipContent>This is a tooltip</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	);
}

export function TooltipDemoBasic() {
	return (
		<Tooltip>
			<TooltipTrigger render={<Button variant="outline" className="w-fit" />}>
				Show Tooltip
			</TooltipTrigger>
			<TooltipContent>
				<p>Add to library</p>
			</TooltipContent>
		</Tooltip>
	);
}

export function TooltipDemoDefault() {
	return (
		<TooltipProvider>
			<Tooltip>
				<TooltipTrigger render={<Button variant="outline">Hover me</Button>} />
				<TooltipContent>
					<p>This is a tooltip</p>
				</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	);
}

export function TooltipDemoDisabled() {
	return (
		<Tooltip>
			<TooltipTrigger render={<span className="inline-block w-fit" />}>
				<Button variant="outline" disabled>
					Disabled
				</Button>
			</TooltipTrigger>
			<TooltipContent>
				<p>This feature is currently unavailable</p>
			</TooltipContent>
		</Tooltip>
	);
}

export function TooltipDemoFormattedContent() {
	return (
		<Tooltip>
			<TooltipTrigger render={<Button variant="outline" className="w-fit" />}>
				Status
			</TooltipTrigger>
			<TooltipContent>
				<div className="flex flex-col gap-1">
					<p className="font-semibold">Active</p>
					<p className="text-xs opacity-80">Last updated 2 hours ago</p>
				</div>
			</TooltipContent>
		</Tooltip>
	);
}

export function TooltipDemoIconButton() {
	return (
		<TooltipProvider>
			<Tooltip>
				<TooltipTrigger
					render={
						<Button size="icon" variant="outline">
							<AddIcon label="Add" />
						</Button>
					}
				/>
				<TooltipContent>
					<p>Add new item</p>
				</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	);
}

export function TooltipDemoLongContent() {
	return (
		<Tooltip>
			<TooltipTrigger render={<Button variant="outline" className="w-fit" />}>
				Show Tooltip
			</TooltipTrigger>
			<TooltipContent>
				To learn more about how this works, check out the docs. If you have
				any questions, please reach out to us.
			</TooltipContent>
		</Tooltip>
	);
}

export function TooltipDemoOnLink() {
	return (
		<Tooltip>
			<TooltipTrigger
				render={
					<a
						href="#"
						className="text-primary w-fit text-sm underline-offset-4 hover:underline"
						onClick={(e) => e.preventDefault()}
					/>
				}
			>
				Learn more
			</TooltipTrigger>
			<TooltipContent>
				<p>Click to read the documentation</p>
			</TooltipContent>
		</Tooltip>
	);
}

export function TooltipDemoSide() {
	return (
		<TooltipProvider>
			<Tooltip>
				<TooltipTrigger render={<Button variant="outline">Hover me</Button>} />
				<TooltipContent side="right">
					<p>This tooltip appears on the right</p>
				</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	);
}

export function TooltipDemoSides() {
	return (
		<div className="flex flex-wrap gap-2">
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
				<Tooltip key={side}>
					<TooltipTrigger
						render={<Button variant="outline" className="w-fit capitalize" />}
					>
						{side.replace("-", " ")}
					</TooltipTrigger>
					<TooltipContent side={side}>
						<p>Add to library</p>
					</TooltipContent>
				</Tooltip>
			))}
		</div>
	);
}

export function TooltipDemoWithIcon() {
	return (
		<Tooltip>
			<TooltipTrigger render={<Button variant="ghost" size="icon" />}>
				<InfoIcon
				/>
				<span className="sr-only">Info</span>
			</TooltipTrigger>
			<TooltipContent>
				<p>Additional information</p>
			</TooltipContent>
		</Tooltip>
	);
}

export function TooltipDemoWithKeyboardShortcut() {
	return (
		<Tooltip>
			<TooltipTrigger render={<Button variant="outline" size="icon-sm" />}>
				<SaveIcon
				/>
			</TooltipTrigger>
			<TooltipContent className="pr-1.5">
				<div className="flex items-center gap-2">
					Save Changes <Kbd>S</Kbd>
				</div>
			</TooltipContent>
		</Tooltip>
	);
}
