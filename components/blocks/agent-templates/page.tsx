"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { AgentTemplatesDialog } from "@/components/blocks/agent-templates";
import {
	DEMO_AGENT_TEMPLATES,
	DEMO_AGENT_TEMPLATES_SESSION,
} from "@/components/blocks/agent-templates/data/demo-template-agents";

export default function AgentTemplatesPage() {
	const [open, setOpen] = useState(false);

	return (
		<div className="flex min-h-screen items-center justify-center p-4">
			<Button onClick={() => setOpen(true)}>Open agent templates</Button>
			<AgentTemplatesDialog
				open={open}
				onOpenChange={setOpen}
				agents={DEMO_AGENT_TEMPLATES}
				sessionAgents={DEMO_AGENT_TEMPLATES_SESSION}
			/>
		</div>
	);
}
