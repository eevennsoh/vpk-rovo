"use client";

import { type MouseEvent, type ReactElement, type ReactNode } from "react";
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
	/** Leading visual — hexagon avatar, icon tile, app logo, or rich icon. */
	leading: ReactNode;
	title: string;
	/** Attribution line under the title (e.g. `CardDirectoryByline`). */
	byline?: ReactNode;
	/** Trailing action revealed on hover/focus (e.g. `CardDirectoryMoreButton`). */
	action?: ReactNode;
}

export function CardDirectoryHeader({ leading, title, byline, action }: Readonly<CardDirectoryHeaderProps>) {
	return (
		<div className="flex items-start gap-2" data-slot="card-directory-header">
			<span className="shrink-0">{leading}</span>
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
