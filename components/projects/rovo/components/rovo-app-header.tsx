"use client";

import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
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
import { DatabaseIcon, SettingsIcon } from "@/components/ui/vpk-icons";
import EditIcon from "@atlaskit/icon/core/edit";
import ScorecardIcon from "@atlaskit/icon/core/scorecard";
import SkillIcon from "@atlaskit/icon-lab/core/skill";
import ShapesIcon from "@atlaskit/icon/core/shapes";
import ShowMoreHorizontalIcon from "@atlaskit/icon/core/show-more-horizontal";
import { CONTROL_PLANE_HEADER_SURFACES } from "@/components/projects/control-plane/lib/control-plane-data";

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

function getControlPlaneHeaderSurfaceIcon(label: string) {
	if (label === "Jobs") {
		return <ScorecardIcon label="" size="medium" />;
	}

	if (label === "Memories") {
		return <DatabaseIcon size="medium" />;
	}

	if (label === "Skills") {
		return <SkillIcon label="" size="medium" />;
	}

	return <SettingsIcon size="medium" />;
}

function RovoAppBrand() {
	return (
		<div className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md px-2 text-sm font-medium text-text">
			<span
				aria-hidden
				data-icon="inline-start"
				className="flex size-4 items-center justify-center"
			>
				<Image
					src="/1p/rovo.svg"
					alt=""
					width={16}
					height={16}
				/>
			</span>
			<span className="font-semibold">Rovo</span>
		</div>
	);
}

export function RovoAppHeader({
	artifactMenuItems,
	onNewChat,
	onOpenDocument,
	isArtifactOpen,
}: Readonly<RovoAppHeaderProps>) {
	const pathname = usePathname() ?? "";
	const router = useRouter();
	const hasArtifacts = artifactMenuItems && artifactMenuItems.length > 0;

	return (
		<header className={cn("flex items-center gap-3 px-3 py-3", isArtifactOpen && "border-b border-border")}>
			<RovoAppBrand />

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
							{CONTROL_PLANE_HEADER_SURFACES.map((surface) => {
								const isSelected = pathname === surface.href || pathname.startsWith(`${surface.href}/`);
								const icon = getControlPlaneHeaderSurfaceIcon(surface.label);

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
