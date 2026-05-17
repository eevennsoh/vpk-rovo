"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { RovoChatProvider, useRovoChat } from "@/app/contexts";
import type { SendPromptOptions } from "@/app/contexts";
import { SidebarProvider } from "@/app/contexts/context-sidebar";
import AppLayout from "@/components/projects/page";
import AgentsView from "@/components/projects/agents/page";
import { RFP_101_WORK_ITEM, resolveAgentsChatScreenContext } from "@/components/projects/agents/data/rfp-work-items";
import { useAgentsRfpDemoState, type AgentsRfpDemoController } from "@/components/projects/agents/hooks/use-agents-rfp-demo-state";
import { formatRfpDemoContext, RFP_DRAFTING_AGENT_ID } from "@/components/projects/agents/lib/rfp-demo-state";
import { mergeRovoContextDescriptions } from "@/lib/rovo-context";
import type { ChatSurfaceSwitchHandler } from "@/components/projects/shared/components/chat-surface-switcher";
import type { FloatingRovoButtonSuggestion } from "@/components/projects/shared/components/floating-rovo-button";
import { ROVO_AGENT_RESULT_OPEN_EVENT } from "@/components/projects/sidebar-chat/components/agent-result-card";
import { useAgentsWorkItemPresentation, type AgentsWorkItemPresentationController } from "@/components/projects/agents/hooks/use-agents-work-item-presentation";
import { useProjectDemoEmbedded } from "./use-project-demo-embedded";

const AGENTS_CHAT_PROMPT_OPTIONS: SendPromptOptions = {
	backendPreference: "ai-gateway",
};
const ROVO_BUTTON_AGENT_SUGGESTION_ID = "agents-rfp-drafting-agent-after-report-attach";

interface AgentsDemoContentProps {
	embedded: boolean;
	rfpDemo: AgentsRfpDemoController;
	workItemPresentation: AgentsWorkItemPresentationController;
	agentsChatScreenContext: ReturnType<typeof resolveAgentsChatScreenContext>;
}

