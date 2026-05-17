"use client";

import AgentSelectorPage from "@/components/blocks/agent-selector/page";
import type { ReactElement } from "react";

export default function AgentSelectorDemo(): ReactElement {
	return (
		<div className="flex items-center justify-center p-6">
			<div className="w-full max-w-80">
				<AgentSelectorPage />
			</div>
		</div>
	);
}

export function AgentSelectorDemoSelectedAgentActions(): ReactElement {
	return (
		<div className="flex min-h-[32rem] items-start justify-center p-6 pt-8">
			<div className="w-full max-w-80">
				<AgentSelectorPage variant="selected-agent-actions" />
			</div>
		</div>
	);
}
