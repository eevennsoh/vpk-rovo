import type { VaultEdge, VaultExplorer, VaultNode, VaultNodeKind } from "../personal-graph-types";

export interface NeuralGraphNode {
	bodyPreview: string;
	dangling: boolean;
	degree: number;
	id: string;
	index: number;
	kind: VaultNodeKind;
	mass: number;
	missing: boolean;
	original: VaultNode;
	relativePath: string;
	slug: string;
	title: string;
}

export interface NeuralGraphEdge {
	id: string;
	index: number;
	kind: VaultEdge["kind"];
	label: string;
	original: VaultEdge;
	source: string;
	target: string;
	weight: number;
}

export interface NeuralGraphNeighbor {
	edge: NeuralGraphEdge;
	node: NeuralGraphNode;
}

export interface NeuralGraphStore {
	adjacency: Map<string, NeuralGraphNeighbor[]>;
	edges: NeuralGraphEdge[];
	edgesById: Map<string, NeuralGraphEdge>;
	kindGroups: Map<VaultNodeKind, NeuralGraphNode[]>;
	nodes: NeuralGraphNode[];
	nodesById: Map<string, NeuralGraphNode>;
	rankedNodes: NeuralGraphNode[];
}

const KIND_ORDER: Record<VaultNodeKind, number> = {
	raw: 0,
	source: 1,
	entity: 2,
	concept: 3,
	synthesis: 4,
};

function compareNodes(left: VaultNode, right: VaultNode) {
	const kindDelta = KIND_ORDER[left.kind] - KIND_ORDER[right.kind];
	if (kindDelta !== 0) return kindDelta;
	const connectionDelta = right.connectionCount - left.connectionCount;
	if (connectionDelta !== 0) return connectionDelta;
	const titleDelta = left.title.localeCompare(right.title);
	if (titleDelta !== 0) return titleDelta;
	return left.id.localeCompare(right.id);
}

function compareNeuralNodes(left: NeuralGraphNode, right: NeuralGraphNode) {
	const degreeDelta = right.degree - left.degree;
	if (degreeDelta !== 0) return degreeDelta;
	const kindDelta = KIND_ORDER[left.kind] - KIND_ORDER[right.kind];
	if (kindDelta !== 0) return kindDelta;
	const titleDelta = left.title.localeCompare(right.title);
	if (titleDelta !== 0) return titleDelta;
	return left.id.localeCompare(right.id);
}

function compareNeighbors(left: NeuralGraphNeighbor, right: NeuralGraphNeighbor) {
	const nodeDelta = compareNeuralNodes(left.node, right.node);
	if (nodeDelta !== 0) return nodeDelta;
	return left.edge.id.localeCompare(right.edge.id);
}

function getEdgeWeight(edge: VaultEdge) {
	return edge.kind === "wiki_link" ? 1 : 0.72;
}

export function createNeuralGraphStore(explorer: VaultExplorer | null): NeuralGraphStore {
	const nodesById = new Map<string, NeuralGraphNode>();
	const edgesById = new Map<string, NeuralGraphEdge>();
	const adjacency = new Map<string, NeuralGraphNeighbor[]>();
	const kindGroups = new Map<VaultNodeKind, NeuralGraphNode[]>();

	const nodes = [...(explorer?.nodes ?? [])].sort(compareNodes).map((node, index) => {
		const graphNode: NeuralGraphNode = {
			bodyPreview: node.bodyPreview,
			dangling: node.dangling,
			degree: 0,
			id: node.id,
			index,
			kind: node.kind,
			mass: 1,
			missing: node.missing,
			original: node,
			relativePath: node.relativePath,
			slug: node.slug,
			title: node.title,
		};
		nodesById.set(node.id, graphNode);
		adjacency.set(node.id, []);
		kindGroups.set(node.kind, [...(kindGroups.get(node.kind) ?? []), graphNode]);
		return graphNode;
	});

	const edges = [...(explorer?.edges ?? [])]
		.sort((left, right) => left.id.localeCompare(right.id))
		.flatMap((edge) => {
			if (!nodesById.has(edge.source) || !nodesById.has(edge.target) || edgesById.has(edge.id)) {
				return [];
			}

			const graphEdge: NeuralGraphEdge = {
				id: edge.id,
				index: edgesById.size,
				kind: edge.kind,
				label: edge.label,
				original: edge,
				source: edge.source,
				target: edge.target,
				weight: getEdgeWeight(edge),
			};
			edgesById.set(edge.id, graphEdge);
			return [graphEdge];
		});

	for (const edge of edges) {
		const source = nodesById.get(edge.source);
		const target = nodesById.get(edge.target);
		if (!source || !target) continue;

		adjacency.get(source.id)?.push({ edge, node: target });
		adjacency.get(target.id)?.push({ edge, node: source });
	}

	for (const node of nodes) {
		const neighbors = adjacency.get(node.id) ?? [];
		neighbors.sort(compareNeighbors);
		node.degree = neighbors.length;
		node.mass = 1 + Math.sqrt(Math.max(node.degree, node.original.connectionCount));
	}

	for (const [kind, group] of kindGroups) {
		kindGroups.set(kind, [...group].sort(compareNeuralNodes));
	}

	const rankedNodes = [...nodes].sort(compareNeuralNodes);

	return {
		adjacency,
		edges,
		edgesById,
		kindGroups,
		nodes,
		nodesById,
		rankedNodes,
	};
}

export function getNodeNeighbors(store: NeuralGraphStore, nodeId: string | null): NeuralGraphNeighbor[] {
	if (!nodeId) return [];
	return store.adjacency.get(nodeId) ?? [];
}

export function getSelectedNeighborhood(
	store: NeuralGraphStore,
	selectedNodeId: string | null,
	limit = 12,
): NeuralGraphNeighbor[] {
	return getNodeNeighbors(store, selectedNodeId).slice(0, Math.max(0, limit));
}

export function getVisibleGraphNodes(
	store: NeuralGraphStore,
	selectedNodeId: string | null,
	maxVisibleNodes: number,
): NeuralGraphNode[] {
	const visibleCount = Math.max(0, Math.floor(maxVisibleNodes));
	if (visibleCount === 0) return [];
	if (store.nodes.length <= visibleCount) return store.nodes;

	const selected = selectedNodeId ? store.nodesById.get(selectedNodeId) : null;
	const required = new Map<string, NeuralGraphNode>();
	if (selected) {
		required.set(selected.id, selected);
		for (const { node } of getSelectedNeighborhood(store, selected.id, Math.max(0, visibleCount - 1))) {
			required.set(node.id, node);
		}
	}

	for (const node of store.rankedNodes) {
		if (required.size >= visibleCount) break;
		required.set(node.id, node);
	}

	return [...required.values()].sort((left, right) => left.index - right.index);
}

export function getVisibleGraphEdges(store: NeuralGraphStore, visibleNodes: NeuralGraphNode[]): NeuralGraphEdge[] {
	const visibleIds = new Set(visibleNodes.map((node) => node.id));
	return store.edges.filter((edge) => visibleIds.has(edge.source) && visibleIds.has(edge.target));
}
