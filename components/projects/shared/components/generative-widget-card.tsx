"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import Image from "next/image";
import type { Spec } from "@json-render/react";
import CrossIcon from "@atlaskit/icon/core/cross";
import WarningIcon from "@atlaskit/icon/core/warning";
import { cn } from "@/lib/utils";
import { MessageResponse } from "@/components/ui-ai/message";
import { Button, buttonVariants } from "@/components/ui/button";
import {
	GenerativeCard,
	GenerativeCardBody,
	GenerativeCardContent,
	GenerativeCardFooter,
	GenerativeCardHeader,
	type DistortionTintMode,
} from "@/components/blocks/generative-card";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	AudioPlayer,
	AudioPlayerControlBar,
	AudioPlayerDurationDisplay,
	AudioPlayerElement,
	AudioPlayerPlayButton,
	AudioPlayerTimeDisplay,
	AudioPlayerTimeRange,
} from "@/components/ui-ai/audio-player";
import {
	Transcription,
	TranscriptionSegment,
} from "@/components/ui-ai/transcription";
import { JsonRenderView } from "@/lib/json-render/renderer";
import { useProgressiveSpec } from "@/lib/json-render/use-progressive-spec";
import {
	type GenerativeWidgetActionItem,
	type GenerativeWidgetPrimaryActionPayload,
	parseGenerativeWidget,
	resolveGenerativeWidgetMetadata,
	createBodyOnlySpec,
	type ParsedGenerativeWidget,
	type GenerativeWidgetMetadata,
} from "@/components/projects/shared/lib/generative-widget";
import { formatContentTypeLabel } from "@/components/projects/shared/lib/generative-widget-branding";
import { ContentTypeTile } from "./content-type-tile";
import { GenuiExportMenu } from "./genui-export-menu";
import { VideoPreviewBody } from "./video-preview-body";

/* -------------------------------------------------------------------------- */
/*  Props                                                                     */
/* -------------------------------------------------------------------------- */

const INNER_GLOW_STYLE_ID = "gen-widget-card-inner-glow-keyframes";
const DEFAULT_INNER_GLOW_DURATION_MS = 4000;
const DEFAULT_INNER_GLOW_SPREAD = 12;
const DEFAULT_INNER_GLOW_THICKNESS = 12;
const DEFAULT_INNER_GLOW_SOFTNESS = 10;
const DEFAULT_INNER_GLOW_SATURATION = 170;
const DEFAULT_INNER_GLOW_INTENSITY = 1;
const SUMMARY_STREAM_INTERVAL_MS = 24;
const SUMMARY_STREAM_STEP_CHARS = 18;

const INNER_GLOW_KEYFRAMES = `
@property --gen-widget-card-inner-angle {
	syntax: '<angle>';
	initial-value: 0deg;
	inherits: false;
}
@keyframes gen-widget-card-inner-angle-spin {
	to { --gen-widget-card-inner-angle: 1turn; }
}
@keyframes gen-widget-card-inner-opacity {
	0%   { opacity: 0; }
	8%   { opacity: var(--gen-widget-card-inner-peak, 1); }
	88%  { opacity: calc(var(--gen-widget-card-inner-peak, 1) * 0.95); }
	100% { opacity: 0; }
}
@media (prefers-reduced-motion: reduce) {
	@keyframes gen-widget-card-inner-angle-spin {
		to { --gen-widget-card-inner-angle: 0deg; }
	}
	@keyframes gen-widget-card-inner-opacity {
		0%   { opacity: calc(var(--gen-widget-card-inner-peak, 1) * 0.44); }
		100% { opacity: calc(var(--gen-widget-card-inner-peak, 1) * 0.44); }
	}
}
`;

