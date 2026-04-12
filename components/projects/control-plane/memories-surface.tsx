"use client";

import { useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Lozenge } from "@/components/ui/lozenge";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { WikiCompiledContextDocument, WikiMemoryProposalSummary, WikiStatus } from "@/lib/rovo-runtime-types";

import { fetchWikiStatus, syncWiki } from "./lib/control-plane-api";
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

export function MemoriesSurfacePage() {
	const [wikiStatus, setWikiStatus] = useState<WikiStatus | null>(null);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [isSyncing, setIsSyncing] = useState(false);

	const contextCards = useMemo(
		() => buildContextCards(wikiStatus),
		[wikiStatus],
	);
	const recentProposals = wikiStatus?.recentProposals ?? [];
	const proposalCounts = wikiStatus?.proposalCounts ?? {
		ingested: 0,
		queued: 0,
		total: 0,
	};

	async function refreshStatus() {
		setIsLoading(true);
		try {
			const nextStatus = await fetchWikiStatus();
			setWikiStatus(nextStatus);
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
			await refreshStatus();
			setErrorMessage(null);
		} catch (error) {
			setErrorMessage(error instanceof Error ? error.message : String(error));
		} finally {
			setIsSyncing(false);
		}
	}

	useEffect(() => {
		void refreshStatus();
	}, []);

	return (
		<ControlPlanePageShell
			description="Read the compiled wiki-backed memory context and inspect queued durable-memory proposals."
			title="Memories"
			actions={
				<div className="flex items-center gap-2">
					<Badge variant="neutral">{proposalCounts.queued} queued</Badge>
					<Button variant="outline" onClick={() => void refreshStatus()} disabled={isLoading || isSyncing}>
						Refresh
					</Button>
					<Button onClick={() => void handleSync()} isLoading={isSyncing} disabled={isLoading}>
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
							<CardTitle>Compiled context</CardTitle>
							<CardDescription>
								Hermes prompt context is now generated from canonical wiki pages after ingest.
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
							<CardTitle>Proposal queue</CardTitle>
							<CardDescription>
								Completed turns enqueue durable-memory proposals into the wiki rather than editing files directly.
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
									No memory proposals yet.
								</div>
							) : (
								recentProposals.map((proposal: WikiMemoryProposalSummary) => (
									<div key={proposal.id} className="rounded-xl border border-border bg-surface-raised px-3 py-3">
										<div className="flex flex-wrap items-center gap-2">
											<Lozenge variant={formatProposalTone(proposal.status)}>{proposal.status}</Lozenge>
											<Badge variant="neutral">{formatScopeLabel(proposal.scope)}</Badge>
											<Badge variant="outline">{proposal.action}</Badge>
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
	);
}
