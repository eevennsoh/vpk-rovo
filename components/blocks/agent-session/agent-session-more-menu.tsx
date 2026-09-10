"use client";

import type { ReactNode } from "react";

import TerminalIcon from "@atlaskit/icon-lab/core/terminal";
import DeleteIcon from "@atlaskit/icon/core/delete";
import EditIcon from "@atlaskit/icon/core/edit";
import LinkBrokenIcon from "@atlaskit/icon/core/link-broken";
import ShowMoreHorizontalIcon from "@atlaskit/icon/core/show-more-horizontal";

import { AgentAvatarVisual } from "@/components/ui-custom/agent-avatar-visual";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Icon } from "@/components/ui/icon";
import { LogoThirdParty } from "@/components/ui/logo-third-party";
import { cn } from "@/lib/utils";

import type { AgentSessionItem } from "./agent-session-types";

/**
 * The one action a session row offers, by host.
 *
 * A local session lives on the viewer's machine, so its actions are about
 * getting back into it — reopen the agent, or take the prompt to a terminal. A
 * cloud session lives on the server, where the row is a handle on a remote
 * record, so its actions are about the record: unlink it from work, rename it,
 * delete it. Only Dismiss is common to both, which is why it sits below a
 * separator in each menu.
 *
 * An item whose capability the host did not supply renders disabled rather than
 * enabled-and-inert — an enabled control backed by nothing is a lie about what
 * this surface can do.
 */
export interface AgentSessionMoreMenuActions {
	/** Reopen the session in its own agent. Labeled with the agent's name. */
	onContinueInAgent?: () => void;
	/** Copy the resume prompt for a terminal. Local only. */
	onCopyPrompt?: () => void;
	/** Remove the row from this list. Wired to the host's archive/hide capability. */
	onDismiss?: () => void;
	/** Break the session's link to its work item. Cloud only. */
	onUnlink?: () => void;
	/** Rename the session. Cloud only. */
	onRename?: () => void;
	/** Delete the session record. Cloud only. */
	onDelete?: () => void;
}

/** The agent's own mark for the "Continue in" row: brand tile, else its avatar. */
function AgentMenuGlyph({ agent }: Readonly<{ agent: AgentSessionItem["agent"] }>): ReactNode {
	if (agent.brandName) {
		return <LogoThirdParty borderless name={agent.brandName} size="xxsmall" />;
	}

	return <AgentAvatarVisual avatarSrc={agent.avatarSrc} label="" sizePx={16} vpkLogo={agent.vpkLogo} />;
}

export function AgentSessionMoreMenu({
	actions,
	dismissLabel = "Dismiss",
	isCloud,
	item,
	onOpenChange,
	open,
}: Readonly<{
	actions: AgentSessionMoreMenuActions;
	/**
	 * Copy for the shared bottom row. "Dismiss" in an active list; the archived
	 * view passes "Unarchive", where the same capability restores rather than hides.
	 */
	dismissLabel?: string;
	/** Cloud sessions get the record actions; local sessions get the continue-in group. */
	isCloud: boolean;
	item: AgentSessionItem;
	onOpenChange: (open: boolean) => void;
	open: boolean;
}>) {
	return (
		<DropdownMenu onOpenChange={onOpenChange} open={open}>
			<DropdownMenuTrigger
				render={(
					<Button
						aria-label={`More actions for ${item.title}`}
						className={cn(open && "bg-surface-hovered")}
						// The card owns pointerdown for drag; the trigger is not a drag handle.
						onPointerDown={(event) => event.stopPropagation()}
						size="icon-compact"
						type="button"
						variant="ghost"
					/>
				)}
			>
				<Icon
					className="text-icon-subtle"
					render={<ShowMoreHorizontalIcon color="currentColor" label="" size="small" />}
				/>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="min-w-44">
				{isCloud ? (
					<>
						<DropdownMenuItem
							disabled={actions.onUnlink === undefined}
							elemBefore={<LinkBrokenIcon label="" size="small" />}
							onSelect={() => actions.onUnlink?.()}
						>
							Unlink
						</DropdownMenuItem>
						<DropdownMenuItem
							disabled={actions.onRename === undefined}
							elemBefore={<EditIcon label="" size="small" />}
							onSelect={() => actions.onRename?.()}
						>
							Rename
						</DropdownMenuItem>
						<DropdownMenuItem
							disabled={actions.onDelete === undefined}
							elemBefore={<DeleteIcon label="" size="small" />}
							onSelect={() => actions.onDelete?.()}
							variant="destructive"
						>
							Delete
						</DropdownMenuItem>
					</>
				) : (
					// Base UI requires a Group around a GroupLabel — "Continue in" heads
					// these two rows, so they are a group in the accessibility tree too,
					// not just visually.
					<DropdownMenuGroup>
						<DropdownMenuLabel>Continue in</DropdownMenuLabel>
						<DropdownMenuItem
							disabled={actions.onContinueInAgent === undefined}
							elemBefore={<AgentMenuGlyph agent={item.agent} />}
							onSelect={() => actions.onContinueInAgent?.()}
						>
							{item.agent.name}
						</DropdownMenuItem>
						<DropdownMenuItem
							description="Copy prompt"
							disabled={actions.onCopyPrompt === undefined}
							elemBefore={<TerminalIcon label="" size="small" />}
							onSelect={() => actions.onCopyPrompt?.()}
						>
							Terminal
						</DropdownMenuItem>
					</DropdownMenuGroup>
				)}
				<DropdownMenuSeparator />
				<DropdownMenuItem
					disabled={actions.onDismiss === undefined}
					onSelect={() => actions.onDismiss?.()}
				>
					{dismissLabel}
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
