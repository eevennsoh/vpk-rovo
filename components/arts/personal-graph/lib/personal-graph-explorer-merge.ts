import type { VaultEdge, VaultExplorer, VaultNode } from "./personal-graph-types";

function buildExplorer(nodes: VaultNode[], edges: VaultEdge[], generatedAt: string): VaultExplorer {
	return {
		edges,
		generatedAt,
		nodes,
		stats: {
			danglingCount: nodes.filter((node) => node.dangling).length,
			edgeCount: edges.length,
			nodeCount: nodes.length,
			rawCount: nodes.filter((node) => node.kind === "raw").length,
			wikiCount: nodes.filter((node) => node.kind !== "raw").length,
		},
	};
}

export function mergeVaultExplorers(base: VaultExplorer, incoming: VaultExplorer): VaultExplorer {
	const nodesById = new Map<string, VaultNode>();
	for (const node of base.nodes) {
		nodesById.set(node.id, node);
	}
	for (const node of incoming.nodes) {
		const existingNode = nodesById.get(node.id);
		nodesById.set(node.id, existingNode ? { ...existingNode, ...node } : node);
	}

	const edgesById = new Map<string, VaultEdge>();
	for (const edge of base.edges) {
		edgesById.set(edge.id, edge);
	}
	for (const edge of incoming.edges) {
		const existingEdge = edgesById.get(edge.id);
		edgesById.set(edge.id, existingEdge ? { ...existingEdge, ...edge } : edge);
	}

	return buildExplorer([...nodesById.values()], [...edgesById.values()], incoming.generatedAt || base.generatedAt);
}

export function mergeSelectedNodeExpansion(
	displayedExplorer: VaultExplorer,
	expandedExplorer: VaultExplorer,
	selectedNodeId: string,
): VaultExplorer {
	const displayedHasSelectedNode = displayedExplorer.nodes.some((node) => node.id === selectedNodeId);
	if (!displayedHasSelectedNode) {
		return expandedExplorer;
	}

	const expandedNodeIds = new Set<string>([selectedNodeId]);
	for (const edge of expandedExplorer.edges) {
		if (edge.source === selectedNodeId) {
			expandedNodeIds.add(edge.target);
		}
		if (edge.target === selectedNodeId) {
			expandedNodeIds.add(edge.source);
		}
	}

	const scopedExpansion = buildExplorer(
		expandedExplorer.nodes.filter((node) => expandedNodeIds.has(node.id)),
		expandedExplorer.edges.filter((edge) => expandedNodeIds.has(edge.source) && expandedNodeIds.has(edge.target)),
		expandedExplorer.generatedAt,
	);

	return mergeVaultExplorers(displayedExplorer, scopedExpansion);
}
