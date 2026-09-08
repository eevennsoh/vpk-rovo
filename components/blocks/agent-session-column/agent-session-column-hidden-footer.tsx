"use client";

import ChevronLeftIcon from "@atlaskit/icon/core/chevron-left";
import ChevronRightIcon from "@atlaskit/icon/core/chevron-right";

import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

export type AgentSessionColumnWellFooterMode = "hidden" | "back";

/**
 * Last cell of the session well. Two modes share the same chrome — a full-width
 * row under the scrollport, square corners, hover fill, 12px chevron — so the
 * well can own the outer stroke and bottom radius.
 *
 * `hidden` is Archived N and opens the archived list. `back` is Back to
 * unattached sessions N (the active/unattached count) and returns to that list.
 */
export function AgentSessionColumnHiddenFooter({
	count,
	mode,
	onClick,
	title = "Unattached sessions",
}: Readonly<{
	count: number;
	mode: AgentSessionColumnWellFooterMode;
	onClick: () => void;
	title?: string;
}>) {
	const isBack = mode === "back";
	const sessionWord = count === 1 ? "session" : "sessions";

	return (
		<button
			aria-label={isBack ? `Back to ${title}` : `Show ${count} archived ${sessionWord}`}
			className={cn(
				"flex w-full shrink-0 cursor-pointer items-center justify-between",
				"rounded-none rounded-b-none border-0 border-t border-solid border-border-disabled bg-transparent p-3 text-left",
				"hover:bg-surface-hovered",
				"transition-[border-color,background-color] duration-xxshort ease-out-practical",
				"motion-reduce:transition-none",
			)}
			onClick={onClick}
			type="button"
		>
			<span className="flex min-w-0 items-center gap-1.5">
				<span className="truncate text-xs font-medium leading-4 text-text-subtle">
					{isBack ? "Back to unattached sessions" : "Archived"}
				</span>
				<span className="shrink-0 text-xs font-normal text-text-subtlest">
					{count}
				</span>
			</span>
			<Icon
				className="text-icon-subtle"
				data-icon="inline-end"
				render={isBack ? (
					<ChevronLeftIcon label="" size="small" />
				) : (
					<ChevronRightIcon label="" size="small" />
				)}
			/>
		</button>
	);
}