function AgentsDemoContent({
	embedded,
	rfpDemo,
	workItemPresentation,
	agentsChatScreenContext,
}: Readonly<AgentsDemoContentProps>) {
	const [isAgentDetailsOpen, setIsAgentDetailsOpen] = useState(false);
	const [dismissedRovoButtonSuggestionId, setDismissedRovoButtonSuggestionId] = useState<string | null>(null);
	const { isOpen: isChatOpen } = useRovoChat();
	const { backToBoard, closeModal, promoteModalToInline } = workItemPresentation;
	const { applyAgent } = rfpDemo.actions;
	const isWorkItemModalOpen = workItemPresentation.state.mode === "modal";
	const isRfp101Presented = (
		(workItemPresentation.state.mode === "modal" || workItemPresentation.state.mode === "inline") &&
		workItemPresentation.state.workItem?.code === RFP_101_WORK_ITEM.code
	);
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
	const handleCreateRfpDraftingAgent = useCallback(() => {
		setDismissedRovoButtonSuggestionId(ROVO_BUTTON_AGENT_SUGGESTION_ID);
		backToBoard();
		applyAgent();
		setIsAgentDetailsOpen(true);
	}, [applyAgent, backToBoard]);

	useEffect(() => {
		const handleOpenAgentResult = (event: Event) => {
			const { detail } = event as CustomEvent<{ agentId?: string }>;
			if (detail?.agentId !== RFP_DRAFTING_AGENT_ID) {
				return;
			}

			applyAgent();
			setDismissedRovoButtonSuggestionId(ROVO_BUTTON_AGENT_SUGGESTION_ID);
			setIsAgentDetailsOpen(true);
		};

		window.addEventListener(ROVO_AGENT_RESULT_OPEN_EVENT, handleOpenAgentResult);
		return () => window.removeEventListener(ROVO_AGENT_RESULT_OPEN_EVENT, handleOpenAgentResult);
	}, [applyAgent]);

	useEffect(() => {
		if (rfpDemo.state.report.stage !== "attached" || rfpDemo.state.agent) {
			setDismissedRovoButtonSuggestionId(null);
		}
	}, [rfpDemo.state.agent, rfpDemo.state.report.stage]);

	const shouldShowRovoButtonSuggestion = (
		rfpDemo.state.report.stage === "attached" &&
		!rfpDemo.state.agent &&
		isRfp101Presented &&
		!rfpDemo.state.canvas.open &&
		!isChatOpen &&
		dismissedRovoButtonSuggestionId !== ROVO_BUTTON_AGENT_SUGGESTION_ID
	);
	const rovoButtonSuggestion = useMemo<FloatingRovoButtonSuggestion | null>(
		() => shouldShowRovoButtonSuggestion
			? {
					id: ROVO_BUTTON_AGENT_SUGGESTION_ID,
					label: "Create RFP agent to handle similar work items",
					ariaLabel: "Create RFP agent to handle similar work items",
					onSelect: handleCreateRfpDraftingAgent,
					onDismiss: () => setDismissedRovoButtonSuggestionId(ROVO_BUTTON_AGENT_SUGGESTION_ID),
				}
			: null,
		[handleCreateRfpDraftingAgent, shouldShowRovoButtonSuggestion],
	);

	return (
		<AppLayout
			product="jira"
			embedded={embedded}
			chatPanelFlush
			hideRovoAction={rfpDemo.state.canvas.open}
			onChatSurfaceSwitch={handleChatSurfaceSwitch}
			chatContextBar={agentsChatScreenContext.chatContextBar}
			chatGreeting={agentsChatScreenContext.greeting}
			rovoButtonSuggestion={rovoButtonSuggestion}
			onArtifactDialogOpen={handleArtifactDialogOpen}
			preserveFloatingSurfaceOnArtifactDialogOpen={isWorkItemModalOpen}
		>
			<AgentsView
				workItemPresentation={workItemPresentation}
				rfpDemo={rfpDemo}
				isAgentDetailsOpen={isAgentDetailsOpen}
				onAgentDetailsOpenChange={setIsAgentDetailsOpen}
				onCreateRfpDraftingAgent={handleCreateRfpDraftingAgent}
				chatContextBar={agentsChatScreenContext.chatContextBar}
				chatGreeting={agentsChatScreenContext.greeting}
			/>
		</AppLayout>
	);
}

export default function AgentsDemo() {
	const embedded = useProjectDemoEmbedded();
	const workItemPresentation = useAgentsWorkItemPresentation();
	const rfpDemo = useAgentsRfpDemoState();
	const agentsChatScreenContext = useMemo(
		() => resolveAgentsChatScreenContext(workItemPresentation.state.workItem),
		[workItemPresentation.state.workItem],
	);
	const rfpDemoContext = useMemo(
		() => formatRfpDemoContext(rfpDemo.state),
		[rfpDemo.state],
	);
	const chatPromptOptions = useMemo(
		() => ({
			...AGENTS_CHAT_PROMPT_OPTIONS,
			contextDescription: mergeRovoContextDescriptions(
				AGENTS_CHAT_PROMPT_OPTIONS.contextDescription,
				agentsChatScreenContext.contextDescription,
				rfpDemoContext,
			),
		}) satisfies SendPromptOptions,
		[agentsChatScreenContext.contextDescription, rfpDemoContext],
	);

	return (
		<SidebarProvider>
			<RovoChatProvider defaultPromptOptions={chatPromptOptions}>
				<AgentsDemoContent
					embedded={embedded}
					rfpDemo={rfpDemo}
					workItemPresentation={workItemPresentation}
					agentsChatScreenContext={agentsChatScreenContext}
				/>
			</RovoChatProvider>
		</SidebarProvider>
	);
}
