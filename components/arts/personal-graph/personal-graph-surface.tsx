"use client";

import { useCallback, useEffect, useState } from "react";
import BranchIcon from "@atlaskit/icon/core/branch";
import CrossIcon from "@atlaskit/icon/core/cross";
import RefreshIcon from "@atlaskit/icon/core/refresh";
import SettingsIcon from "@atlaskit/icon/core/settings";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/utils/theme-wrapper";
import Graph from "@/components/website/demos/visual/graph";
import { cn } from "@/lib/utils";
import { useVaultExplorer } from "./hooks/use-vault-explorer";
import type { NeuralGraphParams } from "./lib/neural-graph/params";
import { loadStoredNeuralGraphParams, saveStoredNeuralGraphParams } from "./lib/neural-graph/params";
import { PersonalGraphDropzone } from "./personal-graph-dropzone";
import { PersonalGraphIngestButton } from "./personal-graph-ingest-button";
import { PersonalGraphLog } from "./personal-graph-log";
import { PersonalGraphNeuralControls } from "./personal-graph-neural-controls";
import { PersonalGraphSearch } from "./personal-graph-search";
import { PersonalGraphVaultPicker } from "./personal-graph-vault-picker";

type PersonalGraphSurfaceProps = React.ComponentProps<"main">;

export function PersonalGraphSurface({
	className,
	...props
}: Readonly<PersonalGraphSurfaceProps>) {
	const { error, explorer, isLoading, refresh } = useVaultExplorer();
	const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
	const [refreshKey, setRefreshKey] = useState(0);
	const [isParameterPanelOpen, setIsParameterPanelOpen] = useState(false);
	const [neuralParams, setNeuralParams] = useState<NeuralGraphParams>(() => loadStoredNeuralGraphParams());

	const handleRefreshAll = useCallback(() => {
		setRefreshKey((current) => current + 1);
		void refresh();
	}, [refresh]);
	const handleNeuralParamsChange = useCallback((params: NeuralGraphParams) => {
		setNeuralParams(params);
	}, []);

	useEffect(() => {
		if (!selectedNodeId) {
			return;
		}

		function handleKeyDown(event: KeyboardEvent) {
			if (event.key === "Escape") {
				setSelectedNodeId(null);
			}
		}

		window.addEventListener("keydown", handleKeyDown);
		return () => {
			window.removeEventListener("keydown", handleKeyDown);
		};
	}, [selectedNodeId]);

	useEffect(() => {
		saveStoredNeuralGraphParams(neuralParams);
	}, [neuralParams]);

	return (
		<main
			aria-label="Personal Graph"
			className={cn("relative min-h-svh overflow-hidden bg-surface text-text", className)}
			{...props}
		>
			<header className="absolute inset-x-0 top-0 z-20 grid grid-cols-[1fr_auto_1fr] items-center gap-4 border-b border-border bg-surface/90 px-5 py-3 backdrop-blur">
				<div className="flex min-w-0 items-center gap-3">
					<BranchIcon label="" />
					<div className="min-w-0">
						<h1 className="truncate text-sm font-semibold text-text">Personal Graph</h1>
						<p className="truncate text-xs text-text-subtle">
							{explorer
								? `${explorer.stats.wikiCount} wiki pages · ${explorer.stats.rawCount} raw sources`
								: "Obsidian-backed second-brain graph"}
						</p>
					</div>
				</div>
				<PersonalGraphSearch
					onSelectSlug={(slug) => {
						const node = explorer?.nodes.find((candidate) => candidate.slug === slug);
						if (node) setSelectedNodeId(node.id);
					}}
				/>
				<div className="flex items-center justify-end gap-2">
					{error ? (
						<p className="max-w-[360px] truncate text-xs text-text-danger">{error.message}</p>
					) : null}
					<PersonalGraphVaultPicker onVaultChanged={handleRefreshAll} />
					<Button
						aria-label="Refresh graph"
						disabled={isLoading}
						onClick={handleRefreshAll}
						size="icon-sm"
						variant="outline"
					>
						<RefreshIcon label="" />
					</Button>
					<Button
						aria-expanded={isParameterPanelOpen}
						aria-label="Graph parameters"
						onClick={() => setIsParameterPanelOpen((current) => !current)}
						size="icon-sm"
						variant="outline"
					>
						<SettingsIcon label="" />
					</Button>
					<ThemeToggle />
				</div>
			</header>

			<section className="absolute inset-0 pt-[57px]" aria-label="Vault graph">
				<Graph
					className="h-full"
					explorer={explorer}
					isLoading={isLoading}
					onSelectedNodeIdChange={setSelectedNodeId}
					params={neuralParams}
					selectedNodeId={selectedNodeId}
					showControls={false}
					variant="fill"
				/>
			</section>

			{isParameterPanelOpen ? (
				<aside
					aria-label="Neural graph parameters"
					className="absolute right-4 top-[73px] z-40 max-h-[calc(100svh-96px)] w-[min(320px,calc(100vw-32px))] overflow-y-auto rounded-md border border-border bg-surface-overlay/95 p-4 shadow-xl backdrop-blur"
				>
					<div className="mb-4 flex items-center justify-between gap-3">
						<p className="text-xs font-semibold text-text">Neural graph</p>
						<Button
							aria-label="Close graph parameters"
							onClick={() => setIsParameterPanelOpen(false)}
							size="icon-sm"
							variant="ghost"
						>
							<CrossIcon label="" />
						</Button>
					</div>
					<PersonalGraphNeuralControls onChange={handleNeuralParamsChange} params={neuralParams} />
				</aside>
			) : null}

			<section className="absolute bottom-4 left-4 z-20 w-[min(360px,calc(100vw-32px))] space-y-3" aria-label="Raw source ingestion">
				<PersonalGraphDropzone onRawAdded={handleRefreshAll} />
				<PersonalGraphIngestButton onDone={handleRefreshAll} refreshKey={refreshKey} />
				<PersonalGraphLog refreshKey={refreshKey} />
			</section>

			<details className="sr-only" open>
				<summary>Personal Graph text fallback</summary>
				<h2>Nodes</h2>
				<ul aria-label="Personal Graph nodes">
					{(explorer?.nodes ?? []).map((node) => (
						<li key={node.id}>
							{node.title} ({node.kind}) - {node.connectionCount} connections
						</li>
					))}
				</ul>
				<h2>Edges</h2>
				<ul aria-label="Personal Graph edges">
					{(explorer?.edges ?? []).map((edge) => {
						const source = explorer?.nodes.find((node) => node.id === edge.source)?.title ?? edge.source;
						const target = explorer?.nodes.find((node) => node.id === edge.target)?.title ?? edge.target;
						return (
							<li key={edge.id}>
								{source} to {target} ({edge.kind})
							</li>
						);
					})}
				</ul>
			</details>
		</main>
	);
}

export const Surface = {
	Root: PersonalGraphSurface,
} as const;
