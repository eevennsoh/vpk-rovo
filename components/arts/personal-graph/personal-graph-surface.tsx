"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import ChevronRightIcon from "@atlaskit/icon/core/chevron-right";
import CopyIcon from "@atlaskit/icon/core/copy";
import CrossIcon from "@atlaskit/icon/core/cross";
import LinkExternalIcon from "@atlaskit/icon/core/link-external";
import RefreshIcon from "@atlaskit/icon/core/refresh";
import SettingsIcon from "@atlaskit/icon/core/settings";
import ShowMoreHorizontalIcon from "@atlaskit/icon/core/show-more-horizontal";
import UploadIcon from "@atlaskit/icon/core/upload";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ThemeToggle } from "@/components/utils/theme-wrapper";
import Graph from "@/components/website/demos/visual/graph";
import { cn } from "@/lib/utils";
import { useVaultExplorer } from "./hooks/use-vault-explorer";
import type { NeuralGraphParams } from "./lib/neural-graph/params";
import { loadStoredNeuralGraphParams, saveStoredNeuralGraphParams } from "./lib/neural-graph/params";
import type { VaultExplorer, VaultNode, VaultNodeKind } from "./lib/personal-graph-types";
import { PersonalGraphBackdrop } from "./personal-graph-backdrop";
import { PersonalGraphDropzone } from "./personal-graph-dropzone";
import { PersonalGraphGlassPanel } from "./personal-graph-glass-panel";
import { PersonalGraphIngestButton } from "./personal-graph-ingest-button";
import { PersonalGraphLog } from "./personal-graph-log";
import { PersonalGraphNeuralControls } from "./personal-graph-neural-controls";
import { PersonalGraphSearch } from "./personal-graph-search";
import { PersonalGraphTitle } from "./personal-graph-title-scramble";
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

const PERSONAL_GRAPH_TITLE_FONT_STYLE = {
	fontFamily: "var(--font-affigere), Impact, Haettenschweiler, 'Arial Narrow Bold', sans-serif",
	fontWeight: 400,
} satisfies React.CSSProperties;

const PERSONAL_GRAPH_META_FONT_STYLE = {
	fontFamily: "var(--font-departure-mono), 'Courier New', monospace",
} satisfies React.CSSProperties;

function GraphNodeMarker({
	className,
	kind,
}: Readonly<{
	className?: string;
	kind: VaultNodeKind;
}>) {
	return <span aria-hidden="true" className={cn("inline-block size-3 shrink-0", NODE_KIND_MARKERS[kind], className)} />;
}

