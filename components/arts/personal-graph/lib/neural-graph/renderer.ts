import { getNeuralOrigin, worldToViewport, type NeuralCamera, type NeuralViewport } from "./camera";
import type { NeuralGraphLayout, NeuralLayoutNode } from "./layout";
import type { NeuralGraphParams } from "./params";

export type NeuralGraphThemeMode = "light" | "dark";
export type NeuralGraphBackgroundMode = "default" | "transparent";

export interface NeuralGraphRenderOptions {
	background?: NeuralGraphBackgroundMode;
	camera: NeuralCamera;
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
	const origin = getNeuralOrigin(options.viewport, options.params);
	ctx.save();
	ctx.lineWidth = 1;
	ctx.strokeStyle = PALETTES[options.theme].ray;
	for (const node of layout.nodes) {
		const point = worldToViewport(node, options.camera, options.viewport, options.params);
		ctx.globalAlpha = 0.22 + node.depthScale * 0.32;
		ctx.beginPath();
		ctx.moveTo(origin.x, origin.y);
		ctx.lineTo(point.x, point.y);
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
	const palette = PALETTES[options.theme];
	ctx.save();
	ctx.lineCap = "round";
	for (const edge of layout.edges) {
		const source = worldToViewport(edge.source, options.camera, options.viewport, options.params);
		const target = worldToViewport(edge.target, options.camera, options.viewport, options.params);
		const active = isActiveEdge(edge.source.id, edge.target.id, options.selectedNodeId, options.hoveredNodeId);
		ctx.strokeStyle = active ? palette.edgeActive : palette.edge;
		ctx.lineWidth = active ? 1.6 : 0.8;
		ctx.globalAlpha = active ? 0.72 : 0.32;
		ctx.beginPath();
		ctx.moveTo(source.x, source.y);
		ctx.lineTo(target.x, target.y);
		ctx.stroke();
	}
	ctx.restore();
}

function drawNodeShape(
	ctx: CanvasRenderingContext2D,
	node: NeuralLayoutNode,
	radius: number,
	options: NeuralGraphRenderOptions,
) {
	const point = worldToViewport(node, options.camera, options.viewport, options.params);
	if (options.params.nodeShape === "square") {
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
	const nodeColor = options.params.nodeColor;
	const sortedNodes = [...layout.nodes].sort((left, right) => left.z - right.z);

	for (const node of sortedNodes) {
		const isSelected = node.id === options.selectedNodeId;
		const isHovered = node.id === options.hoveredNodeId;
		const activeScale = isSelected ? 1.85 : isHovered ? 1.42 : 1;
		const radius = Math.max(2.5, node.baseSize * node.depthScale * options.camera.zoom * activeScale);
		const alpha = Math.min(1, node.alpha * (isSelected || isHovered ? 1 : 0.82));

		ctx.save();
		ctx.globalAlpha = alpha;
		if (isSelected || isHovered) {
			const point = worldToViewport(node, options.camera, options.viewport, options.params);
			const glow = ctx.createRadialGradient(point.x, point.y, 0, point.x, point.y, radius * 4.2);
			glow.addColorStop(0, colorWithAlpha(nodeColor, 0.28));
			glow.addColorStop(1, "rgba(0, 0, 0, 0)");
			ctx.fillStyle = glow;
			ctx.beginPath();
			ctx.arc(point.x, point.y, radius * 4.2, 0, Math.PI * 2);
			ctx.fill();
		}
		ctx.fillStyle = node.node.missing || node.node.dangling ? colorWithAlpha(nodeColor, 0.5) : nodeColor;
		drawNodeShape(ctx, node, radius, options);
		ctx.lineWidth = isSelected ? 1.8 : 1;
		ctx.strokeStyle = isSelected ? "rgba(255, 255, 255, 0.92)" : colorWithAlpha(nodeColor, 0.42);
		const point = worldToViewport(node, options.camera, options.viewport, options.params);
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
	const palette = PALETTES[options.theme];
	const activeNodeId = options.selectedNodeId ?? options.hoveredNodeId;
	if (!activeNodeId) return;

	const active = layout.nodesById.get(activeNodeId);
	if (!active) return;

	const point = worldToViewport(active, options.camera, options.viewport, options.params);
	ctx.save();
	ctx.font = "600 13px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
	ctx.fillStyle = palette.label;
	ctx.textBaseline = "bottom";
	ctx.fillText(active.node.title, point.x + 12, point.y - 10);
	ctx.font = "500 10px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
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
