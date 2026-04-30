"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import AddIcon from "@atlaskit/icon/core/add";
import BranchIcon from "@atlaskit/icon/core/branch";
import ChevronRightIcon from "@atlaskit/icon/core/chevron-right";
import CopyIcon from "@atlaskit/icon/core/copy";
import CrossIcon from "@atlaskit/icon/core/cross";
import LinkExternalIcon from "@atlaskit/icon/core/link-external";
import MinusIcon from "@atlaskit/icon/core/minus";
import RefreshIcon from "@atlaskit/icon/core/refresh";
import SettingsIcon from "@atlaskit/icon/core/settings";
import ShowMoreHorizontalIcon from "@atlaskit/icon/core/show-more-horizontal";
import TargetIcon from "@atlaskit/icon/core/target";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/utils/theme-wrapper";
import Graph from "@/components/website/demos/visual/graph";
import { cn } from "@/lib/utils";
import { useVaultExplorer } from "./hooks/use-vault-explorer";
import type { NeuralGraphParams } from "./lib/neural-graph/params";
import { clampNeuralGraphParams, loadStoredNeuralGraphParams, saveStoredNeuralGraphParams } from "./lib/neural-graph/params";
import type { VaultExplorer, VaultNode, VaultNodeKind } from "./lib/personal-graph-types";
import { PersonalGraphBackdrop } from "./personal-graph-backdrop";
import { PersonalGraphDropzone } from "./personal-graph-dropzone";
import { PersonalGraphIngestButton } from "./personal-graph-ingest-button";
import { PersonalGraphLog } from "./personal-graph-log";
import { PersonalGraphNeuralControls } from "./personal-graph-neural-controls";
import { PersonalGraphSearch } from "./personal-graph-search";
import { PersonalGraphVaultPicker } from "./personal-graph-vault-picker";

type PersonalGraphSurfaceProps = React.ComponentProps<"main">;
type PersonalGraphEditorStyle = React.CSSProperties & Record<`--${string}`, string>;

const PERSONAL_GRAPH_EDITOR_COLOR_LOCK_STYLE = {
	backgroundColor: "#FFFFFF",
	color: "#1E1F21",
	"--color-white": "#FFFFFF",
	"--color-black": "#1E1F21",
	"--color-neutral-50": "#FAFBFC",
	"--color-neutral-100": "#F4F5F7",
	"--color-neutral-200": "#DCDFE4",
	"--color-neutral-300": "#B3B9C4",
	"--color-neutral-400": "#8590A2",
	"--color-neutral-500": "#758195",
	"--color-neutral-600": "#626F86",
	"--color-neutral-700": "#44546F",
	"--color-neutral-800": "#2C3E5D",
	"--color-neutral-900": "#172B4D",
	"--color-neutral-950": "#1E1F21",
	"--ds-text": "#1E1F21",
	"--ds-text-inverse": "#FFFFFF",
	"--ds-text-subtle": "#44546F",
	"--ds-text-accent-gray-bolder": "#1E1F21",
	"--ds-background-accent-gray-subtlest": "#F0F1F2",
	"--ds-background-accent-gray-subtler": "#DCDFE4",
	"--ds-background-accent-gray-subtler-pressed": "#B3B9C4",
	"--ds-background-accent-gray-subtle": "#8590A2",
	"--ds-background-accent-gray-bolder": "#626F86",
	"--ds-background-accent-gray-bolder-hovered": "#44546F",
	"--ds-background-accent-gray-bolder-pressed": "#2C3E5D",
} satisfies PersonalGraphEditorStyle;

const NODE_KIND_MARKERS: Record<VaultNodeKind, string> = {
	concept: "rotate-45 rounded-[2px] bg-amber-400",
	entity: "rounded-full bg-emerald-500",
	raw: "rounded-[2px] bg-red-500",
	source: "rounded-full bg-blue-600",
	synthesis: "rotate-45 rounded-[2px] bg-blue-600",
};

function GraphNodeMarker({
	className,
	kind,
}: Readonly<{
	className?: string;
	kind: VaultNodeKind;
}>) {
	return <span aria-hidden="true" className={cn("inline-block size-3 shrink-0", NODE_KIND_MARKERS[kind], className)} />;
}

function getFeaturedNode(explorer: VaultExplorer | null, selectedNodeId: string | null) {
	if (!explorer) return null;
	return (
		explorer.nodes.find((node) => node.id === selectedNodeId) ??
		[...explorer.nodes].sort((left, right) => right.connectionCount - left.connectionCount)[0] ??
		null
	);
}

