"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import LinkExternalIcon from "@atlaskit/icon/core/link-external";
import PageIcon from "@atlaskit/icon/core/page";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { getRovoAppDocument } from "@/components/projects/rovo/lib/api";
import { buildArtifactPreviewBody, type PreviewArtifactKind } from "@/components/projects/shared/lib/artifact-preview";
import { PreviewBodyRenderer } from "@/components/projects/shared/components/preview-body-renderer";
import type { RovoAppDocument } from "@/lib/rovo-app-types";
import type { RovoDataParts } from "@/lib/rovo-ui-messages";
import { cn } from "@/lib/utils";

type ArtifactResult = RovoDataParts["artifact-result"];

function getArtifactKindLabel(kind: string): string {
	if (kind === "html") return "HTML report";
	if (kind === "react") return "App";
	if (kind === "excalidraw") return "Diagram";
	if (kind === "sheet") return "Sheet";
	if (kind === "code") return "Code";
	if (kind === "image") return "Image";
	if (kind === "browser") return "Browser";
	return "Document";
}

function getLatestDocumentContent(document: RovoAppDocument | null): string {
	if (!document || document.versions.length === 0) {
		return "";
	}

	return document.versions[document.versions.length - 1]?.content ?? "";
}

function normalizePreviewKind(kind: string): PreviewArtifactKind {
	if (
		kind === "code" ||
		kind === "html" ||
		kind === "image" ||
		kind === "sheet" ||
		kind === "react" ||
		kind === "excalidraw" ||
		kind === "browser"
	) {
		return kind;
	}

	return "text";
}

export function ArtifactResultCard({
	artifact,
	className,
}: Readonly<{
	artifact: ArtifactResult;
	className?: string;
}>): ReactNode {
	const [isOpen, setIsOpen] = useState(false);
	const [document, setDocument] = useState<RovoAppDocument | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const kindLabel = getArtifactKindLabel(artifact.kind);
	const actionLabel = artifact.action === "update" ? "Updated" : "Created";

	useEffect(() => {
		if (!isOpen) {
			return;
		}

		let ignore = false;
		setDocument(null);
		setErrorMessage(null);
		setIsLoading(true);
		void getRovoAppDocument(artifact.documentId)
			.then((nextDocument) => {
				if (ignore) return;
				setDocument(nextDocument);
				setErrorMessage(nextDocument ? null : "The report artifact could not be found.");
			})
			.catch((error) => {
				if (ignore) return;
				setErrorMessage(error instanceof Error ? error.message : "Failed to load the report artifact.");
			})
			.finally(() => {
				if (!ignore) {
					setIsLoading(false);
				}
			});

		return () => {
			ignore = true;
		};
	}, [artifact.documentId, isOpen]);

	const latestContent = getLatestDocumentContent(document);
	const previewBody = useMemo(() => {
		if (!latestContent) {
			return null;
		}

		return buildArtifactPreviewBody({
			content: latestContent,
			kind: normalizePreviewKind(document?.kind ?? artifact.kind),
			summary: document?.previewSummary,
		});
	}, [artifact.kind, document, latestContent]);

	return (
		<div className={cn("pb-2", className)}>
			<Dialog open={isOpen} onOpenChange={setIsOpen}>
				<button
					type="button"
					className="group flex w-full items-center gap-3 rounded-md border border-border bg-surface-raised p-3 text-left shadow-sm transition-colors hover:bg-surface-raised-hovered focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
					onClick={() => setIsOpen(true)}
					data-testid="rovo-artifact-result-card"
				>
					<span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-surface-accent-blue-subtle text-icon">
						<PageIcon label="" />
					</span>
					<span className="min-w-0 flex-1">
						<span className="block text-xs font-medium uppercase tracking-wide text-text-subtle">
							{actionLabel} {kindLabel}
						</span>
						<span className="block truncate text-sm font-medium text-text">
							{artifact.title}
						</span>
					</span>
					<span className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-link group-hover:text-link-pressed">
						Open
						<LinkExternalIcon label="" />
					</span>
				</button>
				<DialogContent
					className="max-h-[92vh] gap-0 overflow-hidden p-0 sm:max-w-6xl [grid-template-rows:auto_minmax(0,1fr)]"
					size="xl"
				>
					<DialogHeader className="mx-0 mt-0 px-4 py-4 sm:px-6">
						<DialogTitle className="pr-10">
							{artifact.title}
						</DialogTitle>
						<DialogDescription>
							{kindLabel} artifact
						</DialogDescription>
					</DialogHeader>
					<div className="min-h-0 overflow-hidden p-4 sm:p-6">
						{isLoading ? (
							<div className="flex h-[60vh] items-center justify-center rounded-md border border-border bg-surface text-sm text-text-subtle">
								Loading report...
							</div>
						) : errorMessage ? (
							<div className="rounded-md border border-border bg-surface p-4 text-sm text-text">
								{errorMessage}
							</div>
						) : previewBody ? (
							<div className="h-[72vh] min-h-[420px]">
								<PreviewBodyRenderer
									body={previewBody}
									surface="dialog"
									title={artifact.title}
									summary={document?.previewSummary}
								/>
							</div>
						) : (
							<div className="rounded-md border border-border bg-surface p-4 text-sm text-text-subtle">
								Open the artifact after generation finishes.
							</div>
						)}
					</div>
					<div className="border-t border-border px-4 py-3 sm:px-6">
						<Button
							type="button"
							variant="outline"
							onClick={() => setIsOpen(false)}
						>
							Close
						</Button>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}
