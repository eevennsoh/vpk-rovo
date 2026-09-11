"use client";

import { useState } from "react";

import InformationCircleIcon from "@atlaskit/icon/core/information-circle";

import { Button } from "@/components/ui/button";
import { IconTile } from "@/components/ui/icon-tile";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export const AGENT_SESSION_VIEWER_HINT =
	"A team member is collaborating with an agent on this work. Only they have access.";

/**
 * Trailing control for a session the viewer does not own.
 *
 * Replaces the owner more-menu. The information icon is decorative; the button
 * name and tooltip carry the same copy so hover and keyboard both get it.
 */
export function AgentSessionViewerHint() {
	const [open, setOpen] = useState(false);

	return (
		<Tooltip onOpenChange={setOpen} open={open}>
			<TooltipTrigger
				render={
					<Button
						aria-expanded={open}
						aria-label={AGENT_SESSION_VIEWER_HINT}
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
					icon={<InformationCircleIcon color="currentColor" label="" size="medium" />}
					iconSize="medium"
					label=""
					size="small"
					variant="transparent"
				/>
			</TooltipTrigger>
			<TooltipContent positionerClassName="z-[600]">{AGENT_SESSION_VIEWER_HINT}</TooltipContent>
		</Tooltip>
	);
}
