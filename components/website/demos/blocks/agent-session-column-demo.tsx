"use client";

import { useState } from "react";

import Page, {
	AgentSessionColumnHeaderActionToggles,
} from "@/components/blocks/agent-session-column/page";
import { AgentSessionColumnPanelDemo } from "@/components/blocks/agent-session-column/agent-session-column-panel-demo";

export default function AgentSessionColumnDemo() {
	return <Page />;
}

export function AgentSessionColumnDemoSimple() {
	return <Page columnChrome="simple" />;
}

export function AgentSessionColumnDemoPanel() {
	const [showFilter, setShowFilter] = useState(true);
	const [showOverflow, setShowOverflow] = useState(true);

	return (
		<div className="flex h-full w-full flex-col gap-4 bg-surface p-6">
			<div className="flex min-w-0 items-center justify-end">
				<AgentSessionColumnHeaderActionToggles
					onShowFilterChange={setShowFilter}
					onShowOverflowChange={setShowOverflow}
					showFilter={showFilter}
					showOverflow={showOverflow}
				/>
			</div>
			<AgentSessionColumnPanelDemo
				showFilter={showFilter}
				showOverflow={showOverflow}
			/>
		</div>
	);
}
