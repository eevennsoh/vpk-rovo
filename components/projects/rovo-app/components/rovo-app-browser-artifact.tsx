"use client";

import { cn } from "@/lib/utils";
import {
	GlobeIcon,
	Loader2Icon,
	XIcon,
} from "@/components/ui/vpk-icons";
import { BrowserPreviewOverlay } from "@/components/projects/shared/components/browser-preview-overlay";
import type { RovoDataParts } from "@/lib/rovo-ui-messages";
import {
	useEffect,
	useMemo,
	useRef,
	useState,
	type RefObject,
} from "react";
import { useBrowserPreviewSession } from "@/components/website/demos/utils/hooks/use-browser-preview-session";

interface RovoAppBrowserArtifactProps {
	url: string;
	title: string;
	status: "navigating" | "ready" | "error";
	screenshot?: RovoDataParts["browser-screenshot"] | null;
	streamConfig?: RovoDataParts["browser-state"]["streamConfig"] | null;
	workspaceId?: string | null;
	onClose: () => void;
}

function resolveScreenshotSrc(screenshot: RovoDataParts["browser-screenshot"] | null | undefined): string | null {
	if (!screenshot) {
		return null;
	}

	if (typeof screenshot.imageUrl === "string" && screenshot.imageUrl.trim()) {
		return screenshot.imageUrl;
	}

	if (typeof screenshot.imageData === "string" && screenshot.imageData.trim()) {
		return `data:${screenshot.contentType || "image/png"};base64,${screenshot.imageData}`;
	}

	return null;
}

function renderPreviewState({
	displayUrl,
	fallbackScreenshotSrc,
	hasLiveStream,
	isError,
	isLoading,
	liveCanvasRef,
	renderedMediaStyle,
	screenshot,
}: {
	displayUrl: string;
	fallbackScreenshotSrc: string | null;
	hasLiveStream: boolean;
	isError: boolean;
	isLoading: boolean;
	liveCanvasRef: RefObject<HTMLCanvasElement | null>;
	renderedMediaStyle: {
		left: number;
		top: number;
		width: number;
		height: number;
	};
	screenshot?: RovoDataParts["browser-screenshot"] | null;
}) {
	if (isError) {
		return (
			<div className="flex flex-col items-center gap-2 text-center">
				<GlobeIcon className="size-8 text-text-subtlest" />
				<p className="text-sm text-text-subtle">
					Browser session unavailable
				</p>
			</div>
		);
	}

	if (hasLiveStream) {
		return (
			<canvas
				ref={liveCanvasRef}
				className="pointer-events-none absolute block select-none"
				style={renderedMediaStyle}
			/>
		);
	}

	if (fallbackScreenshotSrc) {
		return (
			/* eslint-disable-next-line @next/next/no-img-element */
			<img
				src={fallbackScreenshotSrc}
				alt={`Screenshot of ${displayUrl}`}
				decoding="async"
				height={screenshot?.height}
				className="pointer-events-none absolute block select-none"
				width={screenshot?.width}
				style={renderedMediaStyle}
			/>
		);
	}

	if (isLoading) {
		return (
			<div className="flex flex-col items-center gap-3 text-center">
				<Loader2Icon className="size-8 animate-spin text-text-subtlest" />
				<p className="text-sm text-text-subtle">
					Browsing {displayUrl}...
				</p>
			</div>
		);
	}

	return (
		<div className="flex flex-col items-center gap-2 px-4 text-center">
			<GlobeIcon className="size-8 text-text-subtlest" />
			<p className="text-sm text-text-subtle">
				Browsing {displayUrl}
			</p>
			<p className="text-xs text-text-subtlest">
				Screenshot will appear when the agent captures one
			</p>
		</div>
	);
}

