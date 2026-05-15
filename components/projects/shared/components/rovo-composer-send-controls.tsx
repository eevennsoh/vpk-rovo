"use client";

import { cloneElement, useCallback, useEffect, useRef, useState, type HTMLAttributes, type ReactElement } from "react";
import type { ChatStatus } from "ai";
import { AnimatePresence, motion } from "motion/react";
import CustomizeMenu from "@/components/blocks/shared-ui/customize-menu";
import { REASONING_OPTIONS } from "@/components/blocks/shared-ui/data/customize-menu-data";
import {
	PromptInputAutoButton,
	PromptInputButton,
	PromptInputSubmit,
} from "@/components/ui-ai/prompt-input";
import { Popover, PopoverContent, PopoverTitle, PopoverTrigger } from "@/components/ui/popover";
import { LiveWaveform } from "@/components/ui-audio/live-waveform";
import { resolveRovoAppComposerIdleAction } from "@/components/projects/rovo/lib/rovo-app-composer-idle-action";
import { resolveRovoAppComposerWaveformState } from "@/components/projects/rovo/lib/rovo-app-composer-waveform-state";
import { ROVO_WAVEFORM_COLOR_CSS_VARS } from "@/lib/rovo-colors";
import { cn } from "@/lib/utils";
import ArrowUpIcon from "@atlaskit/icon/core/arrow-up";
import CrossIcon from "@atlaskit/icon/core/cross";
import AudioWaveformIcon from "@atlaskit/icon-lab/core/audio-waveform";

const ROVO_COMPOSER_WAVEFORM_INTRO_MS = 500;

const autoReasoningButtonClassName = [
	"whitespace-nowrap",
	"[&[aria-expanded=true]]:border-transparent",
	"[&[aria-expanded=true]]:bg-transparent",
	"[&[aria-expanded=true]]:text-text-subtle",
	"[&[aria-expanded=true]_svg]:text-icon-subtle",
].join(" ");

function getReasoningButtonLabel(option: (typeof REASONING_OPTIONS)[number]): string {
	return option.id === "let-rovo-decide" ? "Auto" : option.label;
}

export interface RovoComposerReasoningSelectorProps {
	companyKnowledgeEnabled: boolean;
	onCompanyKnowledgeChange: (enabled: boolean) => void;
	onReasoningChange: (reasoning: string) => void;
	onOpenChange?: (open: boolean) => void;
	open?: boolean;
	selectedReasoning: string;
	webResultsEnabled: boolean;
	onWebResultsChange: (enabled: boolean) => void;
}

export function RovoComposerReasoningSelector({
	companyKnowledgeEnabled,
	onCompanyKnowledgeChange,
	onReasoningChange,
	onOpenChange,
	open,
	selectedReasoning,
	webResultsEnabled,
	onWebResultsChange,
}: Readonly<RovoComposerReasoningSelectorProps>): ReactElement {
	const selectedReasoningOption = REASONING_OPTIONS.find((option) => option.id === selectedReasoning) ?? REASONING_OPTIONS[0];
	const selectedReasoningButtonLabel = getReasoningButtonLabel(selectedReasoningOption);

	return (
		<Popover open={open} onOpenChange={onOpenChange}>
			<PopoverTrigger
				render={(
					<PromptInputAutoButton
						aria-label={`Reasoning: ${selectedReasoningOption.label}`}
						className={autoReasoningButtonClassName}
					>
						{cloneElement(selectedReasoningOption.icon, { label: "" })}
						<span>{selectedReasoningButtonLabel}</span>
					</PromptInputAutoButton>
				)}
			/>
			<PopoverContent side="top" align="end" sideOffset={8} positionerClassName="z-[600]" className="w-auto p-2">
				<PopoverTitle className="sr-only">Choose reasoning</PopoverTitle>
				<CustomizeMenu
					selectedReasoning={selectedReasoning}
					onReasoningChange={onReasoningChange}
					showSources={false}
					webResultsEnabled={webResultsEnabled}
					onWebResultsChange={onWebResultsChange}
					companyKnowledgeEnabled={companyKnowledgeEnabled}
					onCompanyKnowledgeChange={onCompanyKnowledgeChange}
					onClose={() => onOpenChange?.(false)}
				/>
			</PopoverContent>
		</Popover>
	);
}

export interface RovoComposerActionButtonProps {
	canSubmit: boolean;
	composerStatus: ChatStatus;
	isComposerBusy?: boolean;
	micStream?: MediaStream | null;
	onStop: () => Promise<void> | void;
	onToggleRealtimeVoice?: () => void;
	realtimeVoiceActive?: boolean;
	showBackgroundStop?: boolean;
	submitDisabled?: boolean;
}

