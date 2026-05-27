"use client";

import type { ComponentProps, CSSProperties, ReactNode } from "react";
import Image from "next/image";
import ChevronRightIcon from "@atlaskit/icon/core/chevron-right";
import TeamworkGraphIcon from "@atlaskit/icon-lab/core/teamwork-graph";

import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Icon } from "@/components/ui/icon";
import { AtlassianLogo, type AtlassianLogoName } from "@/components/ui/logo";
import { Tile } from "@/components/ui/tile";
import PatternTile, { type PatternStrokeOptions } from "@/components/website/demos/visual/pattern-tile";
import { cn } from "@/lib/utils";

export type TwgToolStatus = "active" | "complete" | "pending";
export type TwgToolSourceIconSize = "sm" | "md";
export type TwgToolThirdPartyProvider = "google-drive" | "salesforce";
export type TwgToolSourceProvider =
	| "twg"
	| TwgToolThirdPartyProvider
	| AtlassianLogoName;

export interface TwgToolSource {
	id: string;
	label: string;
	provider: TwgToolSourceProvider;
	icon?: ReactNode;
}

export type TwgToolProps = Omit<ComponentProps<typeof Collapsible>, "children"> & {
	title?: ReactNode;
	status?: TwgToolStatus;
	description?: ReactNode;
	sources?: ReadonlyArray<TwgToolSource>;
	showChevron?: boolean;
	children?: ReactNode;
};

export type TwgToolSourceIconProps = Omit<ComponentProps<typeof Tile>, "children" | "label" | "size"> & {
	source: TwgToolSource;
	size?: TwgToolSourceIconSize;
};

export type TwgToolSourceStackProps = ComponentProps<"div"> & {
	sources: ReadonlyArray<TwgToolSource>;
	iconSize?: TwgToolSourceIconSize;
	maxVisible?: number;
};

const bannerGridStroke = {
	width: 1,
} satisfies PatternStrokeOptions;

const bannerGridFadeStyle = {
	backgroundImage:
		"linear-gradient(90deg, var(--color-surface-raised) 0%, color-mix(in srgb, var(--color-surface-raised) 18%, transparent) 44%)",
} satisfies CSSProperties;

const SOURCE_STACK_ROTATION_CLASSES = [
	"",
	"rotate-6",
	"",
	"-rotate-8",
] as const;

function isThirdPartyProvider(
	provider: TwgToolSourceProvider
): provider is TwgToolThirdPartyProvider {
	return provider === "google-drive" || provider === "salesforce";
}

function getThirdPartyIconPath(provider: TwgToolThirdPartyProvider, size: TwgToolSourceIconSize) {
	return `/3p/${provider}/${size === "md" ? "24" : "16"}.svg`;
}

function getSourceTileSize(size: TwgToolSourceIconSize): ComponentProps<typeof Tile>["size"] {
	return size === "md" ? "small" : "xxsmall";
}

function getSourceImageSize(size: TwgToolSourceIconSize) {
	return size === "md" ? 24 : 16;
}

export function TwgToolBannerBackground() {
	return (
		<div aria-hidden="true" className="pointer-events-none absolute inset-0">
			<PatternTile
				className="text-border"
				patternType="grid"
				front="currentColor"
				back="transparent"
				scale={24}
				stroke={bannerGridStroke}
				fill="tile"
				opacity={0.72}
			/>
			<div className="absolute inset-0" style={bannerGridFadeStyle} />
		</div>
	);
}

export function TwgToolSourceIcon({
	className,
	source,
	size = "md",
	...props
}: TwgToolSourceIconProps) {
	const imageSize = getSourceImageSize(size);
	const tileSize = getSourceTileSize(size);

	if (source.icon) {
		return (
			<Tile
				className={cn("shrink-0", className)}
				isInset={false}
				label={source.label}
				size={tileSize}
				variant="transparent"
				{...props}
			>
				{source.icon}
			</Tile>
		);
	}

	if (source.provider === "twg") {
		return (
			<Tile
				className={cn("shrink-0 text-icon-warning", className)}
				label={source.label}
				size={tileSize}
				variant="warning"
				{...props}
			>
				<Icon
					aria-hidden
					render={<TeamworkGraphIcon label="" size="small" spacing="none" />}
					className={size === "md" ? "size-4" : "size-3"}
				/>
			</Tile>
		);
	}

	if (isThirdPartyProvider(source.provider)) {
		return (
			<Tile
				className={cn("shrink-0", className)}
				isInset={false}
				label={source.label}
				size={tileSize}
				variant="transparent"
				{...props}
			>
				<Image
					alt=""
					aria-hidden
					height={imageSize}
					src={getThirdPartyIconPath(source.provider, size)}
					width={imageSize}
				/>
			</Tile>
		);
	}

	return (
		<Tile
			className={cn("shrink-0 text-icon-subtle", className)}
			hasBorder
			isInset={false}
			label={source.label}
			size={tileSize}
			variant="transparent"
			{...props}
		>
			<span className="inline-flex size-full items-center justify-center">
				<AtlassianLogo
					name={source.provider}
					label={source.label}
					size="xxsmall"
					themeAware={false}
				/>
			</span>
		</Tile>
	);
}

