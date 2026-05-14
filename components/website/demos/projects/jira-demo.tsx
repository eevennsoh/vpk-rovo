"use client";

import { useCallback } from "react";
import { RovoChatProvider } from "@/app/contexts";
import { SidebarProvider } from "@/app/contexts/context-sidebar";
import AppLayout from "@/components/projects/page";
import JiraView from "@/components/projects/jira/page";
import { useJiraWorkItemPresentation } from "@/components/projects/jira/hooks/use-jira-work-item-presentation";
import { useProjectDemoEmbedded } from "./use-project-demo-embedded";

export default function JiraDemo() {
	const embedded = useProjectDemoEmbedded();
	const workItemPresentation = useJiraWorkItemPresentation();
	const { closeModal } = workItemPresentation;
	const isWorkItemModalOpen = workItemPresentation.state.mode === "modal";
	const handleArtifactDialogOpen = useCallback(() => {
		if (!isWorkItemModalOpen) return;
		closeModal();
	}, [closeModal, isWorkItemModalOpen]);

	return (
		<SidebarProvider>
			<RovoChatProvider>
				<AppLayout
					product="jira"
					embedded={embedded}
					chatPanelFlush
					onArtifactDialogOpen={handleArtifactDialogOpen}
					preserveFloatingSurfaceOnArtifactDialogOpen={isWorkItemModalOpen}
				>
					<JiraView workItemPresentation={workItemPresentation} />
				</AppLayout>
			</RovoChatProvider>
		</SidebarProvider>
	);
}
