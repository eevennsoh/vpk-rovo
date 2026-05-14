"use client";

import { useCallback } from "react";
import { RovoChatProvider } from "@/app/contexts";
import type { SendPromptOptions } from "@/app/contexts";
import { SidebarProvider } from "@/app/contexts/context-sidebar";
import AppLayout from "@/components/projects/page";
import AgentsView from "@/components/projects/agents/page";
import type { ChatSurfaceSwitchHandler } from "@/components/projects/shared/components/chat-surface-switcher";
import { useAgentsWorkItemPresentation } from "@/components/projects/agents/hooks/use-agents-work-item-presentation";
import { useProjectDemoEmbedded } from "./use-project-demo-embedded";

const AGENTS_CHAT_PROMPT_OPTIONS = {
	backendPreference: "ai-gateway",
} satisfies SendPromptOptions;

export default function AgentsDemo() {
	const embedded = useProjectDemoEmbedded();
	const workItemPresentation = useAgentsWorkItemPresentation();
	const { promoteModalToInline } = workItemPresentation;
	const handleChatSurfaceSwitch = useCallback<ChatSurfaceSwitchHandler>(
		(surface) => {
			if (surface !== "sidebar") return;
			promoteModalToInline();
		},
		[promoteModalToInline],
	);

	return (
		<SidebarProvider>
			<RovoChatProvider defaultPromptOptions={AGENTS_CHAT_PROMPT_OPTIONS}>
				<AppLayout
					product="jira"
					embedded={embedded}
					chatPanelFlush
					onChatSurfaceSwitch={handleChatSurfaceSwitch}
				>
					<AgentsView workItemPresentation={workItemPresentation} />
				</AppLayout>
			</RovoChatProvider>
		</SidebarProvider>
	);
}
