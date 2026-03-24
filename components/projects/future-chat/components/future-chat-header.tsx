"use client";

import { useState } from "react";
import CustomizeMenu from "@/components/blocks/shared-ui/customize-menu";
import { REASONING_OPTIONS } from "@/components/blocks/shared-ui/data/customize-menu-data";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Icon } from "@/components/ui/icon";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import ChevronDownIcon from "@atlaskit/icon/core/chevron-down";
import EditIcon from "@atlaskit/icon/core/edit";
import RandomizeIcon from "@atlaskit/icon-lab/core/randomize";
import ShapesIcon from "@atlaskit/icon/core/shapes";
import ShowMoreHorizontalIcon from "@atlaskit/icon/core/show-more-horizontal";

interface ArtifactMenuItem {
	id: string;
	kind: string;
	title: string;
}

interface FutureChatHeaderProps {
	artifactMenuItems?: ReadonlyArray<ArtifactMenuItem>;
	onNewChat?: () => void;
	onOpenDocument?: (documentId: string) => void;
	isArtifactOpen?: boolean;
}

export function FutureChatHeader({
	artifactMenuItems,
	onNewChat,
	onOpenDocument,
	isArtifactOpen,
}: Readonly<FutureChatHeaderProps>) {
	const [isChatConfigurationOpen, setIsChatConfigurationOpen] = useState(false);
	const [selectedReasoning, setSelectedReasoning] = useState("let-rovo-decide");
	const [webResultsEnabled, setWebResultsEnabled] = useState(false);
	const [companyKnowledgeEnabled, setCompanyKnowledgeEnabled] = useState(true);
	const hasArtifacts = artifactMenuItems && artifactMenuItems.length > 0;
	const activeReasoningOption = REASONING_OPTIONS.find((option) => option.id === selectedReasoning) ?? REASONING_OPTIONS[0];
	const reasoningLabel = activeReasoningOption.id === "let-rovo-decide" ? "Auto" : activeReasoningOption.label;
	const reasoningIcon = activeReasoningOption.id === "let-rovo-decide"
		? <RandomizeIcon label="" />
		: activeReasoningOption.icon;

	return (
		<header className={cn("flex items-center gap-3 px-3 py-3", isArtifactOpen && "border-b border-border")}>
			<Popover open={isChatConfigurationOpen} onOpenChange={setIsChatConfigurationOpen}>
				<PopoverTrigger render={<Button type="button" variant="ghost" aria-label="Chat configuration" />}>
					<Icon
						aria-hidden
						data-icon="inline-start"
						render={reasoningIcon}
					/>
					{reasoningLabel}
					<Icon
						aria-hidden
						data-icon="inline-end"
						render={<ChevronDownIcon label="" size="small" />}
					/>
				</PopoverTrigger>
				<PopoverContent align="start" side="bottom" sideOffset={8} className="w-auto p-2">
					<CustomizeMenu
						selectedReasoning={selectedReasoning}
						onReasoningChange={setSelectedReasoning}
						webResultsEnabled={webResultsEnabled}
						onWebResultsChange={setWebResultsEnabled}
						companyKnowledgeEnabled={companyKnowledgeEnabled}
						onCompanyKnowledgeChange={setCompanyKnowledgeEnabled}
						onClose={() => setIsChatConfigurationOpen(false)}
					/>
				</PopoverContent>
			</Popover>

			<div className="min-h-px min-w-px flex-1" />

			<div className="flex items-center gap-1">
				{hasArtifacts ? (
					<DropdownMenu>
						<DropdownMenuTrigger
							render={(
								<Button
									aria-label="Artifacts"
									size="icon"
									type="button"
									variant="ghost"
								/>
							)}
						>
							<Icon aria-hidden render={<ShapesIcon label="" />} />
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<DropdownMenuGroup>
								<DropdownMenuLabel>
									{artifactMenuItems.length === 1 ? "Saved artifact" : `${artifactMenuItems.length} saved artifacts`}
								</DropdownMenuLabel>
								{artifactMenuItems.map((artifact) => (
									<DropdownMenuItem
										onClick={() => onOpenDocument?.(artifact.id)}
										description={artifact.kind}
										key={artifact.id}
									>
										{artifact.title}
									</DropdownMenuItem>
								))}
							</DropdownMenuGroup>
						</DropdownMenuContent>
					</DropdownMenu>
				) : null}
				<Button
					aria-label="New chat"
					size="icon"
					variant="ghost"
					onClick={onNewChat}
				>
					<Icon aria-hidden render={<EditIcon label="" />} />
				</Button>
				<Button
					aria-label="More"
					size="icon"
					variant="ghost"
				>
					<Icon aria-hidden render={<ShowMoreHorizontalIcon label="" />} />
				</Button>
			</div>
		</header>
	);
}
