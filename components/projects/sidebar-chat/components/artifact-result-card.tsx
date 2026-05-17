"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useRovoChat } from "@/app/contexts";
import { RovoCanvas, type RovoCanvasStatus, type RovoCanvasVersion, type RovoCanvasView } from "@/components/blocks/rovo-canvas/page";
import { Button } from "@/components/ui/button";
import { ArtifactCard, ARTIFACT_KIND_LABELS, type ArtifactKind } from "@/components/ui-ai/artifact";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { getRovoAppDocument } from "@/components/projects/rovo/lib/api";
import { buildArtifactPreviewBody } from "@/components/projects/shared/lib/artifact-preview";
import { PreviewBodyRenderer } from "@/components/projects/shared/components/preview-body-renderer";
import type { RovoAppDocument } from "@/lib/rovo-app-types";
import type { RovoDataParts } from "@/lib/rovo-ui-messages";
import { cn } from "@/lib/utils";

export type ArtifactResult = RovoDataParts["artifact-result"];

interface ArtifactResultCardProps {
	artifact: ArtifactResult;
	className?: string;
	onDialogOpen?: (artifact: ArtifactResult) => void;
	onDialogClose?: (artifact: ArtifactResult) => void;
}

function getLatestDocumentContent(document: RovoAppDocument | null): string {
	if (!document || document.versions.length === 0) {
		return "";
	}

	return document.versions[document.versions.length - 1]?.content ?? "";
}

