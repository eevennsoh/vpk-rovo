"use client";

import { useCallback } from "react";
import { RovoChatProvider } from "@/app/contexts";
import { SidebarProvider } from "@/app/contexts/context-sidebar";
import AppLayout from "@/components/projects/page";
import JiraView from "@/components/projects/jira/page";
import type { ChatSurfaceSwitchHandler } from "@/components/projects/shared/components/chat-surface-switcher";
import { useJiraWorkItemPresentation } from "@/components/projects/jira/hooks/use-jira-work-item-presentation";
import { useProjectDemoEmbedded } from "./use-project-demo-embedded";

export default function JiraDemo() {
	const embedded = useProjectDemoEmbedded();
	const workItemPresentation = useJiraWorkItemPresentation();
	const { promoteModalToInline } = workItemPresentation;
	const handleChatSurfaceSwitch = useCallback<ChatSurfaceSwitchHandler>(
		(surface) => {
			if (surface === "sidebar") {
				promoteModalToInline();
			}
		},
		[promoteModalToInline],
	);

	return (
		<SidebarProvider>
			<RovoChatProvider>
				<AppLayout
					product="jira"
					embedded={embedded}
					chatPanelFlush
					onChatSurfaceSwitch={handleChatSurfaceSwitch}
				>
					<JiraView workItemPresentation={workItemPresentation} />
				</AppLayout>
			</RovoChatProvider>
		</SidebarProvider>
	);
}
