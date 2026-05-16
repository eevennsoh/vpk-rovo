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
