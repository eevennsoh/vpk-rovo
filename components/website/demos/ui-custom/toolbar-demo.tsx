"use client";

import { Canvas } from "@/components/ui-custom/canvas";
import { Edge } from "@/components/ui-custom/edge";
import {
	Node,
	NodeContent,
	NodeHeader,
	NodeTitle,
} from "@/components/ui-custom/node";
import { Toolbar } from "@/components/ui-custom/toolbar";
import { Button } from "@/components/ui/button";
import CopyIcon from "@atlaskit/icon/core/copy";
import DeleteIcon from "@atlaskit/icon/core/delete";
import EditIcon from "@atlaskit/icon/core/edit";

// -- Default preview: static visual representation of the toolbar --

export default function ToolbarDemo() {
	return (
		<div className="flex items-center gap-1 rounded-sm border bg-background p-1.5">
			<Button size="sm" variant="ghost" aria-label="Edit">
				<EditIcon label="" />
			</Button>
			<Button size="sm" variant="ghost" aria-label="Copy">
				<CopyIcon label="" />
			</Button>
			<Button size="sm" variant="ghost" aria-label="Delete">
				<DeleteIcon label="" />
			</Button>
		</div>
	);
}

// -- Example: Toolbar attached to nodes in a canvas --

type ToolbarNodeData = {
	label: string;
	content: string;
	handles: { target: boolean; source: boolean };
};

function ToolbarNode({ data }: { data: ToolbarNodeData }) {
	return (
		<Node handles={data.handles}>
			<Toolbar isVisible>
				<Button size="sm" variant="ghost" aria-label="Edit">
					<EditIcon label="" />
				</Button>
				<Button size="sm" variant="ghost" aria-label="Copy">
					<CopyIcon label="" />
				</Button>
				<Button size="sm" variant="ghost" aria-label="Delete">
					<DeleteIcon label="" />
				</Button>
			</Toolbar>
			<NodeHeader>
				<NodeTitle>{data.label}</NodeTitle>
			</NodeHeader>
			<NodeContent>
				<p className="text-sm">{data.content}</p>
			</NodeContent>
		</Node>
	);
}

const nodeTypes = { toolbar: ToolbarNode };

const edgeTypes = { animated: Edge.Animated };

const nodes = [
	{
		id: "a",
		type: "toolbar",
		position: { x: 0, y: 0 },
		data: {
			label: "Input",
			content: "Raw user input",
			handles: { source: true, target: false },
		},
	},
	{
		id: "b",
		type: "toolbar",
		position: { x: 400, y: 0 },
		data: {
			label: "Output",
			content: "Processed response",
			handles: { source: false, target: true },
		},
	},
];

const edges = [
	{ id: "e-ab", source: "a", target: "b", type: "animated" },
];

export function ToolbarDemoWithNodes() {
	return (
		<div className="h-[300px] w-full">
			<Canvas
				edges={edges}
				edgeTypes={edgeTypes}
				nodes={nodes}
				nodeTypes={nodeTypes}
			/>
		</div>
	);
}
