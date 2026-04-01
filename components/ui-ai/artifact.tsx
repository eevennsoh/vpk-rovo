"use client";

import type { LucideIcon } from "lucide-react";
import type { ComponentProps, HTMLAttributes, ReactNode } from "react";

import { useEffect, useRef, useState, type RefObject } from "react";

import {
	GenerativeCard,
	GenerativeCardBody,
	GenerativeCardContent,
	GenerativeCardFooter,
	GenerativeCardHeader,
} from "@/components/blocks/generative-card";
import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Tile } from "@/components/ui/tile";
import { Textarea } from "@/components/ui/textarea";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { CodeBlock } from "@/components/ui-ai/code-block";
import type {
	ArtifactAnnotation,
	ArtifactAnnotationPosition,
	PendingArtifactSelection,
} from "@/components/ui-ai/lib/artifact-annotations";
import {
	formatArtifactVersionLabel,
	formatArtifactVersionSummaryLabel,
	getArtifactVersionNumber,
	getArtifactVersionTitle,
	type ArtifactDocument,
} from "@/components/ui-ai/lib/artifact-versions";
import { MessageResponse } from "@/components/ui-ai/message";
import { cn } from "@/lib/utils";
import {
	CodeIcon,
	CopyIcon,
	FileTextIcon,
	GlobeIcon,
	ImageIcon,
	LoaderCircleIcon,
	MessageSquarePlusIcon,
	PencilLineIcon,
	SaveIcon,
	SheetIcon,
	Trash2Icon,
	XIcon,
} from "lucide-react";
import Image from "next/image";

export type ArtifactProps = HTMLAttributes<HTMLDivElement>;

export const Artifact = ({ className, ...props }: ArtifactProps) => (
  <div
    className={cn(
      "flex flex-col overflow-hidden rounded-lg border bg-background shadow-sm",
      className
    )}
    {...props}
  />
);

export type ArtifactHeaderProps = HTMLAttributes<HTMLDivElement>;

export const ArtifactHeader = ({
  className,
  ...props
}: ArtifactHeaderProps) => (
  <div
    className={cn(
      "flex items-center justify-between border-b bg-muted/50 px-4 py-3",
      className
    )}
    {...props}
  />
);

export type ArtifactCloseProps = ComponentProps<typeof Button>;

export const ArtifactClose = ({
  className,
  children,
  size = "sm",
  variant = "ghost",
  ...props
}: ArtifactCloseProps) => (
  <Button
    className={cn(
      "size-8 p-0 text-muted-foreground hover:text-foreground",
      className
    )}
    size={size}
    type="button"
    variant={variant}
    {...props}
  >
    {children ?? <XIcon className="size-4" />}
    <span className="sr-only">Close</span>
  </Button>
);

export type ArtifactTitleProps = HTMLAttributes<HTMLParagraphElement>;

export const ArtifactTitle = ({ className, ...props }: ArtifactTitleProps) => (
  <p
    className={cn("font-medium text-foreground text-sm", className)}
    {...props}
  />
);

export type ArtifactDescriptionProps = HTMLAttributes<HTMLParagraphElement>;

export const ArtifactDescription = ({
  className,
  ...props
}: ArtifactDescriptionProps) => (
  <p className={cn("text-muted-foreground text-sm", className)} {...props} />
);

export type ArtifactActionsProps = HTMLAttributes<HTMLDivElement>;

export const ArtifactActions = ({
  className,
  ...props
}: ArtifactActionsProps) => (
  <div className={cn("flex items-center gap-1", className)} {...props} />
);

export type ArtifactActionProps = ComponentProps<typeof Button> & {
  tooltip?: string;
  label?: string;
  icon?: LucideIcon;
};

