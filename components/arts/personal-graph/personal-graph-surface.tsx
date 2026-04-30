"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import BranchIcon from "@atlaskit/icon/core/branch";
import CrossIcon from "@atlaskit/icon/core/cross";
import RefreshIcon from "@atlaskit/icon/core/refresh";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/utils/theme-wrapper";
import { cn } from "@/lib/utils";
import { useVaultExplorer } from "./hooks/use-vault-explorer";
import { PersonalGraphDropzone } from "./personal-graph-dropzone";
import { PersonalGraphIngestButton } from "./personal-graph-ingest-button";
import { PersonalGraphLog } from "./personal-graph-log";
import { PersonalGraphPage } from "./personal-graph-page";
import { PersonalGraphSearch } from "./personal-graph-search";
import { PersonalGraphSigma } from "./personal-graph-sigma";
import { PersonalGraphVaultPicker } from "./personal-graph-vault-picker";

type PersonalGraphSurfaceProps = React.ComponentProps<"main">;

function isReadableWikiNode(kind: string, missing: boolean) {
	return kind !== "raw" && !missing;
}

export function PersonalGraphSurface({
	className,
	...props
}: Readonly<PersonalGraphSurfaceProps>) {
	const { error, explorer, isLoading, refresh } = useVaultExplorer();
	const reduceMotion = useReducedMotion();
	const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
	const [refreshKey, setRefreshKey] = useState(0);
	const panelRef = useRef<HTMLElement | null>(null);
	const selectedNode = useMemo(
		() => explorer?.nodes.find((node) => node.id === selectedNodeId) ?? null,
		[explorer?.nodes, selectedNodeId],
	);
	const selectedSlug =
		selectedNode && isReadableWikiNode(selectedNode.kind, selectedNode.missing)
			? selectedNode.slug
			: null;

	const handleSelectNode = useCallback((nodeId: string) => {
		setSelectedNodeId(nodeId);
	}, []);
	const handleRefreshAll = useCallback(() => {
		setRefreshKey((current) => current + 1);
		void refresh();
	}, [refresh]);

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

	return (
		<main
			aria-label="Personal Graph"
			className={cn("relative min-h-svh overflow-hidden bg-surface text-text", className)}
			onPointerDownCapture={(event) => {
				if (!selectedNodeId || !panelRef.current) {
					return;
				}
				const target = event.target instanceof Node ? event.target : null;
				if (target && !panelRef.current.contains(target)) {
					setSelectedNodeId(null);
				}
			}}
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
					<ThemeToggle />
				</div>
			</header>

			<section className="absolute inset-0 pt-[57px]" aria-label="Vault graph">
				<PersonalGraphSigma
					explorer={explorer}
					isLoading={isLoading}
					onSelectNode={handleSelectNode}
					selectedNodeId={selectedNodeId}
				/>
			</section>

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

			<AnimatePresence>
				{selectedNodeId ? (
					<motion.aside
						ref={panelRef}
						animate={{ opacity: 1, x: 0 }}
						className="absolute bottom-4 right-4 top-[73px] z-30 flex w-[min(460px,calc(100vw-32px))] flex-col overflow-hidden rounded-md border border-border bg-surface-raised shadow-lg"
						exit={{ opacity: 0, x: 24 }}
						initial={{ opacity: 0, x: 24 }}
						transition={reduceMotion ? { duration: 0 } : { duration: 0.2, ease: [0.4, 0, 0, 1] }}
					>
						<div className="absolute right-3 top-3 z-10">
							<Button
								aria-label="Close page panel"
								onClick={() => setSelectedNodeId(null)}
								size="icon-sm"
								variant="ghost"
							>
								<CrossIcon label="" />
							</Button>
						</div>
						<PersonalGraphPage node={selectedNode} slug={selectedSlug} />
					</motion.aside>
				) : null}
			</AnimatePresence>
		</main>
	);
}

export const Surface = {
	Root: PersonalGraphSurface,
} as const;
