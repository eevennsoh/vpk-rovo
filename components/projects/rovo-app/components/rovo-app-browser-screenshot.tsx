"use client";

import type { RovoDataParts } from "@/lib/rovo-ui-messages";
import { cn } from "@/lib/utils";

interface BrowserScreenshotPartProps {
	screenshot: RovoDataParts["browser-screenshot"];
	onFocusBrowserPanel?: () => void;
}

function extractHostname(url: string): string {
	try {
		return new URL(url).hostname;
	} catch {
		return url;
	}
}

function resolveScreenshotSrc(screenshot: RovoDataParts["browser-screenshot"]): string | null {
	if (typeof screenshot.thumbnailUrl === "string" && screenshot.thumbnailUrl.trim()) {
		return screenshot.thumbnailUrl;
	}

	if (typeof screenshot.imageUrl === "string" && screenshot.imageUrl.trim()) {
		return screenshot.imageUrl;
	}

	if (typeof screenshot.imageData === "string" && screenshot.imageData.trim()) {
		return `data:${screenshot.contentType || "image/png"};base64,${screenshot.imageData}`;
	}

	return null;
}

export function BrowserScreenshotPart({
	screenshot,
	onFocusBrowserPanel,
}: BrowserScreenshotPartProps) {
	const screenshotSrc = resolveScreenshotSrc(screenshot);

	return (
		<button
			type="button"
			onClick={onFocusBrowserPanel}
			className={cn(
				"group block max-w-[480px] overflow-hidden rounded-lg border border-border",
				"bg-surface-sunken transition-shadow hover:shadow-md",
				onFocusBrowserPanel ? "cursor-pointer" : "cursor-default",
			)}
		>
			{screenshotSrc ? (
				/* eslint-disable-next-line @next/next/no-img-element */
				<img
					src={screenshotSrc}
					alt={`Screenshot of ${extractHostname(screenshot.url)}`}
					decoding="async"
					height={screenshot.height}
					loading="lazy"
					width={screenshot.width}
					className="block w-full"
				/>
			) : null}
			<div className="flex items-center gap-2 px-3 py-1.5">
				<span className="truncate text-xs text-text-subtlest">
					{extractHostname(screenshot.url)}
				</span>
			</div>
		</button>
	);
}
