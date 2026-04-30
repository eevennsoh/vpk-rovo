"use client";

import { token } from "@/lib/tokens";
import PageIcon from "@atlaskit/icon/core/page";

interface RecentItemCardProps {
	title: string;
	metadata: string;
	timestamp: string;
	onClick?: () => void;
}

export default function RecentItemCard({
	title,
	metadata,
	timestamp,
	onClick,
}: Readonly<RecentItemCardProps>) {
	return (
		<button
			type="button"
			className="flex w-full flex-wrap items-start gap-3 rounded-md border-none bg-transparent px-3 py-2 text-left transition-colors duration-normal ease-out hover:bg-bg-neutral-subtle-hovered sm:flex-nowrap"
			onClick={onClick}
		>
			<div className="mt-0.5">
				<PageIcon label="" color={token("color.icon.selected")} />
			</div>
			<div className="min-w-0 flex-1">
				<div className="mb-0.5 text-text" style={{ font: token("font.body") }}>
					{title}
				</div>
				<div className="text-text-subtlest" style={{ font: token("font.body.small") }}>
					{metadata}
				</div>
			</div>
			<div
				className="w-full pl-7 text-text-subtlest sm:w-auto sm:pl-0 sm:text-right"
				style={{ font: token("font.body.small") }}
			>
				{timestamp}
			</div>
		</button>
	);
}
