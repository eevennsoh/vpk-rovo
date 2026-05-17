"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { RovoChatProvider, useRovoChat } from "@/app/contexts";
import type { SendPromptOptions } from "@/app/contexts";
import { SidebarProvider } from "@/app/contexts/context-sidebar";
import AppLayout from "@/components/projects/page";
import AgentsView from "@/components/projects/agents/page";
import { RFP_101_WORK_ITEM, resolveAgentsChatScreenContext } from "@/components/projects/agents/data/rfp-work-items";
import { useAgentsRfpDemoState, type AgentsRfpDemoController } from "@/components/projects/agents/hooks/use-agents-rfp-demo-state";
import {
	formatRfpDemoContext,
	RFP_DRAFTING_AGENT_AVATAR_SRC,
	RFP_DRAFTING_AGENT_ID,
} from "@/components/projects/agents/lib/rfp-demo-state";
import { mergeRovoContextDescriptions } from "@/lib/rovo-context";
import type { ChatSurfaceSwitchHandler } from "@/components/projects/shared/components/chat-surface-switcher";
import type { FloatingRovoButtonOnboardingConfig } from "@/components/projects/shared/components/floating-rovo-button";
import { ROVO_AGENT_RESULT_OPEN_EVENT } from "@/components/projects/sidebar-chat/components/agent-result-card";
import { useAgentsWorkItemPresentation, type AgentsWorkItemPresentationController } from "@/components/projects/agents/hooks/use-agents-work-item-presentation";
import { getMessageAgentResult } from "@/lib/rovo-ui-messages";
import { useProjectDemoEmbedded } from "./use-project-demo-embedded";

