"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import SearchIcon from "@atlaskit/icon/core/search";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Lozenge } from "@/components/ui/lozenge";
import { RefreshCwIcon } from "@/components/ui/vpk-icons";
import type {
	WikiQmdStatus,
	WikiSearchResponse,
	WikiSearchResult,
	WikiStatus,
} from "@/lib/rovo-runtime-types";
import { cn } from "@/lib/utils";

import { fetchWikiStatus, searchWiki, syncWiki } from "./lib/control-plane-api";
import { ControlPlanePageShell } from "./control-plane-page-shell";
import { formatControlPlaneDateTime } from "./lib/control-plane-utils";

function formatWikiCollectionLabel(collection: string | null): string {
	if (!collection) {
		return "Unknown";
	}

	return collection
		.replace(/^wiki-/u, "")
		.split("-")
		.map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
		.join(" ");
}

function formatWikiScore(score: number): string {
	return `${Math.round(score * 100)}%`;
}

function formatQmdTone(qmd: WikiQmdStatus | undefined): "danger" | "neutral" | "success" | "warning" {
	if (!qmd?.dbExists) {
		return "danger";
	}
	if (qmd.errorMessage) {
		return "danger";
	}
	if (qmd.stale) {
		return "warning";
	}
	return "success";
}

function formatQmdLabel(qmd: WikiQmdStatus | undefined): string {
	if (!qmd?.dbExists) {
		return "Index missing";
	}
	if (qmd.errorMessage) {
		return "Index error";
	}
	return qmd.stale ? "Needs sync" : "Fresh";
}

function buildResultKey(result: WikiSearchResult): string {
	return `${result.backend}:${result.path ?? result.title}`;
}

function resolveMemorySource(result: WikiSearchResult): {
	label: string;
	query: string;
	scope: "work" | "profile";
} | null {
	const normalizedPath = (result.path ?? "").toLowerCase();
	if (
		result.collection === "wiki-profiles"
		&& (
			normalizedPath.endsWith("/self.md")
			|| normalizedPath.endsWith("qmd://wiki-profiles/self.md")
			|| normalizedPath.endsWith("self.md")
		)
	) {
		return {
			label: "Profile memory source",
			query: "self",
			scope: "profile",
		};
	}

	if (
		result.collection === "wiki-work"
		&& (
			normalizedPath.endsWith("/context.md")
			|| normalizedPath.endsWith("qmd://wiki-work/context.md")
			|| normalizedPath.endsWith("context.md")
		)
	) {
		return {
			label: "Work memory source",
			query: "work context",
			scope: "work",
		};
	}

	return null;
}