export function RovoComposerActionButton({
	canSubmit,
	composerStatus,
	isComposerBusy,
	micStream = null,
	onStop,
	onToggleRealtimeVoice,
	realtimeVoiceActive = false,
	showBackgroundStop = false,
	submitDisabled = false,
}: Readonly<RovoComposerActionButtonProps>): ReactElement {
	const realtimeWaveformIntroTimeoutRef = useRef<number | null>(null);
	const [isRealtimeWaveformIntroActive, setIsRealtimeWaveformIntroActive] = useState(false);
	const resolvedComposerBusy = isComposerBusy ?? (composerStatus === "submitted" || composerStatus === "streaming");
	const idleAction = resolveRovoAppComposerIdleAction({
		canStartRealtimeVoice: Boolean(onToggleRealtimeVoice),
		canSubmit,
		isComposerBusy: resolvedComposerBusy,
		realtimeVoiceActive,
		showBackgroundStop,
		submitDisabled,
	});
	const realtimeWaveformState = resolveRovoAppComposerWaveformState({
		hasMicStream: micStream !== null,
		isIntroActive: isRealtimeWaveformIntroActive,
		realtimeVoiceActive,
	});
	const isRealtimeWaveformProcessing = realtimeWaveformState.processing;

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
			}, ROVO_COMPOSER_WAVEFORM_INTRO_MS);
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

	return (
		<>
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
							className="flex h-8 w-20 items-center gap-1.5 overflow-hidden rounded-md border border-border bg-background pl-2 pr-2 text-icon-subtle transition-colors hover:bg-bg-neutral-hovered active:bg-bg-neutral-pressed"
							onClick={handleToggleRealtimeVoice}
							type="button"
						>
							<span className="flex h-full min-w-0 flex-1 items-center">
								<LiveWaveform
									active={realtimeWaveformState.active}
									barColor="currentColor"
									barColors={[...ROVO_WAVEFORM_COLOR_CSS_VARS]}
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
						<PromptInputSubmit aria-label="Submit" className="hover:opacity-90 active:opacity-80" disabled={submitDisabled || !canSubmit} onStop={() => void onStop()} size="icon-sm" status={composerStatus}>
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
							variant="default"
							aria-label="Start live voice"
							className="size-8 hover:opacity-90 active:opacity-80"
							onClick={handleToggleRealtimeVoice}
							tooltip={{ content: "Live chat", delay: 0 }}
						>
							<AudioWaveformIcon label="" />
						</PromptInputButton>
					</motion.div>
				) : null}
			</AnimatePresence>
			<AnimatePresence initial={false}>
				{resolvedComposerBusy ? (
					<motion.div
						key="stop"
						initial={{ opacity: 0, transform: "scale(0.8)" }}
						animate={{ opacity: 1, transform: "scale(1)" }}
						exit={{ opacity: 0, transform: "scale(0.8)" }}
						transition={{ type: "spring", bounce: 0, visualDuration: 0.15 }}
						style={{ willChange: "transform, opacity" }}
					>
						<PromptInputSubmit aria-label="Stop" onStop={() => void onStop()} size="icon-sm" status={composerStatus}>
							<ArrowUpIcon label="" />
						</PromptInputSubmit>
					</motion.div>
				) : null}
			</AnimatePresence>
		</>
	);
}

export type RovoComposerSendControlsProps = HTMLAttributes<HTMLDivElement> &
	RovoComposerReasoningSelectorProps &
	RovoComposerActionButtonProps;

export function RovoComposerSendControls({
	canSubmit,
	className,
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
	realtimeVoiceActive,
	selectedReasoning,
	showBackgroundStop,
	submitDisabled,
	webResultsEnabled,
	onWebResultsChange,
	...props
}: Readonly<RovoComposerSendControlsProps>): ReactElement {
	return (
		<div className={cn("flex h-8 min-w-0 shrink-0 items-center justify-end gap-1.5", className)} {...props}>
			<RovoComposerReasoningSelector
				companyKnowledgeEnabled={companyKnowledgeEnabled}
				onCompanyKnowledgeChange={onCompanyKnowledgeChange}
				onReasoningChange={onReasoningChange}
				onOpenChange={onOpenChange}
				open={open}
				selectedReasoning={selectedReasoning}
				webResultsEnabled={webResultsEnabled}
				onWebResultsChange={onWebResultsChange}
			/>
			<RovoComposerActionButton
				canSubmit={canSubmit}
				composerStatus={composerStatus}
				isComposerBusy={isComposerBusy}
				micStream={micStream}
				onStop={onStop}
				onToggleRealtimeVoice={onToggleRealtimeVoice}
				realtimeVoiceActive={realtimeVoiceActive}
				showBackgroundStop={showBackgroundStop}
				submitDisabled={submitDisabled}
			/>
		</div>
	);
}
