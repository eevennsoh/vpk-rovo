"use client";

import type { ChatStatus, FileUIPart } from "ai";
import {
	PromptInputButton,
	PromptInputProvider,
	PromptInputTextarea,
	usePromptInputController,
} from "@/components/ui-custom/prompt-input";
import {
	Queue,
	QueueItem,
	QueueItemActions,
	QueueItemContent,
	QueueItemIndicator,
	QueueList,
} from "@/components/ui-custom/queue";
import { composerTextareaClassName, floatingComposerTextareaClassName, textareaCSS } from "@/components/blocks/shared-ui/composer-styles";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { SkillTag, SkillTagGroup } from "@/components/ui-custom/skill-tag";
import type { VoiceButtonState } from "@/components/ui-audio/voice-button";
import ChatContextBar from "@/components/projects/sidebar-chat/components/chat-context-bar";
import { resolveRovoAppComposerResponseGradientState } from "@/components/projects/studio/lib/rovo-app-composer-response-gradient-state";
import type { RealtimeGenerationState } from "@/components/projects/studio/hooks/use-realtime-voice";
import { cn } from "@/lib/utils";
import type { RovoAppPlanExecutionTrackerViewModel } from "@/components/projects/studio/lib/rovo-app-plan-execution-tracker";
import type { RovoAppQueuedAction } from "@/lib/rovo-app-types";
import AddIcon from "@atlaskit/icon/core/add";
import ArrowUpIcon from "@atlaskit/icon/core/arrow-up";
import CursorIcon from "@atlaskit/icon-lab/core/cursor";
import DeleteIcon from "@atlaskit/icon/core/delete";
import SkillIcon from "@atlaskit/icon-lab/core/skill";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { RovoAppPlanExecutionTracker } from "./rovo-app-plan-execution-tracker";
import { RovoAppComposerResponseGradient } from "./rovo-app-composer-response-gradient";
import { RovoComposerActionButton } from "@/components/projects/shared/components/rovo-composer-send-controls";
import { FloatingComposer } from "@/components/projects/shared/components/floating-composer";

const HIDDEN_COMPOSER_SKILL_IDS = new Set(["vpk-html"]);
const EMPTY_REALTIME_OUTPUT_WAVEFORM_BARS: number[] = [];
const EMPTY_QUEUED_PROMPTS: ReadonlyArray<RovoAppQueuedAction> = [];

const supportsFieldSizing =
	typeof window !== "undefined" &&
	typeof window.CSS?.supports === "function" &&
	window.CSS.supports("field-sizing", "content");

interface RovoAppComposerProps {
	artifactTitle?: string | null;
	availableHermesSkills?: ReadonlyArray<{ id: string; title: string; disabled: boolean }>;
	autoFocus?: boolean;
	backgroundArtifactLabel?: string | null;
	composerStatus: ChatStatus;
	compact?: boolean;
	errorMessage?: string | null;
	isPlanMode?: boolean;
	micStream?: MediaStream | null;
	queuedPrompts?: ReadonlyArray<RovoAppQueuedAction>;
	onStop: () => Promise<void>;
	onDismissPlanExecutionTracker?: () => void;
	onDismissArtifactContext?: () => void;
	onRemoveQueuedPrompt?: (id: string) => void;
	onSendQueuedPromptNow?: (id: string) => void;
	onSelectHermesSkill?: (skillId: string) => void;
	onStartFromScratch?: () => void;
	onSubmit: (payload: { text: string; files: FileUIPart[] }) => Promise<void>;
	onToggleClicky?: () => void;
	onTogglePlanMode?: () => void;
	onToggleRealtimeVoice?: () => void;
	onToggleVoice?: () => void;
	galleryExpanded?: boolean;
	placeholder?: string;
	planExecutionTracker?: RovoAppPlanExecutionTrackerViewModel | null;
	prefillText?: string | null;
	previewPrompt?: string | null;
	realtimeGenerationState?: RealtimeGenerationState;
	realtimeOutputWaveformBars?: number[];
	realtimeVoiceActive?: boolean;
	realtimeVoiceState?: "idle" | "connecting" | "listening" | "speaking";
	clickyActive?: boolean;
	renderResponseGradient?: (props: {
		active: boolean;
		phase: "warmup" | "speaking";
		signal: number[];
		voiceState: "idle" | "connecting" | "listening" | "speaking";
		generationState: string;
		micStream?: MediaStream | null;
	}) => React.ReactNode;
	showBackgroundStop?: boolean;
	selectedHermesSkills?: ReadonlyArray<{ id: string; title: string }>;
	onRemoveHermesSkill?: (skillId: string) => void;
	submitDisabled?: boolean;
	voiceState?: VoiceButtonState;
}

