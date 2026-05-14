"use client";

import { useCallback, useMemo } from "react";
import { RovoChatProvider } from "@/app/contexts";
import type { SendPromptOptions } from "@/app/contexts";
import { SidebarProvider } from "@/app/contexts/context-sidebar";
import AppLayout from "@/components/projects/page";
import AgentsView from "@/components/projects/agents/page";
import { resolveAgentsChatScreenContext } from "@/components/projects/agents/data/rfp-work-items";
import { mergeRovoContextDescriptions } from "@/lib/rovo-context";
import type { ChatSurfaceSwitchHandler } from "@/components/projects/shared/components/chat-surface-switcher";
import { useAgentsWorkItemPresentation } from "@/components/projects/agents/hooks/use-agents-work-item-presentation";
import { useProjectDemoEmbedded } from "./use-project-demo-embedded";

const AGENTS_CHAT_PROMPT_OPTIONS: SendPromptOptions = {
	backendPreference: "ai-gateway",
};

export default function AgentsDemo() {
	const embedded = useProjectDemoEmbedded();
	const workItemPresentation = useAgentsWorkItemPresentation();
	const { closeModal, promoteModalToInline } = workItemPresentation;
	const isWorkItemModalOpen = workItemPresentation.state.mode === "modal";
	const handleChatSurfaceSwitch = useCallback<ChatSurfaceSwitchHandler>(
		(surface) => {
			if (surface !== "sidebar") return;
			promoteModalToInline();
		},
		[promoteModalToInline],
	);
	const handleArtifactDialogOpen = useCallback(() => {
		if (!isWorkItemModalOpen) return;
		closeModal();
	}, [closeModal, isWorkItemModalOpen]);
	const agentsChatScreenContext = useMemo(
		() => resolveAgentsChatScreenContext(workItemPresentation.state.workItem),
		[workItemPresentation.state.workItem],
	);
	const chatPromptOptions = useMemo(
		() => ({
			...AGENTS_CHAT_PROMPT_OPTIONS,
			contextDescription: mergeRovoContextDescriptions(
				AGENTS_CHAT_PROMPT_OPTIONS.contextDescription,
				agentsChatScreenContext.contextDescription,
			),
		}) satisfies SendPromptOptions,
		[agentsChatScreenContext.contextDescription],
	);

	return (
		<SidebarProvider>
			<RovoChatProvider defaultPromptOptions={chatPromptOptions}>
				<AppLayout
					product="jira"
					embedded={embedded}
					chatPanelFlush
					onChatSurfaceSwitch={handleChatSurfaceSwitch}
					chatContextBar={agentsChatScreenContext.chatContextBar}
					onArtifactDialogOpen={handleArtifactDialogOpen}
					preserveFloatingSurfaceOnArtifactDialogOpen={isWorkItemModalOpen}
				>
					<AgentsView workItemPresentation={workItemPresentation} />
				</AppLayout>
			</RovoChatProvider>
		</SidebarProvider>
	);
}
