"use client";

import { Canvas } from "@/components/ui-custom/canvas";
import { Connection } from "@/components/ui-custom/connection";
import { Edge } from "@/components/ui-custom/edge";
import {
	Node,
	NodeContent,
	NodeHeader,
	NodeTitle,
} from "@/components/ui-custom/node";

// -- Shared node type renderer --

type SimpleNodeData = {
	label: string;
	handles: { target: boolean; source: boolean };
	content: string;
};

function SimpleNode({ data }: { data: SimpleNodeData }) {
	return (
		<Node handles={data.handles}>
			<NodeHeader>
				<NodeTitle>{data.label}</NodeTitle>
			</NodeHeader>
			<NodeContent>
				<p className="text-sm text-muted-foreground">{data.content}</p>
			</NodeContent>
		</Node>
	);
}

const nodeTypes = { simple: SimpleNode };

// ============================================================
// Demo: Animated (flowing dot along a bezier path)
// ============================================================

const animatedNodes = [
	{
		id: "source",
		type: "simple",
		position: { x: 0, y: 0 },
		data: {
			label: "Source",
			handles: { source: true, target: false },
			content: "Sends data",
		},
	},
	{
		id: "target",
		type: "simple",
		position: { x: 500, y: 0 },
		data: {
			label: "Target",
			handles: { source: false, target: true },
			content: "Receives data",
		},
	},
];

const animatedEdges = [
	{ id: "e1", source: "source", target: "target", type: "animated" },
];

const animatedEdgeTypes = { animated: Edge.Animated };

export function EdgeDemoAnimated() {
	return (
		<div className="h-[250px] w-full">
			<Canvas
				connectionLineComponent={Connection}
				edges={animatedEdges}
				edgeTypes={animatedEdgeTypes}
				nodes={animatedNodes}
				nodeTypes={nodeTypes}
			/>
		</div>
	);
}

// ============================================================
// Demo: Temporary (dashed stroke)
// ============================================================

const temporaryEdges = [
	{ id: "e1", source: "source", target: "target", type: "temporary" },
];

const temporaryEdgeTypes = { temporary: Edge.Temporary };

export function EdgeDemoTemporary() {
	return (
		<div className="h-[250px] w-full">
			<Canvas
				connectionLineComponent={Connection}
				edges={temporaryEdges}
				edgeTypes={temporaryEdgeTypes}
				nodes={animatedNodes}
				nodeTypes={nodeTypes}
			/>
		</div>
	);
}

// ============================================================
// Demo: Mixed (animated and temporary edges together)
// ============================================================

const mixedNodes = [
	{
		id: "input",
		type: "simple",
		position: { x: 0, y: 0 },
		data: {
			label: "Input",
			handles: { source: true, target: false },
			content: "User request",
		},
	},
	{
		id: "process",
		type: "simple",
		position: { x: 400, y: -100 },
		data: {
			label: "Process",
			handles: { source: true, target: true },
			content: "Primary path",
		},
	},
	{
		id: "fallback",
		type: "simple",
		position: { x: 400, y: 100 },
		data: {
			label: "Fallback",
			handles: { source: true, target: true },
			content: "Alternate path",
		},
	},
	{
		id: "output",
		type: "simple",
		position: { x: 800, y: 0 },
		data: {
			label: "Output",
			handles: { source: false, target: true },
			content: "Final result",
		},
	},
];

const mixedEdges = [
	{ id: "e1", source: "input", target: "process", type: "animated" },
	{ id: "e2", source: "input", target: "fallback", type: "temporary" },
	{ id: "e3", source: "process", target: "output", type: "animated" },
	{ id: "e4", source: "fallback", target: "output", type: "temporary" },
];

const mixedEdgeTypes = {
	animated: Edge.Animated,
	temporary: Edge.Temporary,
};

export function EdgeDemoMixed() {
	return (
		<div className="h-[350px] w-full">
			<Canvas
				connectionLineComponent={Connection}
				edges={mixedEdges}
				edgeTypes={mixedEdgeTypes}
				nodes={mixedNodes}
				nodeTypes={nodeTypes}
			/>
		</div>
	);
}

// ============================================================
// Default export (page preview — shows both types)
// ============================================================

export default function EdgeDemo() {
	return <EdgeDemoMixed />;
}
