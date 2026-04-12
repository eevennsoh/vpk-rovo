"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import CustomizeMenu from "@/components/blocks/shared-ui/customize-menu";
import { REASONING_OPTIONS } from "@/components/blocks/shared-ui/data/customize-menu-data";
import { Badge } from "@/components/ui/badge";
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
import { DatabaseIcon, SearchIcon, SettingsIcon } from "@/components/ui/vpk-icons";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import ChevronDownIcon from "@atlaskit/icon/core/chevron-down";
import EditIcon from "@atlaskit/icon/core/edit";
import RandomizeIcon from "@atlaskit/icon-lab/core/randomize";
import ShapesIcon from "@atlaskit/icon/core/shapes";
import ShowMoreHorizontalIcon from "@atlaskit/icon/core/show-more-horizontal";
import { CONTROL_PLANE_HEADER_SURFACES } from "@/components/projects/control-plane/lib/control-plane-data";
import { normalizeRuntimeStatusSnapshot } from "@/lib/rovo-runtime-status";
import type { RuntimeStatusSnapshot } from "@/lib/rovo-runtime-types";

interface ArtifactMenuItem {
	id: string;
	typeLabel: string;
	title: string;
}

interface RovoAppHeaderProps {
	artifactMenuItems?: ReadonlyArray<ArtifactMenuItem>;
	onNewChat?: () => void;
	onOpenDocument?: (documentId: string) => void;
	isArtifactOpen?: boolean;
}

export function RovoAppHeader({
	artifactMenuItems,
	onNewChat,
	onOpenDocument,
	isArtifactOpen,
}: Readonly<RovoAppHeaderProps>) {
	const pathname = usePathname() ?? "";
	const router = useRouter();
	const [isChatConfigurationOpen, setIsChatConfigurationOpen] = useState(false);
	const [selectedReasoning, setSelectedReasoning] = useState("let-rovo-decide");
	const [webResultsEnabled, setWebResultsEnabled] = useState(false);
	const [companyKnowledgeEnabled, setCompanyKnowledgeEnabled] = useState(true);
	const [runtimeStatus, setRuntimeStatus] = useState<RuntimeStatusSnapshot | null>(null);
	const hasArtifacts = artifactMenuItems && artifactMenuItems.length > 0;
	const activeReasoningOption = REASONING_OPTIONS.find((option) => option.id === selectedReasoning) ?? REASONING_OPTIONS[0];
	const reasoningLabel = activeReasoningOption.id === "let-rovo-decide" ? "Auto" : activeReasoningOption.label;
	const reasoningIcon = activeReasoningOption.id === "let-rovo-decide"
		? <RandomizeIcon label="" />
		: activeReasoningOption.icon;
	const normalizedRuntimeStatus = runtimeStatus
		? normalizeRuntimeStatusSnapshot(runtimeStatus)
		: null;

	function formatSurfaceStatus(value: string) {
		return value.replace(/-/gu, " ");
	}

	useEffect(() => {
		let cancelled = false;

		async function loadRuntimeStatus() {
			try {
				const response = await fetch("/api/status", {
					method: "GET",
				});
				if (!response.ok) {
					return;
				}
				const payload = await response.json();
				if (!cancelled) {
					setRuntimeStatus(normalizeRuntimeStatusSnapshot(payload));
				}
			} catch {
				// Ignore transient status errors in the chat header.
			}
		}

		void loadRuntimeStatus();
		const intervalId = window.setInterval(loadRuntimeStatus, 30_000);

		return () => {
			cancelled = true;
			window.clearInterval(intervalId);
		};
	}, []);

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

			{normalizedRuntimeStatus ? (
				<div className="hidden items-center gap-2 text-xs md:flex">
					<Badge variant={normalizedRuntimeStatus.surfaces.rovodev.health === "ok" ? "success" : normalizedRuntimeStatus.surfaces.rovodev.health === "degraded" ? "warning" : "danger"}>
						RovoDev {formatSurfaceStatus(normalizedRuntimeStatus.surfaces.rovodev.status)}
					</Badge>
					<Badge variant={normalizedRuntimeStatus.surfaces.hermes.health === "ok" ? "success" : normalizedRuntimeStatus.surfaces.hermes.health === "degraded" ? "warning" : "danger"}>
						Hermes {formatSurfaceStatus(normalizedRuntimeStatus.surfaces.hermes.status)}
					</Badge>
				</div>
			) : null}

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
										description={artifact.typeLabel}
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
				<DropdownMenu>
					<DropdownMenuTrigger
						render={(
							<Button
								aria-label="More"
								size="icon"
								type="button"
								variant="ghost"
							/>
						)}
					>
						<Icon aria-hidden render={<ShowMoreHorizontalIcon label="" />} />
					</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<DropdownMenuGroup>
								<DropdownMenuLabel>
									Settings
								</DropdownMenuLabel>
							{CONTROL_PLANE_HEADER_SURFACES.map((surface) => {
								const isSelected = pathname === surface.href || pathname.startsWith(`${surface.href}/`);
								const icon = surface.label === "Memories"
									? <DatabaseIcon size="medium" />
									: surface.label === "Wiki"
										? <SearchIcon size="medium" />
									: <SettingsIcon size="medium" />;

								return (
									<DropdownMenuItem
										description={surface.description}
										disabled={isSelected}
										elemBefore={icon}
										key={surface.href}
										onClick={() => router.push(surface.href)}
									>
										{surface.label}
									</DropdownMenuItem>
								);
							})}
						</DropdownMenuGroup>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
		</header>
	);
}