export interface GenerativeCardAnimationProps {
	distortion?: boolean;
	animateDuration?: number;
	animateDistortionScale?: number;
	animateBlur?: number;
	animateRadius?: number;
	animateEdgeSafeX?: number;
	animateSpeed?: number;
	animateScaleSmoothing?: number;
	animateSweepSmoothing?: number;
	distortionTintEnabled?: boolean;
	distortionTintMode?: DistortionTintMode;
	distortionTintPreset?: string;
	distortionTintColor?: string;
	distortionTintStrength?: number;
	innerGlow?: boolean;
	innerGlowDuration?: number;
	innerGlowSpread?: number;
	innerGlowThickness?: number;
	innerGlowSoftness?: number;
	innerGlowSaturation?: number;
	innerGlowIntensity?: number;
}

interface GenerativeWidgetCardProps {
	widgetType: string;
	widgetData: unknown;
	className?: string;
	cardAnimation?: GenerativeCardAnimationProps;
	onPrimaryAction?: (
		payload: GenerativeWidgetPrimaryActionPayload
	) => Promise<void> | void;
}

interface GenerativeWidgetCardShellProps {
	bodyWidget: ParsedGenerativeWidget;
	metadata: GenerativeWidgetMetadata;
	className?: string;
	previewMode?: boolean;
	onOpenPreview?: () => void;
	onAction?: (actionLabel: string) => Promise<void> | void;
	actions?: GenerativeWidgetActionItem[];
	onStateChange?: (changes: Array<{ path: string; value: unknown }>) => void;
	cardAnimation?: GenerativeCardAnimationProps;
}

interface GenuiBodyProps {
	spec: Spec;
	summary?: string;
	previewMode: boolean;
	withContainer?: boolean;
	onStateChange?: (changes: Array<{ path: string; value: unknown }>) => void;
	progressive?: boolean;
}
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

function isObjectRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Immutable path update -- shallow-copies only the objects along the mutation
 * path instead of deep-cloning the entire state tree on every change.
 */