const EMPTY_AVAILABLE_SKILLS: ReadonlyArray<{ id: string; title: string; disabled: boolean }> = [];

function RovoAppComposerInner({
	artifactTitle,
	availableHermesSkills = EMPTY_AVAILABLE_SKILLS,
	autoFocus = true,
	backgroundArtifactLabel,
	composerStatus,
	errorMessage,
	micStream,
	onDismissPlanExecutionTracker,
	onDismissArtifactContext,
	queuedPrompts = EMPTY_QUEUED_PROMPTS,
	onStop,
	onRemoveQueuedPrompt,
	onSendQueuedPromptNow,
	onSelectHermesSkill,
	onStartFromScratch,
	onSubmit,
	onToggleClicky,
	onToggleRealtimeVoice,
	clickyActive = false,
	placeholder = "Describe what it should do",
	planExecutionTracker = null,
	prefillText,
	realtimeGenerationState = "idle",
	realtimeOutputWaveformBars = EMPTY_REALTIME_OUTPUT_WAVEFORM_BARS,
	realtimeVoiceActive = false,
	realtimeVoiceState = "idle",
	renderResponseGradient,
	showBackgroundStop = false,
	selectedHermesSkills = [],
	onRemoveHermesSkill,
	submitDisabled = false,
}: Readonly<RovoAppComposerProps>) {
	const controller = usePromptInputController();
	const textareaRef = useRef<HTMLTextAreaElement | null>(null);
	const [highlightedIndex, setHighlightedIndex] = useState(0);
	const [isInputFocused, setIsInputFocused] = useState(false);
	const slashMenuRef = useRef<HTMLDivElement | null>(null);
	const canSubmit = controller.textInput.value.trim().length > 0 || controller.attachments.files.length > 0;
	const hasQueuedPrompts = queuedPrompts.length > 0;
	const realtimeResponseGradientState = resolveRovoAppComposerResponseGradientState({
		realtimeGenerationState,
		realtimeVoiceState,
	});

	const handlePromptSubmit = useCallback(
		(payload: { text: string; files: FileUIPart[] }) => {
			if (submitDisabled) {
				return;
			}

			void onSubmit(payload).catch(() => {});
		},
		[onSubmit, submitDisabled],
	);

	const enabledHermesSkills = useMemo(
		() => availableHermesSkills.filter((skill) => !skill.disabled),
		[availableHermesSkills],
	);
	const slashMatch = onSelectHermesSkill && enabledHermesSkills.length > 0
		? controller.textInput.value.match(/(^|\s)\/([\w-]*)$/)
		: null;
	const isSlashMenuOpen = slashMatch !== null;
	const slashQuery = slashMatch?.[2] ?? "";
	const filteredSlashSkills = slashQuery
		? enabledHermesSkills.filter((skill) =>
			skill.title.toLowerCase().includes(slashQuery.toLowerCase()),
		)
		: enabledHermesSkills;
	const visibleSelectedHermesSkills = selectedHermesSkills.filter(
		(skill) => !HIDDEN_COMPOSER_SKILL_IDS.has(skill.id),
	);
	const artifactContextBar = artifactTitle
		? {
				iconName: "artifact" as const,
				label: artifactTitle,
				signature: `rovo-artifact:${artifactTitle}`,
				variant: "edit" as const,
			}
		: null;

	const handleSlashSelect = useCallback(
		(skillId: string) => {
			onSelectHermesSkill?.(skillId);
			const text = controller.textInput.value;
			const match = text.match(/(^|\s)\/[\w-]*$/);
			if (match) {
				const cleaned = text.slice(0, match.index! + (match[1] ? 1 : 0)).trimEnd();
				controller.textInput.setInput(cleaned);
			}
			requestAnimationFrame(() => {
				textareaRef.current?.focus();
			});
		},
		[controller.textInput, onSelectHermesSkill],
	);

	const handleTextareaKeyDown = useCallback(
		(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
			if (!isSlashMenuOpen || filteredSlashSkills.length === 0) return;

			if (e.key === "ArrowDown") {
				e.preventDefault();
				setHighlightedIndex((prev) =>
					prev < filteredSlashSkills.length - 1 ? prev + 1 : 0,
				);
				return;
			}

			if (e.key === "ArrowUp") {
				e.preventDefault();
				setHighlightedIndex((prev) =>
					prev > 0 ? prev - 1 : filteredSlashSkills.length - 1,
				);
				return;
			}

			if (e.key === "Escape") {
				e.preventDefault();
				controller.textInput.setInput(
					controller.textInput.value.replace(/(^|\s)\/[\w-]*$/, "$1").trimEnd(),
				);
				return;
			}

			if (e.key === "Enter") {
				e.preventDefault();
				handleSlashSelect(filteredSlashSkills[highlightedIndex].id);
			}
		},
		[controller.textInput, filteredSlashSkills, handleSlashSelect, highlightedIndex, isSlashMenuOpen],
	);

	useEffect(() => {
		if (!isSlashMenuOpen) return;
		const container = slashMenuRef.current;
		if (!container) return;
		const items = container.querySelectorAll<HTMLButtonElement>("[data-slash-item]");
		items[highlightedIndex]?.scrollIntoView({ block: "nearest" });
	}, [highlightedIndex, isSlashMenuOpen]);

	// Apply prefilled text from gallery click or voice transcript streaming
	const appliedPrefillRef = useRef<string | null>(null);
	useEffect(() => {
		if (prefillText && prefillText !== appliedPrefillRef.current) {
			appliedPrefillRef.current = prefillText;
			controller.textInput.setInput(prefillText);

			if (supportsFieldSizing) {
				requestAnimationFrame(() => {
					const el = textareaRef.current;
					if (!el) return;
					el.style.height = "";
					el.style.overflowY = "";
				});
				return;
			}

			// Ensure the textarea resizes to fit the prefilled content.
			// Wait two frames so React commits the value to the DOM first.
			requestAnimationFrame(() => {
				requestAnimationFrame(() => {
					const el = textareaRef.current;
					if (!el) return;
					el.style.height = "0px";
					const styles = window.getComputedStyle(el);
					const maxH = parseFloat(styles.maxHeight);
					const maxHeight = Number.isFinite(maxH) ? maxH : 120;
					const nextHeight = Math.min(maxHeight, el.scrollHeight);
					el.style.height = `${nextHeight}px`;
					el.style.overflowY = el.scrollHeight > nextHeight ? "auto" : "hidden";
				});
			});
		} else if (prefillText === null && appliedPrefillRef.current !== null) {
			// Voice transcript cleared (auto-sent) — clear the input
			appliedPrefillRef.current = null;
			controller.textInput.clear();
		}
	}, [prefillText, controller.textInput]);

	return (
		<div className="relative isolate overflow-visible">
			<div className="pointer-events-none absolute inset-0 overflow-visible">
				{renderResponseGradient ? (
					renderResponseGradient({
						active: realtimeVoiceActive || realtimeResponseGradientState.visible,
						phase: realtimeResponseGradientState.phase ?? "warmup",
						signal: realtimeOutputWaveformBars,
						voiceState: realtimeVoiceState,
						generationState: realtimeGenerationState,
						micStream,
					})
				) : (
					<RovoAppComposerResponseGradient active={realtimeResponseGradientState.visible} phase={realtimeResponseGradientState.phase ?? "warmup"} signal={realtimeOutputWaveformBars} />
				)}
			</div>
			<div className="flex w-full flex-col overflow-visible">
				{errorMessage ? <Alert variant="danger">{errorMessage}</Alert> : null}
				{backgroundArtifactLabel ? <p className="px-1 text-text-subtlest text-xs">{backgroundArtifactLabel}</p> : null}

				{hasQueuedPrompts ? (
					<div className="px-1">
						<Queue className="rounded-b-none border-border border-b-0 bg-surface-raised px-2 pt-2 pb-2 shadow-none">
							<QueueList className="mt-0 mb-0 w-full [&_[data-slot=scroll-area-viewport]>div]:max-h-28 [&_[data-slot=scroll-area-viewport]>div]:pr-0 [&_ul]:w-full">
								{queuedPrompts.map((queuedPrompt) => (
									<QueueItem key={queuedPrompt.id} className="w-full bg-surface py-2 hover:bg-surface-hovered">
										<div className="flex items-center gap-2">
											<QueueItemIndicator />
											<QueueItemContent className="text-text-subtle">
												{queuedPrompt.text}
											</QueueItemContent>
											<QueueItemActions>
												<Button
													aria-label="Send now"
													onClick={() => onSendQueuedPromptNow?.(queuedPrompt.id)}
													size="icon-sm"
													type="button"
													variant="ghost"
													className="size-7 rounded-full text-icon-subtle opacity-0 transition-opacity group-hover:opacity-100"
												>
													<ArrowUpIcon label="" size="small" />
												</Button>
												<Button
													aria-label="Remove queued message"
													onClick={() => onRemoveQueuedPrompt?.(queuedPrompt.id)}
													size="icon-sm"
													type="button"
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

				<AnimatePresence>
					{planExecutionTracker ? (
						<motion.div
							key="plan-execution-tracker"
							initial={{ opacity: 0, y: 24 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: 24 }}
							transition={{ type: "spring", bounce: 0, visualDuration: 0.35 }}
							className="pb-3"
							style={{ willChange: "transform, opacity" }}
						>
							<RovoAppPlanExecutionTracker
								onDismiss={onDismissPlanExecutionTracker}
								tracker={planExecutionTracker}
							/>
						</motion.div>
					) : null}
				</AnimatePresence>

				<ChatContextBar context={artifactContextBar} onDismiss={onDismissArtifactContext} />

				{visibleSelectedHermesSkills.length > 0 ? (
					<div className="mb-3 flex flex-wrap items-center gap-2">
						<SkillTagGroup>
							{visibleSelectedHermesSkills.map((skill) => (
								<SkillTag
									key={skill.id}
									color="platform"
									icon={<SkillIcon label="" size="small" />}
									onRemove={onRemoveHermesSkill ? () => onRemoveHermesSkill(skill.id) : undefined}
									removeButtonLabel={`Remove ${skill.title}`}
								>
									{skill.title}
								</SkillTag>
							))}
						</SkillTagGroup>
					</div>
				) : null}

				<div className="relative z-10">
					<FloatingComposer
						allowOverflow
						className="relative z-10"
						data-screen-assistant-target="studio-composer"
						onSubmit={handlePromptSubmit}
						addButton={
							<div className="flex items-center gap-1">
								<PromptInputButton size="icon-sm" variant="ghost" aria-label="Add">
									<AddIcon label="" />
								</PromptInputButton>
								<PromptInputButton
									size="icon-sm"
									variant={clickyActive ? "default" : "ghost"}
									onClick={onToggleClicky}
									aria-label="Studio AI cursor"
									aria-pressed={clickyActive}
									tooltip={{ content: "AI Cursor ⌘⇧K", delay: 0 }}
								>
									<CursorIcon label="" />
								</PromptInputButton>
							</div>
						}
						actions={
							<RovoComposerActionButton
								canSubmit={canSubmit}
								composerStatus={composerStatus}
								micStream={micStream}
								onStop={onStop}
								onToggleRealtimeVoice={onToggleRealtimeVoice}
								realtimeVoiceActive={realtimeVoiceActive}
								screenAssistantTargetPrefix="studio-composer"
								showBackgroundStop={showBackgroundStop}
								submitDisabled={submitDisabled}
								voiceStartButtonClassName="bg-bg-neutral-bold text-text-inverse hover:bg-bg-neutral-bold-hovered active:bg-bg-neutral-bold-pressed"
							/>
						}
					>
						<PromptInputTextarea
							ref={textareaRef}
							autoFocus={autoFocus}
							autoResize
							className={cn(composerTextareaClassName, floatingComposerTextareaClassName)}
							onBlur={() => setIsInputFocused(false)}
							onFocus={() => setIsInputFocused(true)}
							onInput={() => setHighlightedIndex(0)}
							onKeyDown={handleTextareaKeyDown}
							placeholder={placeholder}
							rows={1}
							suppressHydrationWarning
						/>
					</FloatingComposer>

					<AnimatePresence>
						{isSlashMenuOpen && filteredSlashSkills.length > 0 ? (
							<motion.div
								key="slash-menu"
								ref={slashMenuRef}
								role="listbox"
								aria-label="Skills"
								initial={{ opacity: 0, y: 8 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0, y: 8 }}
								transition={{ type: "spring", bounce: 0, visualDuration: 0.15 }}
								className="absolute inset-x-0 bottom-full z-50 mb-2 overflow-hidden rounded-lg bg-surface-overlay shadow-xl"
								style={{ willChange: "transform, opacity" }}
							>
								<div className="max-h-[170px] overflow-y-auto py-1">
									{filteredSlashSkills.map((skill, index) => (
										<button
											key={skill.id}
											type="button"
											role="option"
											aria-selected={index === highlightedIndex}
											data-slash-item
											className={cn(
												"flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-text transition-colors",
												index === highlightedIndex
													? "bg-bg-neutral-subtle-hovered"
													: "hover:bg-bg-neutral-subtle-hovered active:bg-bg-neutral-subtle-pressed",
											)}
											onMouseEnter={() => setHighlightedIndex(index)}
											onClick={() => handleSlashSelect(skill.id)}
										>
											<SkillIcon label="" size="small" />
											<span className="min-w-0 truncate">{skill.title}</span>
										</button>
									))}
								</div>
							</motion.div>
						) : null}
					</AnimatePresence>

					{onStartFromScratch ? (
						<AnimatePresence>
							{isInputFocused ? (
								<motion.div
									key="start-from-scratch"
									initial={{ opacity: 0, y: -4 }}
									animate={{ opacity: 1, y: 0 }}
									exit={{ opacity: 0, y: -4 }}
									transition={{ type: "spring", bounce: 0, visualDuration: 0.2 }}
									// Anchored absolutely below the composer so the reveal fades
									// in over the layout instead of reflowing/recentering it.
									className="absolute inset-x-0 top-full flex items-center justify-center pt-2"
									style={{ willChange: "opacity, transform" }}
								>
									<button
										type="button"
										// Prevent the textarea from blurring before the click lands,
										// which would unmount this reveal mid-interaction.
										onMouseDown={(event) => event.preventDefault()}
										onClick={onStartFromScratch}
										className="rounded-xs text-xs text-text-subtlest underline-offset-2 transition-colors hover:text-text-subtle hover:underline focus-visible:text-text-subtle focus-visible:underline focus-visible:outline-none"
									>
										Or start from scratch
									</button>
								</motion.div>
							) : null}
						</AnimatePresence>
					) : null}
				</div>
			</div>

			<style>{textareaCSS}</style>
		</div>
	);
}

export function RovoAppComposer(props: Readonly<RovoAppComposerProps>) {
	return (
		<PromptInputProvider>
			<RovoAppComposerInner {...props} />
		</PromptInputProvider>
	);
}
