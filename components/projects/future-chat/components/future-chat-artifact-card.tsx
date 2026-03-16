"use client";

import type { FutureChatDocumentKind } from "@/lib/future-chat-types";
import { cn } from "@/lib/utils";
import {
	CodeIcon,
	ExpandIcon,
	FileTextIcon,
	ImageIcon,
	LoaderCircleIcon,
	SheetIcon,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useRef } from "react";

interface FutureChatArtifactCardProps {
	action: "create" | "update" | null;
	displayMode: "preview" | "chip";
	documentId: string;
	isStreaming: boolean;
	kind: FutureChatDocumentKind;
	onOpen: (documentId: string, element: HTMLElement) => void;
	onRegister: (documentId: string, element: HTMLElement) => void;
	previewContent: string;
	title: string;
}

const KIND_LABELS: Record<FutureChatDocumentKind, string> = {
	code: "Code",
	image: "Image",
	sheet: "Sheet",
	text: "Document",
};

function KindIcon({ kind }: Readonly<{ kind: FutureChatDocumentKind }>) {
	switch (kind) {
		case "code":
			return <CodeIcon className="size-4" />;
		case "image":
			return <ImageIcon className="size-4" />;
		case "sheet":
			return <SheetIcon className="size-4" />;
		default:
			return <FileTextIcon className="size-4" />;
	}
}

function getArtifactActionLabel(action: "create" | "update" | null, isStreaming: boolean): string | null {
	if (isStreaming) {
		return "Generating";
	}

	if (action === "update") {
		return "Updated";
	}

	if (action === "create") {
		return "Created";
	}

	return null;
}

function renderArtifactPreview({
	isStreaming,
	kind,
	previewContent,
	title,
}: Readonly<Pick<
	FutureChatArtifactCardProps,
	"isStreaming" | "kind" | "previewContent" | "title"
>>) {
	if (kind === "image" && /^https?:|^data:image\//u.test(previewContent)) {
		return (
			<div className="relative aspect-[16/10] overflow-hidden rounded-b-[20px] bg-surface-raised">
				<Image
					alt={title}
					className="h-full w-full object-cover"
					height={800}
					src={previewContent}
					unoptimized
					width={1280}
				/>
				<div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/10 to-transparent" />
			</div>
		);
	}

	if (!previewContent.trim()) {
		return (
			<div className="flex min-h-32 flex-col gap-3 rounded-b-[20px] bg-surface px-4 py-4">
				<div className="h-4 w-2/3 animate-pulse rounded-full bg-surface-raised" />
				<div className="h-3 w-full animate-pulse rounded-full bg-surface-raised" />
				<div className="h-3 w-5/6 animate-pulse rounded-full bg-surface-raised" />
				<div className="h-3 w-3/4 animate-pulse rounded-full bg-surface-raised" />
			</div>
		);
	}

	return (
		<div className="rounded-b-[20px] bg-surface px-4 py-4">
			<div
				className={cn(
					"max-h-36 overflow-hidden whitespace-pre-wrap text-left text-sm text-text-subtle",
					kind === "code" || kind === "sheet" ? "font-mono text-[12px] leading-5" : "leading-6",
				)}
			>
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

export function FutureChatArtifactCard({
	action,
	displayMode,
	documentId,
	isStreaming,
	kind,
	onOpen,
	onRegister,
	previewContent,
	title,
}: Readonly<FutureChatArtifactCardProps>) {
	const cardRef = useRef<HTMLButtonElement>(null);
	const actionLabel = getArtifactActionLabel(action, isStreaming);
	const openLabel = actionLabel
		? `Open ${actionLabel.toLowerCase()} ${KIND_LABELS[kind].toLowerCase()} ${title}`
		: `Open ${KIND_LABELS[kind].toLowerCase()} ${title}`;

	const handleClick = () => {
		if (!cardRef.current) {
			return;
		}

		onOpen(documentId, cardRef.current);
	};

	useEffect(() => {
		if (displayMode !== "preview" || !cardRef.current) {
			return;
		}

		onRegister(documentId, cardRef.current);
	}, [displayMode, documentId, onRegister]);

	if (displayMode === "chip") {
		return (
			<button
				aria-label={openLabel}
				ref={cardRef}
				className="group/artifact-card flex w-fit max-w-full cursor-pointer items-center gap-2 rounded-2xl border border-border bg-surface-raised px-3 py-2 text-left transition-colors hover:bg-surface-raised-hovered"
				onClick={handleClick}
				type="button"
			>
				<div className="flex size-5 shrink-0 items-center justify-center text-text-subtle">
					{isStreaming ? (
						<LoaderCircleIcon className="size-4 animate-spin" />
					) : (
						<KindIcon kind={kind} />
					)}
				</div>
				<span className="min-w-0 truncate text-sm font-medium text-text">
					{actionLabel ? `${actionLabel} "${title}"` : title}
				</span>
				<span className="shrink-0 rounded-full border border-border/70 bg-background px-2 py-0.5 text-[11px] text-text-subtle uppercase tracking-[0.16em]">
					{KIND_LABELS[kind]}
				</span>
			</button>
		);
	}

	return (
		<button
			aria-label={openLabel}
			ref={cardRef}
			className="group/artifact-card flex w-full max-w-[450px] cursor-pointer flex-col overflow-hidden rounded-3xl border border-border bg-background text-left shadow-xs transition-colors hover:bg-surface-raised"
			onClick={handleClick}
			type="button"
		>
			<div className="flex items-start justify-between gap-3 border-border/70 border-b px-4 py-3">
				<div className="flex min-w-0 items-start gap-3">
					<div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl bg-surface-raised text-text-subtle">
						{isStreaming ? (
							<LoaderCircleIcon className="size-4 animate-spin" />
						) : (
							<KindIcon kind={kind} />
						)}
					</div>
					<div className="min-w-0">
						<p className="truncate font-medium text-sm text-text">
							{title}
						</p>
						<p className="truncate text-text-subtle text-xs">
							{actionLabel ? `${actionLabel} ${KIND_LABELS[kind].toLowerCase()}` : KIND_LABELS[kind]}
						</p>
					</div>
				</div>

				<div className="flex items-center gap-2">
					<span className="shrink-0 rounded-full border border-border/70 bg-surface px-2 py-0.5 text-[11px] text-text-subtle uppercase tracking-[0.16em]">
						{KIND_LABELS[kind]}
					</span>
					<div className="shrink-0 rounded-md p-1 text-text-subtle transition-colors group-hover/artifact-card:bg-surface group-hover/artifact-card:text-text">
						<ExpandIcon className="size-4" />
					</div>
				</div>
			</div>

			{renderArtifactPreview({
				isStreaming,
				kind,
				previewContent,
				title,
			})}
		</button>
	);
}
