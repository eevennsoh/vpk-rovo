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

export type TwgToolSourceIconProps = Omit<ComponentProps<"span">, "children"> & {
	source: TwgToolSource;
	size?: TwgToolSourceIconSize;
};

export type TwgToolSourceStackProps = ComponentProps<"div"> & {
	sources: ReadonlyArray<TwgToolSource>;
	iconSize?: TwgToolSourceIconSize;
	maxVisible?: number;
};

const bannerBackgroundStyle = {
	backgroundImage:
		"linear-gradient(90deg, var(--color-surface-raised) 0%, color-mix(in srgb, var(--color-surface-raised) 18%, transparent) 44%), linear-gradient(var(--color-border) 1px, transparent 1px), linear-gradient(90deg, var(--color-border) 1px, transparent 1px)",
	backgroundPosition: "0 0, 0 0, 0 0",
	backgroundSize: "auto, 34px 24px, 34px 24px",
} satisfies CSSProperties;

const statusTextStyles: Record<TwgToolStatus, string> = {
	active: "text-text-subtle",
	complete: "text-text-subtle",
	pending: "text-text-subtlest",
};

const sourceIconRotations = [
	"rotate-0",
	"-rotate-6",
	"rotate-0",
	"rotate-6",
	"rotate-0",
	"-rotate-6",
] as const;

function isThirdPartyProvider(
	provider: TwgToolSourceProvider
): provider is TwgToolThirdPartyProvider {
	return provider === "google-drive" || provider === "salesforce";
}

function getThirdPartyIconPath(provider: TwgToolThirdPartyProvider, size: TwgToolSourceIconSize) {
	return `/3p/${provider}/${size === "md" ? "24" : "16"}.svg`;
}

function getSourceIconClasses(size: TwgToolSourceIconSize) {
	return size === "md" ? "size-6 rounded-md" : "size-4 rounded-[4px]";
}

function getSourceImageSize(size: TwgToolSourceIconSize) {
	return size === "md" ? 18 : 12;
}

export function TwgToolSourceIcon({
	className,
	source,
	size = "md",
	...props
}: TwgToolSourceIconProps) {
	const imageSize = getSourceImageSize(size);
	const tileClasses = cn(
		"inline-flex shrink-0 items-center justify-center overflow-hidden shadow-xs",
		getSourceIconClasses(size),
		className
	);

	if (source.icon) {
		return (
			<span
				role="img"
				aria-label={source.label}
				className={cn("border border-border bg-surface", tileClasses)}
				{...props}
			>
				{source.icon}
			</span>
		);
	}

	if (source.provider === "twg") {
		return (
			<span
				role="img"
				aria-label={source.label}
				className={cn("border border-transparent bg-yellow-400 text-yellow-950", tileClasses)}
				{...props}
			>
				<Icon
					aria-hidden
					render={<TeamworkGraphIcon label="" size="small" spacing="none" />}
					className={size === "md" ? "size-4" : "size-3"}
				/>
			</span>
		);
	}

	if (isThirdPartyProvider(source.provider)) {
		return (
			<span
				role="img"
				aria-label={source.label}
				className={cn("border border-border bg-surface", tileClasses)}
				{...props}
			>
				<Image
					alt=""
					aria-hidden
					height={imageSize}
					src={getThirdPartyIconPath(source.provider, size)}
					width={imageSize}
				/>
			</span>
		);
	}

	return (
		<span
			role="img"
			aria-label={source.label}
			className={cn("border border-border bg-surface", tileClasses)}
			{...props}
		>
			<AtlassianLogo
				name={source.provider}
				label={source.label}
				size="xxsmall"
				themeAware={false}
			/>
		</span>
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
		<div className={cn("flex shrink-0 items-center justify-end overflow-hidden", className)} {...props}>
			{visibleSources.map((source, index) => (
				<TwgToolSourceIcon
					key={source.id}
					source={source}
					size={iconSize}
					className={cn(
						"relative",
						index > 0 && "-ml-1",
						sourceIconRotations[index % sourceIconRotations.length]
					)}
				/>
			))}
			{hiddenCount > 0 ? (
				<span
					className={cn(
						"relative -ml-1 inline-flex shrink-0 items-center justify-center border border-border bg-surface text-[10px] font-medium text-text-subtle shadow-xs",
						getSourceIconClasses(iconSize)
					)}
				>
					+{hiddenCount}
				</span>
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
			<div className="flex min-w-0 flex-1 flex-col justify-center">
				<div className="flex min-w-0 items-center gap-1.5">
					<span className="truncate text-sm font-medium leading-5 text-text-subtle">
						{title}
					</span>
					{showChevron ? (
						<Icon
							aria-hidden
							render={<ChevronRightIcon label="" size="small" spacing="none" />}
							className={cn(
								"size-4 shrink-0 text-icon-subtle transition-transform duration-200",
								hasExpandableContent && "group-data-[open]/twg:rotate-90"
							)}
						/>
					) : null}
				</div>
				{description ? (
					<div
						className={cn(
							"flex min-w-0 items-center gap-1 overflow-hidden text-sm leading-5",
							statusTextStyles[status]
						)}
					>
						<span className="block min-w-0 truncate">{description}</span>
					</div>
				) : null}
			</div>
			<TwgToolSourceStack
				sources={sources}
				className="max-w-[44%]"
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
						className="flex h-12 min-w-0 flex-1 items-center justify-between gap-3 overflow-hidden rounded-lg bg-surface-sunken px-2 text-left outline-none transition-colors hover:bg-surface-raised-hovered focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-3"
						style={bannerBackgroundStyle}
					>
						{bannerContent}
					</CollapsibleTrigger>
				) : (
					<div
						className="flex h-12 min-w-0 flex-1 items-center justify-between gap-3 overflow-hidden rounded-lg bg-surface-sunken px-2"
						style={bannerBackgroundStyle}
					>
						{bannerContent}
					</div>
				)}
			</div>
			{hasExpandableContent ? (
				<CollapsibleContent
					className={cn(
						"ml-9 mt-2 overflow-hidden text-xs leading-5 text-text-subtle",
						"h-(--collapsible-panel-height) outline-none transition-[height,opacity] duration-200 ease-out data-starting-style:h-0 data-starting-style:opacity-0 data-ending-style:h-0 data-ending-style:opacity-0"
					)}
				>
					{children}
				</CollapsibleContent>
			) : null}
		</Collapsible>
	);
}