export function RovoAppBrowserArtifact({
	url,
	title,
	status,
	screenshot,
	streamConfig,
	workspaceId,
	onClose,
}: Readonly<RovoAppBrowserArtifactProps>) {
	const isLoading = status === "navigating";
	const isError = status === "error";
	const displayUrl = url || "about:blank";

	const {
		liveCanvasRef,
		overlayState,
		sourceMetadata,
		status: streamStatus,
	} = useBrowserPreviewSession(workspaceId ?? null, {
		streamUrl: streamConfig?.wsUrl ?? null,
	});
	const [containerViewportSize, setContainerViewportSize] = useState({
		width: 1280,
		height: 900,
	});
	const liveViewportRef = useRef<HTMLDivElement | null>(null);

	const hasLiveStream =
		streamStatus === "live" || streamStatus === "steady";
	const fallbackScreenshotSrc = resolveScreenshotSrc(screenshot);

	useEffect(() => {
		const container = liveViewportRef.current;
		if (!container || typeof ResizeObserver === "undefined") {
			return;
		}

		const observer = new ResizeObserver((entries) => {
			const entry = entries[0];
			if (!entry) {
				return;
			}

			const nextWidth = Math.max(320, Math.round(entry.contentRect.width));
			const nextHeight = Math.max(240, Math.round(entry.contentRect.height));
			setContainerViewportSize((current) => {
				if (current.width === nextWidth && current.height === nextHeight) {
					return current;
				}

				return {
					width: nextWidth,
					height: nextHeight,
				};
			});
		});

		observer.observe(container);
		return () => observer.disconnect();
	}, []);

	const previewGeometry = useMemo(() => {
		const sourceWidth = Math.max(
			1,
			sourceMetadata?.width ?? 1280,
		);
		const sourceHeight = Math.max(
			1,
			sourceMetadata?.height ?? 900,
		);
		const scale = Math.min(
			containerViewportSize.width / sourceWidth,
			containerViewportSize.height / sourceHeight,
		);
		const renderedWidth = Math.max(1, Math.round(sourceWidth * scale));
		const renderedHeight = Math.max(1, Math.round(sourceHeight * scale));
		const offsetLeft = Math.max(
			0,
			Math.round((containerViewportSize.width - renderedWidth) / 2),
		);
		const offsetTop = Math.max(
			0,
			Math.round((containerViewportSize.height - renderedHeight) / 2),
		);

		return {
			offsetLeft,
			offsetTop,
			renderedHeight,
			renderedWidth,
			sourceHeight,
			sourceWidth,
		};
	}, [
		containerViewportSize.height,
		containerViewportSize.width,
		sourceMetadata?.height,
		sourceMetadata?.width,
	]);

	const renderedMediaStyle = useMemo(
		() => ({
			left: previewGeometry.offsetLeft,
			top: previewGeometry.offsetTop,
			width: previewGeometry.renderedWidth,
			height: previewGeometry.renderedHeight,
		}),
		[
			previewGeometry.offsetLeft,
			previewGeometry.offsetTop,
			previewGeometry.renderedHeight,
			previewGeometry.renderedWidth,
		],
	);

	const isOverlayActive = !!overlayState?.cursor?.visible;

	return (
		<div className={cn("flex h-full flex-col overflow-hidden rounded-xl bg-surface", isOverlayActive && "animate-expect-border-glow")}>
			{/* Header — read-only URL bar */}
			<div className="flex items-center gap-2 border-b border-border bg-surface-sunken px-3 py-2">
				<div className="flex min-w-0 flex-1 items-center gap-2 rounded-md border border-border bg-surface px-3 py-1.5">
					{isLoading ? (
						<Loader2Icon className="size-4 shrink-0 animate-spin text-text-subtlest" />
					) : (
						<GlobeIcon className="size-4 shrink-0 text-text-subtlest" />
					)}
					<span className="truncate text-sm text-text-subtle">
						{displayUrl}
					</span>
				</div>
				<button
					type="button"
					onClick={onClose}
					aria-label="Close browser preview"
					className="flex size-8 shrink-0 items-center justify-center rounded-md text-text-subtle hover:bg-surface-hovered"
				>
					<XIcon className="size-4" />
				</button>
			</div>

			{/* Title bar */}
			{title ? (
				<div className="border-b border-border px-3 py-1.5">
					<span className="truncate text-xs text-text-subtlest">
						{title}
					</span>
				</div>
			) : null}

			{/* Content area */}
			<div
				ref={liveViewportRef}
				className="relative flex flex-1 items-center justify-center overflow-hidden bg-neutral-50 outline-none dark:bg-neutral-900"
				aria-label={title || "Browser preview"}
			>
				{renderPreviewState({
					displayUrl,
					fallbackScreenshotSrc,
					hasLiveStream,
					isError,
					isLoading,
					liveCanvasRef,
					renderedMediaStyle,
					screenshot,
				})}

				<BrowserPreviewOverlay
					geometry={previewGeometry}
					overlayState={overlayState}
				/>
			</div>
		</div>
	);
}
