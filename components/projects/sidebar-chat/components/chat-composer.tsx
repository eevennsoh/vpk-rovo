"use client";

import { useState } from "react";
import type { ChatStatus } from "ai";
import type { QueuedPromptItem } from "@/app/contexts";
import CustomizeMenu from "@/components/blocks/shared-ui/customize-menu";
import { DEFAULT_REASONING_OPTION_ID } from "@/components/blocks/shared-ui/data/customize-menu-data";
import {
	PromptInput,
	PromptInputActionMenu,
	PromptInputActionMenuContent,
	PromptInputActionMenuTrigger,
	PromptInputBody,
	PromptInputButton,
	PromptInputFooter,
	PromptInputPreferencesButton,
	PromptInputTextarea,
	PromptInputTools,
	type PromptInputMessage,
	usePromptInputAttachments,
} from "@/components/ui-custom/prompt-input";
import { Popover, PopoverContent, PopoverTitle, PopoverTrigger } from "@/components/ui/popover";
import { composerUpwardShadow, composerPromptInputClassName, composerTextareaClassName, textareaCSS } from "@/components/blocks/shared-ui/composer-styles";
import { Queue, QueueItem, QueueItemActions, QueueItemContent, QueueItemIndicator, QueueList } from "@/components/ui-custom/queue";
import { Button } from "@/components/ui/button";
import DeleteIcon from "@atlaskit/icon/core/delete";
import { Footer } from "@/components/ui/footer";
import ChatContextBar from "./chat-context-bar";
import type { ChatContextBarDescriptor } from "../lib/chat-context-bar";
import AddIcon from "@atlaskit/icon/core/add";
import CursorIcon from "@atlaskit/icon-lab/core/cursor";
import { PendingAttachments } from "@/components/projects/rovo/components/pending-attachments";
import { RovoAppComposerAddMenu } from "@/components/projects/rovo/components/rovo-app-composer-add-menu";
import { RovoComposerSendControls } from "@/components/projects/shared/components/rovo-composer-send-controls";

interface ChatComposerProps {
	prompt: string;
	isStreaming: boolean;
	hasInFlightTurn: boolean;
	queuedPrompts: ReadonlyArray<QueuedPromptItem>;
	micStream?: MediaStream | null;
	clickyActive?: boolean;
	onPromptChange: (value: string) => void;
	onSubmit: (message: PromptInputMessage) => Promise<void> | void;
	onStop: () => void;
	onToggleClicky?: () => void;
	onToggleRealtimeVoice?: () => void;
	onRemoveQueuedPrompt: (id: string) => void;
	onReasoningChange?: (value: string) => void;
	realtimeVoiceActive?: boolean;
	selectedReasoning?: string;
	chatContextBar?: ChatContextBarDescriptor | null;
}

interface ChatComposerSendControlsProps {
	companyKnowledgeEnabled: boolean;
	composerStatus: ChatStatus;
	isComposerBusy: boolean;
	micStream: MediaStream | null;
	onCompanyKnowledgeChange: (value: boolean) => void;
	onOpenChange: (open: boolean) => void;
	onReasoningChange: (value: string) => void;
	onStop: () => void;
	onToggleRealtimeVoice?: () => void;
	open: boolean;
	prompt: string;
	realtimeVoiceActive: boolean;
	selectedReasoning: string;
	webResultsEnabled: boolean;
	onWebResultsChange: (value: boolean) => void;
}

function getQueuedPromptLabel(queuedPrompt: QueuedPromptItem): string {
	return queuedPrompt.text || queuedPrompt.files[0]?.filename || "Attachment";
}

function ChatComposerSendControls({
	companyKnowledgeEnabled,
	composerStatus,
	isComposerBusy,
	micStream,
	onCompanyKnowledgeChange,
	onOpenChange,
	onReasoningChange,
	onStop,
	onToggleRealtimeVoice,
	open,
	prompt,
	realtimeVoiceActive,
	selectedReasoning,
	webResultsEnabled,
	onWebResultsChange,
}: Readonly<ChatComposerSendControlsProps>) {
	const attachments = usePromptInputAttachments();
	const canSubmit = prompt.trim().length > 0 || attachments.files.length > 0;

	return (
		<RovoComposerSendControls
			canSubmit={canSubmit}
			companyKnowledgeEnabled={companyKnowledgeEnabled}
			composerStatus={composerStatus}
			isComposerBusy={isComposerBusy}
			micStream={micStream}
			onCompanyKnowledgeChange={onCompanyKnowledgeChange}
			onOpenChange={onOpenChange}
			onReasoningChange={onReasoningChange}
			onStop={onStop}
			onToggleRealtimeVoice={onToggleRealtimeVoice}
			open={open}
			realtimeVoiceActive={realtimeVoiceActive}
			selectedReasoning={selectedReasoning}
			webResultsEnabled={webResultsEnabled}
			onWebResultsChange={onWebResultsChange}
		/>
	);
}

