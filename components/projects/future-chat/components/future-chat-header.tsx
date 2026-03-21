"use client";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import ChevronDownIcon from "@atlaskit/icon/core/chevron-down";
import EditIcon from "@atlaskit/icon/core/edit";
import RandomizeIcon from "@atlaskit/icon-lab/core/randomize";
import ShowMoreHorizontalIcon from "@atlaskit/icon/core/show-more-horizontal";

interface FutureChatHeaderProps {
	onNewChat?: () => void;
}

export function FutureChatHeader({
	onNewChat,
}: Readonly<FutureChatHeaderProps>) {
	return (
		<header className="flex items-center gap-3 px-3 py-3">
				<Button variant="ghost">
					<Icon
						aria-hidden
						data-icon="inline-start"
						render={<RandomizeIcon label="" />}
					/>
					Auto
				<Icon
					aria-hidden
					data-icon="inline-end"
					render={<ChevronDownIcon label="" size="small" />}
				/>
			</Button>

			<div className="min-h-px min-w-px flex-1" />

			<div className="flex items-center gap-1">
				<Button
					aria-label="New chat"
					size="icon"
					variant="ghost"
					onClick={onNewChat}
				>
					<Icon aria-hidden render={<EditIcon label="" />} />
				</Button>
				<Button
					aria-label="More"
					size="icon"
					variant="ghost"
				>
					<Icon aria-hidden render={<ShowMoreHorizontalIcon label="" />} />
				</Button>
			</div>
		</header>
	);
}
