"use client";

import type { ReactNode } from "react";
import { useCallback, useState } from "react";
import CustomizeMenu from "@/components/blocks/shared-ui/customize-menu";
import {
	composerPromptInputClassName,
	composerTextareaClassName,
	textareaCSS,
} from "@/components/blocks/shared-ui/composer-styles";
import { Popover, PopoverContent, PopoverTitle, PopoverTrigger } from "@/components/ui/popover";
import {
	CreateInput,
	CreateInputActionAddAttachments,
	CreateInputActionAddScreenshot,
	CreateInputActionMenu,
	CreateInputActionMenuContent,
	CreateInputActionMenuItem,
	CreateInputActionMenuTrigger,
	CreateInputBody,
	CreateInputFooter,
	CreateInputPreferencesButton,
	CreateInputSubmit,
	CreateInputTextarea,
	CreateInputTools,
} from "@/components/ui-custom/create-input";
import { SpeechInput } from "@/components/ui-custom/speech-input";
import { cn } from "@/lib/utils";
import AddIcon from "@atlaskit/icon/core/add";
import ArrowUpIcon from "@atlaskit/icon/core/arrow-up";
import LinkIcon from "@atlaskit/icon/core/link";
import MentionIcon from "@atlaskit/icon/core/mention";
import PageIcon from "@atlaskit/icon/core/page";
import ScreenIcon from "@atlaskit/icon/core/screen";
import UploadIcon from "@atlaskit/icon/core/upload";

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

export default function CreateInputDemo() {
	return <CreateInputDemoChatComposer />;
}

export function CreateInputDemoChatComposer() {
	const [prompt, setPrompt] = useState("");
	const [selectedReasoning, setSelectedReasoning] = useState("deep-research");
	const [webResultsEnabled, setWebResultsEnabled] = useState(false);
	const [companyKnowledgeEnabled, setCompanyKnowledgeEnabled] = useState(true);
	const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
	const [isCustomizeMenuOpen, setIsCustomizeMenuOpen] = useState(false);

	const handleSpeechTranscription = useCallback((text: string) => {
		const trimmed = text.trim();
		if (!trimmed) return;
		setPrompt((prev) => (prev.trimEnd() ? `${prev.trimEnd()} ${trimmed}` : trimmed));
	}, []);

	return (
		<DemoFrame>
			<div className="px-1">
				<div
					className="rounded-xl border border-border bg-surface px-4 pb-4 pt-4 shadow-[0px_-2px_50px_8px_rgba(30,31,33,0.08)]"
				>
					<CreateInput
						allowOverflow
						onSubmit={() => {
							setPrompt("");
						}}
						className={composerPromptInputClassName}
					>
						<CreateInputBody>
							<CreateInputTextarea
								value={prompt}
								onChange={(event) => setPrompt(event.currentTarget.value)}
								placeholder="Ask, @mention, or / for skills"
								aria-label="Chat message input"
								rows={1}
								className={composerTextareaClassName}
							/>
						</CreateInputBody>

						<CreateInputFooter className="justify-between px-0 pb-0">
							<CreateInputTools>
								<CreateInputActionMenu open={isAddMenuOpen} onOpenChange={setIsAddMenuOpen}>
									<CreateInputActionMenuTrigger aria-label="Add" size="icon-sm" variant="ghost">
										<AddIcon label="" />
									</CreateInputActionMenuTrigger>
									<CreateInputActionMenuContent>
										<CreateInputActionAddAttachments
											elemBefore={<UploadIcon label="" />}
										>
											Upload file
										</CreateInputActionAddAttachments>
										<CreateInputActionAddScreenshot
											elemBefore={<ScreenIcon label="" />}
										>
											Take screenshot
										</CreateInputActionAddScreenshot>
										<CreateInputActionMenuItem
											onSelect={() => setIsAddMenuOpen(false)}
											elemBefore={<LinkIcon label="" />}
										>
											Add a link
										</CreateInputActionMenuItem>
										<CreateInputActionMenuItem
											onSelect={() => setIsAddMenuOpen(false)}
											elemBefore={<MentionIcon label="" />}
										>
											Mention someone
										</CreateInputActionMenuItem>
										<CreateInputActionMenuItem
											onSelect={() => setIsAddMenuOpen(false)}
											elemBefore={<AddIcon label="" />}
										>
											More formatting
										</CreateInputActionMenuItem>
										<CreateInputActionMenuItem
											onSelect={() => setIsAddMenuOpen(false)}
											elemBefore={<PageIcon label="" />}
										>
											Add current page as context
										</CreateInputActionMenuItem>
									</CreateInputActionMenuContent>
								</CreateInputActionMenu>

								<Popover open={isCustomizeMenuOpen} onOpenChange={setIsCustomizeMenuOpen}>
									<PopoverTrigger
										render={<CreateInputPreferencesButton aria-label="Customize" />}
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
							</CreateInputTools>

							<div className="flex items-center gap-1">
								<SpeechInput aria-label="Voice" onTranscriptionChange={handleSpeechTranscription} size="icon" />
								<CreateInputSubmit aria-label="Submit" disabled={!prompt.trim()} size="icon-sm">
									<ArrowUpIcon label="" />
								</CreateInputSubmit>
							</div>
						</CreateInputFooter>
					</CreateInput>

					<style>{textareaCSS}</style>
				</div>

			</div>
		</DemoFrame>
	);
}

export function CreateInputDemoFloatingBar() {
	const [prompt, setPrompt] = useState("");

	const handleSpeechTranscription = useCallback(
		(transcription: string) => {
			setPrompt((prev) => (prev ? `${prev} ${transcription}` : transcription));
		},
		[],
	);

	return (
		<DemoFrame>
			<CreateInput
				variant="floating"
				allowOverflow
				onSubmit={() => {
					setPrompt("");
				}}
			>
				<CreateInputBody className="flex w-full items-center justify-between gap-2">
					<CreateInputTextarea
						value={prompt}
						onChange={(e) => setPrompt(e.currentTarget.value)}
						placeholder="Ask, @mention, or / for actions"
						rows={1}
						className="min-h-0 flex-1 py-0"
					/>
					<div className="flex shrink-0 items-center gap-1">
						<SpeechInput
							aria-label="Voice"
							onTranscriptionChange={handleSpeechTranscription}
							variant="ghost"
						/>
						<CreateInputSubmit
							disabled={!prompt.trim()}
							aria-label="Submit"
						>
							<ArrowUpIcon label="" />
						</CreateInputSubmit>
					</div>
				</CreateInputBody>
			</CreateInput>
		</DemoFrame>
	);
}
