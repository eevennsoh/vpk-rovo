"use client";

import { RovoChatProvider } from "@/app/contexts";
import { SidebarProvider } from "@/app/contexts/context-sidebar";
import AppLayout from "@/components/projects/page";
import AgentsView from "@/components/projects/agents/page";
import { useProjectDemoEmbedded } from "./use-project-demo-embedded";

export default function AgentsDemo() {
	const embedded = useProjectDemoEmbedded();

	return (
		<SidebarProvider>
			<RovoChatProvider>
				<AppLayout product="jira" embedded={embedded}>
					<AgentsView />
				</AppLayout>
			</RovoChatProvider>
		</SidebarProvider>
	);
}
