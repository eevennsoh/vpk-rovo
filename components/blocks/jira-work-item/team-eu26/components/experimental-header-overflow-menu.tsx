"use client";

import { Fragment } from "react";

import {
	useJiraWorkItemMeta,
	useJiraWorkItemState,
} from "@/components/blocks/jira-work-item/team-eu26/context-jira-work-item";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuShortcut,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ChevronRightIcon from "@atlaskit/icon/core/chevron-right";
import ShowMoreHorizontalIcon from "@atlaskit/icon/core/show-more-horizontal";

type OverflowMenuAction = "copy-markdown";

type OverflowMenuEntry = Readonly<{
	label: string;
	/** Single-key Jira accelerator, rendered as a trailing keycap. */
	shortcut?: string;
	/** Trailing count, used for the watcher tally moved out of the header. */
	count?: number;
	/**
	 * Shows the trailing "has more" chevron without wiring up a flyout. Keeps the
	 * Jira affordance visible for rows whose nested surface is not built yet.
	 */
	chevron?: boolean;
	/** Nested destinations. Presence turns the row into a submenu trigger. */
	submenu?: readonly string[];
	/** Wired action. Unset rows are presentational placeholders. */
	action?: OverflowMenuAction;
}>;

/**
 * Work-item overflow actions, grouped the way Jira renders them. Each inner
 * array is one visually separated group, so the dividers are derived from the
 * group boundaries and can never drift out of sync with the rows.
 *
 * The first group holds the restriction, watcher, and share actions that used
 * to sit as icon buttons in the header row; folding them in here keeps the
 * breadcrumb row down to the overflow, collapse, and close controls.
 */
const OVERFLOW_MENU_GROUPS: readonly (readonly OverflowMenuEntry[])[] = [
	[{ label: "Permission" }, { label: "Watch", count: 1 }, { label: "Share" }],
	[{ label: "Give feedback" }],
	[
		{ label: "Log work", shortcut: "Q" },
		{ label: "Add flag" },
		{ label: "Stop watching", shortcut: "W" },
		{ label: "Add vote" },
		{ label: "Select cover", chevron: true },
	],
	[{ label: "Classify work item" }],
	[{ label: "Clone" }, { label: "Move" }, { label: "Add parent" }],
	[{ label: "Connect Slack channel" }],
	[
		{ label: "Copy work item as markdown", action: "copy-markdown" },
		{ label: "Print" },
		{ label: "Export to", submenu: ["Excel", "Word", "XML"] },
	],
];

/** Same markdown payload the description-row Copy button used to write. */
function copyWorkItemAsMarkdown(workItemCode: string, title: string, descriptionMarkdown: string) {
	const description = descriptionMarkdown.trim();
	const markdown = `# ${workItemCode}: ${title}${description ? `\n\n${description}` : ""}`;
	void navigator.clipboard.writeText(markdown);
}

/** Trailing slot for a row: a keycap, a count badge, a chevron, or nothing. */
function overflowMenuItemElemAfter(entry: OverflowMenuEntry) {
	if (entry.shortcut) {
		return <DropdownMenuShortcut>{entry.shortcut}</DropdownMenuShortcut>;
	}

	if (entry.count !== undefined) {
		return <Badge>{entry.count}</Badge>;
	}

	return entry.chevron ? <ChevronRightIcon label="" size="small" /> : undefined;
}

function overflowMenuItemOnSelect(
	action: OverflowMenuAction | undefined,
	copyWorkItemAsMarkdownHandler: () => void,
): (() => void) | undefined {
	if (action === undefined) {
		return undefined;
	}

	switch (action) {
		case "copy-markdown":
			return copyWorkItemAsMarkdownHandler;
		default: {
			const _exhaustive: never = action;
			return _exhaustive;
		}
	}
}

/**
 * Overflow ("…") menu for the experimental v5 work-item header. The dialog
 * paints at z-[500]/[501], so the positioners are lifted above it the same way
 * the Open in menu does — otherwise the popup mounts behind the modal surface.
 */
export function ExperimentalHeaderOverflowMenu() {
	const { contextResources } = useJiraWorkItemState();
	const { workItem } = useJiraWorkItemMeta();
	const handleCopyWorkItemAsMarkdown = () => {
		copyWorkItemAsMarkdown(workItem.code, contextResources.title, contextResources.description);
	};

	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				render={
					<Button aria-label="Actions" size="icon" variant="ghost">
						<ShowMoreHorizontalIcon label="" />
					</Button>
				}
			/>
			{/*
			 * The shared popup caps itself at 328px, which would hide roughly a
			 * third of these rows behind a scroll. This menu is a flat list of
			 * work-item actions, so it opens to its full height and only falls
			 * back to scrolling when the viewport itself is the constraint.
			 */}
			<DropdownMenuContent
				align="end"
				className="max-h-[var(--available-height)]"
				positionerClassName="z-[502]"
			>
				{OVERFLOW_MENU_GROUPS.map((group, groupIndex) => (
					<Fragment key={group[0].label}>
						{groupIndex > 0 ? <DropdownMenuSeparator /> : null}
						<DropdownMenuGroup>
							{group.map((entry) =>
								entry.submenu ? (
									<DropdownMenuSub key={entry.label}>
										<DropdownMenuSubTrigger>{entry.label}</DropdownMenuSubTrigger>
										<DropdownMenuSubContent positionerClassName="z-[503]">
											{entry.submenu.map((option) => (
												<DropdownMenuItem key={option}>{option}</DropdownMenuItem>
											))}
										</DropdownMenuSubContent>
									</DropdownMenuSub>
								) : (
									<DropdownMenuItem
										key={entry.label}
										elemAfter={overflowMenuItemElemAfter(entry)}
										onSelect={overflowMenuItemOnSelect(entry.action, handleCopyWorkItemAsMarkdown)}
									>
										{entry.label}
									</DropdownMenuItem>
								),
							)}
						</DropdownMenuGroup>
					</Fragment>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
