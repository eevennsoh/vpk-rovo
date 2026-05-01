"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMotionValue, useReducedMotion, useSpring } from "motion/react";
import { useTheme } from "@/components/utils/theme-wrapper";
import { cn } from "@/lib/utils";
import {
	createNeuralCamera,
	focusNeuralCameraOnPoint,
	panNeuralCamera,
	viewportToWorld,
	zoomNeuralCameraAtPoint,
	worldToViewport,
	type NeuralCamera,
	type NeuralPoint,
	type NeuralViewport,
} from "./lib/neural-graph/camera";
import { hitTestNeuralNode, isMeaningfulDrag } from "./lib/neural-graph/interaction";
import { computeNeuralGraphLayout, type NeuralGraphLayout, type NeuralLayoutNode } from "./lib/neural-graph/layout";
import { shouldAnimateNeuralGraph, type NeuralGraphParams } from "./lib/neural-graph/params";
import { createNeuralGraphStore, getSelectedNeighborhood, type NeuralGraphStore } from "./lib/neural-graph/store";
import { drawNeuralGraph, type NeuralGraphThemeMode } from "./lib/neural-graph/renderer";
import type { VaultExplorer } from "./lib/personal-graph-types";

interface PersonalGraphNeuralCanvasProps {
	background?: "default" | "transparent";
	explorer: VaultExplorer | null;
	isLoading?: boolean;
	onClearSelection: () => void;
	onSelectNode: (nodeId: string) => void;
	params: NeuralGraphParams;
	selectedNodeId: string | null;
	showSelectionOverlay?: boolean;
	themeMode?: NeuralGraphThemeMode;
}

interface SelectedOverlayState {
	neighbors: ReturnType<typeof getSelectedNeighborhood>;
	node: NeuralLayoutNode;
	x: number;
	y: number;
}

const EMPTY_VIEWPORT = { height: 620, width: 960 } satisfies NeuralViewport;

const ZOOM_SPRING_CONFIG = { stiffness: 220, damping: 28, mass: 0.5, restDelta: 0.0005 } as const;
const ZOOM_SPRING_INSTANT = { stiffness: 4000, damping: 200, mass: 0.05, restDelta: 0.0005 } as const;
const FOCUS_SPRING_CONFIG = { stiffness: 160, damping: 24, mass: 0.7, restDelta: 0.0005 } as const;
const FOCUS_SPRING_INSTANT = { stiffness: 4000, damping: 220, mass: 0.05, restDelta: 0.0005 } as const;

function getPointerPoint(event: React.PointerEvent<HTMLDivElement> | React.WheelEvent<HTMLDivElement>): NeuralPoint {
	const rect = event.currentTarget.getBoundingClientRect();
	return {
		x: event.clientX - rect.left,
		y: event.clientY - rect.top,
	};
}

function getSelectedOverlayState({
	camera,
	layout,
	params,
	selectedNodeId,
	store,
	viewport,
}: {
	camera: NeuralCamera;
	layout: NeuralGraphLayout;
	params: NeuralGraphParams;
	selectedNodeId: string | null;
	store: NeuralGraphStore;
	viewport: NeuralViewport;
}): SelectedOverlayState | null {
	if (!selectedNodeId) return null;
	const node = layout.nodesById.get(selectedNodeId);
	if (!node) return null;
	const point = worldToViewport(node, camera, viewport, params);
	const width = 292;
	const height = 188;
	const isCompact = viewport.width < 640;

	return {
		neighbors: getSelectedNeighborhood(store, selectedNodeId, 6),
		node,
		x: isCompact ? 16 : Math.min(viewport.width - width - 16, Math.max(16, point.x + 20)),
		y: isCompact ? 16 : Math.min(viewport.height - height - 16, Math.max(74, point.y - height * 0.5)),
	};
}

function shouldUpdateOverlay(current: SelectedOverlayState | null, next: SelectedOverlayState | null) {
	if (!current || !next) return current !== next;
	return (
		current.node.id !== next.node.id ||
		Math.abs(current.x - next.x) > 1 ||
		Math.abs(current.y - next.y) > 1 ||
		current.neighbors.length !== next.neighbors.length
	);
}

