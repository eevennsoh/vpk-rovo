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
	PromptInputProvider,
	PromptInputSubmit,
	PromptInputTextarea,
	PromptInputTools,
	usePromptInputController,
} from "@/components/ui-ai/prompt-input";
import {
	Queue,
	QueueItem,
	QueueItemActions,
	QueueItemContent,
	QueueItemIndicator,
	QueueList,
} from "@/components/ui-ai/queue";
import { composerPromptInputClassName, composerTextareaClassName, composerUpwardShadow, textareaCSS } from "@/components/blocks/shared-ui/composer-styles";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import type { VoiceButtonState } from "@/components/ui-audio/voice-button";
import { LiveWaveform } from "@/components/ui-audio/live-waveform";
import { resolveFutureChatComposerWaveformState } from "@/components/projects/future-chat/lib/future-chat-composer-waveform-state";
import { resolveFutureChatComposerIdleAction } from "@/components/projects/future-chat/lib/future-chat-composer-idle-action";
import { resolveFutureChatComposerResponseGradientState } from "@/components/projects/future-chat/lib/future-chat-composer-response-gradient-state";
import type { RealtimeGenerationState } from "@/components/projects/future-chat/hooks/use-realtime-voice";
import { cn } from "@/lib/utils";
import { resolveFutureChatComposerPreviewHeight } from "@/components/projects/future-chat/lib/future-chat-composer-preview";
import type { FutureChatPlanExecutionTrackerViewModel } from "@/components/projects/future-chat/lib/future-chat-plan-execution-tracker";
import type { FutureChatQueuedAction } from "@/lib/future-chat-types";
import ArrowUpIcon from "@atlaskit/icon/core/arrow-up";
import CrossIcon from "@atlaskit/icon/core/cross";
import AudioWaveformIcon from "@atlaskit/icon-lab/core/audio-waveform";
import AddIcon from "@atlaskit/icon/core/add";
import ScorecardIcon from "@atlaskit/icon/core/scorecard";
import DeleteIcon from "@atlaskit/icon/core/delete";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { FutureChatComposerAddMenu } from "./future-chat-composer-add-menu";
import { FutureChatPlanExecutionTracker } from "./future-chat-plan-execution-tracker";
import { FutureChatComposerResponseGradient } from "./future-chat-composer-response-gradient";
import { PendingAttachments } from "./pending-attachments";

const FUTURE_CHAT_WAVEFORM_COLORS = ["var(--color-blue-600)", "var(--color-orange-300)", "var(--color-purple-500)", "var(--color-lime-400)"] as const;

const FUTURE_CHAT_WAVEFORM_INTRO_MS = 500;
const EMPTY_REALTIME_OUTPUT_WAVEFORM_BARS: number[] = [];
const EMPTY_QUEUED_PROMPTS: ReadonlyArray<FutureChatQueuedAction> = [];

const supportsFieldSizing =
	typeof window !== "undefined" &&
	typeof window.CSS?.supports === "function" &&
	window.CSS.supports("field-sizing", "content");

interface FutureChatComposerProps {
	artifactTitle?: string | null;
	autoFocus?: boolean;
	backgroundArtifactLabel?: string | null;
	composerStatus: ChatStatus;
	compact?: boolean;
	errorMessage?: string | null;
	isPlanMode?: boolean;
	micStream?: MediaStream | null;
	queuedPrompts?: ReadonlyArray<FutureChatQueuedAction>;
	onStop: () => Promise<void>;
	onDismissPlanExecutionTracker?: () => void;
	onDismissArtifactContext?: () => void;
	onRemoveQueuedPrompt?: (id: string) => void;
	onSubmit: (payload: { text: string; files: FileUIPart[] }) => Promise<void>;
	onTogglePlanMode?: () => void;
	onToggleRealtimeVoice?: () => void;
	onToggleVoice?: () => void;
	galleryExpanded?: boolean;
	placeholder?: string;
	planExecutionTracker?: FutureChatPlanExecutionTrackerViewModel | null;
	prefillText?: string | null;
	previewPrompt?: string | null;
	realtimeGenerationState?: RealtimeGenerationState;
	realtimeOutputWaveformBars?: number[];
	realtimeVoiceActive?: boolean;
	realtimeVoiceState?: "idle" | "connecting" | "listening" | "speaking";
	renderResponseGradient?: (props: {
		active: boolean;
		phase: "warmup" | "speaking";
		signal: number[];
		voiceState: "idle" | "connecting" | "listening" | "speaking";
		generationState: string;
		micStream?: MediaStream | null;
	}) => React.ReactNode;
	showBackgroundStop?: boolean;
	submitDisabled?: boolean;
	voiceState?: VoiceButtonState;
}

