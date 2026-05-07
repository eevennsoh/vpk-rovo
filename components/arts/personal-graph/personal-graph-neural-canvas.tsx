"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { useMotionValue, useReducedMotion, useSpring } from "motion/react";
import { ensureReady, type PlayOptions } from "@web-kits/audio";
import { useSound } from "@web-kits/audio/react";
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
import { hitTestNeuralNode, hitTestNeuralRay, isMeaningfulDrag, type NeuralRayHitTestResult } from "./lib/neural-graph/interaction";
import { resolveNeuralGraphCssColorValue } from "./lib/neural-graph/colors";
import {
	EMPTY_NEURAL_GRAPH_INTERACTION_STATE,
	getNeuralInteractionTargetIntensity,
	getNeuralPointerVelocity,
	getSmoothedNeuralGraphInteractionState,
	type NeuralGraphInteractionHitTarget,
	type NeuralGraphInteractionSettings,
	type NeuralGraphInteractionState,
	type NeuralPointerVelocity,
} from "./lib/neural-graph/interaction-dynamics";
import { computeNeuralGraphLayout, type NeuralGraphLayout, type NeuralLayoutNode } from "./lib/neural-graph/layout";
import { shouldAnimateNeuralGraph, type NeuralGraphParams } from "./lib/neural-graph/params";
import {
	INITIAL_NEURAL_NODE_SOUND_TRIGGER_STATE,
	INITIAL_NEURAL_RAY_SOUND_TRIGGER_STATE,
	NEURAL_NODE_HOVER_SOUND_DEFINITION,
	NEURAL_RAY_SOUND_DEFINITION,
	getNeuralNodeSoundPlayOptions,
	getNeuralRaySoundPlayOptions,
	getNextNeuralNodeSoundTriggerState,
	getNextNeuralRaySoundTriggerState,
	shouldTriggerNeuralNodeSound,
	shouldTriggerNeuralRaySound,
	type NeuralNodeSoundSettings,
	type NeuralRaySoundSettings,
} from "./lib/neural-graph/ray-sound";
import { createNeuralGraphStore, getSelectedNeighborhood, type NeuralGraphStore } from "./lib/neural-graph/store";
import { drawNeuralGraph, type NeuralGraphThemeMode, type NeuralRayElasticState } from "./lib/neural-graph/renderer";
import type { VaultExplorer } from "./lib/personal-graph-types";