function immutableSetByPath(
	state: Record<string, unknown>,
	path: string,
	value: unknown,
): Record<string, unknown> {
	const segments = path.replace(/^\//, "").split("/").filter(Boolean);
	if (segments.length === 0) return state;

	if (segments.length === 1) {
		return { ...state, [segments[0]]: value };
	}

	const [first, ...rest] = segments;
	const child = state[first];
	const childObj = isObjectRecord(child) ? child : {};

	return {
		...state,
		[first]: immutableSetByPath(childObj, "/" + rest.join("/"), value),
	};
}

function toInitialGenuiState(widget: ParsedGenerativeWidget): Record<string, unknown> {
	if (widget.type !== "genui-preview") return {};
	return isObjectRecord(widget.spec.state) ? { ...widget.spec.state } : {};
}

function useInnerGlowStyles(enabled: boolean) {
	useEffect(() => {
		if (!enabled || typeof document === "undefined") return;

		let styleEl = document.getElementById(INNER_GLOW_STYLE_ID) as HTMLStyleElement | null;
		if (!styleEl) {
			styleEl = document.createElement("style");
			styleEl.id = INNER_GLOW_STYLE_ID;
			document.head.appendChild(styleEl);
		}

		if (styleEl.textContent !== INNER_GLOW_KEYFRAMES) {
			styleEl.textContent = INNER_GLOW_KEYFRAMES;
		}
	}, [enabled]);
}

function StreamingSummaryPreview({ summary }: Readonly<{ summary: string }>): ReactNode {
	const [cursor, setCursor] = useState(0);

	useEffect(() => {
		if (!summary) return;

		const intervalId = window.setInterval(() => {
			setCursor((previousCursor) => {
				const nextCursor = Math.min(
					summary.length,
					previousCursor + SUMMARY_STREAM_STEP_CHARS,
				);

				if (nextCursor >= summary.length) {
					window.clearInterval(intervalId);
				}

				return nextCursor;
			});
		}, SUMMARY_STREAM_INTERVAL_MS);

		return () => {
			window.clearInterval(intervalId);
		};
	}, [summary]);

	const streamedSummary = summary.slice(0, cursor);
	const isStreamingSummary = cursor < summary.length;

	return (
		<MessageResponse
			className="[&_p]:m-0 text-sm leading-6 text-text"
			isAnimating={isStreamingSummary}
		>
			{streamedSummary}
		</MessageResponse>
	);
}

interface GenerativeCardInnerGlowShellProps {
	durationMs: number;
	spread: number;
	thickness: number;
	softness: number;
	saturation: number;
	intensity: number;
	className?: string;
	children: ReactNode;
}

function GenerativeCardInnerGlowShell({
	durationMs,
	spread,
	thickness,
	softness,
	saturation,
	intensity,
	className,
	children,
}: Readonly<GenerativeCardInnerGlowShellProps>): ReactNode {
	useInnerGlowStyles(true);

	const rovoConic = "conic-gradient(from var(--gen-widget-card-inner-angle), #1868DB, #AF59E1, #FCA700, #6A9A23, #1868DB)";
	const peakOpacity = Math.max(0, Math.min(1, intensity));
	const ringInset = -(spread + thickness * 0.5);
	const glowAnimation = `gen-widget-card-inner-angle-spin ${durationMs}ms linear forwards, gen-widget-card-inner-opacity ${durationMs}ms var(--ease-out, ease-out) forwards`;
	const glowVariables = {
		"--gen-widget-card-inner-peak": peakOpacity,
	} as CSSProperties;

	return (
		<div className={cn("relative", className)}>
			<div
				aria-hidden="true"
				className="pointer-events-none absolute inset-0 z-20 overflow-hidden rounded-xl"
				style={glowVariables}
			>
				<div
					style={{
						position: "absolute",
						inset: ringInset,
						borderRadius: 12,
						borderWidth: thickness,
						borderStyle: "solid",
						borderColor: "transparent",
						borderImageSource: rovoConic,
						borderImageSlice: 1,
						filter: `blur(${softness}px) saturate(${saturation}%)`,
						opacity: 0,
						animation: glowAnimation,
						willChange: "opacity",
					}}
				/>
			</div>
			<div className="relative z-10">{children}</div>
		</div>
	);
}

/* -------------------------------------------------------------------------- */
/*  Widget body renderers                                                     */
/* -------------------------------------------------------------------------- */

function estimateTranscriptSegments(
	text: string,
	duration: number,
): Array<{ text: string; startSecond: number; endSecond: number }> {
	const words = text.split(/\s+/).filter(Boolean);
	if (words.length === 0 || duration <= 0) return [];

	const totalChars = words.reduce((sum, w) => sum + w.length, 0);
	let cursor = 0;

	return words.map((word) => {
		const fraction = word.length / totalChars;
		const wordDuration = fraction * duration;
		const segment = {
			text: word,
			startSecond: cursor,
			endSecond: cursor + wordDuration,
		};
		cursor += wordDuration;
		return segment;
	});
}

function GenuiBody({
	spec,
	summary,
	previewMode,
	withContainer = true,
	onStateChange,
	progressive = false,
}: Readonly<GenuiBodyProps>): ReactNode {
	const { progressiveSpec, isProgressing } = useProgressiveSpec(spec, progressive);
	const summaryText = summary?.trim() ?? "";
	const shouldStreamSummary = progressive && isProgressing && summaryText.length > 0;

	const content = (
		<JsonRenderView
			spec={progressiveSpec ?? spec}
			skipValidation={isProgressing}
			onStateChange={onStateChange}
		/>
	);

	const summaryNode = shouldStreamSummary ? (
		<StreamingSummaryPreview
			key={`${spec.root}:${summaryText}`}
			summary={summaryText}
		/>
	) : null;

	if (!withContainer) {
		if (shouldStreamSummary) {
			return previewMode ? (
				<div className="max-h-[65vh] overflow-auto">{summaryNode}</div>
			) : (
				summaryNode
			);
		}

		return previewMode ? (
			<div className="max-h-[65vh] overflow-auto">{content}</div>
		) : (
			content
		);
	}

	if (shouldStreamSummary) {
		return (
			<div
				className={cn(
					"rounded-md bg-surface p-3 sm:p-4",
					previewMode && "max-h-[65vh] overflow-auto",
				)}
			>
				{summaryNode}
			</div>
		);
	}

	return (
		<div
			className={cn(
				"rounded-md",
				previewMode && "max-h-[65vh] overflow-auto",
			)}
		>
			{content}
		</div>
	);
}

function AudioBody({
	audioUrl,
	transcript,
	withContainer,
}: Readonly<{
	audioUrl: string;
	transcript?: string;
	withContainer: boolean;
}>): ReactNode {
	const [audioError, setAudioError] = useState(false);
	const audioRef = useRef<HTMLAudioElement>(null);
	const [duration, setDuration] = useState(0);
	const [currentTime, setCurrentTime] = useState(0);

	const segments = useMemo(
		() => (transcript && duration > 0 ? estimateTranscriptSegments(transcript, duration) : []),
		[transcript, duration],
	);

	if (audioError) {
		return (
			<div className={withContainer ? "rounded-md bg-surface" : undefined}>
				<MediaErrorState message="Failed to load audio" />
			</div>
		);
	}

	return (
		<div className={withContainer ? "rounded-md bg-surface" : undefined}>
			<AudioPlayer className="block w-full [&_media-control-bar]:w-full [&_[data-slot=button-group]]:w-full! [&_media-time-range]:flex-1">
				<AudioPlayerElement
					ref={audioRef}
					preload="metadata"
					src={audioUrl}
					onError={() => setAudioError(true)}
					onLoadedMetadata={() => {
						if (audioRef.current) {
							setDuration(audioRef.current.duration);
						}
					}}
					onTimeUpdate={() => {
						if (audioRef.current) {
							setCurrentTime(audioRef.current.currentTime);
						}
					}}
				/>
				<AudioPlayerControlBar>
					<AudioPlayerPlayButton />
					<AudioPlayerTimeDisplay />
					<AudioPlayerTimeRange />
					<AudioPlayerDurationDisplay />
				</AudioPlayerControlBar>
			</AudioPlayer>
			{segments.length > 0 ? (
				<Transcription
					segments={segments}
					currentTime={currentTime}
					onSeek={(time) => {
						if (audioRef.current) {
							audioRef.current.currentTime = time;
						}
					}}
					className={withContainer ? "mt-2" : "mt-3"}
				>
					{(segment, index) => (
						<TranscriptionSegment key={index} segment={segment} index={index} />
					)}
				</Transcription>
			) : transcript ? (
				<p className={cn("text-xs text-text-subtle", withContainer ? "mt-2" : "mt-3")}>
					{transcript}
				</p>
			) : null}
		</div>
	);
}

function MediaErrorState({ message }: Readonly<{ message: string }>): ReactNode {
	return (
		<div className="flex flex-col items-center justify-center gap-2 rounded-md bg-bg-neutral-subtle p-6 text-center">
			<span className="text-icon-danger">
				<WarningIcon label="Error" />
			</span>
			<p className="text-sm text-text-subtle">{message}</p>
		</div>
	);
}

function ImageBody({
	images,
	withContainer,
	onImageClick,
}: Readonly<{
	images: Array<{ url: string; mimeType?: string }>;
	withContainer: boolean;
	onImageClick?: () => void;
}>): ReactNode {
	const [loadStates, setLoadStates] = useState<Record<number, "loading" | "loaded" | "error">>({});

	return (
		<div className="grid place-items-center gap-2 sm:grid-cols-2">
			{images.map((image, index) => {
				const loadState = loadStates[index] ?? "loading";
				const imageEl = (
					<>
						{loadState === "loading" ? (
							<div className="absolute inset-0 flex items-center justify-center bg-bg-neutral-subtle">
								<div className="size-6 animate-spin rounded-full border-2 border-border border-t-transparent" />
							</div>
						) : null}
						{loadState === "error" ? (
							<div className="absolute inset-0">
								<MediaErrorState message="Failed to load image" />
							</div>
						) : null}
						<Image
							src={image.url}
							alt={`Generated image ${index + 1}`}
							width={960}
							height={960}
							unoptimized
							className={cn(
								"size-full object-cover transition-opacity",
								loadState === "loaded" ? "opacity-100" : "opacity-0",
							)}
							onLoad={() => setLoadStates((prev) => ({ ...prev, [index]: "loaded" }))}
							onError={() => setLoadStates((prev) => ({ ...prev, [index]: "error" }))}
						/>
					</>
				);
				const containerClass = cn(
					"relative block overflow-hidden rounded-md aspect-square w-full",
					withContainer && "bg-surface"
				);

				return onImageClick ? (
					<button
						key={`${image.url}-${index}`}
						type="button"
						onClick={onImageClick}
						className={cn(containerClass, "cursor-pointer")}
					>
						{imageEl}
					</button>
				) : (
					<div key={`${image.url}-${index}`} className={containerClass}>
						{imageEl}
					</div>
				);
			})}
		</div>
	);
}

function renderWidgetBody(
	widget: ParsedGenerativeWidget,
	previewMode: boolean,
	withContainer = true,
	onImageClick?: () => void,
	onStateChange?: (changes: Array<{ path: string; value: unknown }>) => void,
	progressive = false,
): ReactNode {
	if (widget.type === "genui-preview") {
		return (
			<GenuiBody
				spec={widget.spec}
				summary={widget.summary}
				previewMode={previewMode}
				withContainer={withContainer}
				onStateChange={onStateChange}
				progressive={progressive}
			/>
		);
	}

	if (widget.type === "audio-preview") {
		return (
			<AudioBody
				audioUrl={widget.audioUrl}
				transcript={widget.transcript}
				withContainer={withContainer}
			/>
		);
	}

	if (widget.type === "image-preview") {
		return (
			<ImageBody
				images={widget.images}
				withContainer={withContainer}
				onImageClick={onImageClick}
			/>
		);
	}

	if (widget.type === "video-preview") {
		return (
			<VideoPreviewBody
				widget={widget}
				withContainer={withContainer}
			/>
		);
	}

	return null;
}

/* -------------------------------------------------------------------------- */
/*  Card shell                                                                */
/* -------------------------------------------------------------------------- */

function GenerativeWidgetCardShell({
	bodyWidget,
	metadata,
	className,
	previewMode = false,
	onOpenPreview,
	onAction,
	actions = [],
	onStateChange,
	cardAnimation,
}: Readonly<GenerativeWidgetCardShellProps>): ReactNode {
	const contentTypeLabel = formatContentTypeLabel(metadata.contentType);
	const shouldAnimateDistortion =
		!previewMode &&
		bodyWidget.type === "genui-preview" &&
		(cardAnimation?.distortion ?? false);
	const shouldRenderInnerGlow = !previewMode && Boolean(cardAnimation?.innerGlow);
	const shouldRenderDistortionTint =
		shouldAnimateDistortion && Boolean(cardAnimation?.distortionTintEnabled);

	const cardNode = (
		<GenerativeCard
			className={shouldRenderInnerGlow ? "w-full" : className}
			animate={shouldAnimateDistortion}
			animateDuration={cardAnimation?.animateDuration}
			animateDistortionScale={cardAnimation?.animateDistortionScale}
			animateBlur={cardAnimation?.animateBlur}
			animateRadius={cardAnimation?.animateRadius}
			animateEdgeSafeX={cardAnimation?.animateEdgeSafeX}
			animateSpeed={cardAnimation?.animateSpeed}
			animateScaleSmoothing={cardAnimation?.animateScaleSmoothing}
			animateSweepSmoothing={cardAnimation?.animateSweepSmoothing}
			animateTintMode={shouldRenderDistortionTint ? cardAnimation?.distortionTintMode : undefined}
			animateTintColor={shouldRenderDistortionTint ? cardAnimation?.distortionTintColor : undefined}
			animateTintStrength={shouldRenderDistortionTint ? (cardAnimation?.distortionTintStrength ?? 0) : 0}
		>
			<GenerativeCardHeader
				className="p-4"
				leading={
					<ContentTypeTile
						contentType={metadata.contentType}
						label={contentTypeLabel}
						title={metadata.title}
						description={metadata.description}
						sourceName={metadata.source?.name}
						sourceLogoSrc={metadata.source?.logoSrc}
						iconHint={metadata.iconHint}
						hintText={metadata.iconHintText}
					/>
				}
				title={metadata.title}
				description={metadata.description}
			/>
			<GenerativeCardBody>
				<GenerativeCardContent className="p-4">
					{renderWidgetBody(
						bodyWidget,
						previewMode,
						true,
						onOpenPreview,
						onStateChange,
						!previewMode && !shouldAnimateDistortion,
					)}
				</GenerativeCardContent>
				<GenerativeCardFooter className="flex-wrap gap-2">
					<Button
						variant="outline"
						className="h-8 min-w-0 flex-shrink-0 px-3 text-sm sm:min-w-[117px]"
						disabled={previewMode}
						onClick={previewMode ? undefined : onOpenPreview}
					>
						Open preview
					</Button>
					{bodyWidget.type === "genui-preview" ? (
						<GenuiExportMenu
							spec={bodyWidget.spec}
							title={metadata.title}
							contentType={metadata.contentType}
						/>
					) : null}
					{actions.map((actionItem, index) => (
						actionItem.href ? (
							<a
								key={`${actionItem.label}:${index}`}
								href={actionItem.href}
								target="_blank"
								rel="noopener noreferrer"
								className={cn(
									buttonVariants({ variant: index === 0 ? "default" : "outline" }),
									"h-8 min-w-0 flex-shrink-0 px-3 text-sm sm:min-w-[117px]"
								)}
							>
								{actionItem.label}
							</a>
						) : (
							<Button
								key={`${actionItem.label}:${index}`}
								variant={index === 0 ? "default" : "outline"}
								className="h-8 min-w-0 flex-shrink-0 px-3 text-sm sm:min-w-[117px]"
								disabled={
									typeof onAction !== "function" ||
									/\b(view|edit|open)\b/i.test(actionItem.label)
								}
								onClick={
									typeof onAction === "function" &&
									!/\b(view|edit|open)\b/i.test(actionItem.label)
										? () => onAction(actionItem.label)
										: undefined
								}
							>
								{actionItem.label}
							</Button>
						)
					))}
				</GenerativeCardFooter>
			</GenerativeCardBody>
		</GenerativeCard>
	);

	if (!shouldRenderInnerGlow) {
		return cardNode;
	}

	return (
		<GenerativeCardInnerGlowShell
			className={className}
			durationMs={cardAnimation?.innerGlowDuration ?? DEFAULT_INNER_GLOW_DURATION_MS}
			spread={cardAnimation?.innerGlowSpread ?? DEFAULT_INNER_GLOW_SPREAD}
			thickness={cardAnimation?.innerGlowThickness ?? DEFAULT_INNER_GLOW_THICKNESS}
			softness={cardAnimation?.innerGlowSoftness ?? DEFAULT_INNER_GLOW_SOFTNESS}
			saturation={cardAnimation?.innerGlowSaturation ?? DEFAULT_INNER_GLOW_SATURATION}
			intensity={cardAnimation?.innerGlowIntensity ?? DEFAULT_INNER_GLOW_INTENSITY}
		>
			{cardNode}
		</GenerativeCardInnerGlowShell>
	);
}

/* -------------------------------------------------------------------------- */
/*  Main card component                                                       */
/* -------------------------------------------------------------------------- */

export function GenerativeWidgetCard({
	widgetType,
	widgetData,
	className,
	cardAnimation,
	onPrimaryAction,
}: Readonly<GenerativeWidgetCardProps>): ReactNode {
	const [previewOpen, setPreviewOpen] = useState(false);
	const parsedWidget = useMemo(
		() => parseGenerativeWidget(widgetType, widgetData),
		[widgetData, widgetType]
	);
	const metadata = useMemo(
		() => (parsedWidget ? resolveGenerativeWidgetMetadata(parsedWidget) : null),
		[parsedWidget]
	);
	const contentTypeLabel = metadata ? formatContentTypeLabel(metadata.contentType) : "";
	const [genuiState, setGenuiState] = useState<Record<string, unknown>>(
		() => (parsedWidget ? toInitialGenuiState(parsedWidget) : {})
	);
	const bodyWidget = useMemo(() => {
		if (!parsedWidget || parsedWidget.type !== "genui-preview") return parsedWidget;
		return { ...parsedWidget, spec: createBodyOnlySpec(parsedWidget) };
	}, [parsedWidget]);

	const handleGenuiStateChange = useCallback(
		(changes: Array<{ path: string; value: unknown }>) => {
			setGenuiState((previousState) => {
				let state = previousState;
				for (const { path, value } of changes) {
					if (typeof path !== "string" || !path.startsWith("/")) continue;
					state = immutableSetByPath(state, path, value);
				}
				return state;
			});
		},
		[]
	);

	const footerActions =
		parsedWidget?.type === "genui-preview"
			? (metadata?.actions ?? [])
			: [];
	const shouldShowFooterActions =
		parsedWidget?.type === "genui-preview" &&
		footerActions.length > 0;

	const handleAction = useCallback((actionLabel: string) => {
		if (
			parsedWidget?.type !== "genui-preview" ||
			!actionLabel ||
			!metadata ||
			!metadata.title ||
			!metadata.description ||
			typeof onPrimaryAction !== "function"
		) {
			return;
		}

		void onPrimaryAction({
			widgetType: "genui-preview",
			actionLabel,
			title: metadata.title,
			description: metadata.description,
			formState: genuiState,
		});
	}, [parsedWidget, metadata, onPrimaryAction, genuiState]);

	if (!parsedWidget || !metadata) return null;

	return (
		<div className={cn("pb-2", className)}>
			<Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
					<GenerativeWidgetCardShell
						bodyWidget={bodyWidget ?? parsedWidget}
						metadata={metadata}
						cardAnimation={cardAnimation}
						onOpenPreview={() => setPreviewOpen(true)}
						onAction={handleAction}
						actions={shouldShowFooterActions ? footerActions : []}
						onStateChange={handleGenuiStateChange}
				/>
				<DialogContent className="max-h-[90vh] overflow-hidden gap-0 p-0 sm:max-w-5xl" size="xl" showCloseButton={false}>
					<DialogHeader className="mx-0 mt-0 flex-row items-center border-b p-4 sm:p-6">
						<div className="flex min-w-0 flex-1 items-center gap-3">
								<ContentTypeTile
									contentType={metadata.contentType}
									label={contentTypeLabel}
									title={metadata.title}
									description={metadata.description}
									sourceName={metadata.source?.name}
									sourceLogoSrc={metadata.source?.logoSrc}
									iconHint={metadata.iconHint}
									hintText={metadata.iconHintText}
								/>
							<div className="min-w-0 flex-1 space-y-1">
								<DialogTitle className="truncate">
									{metadata.title}
								</DialogTitle>
								<DialogDescription className="line-clamp-2">
									{metadata.description}
								</DialogDescription>
							</div>
						</div>
						<DialogClose render={<Button variant="ghost" size="icon-sm" />}>
							<CrossIcon label="Close" />
						</DialogClose>
					</DialogHeader>
					<div className="max-h-[65vh] overflow-y-auto p-4 sm:p-6">
						{bodyWidget ? renderWidgetBody(
							bodyWidget,
							false,
							false,
							undefined,
							handleGenuiStateChange
						) : null}
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}
