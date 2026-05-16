"use client";

import { AnimatePresence, motion } from "motion/react";
import type { ReactNode } from "react";
import {
	ResizableHandle,
	ResizablePanel,
	ResizablePanelGroup,
} from "@/components/ui/resizable";

interface RovoAppShellPaneLayoutProps {
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
	shouldSplitArtifactPane: boolean;
	shellSize: {
		height: number;
		width: number;
	};
	splitArtifactPaneDefaultSize: number;
	splitChatPaneDefaultSize: number;
	splitChatPaneMaxSize: number;
}

export function RovoAppShellPaneLayout({
	artifactOrigin,
	artifactPane,
	artifactPanelId,
	chatPane,
	chatPanelId,
	minArtifactPaneWidth,
	minChatPaneWidth,
	onArtifactSplitLayoutChanged,
	shouldSplitArtifactPane,
	shellSize,
	splitArtifactPaneDefaultSize,
	splitChatPaneDefaultSize,
	splitChatPaneMaxSize,
}: Readonly<RovoAppShellPaneLayoutProps>) {
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
