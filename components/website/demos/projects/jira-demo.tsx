"use client";

import { RovoChatProvider } from "@/app/contexts";
import { SidebarProvider } from "@/app/contexts/context-sidebar";
import AppLayout from "@/components/projects/page";
import JiraView from "@/components/projects/jira/page";
import { useJiraWorkItemPresentation } from "@/components/projects/jira/hooks/use-jira-work-item-presentation";
import { useProjectDemoEmbedded } from "./use-project-demo-embedded";

export default function JiraDemo() {
	const embedded = useProjectDemoEmbedded();
	const workItemPresentation = useJiraWorkItemPresentation();

	return (
		<SidebarProvider>
			<RovoChatProvider>
				<AppLayout product="jira" embedded={embedded} chatPanelFlush>
					<JiraView workItemPresentation={workItemPresentation} />
				</AppLayout>
			</RovoChatProvider>
		</SidebarProvider>
	);
}
