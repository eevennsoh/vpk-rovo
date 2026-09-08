"use client";

import { useState } from "react";
import ChevronRightIcon from "@atlaskit/icon/core/chevron-right";
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
import { Icon } from "@/components/ui/icon";
import {
	JiraIssueAgentAndSkillSubmenus,
	type JiraIssueGenerativeActionConfig,
	type JiraIssueGenerativeActionIssue,
} from "./generative-action-menu";

export type JiraIssueMoreAction =
	| "move-work-item"
	| "change-status"
	| "copy-link"
	| "copy-key"
	| "add-agent"
	| "link-confluence-item"
	| "link-work-item"
	| "change-parent"
	| "select-cover"
	| "edit-labels"
	| "add-flag";

interface JiraIssueMoreMenuProps {
	issueKey: string;
	onActionSelect?: (action: JiraIssueMoreAction) => void;
	onOpenChange?: (open: boolean) => void;
	generativeAction?: JiraIssueGenerativeActionConfig;
	generativeActionIssue?: JiraIssueGenerativeActionIssue;
}

const CHEVRON = <ChevronRightIcon label="" size="small" color="currentColor" />;

function JiraIssueMoreMenu({ generativeAction, generativeActionIssue, issueKey, onActionSelect, onOpenChange }: Readonly<JiraIssueMoreMenuProps>) {
	const [open, setOpen] = useState(false);

	function handleOpenChange(nextOpen: boolean) {
		setOpen(nextOpen);
		onOpenChange?.(nextOpen);
	}

	function select(action: JiraIssueMoreAction) {
		return () => onActionSelect?.(action);
	}

	return (
		<DropdownMenu open={open} onOpenChange={handleOpenChange}>
			<DropdownMenuTrigger
				render={
					<Button
						aria-label={`More actions for ${issueKey}`}
						className="pointer-events-none size-6 opacity-0 transition-opacity duration-fast ease-out-practical motion-reduce:transition-none group-hover/jira-issue:pointer-events-auto group-hover/jira-issue:opacity-100 group-has-[:focus-visible]/jira-issue:pointer-events-auto group-has-[:focus-visible]/jira-issue:opacity-100 data-popup-open:pointer-events-auto data-popup-open:opacity-100"
						onClick={(event) => event.stopPropagation()}
						size="icon-compact"
						type="button"
						variant="ghost"
					/>
				}
			>
				<Icon render={<ShowMoreHorizontalIcon label="" size="small" color="currentColor" />} />
			</DropdownMenuTrigger>
			<DropdownMenuContent align="start" className="max-h-none w-[280px]" side="right" sideOffset={8}>
				{generativeAction && generativeActionIssue ? (
					<>
						<JiraIssueAgentAndSkillSubmenus
							action={generativeAction}
							issue={generativeActionIssue}
							onRequestClose={() => handleOpenChange(false)}
						/>
						<DropdownMenuSeparator />
					</>
				) : null}
				<DropdownMenuGroup>
					<DropdownMenuItem elemAfter={CHEVRON} onSelect={select("move-work-item")}>Move work item</DropdownMenuItem>
					<DropdownMenuItem elemAfter={CHEVRON} onSelect={select("change-status")}>Change status</DropdownMenuItem>
				</DropdownMenuGroup>
				<DropdownMenuSeparator />
				<DropdownMenuGroup>
					<DropdownMenuItem onSelect={select("copy-link")}>Copy link</DropdownMenuItem>
					<DropdownMenuItem onSelect={select("copy-key")}>Copy key</DropdownMenuItem>
				</DropdownMenuGroup>
				<DropdownMenuSeparator />
				<DropdownMenuGroup>
					{generativeAction ? null : <DropdownMenuItem elemAfter={CHEVRON} onSelect={select("add-agent")}>Add agent</DropdownMenuItem>}
					<DropdownMenuItem elemAfter={CHEVRON} onSelect={select("link-confluence-item")}>Link Confluence item</DropdownMenuItem>
					<DropdownMenuItem elemAfter={CHEVRON} onSelect={select("link-work-item")}>Link work item</DropdownMenuItem>
					<DropdownMenuItem elemAfter={CHEVRON} onSelect={select("change-parent")}>Change parent</DropdownMenuItem>
					<DropdownMenuItem elemAfter={CHEVRON} onSelect={select("select-cover")}>Select cover</DropdownMenuItem>
					<DropdownMenuItem elemAfter={CHEVRON} onSelect={select("edit-labels")}>Edit labels</DropdownMenuItem>
					<DropdownMenuItem elemAfter={CHEVRON} onSelect={select("add-flag")}>Add flag</DropdownMenuItem>
				</DropdownMenuGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

export { JiraIssueMoreMenu };
