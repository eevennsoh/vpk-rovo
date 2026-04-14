"use client";

import { RovoChatProvider } from "@/app/contexts";
import { SidebarProvider } from "@/app/contexts/context-sidebar";
import AppLayout from "@/components/projects/page";
import JiraView from "@/components/projects/jira/page";
import { useProjectDemoEmbedded } from "./use-project-demo-embedded";

export default function JiraDemo() {
	const embedded = useProjectDemoEmbedded();

	return (
		<SidebarProvider>
			<RovoChatProvider>
				<AppLayout product="jira" embedded={embedded}>
					<JiraView />
				</AppLayout>
			</RovoChatProvider>
		</SidebarProvider>
	);
}
