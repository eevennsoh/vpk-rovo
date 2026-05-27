"use client";

import { AgentCard } from "@/components/blocks/agent-card/components/agent-card";

export default function AgentCardPage(): React.ReactElement {
	return (
		<div className="flex h-full min-h-[400px] w-full items-center justify-center p-6">
			<AgentCard className="self-center" />
		</div>
	);
}

export { AgentCard } from "@/components/blocks/agent-card/components/agent-card";
export type { AgentCardProps } from "@/components/blocks/agent-card/components/agent-card";
