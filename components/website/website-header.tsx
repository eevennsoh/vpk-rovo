"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import { ThemeToggle } from "@/components/utils/theme-wrapper";

export interface WebsiteHeaderProps {
	/** Package name to display */
	packageName?: string;
	/** Last updated ISO timestamp */
	lastUpdatedAt?: string | null;
	/** Optional content displayed on the left side of the header */
	leftContent?: ReactNode;
}

function getLocalCityLabel(): string | null {
	const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
	if (!timeZone.includes("/")) {
		return null;
	}
	const segments = timeZone.split("/");
	const city = segments[segments.length - 1];
	return city ? city.replaceAll("_", " ") : null;
}

function formatLastUpdated(lastUpdatedAt: string): string | null {
	const date = new Date(lastUpdatedAt);
	if (Number.isNaN(date.getTime())) {
		return null;
	}
	const formattedDate = new Intl.DateTimeFormat("en-US", {
		dateStyle: "medium",
		timeStyle: "short",
	}).format(date);
	const city = getLocalCityLabel();
	return city ? `${formattedDate} ${city}` : formattedDate;
}

/**
 * Sticky header with package info and theme toggle.
 * 56px height, positioned at top of main content area.
 */
export function WebsiteHeader({
	packageName = "@vpk",
	lastUpdatedAt,
	leftContent,
}: Readonly<WebsiteHeaderProps>) {
	const mounted = useSyncExternalStore(
		() => () => {},
		() => true,
		() => false,
	);
	const lastUpdatedLabel = mounted && lastUpdatedAt ? formatLastUpdated(lastUpdatedAt) : null;

	return (
		<header className="sticky top-0 z-20 flex h-14 items-center border-b border-border bg-surface">
			<div className="flex min-w-0 flex-1 items-center px-4">
				{leftContent}
			</div>
			{/* Right side - Package name, last updated, and theme toggle */}
			<div className="flex items-center gap-2 px-4">
				<div className="flex items-center gap-2 font-mono">
					<span className="text-xs text-text-subtle">
						{packageName}
					</span>
					{lastUpdatedLabel ? (
						<span className="rounded-md bg-bg-neutral py-0.5 px-2 text-xs font-medium text-text" suppressHydrationWarning>
							Updated {lastUpdatedLabel}
						</span>
					) : null}
				</div>
				<ThemeToggle />
			</div>
		</header>
	);
}