interface PersonalGraphNeuralCanvasProps {
	background?: "default" | "transparent";
	explorer: VaultExplorer | null;
	isLoading?: boolean;
	interactionSettings?: NeuralGraphInteractionSettings;
	onClearSelection: () => void;
	onSelectNode: (nodeId: string) => void;
	params: NeuralGraphParams;
	rayOriginBottomOffset?: number;
	raySoundSettings?: NeuralRaySoundSettings;
	selectedNodeId: string | null;
	showSelectionOverlay?: boolean;
	store?: NeuralGraphStore;
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
const RAY_ELASTIC_SPRING_INSTANT = { stiffness: 4000, damping: 220, mass: 0.05, restDelta: 0.0005 } as const;
const INTERACTION_SPRING_CONFIG = { stiffness: 92, damping: 28, mass: 0.9, restDelta: 0.001 } as const;
const INTERACTION_SPRING_INSTANT = { stiffness: 4000, damping: 220, mass: 0.05, restDelta: 0.001 } as const;
const INTERACTION_SMOOTHING_BY_TARGET: Record<NeuralGraphInteractionHitTarget, number> = {
	node: 0.12,
	none: 0.16,
	ray: 0.24,
};

const HOVER_TRANSITION_TAU_SECONDS = 0.05;
const HOVER_PROGRESS_SETTLE_EPSILON = 0.001;

function cloneInteractionState(state: NeuralGraphInteractionState): NeuralGraphInteractionState {
	return {
		...state,
		pointer: state.pointer ? { ...state.pointer } : null,
	};
}

function formatSignedPixels(value: number): string {
	if (value < 0) return `- ${Math.abs(value)}px`;
	return `+ ${value}px`;
}

function getOriginMarkerInset(params: NeuralGraphParams, viewport?: NeuralViewport) {
	const inset = params.originMarkerSize / 2;
	return viewport ? Math.min(inset, viewport.height / 2) : inset;
}

function getOriginMarkerVisualStyle(params: NeuralGraphParams): CSSProperties {
	return {
		backgroundColor: params.originMarkerColor,
		borderRadius: params.nodeShape === "square" ? params.nodeRadius : 9999,
		height: params.originMarkerSize,
		width: params.originMarkerSize,
	};
}

function getOriginMarkerStyle(params: NeuralGraphParams): CSSProperties {
	const markerInset = getOriginMarkerInset(params);
	return {
		...getOriginMarkerVisualStyle(params),
		left: `calc(50% ${formatSignedPixels(params.originOffset)})`,
		top: `clamp(${markerInset}px, ${params.rayOriginY * 100}%, calc(100% - ${markerInset}px))`,
	};
}

function getRayOriginY({
	params,
	rayOriginBottomOffset,
	viewport,
}: {
	params: NeuralGraphParams;
	rayOriginBottomOffset?: number;
	viewport: NeuralViewport;
}) {
	if (typeof rayOriginBottomOffset !== "number") return viewport.height * params.rayOriginY;
	const markerInset = getOriginMarkerInset(params, viewport);
	return Math.min(
		viewport.height - markerInset,
		Math.max(markerInset, viewport.height - rayOriginBottomOffset),
	);
}

function getOriginMarkerStyleForViewport(params: NeuralGraphParams, viewport: NeuralViewport, rayOriginBottomOffset?: number): CSSProperties {
	if (typeof rayOriginBottomOffset !== "number") return getOriginMarkerStyle(params);
	return {
		...getOriginMarkerVisualStyle(params),
		left: `calc(50% ${formatSignedPixels(params.originOffset)})`,
		top: getRayOriginY({ params, rayOriginBottomOffset, viewport }),
	};
}

function getPointerPoint(event: React.PointerEvent<HTMLDivElement>): NeuralPoint {
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
	interactionSettings,
	onClearSelection,
	onSelectNode,
	params,
	rayOriginBottomOffset,
	raySoundSettings,
	selectedNodeId,
	showSelectionOverlay = true,
	store: providedStore,
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
	const targetRayElasticXMV = useMotionValue(0);
	const targetRayElasticYMV = useMotionValue(0);
	const targetRayElasticProgressMV = useMotionValue(0);
	const rayElasticSpringConfig = useMemo(
		() => reduceMotion
			? RAY_ELASTIC_SPRING_INSTANT
			: {
				stiffness: params.rayElasticTension,
				damping: params.rayElasticDamping,
				mass: 0.55,
				restDelta: 0.001,
			},
		[params.rayElasticDamping, params.rayElasticTension, reduceMotion],
	);
	const smoothRayElasticXMV = useSpring(targetRayElasticXMV, rayElasticSpringConfig);
	const smoothRayElasticYMV = useSpring(targetRayElasticYMV, rayElasticSpringConfig);
	const smoothRayElasticProgressMV = useSpring(targetRayElasticProgressMV, rayElasticSpringConfig);
	const targetInteractionIntensityMV = useMotionValue(0);
	const smoothInteractionIntensityMV = useSpring(
		targetInteractionIntensityMV,
		reduceMotion ? INTERACTION_SPRING_INSTANT : INTERACTION_SPRING_CONFIG,
	);
	const rayElasticRef = useRef<NeuralRayElasticState>({
		point: { x: 0, y: 0 },
		progress: 0,
	});
	const interactionRef = useRef<NeuralGraphInteractionState>(cloneInteractionState(EMPTY_NEURAL_GRAPH_INTERACTION_STATE));
	const pointerVelocityRef = useRef<{
		point: NeuralPoint | null;
		time: number | null;
		velocity: NeuralPointerVelocity;
	}>({
		point: null,
		time: null,
		velocity: { normalized: 0, pxPerSecond: 0 },
	});
	const raySoundPlayOptionsRef = useRef<PlayOptions>({});
	const nodeSoundPlayOptionsRef = useRef<PlayOptions>({});
	const playRaySound = useSound(NEURAL_RAY_SOUND_DEFINITION, raySoundPlayOptionsRef.current);
	const playNodeSound = useSound(NEURAL_NODE_HOVER_SOUND_DEFINITION, nodeSoundPlayOptionsRef.current);
	const interactionSettingsRef = useRef<NeuralGraphInteractionSettings | undefined>(interactionSettings);
	const raySoundSettingsRef = useRef<NeuralRaySoundSettings | undefined>(raySoundSettings);
	const raySoundTriggerStateRef = useRef(INITIAL_NEURAL_RAY_SOUND_TRIGGER_STATE);
	const nodeSoundTriggerStateRef = useRef(INITIAL_NEURAL_NODE_SOUND_TRIGGER_STATE);
	const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
	const hoveredNodeIdRef = useRef<string | null>(null);
	const hoverProgressByNodeRef = useRef<Map<string, number>>(new Map());
	const [isPanning, setIsPanning] = useState(false);
	const isPanningRef = useRef(false);
	const [selectedOverlay, setSelectedOverlay] = useState<SelectedOverlayState | null>(null);
	const [viewport, setViewport] = useState<NeuralViewport>(EMPTY_VIEWPORT);
	const store = useMemo(() => providedStore ?? createNeuralGraphStore(explorer), [explorer, providedStore]);
	const hasGraph = store.nodes.length > 0;
	const rayOriginY = getRayOriginY({ params, rayOriginBottomOffset, viewport });
	const resolveGraphColor = useCallback((color: string) => {
		return resolveNeuralGraphCssColorValue(color, containerRef.current);
	}, []);

	useEffect(() => {
		hoveredNodeIdRef.current = hoveredNodeId;
	}, [hoveredNodeId]);

	useEffect(() => {
		raySoundSettingsRef.current = raySoundSettings;
		if (!raySoundSettings?.enabled) {
			raySoundTriggerStateRef.current = INITIAL_NEURAL_RAY_SOUND_TRIGGER_STATE;
		}
	}, [raySoundSettings]);

	useEffect(() => {
		interactionSettingsRef.current = interactionSettings;
		if (!interactionSettings?.enabled) {
			interactionRef.current = cloneInteractionState(EMPTY_NEURAL_GRAPH_INTERACTION_STATE);
			nodeSoundTriggerStateRef.current = INITIAL_NEURAL_NODE_SOUND_TRIGGER_STATE;
			targetInteractionIntensityMV.set(0);
		}
	}, [interactionSettings, targetInteractionIntensityMV]);

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
		let lastHoverFrameTime: number | null = null;
		const hoverProgressByNode = hoverProgressByNodeRef.current;
		const pixelRatio = window.devicePixelRatio || 1;
		canvas.width = Math.max(1, Math.floor(viewport.width * pixelRatio));
		canvas.height = Math.max(1, Math.floor(viewport.height * pixelRatio));
		canvas.style.width = `${viewport.width}px`;
		canvas.style.height = `${viewport.height}px`;

		const startedAt = performance.now();
		const shouldLoop = shouldAnimateNeuralGraph(params, reduceMotion);
		const advanceHoverProgress = (now: number, layoutNodeIds: ReadonlySet<string>): boolean => {
			const hoveredId = hoveredNodeIdRef.current;
			const dt = lastHoverFrameTime === null ? 0 : Math.min(0.1, (now - lastHoverFrameTime) / 1000);
			lastHoverFrameTime = now;
			const decayFactor = reduceMotion ? 1 : (dt > 0 ? 1 - Math.exp(-dt / HOVER_TRANSITION_TAU_SECONDS) : 0);
			let transitionActive = false;

			for (const id of [...hoverProgressByNode.keys()]) {
				if (!layoutNodeIds.has(id)) hoverProgressByNode.delete(id);
			}

			const candidateIds = new Set<string>(hoverProgressByNode.keys());
			if (hoveredId && layoutNodeIds.has(hoveredId)) candidateIds.add(hoveredId);

			for (const id of candidateIds) {
				const target = id === hoveredId ? 1 : 0;
				const current = hoverProgressByNode.get(id) ?? 0;
				const next = decayFactor >= 1 ? target : current + (target - current) * decayFactor;
				const settled = Math.abs(next - target) < HOVER_PROGRESS_SETTLE_EPSILON;
				const resolved = settled ? target : next;
				if (resolved <= 0) {
					hoverProgressByNode.delete(id);
				} else {
					hoverProgressByNode.set(id, resolved);
				}
				if (!settled) transitionActive = true;
			}

			return transitionActive;
		};
		const render = (now: number) => {
			const elapsedSeconds = reduceMotion ? undefined : (now - startedAt) / 1000;
			context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
			const layout = computeNeuralGraphLayout({
				focusProgress: focusProgressRef.current,
				interaction: interactionRef.current,
				params,
				reduceMotion,
				selectedNodeId,
				store,
				time: elapsedSeconds ?? 0,
				viewport,
			});
			layoutRef.current = layout;
			const layoutNodeIds = new Set(layout.nodes.map((entry) => entry.id));
			const hoverTransitionActive = advanceHoverProgress(now, layoutNodeIds);
			drawNeuralGraph(context, layout, {
				animationTime: elapsedSeconds,
				background,
				camera: cameraRef.current,
				focusProgress: focusProgressRef.current,
				hoveredNodeId: hoveredNodeIdRef.current,
				hoverProgressByNode,
				interaction: interactionRef.current,
				params,
				rayElastic: !reduceMotion && rayElasticRef.current.progress > 0 ? rayElasticRef.current : null,
				rayOriginY,
				resolveColor: resolveGraphColor,
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

			if (shouldLoop || hoverTransitionActive) {
				animationFrame = window.requestAnimationFrame(render);
			} else {
				lastHoverFrameTime = null;
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
	}, [background, params, rayOriginY, reduceMotion, renderTheme, resolveGraphColor, selectedNodeId, store, viewport]);

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
		return smoothRayElasticXMV.on("change", (nextX) => {
			rayElasticRef.current = {
				...rayElasticRef.current,
				point: { ...rayElasticRef.current.point, x: nextX },
			};
			requestRenderRef.current();
		});
	}, [smoothRayElasticXMV]);

	useEffect(() => {
		return smoothRayElasticYMV.on("change", (nextY) => {
			rayElasticRef.current = {
				...rayElasticRef.current,
				point: { ...rayElasticRef.current.point, y: nextY },
			};
			requestRenderRef.current();
		});
	}, [smoothRayElasticYMV]);

	useEffect(() => {
		return smoothRayElasticProgressMV.on("change", (nextProgress) => {
			const settled = nextProgress < 0.001;
			rayElasticRef.current = {
				...rayElasticRef.current,
				nodeId: settled ? null : rayElasticRef.current.nodeId,
				progress: settled ? 0 : nextProgress,
			};
			requestRenderRef.current();
		});
	}, [smoothRayElasticProgressMV]);

	useEffect(() => {
		return smoothInteractionIntensityMV.on("change", (nextIntensity) => {
			const settled = nextIntensity < 0.001;
			interactionRef.current = {
				...interactionRef.current,
				activeNodeId: settled ? null : interactionRef.current.activeNodeId,
				activeRayNodeId: settled ? null : interactionRef.current.activeRayNodeId,
				intensity: settled ? 0 : nextIntensity,
			};
			requestRenderRef.current();
		});
	}, [smoothInteractionIntensityMV]);

	useEffect(() => {
		if (
			reduceMotion
			|| !params.showRays
			|| params.rayElasticRadius <= 0
			|| params.rayElasticStrength <= 0
		) {
			targetRayElasticProgressMV.set(0);
		}
	}, [
		params.rayElasticRadius,
		params.rayElasticStrength,
		params.showRays,
		reduceMotion,
		targetRayElasticProgressMV,
	]);

	useEffect(() => {
		if (reduceMotion || !interactionSettings?.enabled) {
			targetInteractionIntensityMV.set(0);
		}
	}, [interactionSettings, reduceMotion, targetInteractionIntensityMV]);

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
			interaction: interactionRef.current,
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

	const resetRaySoundTrigger = useCallback(() => {
		raySoundTriggerStateRef.current = getNextNeuralRaySoundTriggerState({
			didPlay: false,
			nodeId: null,
			now: performance.now(),
			state: raySoundTriggerStateRef.current,
		});
	}, []);

	const resetNodeSoundTrigger = useCallback(() => {
		nodeSoundTriggerStateRef.current = getNextNeuralNodeSoundTriggerState({
			didPlay: false,
			nodeId: null,
			now: performance.now(),
			state: nodeSoundTriggerStateRef.current,
		});
	}, []);

	const getNodeSoundSettings = useCallback((): NeuralNodeSoundSettings | null => {
		const settings = interactionSettingsRef.current;
		if (!settings) return null;
		return {
			cooldownMs: settings.nodeSoundCooldownMs,
			enabled: settings.enabled && settings.nodeSoundEnabled,
			volume: settings.nodeSoundVolume,
		};
	}, []);

	const prepareGraphSound = useCallback(() => {
		const raySettings = raySoundSettingsRef.current;
		const nodeSettings = getNodeSoundSettings();
		if (
			(!raySettings?.enabled || raySettings.volume <= 0)
			&& (!nodeSettings?.enabled || nodeSettings.volume <= 0)
		) return;
		void ensureReady({ latencyHint: "interactive" }).catch(() => {});
	}, [getNodeSoundSettings]);

	const getPointerActivity = useCallback((point: NeuralPoint): NeuralPointerVelocity => {
		const now = performance.now();
		const previous = pointerVelocityRef.current;
		const velocity = getNeuralPointerVelocity({
			elapsedMs: previous.time === null ? 0 : now - previous.time,
			from: previous.point,
			to: point,
			viewport,
		});
		pointerVelocityRef.current = {
			point,
			time: now,
			velocity,
		};
		return velocity;
	}, [viewport]);

	const updateInteractionTarget = useCallback(({
		activeNodeId,
		activeRayId,
		point,
		rayDistance = 0,
		rayProgress = 0,
		velocity,
	}: {
		activeNodeId?: string | null;
		activeRayId?: string | null;
		point: NeuralPoint | null;
		rayDistance?: number;
		rayProgress?: number;
		velocity: NeuralPointerVelocity;
	}) => {
		const settings = interactionSettingsRef.current;
		if (!settings?.enabled || reduceMotion) {
			targetInteractionIntensityMV.set(0);
			return;
		}
		const target: NeuralGraphInteractionHitTarget = activeRayId ? "ray" : activeNodeId ? "node" : "none";
		const nextInteraction = {
			...cloneInteractionState(interactionRef.current),
			activeNodeId: activeNodeId ?? null,
			activeRayNodeId: activeRayId ?? null,
			flowBoost: settings.flowBoost,
			pointer: point,
			rayDistance,
			rayEmphasis: settings.rayEmphasis,
			rayProgress,
			velocity: velocity.normalized,
			velocityPxPerSecond: velocity.pxPerSecond,
		};
		interactionRef.current = getSmoothedNeuralGraphInteractionState({
			current: interactionRef.current,
			next: nextInteraction,
			smoothing: INTERACTION_SMOOTHING_BY_TARGET[target],
		});
		targetInteractionIntensityMV.set(getNeuralInteractionTargetIntensity({
			settings,
			target,
			velocity: velocity.normalized,
		}));
	}, [reduceMotion, targetInteractionIntensityMV]);

	const resetInteractionTarget = useCallback(() => {
		pointerVelocityRef.current = {
			point: null,
			time: null,
			velocity: { normalized: 0, pxPerSecond: 0 },
		};
		interactionRef.current = {
			...interactionRef.current,
			activeNodeId: null,
			activeRayNodeId: null,
			pointer: null,
			rayDistance: 0,
			rayProgress: 0,
			velocity: 0,
			velocityPxPerSecond: 0,
		};
		targetInteractionIntensityMV.set(0);
	}, [targetInteractionIntensityMV]);

	const triggerRaySound = useCallback((rayHit: NeuralRayHitTestResult, point: NeuralPoint) => {
		const settings = raySoundSettingsRef.current;
		if (!settings) return;

		const now = performance.now();
		const state = raySoundTriggerStateRef.current;
		const didPlay = shouldTriggerNeuralRaySound({
			nodeId: rayHit.node.id,
			now,
			settings,
			state,
		});
		raySoundTriggerStateRef.current = getNextNeuralRaySoundTriggerState({
			didPlay,
			nodeId: rayHit.node.id,
			now,
			state,
		});
		if (!didPlay) return;

		const playOptions = getNeuralRaySoundPlayOptions({
			hit: rayHit,
			params,
			pointer: point,
			settings,
			viewport,
		});

		void ensureReady({ latencyHint: "interactive" }).then(() => {
			if (!raySoundSettingsRef.current?.enabled) return;
			Object.assign(raySoundPlayOptionsRef.current, playOptions);
			playRaySound();
		}).catch(() => {});
	}, [params, playRaySound, viewport]);

	const triggerNodeSound = useCallback((hit: NonNullable<ReturnType<typeof hitTestNeuralNode>>, point: NeuralPoint) => {
		const settings = getNodeSoundSettings();
		if (!settings) return;

		const now = performance.now();
		const state = nodeSoundTriggerStateRef.current;
		const didPlay = shouldTriggerNeuralNodeSound({
			nodeId: hit.node.id,
			now,
			settings,
			state,
		});
		nodeSoundTriggerStateRef.current = getNextNeuralNodeSoundTriggerState({
			didPlay,
			nodeId: hit.node.id,
			now,
			state,
		});
		if (!didPlay) return;

		const playOptions = getNeuralNodeSoundPlayOptions({
			hit,
			pointer: point,
			settings,
			viewport,
		});

		void ensureReady({ latencyHint: "interactive" }).then(() => {
			const latestSettings = getNodeSoundSettings();
			if (!latestSettings?.enabled) return;
			Object.assign(nodeSoundPlayOptionsRef.current, playOptions);
			playNodeSound();
		}).catch(() => {});
	}, [getNodeSoundSettings, playNodeSound, viewport]);

	const updateHover = useCallback((point: NeuralPoint, options: { allowSound?: boolean; velocity?: NeuralPointerVelocity } = {}) => {
		const allowSound = options.allowSound ?? true;
		const velocity = options.velocity ?? pointerVelocityRef.current.velocity;
		const layout = layoutRef.current;
		if (!layout) {
			setHoveredNodeId(null);
			targetRayElasticProgressMV.set(0);
			updateInteractionTarget({ point, velocity });
			resetRaySoundTrigger();
			resetNodeSoundTrigger();
			return;
		}
		const hit = hitTestNeuralNode({
			camera: cameraRef.current,
			layout,
			params,
			point,
			viewport,
		});
		if (hit && allowSound) {
			triggerNodeSound(hit, point);
		}
		if (
			hit
			|| reduceMotion
			|| !params.showRays
			|| params.rayElasticRadius <= 0
			|| params.rayElasticStrength <= 0
		) {
			targetRayElasticProgressMV.set(0);
			updateInteractionTarget({
				activeNodeId: hit?.node.id ?? null,
				point,
				velocity,
			});
			resetRaySoundTrigger();
			if (!hit) {
				resetNodeSoundTrigger();
			}
		} else {
			const rayHit = hitTestNeuralRay({
				camera: cameraRef.current,
				layout,
				params,
				point,
				rayOriginY,
				viewport,
			});
			if (rayHit) {
				rayElasticRef.current = {
					...rayElasticRef.current,
					distance: rayHit.distance,
					hitProgress: rayHit.progress,
					intensity: Math.max(0.2, velocity.normalized),
					nodeId: rayHit.node.id,
					velocity: velocity.normalized,
				};
				targetRayElasticXMV.set(point.x);
				targetRayElasticYMV.set(point.y);
				targetRayElasticProgressMV.set(1);
				updateInteractionTarget({
					activeRayId: rayHit.node.id,
					point,
					rayDistance: rayHit.distance,
					rayProgress: rayHit.progress,
					velocity,
				});
				if (allowSound) {
					triggerRaySound(rayHit, point);
				}
				resetNodeSoundTrigger();
			} else {
				targetRayElasticProgressMV.set(0);
				updateInteractionTarget({ point, velocity });
				resetRaySoundTrigger();
				resetNodeSoundTrigger();
			}
		}
		setHoveredNodeId(hit?.node.id ?? null);
		hoveredNodeIdRef.current = hit?.node.id ?? null;
		requestRenderRef.current();
	}, [
		params,
		rayOriginY,
		reduceMotion,
		resetNodeSoundTrigger,
		resetRaySoundTrigger,
		targetRayElasticProgressMV,
		targetRayElasticXMV,
		targetRayElasticYMV,
		triggerNodeSound,
		triggerRaySound,
		updateInteractionTarget,
		viewport,
	]);

	const handlePointerDown = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
		const point = getPointerPoint(event);
		prepareGraphSound();
		pointerVelocityRef.current = {
			point,
			time: performance.now(),
			velocity: { normalized: 0, pxPerSecond: 0 },
		};
		dragStartRef.current = point;
		lastPointerRef.current = point;
		isPanningRef.current = true;
		setIsPanning(true);
		event.currentTarget.setPointerCapture(event.pointerId);
	}, [prepareGraphSound]);

	const handlePointerMove = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
		const point = getPointerPoint(event);
		const velocity = getPointerActivity(point);
		if (isPanningRef.current && lastPointerRef.current) {
			const delta = {
				x: point.x - lastPointerRef.current.x,
				y: point.y - lastPointerRef.current.y,
			};
			cameraRef.current = panNeuralCamera(cameraRef.current, delta);
			updateInteractionTarget({ point, velocity });
			requestRenderRef.current();
		} else {
			updateHover(point, { velocity });
		}
		lastPointerRef.current = point;
	}, [getPointerActivity, updateHover, updateInteractionTarget]);

	const handlePointerUp = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
		const point = getPointerPoint(event);
		const velocity = getPointerActivity(point);
		const start = dragStartRef.current;
		const dragged = start ? isMeaningfulDrag(start, point) : false;
		isPanningRef.current = false;
		setIsPanning(false);
		dragStartRef.current = null;
		lastPointerRef.current = null;
		updateHover(point, { allowSound: !dragged, velocity });

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
	}, [getPointerActivity, onClearSelection, onSelectNode, params, updateHover, viewport]);

	const handleWheel = useCallback((event: WheelEvent) => {
		event.preventDefault();
		const container = containerRef.current;
		if (!container) return;
		const rect = container.getBoundingClientRect();
		const pointer: NeuralPoint = {
			x: event.clientX - rect.left,
			y: event.clientY - rect.top,
		};
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

	useEffect(() => {
		const container = containerRef.current;
		if (!container) return;
		container.addEventListener("wheel", handleWheel, { passive: false });
		return () => container.removeEventListener("wheel", handleWheel);
	}, [handleWheel]);

	const cursorClass = isPanning ? "cursor-grabbing" : hoveredNodeId ? "cursor-pointer" : "cursor-grab";
	const backgroundClass = background === "transparent" ? "bg-transparent" : "bg-surface";
	const statusTextClass = background === "transparent" ? "text-text-subtlest" : "text-text-subtle";

	return (
		<div className={cn("relative h-full min-h-0 overflow-hidden", backgroundClass)} data-neural-graph-renderer="owned-canvas">
			<div
				className={cn("relative h-full w-full touch-none", cursorClass)}
				onPointerDown={handlePointerDown}
				onPointerLeave={() => {
					if (!isPanningRef.current) {
						hoveredNodeIdRef.current = null;
						setHoveredNodeId(null);
						targetRayElasticProgressMV.set(0);
						resetInteractionTarget();
						resetRaySoundTrigger();
						resetNodeSoundTrigger();
						requestRenderRef.current();
					}
				}}
				onPointerMove={handlePointerMove}
				onPointerUp={handlePointerUp}
				ref={containerRef}
			>
				<canvas aria-hidden="true" className="block h-full w-full" ref={canvasRef} />
			</div>
			{params.showRays && params.showOriginMarker ? (
				<div
					aria-hidden="true"
					className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-1/2 shadow-lg"
					data-neural-graph-origin-node="true"
					style={getOriginMarkerStyleForViewport(params, viewport, rayOriginBottomOffset)}
				/>
			) : null}
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
