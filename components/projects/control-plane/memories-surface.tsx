"use client";

import { startTransition, useEffect, useMemo, useState, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
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
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Input } from "@/components/ui/input";
import { Lozenge } from "@/components/ui/lozenge";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { ControlPlanePageShell } from "./control-plane-page-shell";
import {
	deleteWikiMemoryBlock,
	deleteWikiMemoryProposal,
	fetchWikiMemories,
	fetchWikiMemoryExplorer,
	generateWikiMemoryBrief,
	generateWikiMemoryDeck,
	syncWiki,
} from "./lib/control-plane-api";
import { formatControlPlaneDateTime } from "./lib/control-plane-utils";
import { API_ENDPOINTS } from "@/lib/api-config";
import type {
	WikiCanonicalMemoryBlock,
	WikiCanonicalMemoryDocument,
	WikiCanonicalMemoryDocuments,
	WikiMemoryExplorerEdge,
	WikiMemoryExplorerFacet,
	WikiMemoryExplorerFilters,
	WikiMemoryExplorerNode,
	WikiMemoryExplorerResponse,
	WikiMemoryGeneratedArtifact,
	WikiMemoryProposalSummary,
} from "@/lib/rovo-runtime-types";
import DatabaseIcon from "@atlaskit/icon/core/database";
import DownloadIcon from "@atlaskit/icon/core/download";
import BranchIcon from "@atlaskit/icon/core/branch";
import PageIcon from "@atlaskit/icon/core/page";
import RefreshIcon from "@atlaskit/icon/core/refresh";
import CopyIcon from "@atlaskit/icon/core/copy";
import TableIcon from "@atlaskit/icon/core/table";
import { cn } from "@/lib/utils";

const MemoryExplorerSigmaGraph = dynamic(
	() => import("./memory-explorer-sigma-graph").then((module) => module.MemoryExplorerSigmaGraph),
	{ ssr: false },
);

type ExplorerView = "brief" | "deck" | "graph" | "table" | "timeline";

type FilterState = {
	includeLinkedKnowledge: boolean;
	kind: string;
	scope: string;
	status: string;
	tag: string;
	threadId: string;
};

type PendingBlockRemoval = {
	block: WikiCanonicalMemoryBlock;
	document: WikiCanonicalMemoryDocument;
};

const EXPLORER_VIEWS: Array<{ icon: ReactNode; label: string; value: ExplorerView }> = [
	{ icon: <BranchIcon label="" />, label: "Graph", value: "graph" },
	{ icon: <TableIcon label="" />, label: "Table", value: "table" },
	{ icon: <RefreshIcon label="" />, label: "Timeline", value: "timeline" },
	{ icon: <PageIcon label="" />, label: "Brief", value: "brief" },
	{ icon: <DownloadIcon label="" />, label: "Deck", value: "deck" },
];

const TIMELINE_CHART_CONFIG = {
	created: {
		color: "var(--ds-chart-categorical-2)",
		label: "Created",
	},
	updated: {
		color: "var(--ds-chart-categorical-1)",
		label: "Updated",
	},
} satisfies ChartConfig;

function formatScopeLabel(scope: string | null | undefined): string {
	if (scope === "profile") {
		return "Profile";
	}
	if (scope === "work") {
		return "Work";
	}
	return scope ?? "Global";
}

function formatNodeKindLabel(kind: WikiMemoryExplorerNode["kind"]): string {
	if (kind === "canonical-memory") {
		return "Canonical";
	}
	if (kind === "compiled-context") {
		return "Compiled";
	}
	if (kind === "raw-proposal") {
		return "Proposal";
	}
	return "Knowledge";
}

function formatEdgeKindLabel(kind: WikiMemoryExplorerEdge["kind"]): string {
	return kind.replace(/_/gu, " ");
}

function formatProposalTone(status: string | null | undefined): "danger" | "neutral" | "success" | "warning" {
	if (status === "ingested") {
		return "success";
	}
	if (status === "queued") {
		return "warning";
	}
	return "neutral";
}

function getScopeDocument(
	memoryDocuments: WikiCanonicalMemoryDocuments | null,
	scope: string | null | undefined,
): WikiCanonicalMemoryDocument | null {
	if (!memoryDocuments || !scope) {
		return null;
	}
	return scope === "profile" ? memoryDocuments.profile : scope === "work" ? memoryDocuments.work : null;
}

function buildInitialFilterState(searchParams: { get(name: string): string | null } | null): FilterState {
	return {
		includeLinkedKnowledge: searchParams?.get("includeLinkedKnowledge") !== "false",
		kind: searchParams?.get("kind") ?? "all",
		scope: searchParams?.get("scope") ?? "all",
		status: searchParams?.get("status") ?? "all",
		tag: searchParams?.get("tag") ?? "",
		threadId: searchParams?.get("threadId") ?? "",
	};
}

