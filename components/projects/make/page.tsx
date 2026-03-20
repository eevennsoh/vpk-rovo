"use client";

import { useCallback } from "react";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/utils/theme-wrapper";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import NotificationIcon from "@atlaskit/icon/core/notification";
import {
	MakeProvider,
	useMakeState,
	useMakeActions,
	useMakeMeta,
} from "@/app/contexts/context-make";
import { AppSidebar } from "./components/app-sidebar";
import { MakeFullscreenChat } from "./components/make-fullscreen-chat";
import ChatTitleRow from "./components/chat-title-row";
import { ConfigDialogs } from "./components/config-dialogs";

interface MakeViewProps {
	embedded?: boolean;
}

export default function MakeView({
	embedded = false,
}: Readonly<MakeViewProps>) {
	return (
		<MakeProvider>
			<MakeLayout embedded={embedded} />
		</MakeProvider>
	);
}

interface MakeLayoutProps {
	embedded?: boolean;
}

function MakeLayout({
	embedded = false,
}: Readonly<MakeLayoutProps>) {
	const {
		sidebarOpen,
		sidebarHovered,
		chatHistory,
		activeChatId,
		chatTabIsStreaming,
		sidebarRunHistory,
		runId,
		isGeneratingTitle,
		pendingTitleChatId,
	} = useMakeState();

	const {
		setSidebarOpen,
		handleHoverEnter,
		handleHoverLeave,
		handlePinSidebar,
		handleSelectRun,
		handleDeleteRun,
		handleRetryRunGroup,
		handleSelectChat,
		handleDeleteChat,
		handleNewChat,
		activateMakeMode,
		deactivateMakeMode,
	} = useMakeActions();

	const {
		skills,
		agents,
		skillDialogProps,
		agentDialogProps,
		sidebarConfigHandlers,
		importDialog,
		closeImportDialog,
		handleImport,
		deleteAlert,
		closeDeleteAlert,
		handleDeleteConfirm,
	} = useMakeMeta();

	const handleNewProject = useCallback(() => {
		handleNewChat();
		activateMakeMode();
	}, [handleNewChat, activateMakeMode]);

	const isSidebarCollapsedAndHovered = !sidebarOpen && sidebarHovered;
	const handleNewChatAndDeactivate = useCallback(() => {
		handleNewChat();
		deactivateMakeMode();
	}, [handleNewChat, deactivateMakeMode]);

	return (
		<SidebarProvider
			open={sidebarOpen || sidebarHovered}
			onOpenChange={setSidebarOpen}
			style={
				{
					"--sidebar-width": "320px",
				} as React.CSSProperties
			}
			className="[&_[data-slot=sidebar-gap]]:ease-[var(--ease-in-out)] [&_[data-slot=sidebar-container]]:ease-[var(--ease-in-out)]"
		>
			<AppSidebar
				isOverlay={false}
				isHoverReveal={isSidebarCollapsedAndHovered}
				onPinSidebar={handlePinSidebar}
				chatHistory={chatHistory}
				activeChatId={activeChatId}
				thinkingChatId={chatTabIsStreaming ? activeChatId : null}
				runHistory={sidebarRunHistory}
				activeRunId={runId}
				isGeneratingTitle={isGeneratingTitle}
				pendingTitleChatId={pendingTitleChatId}
				onSelectRun={handleSelectRun}
				onDeleteRun={handleDeleteRun}
				onRetryRunGroup={handleRetryRunGroup}
				onSelectChat={handleSelectChat}
				onDeleteChat={handleDeleteChat}
				onMouseEnter={handleHoverEnter}
				onMouseLeave={handleHoverLeave}
				skills={skills}
				agents={agents}
				onEditSkill={sidebarConfigHandlers.onEditSkill}
				onNewSkill={sidebarConfigHandlers.onNewSkill}
				onEditAgent={sidebarConfigHandlers.onEditAgent}
				onNewAgent={sidebarConfigHandlers.onNewAgent}
				onExportSkill={sidebarConfigHandlers.onExportSkill}
				onExportAgent={sidebarConfigHandlers.onExportAgent}
				onNewChat={handleNewChatAndDeactivate}
				onNewProject={handleNewProject}
			/>
			<SidebarInset className="h-svh overflow-hidden">
				<div className="pointer-events-none absolute top-0 right-0 z-20 flex h-14 items-center gap-0.5 pr-4 text-icon-subtle">
					<div className="pointer-events-auto">
						<ThemeToggle />
					</div>
					<Button
						aria-label="Notifications"
						size="icon"
						variant="ghost"
						className="pointer-events-auto"
					>
						<NotificationIcon label="" />
					</Button>
					<div className="pointer-events-auto flex size-8 items-center justify-center">
						<Avatar size="sm" className="cursor-pointer">
							<AvatarImage src="/avatar-human/austin-lambert.png" alt="User avatar" />
							<AvatarFallback>U</AvatarFallback>
						</Avatar>
					</div>
				</div>
				<div className="flex h-full min-h-0 flex-col gap-0">
					<ChatTitleRow
						title={null}
						isTitlePending={false}
						showDivider={false}
						sidebarOpen={sidebarOpen}
						sidebarHovered={sidebarHovered}
						onExpandSidebar={() => setSidebarOpen(true)}
						onHoverEnter={handleHoverEnter}
						onHoverLeave={handleHoverLeave}
					/>
					<div className="min-h-0 flex-1 overflow-hidden">
						<MakeFullscreenChat autoFocusComposer={!embedded} />
					</div>
				</div>
			</SidebarInset>
			<ConfigDialogs
				skillDialog={skillDialogProps}
				agentDialog={agentDialogProps}
				importDialog={importDialog}
				onImportDialogClose={closeImportDialog}
				onImport={handleImport}
				deleteAlert={deleteAlert}
				onDeleteAlertClose={closeDeleteAlert}
				onDeleteConfirm={handleDeleteConfirm}
			/>
		</SidebarProvider>
	);
}
