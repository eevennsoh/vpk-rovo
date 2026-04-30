"use client";

import { useEffect, useRef } from "react";
import Graph from "graphology";
import forceAtlas2 from "graphology-layout-forceatlas2";
import Sigma from "sigma";
import type { VaultExplorer, VaultNodeKind } from "./lib/personal-graph-types";

interface PersonalGraphSigmaProps {
	explorer: VaultExplorer | null;
	isLoading?: boolean;
	onSelectNode: (nodeId: string) => void;
	selectedNodeId: string | null;
}

const NODE_COLORS: Record<VaultNodeKind, string> = { concept: "#2563eb", entity: "#7c3aed", raw: "#d97706", source: "#0f766e", synthesis: "#475569" };
const EDGE_COLORS = { frontmatter_source: "#d97706", wiki_link: "#2563eb" } as const;

function createGraph(explorer: VaultExplorer) {
	const graph = new Graph();
	const grouped = new Map<VaultNodeKind, typeof explorer.nodes>();
	for (const node of explorer.nodes) {
		grouped.set(node.kind, [...(grouped.get(node.kind) ?? []), node]);
	}

	const columns: Array<{ kind: VaultNodeKind; x: number }> = [
		{ kind: "raw", x: -7 },
		{ kind: "source", x: -3 },
		{ kind: "entity", x: 1 },
		{ kind: "concept", x: 5 },
		{ kind: "synthesis", x: 9 },
	];

	for (const column of columns) {
		const nodes = grouped.get(column.kind) ?? [];
		nodes.forEach((node, index) => {
			const row = index % 8;
			const stack = Math.floor(index / 8);
			const size = Math.max(7, Math.min(23, 9 + node.connectionCount * 1.3));
			graph.addNode(node.id, {
				baseColor: node.dangling ? "#94a3b8" : NODE_COLORS[node.kind],
				baseSize: size,
				color: node.dangling ? "#94a3b8" : NODE_COLORS[node.kind],
				label: node.title,
				size,
				x: column.x + stack * 1.5,
				y: row * 1.15 - 4,
			});
		});
	}

	for (const edge of explorer.edges) {
		if (!graph.hasNode(edge.source) || !graph.hasNode(edge.target) || graph.hasEdge(edge.id)) {
			continue;
		}
		graph.addEdgeWithKey(edge.id, edge.source, edge.target, {
			baseColor: EDGE_COLORS[edge.kind],
			color: EDGE_COLORS[edge.kind],
			size: edge.kind === "wiki_link" ? 2 : 1.4,
		});
	}

	if (graph.order > 1) {
		forceAtlas2.assign(graph, {
			iterations: 140,
			settings: {
				...forceAtlas2.inferSettings(graph),
				gravity: 0.18,
				linLogMode: true,
				scalingRatio: 16,
				slowDown: 5,
			},
		});
	}

	return graph;
}

function applySelection(graph: Graph, selectedNodeId: string | null) {
	const activeNodes = new Set<string>();
	if (selectedNodeId && graph.hasNode(selectedNodeId)) {
		activeNodes.add(selectedNodeId);
		for (const neighbor of graph.neighbors(selectedNodeId)) {
			activeNodes.add(neighbor);
		}
	}

	graph.forEachNode((nodeId, attributes) => {
		const baseColor = String(attributes.baseColor ?? "#64748b");
		const baseSize = Number(attributes.baseSize ?? 10);
		const isSelected = nodeId === selectedNodeId;
		const isActive = activeNodes.has(nodeId);
		graph.mergeNodeAttributes(nodeId, {
			color: selectedNodeId === null ? baseColor : isActive ? baseColor : "#cbd5e1",
			highlighted: isSelected,
			size: isSelected ? baseSize * 1.45 : isActive ? baseSize * 1.08 : baseSize,
			zIndex: isSelected ? 2 : isActive ? 1 : 0,
		});
	});

	graph.forEachEdge((edgeId, attributes, source, target) => {
		const connected = selectedNodeId === null || source === selectedNodeId || target === selectedNodeId;
		graph.mergeEdgeAttributes(edgeId, {
			color: connected ? String(attributes.baseColor ?? "#94a3b8") : "#d8dee9",
			hidden: !connected,
			zIndex: connected ? 1 : 0,
		});
	});
}

export function PersonalGraphSigma({
	explorer,
	isLoading = false,
	onSelectNode,
	selectedNodeId,
}: Readonly<PersonalGraphSigmaProps>) {
	const containerRef = useRef<HTMLDivElement | null>(null);
	const graphRef = useRef<Graph | null>(null);
	const sigmaRef = useRef<Sigma | null>(null);
	const hasGraph = Boolean(explorer && explorer.nodes.length > 0);

	useEffect(() => {
		if (!containerRef.current || !explorer || explorer.nodes.length === 0) {
			sigmaRef.current?.kill();
			sigmaRef.current = null;
			graphRef.current = null;
			return;
		}

		const graph = createGraph(explorer);
		const sigma = new Sigma(graph, containerRef.current, {
			allowInvalidContainer: true,
			autoCenter: true,
			autoRescale: true,
			hideEdgesOnMove: false,
			hideLabelsOnMove: false,
			labelDensity: 0.18,
			labelRenderedSizeThreshold: 11,
			minCameraRatio: 0.08,
			renderLabels: true,
			stagePadding: 36,
			zIndex: true,
		});
		sigma.on("clickNode", ({ node }) => onSelectNode(node));
		sigma.on("enterNode", () => {
			if (containerRef.current) containerRef.current.style.cursor = "pointer";
		});
		sigma.on("leaveNode", () => {
			if (containerRef.current) containerRef.current.style.cursor = "grab";
		});
		graphRef.current = graph; sigmaRef.current = sigma;
		applySelection(graph, selectedNodeId);
		sigma.refresh();
		void sigma.getCamera().animatedReset({ duration: 260 });

		return () => {
			sigma.kill();
			sigmaRef.current = null;
			graphRef.current = null;
		};
	}, [explorer, onSelectNode, selectedNodeId]);

	useEffect(() => {
		if (!graphRef.current || !sigmaRef.current) {
			return;
		}
		applySelection(graphRef.current, selectedNodeId);
		sigmaRef.current.refresh();
	}, [selectedNodeId]);

	return (
		<div className="relative h-full min-h-[620px] overflow-hidden bg-surface">
			<div
				aria-hidden="true"
				ref={containerRef}
				className="h-full w-full cursor-grab bg-surface"
			/>
			{isLoading ? (
				<div className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-text-subtle">
					Loading vault graph...
				</div>
			) : null}
			{!isLoading && !hasGraph ? (
				<div className="pointer-events-none absolute inset-0 flex items-center justify-center p-8 text-center text-sm text-text-subtle">
					No Personal Graph nodes are available. Choose a vault folder and refresh.
				</div>
			) : null}
		</div>
	);
}