function buildExplorerFilterInput(filters: FilterState): Partial<WikiMemoryExplorerFilters> {
	return {
		includeLinkedKnowledge: filters.includeLinkedKnowledge,
		kind: filters.kind === "all" ? null : filters.kind,
		scope: filters.scope === "all" ? null : filters.scope,
		status: filters.status === "all" ? null : filters.status,
		tag: filters.tag.trim() || null,
		threadId: filters.threadId.trim() || null,
	};
}

function buildTimelineSeries(explorer: WikiMemoryExplorerResponse) {
	const buckets = new Map<string, { created: number; updated: number; label: string }>();

	for (const node of explorer.nodes) {
		const createdAt = (node.createdAt ?? "").slice(0, 10);
		if (createdAt) {
			const existing = buckets.get(createdAt) ?? { created: 0, label: createdAt, updated: 0 };
			existing.created += 1;
			buckets.set(createdAt, existing);
		}

		const updatedAt = (node.updatedAt ?? "").slice(0, 10);
		if (updatedAt) {
			const existing = buckets.get(updatedAt) ?? { created: 0, label: updatedAt, updated: 0 };
			existing.updated += 1;
			buckets.set(updatedAt, existing);
		}
	}

	return Array.from(buckets.values()).sort((left, right) => left.label.localeCompare(right.label));
}

function createDownload(fileName: string, content: BlobPart, contentType: string) {
	const url = window.URL.createObjectURL(new Blob([content], { type: contentType }));
	const anchor = document.createElement("a");
	anchor.href = url;
	anchor.download = fileName;
	anchor.click();
	window.URL.revokeObjectURL(url);
}

