"use client";

import { type MouseEvent, type ReactElement, type ReactNode } from "react";
import Image from "next/image";
import CheckMarkIcon from "@atlaskit/icon/core/check-mark";
import ShowMoreHorizontalIcon from "@atlaskit/icon/core/show-more-horizontal";
import StatusVerifiedIcon from "@atlaskit/icon/core/status-verified";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { token } from "@/lib/tokens";
import { cn } from "@/lib/utils";

/** Compact count formatter — 1500 → "1.5K", 12000 → "12K". */
export function formatCompact(value: number): string {
	if (value >= 10000) return `${Math.round(value / 1000)}K`;
	if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
	return `${value}`;
}

export interface CardDirectoryHeaderProps {
	/** Leading visual — hexagon avatar, icon tile, app logo, or rich icon. Omit when the visual lives elsewhere (e.g. a `CardDirectoryBanner`). */
	leading?: ReactNode;
	title: string;
	/** Attribution line under the title (e.g. `CardDirectoryByline`). */
	byline?: ReactNode;
	/** Trailing action revealed on hover/focus (e.g. `CardDirectoryMoreButton`). */
	action?: ReactNode;
}

export function CardDirectoryHeader({ leading, title, byline, action }: Readonly<CardDirectoryHeaderProps>) {
	return (
		<div className="flex items-start gap-2" data-slot="card-directory-header">
			{leading ? <span className="shrink-0">{leading}</span> : null}
			<div className="min-w-0 flex-1">
				<h3 className="truncate text-text" style={{ font: token("font.heading.xsmall") }}>
					{title}
				</h3>
				{byline ?? null}
			</div>
			{action ?? null}
		</div>
	);
}

export interface CardDirectoryBylineProps {
	publisher: string;
	verified?: boolean;
}

export function CardDirectoryByline({ publisher, verified = false }: Readonly<CardDirectoryBylineProps>) {
	return (
		<p
			className="flex items-center gap-1 text-xs leading-4 text-text-subtle"
			data-slot="card-directory-byline"
		>
			<span>By</span>
			<span className="truncate text-link">{publisher}</span>
			{verified ? (
				<Icon
					className="text-icon-information"
					render={<StatusVerifiedIcon label="Verified" size="small" color="currentColor" />}
				/>
			) : null}
		</p>
	);
}

export interface CardDirectoryMoreButtonProps {
	label: string;
	onClick?: () => void;
}

export function CardDirectoryMoreButton({ label, onClick }: Readonly<CardDirectoryMoreButtonProps>) {
	const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
		event.stopPropagation();
		onClick?.();
	};

	return (
		<Button
			aria-label={label}
			className="size-6 shrink-0 cursor-pointer opacity-0 transition-opacity duration-fast ease-out group-hover/card:opacity-100 group-focus-within/card:opacity-100"
			onClick={handleClick}
			size="icon-xs"
			type="button"
			variant="ghost"
		>
			<ShowMoreHorizontalIcon label="" size="small" />
		</Button>
	);
}

export function CardDirectoryDescription({ children }: Readonly<{ children: ReactNode }>) {
	return (
		<p className="line-clamp-2 min-h-10 text-sm leading-5 text-text" data-slot="card-directory-description">
			{children}
		</p>
	);
}

export function CardDirectoryFooter({
	className,
	children,
}: Readonly<{ className?: string; children: ReactNode }>) {
	return (
		<div
			className={cn("flex items-center gap-4 text-xs leading-4 text-text-subtlest", className)}
			data-slot="card-directory-footer"
		>
			{children}
		</div>
	);
}

export interface CardDirectoryStatProps {
	/** Raw Atlaskit icon element; wrapped in the 12px stat-icon treatment. */
	icon: ReactElement;
	children: ReactNode;
}

export function CardDirectoryStat({ icon, children }: Readonly<CardDirectoryStatProps>) {
	return (
		<span className="inline-flex items-center gap-1" data-slot="card-directory-stat">
			<Icon className="size-3 text-icon-subtlest [&_svg]:size-3" render={icon} />
			{children}
		</span>
	);
}

export function CardDirectorySection({
	label,
	children,
}: Readonly<{ label: string; children: ReactNode }>) {
	return (
		<div className="flex flex-col gap-1" data-slot="card-directory-section">
			<span className="text-xs font-semibold leading-4 text-text-subtlest">{label}</span>
			{children}
		</div>
	);
}

