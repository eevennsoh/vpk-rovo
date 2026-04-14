"use client";

import { useEffect, useMemo, useState } from "react";

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Lozenge } from "@/components/ui/lozenge";
import { ScrollArea } from "@/components/ui/scroll-area";
import type {
	WikiCanonicalMemoryDocument,
	WikiCanonicalMemoryDocuments,
	WikiCompiledContextDocument,
	WikiMemoryProposalSummary,
	WikiStatus,
} from "@/lib/rovo-runtime-types";

import {
	deleteWikiMemoryProposal,
	fetchWikiMemories,
	fetchWikiStatus,
	syncWiki,
} from "./lib/control-plane-api";
import { formatControlPlaneDateTime } from "./lib/control-plane-utils";
import { ControlPlanePageShell } from "./control-plane-page-shell";

function formatProposalTone(status: string): "danger" | "neutral" | "success" | "warning" {
	if (status === "ingested") {
		return "success";
	}
	if (status === "queued") {
		return "warning";
	}
	return "neutral";
}

function formatScopeLabel(scope: string): string {
	if (scope === "profile") {
		return "Profile";
	}
	if (scope === "operations") {
		return "Runtime";
	}
	return scope;
}

function buildContextCards(wikiStatus: WikiStatus | null): Array<{
	description: string;
	document: WikiCompiledContextDocument;
	label: string;
}> {
	if (!wikiStatus?.compiledContexts) {
		return [];
	}

	return [
		{
			description: "Generated from `profiles/self.md` for user identity and preferences.",
			document: wikiStatus.compiledContexts.profile ?? {
				charCount: 0,
				exists: false,
				path: "",
				preview: "",
				updatedAt: null,
			},
			label: "Profile context",
		},
		{
			description: "Generated from `operations/core-memory.md` for durable runtime memory.",
			document: wikiStatus.compiledContexts.operations ?? {
				charCount: 0,
				exists: false,
				path: "",
				preview: "",
				updatedAt: null,
			},
			label: "Runtime context",
		},
	];
}

function buildCanonicalMemoryCards(memoryDocuments: WikiCanonicalMemoryDocuments | null): WikiCanonicalMemoryDocument[] {
	if (!memoryDocuments) {
		return [];
	}

	return [
		memoryDocuments.profile,
		memoryDocuments.operations,
	];
}

