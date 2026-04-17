"use client";

import {
	useCallback,
	useEffect,
	useRef,
	useState,
} from "react";
import { getBrowserWorkspaceStream } from "@/lib/browser-workspace-client";
import {
	type BrowserPreviewFramePayload,
	completeBrowserPreviewFrameLoad,
	createBrowserPreviewFrameQueueState,
	enqueueBrowserPreviewFrame,
} from "@/components/website/demos/utils/lib/browser-preview-frame-queue";
import type { BrowserPreviewOverlayState } from "@/components/website/demos/utils/lib/browser-preview-overlay";
import { isMissingBrowserWorkspaceError } from "@/components/website/demos/utils/hooks/browser-workspace-recovery";

type PreviewStatus = "connecting" | "live" | "steady" | "fallback";

interface PreviewStateMessage {
	type: "preview-state";
	status: "live" | "steady";
	settledScreenshotRevision: number | null;
	sourceWidth: number;
	sourceHeight: number;
	pageScaleFactor?: number;
}

interface PreviewErrorMessage {
	type: "preview-error";
	message: string;
}

interface PreviewFrameMessage {
	type: "frame";
	data: string;
	metadata?: {
		deviceWidth?: number;
		deviceHeight?: number;
		pageScaleFactor?: number;
	};
}

interface PreviewOverlayMessage extends BrowserPreviewOverlayState {
	type: "preview-overlay";
}

type PreviewServerMessage =
	| PreviewStateMessage
	| PreviewErrorMessage
	| PreviewFrameMessage
	| PreviewOverlayMessage;

export interface BrowserPreviewSourceMetadata {
	width: number;
	height: number;
	pageScaleFactor: number;
}

export interface BrowserPreviewControlMessage {
	type:
		| "preview-click"
		| "preview-wheel"
		| "preview-key"
		| "preview-paste"
		| "preview-sync";
	[key: string]: unknown;
}

function resolveWebSocketUrl(rawUrl: string) {
	if (/^wss?:\/\//i.test(rawUrl)) {
		return rawUrl;
	}

	const baseUrl = new URL(window.location.href);
	baseUrl.protocol = baseUrl.protocol === "https:" ? "wss:" : "ws:";
	baseUrl.pathname = rawUrl.startsWith("/") ? rawUrl : `/${rawUrl}`;
	baseUrl.search = "";
	baseUrl.hash = "";
	return baseUrl.toString();
}

function decodeBase64FramePayload(
	base64Payload: string,
	contentType = "image/jpeg",
): Blob | string {
	try {
		const decoded = window.atob(base64Payload);
		const bytes = new Uint8Array(decoded.length);
		for (let index = 0; index < decoded.length; index += 1) {
			bytes[index] = decoded.charCodeAt(index);
		}

		return new Blob([bytes], { type: contentType });
	} catch {
		return `data:${contentType};base64,${base64Payload}`;
	}
}