function getRelatedNodes(explorer: VaultExplorer | null, node: VaultNode | null) {
	if (!explorer || !node) return [];
	const relatedIds = explorer.edges.flatMap((edge) => {
		if (edge.source === node.id) return [edge.target];
		if (edge.target === node.id) return [edge.source];
		return [];
	});
	const nodesById = new Map(explorer.nodes.map((candidate) => [candidate.id, candidate]));
	return relatedIds
		.flatMap((nodeId) => {
			const relatedNode = nodesById.get(nodeId);
			return relatedNode ? [relatedNode] : [];
		})
		.slice(0, 3);
}

function PersonalGraphInspector({
	explorer,
	node,
	onClose,
	onSelectNode,
}: Readonly<{
	explorer: VaultExplorer | null;
	node: VaultNode | null;
	onClose: () => void;
	onSelectNode: (nodeId: string) => void;
}>) {
	if (!node) return null;
	const relatedNodes = getRelatedNodes(explorer, node);

	return (
		<aside
			aria-label="Knowledge Graph details"
			className="absolute right-6 top-[106px] z-30 hidden w-[min(330px,calc(100vw-48px))] rounded-[2px] border border-neutral-950/70 bg-white/95 p-5 text-neutral-950 shadow-lg backdrop-blur xl:block"
		>
			<div className="mb-5 flex items-start justify-between gap-4">
				<h2 className="text-base font-semibold leading-5">{node.title}</h2>
				<Button
					aria-label="Close graph details"
					className="size-7 rounded-[2px] text-neutral-950 hover:bg-neutral-100"
					onClick={onClose}
					size="icon-sm"
					variant="ghost"
				>
					<CrossIcon label="" />
				</Button>
			</div>
			<div className="border-b border-neutral-950/35 pb-4">
				<div className="mb-3 text-sm text-neutral-600">Kind</div>
				<div className="flex items-center gap-3 text-sm">
					<GraphNodeMarker kind={node.kind} />
					<span>{node.kind.replace("_", " ")}</span>
				</div>
			</div>
			<div className="border-b border-neutral-950/35 py-4">
				<div className="mb-3 text-sm text-neutral-600">Links</div>
				<div className="flex items-center justify-between text-sm">
					<span>{node.connectionCount}</span>
					<ChevronRightIcon label="" />
				</div>
			</div>
			<div className="border-b border-neutral-950/35 py-4">
				<div className="mb-2 text-sm text-neutral-600">Excerpt</div>
				<p className="text-sm leading-6 text-neutral-800">{node.bodyPreview || node.relativePath}</p>
			</div>
			{relatedNodes.length > 0 ? (
				<div className="py-4">
					<div className="mb-3 text-sm text-neutral-600">Related pages</div>
					<div className="space-y-2">
						{relatedNodes.map((relatedNode) => (
							<button
								className="flex w-full items-center justify-between gap-3 rounded-[2px] border border-neutral-950/45 bg-white px-3 py-3 text-left text-sm hover:bg-neutral-100"
								key={relatedNode.id}
								onClick={() => onSelectNode(relatedNode.id)}
								type="button"
							>
								<span className="flex min-w-0 items-center gap-3">
									<GraphNodeMarker kind={relatedNode.kind} />
									<span className="truncate">{relatedNode.title}</span>
								</span>
								<ChevronRightIcon label="" />
							</button>
						))}
					</div>
				</div>
			) : null}
			<div className="mt-4 flex items-center justify-between gap-2 border-t border-neutral-950/35 pt-4">
				<div className="flex gap-2">
					<Button
						aria-label="Copy node title"
						className="size-8 rounded-[2px] text-neutral-950 hover:bg-neutral-100"
						onClick={() => void navigator.clipboard?.writeText(node.title)}
						size="icon-sm"
						variant="ghost"
					>
						<CopyIcon label="" />
					</Button>
					<Button
						aria-label="Open node source"
						className="size-8 rounded-[2px] text-neutral-950 hover:bg-neutral-100"
						onClick={() => window.open(`/api/personal-graph/page/${node.slug}`, "_blank", "noopener,noreferrer")}
						size="icon-sm"
						variant="ghost"
					>
						<LinkExternalIcon label="" />
					</Button>
				</div>
				<Button
					aria-label="More graph detail actions"
					className="size-8 rounded-[2px] text-neutral-950 hover:bg-neutral-100"
					size="icon-sm"
					variant="ghost"
				>
					<ShowMoreHorizontalIcon label="" />
				</Button>
			</div>
		</aside>
	);
}

