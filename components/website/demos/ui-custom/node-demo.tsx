"use client";

import { type ReactNode } from "react";
import {
	Node,
	NodeAction,
	NodeContent,
	NodeDescription,
	NodeFooter,
	NodeHeader,
	NodeTitle,
} from "@/components/ui-custom/node";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import CopyIcon from "@atlaskit/icon/core/copy";
import { ReactFlowProvider } from "@xyflow/react";

function FlowWrapper({ children }: { children: ReactNode }) {
	return <ReactFlowProvider>{children}</ReactFlowProvider>;
}

// ============================================================
// Demo: Full (header, content, footer, both handles)
// ============================================================

export function NodeDemoFull() {
	return (
		<FlowWrapper>
			<div className="flex items-center justify-center p-8">
				<Node handles={{ target: true, source: true }}>
					<NodeHeader>
						<NodeTitle>Process Data</NodeTitle>
						<NodeDescription>Transform and validate input</NodeDescription>
					</NodeHeader>
					<NodeContent>
						<p className="text-sm">
							Validating 1,234 records against business rules
						</p>
					</NodeContent>
					<NodeFooter>
						<p className="text-xs text-muted-foreground">Duration: ~2.5s</p>
					</NodeFooter>
				</Node>
			</div>
		</FlowWrapper>
	);
}

// ============================================================
// Demo: Header only (minimal node with title and description)
// ============================================================

export function NodeDemoHeaderOnly() {
	return (
		<FlowWrapper>
			<div className="flex items-center justify-center p-8">
				<Node handles={{ target: false, source: true }}>
					<NodeHeader>
						<NodeTitle>Start</NodeTitle>
						<NodeDescription>Initialize workflow</NodeDescription>
					</NodeHeader>
				</Node>
			</div>
		</FlowWrapper>
	);
}

// ============================================================
// Demo: With action (header action button)
// ============================================================

export function NodeDemoWithAction() {
	return (
		<FlowWrapper>
			<div className="flex items-center justify-center p-8">
				<Node handles={{ target: true, source: true }}>
					<NodeHeader>
						<NodeTitle>API Call</NodeTitle>
						<NodeDescription>Fetch external data</NodeDescription>
						<NodeAction>
							<Button variant="ghost" size="icon-sm" aria-label="Copy">
								<CopyIcon label="" />
							</Button>
						</NodeAction>
					</NodeHeader>
					<NodeContent>
						<p className="text-sm">GET /api/users — 200 OK</p>
					</NodeContent>
				</Node>
			</div>
		</FlowWrapper>
	);
}

// ============================================================
// Demo: With badge (content slot with rich content)
// ============================================================

export function NodeDemoWithBadge() {
	return (
		<FlowWrapper>
			<div className="flex items-center justify-center p-8">
				<Node handles={{ target: true, source: false }}>
					<NodeHeader>
						<NodeTitle>Complete</NodeTitle>
						<NodeDescription>Finalize workflow</NodeDescription>
					</NodeHeader>
					<NodeContent>
						<div className="flex items-center gap-2">
							<Badge variant="success">Passed</Badge>
							<span className="text-sm">All records processed</span>
						</div>
					</NodeContent>
					<NodeFooter>
						<p className="text-xs text-muted-foreground">Total time: 4.2s</p>
					</NodeFooter>
				</Node>
			</div>
		</FlowWrapper>
	);
}

// ============================================================
// Default export (shown as page preview)
// ============================================================

export default function NodeDemo() {
	return <NodeDemoFull />;
}