export function MemoriesSurfacePage() {
	const [wikiStatus, setWikiStatus] = useState<WikiStatus | null>(null);
	const [memoryDocuments, setMemoryDocuments] = useState<WikiCanonicalMemoryDocuments | null>(null);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [isSyncing, setIsSyncing] = useState(false);
	const [pendingProposalRemove, setPendingProposalRemove] = useState<WikiMemoryProposalSummary | null>(null);
	const [removingProposalId, setRemovingProposalId] = useState<string | null>(null);

	const contextCards = useMemo(
		() => buildContextCards(wikiStatus),
		[wikiStatus],
	);
	const canonicalMemoryCards = useMemo(
		() => buildCanonicalMemoryCards(memoryDocuments),
		[memoryDocuments],
	);
	const recentProposals = wikiStatus?.recentProposals ?? [];
	const proposalCounts = wikiStatus?.proposalCounts ?? {
		ingested: 0,
		queued: 0,
		total: 0,
	};

	async function refreshSurface() {
		setIsLoading(true);
		try {
			const [nextStatus, nextMemories] = await Promise.all([
				fetchWikiStatus(),
				fetchWikiMemories(),
			]);
			setWikiStatus(nextStatus);
			setMemoryDocuments(nextMemories);
			setErrorMessage(null);
		} catch (error) {
			setErrorMessage(error instanceof Error ? error.message : String(error));
		} finally {
			setIsLoading(false);
		}
	}

	async function handleSync() {
		setIsSyncing(true);
		try {
			await syncWiki(true);
			await refreshSurface();
			setErrorMessage(null);
		} catch (error) {
			setErrorMessage(error instanceof Error ? error.message : String(error));
		} finally {
			setIsSyncing(false);
		}
	}

	async function handleConfirmRemove() {
		if (!pendingProposalRemove) {
			return;
		}

		setRemovingProposalId(pendingProposalRemove.id);
		try {
			const response = await deleteWikiMemoryProposal(pendingProposalRemove.id);
			setMemoryDocuments(response.memories);
			setWikiStatus(response.wiki);
			setPendingProposalRemove(null);
			setErrorMessage(null);
		} catch (error) {
			setErrorMessage(error instanceof Error ? error.message : String(error));
		} finally {
			setRemovingProposalId(null);
		}
	}

	useEffect(() => {
		void refreshSurface();
	}, []);

	return (
		<>
			<ControlPlanePageShell
				description="Manage canonical wiki-backed memory, inspect compiled prompt context, and review raw memory sources."
				title="Memories"
				actions={
					<div className="flex items-center gap-2">
						<Badge variant="neutral">{proposalCounts.queued} queued</Badge>
						<Button variant="outline" onClick={() => void refreshSurface()} disabled={isLoading || isSyncing || removingProposalId !== null}>
							Refresh
						</Button>
						<Button onClick={() => void handleSync()} isLoading={isSyncing} disabled={isLoading || removingProposalId !== null}>
							Sync memory wiki
						</Button>
					</div>
				}
			>
				<div className="grid gap-4 lg:grid-cols-[1.02fr_0.98fr]">
					<div className="space-y-4">
						{errorMessage ? (
							<Card>
								<CardContent className="pt-4 text-sm text-text-danger">
									{errorMessage}
								</CardContent>
							</Card>
						) : null}

						<Card>
							<CardHeader>
								<CardTitle>Canonical memory</CardTitle>
								<CardDescription>
									These canonical wiki pages are the source of truth for durable memory. Remove raw memory sources below to refresh what stays in current memory.
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-3">
								{isLoading ? (
									<div className="rounded-xl border border-border bg-surface-raised px-3 py-8 text-center text-sm text-text-subtle">
										Loading canonical memory...
									</div>
								) : canonicalMemoryCards.length === 0 ? (
									<div className="rounded-xl border border-dashed border-border px-3 py-8 text-center text-sm text-text-subtle">
										No canonical memory documents are available yet.
									</div>
								) : (
									canonicalMemoryCards.map((document) => (
										<div key={document.scope} className="rounded-xl border border-border bg-surface-raised px-3 py-3">
											<div className="flex flex-wrap items-start justify-between gap-3">
												<div className="space-y-1">
													<div className="flex flex-wrap items-center gap-2">
														<div className="text-sm font-medium">{formatScopeLabel(document.scope)} source</div>
														<Badge variant="neutral">{document.blocks.length} blocks</Badge>
														<Lozenge variant="success">Canonical</Lozenge>
													</div>
													<div className="text-sm text-text-subtle">
														Sourced from the canonical wiki and compiled into Hermes prompt memory.
													</div>
												</div>
											</div>

											<div className="mt-3 grid gap-2 sm:grid-cols-2">
												<div className="rounded-lg border border-border bg-background px-3 py-2">
													<div className="text-xs uppercase tracking-wide text-text-subtle">Canonical path</div>
													<div className="mt-1 break-all text-sm font-medium">{document.canonicalPath}</div>
												</div>
												<div className="rounded-lg border border-border bg-background px-3 py-2">
													<div className="text-xs uppercase tracking-wide text-text-subtle">Updated</div>
													<div className="mt-1 text-sm font-medium">{formatControlPlaneDateTime(document.updatedAt)}</div>
												</div>
											</div>

											<div className="mt-3 space-y-3">
												{document.blocks.length === 0 ? (
													<div className="rounded-lg border border-dashed border-border px-3 py-6 text-center text-sm text-text-subtle">
														No durable memory blocks in this canonical page.
													</div>
												) : (
													document.blocks.map((block) => (
														<div key={block.id} className="rounded-lg border border-border bg-background px-3 py-3">
															<div className="flex flex-wrap items-center gap-2">
																<Badge variant="outline">{block.lineCount} lines</Badge>
																<Badge variant="neutral">{block.charCount.toLocaleString()} chars</Badge>
															</div>
															<ScrollArea className="mt-3 max-h-44 rounded-lg border border-border bg-surface-raised p-3 text-sm text-text-subtle">
																<pre className="whitespace-pre-wrap">{block.content}</pre>
															</ScrollArea>
														</div>
													))
												)}
											</div>
										</div>
									))
								)}
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle>Compiled context</CardTitle>
								<CardDescription>
									Hermes prompt context is generated from the canonical memory pages after ingest and manual curation.
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-3">
								{isLoading ? (
									<div className="rounded-xl border border-border bg-surface-raised px-3 py-8 text-center text-sm text-text-subtle">
										Loading compiled memory state...
									</div>
								) : contextCards.length === 0 ? (
									<div className="rounded-xl border border-dashed border-border px-3 py-8 text-center text-sm text-text-subtle">
										No compiled memory artifacts yet.
									</div>
								) : (
									contextCards.map(({ description, document, label }) => (
										<div key={label} className="rounded-xl border border-border bg-surface-raised px-3 py-3">
											<div className="flex items-start justify-between gap-3">
												<div className="space-y-1">
													<div className="text-sm font-medium">{label}</div>
													<div className="text-sm text-text-subtle">{description}</div>
												</div>
												<Lozenge variant={document.exists ? "success" : "warning"}>
													{document.exists ? "Compiled" : "Missing"}
												</Lozenge>
											</div>
											<div className="mt-3 grid gap-2 sm:grid-cols-2">
												<div className="rounded-lg border border-border bg-background px-3 py-2">
													<div className="text-xs uppercase tracking-wide text-text-subtle">Size</div>
													<div className="mt-1 text-sm font-medium">{document.charCount.toLocaleString()} chars</div>
												</div>
												<div className="rounded-lg border border-border bg-background px-3 py-2">
													<div className="text-xs uppercase tracking-wide text-text-subtle">Updated</div>
													<div className="mt-1 text-sm font-medium">{formatControlPlaneDateTime(document.updatedAt)}</div>
												</div>
											</div>
											<div className="mt-3 rounded-lg border border-border bg-background px-3 py-2 text-xs text-text-subtle">
												{document.path || "No artifact path yet."}
											</div>
											<ScrollArea className="mt-3 max-h-40 rounded-lg border border-border bg-background p-3 text-sm text-text-subtle">
												<pre className="whitespace-pre-wrap">{document.preview || "No preview available yet."}</pre>
											</ScrollArea>
										</div>
									))
								)}
							</CardContent>
						</Card>
					</div>

					<div className="space-y-4">
						<Card>
							<CardHeader className="pb-3">
								<CardTitle>Raw memory sources</CardTitle>
								<CardDescription>
									Completed turns create raw durable-memory sources in the wiki. Remove a source here to stop it from participating in current memory refreshes.
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-3">
								<div className="grid gap-3 sm:grid-cols-3">
									<div className="rounded-xl border border-border bg-surface-raised px-3 py-3">
										<div className="text-xs uppercase tracking-wide text-text-subtle">Queued</div>
										<div className="mt-2 text-lg font-semibold text-text">{proposalCounts.queued.toLocaleString()}</div>
									</div>
									<div className="rounded-xl border border-border bg-surface-raised px-3 py-3">
										<div className="text-xs uppercase tracking-wide text-text-subtle">Ingested</div>
										<div className="mt-2 text-lg font-semibold text-text">{proposalCounts.ingested.toLocaleString()}</div>
									</div>
									<div className="rounded-xl border border-border bg-surface-raised px-3 py-3">
										<div className="text-xs uppercase tracking-wide text-text-subtle">Total</div>
										<div className="mt-2 text-lg font-semibold text-text">{proposalCounts.total.toLocaleString()}</div>
									</div>
								</div>

								{recentProposals.length === 0 ? (
									<div className="rounded-xl border border-dashed border-border px-3 py-8 text-center text-sm text-text-subtle">
										No raw memory sources yet.
									</div>
								) : (
									recentProposals.map((proposal: WikiMemoryProposalSummary) => (
										<div key={proposal.id} className="rounded-xl border border-border bg-surface-raised px-3 py-3">
											<div className="flex flex-wrap items-start justify-between gap-3">
												<div className="flex flex-wrap items-center gap-2">
													<Lozenge variant={formatProposalTone(proposal.status)}>{proposal.status}</Lozenge>
													<Badge variant="neutral">{formatScopeLabel(proposal.scope)}</Badge>
													<Badge variant="outline">{proposal.action}</Badge>
												</div>
												<Button
													size="sm"
													variant="destructive"
													onClick={() => setPendingProposalRemove(proposal)}
													disabled={isLoading || isSyncing || removingProposalId !== null}
													isLoading={removingProposalId === proposal.id}
												>
													Remove
												</Button>
											</div>
											<div className="mt-3 text-sm font-medium">{proposal.summary || "Untitled proposal"}</div>
											<div className="mt-1 text-xs text-text-subtle">
												{formatControlPlaneDateTime(proposal.createdAt)} · {proposal.path}
											</div>
										</div>
									))
								)}
							</CardContent>
						</Card>
					</div>
				</div>
			</ControlPlanePageShell>

			<AlertDialog open={pendingProposalRemove !== null} onOpenChange={(open) => {
				if (!open) {
					setPendingProposalRemove(null);
				}
			}}>
				<AlertDialogContent size="sm">
					<AlertDialogHeader>
						<AlertDialogTitle>Remove memory source?</AlertDialogTitle>
						<AlertDialogDescription>
							This removes the raw proposal source. If it was already ingested, canonical memory and compiled context will be refreshed from the remaining raw sources.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<div className="rounded-lg border border-border bg-surface-raised px-3 py-3 text-sm text-text-subtle">
						<pre className="whitespace-pre-wrap">{pendingProposalRemove?.summary ?? ""}</pre>
					</div>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={removingProposalId !== null}>Cancel</AlertDialogCancel>
						<AlertDialogAction
							variant="destructive"
							onClick={() => void handleConfirmRemove()}
							disabled={removingProposalId !== null && removingProposalId !== pendingProposalRemove?.id}
							isLoading={removingProposalId === pendingProposalRemove?.id}
						>
							Remove source
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}
