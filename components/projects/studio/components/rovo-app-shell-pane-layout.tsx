"use client";

import { AnimatePresence, motion } from "motion/react";
import type { ReactNode } from "react";
import {
	ResizableHandle,
	ResizablePanel,
	ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type AgentConfigCompactTab = "config" | "chat";

interface AgentConfigCompactState {
	activeTab: AgentConfigCompactTab;
	onChangeTab: (tab: AgentConfigCompactTab) => void;
}

interface RovoAppShellPaneLayoutProps {
	agentConfigPane?: ReactNode;
	agentConfigPanelId?: string;
	agentConfigCompact?: AgentConfigCompactState;
	artifactOrigin: {
		height: number;
		left: number;
		top: number;
		width: number;
	};
	artifactPane: ReactNode;
	artifactPanelId: string;
	chatPane: ReactNode;
	chatPanelId: string;
	minArtifactPaneWidth: number;
	minChatPaneWidth: number;
	onArtifactSplitLayoutChanged: (layout: Record<string, number>) => void;
	shouldShowAgentConfigPane: boolean;
	shouldSplitArtifactPane: boolean;
	shellSize: {
		height: number;
		width: number;
	};
	splitArtifactPaneDefaultSize: number;
	splitChatPaneDefaultSize: number;
	splitChatPaneMaxSize: number;
}

function CompactTabSwitcher({
	state,
}: Readonly<{ state: AgentConfigCompactState }>) {
	return (
		<div className="flex items-center gap-1 rounded-md border border-border bg-surface-sunken p-0.5">
			<Button
				type="button"
				size="sm"
				variant={state.activeTab === "config" ? "default" : "ghost"}
				aria-pressed={state.activeTab === "config"}
				onClick={() => state.onChangeTab("config")}
				className="flex-1"
			>
				Config
			</Button>
			<Button
				type="button"
				size="sm"
				variant={state.activeTab === "chat" ? "default" : "ghost"}
				aria-pressed={state.activeTab === "chat"}
				onClick={() => state.onChangeTab("chat")}
				className="flex-1"
			>
				Test chat
			</Button>
		</div>
	);
}

export function RovoAppShellPaneLayout({
	agentConfigPane,
	agentConfigPanelId,
	agentConfigCompact,
	artifactOrigin,
	artifactPane,
	artifactPanelId,
	chatPane,
	chatPanelId,
	minArtifactPaneWidth,
	minChatPaneWidth,
	onArtifactSplitLayoutChanged,
	shouldShowAgentConfigPane,
	shouldSplitArtifactPane,
	shellSize,
	splitArtifactPaneDefaultSize,
	splitChatPaneDefaultSize,
	splitChatPaneMaxSize,
}: Readonly<RovoAppShellPaneLayoutProps>) {
	// Agent config pane takes priority over artifact/browser previews.
	if (shouldShowAgentConfigPane && agentConfigPane) {
		if (agentConfigCompact) {
			return (
				<div className="flex h-full min-h-0 w-full flex-col overflow-hidden bg-background">
					<div className="border-b border-border bg-surface px-3 py-2">
						<CompactTabSwitcher state={agentConfigCompact} />
					</div>
					<div className="min-h-0 flex-1 overflow-hidden">
						{agentConfigCompact.activeTab === "config" ? agentConfigPane : chatPane}
					</div>
				</div>
			);
		}

		return (
			<ResizablePanelGroup
				className="h-full min-h-0 min-w-0 w-full overflow-visible"
				orientation="horizontal"
				onLayoutChanged={onArtifactSplitLayoutChanged}
				resizeTargetMinimumSize={{ coarse: 36, fine: 16 }}
			>
				<ResizablePanel
					className="min-h-0"
					defaultSize={splitArtifactPaneDefaultSize}
					id={agentConfigPanelId ?? artifactPanelId}
					minSize={minArtifactPaneWidth}
				>
					<div className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden bg-background">
						{agentConfigPane}
					</div>
				</ResizablePanel>
				<ResizableHandle className="z-20" withHandle />
				<ResizablePanel
					className={cn("min-h-0")}
					defaultSize={splitChatPaneDefaultSize}
					groupResizeBehavior="preserve-pixel-size"
					id={chatPanelId}
					maxSize={splitChatPaneMaxSize}
					minSize={minChatPaneWidth}
					style={{ overflow: "visible" }}
				>
					{chatPane}
				</ResizablePanel>
			</ResizablePanelGroup>
		);
	}

	return (
		<>
			<ResizablePanelGroup
				className="h-full min-h-0 min-w-0 w-full overflow-visible"
				orientation="horizontal"
				onLayoutChanged={onArtifactSplitLayoutChanged}
				resizeTargetMinimumSize={{ coarse: 36, fine: 16 }}
			>
				{shouldSplitArtifactPane && artifactPane ? (
					<>
						<ResizablePanel
							className="min-h-0"
							defaultSize={splitArtifactPaneDefaultSize}
							id={artifactPanelId}
							minSize={minArtifactPaneWidth}
						>
							<div className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden bg-background">
								{artifactPane}
							</div>
						</ResizablePanel>
						<ResizableHandle className="z-20" withHandle />
					</>
				) : null}

				<ResizablePanel
					className="min-h-0"
					defaultSize={shouldSplitArtifactPane ? splitChatPaneDefaultSize : undefined}
					groupResizeBehavior={
						shouldSplitArtifactPane ? "preserve-pixel-size" : undefined
					}
					id={chatPanelId}
					maxSize={shouldSplitArtifactPane ? splitChatPaneMaxSize : undefined}
					minSize={shouldSplitArtifactPane ? minChatPaneWidth : undefined}
					style={{ overflow: "visible" }}
				>
					{chatPane}
				</ResizablePanel>
			</ResizablePanelGroup>

			<AnimatePresence>
				{!shouldSplitArtifactPane && artifactPane ? (
					<motion.div
						animate={{
							opacity: 1,
							x: 0,
							y: 0,
							width: shellSize.width || "100%",
							height: shellSize.height || "100%",
							borderRadius: 0,
							transition: {
								delay: 0,
								type: "spring",
								stiffness: 300,
								damping: 30,
							},
						}}
						className="absolute top-0 left-0 z-40 flex h-full flex-col overflow-hidden border-border bg-background md:border-l"
						exit={{
							opacity: 0,
							scale: 0.5,
							transition: {
								delay: 0.1,
								type: "spring",
								stiffness: 600,
								damping: 30,
							},
						}}
						initial={{
							opacity: 1,
							x: artifactOrigin.left,
							y: artifactOrigin.top,
							width: artifactOrigin.width,
							height: artifactOrigin.height,
							borderRadius: 32,
						}}
					>
						{artifactPane}
					</motion.div>
				) : null}
			</AnimatePresence>
		</>
	);
}