export function MemoriesSurfacePage() {
	const searchParams = useSearchParams();
	const [explorer, setExplorer] = useState<WikiMemoryExplorerResponse | null>(null);
	const [memoryDocuments, setMemoryDocuments] = useState<WikiCanonicalMemoryDocuments | null>(null);
	const [filters, setFilters] = useState<FilterState>(() => buildInitialFilterState(searchParams));
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [isSyncing, setIsSyncing] = useState(false);
	const [activeView, setActiveView] = useState<ExplorerView>("graph");
	const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
	const [pendingProposalRemove, setPendingProposalRemove] = useState<WikiMemoryProposalSummary | null>(null);
	const [pendingBlockRemove, setPendingBlockRemove] = useState<PendingBlockRemoval | null>(null);
	const [removingKey, setRemovingKey] = useState<string | null>(null);
	const [briefArtifact, setBriefArtifact] = useState<WikiMemoryGeneratedArtifact | null>(null);
	const [deckArtifact, setDeckArtifact] = useState<WikiMemoryGeneratedArtifact | null>(null);
	const [isGeneratingBrief, setIsGeneratingBrief] = useState(false);
	const [isGeneratingDeck, setIsGeneratingDeck] = useState(false);

	const filterInput = useMemo(() => buildExplorerFilterInput(filters), [filters]);
	const selectedNode = useMemo(
		() => explorer?.nodes.find((node) => node.id === selectedNodeId) ?? explorer?.nodes[0] ?? null,
		[explorer?.nodes, selectedNodeId],
	);
	const selectedCanonicalDocument = useMemo(
		() => getScopeDocument(memoryDocuments, selectedNode?.scope),
		[memoryDocuments, selectedNode?.scope],
	);
	const timelineSeries = useMemo(
		() => (explorer ? buildTimelineSeries(explorer) : []),
		[explorer],
	);
	async function refreshExplorer(nextFilters = filterInput) {
		setIsLoading(true);
		try {
			const [nextExplorer, nextMemories] = await Promise.all([
				fetchWikiMemoryExplorer(nextFilters),
				fetchWikiMemories(),
			]);
			setExplorer(nextExplorer);
			setMemoryDocuments(nextMemories);
			setErrorMessage(null);
			startTransition(() => {
				setSelectedNodeId((current) => nextExplorer.nodes.some((node) => node.id === current) ? current : nextExplorer.nodes[0]?.id ?? null);
			});
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
			await refreshExplorer(filterInput);
			setErrorMessage(null);
		} catch (error) {
			setErrorMessage(error instanceof Error ? error.message : String(error));
		} finally {
			setIsSyncing(false);
		}
	}

	async function handleConfirmProposalRemove() {
		if (!pendingProposalRemove) {
			return;
		}

		setRemovingKey(`proposal:${pendingProposalRemove.id}`);
		try {
			await deleteWikiMemoryProposal(pendingProposalRemove.id);
			setPendingProposalRemove(null);
			await refreshExplorer(filterInput);
		} catch (error) {
			setErrorMessage(error instanceof Error ? error.message : String(error));
		} finally {
			setRemovingKey(null);
		}
	}

	async function handleConfirmBlockRemove() {
		if (!pendingBlockRemove) {
			return;
		}

		setRemovingKey(`block:${pendingBlockRemove.block.id}`);
		try {
			await deleteWikiMemoryBlock(
				pendingBlockRemove.document.scope,
				pendingBlockRemove.block.id,
				pendingBlockRemove.document.revision,
			);
			setPendingBlockRemove(null);
			await refreshExplorer(filterInput);
		} catch (error) {
			setErrorMessage(error instanceof Error ? error.message : String(error));
		} finally {
			setRemovingKey(null);
		}
	}

	async function refreshGeneratedArtifact(kind: "brief" | "deck") {
		if (!explorer) {
			return;
		}

		const selectedNodeIds = selectedNode ? [selectedNode.id] : [];
		try {
			if (kind === "brief") {
				setIsGeneratingBrief(true);
				const nextBrief = await generateWikiMemoryBrief({
					filters: filterInput,
					selectedNodeIds,
					title: selectedNode ? `${selectedNode.title} brief` : "Memory Brief",
				});
				setBriefArtifact(nextBrief);
				return;
			}

			setIsGeneratingDeck(true);
			const nextDeck = await generateWikiMemoryDeck({
				filters: filterInput,
				selectedNodeIds,
				title: selectedNode ? `${selectedNode.title} deck` : "Memory Explorer Deck",
			});
			setDeckArtifact(nextDeck);
		} catch (error) {
			setErrorMessage(error instanceof Error ? error.message : String(error));
		} finally {
			setIsGeneratingBrief(false);
			setIsGeneratingDeck(false);
		}
	}

	async function handleDownloadExport(format: "csv" | "json") {
		try {
			const response = await fetch(API_ENDPOINTS.wikiMemoryExplorerExport(format, filterInput), { method: "GET" });
			if (!response.ok) {
				throw new Error(await response.text());
			}
			const blob = await response.blob();
			const url = window.URL.createObjectURL(blob);
			const anchor = document.createElement("a");
			anchor.href = url;
			anchor.download = `memory-explorer.${format}`;
			anchor.click();
			window.URL.revokeObjectURL(url);
		} catch (error) {
			setErrorMessage(error instanceof Error ? error.message : String(error));
		}
	}

	useEffect(() => {
		const nextFilters = buildInitialFilterState(searchParams);
		setFilters((current) => {
			const nextFilterKey = JSON.stringify(nextFilters);
			const currentFilterKey = JSON.stringify(current);
			return nextFilterKey === currentFilterKey ? current : nextFilters;
		});
	}, [searchParams]);

	useEffect(() => {
		void refreshExplorer(filterInput);
		setBriefArtifact(null);
		setDeckArtifact(null);
		// eslint-disable-next-line react-hooks/exhaustive-deps -- filters are fully represented by filterInput
	}, [filterInput.kind, filterInput.scope, filterInput.status, filterInput.tag, filterInput.threadId, filterInput.includeLinkedKnowledge]);

	useEffect(() => {
		setBriefArtifact(null);
		setDeckArtifact(null);
	}, [selectedNodeId]);

	useEffect(() => {
		if (activeView === "brief" && !briefArtifact && !isGeneratingBrief) {
			void refreshGeneratedArtifact("brief");
		}
		if (activeView === "deck" && !deckArtifact && !isGeneratingDeck) {
			void refreshGeneratedArtifact("deck");
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps -- generation should only follow active view and explorer selection state
	}, [activeView, selectedNodeId, explorer?.generatedAt]);

	return (
		<>
			<ControlPlanePageShell
				description="Explore durable memory as a visual network, inspect canonical blocks, filter raw proposals, and generate derived briefs or Marp decks from the same memory graph."
				title="Memories"
				actions={(
					<div className="flex flex-wrap items-center gap-2">
						<Badge variant="neutral">{explorer?.stats.nodeCount ?? 0} visible nodes</Badge>
						<Badge variant="outline">{explorer?.stats.edgeCount ?? 0} visible edges</Badge>
						<Button
							variant="outline"
							onClick={() => void refreshExplorer(filterInput)}
							disabled={isLoading || isSyncing || removingKey !== null}
						>
							<RefreshIcon label="" />
							Refresh
						</Button>
						<Button
							variant="outline"
							onClick={() => void handleDownloadExport("json")}
							disabled={isLoading}
						>
							<DownloadIcon label="" />
							JSON
						</Button>
						<Button
							variant="outline"
							onClick={() => void handleDownloadExport("csv")}
							disabled={isLoading}
						>
							<DownloadIcon label="" />
							CSV
						</Button>
						<Button onClick={() => void handleSync()} isLoading={isSyncing} disabled={isLoading || removingKey !== null}>
							Sync memory wiki
						</Button>
					</div>
				)}
			>
				{errorMessage ? (
					<Card>
						<CardContent className="pt-4 text-sm text-text-danger">
							{errorMessage}
						</CardContent>
					</Card>
				) : null}

				<div className="grid gap-4 xl:grid-cols-[280px_minmax(0,1fr)_360px]">
					<Card className="overflow-hidden border-border bg-linear-to-b from-background to-surface-raised">
						<CardHeader className="border-b border-border/70">
							<CardTitle className="flex items-center gap-2">
								<DatabaseIcon label="" />
								Explorer filters
							</CardTitle>
							<CardDescription>
								Dataview-style metadata filters for the visual memory graph.
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4 pt-4">
							<div className="space-y-2">
								<div className="text-xs font-semibold uppercase tracking-[0.18em] text-text-subtlest">Scope</div>
								<Select value={filters.scope} onValueChange={(value) => setFilters((current) => ({ ...current, scope: value ?? "all" }))}>
									<SelectTrigger className="w-full">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="all">All scopes</SelectItem>
										<SelectItem value="profile">Profile</SelectItem>
										<SelectItem value="work">Work</SelectItem>
									</SelectContent>
								</Select>
							</div>

							<div className="space-y-2">
								<div className="text-xs font-semibold uppercase tracking-[0.18em] text-text-subtlest">Kind</div>
								<Select value={filters.kind} onValueChange={(value) => setFilters((current) => ({ ...current, kind: value ?? "all" }))}>
									<SelectTrigger className="w-full">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="all">All node kinds</SelectItem>
										{explorer?.facets.kinds.map((facet) => (
											<SelectItem key={facet.value} value={facet.value}>
												{facet.label} ({facet.count})
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>

							<div className="space-y-2">
								<div className="text-xs font-semibold uppercase tracking-[0.18em] text-text-subtlest">Status</div>
								<Select value={filters.status} onValueChange={(value) => setFilters((current) => ({ ...current, status: value ?? "all" }))}>
									<SelectTrigger className="w-full">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="all">All statuses</SelectItem>
										{explorer?.facets.statuses.map((facet) => (
											<SelectItem key={facet.value} value={facet.value}>
												{facet.label} ({facet.count})
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>

							<div className="space-y-2">
								<div className="text-xs font-semibold uppercase tracking-[0.18em] text-text-subtlest">Thread</div>
								<Input
									placeholder="thread id"
									value={filters.threadId}
									onChange={(event) => setFilters((current) => ({ ...current, threadId: event.currentTarget.value }))}
								/>
							</div>

							<div className="space-y-2">
								<div className="text-xs font-semibold uppercase tracking-[0.18em] text-text-subtlest">Tag</div>
								<Input
									placeholder="memory tag"
									value={filters.tag}
									onChange={(event) => setFilters((current) => ({ ...current, tag: event.currentTarget.value }))}
								/>
							</div>

							<div className="rounded-2xl border border-border bg-background/75 p-3">
								<div className="flex items-center justify-between gap-2">
									<div>
										<div className="text-sm font-medium">Linked knowledge</div>
										<div className="text-xs text-text-subtle">
											Pull connected entity, concept, comparison, query, and synthesis pages into the graph.
										</div>
									</div>
									<Button
										size="sm"
										variant={filters.includeLinkedKnowledge ? "default" : "outline"}
										onClick={() => setFilters((current) => ({ ...current, includeLinkedKnowledge: !current.includeLinkedKnowledge }))}
									>
										{filters.includeLinkedKnowledge ? "On" : "Off"}
									</Button>
								</div>
							</div>

							<Separator />

							<div className="space-y-2">
								<div className="text-xs font-semibold uppercase tracking-[0.18em] text-text-subtlest">Top tags</div>
								<div className="flex flex-wrap gap-1.5">
									{explorer?.facets.tags.slice(0, 12).map((facet: WikiMemoryExplorerFacet) => (
										<button
											type="button"
											key={facet.value}
											onClick={() => setFilters((current) => ({ ...current, tag: facet.value }))}
											className={cn(
												"rounded-full border px-2.5 py-1 text-xs transition-colors",
												filters.tag === facet.value
													? "border-border-selected bg-bg-selected text-text-selected"
													: "border-border bg-surface-raised text-text-subtle hover:bg-bg-neutral-subtle-hovered",
											)}
										>
											#{facet.label} <span className="text-text-subtlest">{facet.count}</span>
										</button>
									))}
								</div>
							</div>

							<Button
								variant="ghost"
								onClick={() => setFilters({
									includeLinkedKnowledge: true,
									kind: "all",
									scope: "all",
									status: "all",
									tag: "",
									threadId: "",
								})}
							>
								Reset filters
							</Button>
						</CardContent>
					</Card>

					<div className="space-y-4 min-w-0">
						<Card className="overflow-hidden border-border bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.16),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(20,184,166,0.12),transparent_35%),linear-gradient(180deg,rgba(255,255,255,0.7),rgba(248,250,252,0.98))]">
							<CardHeader className="border-b border-border/70">
								<div className="flex flex-wrap items-start justify-between gap-3">
									<div className="space-y-1">
										<CardTitle className="flex items-center gap-2">
											<BranchIcon label="" />
											Memory explorer
										</CardTitle>
										<CardDescription>
											Graph-first preview inspired by Obsidian/wiki-os, backed by the live Hermes memory corpus.
										</CardDescription>
									</div>
									<div className="flex flex-wrap gap-2">
										<Badge variant="neutral">{explorer?.stats.visibleKindCounts["canonical-memory"] ?? 0} canonical</Badge>
										<Badge variant="neutral">{explorer?.stats.visibleKindCounts["raw-proposal"] ?? 0} proposals</Badge>
										<Badge variant="neutral">{explorer?.stats.visibleKindCounts["linked-knowledge"] ?? 0} knowledge</Badge>
									</div>
								</div>
							</CardHeader>
							<CardContent className="pt-4">
								<Tabs value={activeView} onValueChange={(value) => setActiveView(value as ExplorerView)}>
									<TabsList variant="line" className="w-full justify-start overflow-x-auto">
										{EXPLORER_VIEWS.map((view) => (
											<TabsTrigger key={view.value} value={view.value}>
												{view.icon}
												{view.label}
											</TabsTrigger>
										))}
									</TabsList>

									<TabsContent value="graph" className="mt-4">
										<MemoryExplorerSigmaGraph
											explorer={explorer}
											isLoading={isLoading}
											onSelectNode={setSelectedNodeId}
											selectedNodeId={selectedNodeId}
										/>
									</TabsContent>

									<TabsContent value="table" className="mt-4">
										<Card className="border-border bg-background/80">
											<CardContent className="pt-4">
												<Table>
													<TableHeader>
														<TableRow>
															<TableHead>Title</TableHead>
															<TableHead>Kind</TableHead>
															<TableHead>Scope</TableHead>
															<TableHead>Status</TableHead>
															<TableHead>Tags</TableHead>
															<TableHead>Updated</TableHead>
														</TableRow>
													</TableHeader>
													<TableBody>
														{explorer?.nodes.map((node) => (
															<TableRow
																key={node.id}
																data-state={selectedNode?.id === node.id ? "selected" : undefined}
																className="cursor-pointer"
																onClick={() => setSelectedNodeId(node.id)}
															>
																<TableCell className="max-w-[240px] whitespace-normal">
																	<div className="font-medium">{node.title}</div>
																	<div className="text-xs text-text-subtle">{node.relativePath}</div>
																</TableCell>
																<TableCell>
																	<Lozenge variant={node.kind === "raw-proposal" ? "warning" : node.kind === "compiled-context" ? "success" : node.kind === "canonical-memory" ? "information" : "neutral"}>
																		{formatNodeKindLabel(node.kind)}
																	</Lozenge>
																</TableCell>
																<TableCell>{formatScopeLabel(node.scope)}</TableCell>
																<TableCell>{node.status ? <Lozenge variant={formatProposalTone(node.status)}>{node.status}</Lozenge> : "—"}</TableCell>
																<TableCell className="max-w-[220px] whitespace-normal">
																	<div className="flex flex-wrap gap-1">
																		{node.tags.slice(0, 4).map((tag) => (
																			<Badge key={tag} variant="neutral">{tag}</Badge>
																		))}
																	</div>
																</TableCell>
																<TableCell>{formatControlPlaneDateTime(node.updatedAt)}</TableCell>
															</TableRow>
														))}
													</TableBody>
												</Table>
											</CardContent>
										</Card>
									</TabsContent>

									<TabsContent value="timeline" className="mt-4">
										<div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
											<Card className="border-border bg-background/80">
												<CardHeader>
													<CardTitle>Memory activity timeline</CardTitle>
													<CardDescription>
														Created and updated memory nodes over time across the visible explorer set.
													</CardDescription>
												</CardHeader>
												<CardContent>
													{timelineSeries.length > 0 ? (
														<ChartContainer config={TIMELINE_CHART_CONFIG} className="h-[320px] w-full">
															<AreaChart data={timelineSeries}>
																<CartesianGrid vertical={false} />
																<XAxis dataKey="label" tickLine={false} axisLine={false} />
																<YAxis tickLine={false} axisLine={false} allowDecimals={false} />
																<ChartTooltip content={<ChartTooltipContent indicator="line" />} />
																<Area type="monotone" dataKey="updated" stroke="var(--color-updated)" fill="var(--color-updated)" fillOpacity={0.16} />
																<Area type="monotone" dataKey="created" stroke="var(--color-created)" fill="var(--color-created)" fillOpacity={0.12} />
															</AreaChart>
														</ChartContainer>
													) : (
														<div className="rounded-2xl border border-dashed border-border px-4 py-14 text-center text-sm text-text-subtle">
															No timestamped activity is available for the current filters.
														</div>
													)}
												</CardContent>
											</Card>
											<Card className="border-border bg-background/80">
												<CardHeader>
													<CardTitle>Recent node updates</CardTitle>
													<CardDescription>
														A quick read on what changed most recently in the visible memory set.
													</CardDescription>
												</CardHeader>
												<CardContent className="space-y-3">
													{explorer?.nodes.slice(0, 8).map((node) => (
														<div key={node.id} className="rounded-2xl border border-border bg-surface-raised px-3 py-3">
															<div className="flex items-center justify-between gap-3">
																<div className="min-w-0">
																	<div className="truncate font-medium">{node.title}</div>
																	<div className="text-xs text-text-subtle">{node.relativePath}</div>
																</div>
																<Lozenge variant={formatProposalTone(node.status)}>{node.status ?? formatNodeKindLabel(node.kind)}</Lozenge>
															</div>
															<div className="mt-2 text-sm text-text-subtle">{node.summary || node.bodyPreview || "No preview."}</div>
														</div>
													))}
												</CardContent>
											</Card>
										</div>
									</TabsContent>

									<TabsContent value="brief" className="mt-4">
										<Card className="border-border bg-background/80">
											<CardHeader>
												<div className="flex flex-wrap items-start justify-between gap-3">
													<div>
														<CardTitle>Derived brief</CardTitle>
														<CardDescription>
															A markdown brief generated from the selected node or current filtered explorer view.
														</CardDescription>
													</div>
													<div className="flex gap-2">
														<Button variant="outline" onClick={() => void refreshGeneratedArtifact("brief")} isLoading={isGeneratingBrief}>
															<RefreshIcon label="" />
															Refresh brief
														</Button>
														<Button
															variant="outline"
															onClick={async () => {
																if (briefArtifact?.content) {
																	await navigator.clipboard.writeText(briefArtifact.content);
																}
															}}
															disabled={!briefArtifact?.content}
														>
															<CopyIcon label="" />
															Copy markdown
														</Button>
													</div>
												</div>
											</CardHeader>
											<CardContent>
												<Textarea
													readOnly
													className="min-h-[560px] font-mono text-xs"
													value={briefArtifact?.content ?? (isGeneratingBrief ? "Generating brief..." : "Open this view to generate a memory brief.")}
												/>
											</CardContent>
										</Card>
									</TabsContent>

									<TabsContent value="deck" className="mt-4">
										<Card className="border-border bg-background/80">
											<CardHeader>
												<div className="flex flex-wrap items-start justify-between gap-3">
													<div>
														<CardTitle>Marp deck markdown</CardTitle>
														<CardDescription>
															Presentation-ready markdown slides derived from the same explorer selection.
														</CardDescription>
													</div>
													<div className="flex gap-2">
														<Button variant="outline" onClick={() => void refreshGeneratedArtifact("deck")} isLoading={isGeneratingDeck}>
															<RefreshIcon label="" />
															Refresh deck
														</Button>
														<Button
															variant="outline"
															onClick={() => {
																if (deckArtifact?.content) {
																	createDownload("memory-explorer-deck.md", deckArtifact.content, "text/markdown;charset=utf-8");
																}
															}}
															disabled={!deckArtifact?.content}
														>
															<DownloadIcon label="" />
															Download .md
														</Button>
													</div>
												</div>
											</CardHeader>
											<CardContent>
												<Textarea
													readOnly
													className="min-h-[560px] font-mono text-xs"
													value={deckArtifact?.content ?? (isGeneratingDeck ? "Generating deck..." : "Open this view to generate a Marp deck.")}
												/>
											</CardContent>
										</Card>
									</TabsContent>
								</Tabs>
							</CardContent>
						</Card>
					</div>

					<Card className="overflow-hidden border-border bg-linear-to-b from-background to-surface-raised">
						<CardHeader className="border-b border-border/70">
							<div className="flex items-start justify-between gap-3">
								<div>
									<CardTitle>Inspector</CardTitle>
									<CardDescription>
										Selection-aware detail pane with canonical pruning, proposal removal, and derived output actions.
									</CardDescription>
								</div>
								{selectedNode ? (
									<Lozenge variant={selectedNode.kind === "raw-proposal" ? "warning" : selectedNode.kind === "compiled-context" ? "success" : selectedNode.kind === "canonical-memory" ? "information" : "neutral"}>
										{formatNodeKindLabel(selectedNode.kind)}
									</Lozenge>
								) : null}
							</div>
						</CardHeader>
						<CardContent className="pt-4">
							{selectedNode ? (
								<div className="space-y-4">
									<div className="space-y-2">
										<div className="flex flex-wrap items-center gap-2">
											<Badge variant="outline">{formatScopeLabel(selectedNode.scope)}</Badge>
											{selectedNode.status ? (
												<Lozenge variant={formatProposalTone(selectedNode.status)}>{selectedNode.status}</Lozenge>
											) : null}
											{selectedNode.target ? (
												<Badge variant="neutral">{selectedNode.target}</Badge>
											) : null}
										</div>
										<div className="text-xl font-semibold">{selectedNode.title}</div>
										<div className="text-sm text-text-subtle">{selectedNode.relativePath || selectedNode.path || "No path"}</div>
									</div>

									<div className="grid gap-3 sm:grid-cols-2">
										<div className="rounded-2xl border border-border bg-background px-3 py-3">
											<div className="text-xs uppercase tracking-[0.18em] text-text-subtlest">Connections</div>
											<div className="mt-2 text-2xl font-semibold">{selectedNode.connectionCount}</div>
										</div>
										<div className="rounded-2xl border border-border bg-background px-3 py-3">
											<div className="text-xs uppercase tracking-[0.18em] text-text-subtlest">Updated</div>
											<div className="mt-2 text-sm font-medium">{formatControlPlaneDateTime(selectedNode.updatedAt)}</div>
										</div>
									</div>

									<div className="rounded-2xl border border-border bg-background px-3 py-3">
										<div className="text-xs uppercase tracking-[0.18em] text-text-subtlest">Summary</div>
										<div className="mt-2 whitespace-pre-wrap text-sm text-text-subtle">
											{selectedNode.bodyPreview || selectedNode.summary || "No summary available yet."}
										</div>
									</div>

									<div className="flex flex-wrap gap-2">
										<Button variant="outline" onClick={() => void refreshGeneratedArtifact("brief")}>
											<PageIcon label="" />
											Generate brief
										</Button>
										<Button variant="outline" onClick={() => void refreshGeneratedArtifact("deck")}>
											<DownloadIcon label="" />
											Generate deck
										</Button>
									</div>

									{selectedNode.tags.length > 0 ? (
										<div className="space-y-2">
											<div className="text-xs font-semibold uppercase tracking-[0.18em] text-text-subtlest">Tags</div>
											<div className="flex flex-wrap gap-1.5">
												{selectedNode.tags.map((tag) => (
													<button
														type="button"
														key={tag}
														onClick={() => setFilters((current) => ({ ...current, tag }))}
														className="rounded-full border border-border bg-surface-raised px-2.5 py-1 text-xs text-text-subtle hover:bg-bg-neutral-subtle-hovered"
													>
														#{tag}
													</button>
												))}
											</div>
										</div>
									) : null}

									{selectedNode.kind === "raw-proposal" ? (
										<div className="rounded-2xl border border-border bg-background px-3 py-3">
											<div className="flex items-center justify-between gap-3">
												<div>
													<div className="text-sm font-medium">Raw proposal controls</div>
													<div className="text-xs text-text-subtle">
														Remove the raw source to rebuild canonical memory without it.
													</div>
												</div>
												<Button
													variant="destructive"
													size="sm"
													onClick={() => {
														const proposal = explorer?.nodes.find((node) => node.id === selectedNode.id);
														if (proposal) {
															setPendingProposalRemove({
																action: String(proposal.metadata.action ?? "add"),
																content: proposal.bodyPreview,
																createdAt: proposal.createdAt,
																id: String(proposal.metadata.id ?? selectedNode.id.replace(/^proposal:/u, "")),
																ingestedAt: typeof proposal.metadata.ingestedAt === "string" ? proposal.metadata.ingestedAt : null,
																origin: typeof proposal.metadata.origin === "string" ? proposal.metadata.origin : null,
																path: proposal.path,
																reason: typeof proposal.metadata.reason === "string" ? proposal.metadata.reason : null,
																scope: proposal.scope ?? "work",
																sourceMessageId: proposal.sourceMessageId,
																sourceThreadId: proposal.sourceThreadId,
																status: proposal.status ?? "queued",
																summary: proposal.summary,
																tags: proposal.tags,
																target: proposal.target,
															});
														}
													}}
													disabled={removingKey !== null}
												>
													Remove source
												</Button>
											</div>
										</div>
									) : null}

									{selectedNode.kind === "canonical-memory" && selectedCanonicalDocument ? (
										<div className="space-y-3">
											<div className="flex items-center justify-between gap-3">
												<div>
													<div className="text-sm font-medium">Canonical memory blocks</div>
													<div className="text-xs text-text-subtle">
														Delete a block to prune the canonical memory page and regenerate compiled context.
													</div>
												</div>
											</div>
											{selectedCanonicalDocument.blocks.map((block) => (
												<div key={block.id} className="rounded-2xl border border-border bg-background px-3 py-3">
													<div className="flex items-center justify-between gap-3">
														<div className="flex gap-2">
															<Badge variant="outline">{block.lineCount} lines</Badge>
															<Badge variant="neutral">{block.charCount.toLocaleString()} chars</Badge>
														</div>
														<Button
															size="sm"
															variant="destructive"
															onClick={() => setPendingBlockRemove({ block, document: selectedCanonicalDocument })}
															disabled={removingKey !== null}
														>
															Remove block
														</Button>
													</div>
													<ScrollArea className="mt-3 max-h-48 rounded-xl border border-border bg-surface-raised p-3 text-sm text-text-subtle">
														<pre className="whitespace-pre-wrap">{block.content}</pre>
													</ScrollArea>
												</div>
											))}
										</div>
									) : null}

									<div className="space-y-2">
										<div className="text-xs font-semibold uppercase tracking-[0.18em] text-text-subtlest">Connected edges</div>
										<div className="space-y-2">
											{explorer?.edges
												.filter((edge) => edge.source === selectedNode.id || edge.target === selectedNode.id)
												.slice(0, 8)
												.map((edge) => {
													const relatedNodeId = edge.source === selectedNode.id ? edge.target : edge.source;
													const relatedNode = explorer.nodes.find((node) => node.id === relatedNodeId);
													return (
														<button
															type="button"
															key={edge.id}
															onClick={() => setSelectedNodeId(relatedNodeId)}
															className="w-full rounded-2xl border border-border bg-background px-3 py-3 text-left transition-colors hover:bg-bg-neutral-subtle-hovered"
														>
															<div className="flex items-center justify-between gap-3">
																<div className="min-w-0">
																	<div className="truncate font-medium">{relatedNode?.title ?? relatedNodeId}</div>
																	<div className="text-xs text-text-subtle">{formatEdgeKindLabel(edge.kind)}</div>
																</div>
																<Lozenge variant="neutral">{edge.relationKinds.length}</Lozenge>
															</div>
														</button>
													);
												})}
										</div>
									</div>
								</div>
							) : (
								<div className="rounded-2xl border border-dashed border-border px-4 py-14 text-center text-sm text-text-subtle">
									Select a node in the graph or table to inspect it.
								</div>
							)}
						</CardContent>
					</Card>
				</div>
			</ControlPlanePageShell>

			<AlertDialog
				open={pendingProposalRemove !== null}
				onOpenChange={(open) => {
					if (!open) {
						setPendingProposalRemove(null);
					}
				}}
			>
				<AlertDialogContent size="sm">
					<AlertDialogHeader>
						<AlertDialogTitle>Remove memory source?</AlertDialogTitle>
						<AlertDialogDescription>
							This removes the raw proposal. Canonical memory and compiled context will be rebuilt from the remaining sources.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<div className="rounded-2xl border border-border bg-surface-raised px-3 py-3 text-sm text-text-subtle">
						<pre className="whitespace-pre-wrap">{pendingProposalRemove?.content ?? pendingProposalRemove?.summary ?? ""}</pre>
					</div>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={removingKey !== null}>Cancel</AlertDialogCancel>
						<AlertDialogAction
							variant="destructive"
							onClick={() => void handleConfirmProposalRemove()}
							isLoading={removingKey === `proposal:${pendingProposalRemove?.id}`}
						>
							Remove source
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			<AlertDialog
				open={pendingBlockRemove !== null}
				onOpenChange={(open) => {
					if (!open) {
						setPendingBlockRemove(null);
					}
				}}
			>
				<AlertDialogContent size="sm">
					<AlertDialogHeader>
						<AlertDialogTitle>Remove canonical block?</AlertDialogTitle>
						<AlertDialogDescription>
							This prunes the selected block from the canonical memory page and regenerates compiled prompt context.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<div className="rounded-2xl border border-border bg-surface-raised px-3 py-3 text-sm text-text-subtle">
						<pre className="whitespace-pre-wrap">{pendingBlockRemove?.block.content ?? ""}</pre>
					</div>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={removingKey !== null}>Cancel</AlertDialogCancel>
						<AlertDialogAction
							variant="destructive"
							onClick={() => void handleConfirmBlockRemove()}
							isLoading={removingKey === `block:${pendingBlockRemove?.block.id}`}
						>
							Remove block
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}
