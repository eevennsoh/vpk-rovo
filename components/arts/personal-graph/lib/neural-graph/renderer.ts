import { getNeuralOrigin, worldToViewport, type NeuralCamera, type NeuralPoint, type NeuralViewport } from "./camera";
import type { NeuralGraphLayout, NeuralLayoutEdge, NeuralLayoutNode } from "./layout";
import type { NeuralGraphParams } from "./params";

export type NeuralGraphThemeMode = "light" | "dark";
export type NeuralGraphBackgroundMode = "default" | "transparent";

export interface NeuralGraphRenderOptions {
	background?: NeuralGraphBackgroundMode;
	camera: NeuralCamera;
	focusProgress: number;
	hoveredNodeId: string | null;
	params: NeuralGraphParams;
	selectedNodeId: string | null;
	theme: NeuralGraphThemeMode;
	viewport: NeuralViewport;
}

const PALETTES = {
	light: {
		backgroundBottom: "#DDF3FF",
		backgroundMid: "#F5F6F2",
		backgroundTop: "#FFD08A",
		edge: "rgba(107, 92, 231, 0.18)",
		edgeActive: "rgba(107, 92, 231, 0.54)",
		label: "rgba(23, 43, 77, 0.9)",
		labelSubtle: "rgba(68, 84, 111, 0.74)",
		ray: "rgba(107, 92, 231, 0.09)",
	},
	dark: {
		backgroundBottom: "#051B2C",
		backgroundMid: "#111722",
		backgroundTop: "#291D33",
		edge: "rgba(153, 141, 255, 0.16)",
		edgeActive: "rgba(153, 141, 255, 0.62)",
		label: "rgba(244, 246, 248, 0.92)",
		labelSubtle: "rgba(182, 194, 207, 0.72)",
		ray: "rgba(153, 141, 255, 0.1)",
	},
} as const;

function getEdgeLineWidth(params: NeuralGraphParams) {
	return {
		active: params.edgeWidth,
		focused: params.edgeWidth,
		idle: params.edgeWidth,
	};
}

function hexToRgb(hex: string) {
	const normalized = hex.replace("#", "");
	const value = Number.parseInt(normalized, 16);
	return {
		b: value & 255,
		g: (value >> 8) & 255,
		r: (value >> 16) & 255,
	};
}

function colorWithAlpha(hex: string, alpha: number) {
	const rgb = hexToRgb(hex);
	return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}

function isHexColor(value: unknown): value is string {
	return typeof value === "string" && /^#[0-9a-fA-F]{6}$/.test(value);
}

function getNodeGraphColor(node: NeuralLayoutNode) {
	const graphColor = node.node.original.frontmatter.graphColor;
	return isHexColor(graphColor) ? graphColor : null;
}

function getNodeColor(node: NeuralLayoutNode, options: NeuralGraphRenderOptions) {
	return getNodeGraphColor(node) ?? options.params.nodeColor;
}

function getEdgeColor(edge: NeuralLayoutEdge, options: NeuralGraphRenderOptions) {
	const activeNodeId = options.selectedNodeId ?? options.hoveredNodeId;
	const activeNode =
		activeNodeId === edge.source.id
			? edge.source
			: activeNodeId === edge.target.id
				? edge.target
				: edge.source;
	return getNodeColor(activeNode, options);
}

function getIdleEdgeColor(edge: NeuralLayoutEdge, palette: (typeof PALETTES)[NeuralGraphThemeMode]) {
	const graphColor = getNodeGraphColor(edge.source) ?? getNodeGraphColor(edge.target);
	return graphColor ? colorWithAlpha(graphColor, 0.34) : palette.edge;
}

function lerp(start: number, end: number, progress: number) {
	return start + (end - start) * progress;
}

function clampAlpha(value: number) {
	if (!Number.isFinite(value)) return 0;
	return Math.min(1, Math.max(0, value));
}

function getFocusProgress(options: NeuralGraphRenderOptions) {
	if (!options.selectedNodeId || !Number.isFinite(options.focusProgress)) return 0;
	return Math.min(1, Math.max(0, options.focusProgress));
}

