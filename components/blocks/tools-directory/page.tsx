"use client";

import { useState } from "react";

import { ToolsDirectoryDialog, type ToolsDirectoryTool } from "@/components/blocks/tools-directory";
import { DEMO_AGENT_BROWSER_AGENTS } from "@/components/blocks/agent-browser/data/demo-agents";
import { Button } from "@/components/ui/button";

const DEMO_SESSION_TOOLS: readonly ToolsDirectoryTool[] = [
	{
		id: "workflow-synthesizer",
		name: "Workflow Synthesizer",
		byline: "Workflow design by Revenue Operations",
		attributionKind: "team",
		avatarSrc: "/avatar-agent/teamwork-agents/progress-tracker.svg",
		description: "Turns scattered requests into durable operating workflows.",
	},
	{
		id: "research-brief-writer",
		name: "Research Brief Writer",
		byline: "Research synthesis by Alex Kim",
		attributionKind: "person",
		avatarSrc: "/avatar-agent/teamwork-agents/wildcard-3.svg",
		description: "Condenses long research inputs into crisp team-ready briefs.",
	},
];

export default function ToolsDirectoryPage() {
	const [open, setOpen] = useState(false);

	return (
		<div className="flex min-h-screen items-center justify-center p-4">
			<Button onClick={() => setOpen(true)}>Open tools directory</Button>
			<ToolsDirectoryDialog
				open={open}
				onOpenChange={setOpen}
				tools={DEMO_AGENT_BROWSER_AGENTS}
				sessionTools={DEMO_SESSION_TOOLS}
			/>
		</div>
	);
}
