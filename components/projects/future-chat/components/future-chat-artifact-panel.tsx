"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { CodeBlock } from "@/components/ui-ai/code-block";
import { MessageResponse } from "@/components/ui-ai/message";
import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { PendingArtifactSelection } from "@/components/projects/future-chat/hooks/use-artifact-annotations";
import type {
	ArtifactAnnotation,
	ArtifactAnnotationPosition,
} from "@/components/projects/future-chat/lib/future-chat-artifact-annotations";
import { cn } from "@/lib/utils";
import {
	formatFutureChatVersionLabel,
	getFutureChatVersionNumber,
	getFutureChatVersionTitle,
} from "@/components/projects/future-chat/lib/future-chat-version-labels";
import type { FutureChatDocument } from "@/lib/future-chat-types";
import {
	CopyIcon,
	MessageSquarePlusIcon,
	PencilLineIcon,
	SaveIcon,
	Trash2Icon,
	XIcon,
} from "lucide-react";
import Image from "next/image";

interface FutureChatArtifactPanelProps {
	annotations?: ArtifactAnnotation[];
	contentRef?: RefObject<HTMLDivElement | null>;
	cursorMode?: boolean;
	document: FutureChatDocument;
	draftContent: string;
	isStreamingArtifact?: boolean;
	mode: "preview" | "edit";
	onAddComment?: (comment: string) => void;
	onClose: () => void;
	onCursorModeChange?: (active: boolean) => void;
	onDelete: () => Promise<void>;
	onDraftChange: (value: string) => void;
	onDismissSelection?: () => void;
	onModeChange: (mode: "preview" | "edit") => void;
	onRemoveAnnotation?: (id: string) => void;
	onSave: () => Promise<void>;
	onVersionChange: (versionId: string | null) => void;
	pendingSelection?: PendingArtifactSelection | null;
	selectedVersionId: string | null;
}

const EMPTY_ANNOTATIONS: ArtifactAnnotation[] = [];

function inferFutureChatCodeLanguage(code: string): "html" | "css" | "tsx" {
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

export function FutureChatArtifactPanel({
	annotations = EMPTY_ANNOTATIONS,
	contentRef,
	cursorMode = false,
	document,
	draftContent,
	isStreamingArtifact = false,
	mode,
	onAddComment,
	onClose,
	onCursorModeChange,
	onDelete,
	onDraftChange,
	onDismissSelection,
	onModeChange,
	onRemoveAnnotation,
	onSave,
	onVersionChange,
	pendingSelection = null,
	selectedVersionId,
}: Readonly<FutureChatArtifactPanelProps>) {
	const selectedVersion =
		document.versions.find((version) => version.id === selectedVersionId)
		?? document.versions[document.versions.length - 1]
		?? null;
	const selectedVersionTitle = getFutureChatVersionTitle({
		document,
		version: selectedVersion,
	});
	const previewContent =
		isStreamingArtifact && draftContent.trim().length > 0
			? draftContent
			: selectedVersion?.content ?? "";
	const versionLabel = isStreamingArtifact
		? "Generating artifact..."
		: selectedVersion
		? formatFutureChatVersionLabel({
			document,
			version: selectedVersion,
		})
		: `${document.kind} artifact`;
	const showAnnotateToggle = process.env.NODE_ENV === "development";
	const isAnnotateDisabled =
		!showAnnotateToggle
		|| isStreamingArtifact
		|| mode !== "preview"
		|| onCursorModeChange === undefined;
	const outerScrollRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const elements = [outerScrollRef.current, contentRef?.current].filter(Boolean) as HTMLElement[]
		if (elements.length === 0) return
		let timeout: ReturnType<typeof setTimeout>
		function onScroll(this: HTMLElement) {
			this.setAttribute("data-scrolling", "")
			clearTimeout(timeout)
			timeout = setTimeout(() => {
				for (const el of elements) el.removeAttribute("data-scrolling")
			}, 1000)
		}
		for (const el of elements) el.addEventListener("scroll", onScroll, { passive: true })
		return () => {
			for (const el of elements) el.removeEventListener("scroll", onScroll)
			clearTimeout(timeout)
		}
	}, [contentRef])

	return (
		<div className="flex h-full min-h-0 w-full min-w-0 flex-col bg-background">
			<div className="flex flex-wrap items-center justify-between gap-3 border-border/80 border-b bg-background/90 p-3 backdrop-blur">
				<div className="flex min-w-0 items-center gap-2">
					<div className="min-w-0">
						<div className="flex items-center gap-2">
							<p className="truncate font-medium text-sm">{selectedVersionTitle}</p>
							<span className="rounded-full bg-bg-neutral px-2 py-0.5 text-[11px] text-text-subtle uppercase">
								{document.kind}
							</span>
						</div>
						<p className="truncate text-text-subtle text-sm">{versionLabel}</p>
					</div>
				</div>

				<div className="flex flex-wrap items-center gap-2">
					{!isStreamingArtifact && document.versions.length > 0 ? (
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
										? `Version ${getFutureChatVersionNumber(document, selectedVersion.id)}`
										: "Choose a version"}
								</SelectValue>
							</SelectTrigger>
							<SelectContent>
								{document.versions
									.slice()
									.reverse()
									.map((version) => (
										<SelectItem key={version.id} value={version.id}>
											{formatFutureChatVersionLabel({
												document,
												version,
											})}
										</SelectItem>
									))}
							</SelectContent>
						</Select>
					) : null}

					<Button
						disabled={isStreamingArtifact}
						onClick={() => onModeChange(mode === "preview" ? "edit" : "preview")}
						size="sm"
						type="button"
						variant="outline"
					>
						<PencilLineIcon className="size-4" />
						{mode === "preview" ? "Edit" : "Preview"}
					</Button>
					{showAnnotateToggle ? (
						<Button
							aria-pressed={cursorMode}
							disabled={isAnnotateDisabled}
							onClick={() => onCursorModeChange?.(!cursorMode)}
							size="sm"
							title="Dev-only annotation mode for the current artifact viewer surface."
							type="button"
							variant={cursorMode ? "default" : "outline"}
						>
							<MessageSquarePlusIcon className="size-4" />
							Annotate
							{annotations.length > 0 ? (
								<span className="rounded-full bg-bg-neutral px-1.5 py-0 text-[11px] leading-5 text-current">
									{annotations.length}
								</span>
							) : null}
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
						disabled={isStreamingArtifact}
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
				{mode === "edit" && !isStreamingArtifact ? (
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
				) : (
					<div
						ref={contentRef}
						className="relative min-h-0 flex-1 overflow-auto scrollbar-auto-hide py-4 px-6 md:py-6 md:px-6"
					>
						{document.kind === "code" ? (
							<CodeBlock
								code={previewContent}
								language={inferFutureChatCodeLanguage(previewContent)}
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
							<MessageResponse isAnimating={isStreamingArtifact}>
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
		</div>
	);
}
