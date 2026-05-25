"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { AgentBrowserDialog } from "./components/agent-browser";
import {
	DEMO_AGENT_BROWSER_AGENTS,
	DEMO_AGENT_BROWSER_SIDEBAR_GROUPS,
} from "./data/demo-agents";

export default function Page() {
	const [open, setOpen] = useState(false);

	return (
		<div className="flex min-h-screen items-center justify-center p-4">
			<Button onClick={() => setOpen(true)}>Browse agents</Button>
			<AgentBrowserDialog
				open={open}
				onOpenChange={setOpen}
				agents={DEMO_AGENT_BROWSER_AGENTS}
				sidebarGroups={DEMO_AGENT_BROWSER_SIDEBAR_GROUPS}
			/>
		</div>
	);
}
