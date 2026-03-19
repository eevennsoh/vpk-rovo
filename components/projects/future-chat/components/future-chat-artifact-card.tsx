"use client";

import {
	GenerativeCard,
	GenerativeCardBody,
	GenerativeCardContent,
	GenerativeCardFooter,
	GenerativeCardHeader,
} from "@/components/blocks/generative-card";
import { Button } from "@/components/ui/button";
import { Tile } from "@/components/ui/tile";
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

function getArtifactActionLabel(
	action: "create" | "update" | null,
	isStreaming: boolean,
): string | null {
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

function getArtifactDescription(
	actionLabel: string | null,
	kind: FutureChatDocumentKind,
): string {
	const kindLabel = KIND_LABELS[kind].toLowerCase();
	return actionLabel ? `${actionLabel} ${kindLabel}` : KIND_LABELS[kind];
}

function getOpenArtifactLabel(kind: FutureChatDocumentKind): string {
	return `Open ${KIND_LABELS[kind].toLowerCase()}`;
}

function getKindTileVariant(kind: FutureChatDocumentKind) {
	switch (kind) {
		case "code":
			return "blueSubtle";
		case "image":
			return "purpleSubtle";
		case "sheet":
			return "greenSubtle";
		default:
			return "graySubtle";
	}
}

function FutureChatArtifactPreview({
	isStreaming,
	kind,
	previewContent,
	title,
}: Readonly<
	Pick<
		FutureChatArtifactCardProps,
		"isStreaming" | "kind" | "previewContent" | "title"
	>
>) {
	if (kind === "image" && /^https?:|^data:image\//u.test(previewContent)) {
		return (
			<div className="relative aspect-[16/10] w-full overflow-hidden rounded-md bg-surface">
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
			<div className="flex min-h-32 flex-col gap-3 rounded-md bg-surface p-4">
				<div className="h-4 w-2/3 animate-pulse rounded-full bg-surface-raised" />
				<div className="h-3 w-full animate-pulse rounded-full bg-surface-raised" />
				<div className="h-3 w-5/6 animate-pulse rounded-full bg-surface-raised" />
				<div className="h-3 w-3/4 animate-pulse rounded-full bg-surface-raised" />
			</div>
		);
	}

	return (
		<div className="rounded-md bg-surface p-4">
			<div
				className={cn(
					"max-h-36 overflow-hidden whitespace-pre-wrap text-left text-sm text-text-subtle",
					kind === "code" || kind === "sheet"
						? "font-mono text-[12px] leading-5"
						: "leading-6",
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
	const cardRef = useRef<HTMLDivElement>(null);
	const actionLabel = getArtifactActionLabel(action, isStreaming);
	const openLabel = actionLabel
		? `Open ${actionLabel.toLowerCase()} ${KIND_LABELS[kind].toLowerCase()} ${title}`
		: `Open ${KIND_LABELS[kind].toLowerCase()} ${title}`;
	const openCtaLabel = getOpenArtifactLabel(kind);

	const handleOpen = () => {
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

	return (
		<div
			ref={cardRef}
			className={cn(
				displayMode === "preview" ? "w-full max-w-[450px]" : "w-fit max-w-full",
			)}
		>
			<GenerativeCard
				className={cn(
					"border-border/80 bg-background shadow-xs transition-colors",
					displayMode === "preview"
						? "w-full hover:bg-surface-raised"
						: "w-fit max-w-full",
				)}
				defaultExpanded={displayMode === "preview"}
				size={displayMode === "chip" ? "sm" : "default"}
			>
				<GenerativeCardHeader
					action={
						displayMode === "chip" ? (
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
					description={getArtifactDescription(actionLabel, kind)}
					expandLabel="Expand artifact details"
					leading={(
						<Tile
							label={KIND_LABELS[kind]}
							size={displayMode === "chip" ? "small" : "medium"}
							variant={getKindTileVariant(kind)}
						>
							{isStreaming ? (
								<LoaderCircleIcon className="size-4 animate-spin" />
							) : (
								<KindIcon kind={kind} />
							)}
						</Tile>
					)}
					title={title}
				/>
				<GenerativeCardBody>
					<GenerativeCardContent>
						<FutureChatArtifactPreview
							isStreaming={isStreaming}
							kind={kind}
							previewContent={previewContent}
							title={title}
						/>
					</GenerativeCardContent>
					<GenerativeCardFooter>
						<Button
							aria-label={openLabel}
							className="h-8 min-w-0 px-3 sm:min-w-[117px]"
							onClick={handleOpen}
							size="sm"
							type="button"
							variant="outline"
						>
							{openCtaLabel}
							<ExpandIcon className="size-3.5" />
						</Button>
					</GenerativeCardFooter>
				</GenerativeCardBody>
			</GenerativeCard>
		</div>
	);
}