export function useBrowserPreviewSession(
	workspaceId: string | null,
	options?: {
		onMissingWorkspace?: (workspaceId: string) => Promise<unknown>;
		streamUrl?: string | null;
	},
) {
	const onMissingWorkspace = options?.onMissingWorkspace;
	const streamUrl = options?.streamUrl;
	const liveCanvasRef = useRef<HTMLCanvasElement | null>(null);
	const socketRef = useRef<WebSocket | null>(null);
	const frameLoaderRef = useRef<object | null>(null);
	const frameQueueStateRef = useRef(createBrowserPreviewFrameQueueState());
	const hasReachedLiveRef = useRef(false);

	const [status, setStatus] = useState<PreviewStatus>("connecting");
	const [error, setError] = useState<string | null>(null);
	const [sourceMetadata, setSourceMetadata] =
		useState<BrowserPreviewSourceMetadata | null>(null);
	const [settledScreenshotRevision, setSettledScreenshotRevision] =
		useState<number | null>(null);
	const [canSendControl, setCanSendControl] = useState(false);
	const [overlayState, setOverlayState] =
		useState<BrowserPreviewOverlayState | null>(null);

	const updateSourceMetadata = useCallback(
		(nextMetadata: BrowserPreviewSourceMetadata) => {
			setSourceMetadata((currentMetadata) => {
				if (
					currentMetadata?.width === nextMetadata.width &&
					currentMetadata?.height === nextMetadata.height &&
					currentMetadata?.pageScaleFactor === nextMetadata.pageScaleFactor
				) {
					return currentMetadata;
				}

				return nextMetadata;
			});
		},
		[],
	);

	const sendControlMessage = useCallback((message: BrowserPreviewControlMessage) => {
		const socket = socketRef.current;
		if (!socket || socket.readyState !== WebSocket.OPEN) {
			return false;
		}

		socket.send(JSON.stringify(message));
		return true;
	}, []);

	const resetFrameQueue = useCallback(() => {
		frameLoaderRef.current = null;
		frameQueueStateRef.current = createBrowserPreviewFrameQueueState();
	}, []);

	const promoteLoadedFrame = useCallback((frameImage: HTMLImageElement | ImageBitmap) => {
		const canvas = liveCanvasRef.current;
		if (!canvas) {
			return;
		}

		const width = Math.max(
			1,
			"naturalWidth" in frameImage
				? frameImage.naturalWidth || frameImage.width || 1
				: frameImage.width || 1,
		);
		const height = Math.max(
			1,
			"naturalHeight" in frameImage
				? frameImage.naturalHeight || frameImage.height || 1
				: frameImage.height || 1,
		);
		if (canvas.width !== width) {
			canvas.width = width;
		}
		if (canvas.height !== height) {
			canvas.height = height;
		}

		const context = canvas.getContext("2d");
		if (!context) {
			return;
		}

		context.clearRect(0, 0, width, height);
		context.drawImage(frameImage, 0, 0, width, height);
	}, []);

	const loadQueuedFrame = useCallback(
		(framePayload: BrowserPreviewFramePayload) => {
			const loaderToken = {};
			frameLoaderRef.current = loaderToken;

			const settleFrameLoad = () => {
				if (frameLoaderRef.current !== loaderToken) {
					return;
				}

				const { frameToLoad, nextState } = completeBrowserPreviewFrameLoad(
					frameQueueStateRef.current,
				);
				frameLoaderRef.current = null;
				frameQueueStateRef.current = nextState;

				if (frameToLoad) {
					loadQueuedFrame(frameToLoad);
				}
			};

			if (
				framePayload instanceof Blob &&
				typeof window.createImageBitmap === "function"
			) {
				void window.createImageBitmap(framePayload)
					.then((frameBitmap) => {
						if (frameLoaderRef.current !== loaderToken) {
							frameBitmap.close();
							return;
						}

						promoteLoadedFrame(frameBitmap);
						frameBitmap.close();
						settleFrameLoad();
					})
					.catch(() => {
						settleFrameLoad();
					});
				return;
			}

			const loader = new window.Image();
			loader.decoding = "async";
			let objectUrl: string | null = null;

			loader.onload = () => {
				if (frameLoaderRef.current !== loaderToken) {
					if (objectUrl) {
						window.URL.revokeObjectURL(objectUrl);
					}
					return;
				}

				promoteLoadedFrame(loader);
				if (objectUrl) {
					window.URL.revokeObjectURL(objectUrl);
				}
				settleFrameLoad();
			};

			loader.onerror = () => {
				if (objectUrl) {
					window.URL.revokeObjectURL(objectUrl);
				}
				settleFrameLoad();
			};

			if (typeof framePayload === "string") {
				loader.src = framePayload;
				return;
			}

			objectUrl = window.URL.createObjectURL(framePayload);
			loader.src = objectUrl;
		},
		[promoteLoadedFrame],
	);

	const queueLiveFrame = useCallback(
		(framePayload: BrowserPreviewFramePayload) => {
			const { frameToLoad, nextState } = enqueueBrowserPreviewFrame(
				frameQueueStateRef.current,
				framePayload,
			);
			frameQueueStateRef.current = nextState;

			if (frameToLoad) {
				loadQueuedFrame(frameToLoad);
			}
		},
		[loadQueuedFrame],
	);

	useEffect(() => {
		if (!workspaceId) {
			resetFrameQueue();
			setStatus("fallback");
			setError(null);
			setCanSendControl(false);
			setOverlayState(null);
			return;
		}

		let cancelled = false;
		let socket: WebSocket | null = null;

		function teardown() {
			setCanSendControl(false);
			socketRef.current = null;
			if (socket) {
				socket.close();
			}
		}

		setStatus("connecting");
		setError(null);
		setSourceMetadata(null);
		setSettledScreenshotRevision(null);
		setOverlayState(null);
		hasReachedLiveRef.current = false;
		resetFrameQueue();

		void (async () => {
			try {
				const streamConfig = streamUrl
					? {
						enabled: true,
						wsUrl: streamUrl,
					}
					: await getBrowserWorkspaceStream(workspaceId);
				if (cancelled) {
					return;
				}

				if (!streamConfig.enabled || !streamConfig.wsUrl) {
					throw new Error("Browser preview stream is unavailable.");
				}

				socket = new window.WebSocket(resolveWebSocketUrl(streamConfig.wsUrl));
				socket.binaryType = "blob";
				socketRef.current = socket;
				const activeSocket = socket;

				socket.addEventListener("open", () => {
					if (cancelled) {
						return;
					}

					setCanSendControl(true);
					activeSocket.send(JSON.stringify({ type: "preview-sync" }));
				});

				socket.addEventListener("message", (event) => {
					if (cancelled) {
						return;
					}

					if (typeof event.data !== "string") {
						const frameBlob = event.data instanceof Blob
							? event.data
							: new Blob([event.data], { type: "image/jpeg" });
						queueLiveFrame(frameBlob);
						if (!hasReachedLiveRef.current) {
							hasReachedLiveRef.current = true;
							setStatus("live");
						}
						return;
					}

					try {
						const payload = JSON.parse(event.data) as PreviewServerMessage;
						if (payload.type === "preview-error") {
							setError(payload.message);
							setStatus("fallback");
							setCanSendControl(false);
							return;
						}

						if (payload.type === "preview-state") {
							updateSourceMetadata({
								width: payload.sourceWidth,
								height: payload.sourceHeight,
								pageScaleFactor: payload.pageScaleFactor ?? 1,
							});
							setSettledScreenshotRevision(payload.settledScreenshotRevision);
							setStatus(payload.status);
							return;
						}

						if (payload.type === "preview-overlay") {
							setOverlayState({
								cursor: payload.cursor,
								activity: payload.activity,
								updatedAt: payload.updatedAt,
							});
							return;
						}

						if (payload.type === "frame" && typeof payload.data === "string") {
							if (payload.metadata?.deviceWidth && payload.metadata?.deviceHeight) {
								updateSourceMetadata({
									width: payload.metadata.deviceWidth,
									height: payload.metadata.deviceHeight,
									pageScaleFactor: payload.metadata.pageScaleFactor ?? 1,
								});
							}
							queueLiveFrame(decodeBase64FramePayload(payload.data));
							if (!hasReachedLiveRef.current) {
								hasReachedLiveRef.current = true;
								setStatus("live");
							}
						}
					} catch {
						setError("Received malformed browser preview stream payload.");
						setStatus("fallback");
						setCanSendControl(false);
					}
				});

				socket.addEventListener("close", () => {
					if (cancelled) {
						return;
					}

					setCanSendControl(false);
					setStatus("fallback");
				});

				socket.addEventListener("error", () => {
					if (cancelled) {
						return;
					}

					setError("Browser preview connection dropped.");
					setCanSendControl(false);
					setStatus("fallback");
				});
			} catch (caughtError) {
				if (cancelled) {
					return;
				}

				if (
					workspaceId &&
					typeof onMissingWorkspace === "function" &&
					isMissingBrowserWorkspaceError(caughtError)
				) {
					await onMissingWorkspace(workspaceId);
					return;
				}

				setStatus("fallback");
				setCanSendControl(false);
				setError(
					caughtError instanceof Error
						? caughtError.message
						: "Failed to establish the browser preview session.",
				);
			}
		})();

		return () => {
			cancelled = true;
			resetFrameQueue();
			teardown();
		};
	}, [onMissingWorkspace, queueLiveFrame, resetFrameQueue, streamUrl, updateSourceMetadata, workspaceId]);

	return {
		liveCanvasRef,
		status,
		error,
		sourceMetadata,
		settledScreenshotRevision,
		overlayState,
		canSendControl,
		sendControlMessage,
	};
}
