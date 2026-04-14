"use client";

import { useEffect, useMemo, useRef } from "react";
import Graph from "graphology";
import forceAtlas2 from "graphology-layout-forceatlas2";
import Sigma from "sigma";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Lozenge } from "@/components/ui/lozenge";
import type { WikiMemoryExplorerResponse } from "@/lib/rovo-runtime-types";
import BranchIcon from "@atlaskit/icon/core/branch";
import RefreshIcon from "@atlaskit/icon/core/refresh";

interface MemoryExplorerSigmaGraphProps {
	explorer: WikiMemoryExplorerResponse | null;
	isLoading?: boolean;
	onSelectNode: (nodeId: string) => void;
	selectedNodeId: string | null;
}

const NODE_COLORS = {
	"canonical-memory": "#2563eb",
	"compiled-context": "#0f766e",
	"linked-knowledge": "#64748b",
	"raw-proposal": "#d97706",
} as const;

const EDGE_COLORS = {
	canonical_to_compiled: "#0f766e",
	inferred_topic: "#94a3b8",
	proposal_to_canonical: "#d97706",
	same_scope: "#94a3b8",
	same_thread: "#7c3aed",
	shared_tag: "#64748b",
	wiki_link: "#2563eb",
} as const;

function createExplorerGraph(explorer: WikiMemoryExplorerResponse) {
	const graph = new Graph();
	const groupedNodes = new Map<string, typeof explorer.nodes>();

	for (const node of explorer.nodes) {
		if (!groupedNodes.has(node.kind)) {
			groupedNodes.set(node.kind, []);
		}
		groupedNodes.get(node.kind)?.push(node);
	}

	const kindColumns = [
		{ baseX: -6, kind: "raw-proposal" },
		{ baseX: -1, kind: "canonical-memory" },
		{ baseX: 3, kind: "compiled-context" },
		{ baseX: 7, kind: "linked-knowledge" },
	] as const;

	for (const column of kindColumns) {
		const nodes = groupedNodes.get(column.kind) ?? [];
		nodes.forEach((node, index) => {
			const row = index % 6;
			const stack = Math.floor(index / 6);
			const size = Math.max(8, Math.min(24, 10 + node.connectionCount * 1.35));
			const color = NODE_COLORS[node.kind];

			graph.addNode(node.id, {
				baseColor: color,
				baseSize: size,
				color,
				kind: node.kind,
				label: node.title,
				scope: node.scope ?? "",
				size,
				x: column.baseX + stack * 1.8 + (row % 2 === 0 ? 0.18 : -0.18),
				y: row * 1.35 - 3.2,
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
			kind: edge.kind,
			size: edge.kind === "wiki_link" ? 2.4 : 1.6,
		});
	}

	if (graph.order > 1) {
		const inferredSettings = forceAtlas2.inferSettings(graph);
		forceAtlas2.assign(graph, {
			iterations: 120,
			settings: {
				...inferredSettings,
				gravity: 0.12,
				linLogMode: true,
				scalingRatio: 18,
				slowDown: 4,
				strongGravityMode: false,
			},
		});
	}

	return graph;
}

function applySelectionStyling(graph: Graph, selectedNodeId: string | null) {
	const selectedNeighbors = new Set<string>();
	if (selectedNodeId && graph.hasNode(selectedNodeId)) {
		selectedNeighbors.add(selectedNodeId);
		for (const neighbor of graph.neighbors(selectedNodeId)) {
			selectedNeighbors.add(neighbor);
		}
	}

	graph.forEachNode((nodeId, attributes) => {
		const isSelected = selectedNodeId === nodeId;
		const isNeighbor = selectedNeighbors.has(nodeId);
		const baseColor = String(attributes.baseColor ?? NODE_COLORS["linked-knowledge"]);
		const baseSize = Number(attributes.baseSize ?? 10);

		graph.mergeNodeAttributes(nodeId, {
			color:
				selectedNodeId === null
					? baseColor
					: isSelected
						? "#0f172a"
						: isNeighbor
							? baseColor
							: "#cbd5e1",
			highlighted: isSelected,
			size:
				selectedNodeId === null
					? baseSize
					: isSelected
						? baseSize * 1.35
						: isNeighbor
							? baseSize * 1.08
							: Math.max(5, baseSize * 0.72),
			zIndex: isSelected ? 2 : isNeighbor ? 1 : 0,
		});
	});

	graph.forEachEdge((edgeId, attributes, source, target) => {
		const baseColor = String(attributes.baseColor ?? EDGE_COLORS.shared_tag);
		const isConnected = selectedNodeId ? source === selectedNodeId || target === selectedNodeId : true;
		graph.mergeEdgeAttributes(edgeId, {
			color: isConnected ? baseColor : "#d8dee9",
			hidden: selectedNodeId ? !isConnected && !selectedNeighbors.has(source) && !selectedNeighbors.has(target) : false,
			zIndex: isConnected ? 1 : 0,
		});
	});
}

export function MemoryExplorerSigmaGraph({
	explorer,
	isLoading = false,
	onSelectNode,
	selectedNodeId,
}: Readonly<MemoryExplorerSigmaGraphProps>) {
	const containerRef = useRef<HTMLDivElement | null>(null);
	const sigmaRef = useRef<Sigma | null>(null);
	const graphRef = useRef<Graph | null>(null);

	const hasExplorerGraph = useMemo(
		() => Boolean(explorer && explorer.nodes.length > 0),
		[explorer],
	);

	useEffect(() => {
		if (!containerRef.current || !explorer || explorer.nodes.length === 0) {
			if (sigmaRef.current) {
				sigmaRef.current.kill();
				sigmaRef.current = null;
				graphRef.current = null;
			}
			return;
		}

		const container = containerRef.current;
		const graph = createExplorerGraph(explorer);
		graphRef.current = graph;

		const sigma = new Sigma(graph, container, {
			allowInvalidContainer: true,
			autoCenter: true,
			autoRescale: true,
			defaultEdgeColor: "#94a3b8",
			defaultNodeColor: "#64748b",
			enableEdgeEvents: false,
			hideEdgesOnMove: false,
			hideLabelsOnMove: false,
			labelDensity: 0.16,
			labelRenderedSizeThreshold: 12,
			minCameraRatio: 0.08,
			renderEdgeLabels: false,
			renderLabels: true,
			stagePadding: 32,
			zIndex: true,
		});

		sigma.on("clickNode", ({ node }) => {
			onSelectNode(node);
		});
		sigma.on("enterNode", () => {
			container.style.cursor = "pointer";
		});
		sigma.on("leaveNode", () => {
			container.style.cursor = "grab";
		});

		sigmaRef.current = sigma;
		applySelectionStyling(graph, selectedNodeId);
		sigma.refresh();
		void sigma.getCamera().animatedReset({ duration: 300 });

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

		applySelectionStyling(graphRef.current, selectedNodeId);
		sigmaRef.current.refresh();
	}, [selectedNodeId]);

	return (
		<div className="relative h-[680px] overflow-hidden rounded-3xl border border-border bg-background/80">
			<div
				ref={containerRef}
				className="h-full w-full"
				style={{
					background:
						"radial-gradient(circle at 18% 18%, rgba(59,130,246,0.12), transparent 22%), radial-gradient(circle at 82% 22%, rgba(20,184,166,0.10), transparent 20%), radial-gradient(circle at 54% 82%, rgba(217,119,6,0.10), transparent 24%), linear-gradient(180deg, rgba(255,255,255,0.88), rgba(248,250,252,0.98))",
				}}
			/>

			<div className="pointer-events-none absolute inset-x-4 top-4 flex items-start justify-between gap-3">
				<div className="pointer-events-auto rounded-2xl border border-border bg-background/94 px-3 py-3 shadow-sm backdrop-blur">
					<div className="flex items-center gap-2">
						<BranchIcon label="" />
						<div className="text-sm font-semibold">Graph view</div>
					</div>
					<div className="mt-2 space-y-1 text-xs text-text-subtle">
						<div>Built with Graphology + Sigma.</div>
						<div>ForceAtlas2 lays out the current explorer snapshot.</div>
					</div>
				</div>

				<div className="pointer-events-auto flex items-center gap-2 rounded-2xl border border-border bg-background/94 px-3 py-2 shadow-sm backdrop-blur">
					<Badge variant="neutral">{explorer?.stats.nodeCount ?? 0} nodes</Badge>
					<Badge variant="outline">{explorer?.stats.edgeCount ?? 0} edges</Badge>
					<Button
						size="sm"
						variant="outline"
						onClick={() => {
							if (sigmaRef.current) {
								void sigmaRef.current.getCamera().animatedReset({ duration: 220 });
							}
						}}
						disabled={!hasExplorerGraph || isLoading}
					>
						<RefreshIcon label="" />
						Reset view
					</Button>
				</div>
			</div>

			<div className="pointer-events-none absolute bottom-4 left-4 flex flex-wrap gap-2">
				<Lozenge variant="information">Canonical</Lozenge>
				<Lozenge variant="success">Compiled</Lozenge>
				<Lozenge variant="warning">Proposal</Lozenge>
				<Lozenge variant="neutral">Knowledge</Lozenge>
			</div>

			{isLoading ? (
				<div className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-text-subtle">
					Loading memory graph...
				</div>
			) : null}

			{!isLoading && !hasExplorerGraph ? (
				<div className="pointer-events-none absolute inset-0 flex items-center justify-center p-8 text-center text-sm text-text-subtle">
					No memory nodes match the current filters. Try re-enabling linked knowledge or clearing the thread filter.
				</div>
			) : null}
		</div>
	);
}
