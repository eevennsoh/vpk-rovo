"use client";

import { useState } from "react";

import ChevronDownIcon from "@atlaskit/icon/core/chevron-down";

import type { PullRequestSortMode } from "@/components/blocks/jira-work-item/team-eu26/lib/pull-request-phases";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Icon } from "@/components/ui/icon";

/** Trigger keeps Activity's short "Show …" form; menu items drop the prefix. */
const SORT_TRIGGER_LABELS: Record<PullRequestSortMode, string> = {
	"by-me": "Show by me",
	"latest-activity": "Show latest activity",
	"newest-created": "Show newest created",
	"oldest-created": "Show oldest created",
	"largest-change": "Show largest change",
};

const SORT_MENU_LABELS: Record<PullRequestSortMode, string> = {
	"by-me": "By me",
	"latest-activity": "Latest activity",
	"newest-created": "Newest created",
	"oldest-created": "Oldest created",
	"largest-change": "Largest change",
};

const SORT_MENU_ORDER: readonly PullRequestSortMode[] = [
	"by-me",
	"latest-activity",
	"newest-created",
	"oldest-created",
	"largest-change",
];

const TEXT_LINK_TRIGGER_CLASS =
	"h-auto gap-1 border-0 bg-transparent px-0 text-xs font-normal text-text-subtlest [&_svg]:text-icon-subtlest hover:bg-transparent hover:text-text-subtlest hover:underline focus-visible:ring-0 aria-expanded:bg-transparent aria-expanded:text-text-subtlest aria-expanded:underline";

/**
 * Inset ghost chevron for panel segments. `my-1 me-1` keeps the 4px shell
 * inset on top/right/bottom of a size-6 control in the h-8 segment; start
 * margin is omitted so the segment's `gap-1.5` alone is the 6px label→icon gap.
 *
 * No `aria-pressed` on the chevron — the segment shell owns selected chrome.
 * Menu-open uses Button's default `aria-expanded` selected border/fill.
 */
// Ring killed — segment shell recolors its existing border on chevron focus.
const CHEVRON_TRIGGER_CLASS =
	"my-1 me-1 shrink-0 border-transparent shadow-none focus-visible:border-transparent focus-visible:ring-0! focus-visible:ring-offset-0!";

function stopTriggerPropagation(event: { stopPropagation(): void }): void {
	event.stopPropagation();
}

/**
 * Dropdown for Pull requests panel ordering. Same chrome as
 * `JiraActivityViewControl`, but a dedicated mode list so Activity's
 * Activity Latest/Oldest/Agents/Needs input/Comments control stays unchanged.
 *
 * `trigger="label"` is the text-link chrome; `trigger="chevron"` is the inset
 * ghost icon control for segmented toggle groups.
 */
export function PullRequestSortControl({
	sortMode,
	onSortModeChange,
	menuAlign = "start",
	trigger = "label",
	onOpenChange,
}: Readonly<{
	sortMode: PullRequestSortMode;
	onSortModeChange: (next: PullRequestSortMode) => void;
	/** Menu alignment relative to the trigger. Prefer `end` when the control sits on the far right. */
	menuAlign?: "start" | "end";
	/** `label` = text-link trigger; `chevron` = inset ghost icon in a panel segment. */
	trigger?: "label" | "chevron";
	/**
	 * @deprecated Segment shell owns selected chrome; chevron selected look is
	 * `aria-expanded` while the sort menu is open. Accepted and ignored.
	 */
	pressed?: boolean;
	onOpenChange?: (open: boolean) => void;
}>) {
	const [open, setOpen] = useState(false);
	const isChevron = trigger === "chevron";
	const triggerButton = isChevron ? (
		<Button
			aria-label={`Sort pull requests (${SORT_TRIGGER_LABELS[sortMode]})`}
			className={CHEVRON_TRIGGER_CLASS}
			data-jira-work-item-pull-request-sort-trigger
			size="icon-compact"
			type="button"
			variant="ghost"
			onClick={stopTriggerPropagation}
			onPointerDown={stopTriggerPropagation}
		/>
	) : (
		<Button
			className={TEXT_LINK_TRIGGER_CLASS}
			size="compact"
			type="button"
			variant="ghost"
		/>
	);

	return (
		<DropdownMenu
			open={open}
			onOpenChange={(next) => {
				setOpen(next);
				onOpenChange?.(next);
			}}
		>
			<DropdownMenuTrigger render={triggerButton}>
				{isChevron ? null : SORT_TRIGGER_LABELS[sortMode]}
				<Icon aria-hidden render={<ChevronDownIcon label="" />} />
			</DropdownMenuTrigger>
			<DropdownMenuContent
				align={menuAlign}
				className="w-auto min-w-0"
				positionerClassName="z-[502]"
			>
				<DropdownMenuRadioGroup
					onValueChange={(value) => {
						onSortModeChange(value as PullRequestSortMode);
						// Nested menus: radio select does not always dismiss; close
						// explicitly (same as context-popover-parts).
						setOpen(false);
						onOpenChange?.(false);
					}}
					value={sortMode}
				>
					{SORT_MENU_ORDER.map((mode) => (
						<DropdownMenuRadioItem key={mode} value={mode}>
							{SORT_MENU_LABELS[mode]}
						</DropdownMenuRadioItem>
					))}
				</DropdownMenuRadioGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