function getSelectedRelationshipIds(layout: NeuralGraphLayout, selectedNodeId: string | null) {
	const edgeIds = new Set<string>();
	const nodeIds = new Set<string>();
	if (!selectedNodeId) {
		return { edgeIds, nodeIds };
	}

	nodeIds.add(selectedNodeId);
	for (const edge of layout.edges) {
		if (edge.source.id !== selectedNodeId && edge.target.id !== selectedNodeId) {
			continue;
		}
		edgeIds.add(edge.id);
		nodeIds.add(edge.source.id);
		nodeIds.add(edge.target.id);
	}

	return { edgeIds, nodeIds };
}

function getEdgeTerminalDirection(
	source: NeuralPoint,
	target: NeuralPoint,
) {
	const dx = target.x - source.x;
	const dy = target.y - source.y;
	if (Math.abs(dy) >= Math.abs(dx)) {
		return { x: 0, y: dy >= 0 ? 1 : -1 };
	}
	return { x: dx >= 0 ? 1 : -1, y: 0 };
}

function drawOrganicRayPath(
	ctx: CanvasRenderingContext2D,
	origin: NeuralPoint,
	target: NeuralPoint,
) {
	const dx = target.x - origin.x;
	const dy = target.y - origin.y;
	const distance = Math.max(1, Math.hypot(dx, dy));
	const sourceDirection = { x: 0, y: dy >= 0 ? 1 : -1 };
	const targetDirection = getEdgeTerminalDirection(origin, target);
	const sourceHandleDistance = Math.min(220, Math.max(58, distance * 0.38));
	const targetHandleDistance = Math.min(180, Math.max(42, distance * 0.28));

	ctx.beginPath();
	ctx.moveTo(origin.x, origin.y);
	ctx.bezierCurveTo(
		origin.x + sourceDirection.x * sourceHandleDistance,
		origin.y + sourceDirection.y * sourceHandleDistance,
		target.x - targetDirection.x * targetHandleDistance,
		target.y - targetDirection.y * targetHandleDistance,
		target.x,
		target.y,
	);
}

function drawStraightEdgePath(
	ctx: CanvasRenderingContext2D,
	source: NeuralPoint,
	target: NeuralPoint,
) {
	ctx.beginPath();
	ctx.moveTo(source.x, source.y);
	ctx.lineTo(target.x, target.y);
}

function drawBackground(
	ctx: CanvasRenderingContext2D,
	viewport: NeuralViewport,
	params: NeuralGraphParams,
	theme: NeuralGraphThemeMode,
) {
	const palette = PALETTES[theme];
	const background = ctx.createLinearGradient(0, 0, 0, viewport.height);
	background.addColorStop(0, palette.backgroundTop);
	background.addColorStop(0.58, palette.backgroundMid);
	background.addColorStop(1, palette.backgroundBottom);
	ctx.fillStyle = background;
	ctx.fillRect(0, 0, viewport.width, viewport.height);

	const origin = getNeuralOrigin(viewport, params);
	const glow = ctx.createRadialGradient(origin.x, origin.y, 0, origin.x, origin.y, Math.max(viewport.width, viewport.height));
	glow.addColorStop(0, colorWithAlpha(params.nodeColor, theme === "dark" ? 0.24 : 0.18));
	glow.addColorStop(0.36, theme === "dark" ? "rgba(80, 180, 255, 0.18)" : "rgba(128, 215, 255, 0.34)");
	glow.addColorStop(1, "rgba(0, 0, 0, 0)");
	ctx.fillStyle = glow;
	ctx.fillRect(0, 0, viewport.width, viewport.height);
}

function drawRays(
	ctx: CanvasRenderingContext2D,
	layout: NeuralGraphLayout,
	options: NeuralGraphRenderOptions,
) {
	if (!options.params.showRays) return;
	const origin = getNeuralOrigin(options.viewport, options.params);
	const focusProgress = getFocusProgress(options);
	const { nodeIds } = getSelectedRelationshipIds(layout, options.selectedNodeId);
	ctx.save();
	ctx.lineWidth = options.params.rayWidth;
	ctx.strokeStyle = PALETTES[options.theme].ray;
	for (const node of layout.nodes) {
		const point = worldToViewport(node, options.camera, options.viewport, options.params);
		const isRelated = nodeIds.has(node.id);
		const focusAlpha = focusProgress > 0 ? (isRelated ? lerp(1, 0.72, focusProgress) : lerp(1, 0.05, focusProgress)) : 1;
		ctx.globalAlpha = clampAlpha((options.params.rayOpacity + node.depthScale * 0.32) * focusAlpha);
		drawOrganicRayPath(ctx, origin, point);
		ctx.stroke();
	}
	ctx.restore();
}

