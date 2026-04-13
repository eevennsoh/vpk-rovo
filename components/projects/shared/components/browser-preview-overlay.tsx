"use client";

import { cn } from "@/lib/utils";
import type {
	BrowserPreviewOverlayState,
	BrowserPreviewRenderGeometry,
} from "@/components/website/demos/utils/lib/browser-preview-overlay";

interface BrowserPreviewOverlayProps {
	overlayState: BrowserPreviewOverlayState | null;
	geometry: BrowserPreviewRenderGeometry;
	className?: string;
}

function clampToRange(value: number, min: number, max: number) {
	return Math.min(max, Math.max(min, value));
}

export function BrowserPreviewOverlay({
	overlayState,
	geometry,
	className,
}: Readonly<BrowserPreviewOverlayProps>) {
	if (!overlayState?.cursor?.visible) {
		return null;
	}

	const offsetTop = geometry.offsetTop ?? 0;
	const sourceWidth = Math.max(1, geometry.sourceWidth);
	const sourceHeight = Math.max(1, geometry.sourceHeight);
	const renderedWidth = Math.max(1, geometry.renderedWidth);
	const renderedHeight = Math.max(1, geometry.renderedHeight);
	const clampedX = clampToRange(overlayState.cursor.x, 0, sourceWidth);
	const clampedY = clampToRange(overlayState.cursor.y, 0, sourceHeight);
	const previewLeft =
		geometry.offsetLeft + Math.round((clampedX / sourceWidth) * renderedWidth);
	const previewTop =
		offsetTop + Math.round((clampedY / sourceHeight) * renderedHeight);
	const previewRightEdge = geometry.offsetLeft + renderedWidth;
	const previewBottomEdge = offsetTop + renderedHeight;
	const shouldFlipX = previewRightEdge - previewLeft < 196;
	const shouldFlipY = previewBottomEdge - previewTop < 96;

	return (
		<div
			className={cn(
				"pointer-events-none absolute inset-0 z-20 overflow-hidden",
				className,
			)}
		>
			<div
				className="absolute transition-[transform,opacity] duration-medium ease-out"
				style={{
					transform: `translate(${previewLeft}px, ${previewTop}px)`,
				}}
			>
				<div className="relative">
					<div
						className="absolute -top-6 -left-6 size-14 rounded-full blur-xl"
						style={{
							background:
								"radial-gradient(circle, rgba(56,189,248,0.48) 0%, rgba(14,165,233,0.24) 45%, rgba(14,165,233,0) 78%)",
						}}
					/>
					<div className="absolute -top-4 -left-4 size-10 rounded-full border border-cyan-300/60 bg-cyan-400/10 shadow-[0_0_0_1px_rgba(34,211,238,0.14)]" />

					<svg
						viewBox="0 0 32 32"
						aria-hidden="true"
						className="relative z-10 size-8 -translate-x-[10px] -translate-y-[10px] drop-shadow-[0_10px_24px_rgba(14,165,233,0.34)]"
					>
						<path
							d="M5 3.5l7.7 19.2 3.6-7.3 7.1 3.5-18.4-15.4z"
							fill="rgba(9, 11, 17, 0.96)"
							stroke="rgba(255, 255, 255, 0.9)"
							strokeWidth="1.7"
							strokeLinejoin="round"
						/>
					</svg>

					{overlayState.activity ? (
						<div
							className={cn(
								"absolute max-w-[190px] rounded-full border border-border bg-background/95 px-3 py-1.5 text-[11px] font-medium whitespace-nowrap text-text shadow-lg backdrop-blur-sm transition-[transform,opacity] duration-normal ease-out",
								shouldFlipX
									? "-translate-x-[calc(100%+12px)]"
									: "translate-x-4",
								shouldFlipY
									? "-translate-y-[calc(100%+12px)]"
									: "translate-y-5",
							)}
						>
							<span className="inline-flex items-center gap-2">
								<span className="size-2 rounded-full bg-cyan-400 shadow-[0_0_14px_rgba(34,211,238,0.95)] animate-pulse" />
								<span>{overlayState.activity.label}</span>
							</span>
						</div>
					) : null}
				</div>
			</div>
		</div>
	);
}
