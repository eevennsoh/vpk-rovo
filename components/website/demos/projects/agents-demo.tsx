"use client";

import { RovoChatProvider } from "@/app/contexts";
import type { SendPromptOptions } from "@/app/contexts";
import { SidebarProvider } from "@/app/contexts/context-sidebar";
import AppLayout from "@/components/projects/page";
import AgentsView from "@/components/projects/agents/page";
import { useProjectDemoEmbedded } from "./use-project-demo-embedded";

const AGENTS_CHAT_PROMPT_OPTIONS = {
	backendPreference: "ai-gateway",
} satisfies SendPromptOptions;

export default function AgentsDemo() {
	const embedded = useProjectDemoEmbedded();

	return (
		<SidebarProvider>
			<RovoChatProvider defaultPromptOptions={AGENTS_CHAT_PROMPT_OPTIONS}>
				<AppLayout product="jira" embedded={embedded} chatPanelFlush>
					<AgentsView />
				</AppLayout>
			</RovoChatProvider>
		</SidebarProvider>
	);
}