export default function ChatComposer({ prompt, isStreaming, hasInFlightTurn, queuedPrompts, micStream = null, clickyActive = false, onPromptChange, onSubmit, onStop, onToggleClicky, onToggleRealtimeVoice, onRemoveQueuedPrompt, onReasoningChange, realtimeVoiceActive = false, selectedReasoning: controlledSelectedReasoning, chatContextBar }: Readonly<ChatComposerProps>): React.ReactElement {
	const [localSelectedReasoning, setLocalSelectedReasoning] = useState(DEFAULT_REASONING_OPTION_ID);
	const [webResultsEnabled, setWebResultsEnabled] = useState(false);
	const [companyKnowledgeEnabled, setCompanyKnowledgeEnabled] = useState(true);
	const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
	const [isCustomizeMenuOpen, setIsCustomizeMenuOpen] = useState(false);
	const [isAutoMenuOpen, setIsAutoMenuOpen] = useState(false);
	const selectedReasoning = controlledSelectedReasoning ?? localSelectedReasoning;
	const hasQueuedPrompts = queuedPrompts.length > 0;
	const submitStatus = isStreaming
		? "streaming"
		: hasInFlightTurn
			? "submitted"
			: "ready";
	const isComposerBusy = isStreaming || hasInFlightTurn;
	const handleCustomizeMenuOpenChange = (open: boolean) => {
		setIsCustomizeMenuOpen(open);
		if (open) {
			setIsAutoMenuOpen(false);
		}
	};
	const handleAutoMenuOpenChange = (open: boolean) => {
		setIsAutoMenuOpen(open);
		if (open) {
			setIsCustomizeMenuOpen(false);
		}
	};
	const handleReasoningChange = (value: string) => {
		setLocalSelectedReasoning(value);
		onReasoningChange?.(value);
	};

	return (
		<div className="relative min-w-0 px-3">
			<ChatContextBar key={chatContextBar?.signature} context={chatContextBar} />
			{hasQueuedPrompts ? (
				<div className="pointer-events-none absolute bottom-full left-4 right-4 z-0">
					<Queue className="pointer-events-auto rounded-b-none border-border border-b-0 bg-surface-raised px-2 pt-2 pb-2 shadow-none">
						<QueueList className="mt-0 mb-0 w-full [&_[data-slot=scroll-area-viewport]>div]:max-h-28 [&_[data-slot=scroll-area-viewport]>div]:pr-0 [&_ul]:w-full">
							{queuedPrompts.map((queuedPrompt) => (
								<QueueItem key={queuedPrompt.id} className="w-full bg-surface py-2 hover:bg-surface-hovered">
									<div className="flex items-center gap-2">
										<QueueItemIndicator />
										<QueueItemContent className="text-text-subtle">{getQueuedPromptLabel(queuedPrompt)}</QueueItemContent>
										<QueueItemActions>
											<Button
												aria-label="Remove queued message"
												onClick={() => onRemoveQueuedPrompt(queuedPrompt.id)}
												size="icon-sm"
												variant="ghost"
												className="size-7 rounded-full text-icon-subtle opacity-0 transition-opacity group-hover:opacity-100"
											>
												<DeleteIcon label="" size="small" />
											</Button>
										</QueueItemActions>
									</div>
								</QueueItem>
							))}
						</QueueList>
					</Queue>
				</div>
			) : null}
			<div className="relative z-10 rounded-xl border border-border bg-surface px-4 pb-3 pt-4" style={{ boxShadow: composerUpwardShadow }}>
				<PromptInput allowOverflow onSubmit={onSubmit} className={`${composerPromptInputClassName} relative z-10`}>
					<PendingAttachments />
					<PromptInputBody>
						<PromptInputTextarea
							value={prompt}
							onChange={(event) => onPromptChange(event.currentTarget.value)}
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
								<PromptInputActionMenuContent
									positionerClassName="z-[600]"
									side="top"
									sideOffset={8}
								>
									<RovoAppComposerAddMenu
										onClose={() => setIsAddMenuOpen(false)}
									/>
								</PromptInputActionMenuContent>
							</PromptInputActionMenu>

							<PromptInputButton
								size="icon-sm"
								variant={clickyActive ? "default" : "ghost"}
								onClick={onToggleClicky}
								aria-label="Rovo AI cursor"
								aria-pressed={clickyActive}
								tooltip={{ content: "AI Cursor ⌘⇧K", delay: 0 }}
							>
								<CursorIcon label="" />
							</PromptInputButton>

							<Popover open={isCustomizeMenuOpen} onOpenChange={handleCustomizeMenuOpenChange}>
								<PopoverTrigger render={<PromptInputPreferencesButton aria-label="Customize" />} />
								<PopoverContent side="top" align="start" sideOffset={8} positionerClassName="z-[600]" className="w-auto p-2">
									<PopoverTitle className="sr-only">Customize sources</PopoverTitle>
									<CustomizeMenu
										selectedReasoning={selectedReasoning}
										onReasoningChange={handleReasoningChange}
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

						<ChatComposerSendControls
							companyKnowledgeEnabled={companyKnowledgeEnabled}
							composerStatus={submitStatus}
							isComposerBusy={isComposerBusy}
							micStream={micStream}
							onCompanyKnowledgeChange={setCompanyKnowledgeEnabled}
							onOpenChange={handleAutoMenuOpenChange}
							onReasoningChange={handleReasoningChange}
							onStop={onStop}
							onToggleRealtimeVoice={onToggleRealtimeVoice}
							open={isAutoMenuOpen}
							prompt={prompt}
							realtimeVoiceActive={realtimeVoiceActive}
							selectedReasoning={selectedReasoning}
							webResultsEnabled={webResultsEnabled}
							onWebResultsChange={setWebResultsEnabled}
						/>
					</PromptInputFooter>
				</PromptInput>
			</div>

			<style>{textareaCSS}</style>

			<Footer />
		</div>
	);
}