function isActiveEdge(sourceId: string, targetId: string, selectedNodeId: string | null, hoveredNodeId: string | null) {
	const activeNodeId = selectedNodeId ?? hoveredNodeId;
	return activeNodeId === null || sourceId === activeNodeId || targetId === activeNodeId;
}

function drawEdges(
	ctx: CanvasRenderingContext2D,
	layout: NeuralGraphLayout,
	options: NeuralGraphRenderOptions,
) {
	if (!options.params.showEdges) return;
	const palette = PALETTES[options.theme];
	const edgeWidths = getEdgeLineWidth(options.params);
	const idleOpacity = options.params.edgeOpacity;
	const activeOpacity = options.params.edgeOpacityActive;
	const focusProgress = getFocusProgress(options);
	const { edgeIds } = getSelectedRelationshipIds(layout, options.selectedNodeId);
	const edges = [...layout.edges].sort((left, right) => Number(edgeIds.has(left.id)) - Number(edgeIds.has(right.id)));
	ctx.save();
	ctx.lineCap = "round";
	for (const edge of edges) {
		const source = worldToViewport(edge.source, options.camera, options.viewport, options.params);
		const target = worldToViewport(edge.target, options.camera, options.viewport, options.params);
		const hasFocus = Boolean(options.selectedNodeId ?? options.hoveredNodeId);
		const focusActive = focusProgress > 0 && edgeIds.has(edge.id);
		const active = focusProgress > 0 ? focusActive : hasFocus && isActiveEdge(edge.source.id, edge.target.id, options.selectedNodeId, options.hoveredNodeId);
		const inactiveAlpha = focusProgress > 0 ? lerp(idleOpacity, idleOpacity * 0.11, focusProgress) : idleOpacity;
		ctx.strokeStyle = active ? colorWithAlpha(getEdgeColor(edge, options), 0.56) : getIdleEdgeColor(edge, palette);
		ctx.lineWidth = active ? lerp(edgeWidths.active, edgeWidths.focused, focusProgress) : edgeWidths.idle;
		ctx.globalAlpha = active ? lerp(activeOpacity, Math.min(1, activeOpacity + 0.2), focusProgress) : inactiveAlpha;
		drawStraightEdgePath(ctx, source, target);
		ctx.stroke();
	}
	ctx.restore();
}

function drawNodeShape(
	ctx: CanvasRenderingContext2D,
	point: NeuralPoint,
	radius: number,
	shape: NeuralGraphParams["nodeShape"],
) {
	if (shape === "square") {
		ctx.fillRect(point.x - radius, point.y - radius, radius * 2, radius * 2);
		return;
	}

	ctx.beginPath();
	ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
	ctx.fill();
}

