"use client";

import { useState } from "react";

import { ExperimentalHeaderOverflowMenu } from "@/components/blocks/jira-work-item/team-eu26/components/experimental-header-overflow-menu";
import { MetadataRail } from "@/components/blocks/jira-work-item/team-eu26/components/metadata-rail";
import { usePanelLayout } from "@/components/blocks/jira-work-item/team-eu26/context-panel-layout";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import PanelRightIcon from "@atlaskit/icon/core/panel-right";
import ShrinkDiagonalIcon from "@atlaskit/icon/core/shrink-diagonal";

/**
 * Breadcrumb-row actions for the experimental v5 work item. Clicking the panel
 * control docks or undocks the metadata rail. While undocked, hovering the same
 * control previews the rail in a trigger-anchored popover.
 */
export function ExperimentalBreadcrumbActions() {
	const { metadataCollapsed, metadataLayoutAnimating, toggleMetadata } = usePanelLayout();
	const [metadataPreviewOpen, setMetadataPreviewOpen] = useState(false);
	const toggleButton = (
		<Button
			aria-controls="experimental-work-item-metadata-panel"
			aria-expanded={!metadataCollapsed}
			aria-label={metadataCollapsed ? "Show metadata panel" : "Hide metadata panel"}
			className="aria-expanded:border-transparent aria-expanded:bg-transparent aria-expanded:text-text-subtle aria-expanded:hover:bg-bg-neutral-subtle-hovered aria-expanded:active:bg-bg-neutral-subtle-pressed aria-expanded:[&_svg]:text-icon-subtle"
			disabled={metadataLayoutAnimating}
			size="icon"
			variant="ghost"
			onClick={toggleMetadata}
		>
			<PanelRightIcon label="" />
		</Button>
	);

	return (
		<>
			<ExperimentalHeaderOverflowMenu />
			<Popover
				open={metadataCollapsed && metadataPreviewOpen}
				onOpenChange={(open, eventDetails) => {
					if (eventDetails.reason === "trigger-press") {
						eventDetails.cancel();
						setMetadataPreviewOpen(false);
						return;
					}
					setMetadataPreviewOpen(open);
				}}
			>
				<PopoverTrigger
					closeDelay={80}
					delay={120}
					openOnHover={metadataCollapsed}
					render={toggleButton}
				/>
				{metadataCollapsed ? (
					<PopoverContent
						align="end"
						aria-label="Work item details preview"
						className="max-h-[min(32rem,var(--available-height))] w-[clamp(320px,34vw,408px)] overflow-y-auto border-0 p-0 shadow-2xl dark:shadow-2xl [[data-color-mode=dark]_&]:shadow-2xl"
						positionerClassName="z-[600]"
					>
						<MetadataRail borderless />
					</PopoverContent>
				) : null}
			</Popover>
			<Button aria-label="Collapse" size="icon" variant="ghost">
				<ShrinkDiagonalIcon label="" />
			</Button>
		</>
	);
}

/** Shared v5-style modal collapse affordance for the breadcrumb row. */
export function CollapseWorkItemButton() {
	return (
		<Button aria-label="Collapse" size="icon" variant="ghost">
			<ShrinkDiagonalIcon label="" />
		</Button>
	);
}
