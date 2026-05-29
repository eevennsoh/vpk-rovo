"use client";

import type { ReactNode } from "react";
import { useCallback, useState } from "react";
import CustomizeMenu from "@/components/blocks/shared-ui/customize-menu";
import { DEFAULT_REASONING_OPTION_ID } from "@/components/blocks/shared-ui/data/customize-menu-data";
import {
	composerPromptInputClassName,
	composerTextareaClassName,
	composerUpwardShadow,
	floatingComposerTextareaClassName,
	textareaCSS,
} from "@/components/blocks/shared-ui/composer-styles";
import { FloatingComposer } from "@/components/projects/shared/components/floating-composer";
import {
	RovoComposerActionButton,
	RovoComposerSendControls,
} from "@/components/projects/shared/components/rovo-composer-send-controls";
import { Popover, PopoverContent, PopoverTitle, PopoverTrigger } from "@/components/ui/popover";
import {
	PromptInput,
	PromptInputActionAddAttachments,
	PromptInputActionAddScreenshot,
	PromptInputActionMenu,
	PromptInputActionMenuContent,
	PromptInputActionMenuItem,
	PromptInputActionMenuTrigger,
	PromptInputBody,
	PromptInputButton,
	PromptInputFooter,
	PromptInputPreferencesButton,
	PromptInputTextarea,
	PromptInputTools,
} from "@/components/ui-custom/prompt-input";
import { cn } from "@/lib/utils";
import AddIcon from "@atlaskit/icon/core/add";
import LinkIcon from "@atlaskit/icon/core/link";
import MentionIcon from "@atlaskit/icon/core/mention";
import PageIcon from "@atlaskit/icon/core/page";
import ScreenIcon from "@atlaskit/icon/core/screen";
import UploadIcon from "@atlaskit/icon/core/upload";
import CursorIcon from "@atlaskit/icon-lab/core/cursor";

interface DemoFrameProps {
	children: ReactNode;
	className?: string;
}

function DemoFrame({ children, className }: Readonly<DemoFrameProps>) {
	return (
		<div className={cn("mx-auto w-[680px] max-w-full", className)}>
			{children}
		</div>
	);
}

export default function PromptInputDemo() {
	return <PromptInputDemoChatComposer />;
}