function PersonalGraphZoomControls({
	onReset,
	onZoomIn,
	onZoomOut,
	zoom,
}: Readonly<{
	onReset: () => void;
	onZoomIn: () => void;
	onZoomOut: () => void;
	zoom: number;
}>) {
	return (
		<div className="absolute bottom-6 right-6 z-30 hidden items-center gap-6 text-neutral-950 lg:flex">
			<div className="flex h-11 items-center rounded-[2px] border border-neutral-950/70 bg-white/95 shadow-lg backdrop-blur">
				<Button aria-label="Zoom out" className="size-10 rounded-none text-neutral-950 hover:bg-neutral-100" onClick={onZoomOut} size="icon" variant="ghost">
					<MinusIcon label="" />
				</Button>
				<div className="flex h-full min-w-20 items-center justify-center border-x border-neutral-950/35 px-4 text-sm">{Math.round(zoom * 100)}%</div>
				<Button aria-label="Zoom in" className="size-10 rounded-none text-neutral-950 hover:bg-neutral-100" onClick={onZoomIn} size="icon" variant="ghost">
					<AddIcon label="" />
				</Button>
			</div>
			<Button aria-label="Reset graph view" className="size-11 rounded-[2px] border-neutral-950/70 bg-white/95 text-neutral-950 shadow-lg hover:bg-neutral-100" onClick={onReset} size="icon" variant="outline">
				<TargetIcon label="" />
			</Button>
		</div>
	);
}

