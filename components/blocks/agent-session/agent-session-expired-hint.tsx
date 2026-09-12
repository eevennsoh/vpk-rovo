"use client";

import CrossIcon from "@atlaskit/icon/core/cross";

import { Button } from "@/components/ui/button";
import { IconTile } from "@/components/ui/icon-tile";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export const AGENT_SESSION_EXPIRED_HINT =
	"Agent session history is only kept for 28 days. This session can no longer be resumed.";

/**
 * Trailing control for a cloud session past the 28-day history window.
 *
 * Replaces both the owner more-menu and the lifecycle spinner / question /
 * check. The X is decorative; the button name and tooltip carry the same copy
 * so hover and keyboard both get it.
 */
export function AgentSessionExpiredHint() {
	return (
		<Tooltip>
			<TooltipTrigger
				render={
					<Button
						aria-label={AGENT_SESSION_EXPIRED_HINT}
						className="[&_svg:not([class*='size-'])]:size-4!"
						onClick={(event) => event.stopPropagation()}
						onPointerDown={(event) => event.stopPropagation()}
						size="icon-compact"
						type="button"
						variant="ghost"
					/>
				}
			>
				<IconTile
					aria-hidden
					as="span"
					className="text-icon-subtle"
					icon={<CrossIcon color="currentColor" label="" size="medium" />}
					iconSize="medium"
					label=""
					size="small"
					variant="transparent"
				/>
			</TooltipTrigger>
			<TooltipContent>{AGENT_SESSION_EXPIRED_HINT}</TooltipContent>
		</Tooltip>
	);
}