const AGENTS_CHAT_PROMPT_OPTIONS: SendPromptOptions = {
	backendPreference: "ai-gateway",
};
const ROVO_BUTTON_AGENT_ONBOARDING_ID = "agents-rfp-drafting-agent-after-report-attach";
const ROVO_BUTTON_AGENT_ONBOARDING_DELAY_MS = 900;
const RFP_DRAFTING_AGENT_ACCENT_COLOR = "#82B536";
const RFP_AGENT_CREATION_PROMPT = "Create an RFP Drafting Agent for the Drafting column on the Enterprise RFP Response board.";

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
	const [isRovoButtonOnboardingOpen, setIsRovoButtonOnboardingOpen] = useState(false);
	const [dismissedRovoButtonOnboardingId, setDismissedRovoButtonOnboardingId] = useState<string | null>(null);
	const appliedAgentResultMessageIdsRef = useRef<Set<string>>(new Set());
	const { isOpen: isChatOpen, openChat, sendPrompt, uiMessages } = useRovoChat();
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
		setDismissedRovoButtonOnboardingId(ROVO_BUTTON_AGENT_ONBOARDING_ID);
		setIsRovoButtonOnboardingOpen(false);
		backToBoard();
		openChat("floating");
		void sendPrompt(RFP_AGENT_CREATION_PROMPT, {
			creationMode: "agent",
			contextDescription: [
				"[Agents RFP Drafting Agent Creation Request]",
				"Source: /agents RFP agent onboarding.",
				"Board: Enterprise RFP Response.",
				"Column: Drafting.",
				"Trigger: On event: ticket enters Drafting.",
				"Expected output: create the agent, add it to this Jira project, then process Drafting tickets through the backend event flow.",
				"[End Agents RFP Drafting Agent Creation Request]",
			].join("\n"),
		});
	}, [backToBoard, openChat, sendPrompt]);

	useEffect(() => {
		for (const message of uiMessages) {
			const agentResult = getMessageAgentResult(message);
			if (agentResult?.agentId !== RFP_DRAFTING_AGENT_ID) {
				continue;
			}
			if (appliedAgentResultMessageIdsRef.current.has(message.id)) {
				continue;
			}
			appliedAgentResultMessageIdsRef.current.add(message.id);
			setDismissedRovoButtonOnboardingId(ROVO_BUTTON_AGENT_ONBOARDING_ID);
			setIsRovoButtonOnboardingOpen(false);
			applyAgent();
		}
	}, [applyAgent, uiMessages]);

	useEffect(() => {
		const handleOpenAgentResult = (event: Event) => {
			const { detail } = event as CustomEvent<{ agentId?: string }>;
			if (detail?.agentId !== RFP_DRAFTING_AGENT_ID) {
				return;
			}

			applyAgent();
			setDismissedRovoButtonOnboardingId(ROVO_BUTTON_AGENT_ONBOARDING_ID);
			setIsRovoButtonOnboardingOpen(false);
			setIsAgentDetailsOpen(true);
		};

		window.addEventListener(ROVO_AGENT_RESULT_OPEN_EVENT, handleOpenAgentResult);
		return () => window.removeEventListener(ROVO_AGENT_RESULT_OPEN_EVENT, handleOpenAgentResult);
	}, [applyAgent]);

	useEffect(() => {
		if (rfpDemo.state.report.stage !== "attached" || rfpDemo.state.agent) {
			setDismissedRovoButtonOnboardingId(null);
			setIsRovoButtonOnboardingOpen(false);
		}
	}, [rfpDemo.state.agent, rfpDemo.state.report.stage]);

	const shouldOfferRovoButtonOnboarding = (
		rfpDemo.state.report.stage === "attached" &&
		!rfpDemo.state.agent &&
		isRfp101Presented &&
		!rfpDemo.state.canvas.open &&
		!isChatOpen &&
		dismissedRovoButtonOnboardingId !== ROVO_BUTTON_AGENT_ONBOARDING_ID
	);
	const handleRovoButtonOnboardingOpenChange = useCallback((open: boolean) => {
		setIsRovoButtonOnboardingOpen(open);
		if (!open) {
			setDismissedRovoButtonOnboardingId(ROVO_BUTTON_AGENT_ONBOARDING_ID);
		}
	}, []);
	const handleDismissRovoButtonOnboarding = useCallback(() => {
		setDismissedRovoButtonOnboardingId(ROVO_BUTTON_AGENT_ONBOARDING_ID);
		setIsRovoButtonOnboardingOpen(false);
	}, []);

	useEffect(() => {
		if (!shouldOfferRovoButtonOnboarding) {
			setIsRovoButtonOnboardingOpen(false);
			return;
		}

		const onboardingTimer = window.setTimeout(() => {
			setIsRovoButtonOnboardingOpen(true);
		}, ROVO_BUTTON_AGENT_ONBOARDING_DELAY_MS);

		return () => window.clearTimeout(onboardingTimer);
	}, [shouldOfferRovoButtonOnboarding]);

	const rovoButtonOnboarding = useMemo<FloatingRovoButtonOnboardingConfig | null>(
		() => shouldOfferRovoButtonOnboarding
			? {
					id: ROVO_BUTTON_AGENT_ONBOARDING_ID,
					title: "Create a new agent",
					agentName: "RFP Drafting Agent",
					byline: "By you",
					description: "Handles similar RFP work items by reading attachments, drafting response packages, adding comments, and moving tickets to Review.",
					prompt: "Create an RFP agent to handle similar work items from this drafting flow.",
					primaryActionLabel: "Create",
					secondaryActionLabel: "Not now",
					avatarSrc: RFP_DRAFTING_AGENT_AVATAR_SRC,
					coverSrc: RFP_DRAFTING_AGENT_AVATAR_SRC,
					coverBackgroundColor: RFP_DRAFTING_AGENT_ACCENT_COLOR,
					avatarAlt: "",
					closeLabel: "Dismiss RFP agent onboarding",
					open: isRovoButtonOnboardingOpen,
					openOnButtonClick: true,
					onOpenChange: handleRovoButtonOnboardingOpenChange,
					onPrimaryAction: handleCreateRfpDraftingAgent,
					onSecondaryAction: handleDismissRovoButtonOnboarding,
				}
			: null,
		[
			handleCreateRfpDraftingAgent,
			handleDismissRovoButtonOnboarding,
			handleRovoButtonOnboardingOpenChange,
			isRovoButtonOnboardingOpen,
			shouldOfferRovoButtonOnboarding,
		],
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
			rovoButtonOnboarding={rovoButtonOnboarding}
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