function SelectedNodeOverlay({
	onSelectNode,
	overlay,
}: Readonly<{
	onSelectNode: (nodeId: string) => void;
	overlay: SelectedOverlayState | null;
}>) {
	if (!overlay) return null;

	return (
		<aside
			className="pointer-events-auto absolute z-30 max-h-[220px] w-[min(292px,calc(100vw-32px))] overflow-y-auto rounded-md border border-border bg-surface-overlay/95 p-4 text-text shadow-xl backdrop-blur sm:max-h-none"
			style={{ left: overlay.x, top: overlay.y }}
		>
			<div className="mb-3 flex items-center justify-between gap-3">
				<span className="truncate text-[10px] font-semibold uppercase tracking-[0.14em] text-text-subtle">{overlay.node.node.kind}</span>
				<span className="text-[10px] text-text-subtle">{overlay.node.node.degree} links</span>
			</div>
			<h2 className="line-clamp-2 text-sm font-semibold leading-5 text-text">{overlay.node.node.title}</h2>
			<p className="mt-2 line-clamp-3 text-xs leading-5 text-text-subtle">
				{overlay.node.node.bodyPreview || overlay.node.node.relativePath}
			</p>
			{overlay.neighbors.length > 0 ? (
				<div className="mt-4 grid gap-2">
					{overlay.neighbors.slice(0, 3).map(({ edge, node }) => (
						<button
							className="rounded border border-border bg-surface px-3 py-2 text-left text-xs text-text-subtle hover:bg-surface-hover hover:text-text"
							key={`${edge.id}-${node.id}`}
							onClick={() => onSelectNode(node.id)}
							type="button"
						>
							<span className="block truncate font-medium text-text">{node.title}</span>
							<span className="block truncate">{edge.label || edge.kind.replaceAll("_", " ")}</span>
						</button>
					))}
				</div>
			) : null}
		</aside>
	);
}

