"use client";

import type { ChatStatus, FileUIPart } from "ai";
import {
	PromptInput,
	PromptInputActionMenu,
	PromptInputActionMenuContent,
	PromptInputActionMenuTrigger,
	PromptInputBody,
	PromptInputButton,
	PromptInputFooter,
	PromptInputPreferencesButton,
	PromptInputProvider,
	PromptInputTextarea,
	PromptInputTools,
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
import { composerPromptInputClassName, composerTextareaClassName, composerUpwardShadow, textareaCSS } from "@/components/blocks/shared-ui/composer-styles";
import CustomizeMenu from "@/components/blocks/shared-ui/customize-menu";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTitle, PopoverTrigger } from "@/components/ui/popover";
import { SkillTag, SkillTagGroup } from "@/components/ui-custom/skill-tag";
import type { VoiceButtonState } from "@/components/ui-audio/voice-button";
import ChatContextBar from "@/components/projects/sidebar-chat/components/chat-context-bar";
import { resolveRovoAppComposerResponseGradientState } from "@/components/projects/rovo/lib/rovo-app-composer-response-gradient-state";
import type { RealtimeGenerationState } from "@/components/projects/rovo/hooks/use-realtime-voice";
import { cn } from "@/lib/utils";
import { resolveRovoAppComposerPreviewHeight } from "@/components/projects/rovo/lib/rovo-app-composer-preview";
import type { RovoAppPlanExecutionTrackerViewModel } from "@/components/projects/rovo/lib/rovo-app-plan-execution-tracker";
import type { RovoAppQueuedAction } from "@/lib/rovo-app-types";
import AddIcon from "@atlaskit/icon/core/add";
import DeleteIcon from "@atlaskit/icon/core/delete";
import SkillIcon from "@atlaskit/icon-lab/core/skill";
import CursorIcon from "@atlaskit/icon-lab/core/cursor";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { RovoAppComposerAddMenu } from "./rovo-app-composer-add-menu";
import { RovoAppPlanExecutionTracker } from "./rovo-app-plan-execution-tracker";
import { RovoAppComposerResponseGradient } from "./rovo-app-composer-response-gradient";
import { PendingAttachments } from "./pending-attachments";
import { RovoComposerSendControls } from "@/components/projects/shared/components/rovo-composer-send-controls";
import { DEFAULT_REASONING_OPTION_ID } from "@/components/blocks/shared-ui/data/customize-menu-data";

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
	onSelectHermesSkill?: (skillId: string) => void;
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
	compact = false,
	errorMessage,
	galleryExpanded = false,
	isPlanMode = false,
	micStream,
	onDismissPlanExecutionTracker,
	onDismissArtifactContext,
	queuedPrompts = EMPTY_QUEUED_PROMPTS,
	onStop,
	onRemoveQueuedPrompt,
	onSelectHermesSkill,
	onSubmit,
	onToggleClicky,
	onTogglePlanMode,
	onToggleRealtimeVoice,
	placeholder = "Describe what it should do",
	planExecutionTracker = null,
	prefillText,
	previewPrompt = null,
	realtimeGenerationState = "idle",
	realtimeOutputWaveformBars = EMPTY_REALTIME_OUTPUT_WAVEFORM_BARS,
	realtimeVoiceActive = false,
	realtimeVoiceState = "idle",
	clickyActive = false,
	renderResponseGradient,
	showBackgroundStop = false,
	selectedHermesSkills = [],
	onRemoveHermesSkill,
	submitDisabled = false,
}: Readonly<RovoAppComposerProps>) {
	const controller = usePromptInputController();
	const composerRef = useRef<HTMLDivElement | null>(null);
	const textareaRef = useRef<HTMLTextAreaElement | null>(null);
	const previewMeasureRef = useRef<HTMLTextAreaElement | null>(null);
	const previewPromptRef = useRef<string | null>(previewPrompt);
	const textInputValueRef = useRef(controller.textInput.value);
	const galleryExpandedRef = useRef(galleryExpanded);
	const isPreviewPlaceholderActiveRef = useRef(false);
	const [baseComposerHeight, setBaseComposerHeight] = useState(0);
	const [baseTextareaHeight, setBaseTextareaHeight] = useState(0);
	const [stableBaseHeight, setStableBaseHeight] = useState(0);
	const [previewPromptHeight, setPreviewPromptHeight] = useState(0);
	const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
	const [isCustomizeMenuOpen, setIsCustomizeMenuOpen] = useState(false);
	const [isAutoMenuOpen, setIsAutoMenuOpen] = useState(false);
	const [selectedReasoning, setSelectedReasoning] = useState(DEFAULT_REASONING_OPTION_ID);
	const [webResultsEnabled, setWebResultsEnabled] = useState(false);
	const [companyKnowledgeEnabled, setCompanyKnowledgeEnabled] = useState(true);
	const [highlightedIndex, setHighlightedIndex] = useState(0);
	const slashMenuRef = useRef<HTMLDivElement | null>(null);
	const isPreviewPlaceholderActive = Boolean(previewPrompt) && controller.textInput.value.trim().length === 0;
	const canSubmit = controller.textInput.value.trim().length > 0 || controller.attachments.files.length > 0;
	const isComposerBusy = composerStatus === "submitted" || composerStatus === "streaming";
	const hasQueuedPrompts = queuedPrompts.length > 0;
	const realtimeResponseGradientState = resolveRovoAppComposerResponseGradientState({
		realtimeGenerationState,
		realtimeVoiceState,
	});
	const handleReasoningChange = useCallback((reasoning: string) => {
		setSelectedReasoning(reasoning);
		const shouldEnablePlanMode = reasoning === "max";

		if (onTogglePlanMode && shouldEnablePlanMode !== isPlanMode) {
			onTogglePlanMode();
		}

		requestAnimationFrame(() => {
			textareaRef.current?.focus();
		});
	}, [isPlanMode, onTogglePlanMode]);
	const handleCustomizeMenuOpenChange = useCallback((open: boolean) => {
		setIsCustomizeMenuOpen(open);
		if (open) {
			setIsAutoMenuOpen(false);
		}
	}, []);
	const handleAutoMenuOpenChange = useCallback((open: boolean) => {
		setIsAutoMenuOpen(open);
		if (open) {
			setIsCustomizeMenuOpen(false);
		}
	}, []);

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

	useLayoutEffect(() => {
		previewPromptRef.current = previewPrompt;
		textInputValueRef.current = controller.textInput.value;
		galleryExpandedRef.current = galleryExpanded;
		isPreviewPlaceholderActiveRef.current = isPreviewPlaceholderActive;
	}, [controller.textInput.value, galleryExpanded, isPreviewPlaceholderActive, previewPrompt]);

	useEffect(() => {
		if (!isSlashMenuOpen) return;
		const container = slashMenuRef.current;
		if (!container) return;
		const items = container.querySelectorAll<HTMLButtonElement>("[data-slash-item]");
		items[highlightedIndex]?.scrollIntoView({ block: "nearest" });
	}, [highlightedIndex, isSlashMenuOpen]);

	useEffect(() => {
		if (isPlanMode) {
			setSelectedReasoning("max");
			return;
		}

		setSelectedReasoning((currentReasoning) => currentReasoning === "max" ? DEFAULT_REASONING_OPTION_ID : currentReasoning);
	}, [isPlanMode]);

	const measurePreviewPromptHeight = useCallback((nextPreviewPrompt: string | null) => {
		const textareaElement = textareaRef.current;
		const previewMeasureElement = previewMeasureRef.current;
		if (!nextPreviewPrompt || !textareaElement || !previewMeasureElement || textInputValueRef.current.trim().length > 0) {
			setPreviewPromptHeight(0);
			return;
		}

		const computedStyle = window.getComputedStyle(textareaElement);
		previewMeasureElement.style.width = `${textareaElement.clientWidth}px`;
		previewMeasureElement.style.font = computedStyle.font;
		previewMeasureElement.style.fontSize = computedStyle.fontSize;
		previewMeasureElement.style.fontWeight = computedStyle.fontWeight;
		previewMeasureElement.style.letterSpacing = computedStyle.letterSpacing;
		previewMeasureElement.style.lineHeight = computedStyle.lineHeight;
		previewMeasureElement.style.padding = "0";
		previewMeasureElement.style.border = "0";
		previewMeasureElement.value = nextPreviewPrompt;
		setPreviewPromptHeight(previewMeasureElement.scrollHeight);
	}, []);

	const captureBaseMeasurements = useCallback(() => {
		const composerElement = composerRef.current;
		const textareaElement = textareaRef.current;
		if (!composerElement || !textareaElement) {
			return;
		}

		const height = composerElement.getBoundingClientRect().height;
		setBaseComposerHeight(height);
		setBaseTextareaHeight(textareaElement.getBoundingClientRect().height);

		// Capture stable base height once for smooth transition fallback.
		// Subsequent calls may read mid-transition values, so only the first
		// measurement (when the composer is at its natural height) is trusted.
		setStableBaseHeight((prev) => (prev === 0 && height > 0 ? height : prev));
	}, []);

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

	useEffect(() => {
		if (!isPreviewPlaceholderActive) {
			return;
		}

		const animationFrameId = window.requestAnimationFrame(() => {
			measurePreviewPromptHeight(previewPrompt);
		});

		return () => {
			window.cancelAnimationFrame(animationFrameId);
		};
	}, [isPreviewPlaceholderActive, measurePreviewPromptHeight, previewPrompt]);

	useEffect(() => {
		if (controller.textInput.value.trim().length > 0 || previewPrompt || galleryExpanded) {
			return;
		}

		captureBaseMeasurements();
	}, [captureBaseMeasurements, controller.textInput.value, galleryExpanded, previewPrompt]);

	useEffect(() => {
		const composerElement = composerRef.current;
		const textareaElement = textareaRef.current;
		if (!composerElement || !textareaElement) {
			return;
		}

		const resizeObserver = new ResizeObserver(() => {
			if (isPreviewPlaceholderActiveRef.current) {
				measurePreviewPromptHeight(previewPromptRef.current);
				return;
			}
			if (galleryExpandedRef.current || textInputValueRef.current.trim().length > 0) {
				return;
			}

			captureBaseMeasurements();
		});

		resizeObserver.observe(composerElement);
		resizeObserver.observe(textareaElement);

		return () => {
			resizeObserver.disconnect();
		};
	}, [captureBaseMeasurements, measurePreviewPromptHeight]);

	const previewComposerHeight = isPreviewPlaceholderActive
		? resolveRovoAppComposerPreviewHeight({
				baseComposerHeight,
				baseTextareaHeight,
				previewPromptHeight,
			})
		: null;
	const expandedGalleryComposerHeight = galleryExpanded
		? resolveRovoAppComposerPreviewHeight({
				baseComposerHeight,
				baseTextareaHeight,
				previewPromptHeight: baseTextareaHeight * 2,
			})
		: null;
	const composerHeight = (() => {
		// When user has typed text or attachments are present, release the fixed height so the composer auto-sizes
		if (controller.textInput.value.trim().length > 0) return null;
		if (controller.attachments.files.length > 0) return null;

		// When artifact context is shown, the stable base height (captured without
		// the artifact pill) is stale. Let the composer auto-size instead — the
		// gallery that needs the stable height isn't visible with artifacts open.
		if (artifactTitle) return null;

		const combined = previewComposerHeight && expandedGalleryComposerHeight ? Math.max(previewComposerHeight, expandedGalleryComposerHeight) : (previewComposerHeight ?? expandedGalleryComposerHeight);

		if (combined) return combined;

		// Keep a stable base height so the CSS transition animates smoothly
		// when hovering across gallery pills (prevents snap on gap-crossing).
		// Uses the once-captured stableBaseHeight to avoid feedback loops
		// from the ResizeObserver reading mid-transition values.
		return stableBaseHeight > 0 ? stableBaseHeight : null;
	})();

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
													aria-label="Remove queued message"
													onClick={() => onRemoveQueuedPrompt?.(queuedPrompt.id)}
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

				<div
					ref={composerRef}
					className={cn("relative z-10 rounded-xl border border-border bg-surface px-4 pb-3 pt-3", composerHeight ? "flex flex-col" : undefined, compact ? "pb-2.5 pt-3.5" : undefined)}
					style={{
						boxShadow: composerUpwardShadow,
						...(composerHeight
							? {
									height: `${composerHeight}px`,
									transition: "height var(--duration-normal) var(--ease-out)",
								}
							: {}),
					}}
				>
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

					<PromptInput
						allowOverflow
						className={cn(composerPromptInputClassName, "relative z-10", composerHeight ? "flex h-full flex-col [&>[data-slot=input-group]]:h-full" : undefined)}
						onSubmit={handlePromptSubmit}
					>
						<PendingAttachments />

						<PromptInputBody className={composerHeight ? "flex-1" : undefined}>
							<PromptInputTextarea
								ref={textareaRef}
								autoFocus={autoFocus}
								autoResize={!composerHeight}
								className={cn(composerTextareaClassName, composerHeight ? "h-full max-h-none min-h-0" : undefined, isPreviewPlaceholderActive ? "chat-composer-textarea-preview-active" : undefined)}
								onInput={() => setHighlightedIndex(0)}
								onKeyDown={handleTextareaKeyDown}
								placeholder={placeholder}
								rows={1}
								suppressHydrationWarning
							/>
						</PromptInputBody>

						<PromptInputFooter className="mt-3 justify-between px-0 pb-0">
							<PromptInputTools>
								<PromptInputActionMenu open={isAddMenuOpen} onOpenChange={setIsAddMenuOpen}>
									<PromptInputActionMenuTrigger aria-label="Add" size="icon-sm" variant="ghost">
										<AddIcon label="" />
									</PromptInputActionMenuTrigger>
									<PromptInputActionMenuContent>
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

							<RovoComposerSendControls
								canSubmit={canSubmit}
								className="flex-1"
								companyKnowledgeEnabled={companyKnowledgeEnabled}
								composerStatus={composerStatus}
								isComposerBusy={isComposerBusy}
								micStream={micStream}
								onCompanyKnowledgeChange={setCompanyKnowledgeEnabled}
								onOpenChange={handleAutoMenuOpenChange}
								onReasoningChange={handleReasoningChange}
								onStop={onStop}
								onToggleRealtimeVoice={onToggleRealtimeVoice}
								open={isAutoMenuOpen}
								realtimeVoiceActive={realtimeVoiceActive}
								selectedReasoning={selectedReasoning}
								showBackgroundStop={showBackgroundStop}
								submitDisabled={submitDisabled}
								webResultsEnabled={webResultsEnabled}
								onWebResultsChange={setWebResultsEnabled}
							/>
						</PromptInputFooter>
					</PromptInput>

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
				</div>
			</div>

			<style>{textareaCSS}</style>
			<style>{`
				.chat-composer-textarea.chat-composer-textarea-preview-active:placeholder-shown {
					field-sizing: content;
					white-space: pre-wrap;
					text-overflow: clip;
				}
				.chat-composer-textarea.chat-composer-textarea-preview-active::placeholder {
					white-space: pre-wrap;
					overflow: visible;
					text-overflow: clip;
				}
			`}</style>
			<textarea
				ref={previewMeasureRef}
				aria-hidden
				readOnly
				tabIndex={-1}
				className="pointer-events-none absolute -z-10 m-0 h-0 w-0 overflow-hidden opacity-0"
				style={{
					whiteSpace: "pre-wrap",
					overflowWrap: "break-word",
					wordBreak: "break-word",
				}}
			/>
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