export const ArtifactAction = ({
  tooltip,
  label,
  icon: Icon,
  children,
  className,
  size = "sm",
  variant = "ghost",
  ...props
}: ArtifactActionProps) => {
  const button = (
    <Button
      className={cn(
        "size-8 p-0 text-muted-foreground hover:text-foreground",
        className
      )}
      size={size}
      type="button"
      variant={variant}
      {...props}
    >
      {Icon ? <Icon className="size-4" /> : children}
      <span className="sr-only">{label || tooltip}</span>
    </Button>
  );

  if (tooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger render={button} />
          <TooltipContent>
            <p>{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return button;
};

export type ArtifactContentProps = HTMLAttributes<HTMLDivElement>;

export const ArtifactContent = ({
	className,
	...props
}: ArtifactContentProps) => (
	<div className={cn("flex-1 overflow-auto p-4", className)} {...props} />
);

/* ---------------------------------------------------------------------------
 * ArtifactCard — high-level component built on GenerativeCard
 * Mirrors the design from future-chat-artifact-card.tsx
 * --------------------------------------------------------------------------- */

export type ArtifactKind = "text" | "code" | "image" | "sheet" | "react";

export const ARTIFACT_KIND_LABELS: Record<ArtifactKind, string> = {
	code: "Code",
	image: "Image",
	react: "App",
	sheet: "Sheet",
	text: "Document",
};

function ArtifactKindIcon({ kind }: Readonly<{ kind: ArtifactKind }>) {
	switch (kind) {
		case "code":
			return <CodeIcon className="size-4" />;
		case "image":
			return <ImageIcon className="size-4" />;
		case "react":
			return <GlobeIcon className="size-4" />;
		case "sheet":
			return <SheetIcon className="size-4" />;
		default:
			return <FileTextIcon className="size-4" />;
	}
}

function getArtifactKindTileVariant(kind: ArtifactKind) {
	switch (kind) {
		case "code":
			return "blueSubtle" as const;
		case "image":
			return "purpleSubtle" as const;
		case "react":
			return "tealSubtle" as const;
		case "sheet":
			return "greenSubtle" as const;
		default:
			return "graySubtle" as const;
	}
}

function getArtifactActionLabel(
	action: "create" | "update" | null | undefined,
	isStreaming: boolean,
): string | null {
	if (isStreaming) return "Generating";
	if (action === "update") return "Updated";
	if (action === "create") return "Created";
	return null;
}

function getArtifactDescription({
	kind,
	versionNumber,
}: Readonly<{
	kind: ArtifactKind;
	versionNumber: number;
}>): string {
	return `${ARTIFACT_KIND_LABELS[kind]} \u2022 Version ${versionNumber}`;
}

function ArtifactPreview({
	isStreaming,
	kind,
	previewContent,
	title,
}: Readonly<{
	isStreaming: boolean;
	kind: ArtifactKind;
	previewContent: string;
	title: string;
}>) {
	if (kind === "image" && /^https?:|^data:image\//u.test(previewContent)) {
		return (
			<div className="relative aspect-[16/10] w-full overflow-hidden rounded-md bg-card">
				<Image
					alt={title}
					className="h-full w-full object-cover"
					height={800}
					src={previewContent}
					unoptimized
					width={1280}
				/>
				<div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/15 to-transparent" />
				{isStreaming ? (
					<div className="absolute bottom-3 left-3 inline-flex items-center gap-2 rounded-full border border-border/80 bg-background/95 px-2.5 py-1 text-[11px] text-text-subtle uppercase tracking-[0.16em] shadow-sm">
						<LoaderCircleIcon className="size-3 animate-spin" />
						Streaming
					</div>
				) : null}
			</div>
		);
	}

	if (!previewContent.trim()) {
		return (
			<div className="flex min-h-32 flex-col gap-3 rounded-md bg-card p-4">
				<div className="h-4 w-2/3 animate-pulse rounded-full bg-surface-raised" />
				<div className="h-3 w-full animate-pulse rounded-full bg-surface-raised" />
				<div className="h-3 w-5/6 animate-pulse rounded-full bg-surface-raised" />
				<div className="h-3 w-3/4 animate-pulse rounded-full bg-surface-raised" />
			</div>
		);
	}

	return (
		<div className="rounded-md">
			<div className="max-h-36 overflow-hidden whitespace-pre-wrap text-left font-mono text-[12px] leading-5 text-text">
				{previewContent}
			</div>
			{isStreaming ? (
				<div className="mt-3 inline-flex items-center gap-2 rounded-full border border-border bg-background px-2.5 py-1 text-[11px] text-text-subtle uppercase tracking-[0.16em]">
					<LoaderCircleIcon className="size-3 animate-spin" />
					Streaming
				</div>
			) : null}
		</div>
	);
}

export interface ArtifactCardProps {
	/** The artifact content type. Determines icon and color. */
	kind: ArtifactKind;
	/** Optional artifact version number displayed in the card metadata. @default 1 */
	versionNumber?: number;
	/** Artifact title text. */
	title: string;
	/** Optional action context. Used for description text. */
	action?: "create" | "update" | null;
	/** Whether the artifact is currently streaming. */
	isStreaming?: boolean;
	/** Display mode. "preview" shows expanded card. "chip" shows compact inline card. @default "preview" */
	displayMode?: "preview" | "chip";
	/** Optional emoji to display in the tile instead of the kind-based icon. */
	emoji?: string;
	/** Content string for the preview (code text, image URL, etc.). */
	previewContent?: string;
	/** Callback when the "Open" button is clicked. Receives the card root element. */
	onOpen?: (element: HTMLDivElement) => void;
	/** Callback when a preview-mode card mounts. Receives the card root element. */
	onRegister?: (element: HTMLDivElement) => void;
	/** Additional className for the outer wrapper. */
	className?: string;
	/** Optional children rendered inside GenerativeCardContent (overrides previewContent rendering). */
	children?: ReactNode;
}

export function ArtifactCard({
	kind,
	versionNumber = 1,
	title,
	action,
	isStreaming = false,
	displayMode = "preview",
	emoji,
	previewContent = "",
	onOpen,
	onRegister,
	className,
	children,
}: Readonly<ArtifactCardProps>) {
	const cardRef = useRef<HTMLDivElement>(null);
	const actionLabel = getArtifactActionLabel(action, isStreaming);
	const kindLabel = ARTIFACT_KIND_LABELS[kind];
	const openLabel = actionLabel
		? `Open ${actionLabel.toLowerCase()} ${kindLabel.toLowerCase()} ${title}`
		: `Open ${kindLabel.toLowerCase()} ${title}`;
	const openCtaLabel = `Open ${kindLabel.toLowerCase()}`;

	const handleOpen = () => {
		if (!cardRef.current || !onOpen) {
			return;
		}

		onOpen(cardRef.current);
	};

	useEffect(() => {
		if (displayMode !== "preview" || !cardRef.current || !onRegister) {
			return;
		}

		onRegister(cardRef.current);
	}, [displayMode, onRegister]);

	return (
		<div
			ref={cardRef}
			className={cn(
				displayMode === "preview" ? "w-full" : "w-fit max-w-full",
				className,
			)}
		>
			<GenerativeCard
				className={cn(
					"border-border/80 bg-surface-raised shadow-xs",
					displayMode === "preview"
						? "w-full"
						: "w-fit max-w-full",
				)}
				defaultExpanded={displayMode === "preview"}
				size={displayMode === "chip" ? "sm" : "default"}
			>
				<GenerativeCardHeader
					action={
						displayMode === "chip" && onOpen ? (
							<Button
								aria-label={openLabel}
								onClick={handleOpen}
								size="xs"
								type="button"
								variant="outline"
							>
								{openCtaLabel}
							</Button>
						) : null
					}
					collapseLabel="Collapse artifact details"
					description={getArtifactDescription({ kind, versionNumber })}
					expandLabel="Expand artifact details"
					leading={
						<Tile
							label={kindLabel}
							size={displayMode === "chip" ? "small" : "medium"}
							variant={emoji ? "neutral" : getArtifactKindTileVariant(kind)}
							isInset={!emoji}
						>
							{isStreaming ? (
								<LoaderCircleIcon className="size-4 animate-spin" />
							) : emoji ? (
								<span>{emoji}</span>
							) : (
								<ArtifactKindIcon kind={kind} />
							)}
						</Tile>
					}
					title={title}
				/>
				<GenerativeCardBody>
					<GenerativeCardContent>
						{children ?? (
							<ArtifactPreview
								isStreaming={isStreaming}
								kind={kind}
								previewContent={previewContent}
								title={title}
							/>
						)}
					</GenerativeCardContent>
					{onOpen ? (
						<GenerativeCardFooter>
							<Button
								aria-label={openLabel}
								className="min-w-0"
								onClick={handleOpen}
								type="button"
								variant="outline"
							>
								{openCtaLabel}
							</Button>
						</GenerativeCardFooter>
					) : null}
				</GenerativeCardBody>
			</GenerativeCard>
		</div>
	);
}

/* ---------------------------------------------------------------------------
 * ArtifactPanel — full-featured artifact viewer/editor with versioning,
 * annotations, and edit/preview modes.
 * Ported from FutureChatArtifactPanel.
 * --------------------------------------------------------------------------- */

function inferCodeLanguage(code: string): "html" | "css" | "tsx" {
	if (/<!doctype html>|<html[\s>]|<head[\s>]|<body[\s>]|<style[\s>]/iu.test(code)) {
		return "html";
	}

	if (/^\s*[.#@]?[a-z0-9_-]+\s*\{[\s\S]*\}\s*$/imu.test(code)) {
		return "css";
	}

	return "tsx";
}

function getAnnotationPinStyle(position: ArtifactAnnotationPosition): {
	left: string;
	top: string;
} {
	const pinLeft = position.left + (position.width > 0 ? position.width - 14 : 0);
	const pinTop = position.top - 10;

	return {
		left: `${Math.max(pinLeft, 8)}px`,
		top: `${Math.max(pinTop, 8)}px`,
	};
}

function getPendingSelectionStyle(
	position: ArtifactAnnotationPosition,
): {
	left: string;
	top: string;
} {
	return {
		left: `${Math.max(position.left, 8)}px`,
		top: `${Math.max(position.top + position.height + 12, 8)}px`,
	};
}

function PendingAnnotationPopover({
	onAddComment,
	onDismissSelection,
	pendingSelection,
}: Readonly<{
	onAddComment?: (comment: string) => void;
	onDismissSelection?: () => void;
	pendingSelection: PendingArtifactSelection;
}>) {
	const [commentDraft, setCommentDraft] = useState("");

	const handleSubmitComment = () => {
		const trimmedComment = commentDraft.trim();
		if (!trimmedComment) {
			return;
		}

		onAddComment?.(trimmedComment);
		setCommentDraft("");
	};

	return (
		<div
			className="pointer-events-auto absolute w-80 max-w-[calc(100%-1rem)] rounded-xl border border-border bg-background p-3 shadow-lg"
			data-artifact-annotation-ui=""
			style={getPendingSelectionStyle(pendingSelection.position)}
		>
			<div className="mb-2 flex items-center justify-between gap-3">
				<div>
					<p className="font-medium text-sm">Add annotation</p>
					<p className="text-text-subtle text-xs">
						{pendingSelection.anchor.textExcerpt || "Selected viewer element"}
					</p>
				</div>
				<Button
					onClick={onDismissSelection}
					size="icon-xs"
					type="button"
					variant="ghost"
				>
					<span className="sr-only">Dismiss annotation</span>
					<XIcon className="size-3.5" />
				</Button>
			</div>
			<Textarea
				className="min-h-20 resize-none"
				onChange={(event) => setCommentDraft(event.currentTarget.value)}
				placeholder="Describe what should change"
				value={commentDraft}
			/>
			<div className="mt-3 flex items-center justify-between gap-2">
				<p className="line-clamp-2 text-text-subtle text-xs">
					{pendingSelection.source.filePath
						? `${pendingSelection.source.filePath}${pendingSelection.source.lineNumber ? `:${pendingSelection.source.lineNumber}` : ""}`
						: "Viewer-surface annotation"}
				</p>
				<div className="flex items-center gap-2">
					<Button
						onClick={onDismissSelection}
						size="sm"
						type="button"
						variant="ghost"
					>
						Cancel
					</Button>
					<Button
						disabled={commentDraft.trim().length === 0}
						onClick={handleSubmitComment}
						size="sm"
						type="button"
					>
						Add note
					</Button>
				</div>
			</div>
		</div>
	);
}

const EMPTY_ANNOTATIONS: ArtifactAnnotation[] = [];

export { type ArtifactDocument } from "@/components/ui-ai/lib/artifact-versions";
export type { ArtifactAnnotation, PendingArtifactSelection } from "@/components/ui-ai/lib/artifact-annotations";

export interface ArtifactPanelProps {
	/** Annotation pins displayed on the preview surface. */
	annotations?: ArtifactAnnotation[];
	/** Ref forwarded to the scrollable content area (used by annotation hook). */
	contentRef?: RefObject<HTMLDivElement | null>;
	/** Whether annotation cursor mode is active (dev-only). */
	cursorMode?: boolean;
	/** The artifact document with versioned content. */
	document: ArtifactDocument;
	/** Current draft content for edit mode. */
	draftContent: string;
	/** Whether the artifact is currently streaming. */
	isStreaming?: boolean;
	/** Current display mode. */
	mode: "preview" | "edit";
	/** Callback to add an annotation comment. */
	onAddComment?: (comment: string) => void;
	/** Callback to apply all accumulated annotations as individual artifact-update tasks. */
	onApplyAnnotations?: (annotations: ArtifactAnnotation[]) => void;
	/** Callback to close the panel. */
	onClose: () => void;
	/** Callback to toggle annotation cursor mode. */
	onCursorModeChange?: (active: boolean) => void;
	/** Callback to delete the artifact. */
	onDelete: () => Promise<void>;
	/** Callback to dismiss the pending annotation selection. */
	onDismissSelection?: () => void;
	/** Callback when draft content changes in edit mode. */
	onDraftChange: (value: string) => void;
	/** Callback to switch between preview and edit mode. */
	onModeChange: (mode: "preview" | "edit") => void;
	/** Callback to remove an annotation by id. */
	onRemoveAnnotation?: (id: string) => void;
	/** Callback to save the current draft as a new version. */
	onSave: () => Promise<void>;
	/** Callback when the selected version changes. */
	onVersionChange: (versionId: string | null) => void;
	/** The pending annotation selection (shown as a comment popover). */
	pendingSelection?: PendingArtifactSelection | null;
	/** Currently selected version id (null = latest). */
	selectedVersionId: string | null;
	/** Additional className for the outer container. */
	className?: string;
}

export function ArtifactPanel({
	annotations = EMPTY_ANNOTATIONS,
	contentRef,
	cursorMode = false,
	document,
	draftContent,
	isStreaming = false,
	mode,
	onAddComment,
	onApplyAnnotations,
	onClose,
	onCursorModeChange,
	onDelete,
	onDismissSelection,
	onDraftChange,
	onModeChange,
	onRemoveAnnotation,
	onSave,
	onVersionChange,
	pendingSelection = null,
	selectedVersionId,
	className,
}: Readonly<ArtifactPanelProps>) {
	const selectedVersion =
		document.versions.find((version) => version.id === selectedVersionId)
		?? document.versions[document.versions.length - 1]
		?? null;
	const selectedVersionTitle = getArtifactVersionTitle({
		document,
		version: selectedVersion,
	});
	const previewContent =
		isStreaming && draftContent.trim().length > 0
			? draftContent
			: selectedVersion?.content ?? "";
	const versionLabel = isStreaming
		? "Generating artifact..."
		: selectedVersion
		? formatArtifactVersionSummaryLabel({
			version: selectedVersion,
		})
		: `${document.kind} artifact`;
	const showAnnotateToggle = process.env.NODE_ENV === "development";
	const isAnnotateDisabled =
		!showAnnotateToggle
		|| isStreaming
		|| mode !== "preview"
		|| onCursorModeChange === undefined;
	const outerScrollRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const elements = [outerScrollRef.current, contentRef?.current].filter(Boolean) as HTMLElement[];
		if (elements.length === 0) return;
		let timeout: ReturnType<typeof setTimeout>;
		function onScroll(this: HTMLElement) {
			this.setAttribute("data-scrolling", "");
			clearTimeout(timeout);
			timeout = setTimeout(() => {
				for (const el of elements) el.removeAttribute("data-scrolling");
			}, 1000);
		}
		for (const el of elements) el.addEventListener("scroll", onScroll, { passive: true });
		return () => {
			for (const el of elements) el.removeEventListener("scroll", onScroll);
			clearTimeout(timeout);
		};
	}, [contentRef]);

	return (
		<div className={cn("flex h-full min-h-0 w-full min-w-0 flex-col bg-background", className)}>
			<div className="flex flex-wrap items-center justify-between gap-3 border-border/80 border-b bg-background/90 p-3 backdrop-blur">
				<div className="flex min-w-0 items-center gap-2">
					<div className="min-w-0">
						<p className="truncate font-medium text-sm">{selectedVersionTitle}</p>
						<p className="truncate text-xs leading-4 text-text-subtlest">{versionLabel}</p>
					</div>
				</div>

				<div className="flex flex-wrap items-center gap-2">
					{!isStreaming && document.versions.length > 0 ? (
						<Select
							onValueChange={(value) => onVersionChange(value)}
							value={selectedVersion?.id ?? undefined}
						>
							<SelectTrigger
								aria-label="Artifact version"
								className="h-8 w-auto bg-background"
							>
								<SelectValue placeholder="Choose a version">
									{selectedVersion
										? `Version ${getArtifactVersionNumber(document, selectedVersion.id)}`
										: "Choose a version"}
								</SelectValue>
							</SelectTrigger>
							<SelectContent>
								{document.versions
									.slice()
									.reverse()
									.map((version) => (
										<SelectItem key={version.id} value={version.id}>
											{formatArtifactVersionLabel({
												document,
												version,
											})}
										</SelectItem>
									))}
							</SelectContent>
						</Select>
					) : null}

					<Button
						disabled={isStreaming}
						onClick={() => onModeChange(mode === "preview" ? "edit" : "preview")}
						size="icon-sm"
						type="button"
						variant="ghost"
					>
						<span className="sr-only">{mode === "preview" ? "Edit artifact" : "Preview artifact"}</span>
						<PencilLineIcon className="size-4" />
					</Button>
					{showAnnotateToggle ? (
						<Button
							aria-pressed={cursorMode}
							disabled={isAnnotateDisabled}
							onClick={() => onCursorModeChange?.(!cursorMode)}
							size="icon-sm"
							title="Dev-only annotation mode for the current artifact viewer surface."
							type="button"
							variant="ghost"
						>
							<span className="sr-only">Annotate artifact</span>
							<MessageSquarePlusIcon className="size-4" />
						</Button>
					) : null}
					<Button
						onClick={() => void navigator.clipboard.writeText(previewContent)}
						size="icon-sm"
						type="button"
						variant="ghost"
					>
						<span className="sr-only">Copy artifact content</span>
						<CopyIcon className="size-4" />
					</Button>
					<Button
						disabled={isStreaming}
						onClick={() => void onDelete()}
						size="icon-sm"
						type="button"
						variant="ghost"
					>
						<span className="sr-only">Delete artifact</span>
						<Trash2Icon className="size-4" />
					</Button>
					<Button onClick={onClose} size="icon-sm" type="button" variant="ghost">
						<span className="sr-only">Close artifact</span>
						<XIcon className="size-4" />
					</Button>
				</div>
			</div>

			<div ref={outerScrollRef} className="min-h-0 flex-1 overflow-auto scrollbar-auto-hide bg-background">
				{mode === "edit" && !isStreaming ? (
					<>
						<Textarea
							className="min-h-[50vh] flex-1 resize-none rounded-none border-0 p-4 shadow-none focus-visible:ring-0"
							onChange={(event) => onDraftChange(event.currentTarget.value)}
							value={draftContent}
						/>
						<div className="flex items-center justify-between border-border/70 border-t bg-bg-neutral/40 px-4 py-3">
							<p className="text-text-subtle text-xs">
								Saving creates a new local version for this artifact.
							</p>
							<Button onClick={() => void onSave()} size="sm" type="button">
								<SaveIcon className="size-4" />
								Save version
							</Button>
						</div>
					</>
				) : document.kind === "react" ? (
					<div className="flex h-full w-full flex-col overflow-hidden">
						<iframe
							title={`Live app preview — ${selectedVersionTitle}`}
							className="h-full min-h-0 w-full flex-1 border-0 bg-surface"
							sandbox="allow-forms allow-modals allow-popups allow-same-origin allow-scripts"
							src={previewContent}
						/>
					</div>
				) : (
					<div
						ref={contentRef}
						className="relative min-h-0 flex-1 overflow-auto scrollbar-auto-hide py-4 px-6 md:py-6 md:px-6"
					>
						{document.kind === "code" ? (
							<CodeBlock
								code={previewContent}
								language={inferCodeLanguage(previewContent)}
								showLineNumbers
							/>
						) : document.kind === "image" && /^https?:|^data:image\//u.test(previewContent) ? (
							<div className="flex h-full min-h-[320px] items-center justify-center rounded-2xl border border-border bg-surface-raised p-4">
								<Image
									alt={selectedVersionTitle}
									className="h-auto max-w-full rounded-md"
									height={900}
									src={previewContent}
									unoptimized
									width={1200}
								/>
							</div>
						) : (
							<MessageResponse isAnimating={isStreaming}>
								{previewContent}
							</MessageResponse>
						)}

						{mode === "preview" ? (
							<div
								className="pointer-events-none absolute inset-0 z-10"
								data-artifact-annotation-ui=""
							>
								{annotations.map((annotation) => (
									<Button
										key={annotation.id}
										className={cn(
											"pointer-events-auto absolute size-7 rounded-full border border-border-selected bg-background px-0 text-[11px] font-semibold text-text shadow-sm",
										)}
										onClick={() => onRemoveAnnotation?.(annotation.id)}
										size="icon-sm"
										style={getAnnotationPinStyle(annotation.position)}
										title={`Remove annotation #${annotation.index}: ${annotation.comment}`}
										type="button"
										variant="outline"
									>
										{annotation.index}
									</Button>
								))}

								{pendingSelection ? (
									<PendingAnnotationPopover
										key={`${pendingSelection.position.left}-${pendingSelection.position.top}-${pendingSelection.anchor.selector ?? "selection"}`}
										onAddComment={onAddComment}
										onDismissSelection={onDismissSelection}
										pendingSelection={pendingSelection}
									/>
								) : null}
							</div>
						) : null}
					</div>
				)}
			</div>

			{annotations.length > 0 && onApplyAnnotations ? (
				<div className="flex items-center justify-between border-border/80 border-t bg-bg-neutral/40 px-4 py-2">
					<p className="text-text-subtle text-xs">
						{annotations.length} {annotations.length === 1 ? "annotation" : "annotations"}
					</p>
					<Button
						disabled={isStreaming}
						onClick={() => onApplyAnnotations(annotations)}
						size="sm"
						type="button"
					>
						Apply all
					</Button>
				</div>
			) : null}
		</div>
	);
}