function getSelectedNode(explorer: VaultExplorer | null, selectedNodeId: string | null) {
	if (!explorer || !selectedNodeId) return null;
	return explorer.nodes.find((node) => node.id === selectedNodeId) ?? null;
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

function getGraphStatsText(explorer: VaultExplorer | null) {
	return explorer
		? `${explorer.stats.wikiCount} wiki pages · ${explorer.stats.rawCount} raw sources`
		: "Obsidian-backed second-brain graph";
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
			className="absolute right-6 top-[320px] z-30 hidden w-[min(340px,calc(100vw-48px))] text-neutral-950 lg:block xl:top-[112px]"
		>
			<PersonalGraphGlassPanel contentClassName="p-4" radius={24}>
				<div className="mb-5 flex items-start justify-between gap-4">
					<h2 className="text-base font-semibold leading-5">{node.title}</h2>
					<Button
						aria-label="Close graph details"
						className="size-8 rounded-full bg-white/5 text-neutral-950 shadow-none hover:bg-white/20"
						onClick={onClose}
						size="icon-sm"
						variant="ghost"
					>
						<CrossIcon label="" />
					</Button>
				</div>
				<div className="border-b border-neutral-950/8 pb-4">
					<div className="mb-3 text-xs font-medium text-neutral-500">Kind</div>
					<div className="flex items-center gap-3 text-sm">
						<GraphNodeMarker kind={node.kind} />
						<span>{node.kind.replace("_", " ")}</span>
					</div>
				</div>
				<div className="border-b border-neutral-950/8 py-4">
					<div className="mb-3 text-xs font-medium text-neutral-500">Links</div>
					<div className="flex items-center justify-between text-sm">
						<span>{node.connectionCount}</span>
						<ChevronRightIcon label="" />
					</div>
				</div>
				<div className="border-b border-neutral-950/8 py-4">
					<div className="mb-2 text-xs font-medium text-neutral-500">Excerpt</div>
					<p className="text-sm leading-6 text-neutral-800">{node.bodyPreview || node.relativePath}</p>
				</div>
				{relatedNodes.length > 0 ? (
					<div className="py-4">
						<div className="mb-3 text-xs font-medium text-neutral-500">Related pages</div>
						<div className="space-y-2">
							{relatedNodes.map((relatedNode) => (
								<button
									className="flex w-full items-center justify-between gap-3 rounded-2xl border border-neutral-950/8 bg-white/5 px-3 py-3 text-left text-sm transition-colors duration-normal hover:bg-white/20"
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
				<div className="mt-4 flex items-center justify-between gap-2 border-t border-neutral-950/8 pt-4">
					<div className="flex gap-2">
						<Button
							aria-label="Copy node title"
							className="size-8 rounded-full bg-white/5 text-neutral-950 shadow-none hover:bg-white/20"
							onClick={() => void navigator.clipboard?.writeText(node.title)}
							size="icon-sm"
							variant="ghost"
						>
							<CopyIcon label="" />
						</Button>
						<Button
							aria-label="Open node source"
							className="size-8 rounded-full bg-white/5 text-neutral-950 shadow-none hover:bg-white/20"
							onClick={() => window.open(`/api/personal-graph/page/${node.slug}`, "_blank", "noopener,noreferrer")}
							size="icon-sm"
							variant="ghost"
						>
							<LinkExternalIcon label="" />
						</Button>
					</div>
					<Button
						aria-label="More graph detail actions"
						className="size-8 rounded-full bg-white/5 text-neutral-950 shadow-none hover:bg-white/20"
						size="icon-sm"
						variant="ghost"
					>
						<ShowMoreHorizontalIcon label="" />
					</Button>
				</div>
			</PersonalGraphGlassPanel>
		</aside>
	);
}

function PersonalGraphCaptureQueue({
	onRawAdded,
	refreshKey,
}: Readonly<{
	onRawAdded: () => void;
	refreshKey: number;
}>) {
	return (
		<div className="space-y-4">
			<div>
				<h2 className="text-base font-semibold text-neutral-950">Capture queue</h2>
			</div>
			<PersonalGraphDropzone onRawAdded={onRawAdded} />
			<PersonalGraphIngestButton onDone={onRawAdded} refreshKey={refreshKey} />
			<PersonalGraphLog refreshKey={refreshKey} />
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
	const [isCaptureQueueOpen, setIsCaptureQueueOpen] = useState(false);
	const [neuralParams, setNeuralParams] = useState<NeuralGraphParams>(() => loadStoredNeuralGraphParams());
	const displayedNode = useMemo(() => getSelectedNode(explorer, selectedNodeId), [explorer, selectedNodeId]);

	const handleRefreshAll = useCallback(() => {
		setRefreshKey((current) => current + 1);
		void refresh();
	}, [refresh]);
	const handleNeuralParamsChange = useCallback((params: NeuralGraphParams) => {
		setNeuralParams(params);
	}, []);
	const handleCaptureQueueOpenChange = useCallback((isOpen: boolean) => {
		setIsCaptureQueueOpen(isOpen);
		if (isOpen) {
			setIsParameterPanelOpen(false);
		}
	}, []);
	const handleToggleParameterPanel = useCallback(() => {
		setIsParameterPanelOpen((current) => !current);
		setIsCaptureQueueOpen(false);
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
			<header className="absolute inset-x-4 top-5 z-30 sm:inset-x-6 lg:inset-x-8">
				<div className="relative flex flex-col items-center gap-4">
					<div className="mx-auto min-w-0 max-w-full text-center text-neutral-950">
						<PersonalGraphTitle
							className="text-[3.75rem] leading-[0.8] text-neutral-950 min-[390px]:text-[4.5rem] sm:text-[6.25rem] lg:text-[7.75rem] xl:text-[8.75rem]"
							style={PERSONAL_GRAPH_TITLE_FONT_STYLE}
						/>
						<p
							className="mt-5 truncate text-[1rem] leading-none tracking-normal text-neutral-950 sm:mt-6 sm:text-[1.4rem] lg:text-[1.55rem]"
							style={PERSONAL_GRAPH_META_FONT_STYLE}
						>
							{getGraphStatsText(explorer)}
						</p>
					</div>
					<div className="flex min-w-0 max-w-full flex-wrap items-center justify-center gap-2 text-center">
						{error ? (
							<p className="max-w-[360px] truncate text-xs text-red-700">{error.message}</p>
						) : null}
						<PersonalGraphVaultPicker onVaultChanged={handleRefreshAll} />
						<Popover open={isCaptureQueueOpen} onOpenChange={handleCaptureQueueOpenChange}>
							<PopoverTrigger
								render={
									<Button
										aria-label="Capture queue"
										className="size-10 rounded-full border-neutral-950/8 bg-white/5 text-neutral-950 shadow-none hover:bg-white/20"
										size="icon"
										variant="outline"
									/>
								}
							>
								<UploadIcon label="" />
							</PopoverTrigger>
							<PopoverContent
								align="end"
								aria-label="Capture queue"
								className="w-[min(320px,calc(100vw-32px))] bg-transparent p-0 text-neutral-950 shadow-none"
								sideOffset={10}
							>
								<PersonalGraphGlassPanel contentClassName="max-h-[min(70svh,560px)] overflow-y-auto p-4" radius={24}>
									<PersonalGraphCaptureQueue onRawAdded={handleRefreshAll} refreshKey={refreshKey} />
								</PersonalGraphGlassPanel>
							</PopoverContent>
						</Popover>
						<Button
							aria-label="Refresh graph"
							className="size-10 rounded-full border-neutral-950/8 bg-white/5 text-neutral-950 shadow-none hover:bg-white/20"
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
							className="size-10 rounded-full border-neutral-950/8 bg-white/5 text-neutral-950 shadow-none hover:bg-white/20"
							onClick={handleToggleParameterPanel}
							size="icon"
							variant="outline"
						>
							<SettingsIcon label="" />
						</Button>
						<div className="[&_[data-slot=button]]:size-10 [&_[data-slot=button]]:rounded-full [&_[data-slot=button]]:border [&_[data-slot=button]]:border-neutral-950/8 [&_[data-slot=button]]:bg-white/5 [&_[data-slot=button]]:text-neutral-950 [&_[data-slot=button]]:shadow-none [&_[data-slot=button]:hover]:bg-white/20">
							<ThemeToggle />
						</div>
					</div>
				</div>
			</header>

			<section className="absolute inset-0 z-10" aria-label="Vault graph">
				<Graph
					background="transparent"
					className="h-full"
					explorer={explorer}
					isLoading={isLoading}
					onSelectedNodeIdChange={setSelectedNodeId}
					params={neuralParams}
					selectedNodeId={selectedNodeId}
					showControls={false}
					showSelectionOverlay={false}
					themeMode="light"
					variant="fill"
				/>
			</section>

			<section
				aria-label="Personal Graph search and chat"
				className="pointer-events-none absolute bottom-6 left-4 right-4 z-40 flex justify-center sm:bottom-8 lg:left-[360px] lg:right-[360px]"
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
					className="absolute right-6 top-[320px] z-40 w-[min(320px,calc(100vw-32px))] text-neutral-950 xl:top-[112px]"
				>
					<PersonalGraphGlassPanel contentClassName="max-h-[calc(100svh-136px)] overflow-y-auto p-4" radius={24}>
						<div className="mb-4 flex items-center justify-between gap-3">
							<p className="text-xs font-semibold text-neutral-950">Neural graph</p>
							<Button
								aria-label="Close graph parameters"
								className="size-8 rounded-full bg-white/5 text-neutral-950 shadow-none hover:bg-white/20"
								onClick={() => setIsParameterPanelOpen(false)}
								size="icon-sm"
								variant="ghost"
							>
								<CrossIcon label="" />
							</Button>
						</div>
						<PersonalGraphNeuralControls onChange={handleNeuralParamsChange} params={neuralParams} />
					</PersonalGraphGlassPanel>
				</aside>
			) : null}

			<PersonalGraphInspector
				explorer={explorer}
				node={displayedNode}
				onClose={() => setSelectedNodeId(null)}
				onSelectNode={setSelectedNodeId}
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