function drawNodes(
	ctx: CanvasRenderingContext2D,
	layout: NeuralGraphLayout,
	options: NeuralGraphRenderOptions,
) {
	const focusProgress = getFocusProgress(options);
	const { nodeIds } = getSelectedRelationshipIds(layout, options.selectedNodeId);
	const getDrawRank = (node: NeuralLayoutNode) => {
		if (node.id === options.selectedNodeId) return 2;
		if (nodeIds.has(node.id)) return 1;
		return 0;
	};
	const sortedNodes = [...layout.nodes].sort((left, right) => {
		const rankDelta = getDrawRank(left) - getDrawRank(right);
		if (rankDelta !== 0) return rankDelta;
		return left.z - right.z;
	});

	const hoverScale = options.params.hoverScale;
	const selectedScale = options.params.selectedScale;
	const selectedScaleMax = selectedScale + 0.5;
	const glowSize = options.params.glowSize;
	const glowIntensity = options.params.glowIntensity;
	const glowIntensityRelated = glowIntensity * 0.5;
	for (const node of sortedNodes) {
		const nodeColor = getNodeColor(node, options);
		const isSelected = node.id === options.selectedNodeId;
		const isHovered = node.id === options.hoveredNodeId;
		const isRelated = nodeIds.has(node.id);
		let focusAlpha = 1;
		if (focusProgress > 0) {
			if (isSelected) {
				focusAlpha = 1;
			} else if (isRelated) {
				focusAlpha = lerp(1, 0.9, focusProgress);
			} else {
				focusAlpha = lerp(1, 0.14, focusProgress);
			}
		}
		const relatedScale = focusProgress > 0 && isRelated ? lerp(1, 1.22, focusProgress) : 1;
		const inactiveScale = focusProgress > 0 && !isRelated ? lerp(1, 0.7, focusProgress) : 1;
		let activeScale = relatedScale * inactiveScale;
		if (isSelected) {
			activeScale = lerp(selectedScale, selectedScaleMax, focusProgress);
		} else if (isHovered) {
			activeScale = hoverScale;
		}
		const radius = Math.max(2.5, node.baseSize * node.depthScale * options.camera.zoom * activeScale);
		const alpha = Math.min(1, node.alpha * (isSelected || isHovered ? 1 : 0.82) * focusAlpha);
		const point = worldToViewport(node, options.camera, options.viewport, options.params);

		ctx.save();
		ctx.globalAlpha = alpha;
		if (isSelected || isHovered || (focusProgress > 0 && isRelated)) {
			const glow = ctx.createRadialGradient(point.x, point.y, 0, point.x, point.y, radius * glowSize);
			glow.addColorStop(0, colorWithAlpha(nodeColor, isSelected || isHovered ? glowIntensity : glowIntensityRelated));
			glow.addColorStop(1, "rgba(0, 0, 0, 0)");
			ctx.fillStyle = glow;
			ctx.beginPath();
			ctx.arc(point.x, point.y, radius * glowSize, 0, Math.PI * 2);
			ctx.fill();
		}
		ctx.fillStyle = node.node.missing || node.node.dangling ? colorWithAlpha(nodeColor, 0.5) : nodeColor;
		drawNodeShape(ctx, point, radius, options.params.nodeShape);
		ctx.lineWidth = isSelected ? lerp(1.8, 2.6, focusProgress) : isRelated ? lerp(1, 1.35, focusProgress) : 1;
		ctx.strokeStyle = isSelected ? "rgba(255, 255, 255, 0.92)" : colorWithAlpha(nodeColor, isRelated ? lerp(0.42, 0.74, focusProgress) : 0.42);
		ctx.beginPath();
		if (options.params.nodeShape === "square") {
			ctx.rect(point.x - radius, point.y - radius, radius * 2, radius * 2);
		} else {
			ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
		}
		ctx.stroke();
		ctx.restore();
	}
}

function drawLabels(
	ctx: CanvasRenderingContext2D,
	layout: NeuralGraphLayout,
	options: NeuralGraphRenderOptions,
) {
	if (!options.params.showLabels) return;
	const palette = PALETTES[options.theme];
	const activeNodeId = options.selectedNodeId ?? options.hoveredNodeId;
	if (!activeNodeId) return;

	const active = layout.nodesById.get(activeNodeId);
	if (!active) return;

	const labelSize = options.params.labelSize;
	const metaSize = options.params.labelMetaSize;
	const point = worldToViewport(active, options.camera, options.viewport, options.params);
	ctx.save();
	ctx.font = `600 ${labelSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`;
	ctx.fillStyle = palette.label;
	ctx.textBaseline = "bottom";
	ctx.fillText(active.node.title, point.x + 12, point.y - 10);
	ctx.font = `500 ${metaSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`;
	ctx.fillStyle = palette.labelSubtle;
	ctx.textBaseline = "top";
	ctx.fillText(`${active.node.kind} · ${active.node.degree} links`, point.x + 12, point.y - 8);
	ctx.restore();
}

export function drawNeuralGraph(
	ctx: CanvasRenderingContext2D,
	layout: NeuralGraphLayout,
	options: NeuralGraphRenderOptions,
) {
	if (options.background === "transparent") {
		ctx.clearRect(0, 0, options.viewport.width, options.viewport.height);
	} else {
		drawBackground(ctx, options.viewport, options.params, options.theme);
	}
	drawRays(ctx, layout, options);
	drawEdges(ctx, layout, options);
	drawNodes(ctx, layout, options);
	drawLabels(ctx, layout, options);
}