export function PersonalGraphSurface({
	className,
	style,
	...props
}: Readonly<PersonalGraphSurfaceProps>) {
	const { error, explorer, isLoading, refresh } = useVaultExplorer();
	const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
	const [refreshKey, setRefreshKey] = useState(0);
	const [isParameterPanelOpen, setIsParameterPanelOpen] = useState(false);
	const [neuralParams, setNeuralParams] = useState<NeuralGraphParams>(() => loadStoredNeuralGraphParams());
	const [viewportZoom, setViewportZoom] = useState(1);
	const displayedNode = useMemo(() => getFeaturedNode(explorer, selectedNodeId), [explorer, selectedNodeId]);
	const renderedNeuralParams = useMemo(
		() =>
			clampNeuralGraphParams({
				...neuralParams,
				nodeSize: neuralParams.nodeSize * Math.sqrt(viewportZoom),
				spread: neuralParams.spread * viewportZoom,
			}),
		[neuralParams, viewportZoom],
	);

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
			className={cn("relative isolate min-h-svh overflow-hidden bg-white text-neutral-950 dark:bg-white dark:text-neutral-950", className)}
			style={{ ...PERSONAL_GRAPH_EDITOR_COLOR_LOCK_STYLE, ...style }}
			{...props}
		>
			<PersonalGraphBackdrop className="z-0" />
			<header className="absolute inset-x-0 top-0 z-20 flex items-center justify-between gap-4 px-6 py-6">
				<div className="flex min-w-0 items-center gap-3">
					<BranchIcon label="" />
					<div className="min-w-0">
						<h1 className="truncate text-base font-semibold leading-5 text-neutral-950">Personal Graph</h1>
						<p className="truncate text-sm text-neutral-700">
							{explorer
								? `${explorer.stats.wikiCount} wiki pages · ${explorer.stats.rawCount} raw sources`
								: "Obsidian-backed second-brain graph"}
						</p>
					</div>
				</div>
				<div className="flex items-center justify-end gap-2">
					{error ? (
						<p className="max-w-[360px] truncate text-xs text-red-700">{error.message}</p>
					) : null}
					<PersonalGraphVaultPicker onVaultChanged={handleRefreshAll} />
					<Button
						aria-label="Refresh graph"
						className="size-11 rounded-[2px] border-neutral-950/70 bg-white text-neutral-950 shadow-none hover:bg-neutral-100"
						disabled={isLoading}
						onClick={handleRefreshAll}
						size="icon"
						variant="outline"
					>
						<RefreshIcon label="" />
					</Button>
					<Button
						aria-expanded={isParameterPanelOpen}
						aria-label="Graph parameters"
						className="size-11 rounded-[2px] border-neutral-950/70 bg-white text-neutral-950 shadow-none hover:bg-neutral-100"
						onClick={() => setIsParameterPanelOpen((current) => !current)}
						size="icon"
						variant="outline"
					>
						<SettingsIcon label="" />
					</Button>
					<div className="[&_[data-slot=button]]:size-11 [&_[data-slot=button]]:rounded-[2px] [&_[data-slot=button]]:border [&_[data-slot=button]]:border-neutral-950/70 [&_[data-slot=button]]:bg-white [&_[data-slot=button]]:text-neutral-950 [&_[data-slot=button]]:shadow-none [&_[data-slot=button]:hover]:bg-neutral-100">
						<ThemeToggle />
					</div>
				</div>
			</header>

			<section className="absolute inset-x-0 bottom-[6.5rem] top-[84px] z-10 sm:bottom-[7.25rem]" aria-label="Vault graph">
				<Graph
					background="transparent"
					className="h-full"
					explorer={explorer}
					isLoading={isLoading}
					onSelectedNodeIdChange={setSelectedNodeId}
					params={renderedNeuralParams}
					selectedNodeId={selectedNodeId}
					showControls={false}
					showSelectionOverlay={false}
					themeMode="light"
					variant="fill"
				/>
			</section>

			<section
				aria-label="Personal Graph search and chat"
				className="pointer-events-none absolute inset-x-0 bottom-6 z-30 flex justify-center px-4 sm:bottom-8"
			>
				<div className="pointer-events-auto relative w-full max-w-[760px]">
					<div className="pointer-events-none absolute left-1/2 top-0 h-24 w-px -translate-x-1/2 -translate-y-full bg-gradient-to-t from-neutral-950/35 to-transparent" />
					<div className="pointer-events-none absolute left-1/2 top-0 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-neutral-950 shadow-lg" />
					<PersonalGraphSearch
						onSelectSlug={(slug) => {
							const node = explorer?.nodes.find((candidate) => candidate.slug === slug);
							if (node) setSelectedNodeId(node.id);
						}}
					/>
				</div>
			</section>

			{isParameterPanelOpen ? (
				<aside
					aria-label="Neural graph parameters"
					className="absolute right-6 top-[90px] z-40 max-h-[calc(100svh-112px)] w-[min(320px,calc(100vw-32px))] overflow-y-auto rounded-[2px] border border-neutral-950/70 bg-white/95 p-4 text-neutral-950 shadow-xl backdrop-blur"
				>
					<div className="mb-4 flex items-center justify-between gap-3">
						<p className="text-xs font-semibold text-neutral-950">Neural graph</p>
						<Button
							aria-label="Close graph parameters"
							className="rounded-[2px] text-neutral-950 hover:bg-neutral-100"
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

			<section className="absolute bottom-6 left-6 z-20 hidden w-[312px] rounded-[2px] border border-neutral-950/70 bg-white/95 p-5 text-neutral-950 shadow-lg backdrop-blur lg:block" aria-label="Capture queue">
				<div className="mb-4 flex items-center justify-between">
					<h2 className="text-base font-semibold">Capture queue</h2>
					<Button
						aria-label="Collapse capture queue"
						className="size-7 rounded-[2px] text-neutral-950 hover:bg-neutral-100"
						size="icon-sm"
						variant="ghost"
					>
						<span className="-rotate-90">
							<ChevronRightIcon label="" />
						</span>
					</Button>
				</div>
				<div className="space-y-4">
					<PersonalGraphDropzone onRawAdded={handleRefreshAll} />
					<PersonalGraphIngestButton onDone={handleRefreshAll} refreshKey={refreshKey} />
					<PersonalGraphLog refreshKey={refreshKey} />
				</div>
			</section>

			<PersonalGraphInspector
				explorer={explorer}
				node={displayedNode}
				onClose={() => setSelectedNodeId(null)}
				onSelectNode={setSelectedNodeId}
			/>
			<PersonalGraphZoomControls
				onReset={() => {
					setSelectedNodeId(null);
					setViewportZoom(1);
				}}
				onZoomIn={() => setViewportZoom((current) => Math.min(1.5, Number((current + 0.1).toFixed(2))))}
				onZoomOut={() => setViewportZoom((current) => Math.max(0.7, Number((current - 0.1).toFixed(2))))}
				zoom={viewportZoom}
			/>

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
