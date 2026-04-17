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
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
	type PointerEvent as ReactPointerEvent,
	type WheelEvent as ReactWheelEvent,
} from "react";
import { useBrowserPreviewSession } from "@/components/website/demos/utils/hooks/use-browser-preview-session";

interface RovoAppBrowserArtifactProps {
	url: string;
	title: string;
	status:
		| "launching-canary"
		| "awaiting-auth"
		| "navigating"
		| "ready"
		| "error";
	screenshot?: RovoDataParts["browser-screenshot"] | null;
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

export function RovoAppBrowserArtifact({
	url,
	title,
	status,
	screenshot,
	workspaceId,
	onClose,
}: Readonly<RovoAppBrowserArtifactProps>) {
	const isLaunchingCanary = status === "launching-canary";
	const isAwaitingAuth = status === "awaiting-auth";
	const isLoading = status === "navigating" || isLaunchingCanary;
	const isError = status === "error";
	const displayUrl = url || "about:blank";

	const {
		liveCanvasRef,
		canSendControl,
		sendControlMessage,
		overlayState,
		sourceMetadata,
		status: streamStatus,
	} = useBrowserPreviewSession(workspaceId ?? null);
	const [containerViewportSize, setContainerViewportSize] = useState({
		width: 1280,
		height: 900,
	});
	const liveViewportRef = useRef<HTMLDivElement | null>(null);
	const wheelFlushTimerRef = useRef<number | null>(null);
	const pendingWheelRef = useRef({
		deltaX: 0,
		deltaY: 0,
		x: 0,
		y: 0,
	});

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

	useEffect(() => {
		return () => {
			if (wheelFlushTimerRef.current !== null) {
				window.clearTimeout(wheelFlushTimerRef.current);
			}
		};
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

	const resolvePreviewPoint = useCallback(
		(clientX: number, clientY: number) => {
			const container = liveViewportRef.current;
			if (!container) {
				return null;
			}

			const bounds = container.getBoundingClientRect();
			const xWithinImage = clientX - bounds.left - previewGeometry.offsetLeft;
			const yWithinImage = clientY - bounds.top - previewGeometry.offsetTop;

			if (
				xWithinImage < 0 ||
				yWithinImage < 0 ||
				xWithinImage > previewGeometry.renderedWidth ||
				yWithinImage > previewGeometry.renderedHeight
			) {
				return null;
			}

			const scaleX =
				previewGeometry.sourceWidth / Math.max(previewGeometry.renderedWidth, 1);
			const scaleY =
				previewGeometry.sourceHeight / Math.max(previewGeometry.renderedHeight, 1);

			return {
				x: Math.round(xWithinImage * scaleX),
				y: Math.round(yWithinImage * scaleY),
			};
		},
		[
			previewGeometry.offsetLeft,
			previewGeometry.offsetTop,
			previewGeometry.renderedHeight,
			previewGeometry.renderedWidth,
			previewGeometry.sourceHeight,
			previewGeometry.sourceWidth,
		],
	);

	const resolvePreviewCenter = useCallback(() => ({
		x: Math.round(previewGeometry.sourceWidth / 2),
		y: Math.round(previewGeometry.sourceHeight / 2),
	}), [previewGeometry.sourceHeight, previewGeometry.sourceWidth]);

	const handlePointerDown = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
		if (event.button !== 0) {
			return;
		}

		const point = resolvePreviewPoint(event.clientX, event.clientY);
		if (!point) {
			return;
		}

		event.preventDefault();
		liveViewportRef.current?.focus();
		if (canSendControl) {
			void sendControlMessage({
				type: "preview-click",
				x: point.x,
				y: point.y,
			});
		}
	}, [canSendControl, resolvePreviewPoint, sendControlMessage]);

	const handleWheel = useCallback(
		(event: ReactWheelEvent<HTMLDivElement>) => {
			if (!canSendControl) {
				return;
			}

			event.preventDefault();
			liveViewportRef.current?.focus();
			const center = resolvePreviewCenter();
			pendingWheelRef.current.x = center.x;
			pendingWheelRef.current.y = center.y;
			pendingWheelRef.current.deltaX += Math.round(event.deltaX);
			pendingWheelRef.current.deltaY += Math.round(event.deltaY);

			if (wheelFlushTimerRef.current !== null) {
				return;
			}

			wheelFlushTimerRef.current = window.setTimeout(() => {
				wheelFlushTimerRef.current = null;
				const nextWheel = pendingWheelRef.current;
				pendingWheelRef.current = {
					x: nextWheel.x,
					y: nextWheel.y,
					deltaX: 0,
					deltaY: 0,
				};

				if (!nextWheel.deltaX && !nextWheel.deltaY) {
					return;
				}

				void sendControlMessage({
					type: "preview-wheel",
					x: nextWheel.x,
					y: nextWheel.y,
					deltaX: nextWheel.deltaX,
					deltaY: nextWheel.deltaY,
				});
			}, 40);
		},
		[canSendControl, resolvePreviewCenter, sendControlMessage],
	);

	const isOverlayActive = !!overlayState?.cursor?.visible;

	return (
		<div className={cn("flex h-full flex-col overflow-hidden rounded-xl bg-surface", isOverlayActive && "animate-[expect-border-glow_2s_ease-in-out_infinite]")}>
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
				role="application"
				aria-label={title || "Browser preview"}
				tabIndex={0}
				onPointerDown={handlePointerDown}
				onWheel={handleWheel}
			>
				{isError ? (
					<div className="flex flex-col items-center gap-2 text-center">
						<GlobeIcon className="size-8 text-text-subtlest" />
						<p className="text-sm text-text-subtle">
							Browser session unavailable
						</p>
					</div>
				) : hasLiveStream ? (
					<canvas
						ref={liveCanvasRef}
						className="pointer-events-none absolute block select-none"
						style={renderedMediaStyle}
					/>
				) : fallbackScreenshotSrc ? (
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
				) : isLaunchingCanary ? (
					<div className="flex flex-col items-center gap-3 px-4 text-center">
						<Loader2Icon className="size-8 animate-spin text-text-subtlest" />
						<p className="text-sm text-text-subtle">
							Opening Google Chrome Canary...
						</p>
						<p className="text-xs text-text-subtlest">
							The in-app preview will sync once Canary exposes its DevTools port.
						</p>
					</div>
				) : isAwaitingAuth ? (
					<div className="flex flex-col items-center gap-3 px-4 text-center">
						<GlobeIcon className="size-8 text-text-subtlest" />
						<p className="text-sm text-text-subtle">
							Google Chrome Canary is ready
						</p>
						<p className="text-xs text-text-subtlest">
							Sign in there once, then retry the browsing step to reuse that session here.
						</p>
					</div>
				) : isLoading ? (
					<div className="flex flex-col items-center gap-3 text-center">
						<Loader2Icon className="size-8 animate-spin text-text-subtlest" />
						<p className="text-sm text-text-subtle">
							Browsing {displayUrl}...
						</p>
					</div>
				) : (
					<div className="flex flex-col items-center gap-2 text-center px-4">
						<GlobeIcon className="size-8 text-text-subtlest" />
						<p className="text-sm text-text-subtle">
							Browsing {displayUrl}
						</p>
						<p className="text-xs text-text-subtlest">
							Screenshot will appear when the agent captures one
						</p>
					</div>
				)}

				<BrowserPreviewOverlay
					geometry={previewGeometry}
					overlayState={overlayState}
				/>
			</div>
		</div>
	);
}