function FutureChatComposerInner({
	artifactTitle,
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
	onSubmit,
	onTogglePlanMode,
	onToggleRealtimeVoice,
	placeholder = "Ask, @mention, or / for skills",
	planExecutionTracker = null,
	prefillText,
	previewPrompt = null,
	realtimeGenerationState = "idle",
	realtimeOutputWaveformBars = EMPTY_REALTIME_OUTPUT_WAVEFORM_BARS,
	realtimeVoiceActive = false,
	realtimeVoiceState = "idle",
	renderResponseGradient,
	showBackgroundStop = false,
	submitDisabled = false,
}: Readonly<FutureChatComposerProps>) {
	const controller = usePromptInputController();
	const composerRef = useRef<HTMLDivElement | null>(null);
	const textareaRef = useRef<HTMLTextAreaElement | null>(null);
	const previewMeasureRef = useRef<HTMLTextAreaElement | null>(null);
	const previewPromptRef = useRef<string | null>(previewPrompt);
	const textInputValueRef = useRef(controller.textInput.value);
	const galleryExpandedRef = useRef(galleryExpanded);
	const isPreviewPlaceholderActiveRef = useRef(false);
	const realtimeWaveformIntroTimeoutRef = useRef<number | null>(null);
	const [baseComposerHeight, setBaseComposerHeight] = useState(0);
	const [baseTextareaHeight, setBaseTextareaHeight] = useState(0);
	const [stableBaseHeight, setStableBaseHeight] = useState(0);
	const [previewPromptHeight, setPreviewPromptHeight] = useState(0);
	const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
	const [isRealtimeWaveformIntroActive, setIsRealtimeWaveformIntroActive] = useState(false);
	const isPreviewPlaceholderActive = Boolean(previewPrompt) && controller.textInput.value.trim().length === 0;
	const canSubmit = controller.textInput.value.trim().length > 0 || controller.attachments.files.length > 0;
	const isComposerBusy = composerStatus === "submitted" || composerStatus === "streaming";
	const idleAction = resolveFutureChatComposerIdleAction({
		canStartRealtimeVoice: Boolean(onToggleRealtimeVoice),
		canSubmit,
		isComposerBusy,
		realtimeVoiceActive,
		showBackgroundStop,
		submitDisabled,
	});
	const hasQueuedPrompts = queuedPrompts.length > 0;
	const realtimeWaveformState = resolveFutureChatComposerWaveformState({
		hasMicStream: micStream !== null,
		isIntroActive: isRealtimeWaveformIntroActive,
		realtimeVoiceActive,
	});
	const isRealtimeWaveformProcessing = realtimeWaveformState.processing;
	const realtimeResponseGradientState = resolveFutureChatComposerResponseGradientState({
		realtimeGenerationState,
		realtimeVoiceState,
	});
	const handleTogglePlanMode = useCallback(() => {
		onTogglePlanMode?.();
		requestAnimationFrame(() => {
			textareaRef.current?.focus();
		});
	}, [onTogglePlanMode]);

	const handlePromptSubmit = useCallback(
		(payload: { text: string; files: FileUIPart[] }) => {
			if (submitDisabled) {
				return;
			}

			void onSubmit(payload);
		},
		[onSubmit, submitDisabled],
	);

	useLayoutEffect(() => {
		previewPromptRef.current = previewPrompt;
		textInputValueRef.current = controller.textInput.value;
		galleryExpandedRef.current = galleryExpanded;
		isPreviewPlaceholderActiveRef.current = isPreviewPlaceholderActive;
	}, [controller.textInput.value, galleryExpanded, isPreviewPlaceholderActive, previewPrompt]);

	const clearRealtimeWaveformIntro = useCallback(() => {
		if (realtimeWaveformIntroTimeoutRef.current !== null) {
			window.clearTimeout(realtimeWaveformIntroTimeoutRef.current);
			realtimeWaveformIntroTimeoutRef.current = null;
		}
	}, []);

	const handleToggleRealtimeVoice = useCallback(() => {
		if (!onToggleRealtimeVoice) {
			return;
		}

		clearRealtimeWaveformIntro();

		if (!realtimeVoiceActive) {
			setIsRealtimeWaveformIntroActive(true);
			realtimeWaveformIntroTimeoutRef.current = window.setTimeout(() => {
				realtimeWaveformIntroTimeoutRef.current = null;
				setIsRealtimeWaveformIntroActive(false);
			}, FUTURE_CHAT_WAVEFORM_INTRO_MS);
		} else {
			setIsRealtimeWaveformIntroActive(false);
		}

		onToggleRealtimeVoice();
	}, [clearRealtimeWaveformIntro, onToggleRealtimeVoice, realtimeVoiceActive]);

	useEffect(() => {
		return () => {
			clearRealtimeWaveformIntro();
		};
	}, [clearRealtimeWaveformIntro]);

	useEffect(() => {
		if (!onTogglePlanMode) return;

		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.altKey && e.key === "Tab") {
				e.preventDefault();
				handleTogglePlanMode();
			}
		};

		document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, [handleTogglePlanMode, onTogglePlanMode]);

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
		? resolveFutureChatComposerPreviewHeight({
				baseComposerHeight,
				baseTextareaHeight,
				previewPromptHeight,
			})
		: null;
	const expandedGalleryComposerHeight = galleryExpanded
		? resolveFutureChatComposerPreviewHeight({
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
		<div className="relative isolate">
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
					<FutureChatComposerResponseGradient active={realtimeResponseGradientState.visible} phase={realtimeResponseGradientState.phase ?? "warmup"} signal={realtimeOutputWaveformBars} />
				)}
			</div>
			<div className="flex w-full flex-col">
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
													className="size-7 cursor-pointer rounded-full text-icon-subtle opacity-0 transition-opacity group-hover:opacity-100"
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
							<FutureChatPlanExecutionTracker
								onDismiss={onDismissPlanExecutionTracker}
								tracker={planExecutionTracker}
							/>
						</motion.div>
					) : null}
				</AnimatePresence>

				<div
					ref={composerRef}
					className={cn("relative z-10 rounded-xl border border-border bg-surface px-3 pb-3 pt-3", composerHeight ? "flex flex-col" : undefined, compact ? "pb-2.5 pt-3.5" : undefined)}
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
					{artifactTitle ? (
							<div
								className={cn(
									"-mx-3 mb-3 overflow-hidden rounded-t-[inherit] bg-bg-neutral/70",
									compact ? "-mt-3.5" : "-mt-3",
								)}
							>
								<div className="flex items-center gap-3 px-4 py-2">
								<p className="min-w-0 flex-1 truncate text-sm leading-tight text-text">
									<span className="font-normal text-text-subtle">
										Editing:
									</span>{" "}
									<span className="font-semibold text-text">
										{artifactTitle}
									</span>
								</p>
								{onDismissArtifactContext ? (
									<Button
										aria-label="Close artifact context"
										className="-mr-1 rounded-full"
										onClick={onDismissArtifactContext}
										size="icon-sm"
										type="button"
										variant="ghost"
									>
										<CrossIcon label="" size="small" />
									</Button>
								) : null}
							</div>
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
								placeholder={placeholder}
								rows={1}
								suppressHydrationWarning
							/>
						</PromptInputBody>

						<PromptInputFooter className="mt-3 justify-between px-0 pb-0">
							<PromptInputTools>
								{onTogglePlanMode ? (
								<PromptInputButton
									aria-label="Task mode"
									aria-pressed={isPlanMode}
									variant="outline"
									onClick={handleTogglePlanMode}
									tooltip={{ content: "⌥ Tab", delay: 0 }}
								>
										<ScorecardIcon label="" size="small" />
										<span>Task</span>
									</PromptInputButton>
								) : null}
								<PromptInputActionMenu open={isAddMenuOpen} onOpenChange={setIsAddMenuOpen}>
									<PromptInputActionMenuTrigger aria-label="Add" size="icon-sm" variant="ghost">
										<AddIcon label="" />
									</PromptInputActionMenuTrigger>
									<PromptInputActionMenuContent>
										<FutureChatComposerAddMenu
											onClose={() => setIsAddMenuOpen(false)}
										/>
									</PromptInputActionMenuContent>
								</PromptInputActionMenu>
							</PromptInputTools>

							<div className="flex h-8 min-w-0 flex-1 items-center justify-end gap-1.5">
								<AnimatePresence mode="popLayout" initial={false}>
									{realtimeVoiceActive ? (
										<motion.div
											key="waveform"
											initial={{ opacity: 0, transform: "scale(0.8)" }}
											animate={{ opacity: 1, transform: "scale(1)" }}
											exit={{ opacity: 0, transform: "scale(0.8)" }}
											transition={{ type: "spring", bounce: 0, visualDuration: 0.15 }}
											style={{ willChange: "transform, opacity" }}
										>
											<button
												aria-label="Stop live voice"
												className="flex h-8 w-20 cursor-pointer items-center gap-1.5 overflow-hidden rounded-md border border-border bg-background pl-2 pr-2 text-icon-subtle transition-colors hover:bg-bg-neutral-hovered active:bg-bg-neutral-pressed"
												onClick={handleToggleRealtimeVoice}
												type="button"
											>
												<span className="flex h-full min-w-0 flex-1 items-center">
													<LiveWaveform
														active={realtimeWaveformState.active}
														barColor="currentColor"
														barColors={[...FUTURE_CHAT_WAVEFORM_COLORS]}
														barGap={2}
														barHeightScale={isRealtimeWaveformProcessing ? 1.15 : 1}
														barOpacityMax={1}
														barOpacityMin={1}
														barWidth={2}
														barRadius={0}
														className="min-h-0 min-w-0 flex-1 animate-in fade-in duration-300"
														entranceAnimation="stagger"
														entranceDurationMs={180}
														entranceStaggerMs={14}
														fadeEdges={false}
														height="100%"
														mediaStream={micStream}
														mode="static"
														processing={isRealtimeWaveformProcessing}
													/>
												</span>
												<span aria-hidden="true" className="flex shrink-0 items-center justify-center">
													<CrossIcon label="" size="small" />
												</span>
											</button>
										</motion.div>
									) : idleAction === "submit" ? (
										<motion.div
											key="submit"
											initial={{ opacity: 0, transform: "scale(0.8)" }}
											animate={{ opacity: 1, transform: "scale(1)" }}
											exit={{ opacity: 0, transform: "scale(0.8)" }}
											transition={{ type: "spring", bounce: 0, visualDuration: 0.15 }}
											style={{ willChange: "transform, opacity" }}
										>
											<PromptInputSubmit aria-label="Submit" className="bg-icon text-white hover:bg-icon hover:opacity-90 active:opacity-80 [&_svg]:text-white" disabled={submitDisabled || !canSubmit} onStop={() => void onStop()} shape="circle" size="icon-sm" status={composerStatus}>
												<ArrowUpIcon label="" />
											</PromptInputSubmit>
										</motion.div>
									) : idleAction === "background-stop" ? (
										<motion.div
											key="background-stop"
											initial={{ opacity: 0, transform: "scale(0.8)" }}
											animate={{ opacity: 1, transform: "scale(1)" }}
											exit={{ opacity: 0, transform: "scale(0.8)" }}
											transition={{ type: "spring", bounce: 0, visualDuration: 0.15 }}
											style={{ willChange: "transform, opacity" }}
										>
											<PromptInputSubmit
												aria-label="Stop background work"
												onStop={() => void onStop()}
												shape="circle"
												size="icon-sm"
												status="streaming"
											>
												<ArrowUpIcon label="" />
											</PromptInputSubmit>
										</motion.div>
									) : idleAction === "voice-start" ? (
										<motion.div
											key="voice-start"
											initial={{ opacity: 0, transform: "scale(0.8)" }}
											animate={{ opacity: 1, transform: "scale(1)" }}
											exit={{ opacity: 0, transform: "scale(0.8)" }}
											transition={{ type: "spring", bounce: 0, visualDuration: 0.15 }}
											style={{ willChange: "transform, opacity" }}
										>
											<PromptInputButton
												aria-label="Start live voice"
												className="size-8 bg-icon text-white transition-colors hover:bg-icon hover:opacity-90 active:opacity-80 [&_svg]:text-white"
												onClick={handleToggleRealtimeVoice}
												shape="circle"
												tooltip={{ content: "Live chat", delay: 0 }}
											>
												<AudioWaveformIcon label="" />
											</PromptInputButton>
										</motion.div>
									) : null}
								</AnimatePresence>
								<AnimatePresence initial={false}>
									{isComposerBusy ? (
										<motion.div
											key="stop"
											initial={{ opacity: 0, transform: "scale(0.8)" }}
											animate={{ opacity: 1, transform: "scale(1)" }}
											exit={{ opacity: 0, transform: "scale(0.8)" }}
											transition={{ type: "spring", bounce: 0, visualDuration: 0.15 }}
											style={{ willChange: "transform, opacity" }}
										>
											<PromptInputSubmit aria-label="Stop" onStop={() => void onStop()} shape="circle" size="icon-sm" status={composerStatus}>
												<ArrowUpIcon label="" />
											</PromptInputSubmit>
										</motion.div>
									) : null}
								</AnimatePresence>
							</div>
						</PromptInputFooter>
					</PromptInput>
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

export function FutureChatComposer(props: Readonly<FutureChatComposerProps>) {
	return (
		<PromptInputProvider>
			<FutureChatComposerInner {...props} />
		</PromptInputProvider>
	);
}