export function PromptInputDemoChatComposer() {
	const [prompt, setPrompt] = useState("");
	const [selectedReasoning, setSelectedReasoning] = useState(DEFAULT_REASONING_OPTION_ID);
	const [webResultsEnabled, setWebResultsEnabled] = useState(false);
	const [companyKnowledgeEnabled, setCompanyKnowledgeEnabled] = useState(true);
	const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
	const [isCustomizeMenuOpen, setIsCustomizeMenuOpen] = useState(false);
	const [isAutoMenuOpen, setIsAutoMenuOpen] = useState(false);
	const [clickyActive, setClickyActive] = useState(false);

	const handleCustomizeMenuOpenChange = useCallback((open: boolean) => {
		setIsCustomizeMenuOpen(open);
		if (open) setIsAutoMenuOpen(false);
	}, []);

	const handleAutoMenuOpenChange = useCallback((open: boolean) => {
		setIsAutoMenuOpen(open);
		if (open) setIsCustomizeMenuOpen(false);
	}, []);

	const handleStop = useCallback(async () => {}, []);
	const handleToggleRealtimeVoice = useCallback(() => {}, []);

	const canSubmit = prompt.trim().length > 0;

	return (
		<DemoFrame>
			<div className="px-1">
				<div
					className="relative z-10 rounded-xl border border-border bg-surface px-4 pb-3 pt-3"
					style={{ boxShadow: composerUpwardShadow }}
				>
					<PromptInput
						allowOverflow
						onSubmit={() => setPrompt("")}
						className={cn(composerPromptInputClassName, "relative z-10")}
					>
						<PromptInputBody>
							<PromptInputTextarea
								value={prompt}
								onChange={(event) => setPrompt(event.currentTarget.value)}
								placeholder="Ask, @mention, or / for skills"
								aria-label="Chat message input"
								rows={1}
								className={composerTextareaClassName}
							/>
						</PromptInputBody>

						<PromptInputFooter className="mt-3 justify-between px-0 pb-0">
							<PromptInputTools>
								<PromptInputActionMenu open={isAddMenuOpen} onOpenChange={setIsAddMenuOpen}>
									<PromptInputActionMenuTrigger aria-label="Add" size="icon-sm" variant="ghost">
										<AddIcon label="" />
									</PromptInputActionMenuTrigger>
									<PromptInputActionMenuContent>
										<PromptInputActionAddAttachments
											elemBefore={<UploadIcon label="" />}
											onSelect={() => setIsAddMenuOpen(false)}
										>
											Upload file
										</PromptInputActionAddAttachments>
										<PromptInputActionAddScreenshot
											elemBefore={<ScreenIcon label="" />}
											onSelect={() => setIsAddMenuOpen(false)}
										>
											Take screenshot
										</PromptInputActionAddScreenshot>
										<PromptInputActionMenuItem
											onSelect={() => setIsAddMenuOpen(false)}
											elemBefore={<LinkIcon label="" />}
										>
											Add a link
										</PromptInputActionMenuItem>
										<PromptInputActionMenuItem
											onSelect={() => setIsAddMenuOpen(false)}
											elemBefore={<MentionIcon label="" />}
										>
											Mention someone
										</PromptInputActionMenuItem>
										<PromptInputActionMenuItem
											onSelect={() => setIsAddMenuOpen(false)}
											elemBefore={<AddIcon label="" />}
										>
											More formatting
										</PromptInputActionMenuItem>
										<PromptInputActionMenuItem
											onSelect={() => setIsAddMenuOpen(false)}
											elemBefore={<PageIcon label="" />}
										>
											Add current page as context
										</PromptInputActionMenuItem>
									</PromptInputActionMenuContent>
								</PromptInputActionMenu>

								<PromptInputButton
									size="icon-sm"
									variant={clickyActive ? "default" : "ghost"}
									onClick={() => setClickyActive((prev) => !prev)}
									aria-label="Rovo AI cursor"
									aria-pressed={clickyActive}
									tooltip={{ content: "AI Cursor ⌘⇧K", delay: 0 }}
								>
									<CursorIcon label="" />
								</PromptInputButton>

								<Popover open={isCustomizeMenuOpen} onOpenChange={handleCustomizeMenuOpenChange}>
									<PopoverTrigger
										render={<PromptInputPreferencesButton aria-label="Customize" />}
									/>
									<PopoverContent side="top" align="start" sideOffset={8} className="w-auto p-2">
										<PopoverTitle className="sr-only">Customize sources</PopoverTitle>
										<CustomizeMenu
											selectedReasoning={selectedReasoning}
											onReasoningChange={setSelectedReasoning}
											showReasoning={false}
											webResultsEnabled={webResultsEnabled}
											onWebResultsChange={setWebResultsEnabled}
											companyKnowledgeEnabled={companyKnowledgeEnabled}
											onCompanyKnowledgeChange={setCompanyKnowledgeEnabled}
											onClose={() => setIsCustomizeMenuOpen(false)}
										/>
									</PopoverContent>
								</Popover>
							</PromptInputTools>

							<RovoComposerSendControls
								canSubmit={canSubmit}
								className="flex-1"
								companyKnowledgeEnabled={companyKnowledgeEnabled}
								composerStatus="ready"
								onCompanyKnowledgeChange={setCompanyKnowledgeEnabled}
								onOpenChange={handleAutoMenuOpenChange}
								onReasoningChange={setSelectedReasoning}
								onStop={handleStop}
								onToggleRealtimeVoice={handleToggleRealtimeVoice}
								onWebResultsChange={setWebResultsEnabled}
								open={isAutoMenuOpen}
								selectedReasoning={selectedReasoning}
								webResultsEnabled={webResultsEnabled}
							/>
						</PromptInputFooter>
					</PromptInput>

					<style>{textareaCSS}</style>
				</div>
			</div>
		</DemoFrame>
	);
}

export function PromptInputDemoFloatingBar() {
	const [prompt, setPrompt] = useState("");
	const [realtimeVoiceActive, setRealtimeVoiceActive] = useState(false);

	const handleToggleRealtimeVoice = useCallback(() => {
		setRealtimeVoiceActive((prev) => !prev);
	}, []);

	const handleStop = useCallback(() => {
		setRealtimeVoiceActive(false);
	}, []);

	const canSubmit = Boolean(prompt.trim());

	return (
		<DemoFrame>
			<FloatingComposer
				allowOverflow
				onSubmit={() => setPrompt("")}
				actions={
					<RovoComposerActionButton
						canSubmit={canSubmit}
						composerStatus="ready"
						onStop={handleStop}
						onToggleRealtimeVoice={handleToggleRealtimeVoice}
						realtimeVoiceActive={realtimeVoiceActive}
					/>
				}
			>
				<PromptInputTextarea
					value={prompt}
					onChange={(e) => setPrompt(e.currentTarget.value)}
					placeholder="Ask, @mention, or / for actions"
					autoResize
					rows={1}
					className={cn(composerTextareaClassName, floatingComposerTextareaClassName)}
				/>
			</FloatingComposer>

			<style>{textareaCSS}</style>
		</DemoFrame>
	);
}