function normalizeArtifactKind(kind: string): ArtifactKind {
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

function resolveCanvasStatus(isLoading: boolean, errorMessage: string | null): RovoCanvasStatus {
	if (isLoading) {
		return "executing";
	}

	return errorMessage ? "error" : "ready";
}

function buildCanvasVersionHistory(document: RovoAppDocument | null): ReadonlyArray<RovoCanvasVersion> {
	if (!document || document.versions.length === 0) {
		return [
			{
				id: "pending",
				label: "Version 1",
				summary: "Loading artifact",
				timestamp: "Now",
				isCurrent: true,
			},
		];
	}

	return document.versions.map((version, index) => ({
		id: version.id,
		label: version.title || `Version ${index + 1}`,
		summary: version.changeLabel || "Artifact version",
		timestamp: new Intl.DateTimeFormat("en-US", {
			dateStyle: "medium",
			timeStyle: "short",
		}).format(new Date(version.createdAt)),
		isCurrent: index === document.versions.length - 1,
		group: "Artifact history",
	}));
}

export function ArtifactResultCard({
	artifact,
	className,
	onDialogOpen,
	onDialogClose,
}: Readonly<ArtifactResultCardProps>): ReactNode {
	const [isOpen, setIsOpen] = useState(false);
	const [document, setDocument] = useState<RovoAppDocument | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const { activeThreadId } = useRovoChat();
	const artifactKind = normalizeArtifactKind(artifact.kind);
	const kindLabel = ARTIFACT_KIND_LABELS[artifactKind];
	const shouldOpenInRovoCanvas = artifact.kind === "html";
	const canvasThreadId = artifact.threadId ?? document?.threadId ?? activeThreadId ?? null;
	const canvasStatus = resolveCanvasStatus(isLoading, errorMessage);
	const handleOpenChange = useCallback((open: boolean) => {
		if (open === isOpen) {
			return;
		}

		if (open) {
			onDialogOpen?.(artifact);
		} else {
			onDialogClose?.(artifact);
		}

		setIsOpen(open);
	}, [artifact, isOpen, onDialogClose, onDialogOpen]);
	const handleOpenArtifact = () => {
		if (shouldOpenInRovoCanvas) {
			const openCanvasEvent = new CustomEvent("rovo:open-canvas-artifact", {
				cancelable: true,
				detail: {
					documentId: artifact.documentId,
					threadId: canvasThreadId,
					source: "artifact-result-card",
				},
			});
			window.dispatchEvent(openCanvasEvent);
			if (openCanvasEvent.defaultPrevented) {
				return;
			}
		}

		handleOpenChange(true);
	};

	useEffect(() => {
		if (!shouldOpenInRovoCanvas) {
			return;
		}

		const handleCanvasLink = (event: Event) => {
			const { detail } = event as CustomEvent<{ documentId?: string; source?: string }>;
			if (detail?.documentId !== artifact.documentId || detail.source === "artifact-result-card") {
				return;
			}

			window.setTimeout(() => {
				if (!event.defaultPrevented) {
					handleOpenChange(true);
				}
			}, 0);
		};

		window.addEventListener("rovo:open-canvas-artifact", handleCanvasLink);
		return () => window.removeEventListener("rovo:open-canvas-artifact", handleCanvasLink);
	}, [artifact.documentId, handleOpenChange, shouldOpenInRovoCanvas]);

	useEffect(() => {
		if (!isOpen && !shouldOpenInRovoCanvas) {
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
	}, [artifact.documentId, isOpen, shouldOpenInRovoCanvas]);

	const latestContent = getLatestDocumentContent(document);
	const previewBody = useMemo(() => {
		if (!latestContent) {
			return null;
		}

		return buildArtifactPreviewBody({
			content: latestContent,
			kind: normalizeArtifactKind(document?.kind ?? artifact.kind),
			summary: document?.previewSummary,
		});
	}, [artifact.kind, document, latestContent]);
	const canvasViews = useMemo<ReadonlyArray<RovoCanvasView>>(
		() => [
			{
				id: "preview",
				label: "Preview",
				toolbar: "preview",
				content: (
					<div className="size-full overflow-hidden bg-surface-sunken p-4">
						{isLoading ? (
							<div className="flex size-full items-center justify-center rounded-lg border border-border bg-surface text-sm text-text-subtle">
								Loading report...
							</div>
						) : errorMessage ? (
							<div className="rounded-lg border border-border bg-surface p-4 text-sm text-text">
								{errorMessage}
							</div>
						) : previewBody ? (
							<PreviewBodyRenderer
								body={previewBody}
								surface="dialog"
								title={artifact.title}
								summary={document?.previewSummary}
							/>
						) : (
							<div className="rounded-lg border border-border bg-surface p-4 text-sm text-text-subtle">
								Open the artifact after generation finishes.
							</div>
						)}
					</div>
				),
			},
			{
				id: "html",
				label: "HTML",
				toolbar: "source",
				copyText: latestContent,
				content: (
					<div className="size-full overflow-auto bg-surface p-6">
						<pre className="min-h-full overflow-auto rounded-lg border border-border bg-surface-raised p-4 text-xs leading-5 text-text-subtle">
							<code>{latestContent || "Report source is loading..."}</code>
						</pre>
					</div>
				),
			},
		],
		[artifact.title, document?.previewSummary, errorMessage, isLoading, latestContent, previewBody],
	);
	const canvasVersionHistory = useMemo(
		() => buildCanvasVersionHistory(document),
		[document],
	);

	return (
		<div className={cn("pb-2", className)} data-testid="rovo-artifact-result-card">
			<ArtifactCard
				action={artifact.action}
				displayMode="preview"
				kind={artifactKind}
				onOpen={handleOpenArtifact}
				previewContent={latestContent}
				previewSummary={document?.previewSummary ?? undefined}
				title={artifact.title}
				versionNumber={document?.versions.length ?? 1}
			/>
			{shouldOpenInRovoCanvas ? (
				<RovoCanvas
					open={isOpen}
					onOpenChange={handleOpenChange}
					kind="report"
					status={canvasStatus}
					title={artifact.title}
					lozengeLabel={`Version ${document?.versions.length ?? 1}`}
					primaryActionLabel="Done"
					onPrimaryAction={() => handleOpenChange(false)}
					views={canvasViews}
					defaultViewId="preview"
					artefactLabel={kindLabel}
					versionHistory={canvasVersionHistory}
				/>
			) : (
				<Dialog open={isOpen} onOpenChange={handleOpenChange}>
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
								onClick={() => handleOpenChange(false)}
							>
								Close
							</Button>
						</div>
					</DialogContent>
				</Dialog>
			)}
		</div>
	);
}
