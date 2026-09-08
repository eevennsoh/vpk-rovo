"use client";

import Page from "@/components/blocks/agent-session-column/page";
import { AgentSessionColumnPanelDemo } from "@/components/blocks/agent-session-column/agent-session-column-panel-demo";

export default function AgentSessionColumnDemo() {
	return <Page />;
}

export function AgentSessionColumnDemoSimple() {
	return <Page columnChrome="simple" />;
}

export function AgentSessionColumnDemoPanel() {
	return (
		<div className="flex h-full w-full flex-col bg-surface p-6">
			<AgentSessionColumnPanelDemo />
		</div>
	);
}
