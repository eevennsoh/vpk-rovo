"use client";

import { token } from "@/lib/tokens";
import ClockIcon from "@atlaskit/icon/core/clock";

interface RecentSearchItemProps {
	query: string;
	onClick?: () => void;
}

export default function RecentSearchItem({
	query,
	onClick,
}: Readonly<RecentSearchItemProps>) {
	return (
		<button
			type="button"
			className="flex w-full flex-wrap items-center gap-3 rounded-md border-none bg-transparent px-3 py-2 text-left transition-colors duration-[var(--duration-normal)] ease-[var(--ease-out)] hover:bg-bg-neutral-subtle-hovered sm:flex-nowrap"
			onClick={onClick}
		>
			<ClockIcon label="" color={token("color.icon.subtle")} />
			<div className="min-w-0 flex-1">
				<div className="text-text" style={{ font: token("font.body") }}>
					{query}
				</div>
			</div>
			<div
				className="w-full pl-7 text-text-subtlest sm:w-auto sm:pl-0"
				style={{ font: token("font.body.small") }}
			>
				Recent search
			</div>
		</button>
	);
}