export function WikiSurfacePage() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const [wikiStatus, setWikiStatus] = useState<WikiStatus | null>(null);
	const [query, setQuery] = useState("");
	const [results, setResults] = useState<WikiSearchResult[]>([]);
	const [searchBackend, setSearchBackend] = useState<WikiSearchResponse["backend"] | null>(null);
	const [selectedResultKey, setSelectedResultKey] = useState<string | null>(null);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [isSearching, setIsSearching] = useState(false);
	const [isSyncing, setIsSyncing] = useState(false);

	const selectedResult = useMemo(
		() => results.find((result) => buildResultKey(result) === selectedResultKey) ?? results[0] ?? null,
		[results, selectedResultKey],
	);
	const selectedMemorySource = useMemo(
		() => selectedResult ? resolveMemorySource(selectedResult) : null,
		[selectedResult],
	);

	async function refreshStatus() {
		const nextStatus = await fetchWikiStatus();
		setWikiStatus(nextStatus);
		return nextStatus;
	}

	async function handleSearch(submittedQuery?: string) {
		const effectiveQuery = (submittedQuery ?? query).trim();
		if (!effectiveQuery) {
			setResults([]);
			setSearchBackend(null);
			setSelectedResultKey(null);
			return;
		}

		setIsSearching(true);
		try {
			const response = await searchWiki(effectiveQuery, 12);
			setResults(response.results);
			setSearchBackend(response.backend);
			setSelectedResultKey(response.results[0] ? buildResultKey(response.results[0]) : null);
			setErrorMessage(null);
			await refreshStatus();
		} catch (error) {
			setErrorMessage(error instanceof Error ? error.message : String(error));
		} finally {
			setIsSearching(false);
		}
	}

	async function handleSync(force = true) {
		setIsSyncing(true);
		try {
			const response = await syncWiki(force);
			setWikiStatus((current) => current ? { ...current, qmd: response.qmd } : current);
			setErrorMessage(null);
			await refreshStatus();
			if (query.trim()) {
				await handleSearch(query);
			}
		} catch (error) {
			setErrorMessage(error instanceof Error ? error.message : String(error));
		} finally {
			setIsSyncing(false);
		}
	}

	useEffect(() => {
		let cancelled = false;

		async function load() {
			setIsLoading(true);
			try {
				const nextStatus = await fetchWikiStatus();
				if (!cancelled) {
					setWikiStatus(nextStatus);
					setErrorMessage(null);
				}
			} catch (error) {
				if (!cancelled) {
					setErrorMessage(error instanceof Error ? error.message : String(error));
				}
			} finally {
				if (!cancelled) {
					setIsLoading(false);
				}
			}
		}

		void load();
		return () => {
			cancelled = true;
		};
	}, []);

	useEffect(() => {
		let cancelled = false;
		const nextQuery = searchParams.get("q")?.trim() ?? "";
		setQuery(nextQuery);
		if (nextQuery) {
			async function searchFromUrl() {
				setIsSearching(true);
				try {
					const response = await searchWiki(nextQuery, 12);
					if (!cancelled) {
						setResults(response.results);
						setSearchBackend(response.backend);
						setSelectedResultKey(response.results[0] ? buildResultKey(response.results[0]) : null);
						setErrorMessage(null);
					}
					const nextStatus = await fetchWikiStatus();
					if (!cancelled) {
						setWikiStatus(nextStatus);
					}
				} catch (error) {
					if (!cancelled) {
						setErrorMessage(error instanceof Error ? error.message : String(error));
					}
				} finally {
					if (!cancelled) {
						setIsSearching(false);
					}
				}
			}

			void searchFromUrl();
			return () => {
				cancelled = true;
			};
		}

		setResults([]);
		setSearchBackend(null);
		setSelectedResultKey(null);
		return () => {
			cancelled = true;
		};
	}, [searchParams]);

	return (
		<ControlPlanePageShell
			description="Search the canonical wiki, inspect qmd freshness, and resync the local index plus queued memory proposals when source pages change."
			title="Wiki"
			actions={(
				<div className="flex items-center gap-2">
					<Badge variant="neutral">{wikiStatus?.qmd?.totalDocuments ?? 0} indexed docs</Badge>
					<Lozenge variant={formatQmdTone(wikiStatus?.qmd)}>{formatQmdLabel(wikiStatus?.qmd)}</Lozenge>
					<Button variant="outline" onClick={() => void refreshStatus()} disabled={isLoading || isSyncing}>
						Refresh status
					</Button>
					<Button onClick={() => void handleSync(true)} disabled={isLoading} isLoading={isSyncing}>
						Sync wiki
					</Button>
				</div>
			)}
		>
			<div className="grid gap-4 xl:grid-cols-[1.16fr_0.84fr]">
				<div className="space-y-4">
					<Card className="overflow-hidden">
						<CardHeader className="border-b border-border bg-surface-raised">
							<CardTitle className="flex items-center gap-2">
								<SearchIcon label="" spacing="none" />
								Search the wiki
							</CardTitle>
							<CardDescription>
								Query the canonical knowledge base with qmd hybrid search. If the index is stale, the backend refreshes it before serving results.
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4 pt-6">
							<form
								className="flex flex-col gap-3 sm:flex-row"
								onSubmit={(event) => {
									event.preventDefault();
									void handleSearch();
								}}
							>
								<Input
									className="h-11"
									placeholder="Search Atlassian products, concepts, pricing, migration, AI..."
									value={query}
									onChange={(event) => setQuery(event.target.value)}
								/>
								<Button className="h-11 min-w-28" type="submit" isLoading={isSearching}>
									Search
								</Button>
							</form>

							<div className="flex flex-wrap items-center gap-2 text-xs text-text-subtle">
								<span className="rounded-full border border-border bg-surface-raised px-2 py-1">Hybrid BM25 + vector</span>
								<span className="rounded-full border border-border bg-surface-raised px-2 py-1">Canonical pages only</span>
								<span className="rounded-full border border-border bg-surface-raised px-2 py-1">Automatic stale-index refresh</span>
							</div>
						</CardContent>
					</Card>

					{errorMessage ? (
						<Card>
							<CardContent className="pt-4 text-sm text-text-danger">{errorMessage}</CardContent>
						</Card>
					) : null}

					<Card>
						<CardHeader className="pb-3">
							<div className="flex items-start justify-between gap-3">
								<div className="space-y-1">
									<CardTitle>Results</CardTitle>
									<CardDescription>
										{searchBackend
											? `Showing ${results.length} result${results.length === 1 ? "" : "s"} from ${searchBackend === "qmd" ? "qmd" : "the fallback text matcher"}.`
											: "Run a search to see canonical wiki results here."}
									</CardDescription>
								</div>
								{searchBackend ? (
									<Lozenge variant={searchBackend === "qmd" ? "success" : "warning"}>
										{searchBackend}
									</Lozenge>
								) : null}
							</div>
						</CardHeader>
						<CardContent className="space-y-3">
							{!searchBackend ? (
								<div className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-text-subtle">
									Start with a topic, product, or question. The search surface only indexes canonical wiki pages.
								</div>
							) : results.length === 0 ? (
								<div className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-text-subtle">
									No results matched this query.
								</div>
							) : (
								results.map((result) => {
									const isSelected = buildResultKey(result) === (selectedResult ? buildResultKey(selectedResult) : null);
									return (
										<button
											key={buildResultKey(result)}
											type="button"
											className={cn(
												"w-full rounded-2xl border px-4 py-4 text-left transition-colors",
												isSelected
													? "border-border-selected bg-bg-selected"
													: "border-border bg-surface-raised hover:bg-bg-neutral-subtle-hovered",
											)}
											onClick={() => setSelectedResultKey(buildResultKey(result))}
										>
											<div className="flex flex-wrap items-start justify-between gap-3">
												<div className="min-w-0 flex-1">
													<div className="text-base font-semibold text-text">{result.title}</div>
													<div className="mt-2 flex flex-wrap items-center gap-2">
														<Badge variant="neutral">{formatWikiCollectionLabel(result.collection)}</Badge>
														<Lozenge variant={result.backend === "qmd" ? "success" : "warning"}>{result.backend}</Lozenge>
														<Badge variant="outline">{formatWikiScore(result.score)}</Badge>
													</div>
												</div>
												<div className="max-w-full truncate rounded-full border border-border bg-background px-2 py-1 text-[11px] text-text-subtle">
													{result.path ?? "Unknown path"}
												</div>
											</div>
											<p className="mt-3 text-sm leading-6 text-text-subtle">{result.snippet}</p>
										</button>
									);
								})
							)}
						</CardContent>
					</Card>
				</div>

				<div className="space-y-4">
					<Card>
						<CardHeader className="pb-3">
							<CardTitle>Selected result</CardTitle>
							<CardDescription>Inspect the currently highlighted wiki match.</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							{selectedResult ? (
								<>
									<div className="space-y-2">
										<div className="text-lg font-semibold text-text">{selectedResult.title}</div>
										<div className="flex flex-wrap items-center gap-2">
											<Badge variant="neutral">{formatWikiCollectionLabel(selectedResult.collection)}</Badge>
											<Lozenge variant={selectedResult.backend === "qmd" ? "success" : "warning"}>
												{selectedResult.backend}
											</Lozenge>
											<Badge variant="outline">{formatWikiScore(selectedResult.score)}</Badge>
											{selectedMemorySource ? (
												<Badge variant="neutral">{selectedMemorySource.label}</Badge>
											) : null}
										</div>
									</div>
									<div className="rounded-xl border border-border bg-surface-raised px-3 py-3 font-mono text-xs text-text-subtle">
										{selectedResult.path ?? "Unknown path"}
									</div>
									<p className="text-sm leading-6 text-text-subtle">{selectedResult.snippet}</p>
									{selectedMemorySource ? (
										<div className="rounded-xl border border-border bg-surface-raised px-3 py-3">
											<div className="flex flex-wrap items-start justify-between gap-3">
												<div className="space-y-1">
													<div className="text-sm font-medium">Canonical memory page</div>
													<div className="text-sm text-text-subtle">
														This page is the source of truth for durable memory. Compiled prompt memory and manual remove controls live in the memories surface.
													</div>
												</div>
												<Button
													size="sm"
													variant="outline"
													onClick={() => router.push(`/rovo-app/memories`)}
												>
													Open memories
												</Button>
											</div>
										</div>
									) : null}
								</>
							) : (
								<div className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-text-subtle">
									Select a result to inspect it here.
								</div>
							)}
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="pb-3">
							<CardTitle>Index health</CardTitle>
							<CardDescription>Workspace-local qmd status for the canonical wiki corpus.</CardDescription>
						</CardHeader>
						<CardContent className="space-y-3">
							<div className="grid gap-3 sm:grid-cols-2">
								<div className="rounded-xl border border-border bg-surface-raised px-3 py-3">
									<div className="text-xs uppercase tracking-wide text-text-subtle">Qmd status</div>
									<div className="mt-2 flex items-center gap-2">
										<Lozenge variant={formatQmdTone(wikiStatus?.qmd)}>{formatQmdLabel(wikiStatus?.qmd)}</Lozenge>
										<Badge variant="neutral">{wikiStatus?.qmd?.totalDocuments ?? 0} docs</Badge>
									</div>
								</div>
								<div className="rounded-xl border border-border bg-surface-raised px-3 py-3">
									<div className="text-xs uppercase tracking-wide text-text-subtle">Needs embedding</div>
									<div className="mt-2 text-sm font-medium">{(wikiStatus?.qmd?.needsEmbedding ?? 0).toLocaleString()}</div>
								</div>
							</div>

							<div className="rounded-xl border border-border bg-surface-raised px-3 py-3">
								<div className="grid gap-3">
									<div className="flex items-center justify-between gap-3">
										<span className="text-sm text-text-subtle">Last qmd sync</span>
										<span className="text-sm font-medium">{formatControlPlaneDateTime(wikiStatus?.qmd?.lastSyncedAt)}</span>
									</div>
									<div className="flex items-center justify-between gap-3">
										<span className="text-sm text-text-subtle">Latest wiki edit</span>
										<span className="text-sm font-medium">{formatControlPlaneDateTime(wikiStatus?.qmd?.latestCanonicalUpdateAt)}</span>
									</div>
									<div className="flex items-center justify-between gap-3">
										<span className="text-sm text-text-subtle">Index path</span>
										<span className="max-w-[16rem] truncate text-right font-mono text-xs text-text">{wikiStatus?.qmd?.dbPath || "Unavailable"}</span>
									</div>
								</div>
							</div>

							<div className="rounded-xl border border-border bg-surface-raised px-3 py-3">
								<div className="text-xs uppercase tracking-wide text-text-subtle">Collections</div>
								<div className="mt-3 flex flex-wrap gap-2">
									{(wikiStatus?.qmd?.collections ?? []).length > 0 ? (
										(wikiStatus?.qmd?.collections ?? []).map((collection) => (
											<Badge key={collection} variant="outline">{formatWikiCollectionLabel(collection)}</Badge>
										))
									) : (
										<span className="text-sm text-text-subtle">No qmd collections indexed yet.</span>
									)}
								</div>
							</div>

							{wikiStatus?.qmd?.errorMessage ? (
								<div className="rounded-xl border border-border-danger bg-background px-3 py-3 text-sm text-text-danger">
									{wikiStatus.qmd.errorMessage}
								</div>
							) : null}
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="pb-3">
							<CardTitle>Wiki corpus</CardTitle>
							<CardDescription>Canonical vs raw wiki coverage from the current workspace snapshot.</CardDescription>
						</CardHeader>
						<CardContent className="space-y-3">
							<div className="grid gap-3 sm:grid-cols-2">
								<div className="rounded-xl border border-border bg-surface-raised px-3 py-3">
									<div className="text-xs uppercase tracking-wide text-text-subtle">Canonical pages</div>
									<div className="mt-2 text-lg font-semibold text-text">{(wikiStatus?.totalCanonicalPages ?? 0).toLocaleString()}</div>
								</div>
								<div className="rounded-xl border border-border bg-surface-raised px-3 py-3">
									<div className="text-xs uppercase tracking-wide text-text-subtle">Raw captures</div>
									<div className="mt-2 text-lg font-semibold text-text">{(wikiStatus?.totalRawCaptures ?? 0).toLocaleString()}</div>
								</div>
							</div>
							<div className="flex items-center gap-2">
								<RefreshCwIcon className="size-4 text-icon-subtle" />
								<span className="text-sm text-text-subtle">
									Manual edits to canonical pages are picked up automatically the next time search runs. Use
									{" "}
									<strong>Sync wiki</strong>
									{" "}
									to force a refresh immediately and process queued memory proposals.
								</span>
							</div>
						</CardContent>
					</Card>
				</div>
			</div>
		</ControlPlanePageShell>
	);
}
