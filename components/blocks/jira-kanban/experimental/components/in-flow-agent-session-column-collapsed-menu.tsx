"use client";

import DragHandleVerticalIcon from "@atlaskit/icon/core/drag-handle-vertical";
import GrowHorizontalIcon from "@atlaskit/icon/core/grow-horizontal";
import PinIcon from "@atlaskit/icon/core/pin";
import PinFilledIcon from "@atlaskit/icon/core/pin-filled";
import ShowMoreHorizontalIcon from "@atlaskit/icon/core/show-more-horizontal";

import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Icon } from "@/components/ui/icon";
import { inFlowCollapsedMenuPinLabel } from "../lib/in-flow-agent-session-column-interaction";

export function InFlowAgentSessionColumnCollapsedMenu({
	className,
	dragging = false,
	open = false,
	onExpand,
	onOpenChange,
	onPinnedChange,
	pinned,
	title,
}: Readonly<{
	className: string;
	dragging?: boolean;
	open?: boolean;
	onExpand: () => void;
	onOpenChange: (open: boolean) => void;
	onPinnedChange: (pinned: boolean) => void;
	pinned: boolean;
	title: string;
}>) {
	const PinGlyph = pinned ? PinFilledIcon : PinIcon;
	const TriggerGlyph = dragging ? DragHandleVerticalIcon : ShowMoreHorizontalIcon;
	// DropdownMenuItem defaults to gap-3 plus a size-6 elemBefore slot. Match
	// QuickViewActionSubmenu: 12px glyph and gap-2, no empty indicator column.
	const itemClassName = "gap-2 [&>span:first-child]:size-3 [&_svg]:size-3";

	return (
		<DropdownMenu
			onOpenChange={(nextOpen) => {
				onOpenChange(dragging ? false : nextOpen);
			}}
			open={dragging ? false : open}
		>
			<DropdownMenuTrigger
				render={
					<Button
						aria-label={`${title} column options`}
						className={className}
						data-agent-session-column-options=""
						size="icon-compact"
						style={{ width: "100%" }}
						type="button"
						variant={dragging ? "outline" : "ghost"}
					/>
				}
			>
				<Icon
					className="text-icon-subtle [&_svg]:size-3 [&_svg]:text-icon-subtle"
					render={<TriggerGlyph color="currentColor" label="" size="small" />}
				/>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="center" className="min-w-0 w-max">
				<DropdownMenuItem
					className={itemClassName}
					elemBefore={<Icon className="text-icon-subtle" render={<PinGlyph label="" size="small" />} />}
					onSelect={() => {
						onPinnedChange(!pinned);
					}}
				>
					{inFlowCollapsedMenuPinLabel(pinned)}
				</DropdownMenuItem>
				<DropdownMenuItem
					className={itemClassName}
					elemBefore={
						<Icon
							className="text-icon-subtle"
							data-agent-session-expand-glyph="grow-horizontal"
							render={<GrowHorizontalIcon label="" size="small" />}
						/>
					}
					onSelect={onExpand}
				>
					Expand
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
