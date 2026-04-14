"use client";

import React from "react";
import { token } from "@/lib/tokens";
import { Button } from "@/components/ui/button";
import CopyIcon from "@atlaskit/icon/core/copy";
import InformationCircleIcon from "@atlaskit/icon/core/information-circle";
import ThumbsDownIcon from "@atlaskit/icon/core/thumbs-down";
import ThumbsUpIcon from "@atlaskit/icon/core/thumbs-up";


interface SummaryFooterProps {
	/** Whether to stop event propagation on button clicks */
	stopPropagation?: boolean;
}

/**
 * Footer actions for AI summary panel with feedback buttons and disclaimer
 */
export default function SummaryFooter({
	stopPropagation = false,
}: Readonly<SummaryFooterProps>): React.ReactElement {
	function handleThumbsUp(e: React.MouseEvent): void {
		if (stopPropagation) e.stopPropagation();
	}

	function handleThumbsDown(e: React.MouseEvent): void {
		if (stopPropagation) e.stopPropagation();
	}

	function handleCopy(e: React.MouseEvent): void {
		if (stopPropagation) e.stopPropagation();
	}

	return (
		<div
			style={{
				display: "flex",
				justifyContent: "space-between",
				alignItems: "center",
			}}
		>
			<div className="flex items-center gap-1">
				<InformationCircleIcon label="Information" color={token("color.icon.subtle")} />
				<span className="text-xs text-text-subtle">
					Uses AI. Verify results.
				</span>
			</div>

			<div className="flex gap-1">
				<Button aria-label="Helpful" size="icon-sm" variant="ghost" onClick={handleThumbsUp}>
					<ThumbsUpIcon label="" size="small" />
				</Button>
				<Button aria-label="Not helpful" size="icon-sm" variant="ghost" onClick={handleThumbsDown}>
					<ThumbsDownIcon label="" size="small" />
				</Button>
				<Button aria-label="Copy" size="icon-sm" variant="ghost" onClick={handleCopy}>
					<CopyIcon label="" size="small" />
				</Button>
			</div>
		</div>
	);
}
