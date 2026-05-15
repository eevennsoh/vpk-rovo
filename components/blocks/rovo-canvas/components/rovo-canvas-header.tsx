"use client";

import CrossIcon from "@atlaskit/icon/core/cross";
import ShowMoreHorizontalIcon from "@atlaskit/icon/core/show-more-horizontal";

import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Lozenge } from "@/components/ui/lozenge";
import { DialogTitle } from "@/components/ui/dialog";
import { Icon as VpkIcon } from "@/components/ui/icon";

interface RovoCanvasHeaderProps {
	title: string;
	lozengeLabel: string;
	primaryActionLabel: string;
	onPrimaryAction?: () => void;
	onClose: () => void;
}

export function RovoCanvasHeader({
	title,
	lozengeLabel,
	primaryActionLabel,
	onPrimaryAction,
	onClose,
}: Readonly<RovoCanvasHeaderProps>): React.ReactElement {
	return (
		<header className="flex min-h-10 shrink-0 items-center justify-between gap-4 px-3 py-1">
			<div className="flex min-w-0 items-center gap-2">
				<DialogTitle className="truncate text-sm leading-5 font-bold text-text">
					{title}
				</DialogTitle>
				<Lozenge variant="neutral" isBold>
					{lozengeLabel}
				</Lozenge>
			</div>

			<div className="flex shrink-0 items-center gap-2">
				<Button size="sm" onClick={onPrimaryAction}>
					{primaryActionLabel}
				</Button>
				<DropdownMenu>
					<DropdownMenuTrigger
						render={
							<Button aria-label="More canvas actions" size="icon-sm" variant="outline">
								<VpkIcon render={<ShowMoreHorizontalIcon label="" />} />
							</Button>
						}
					/>
					<DropdownMenuContent align="end" className="w-48">
						<DropdownMenuGroup>
							<DropdownMenuItem>Share</DropdownMenuItem>
							<DropdownMenuItem>Duplicate</DropdownMenuItem>
							<DropdownMenuItem>Save as app</DropdownMenuItem>
							<DropdownMenuItem>Export HTML</DropdownMenuItem>
						</DropdownMenuGroup>
						<DropdownMenuSeparator />
						<DropdownMenuGroup>
							<DropdownMenuItem>Start from scratch</DropdownMenuItem>
						</DropdownMenuGroup>
					</DropdownMenuContent>
				</DropdownMenu>
				<Button aria-label="Close canvas" size="icon-sm" variant="outline" onClick={onClose}>
					<VpkIcon render={<CrossIcon label="" />} />
				</Button>
			</div>
		</header>
	);
}
