"use client";

import { Canvas } from "@/components/ui-custom/canvas";
import { Connection } from "@/components/ui-custom/connection";
import { Controls } from "@/components/ui-custom/controls";
import { Edge } from "@/components/ui-custom/edge";
import {
	Node,
	NodeContent,
	NodeDescription,
	NodeHeader,
	NodeTitle,
} from "@/components/ui-custom/node";

// -- Shared node type renderer --

type WorkflowNodeData = {
	label: string;
	description: string;
	handles: { target: boolean; source: boolean };
	content: string;
};

function WorkflowNode({ data }: { data: WorkflowNodeData }) {
	return (
		<Node handles={data.handles}>
			<NodeHeader>
				<NodeTitle>{data.label}</NodeTitle>
				<NodeDescription>{data.description}</NodeDescription>
			</NodeHeader>
			<NodeContent>
				<p className="text-sm">{data.content}</p>
			</NodeContent>
		</Node>
	);
}

const nodeTypes = { workflow: WorkflowNode };

const edgeTypes = {
	animated: Edge.Animated,
	temporary: Edge.Temporary,
};

// -- Shared data --

const nodes = [
	{
		id: "input",
		type: "workflow",
		position: { x: 0, y: 0 },
		data: {
			label: "Input",
			description: "Data source",
			handles: { source: true, target: false },
			content: "Raw user input",
		},
	},
	{
		id: "process",
		type: "workflow",
		position: { x: 400, y: -100 },
		data: {
			label: "Process",
			description: "Transform data",
			handles: { source: true, target: true },
			content: "Validating 1,234 records",
		},
	},
	{
		id: "output",
		type: "workflow",
		position: { x: 800, y: 0 },
		data: {
			label: "Output",
			description: "Result",
			handles: { source: false, target: true },
			content: "Processed response",
		},
	},
];

const edges = [
	{ id: "e1", source: "input", target: "process", type: "animated" },
	{ id: "e2", source: "process", target: "output", type: "animated" },
];

// ============================================================
// Demo: Default (Controls in a canvas)
// ============================================================

export function ControlsDemoDefault() {
	return (
		<div className="h-[400px] w-full">
			<Canvas
				connectionLineComponent={Connection}
				edges={edges}
				edgeTypes={edgeTypes}
				nodes={nodes}
				nodeTypes={nodeTypes}
			>
				<Controls />
			</Canvas>
		</div>
	);
}

// ============================================================
// Demo: Bottom-right position
// ============================================================

export function ControlsDemoPosition() {
	return (
		<div className="h-[400px] w-full">
			<Canvas
				connectionLineComponent={Connection}
				edges={edges}
				edgeTypes={edgeTypes}
				nodes={nodes}
				nodeTypes={nodeTypes}
			>
				<Controls position="bottom-right" />
			</Canvas>
		</div>
	);
}

// ============================================================
// Demo: Zoom only (hide fit-view and interactive toggle)
// ============================================================

export function ControlsDemoZoomOnly() {
	return (
		<div className="h-[400px] w-full">
			<Canvas
				connectionLineComponent={Connection}
				edges={edges}
				edgeTypes={edgeTypes}
				nodes={nodes}
				nodeTypes={nodeTypes}
			>
				<Controls showFitView={false} showInteractive={false} />
			</Canvas>
		</div>
	);
}

// ============================================================
// Demo: Fit view only (hide zoom and interactive toggle)
// ============================================================

export function ControlsDemoFitOnly() {
	return (
		<div className="h-[400px] w-full">
			<Canvas
				connectionLineComponent={Connection}
				edges={edges}
				edgeTypes={edgeTypes}
				nodes={nodes}
				nodeTypes={nodeTypes}
			>
				<Controls showZoom={false} showInteractive={false} />
			</Canvas>
		</div>
	);
}

// ============================================================
// Default export (page preview)
// ============================================================

export default function ControlsDemo() {
	return <ControlsDemoDefault />;
}
