"use client";

import { useMemo, useState } from "react";
import { RovoChatProvider } from "@/app/contexts";
import type { SendPromptOptions } from "@/app/contexts";
import type { WorkItemData } from "@/app/contexts/context-work-item-modal";
import { SidebarProvider } from "@/app/contexts/context-sidebar";
import AppLayout from "@/components/projects/page";
import AgentsView from "@/components/projects/agents/page";
import { formatActiveJiraWorkItemContext } from "@/components/projects/agents/data/rfp-work-items";
import { mergeRovoContextDescriptions } from "@/lib/rovo-context";
import { useProjectDemoEmbedded } from "./use-project-demo-embedded";

const AGENTS_CHAT_PROMPT_OPTIONS: SendPromptOptions = {
	backendPreference: "ai-gateway",
};

export default function AgentsDemo() {
	const embedded = useProjectDemoEmbedded();
	const [activeWorkItem, setActiveWorkItem] = useState<WorkItemData | null>(null);
	const activeWorkItemContextDescription = formatActiveJiraWorkItemContext(activeWorkItem);
	const chatPromptOptions = useMemo(
		() => ({
			...AGENTS_CHAT_PROMPT_OPTIONS,
			contextDescription: mergeRovoContextDescriptions(
				AGENTS_CHAT_PROMPT_OPTIONS.contextDescription,
				activeWorkItemContextDescription,
			),
		}) satisfies SendPromptOptions,
		[activeWorkItemContextDescription],
	);

	return (
		<SidebarProvider>
			<RovoChatProvider defaultPromptOptions={chatPromptOptions}>
				<AppLayout product="jira" embedded={embedded} chatPanelFlush>
					<AgentsView onActiveWorkItemChange={setActiveWorkItem} />
				</AppLayout>
			</RovoChatProvider>
		</SidebarProvider>
	);
}