export function TwgToolSourceStack({
	className,
	iconSize = "md",
	maxVisible = 6,
	sources,
	...props
}: TwgToolSourceStackProps) {
	if (sources.length === 0) {
		return null;
	}

	const visibleSources = sources.slice(0, maxVisible);
	const hiddenCount = Math.max(0, sources.length - visibleSources.length);

	return (
		<div className={cn("flex shrink-0 items-center justify-end overflow-visible", className)} {...props}>
			{visibleSources.map((source, index) => (
				<TwgToolSourceIcon
					key={source.id}
					source={source}
					size={iconSize}
					className={cn(
						"relative",
						index > 0 && "-ml-1",
						SOURCE_STACK_ROTATION_CLASSES[index % SOURCE_STACK_ROTATION_CLASSES.length]
					)}
				/>
			))}
			{hiddenCount > 0 ? (
				<Tile
					className={cn(
						"relative -ml-1 shrink-0 text-[10px] font-medium text-text-subtle"
					)}
					hasBorder
					isInset={false}
					label={`${hiddenCount} more sources`}
					size={getSourceTileSize(iconSize)}
					variant="transparent"
				>
					+{hiddenCount}
				</Tile>
			) : null}
		</div>
	);
}

export function TwgTool({
	className,
	children,
	description,
	showChevron = true,
	sources = [],
	status = "active",
	title = "Searching Teamwork Graph",
	...props
}: TwgToolProps) {
	const hasExpandableContent = children != null && showChevron;
	const bannerContent = (
		<>
			<span className="relative z-10 grid min-w-0 flex-1 gap-0.5 text-sm text-text-subtle">
				<span className="inline-flex min-w-0 items-start gap-1.5">
					<span className="min-w-0 truncate">{title}</span>
					{showChevron ? (
						<Icon
							aria-hidden
							render={<ChevronRightIcon label="" size="small" spacing="none" />}
							className={cn(
								"mt-0.5 size-4 shrink-0 text-icon-subtle transition-transform duration-medium",
								hasExpandableContent && "group-data-[open]/twg:rotate-90"
							)}
						/>
					) : null}
				</span>
				{description ? (
					<span className="block min-h-4 overflow-hidden text-xs leading-4 text-text-subtle">
						<span className="block truncate">{description}</span>
					</span>
				) : null}
			</span>
			<TwgToolSourceStack
				sources={sources}
				className="relative z-10 max-w-[44%]"
			/>
		</>
	);

	return (
		<Collapsible
			className={cn("group/twg not-prose w-full", className)}
			data-status={status}
			{...props}
		>
			<div className="flex w-full items-stretch gap-1">
				<div className="flex w-8 shrink-0 flex-col items-center">
					<div className="w-px flex-1 bg-border" />
					<div
						className={cn(
							"flex size-8 shrink-0 items-center justify-center text-icon-subtle",
							status === "active" && "animate-pulse text-icon"
						)}
					>
						<Icon
							render={<TeamworkGraphIcon label="" size="small" spacing="none" />}
							label="Teamwork Graph"
							className="size-4"
						/>
					</div>
					<div className="w-px flex-1 bg-border group-last/twg:bg-transparent" />
				</div>
				{hasExpandableContent ? (
					<CollapsibleTrigger
						className="relative flex h-12 min-w-0 flex-1 items-center justify-between gap-3 overflow-hidden rounded-lg bg-surface-sunken px-2 text-left outline-none transition-colors hover:bg-surface-raised-hovered focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-3"
					>
						<TwgToolBannerBackground />
						{bannerContent}
					</CollapsibleTrigger>
				) : (
					<div
						className="relative flex h-12 min-w-0 flex-1 items-center justify-between gap-3 overflow-hidden rounded-lg bg-surface-sunken px-2"
					>
						<TwgToolBannerBackground />
						{bannerContent}
					</div>
				)}
			</div>
			{hasExpandableContent ? (
				<CollapsibleContent
					className={cn(
						"ml-9 mt-2 overflow-hidden text-xs leading-5 text-text-subtle",
						"h-(--collapsible-panel-height) outline-none transition-[height,opacity] duration-medium ease-out data-starting-style:h-0 data-starting-style:opacity-0 data-ending-style:h-0 data-ending-style:opacity-0"
					)}
				>
					{children}
				</CollapsibleContent>
			) : null}
		</Collapsible>
	);
}