// Cover-banner styling, mirrored from `AgentProfileCover` in `components/ui-custom/agent.tsx`.
// Kept local so the card-directory module stays self-contained and doesn't pull in the large
// agent module — the same color map is duplicated there and in the agent-card block.
const BANNER_HEXAGON_PATH =
	"M19.01 0.922148C20.24 0.212148 21.76 0.212148 23 0.922148L40 10.6921C41.24 11.4021 42.01 12.7321 42.01 14.1621V33.6721C42.01 35.1021 41.24 36.4221 40 37.1421L23 46.9121C21.77 47.6221 20.25 47.6221 19.01 46.9121L2.01 37.1321C0.77 36.4221 0 35.0921 0 33.6621V14.1621C0 12.7321 0.77 11.4121 2.01 10.6921L19.01 0.922148Z";
const DEFAULT_BANNER_COVER_COLOR = "#1868DB";
const BANNER_COVER_COLORS: Record<string, string> = {
	"dev-agents": "#82B536",
	"product-agents": "#BF63F3",
	"service-agents": "#FFC716",
	"strategy-agents": "#FF9F1A",
	"teamwork-agents": DEFAULT_BANNER_COVER_COLOR,
};

function getBannerCoverColor(avatarSrc: string | undefined): string {
	const category = avatarSrc?.match(/\/avatar-agent\/([^/]+)\//u)?.[1];
	return (category ? BANNER_COVER_COLORS[category] : undefined) ?? DEFAULT_BANNER_COVER_COLOR;
}

export interface CardDirectoryBannerProps {
	avatarSrc: string;
	/** Override the avatar-category-derived cover color. */
	backgroundColor?: string;
}

/**
 * Full-bleed cover banner — a colored strip with a bleeding avatar and a hexagon-outlined
 * avatar overhanging the bottom edge. Bleeds the shell's `p-4` via negative margins.
 */
export function CardDirectoryBanner({ avatarSrc, backgroundColor }: Readonly<CardDirectoryBannerProps>) {
	const coverColor = backgroundColor ?? getBannerCoverColor(avatarSrc);

	return (
		<div
			className="relative -mx-4 -mt-4 overflow-hidden rounded-t-md bg-surface"
			data-slot="card-directory-banner"
		>
			<div className="relative h-12 overflow-hidden" style={{ backgroundColor: coverColor }}>
				<Image
					alt=""
					aria-hidden
					className="absolute top-1/2 left-[88%] h-48 w-[168px] -translate-x-1/2 -translate-y-1/2 opacity-95"
					height={192}
					src={avatarSrc}
					width={168}
				/>
			</div>
			<div aria-hidden className="h-6" />
			<div className="absolute top-6 left-4 size-12">
				<Image alt="" aria-hidden className="h-12 w-[42px]" height={48} src={avatarSrc} width={42} />
				<svg
					aria-hidden="true"
					className="pointer-events-none absolute top-0 left-0 h-12 w-[42px] overflow-visible"
					focusable="false"
					viewBox="0 0 43 48"
				>
					<path
						className="stroke-surface"
						d={BANNER_HEXAGON_PATH}
						fill="none"
						strokeWidth={2}
						vectorEffect="non-scaling-stroke"
					/>
				</svg>
			</div>
		</div>
	);
}

export interface CardDirectoryCapabilitiesProps {
	/** Section label above the list. */
	label?: string;
	/** Capability lines rendered as a scrollable check-marked list. */
	items: readonly string[];
}

/**
 * Scrollable "what it can do" list — reuses the bordered panel idiom from the agent
 * knowledge panel, made scrollable with a native `overflow-y-auto` affordance.
 */
export function CardDirectoryCapabilities({
	label = "What it can do",
	items,
}: Readonly<CardDirectoryCapabilitiesProps>) {
	return (
		<div className="flex flex-col gap-1" data-slot="card-directory-capabilities">
			<span className="text-xs font-semibold leading-4 text-text-subtlest">{label}</span>
			<div className="rounded-xl border border-border bg-bg-input p-1.5">
				<ul className="flex max-h-32 flex-col gap-0.5 overflow-y-auto">
					{items.map((item) => (
						<li key={item} className="flex items-start gap-2 rounded-lg px-1.5 py-1">
							<Icon
								className="mt-0.5 size-3.5 shrink-0 text-icon-success [&_svg]:size-3.5"
								render={<CheckMarkIcon label="" size="small" color="currentColor" />}
							/>
							<span className="text-sm leading-5 text-text-subtle">{item}</span>
						</li>
					))}
				</ul>
			</div>
		</div>
	);
}