export function PersonalGraphNeuralCanvas({
	background = "default",
	explorer,
	isLoading = false,
	onClearSelection,
	onSelectNode,
	params,
	selectedNodeId,
	showSelectionOverlay = true,
	themeMode,
}: Readonly<PersonalGraphNeuralCanvasProps>) {
	const { actualTheme } = useTheme();
	const renderTheme = themeMode ?? actualTheme;
	const reduceMotion = Boolean(useReducedMotion());
	const canvasRef = useRef<HTMLCanvasElement | null>(null);
	const containerRef = useRef<HTMLDivElement | null>(null);
	const cameraRef = useRef<NeuralCamera>(createNeuralCamera());
	const dragStartRef = useRef<NeuralPoint | null>(null);
	const lastPointerRef = useRef<NeuralPoint | null>(null);
	const wheelAnchorRef = useRef<NeuralPoint | null>(null);
	const layoutRef = useRef<NeuralGraphLayout | null>(null);
	const requestRenderRef = useRef<() => void>(() => {});
	const selectedOverlayRef = useRef<SelectedOverlayState | null>(null);
	const targetZoomMV = useMotionValue(cameraRef.current.zoom);
	const smoothZoomMV = useSpring(targetZoomMV, reduceMotion ? ZOOM_SPRING_INSTANT : ZOOM_SPRING_CONFIG);
	const targetFocusMV = useMotionValue(selectedNodeId ? 1 : 0);
	const focusProgressMV = useSpring(targetFocusMV, reduceMotion ? FOCUS_SPRING_INSTANT : FOCUS_SPRING_CONFIG);
	const focusProgressRef = useRef(selectedNodeId ? 1 : 0);
	const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
	const hoveredNodeIdRef = useRef<string | null>(null);
	const [isPanning, setIsPanning] = useState(false);
	const isPanningRef = useRef(false);
	const [selectedOverlay, setSelectedOverlay] = useState<SelectedOverlayState | null>(null);
	const [viewport, setViewport] = useState<NeuralViewport>(EMPTY_VIEWPORT);
	const store = useMemo(() => createNeuralGraphStore(explorer), [explorer]);
	const hasGraph = store.nodes.length > 0;

	useEffect(() => {
		hoveredNodeIdRef.current = hoveredNodeId;
	}, [hoveredNodeId]);

	useEffect(() => {
		const container = containerRef.current;
		if (!container) return;

		const updateSize = () => {
			const rect = container.getBoundingClientRect();
			setViewport({
				height: Math.max(1, rect.height),
				width: Math.max(1, rect.width),
			});
		};

		updateSize();
		const resizeObserver = new ResizeObserver(updateSize);
		resizeObserver.observe(container);
		return () => resizeObserver.disconnect();
	}, []);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const context = canvas.getContext("2d");
		if (!context) return;

		let animationFrame = 0;
		let staticFrame = 0;
		const pixelRatio = window.devicePixelRatio || 1;
		canvas.width = Math.max(1, Math.floor(viewport.width * pixelRatio));
		canvas.height = Math.max(1, Math.floor(viewport.height * pixelRatio));
		canvas.style.width = `${viewport.width}px`;
		canvas.style.height = `${viewport.height}px`;

		const startedAt = performance.now();
		const shouldLoop = shouldAnimateNeuralGraph(params, reduceMotion);
		const render = (now: number) => {
			context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
			const layout = computeNeuralGraphLayout({
				focusProgress: focusProgressRef.current,
				params,
				reduceMotion,
				selectedNodeId,
				store,
				time: reduceMotion ? 0 : (now - startedAt) / 1000,
				viewport,
			});
			layoutRef.current = layout;
			drawNeuralGraph(context, layout, {
				background,
				camera: cameraRef.current,
				focusProgress: focusProgressRef.current,
				hoveredNodeId: hoveredNodeIdRef.current,
				params,
				selectedNodeId,
				theme: renderTheme,
				viewport,
			});

			const nextOverlay = getSelectedOverlayState({
				camera: cameraRef.current,
				layout,
				params,
				selectedNodeId,
				store,
				viewport,
			});
			if (shouldUpdateOverlay(selectedOverlayRef.current, nextOverlay)) {
				selectedOverlayRef.current = nextOverlay;
				setSelectedOverlay(nextOverlay);
			}

			if (shouldLoop) {
				animationFrame = window.requestAnimationFrame(render);
			}
		};

		requestRenderRef.current = () => {
			if (shouldLoop || staticFrame) {
				return;
			}

			staticFrame = window.requestAnimationFrame((now) => {
				staticFrame = 0;
				render(now);
			});
		};

		requestRenderRef.current();
		if (shouldLoop) {
			animationFrame = window.requestAnimationFrame(render);
		}
		return () => {
			requestRenderRef.current = () => {};
			window.cancelAnimationFrame(animationFrame);
			window.cancelAnimationFrame(staticFrame);
		};
	}, [background, params, reduceMotion, renderTheme, selectedNodeId, store, viewport]);

	useEffect(() => {
		targetFocusMV.set(selectedNodeId ? 1 : 0);
	}, [selectedNodeId, targetFocusMV]);

	useEffect(() => {
		return focusProgressMV.on("change", (nextFocusProgress) => {
			focusProgressRef.current = nextFocusProgress;
			requestRenderRef.current();
		});
	}, [focusProgressMV]);

	useEffect(() => {
		return smoothZoomMV.on("change", (nextZoom) => {
			const cam = cameraRef.current;
			if (cam.zoom === nextZoom) return;
			const anchor = wheelAnchorRef.current;
			if (anchor) {
				const before = viewportToWorld(anchor, cam, viewport, params);
				const next = { ...cam, zoom: nextZoom };
				const after = viewportToWorld(anchor, next, viewport, params);
				cameraRef.current = {
					...next,
					x: next.x + before.x - after.x,
					y: next.y + before.y - after.y,
				};
			} else {
				cameraRef.current = { ...cam, zoom: nextZoom };
			}
			requestRenderRef.current();
		});
	}, [smoothZoomMV, params, viewport]);

	useEffect(() => {
		if (!selectedNodeId) {
			cameraRef.current = createNeuralCamera({ zoom: cameraRef.current.zoom });
			targetZoomMV.jump(cameraRef.current.zoom);
			selectedOverlayRef.current = null;
			setSelectedOverlay(null);
			requestRenderRef.current();
			return;
		}

		const layout = layoutRef.current ?? computeNeuralGraphLayout({
			focusProgress: focusProgressRef.current,
			params,
			reduceMotion,
			selectedNodeId,
			store,
			viewport,
		});
		const node = layout?.nodesById.get(selectedNodeId);
		if (!node) return;
		cameraRef.current = focusNeuralCameraOnPoint({
			camera: cameraRef.current,
			params,
			point: node,
			viewport,
		});
		wheelAnchorRef.current = null;
		targetZoomMV.jump(cameraRef.current.zoom);
		requestRenderRef.current();
	}, [params, reduceMotion, selectedNodeId, store, targetZoomMV, viewport]);

	const updateHover = useCallback((point: NeuralPoint) => {
		const layout = layoutRef.current;
		if (!layout) {
			setHoveredNodeId(null);
			return;
		}
		const hit = hitTestNeuralNode({
			camera: cameraRef.current,
			layout,
			params,
			point,
			viewport,
		});
		setHoveredNodeId(hit?.node.id ?? null);
		hoveredNodeIdRef.current = hit?.node.id ?? null;
		requestRenderRef.current();
	}, [params, viewport]);

	const handlePointerDown = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
		const point = getPointerPoint(event);
		dragStartRef.current = point;
		lastPointerRef.current = point;
		isPanningRef.current = true;
		setIsPanning(true);
		event.currentTarget.setPointerCapture(event.pointerId);
	}, []);

	const handlePointerMove = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
		const point = getPointerPoint(event);
		if (isPanningRef.current && lastPointerRef.current) {
			const delta = {
				x: point.x - lastPointerRef.current.x,
				y: point.y - lastPointerRef.current.y,
			};
			cameraRef.current = panNeuralCamera(cameraRef.current, delta);
			requestRenderRef.current();
		} else {
			updateHover(point);
		}
		lastPointerRef.current = point;
	}, [updateHover]);

	const handlePointerUp = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
		const point = getPointerPoint(event);
		const start = dragStartRef.current;
		const dragged = start ? isMeaningfulDrag(start, point) : false;
		isPanningRef.current = false;
		setIsPanning(false);
		dragStartRef.current = null;
		lastPointerRef.current = null;
		updateHover(point);

		if (!dragged) {
			const layout = layoutRef.current;
			const hit = layout
				? hitTestNeuralNode({
					camera: cameraRef.current,
					layout,
					params,
					point,
					viewport,
				})
				: null;
			if (hit) {
				onSelectNode(hit.node.id);
			} else {
				onClearSelection();
			}
		}
	}, [onClearSelection, onSelectNode, params, updateHover, viewport]);

	const handleWheel = useCallback((event: React.WheelEvent<HTMLDivElement>) => {
		event.preventDefault();
		const pointer = getPointerPoint(event);
		wheelAnchorRef.current = pointer;
		const target = zoomNeuralCameraAtPoint({
			camera: { ...cameraRef.current, zoom: targetZoomMV.get() },
			delta: event.deltaY,
			deltaMode: event.deltaMode,
			params,
			pointer,
			viewport,
		});
		targetZoomMV.set(target.zoom);
	}, [params, targetZoomMV, viewport]);

	const cursorClass = isPanning ? "cursor-grabbing" : hoveredNodeId ? "cursor-pointer" : "cursor-grab";
	const backgroundClass = background === "transparent" ? "bg-transparent" : "bg-surface";
	const statusTextClass = background === "transparent" ? "text-neutral-500" : "text-text-subtle";

	return (
		<div className={cn("relative h-full min-h-[620px] overflow-hidden", backgroundClass)} data-neural-graph-renderer="owned-canvas">
			<div
				className={cn("relative h-full w-full touch-none", cursorClass)}
				onPointerDown={handlePointerDown}
				onPointerLeave={() => {
					if (!isPanningRef.current) {
						hoveredNodeIdRef.current = null;
						setHoveredNodeId(null);
						requestRenderRef.current();
					}
				}}
				onPointerMove={handlePointerMove}
				onPointerUp={handlePointerUp}
				onWheel={handleWheel}
				ref={containerRef}
			>
				<canvas aria-hidden="true" className="block h-full w-full" ref={canvasRef} />
			</div>
			{showSelectionOverlay ? (
				<SelectedNodeOverlay onSelectNode={onSelectNode} overlay={selectedOverlay} />
			) : null}
			{isLoading ? (
				<div className={cn("pointer-events-none absolute inset-0 z-40 flex items-center justify-center text-sm", statusTextClass)}>
					Loading vault graph...
				</div>
			) : null}
			{!isLoading && !hasGraph ? (
				<div className={cn("pointer-events-none absolute inset-0 z-40 flex items-center justify-center p-8 text-center text-sm", statusTextClass)}>
					No Personal Graph nodes are available. Choose a vault folder and refresh.
				</div>
			) : null}
		</div>
	);
}
