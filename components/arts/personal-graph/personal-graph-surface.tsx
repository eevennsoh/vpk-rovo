"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
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
import { usePersonalGraphIntro } from "./hooks/use-personal-graph-intro";
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

const NODE_KIND_MARKERS: Record<VaultNodeKind, string> = {
	concept: "rotate-45 rounded-[2px] bg-orange-300",
	entity: "rounded-full bg-green-500",
	raw: "rounded-[2px] bg-red-500",
	source: "rounded-full bg-blue-600",
	synthesis: "rotate-45 rounded-[2px] bg-purple-600",
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
			className="absolute right-6 top-[320px] z-30 hidden w-[min(340px,calc(100vw-48px))] text-text lg:block xl:top-[112px]"
		>
			<PersonalGraphGlassPanel contentClassName="p-4" radius={24}>
				<div className="mb-5 flex items-start justify-between gap-4">
					<h2 className="text-base font-semibold leading-5">{node.title}</h2>
					<Button
						aria-label="Close graph details"
						className="size-8 rounded-full bg-bg-neutral-subtle text-text shadow-none hover:bg-bg-neutral-subtle-hovered"
						onClick={onClose}
						size="icon-sm"
						variant="ghost"
					>
						<CrossIcon label="" />
					</Button>
				</div>
				<div className="border-b border-border pb-4">
					<div className="mb-3 text-xs font-medium text-text-subtlest">Kind</div>
					<div className="flex items-center gap-3 text-sm">
						<GraphNodeMarker kind={node.kind} />
						<span>{node.kind.replace("_", " ")}</span>
					</div>
				</div>
				<div className="border-b border-border py-4">
					<div className="mb-3 text-xs font-medium text-text-subtlest">Links</div>
					<div className="flex items-center justify-between text-sm">
						<span>{node.connectionCount}</span>
						<ChevronRightIcon label="" />
					</div>
				</div>
				<div className="border-b border-border py-4">
					<div className="mb-2 text-xs font-medium text-text-subtlest">Excerpt</div>
					<p className="text-sm leading-6 text-text-subtle">{node.bodyPreview || node.relativePath}</p>
				</div>
				{relatedNodes.length > 0 ? (
					<div className="py-4">
						<div className="mb-3 text-xs font-medium text-text-subtlest">Related pages</div>
						<div className="space-y-2">
							{relatedNodes.map((relatedNode) => (
								<button
									className="flex w-full items-center justify-between gap-3 rounded-2xl border border-border bg-bg-neutral-subtle px-3 py-3 text-left text-sm text-text transition-colors duration-normal hover:bg-bg-neutral-subtle-hovered"
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
				<div className="mt-4 flex items-center justify-between gap-2 border-t border-border pt-4">
					<div className="flex gap-2">
						<Button
							aria-label="Copy node title"
							className="size-8 rounded-full bg-bg-neutral-subtle text-text shadow-none hover:bg-bg-neutral-subtle-hovered"
							onClick={() => void navigator.clipboard?.writeText(node.title)}
							size="icon-sm"
							variant="ghost"
						>
							<CopyIcon label="" />
						</Button>
						<Button
							aria-label="Open node source"
							className="size-8 rounded-full bg-bg-neutral-subtle text-text shadow-none hover:bg-bg-neutral-subtle-hovered"
							onClick={() => window.open(`/api/personal-graph/page/${node.slug}`, "_blank", "noopener,noreferrer")}
							size="icon-sm"
							variant="ghost"
						>
							<LinkExternalIcon label="" />
						</Button>
					</div>
					<Button
						aria-label="More graph detail actions"
						className="size-8 rounded-full bg-bg-neutral-subtle text-text shadow-none hover:bg-bg-neutral-subtle-hovered"
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
				<h2 className="text-base font-semibold text-text">Capture queue</h2>
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
	const { phase } = usePersonalGraphIntro();
	const isHeaderRevealed = phase === "title" || phase === "subtext" || phase === "controls" || phase === "settle" || phase === "search" || phase === "graph" || phase === "done";
	const isSubtextRevealed = phase === "subtext" || phase === "controls" || phase === "settle" || phase === "search" || phase === "graph" || phase === "done";
	const isControlsRevealed = phase === "controls" || phase === "settle" || phase === "search" || phase === "graph" || phase === "done";
	const isPostSettle = phase === "settle" || phase === "search" || phase === "graph" || phase === "done";
	const isSearchRevealed = phase === "search" || phase === "graph" || phase === "done";
	const isGraphRevealed = phase === "graph" || phase === "done";
	const easeOut: [number, number, number, number] = [0, 0.4, 0, 1];
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
			className={cn("relative isolate min-h-svh overflow-hidden bg-surface text-text", className)}
			style={style}
			{...props}
		>
			<PersonalGraphBackdrop className="z-0" />
			<header className="absolute inset-x-4 top-6 z-30 sm:inset-x-6 lg:inset-x-8">
				<motion.div
					className="relative flex flex-col items-center"
					initial={{ y: "35svh", gap: "24px" }}
					animate={{ y: isPostSettle ? 0 : "35svh", gap: isPostSettle ? "16px" : "24px" }}
					transition={{
						default: { type: "spring", stiffness: 220, damping: 30 },
						gap: { duration: 0.45, ease: easeOut },
					}}
					style={{ willChange: "transform" }}
				>
					<motion.div
						className="mx-auto min-w-0 max-w-full text-center text-text"
						initial={{ opacity: 0, y: 20, filter: "blur(20px)" }}
						animate={{
							opacity: isHeaderRevealed ? 1 : 0,
							y: isHeaderRevealed ? 0 : 20,
							filter: isHeaderRevealed ? "blur(0px)" : "blur(20px)",
						}}
						transition={{ duration: 1.0, ease: easeOut }}
						style={{ willChange: "filter, opacity" }}
					>
						<PersonalGraphTitle
							className="leading-[0.8] text-text"
							style={PERSONAL_GRAPH_TITLE_FONT_STYLE}
							initial={{ fontSize: "8rem" }}
							animate={{ fontSize: isPostSettle ? "3rem" : "8rem" }}
							transition={{ duration: 1.0, ease: easeOut }}
							play={isHeaderRevealed}
						/>
						<motion.p
							className="truncate leading-none tracking-normal text-text"
							style={{ ...PERSONAL_GRAPH_META_FONT_STYLE, willChange: "filter, opacity" }}
							initial={{ opacity: 0, y: 15, filter: "blur(12px)", fontSize: "1.4rem", marginTop: "1rem" }}
							animate={{
								opacity: isSubtextRevealed ? 1 : 0,
								y: isSubtextRevealed ? 0 : 15,
								filter: isSubtextRevealed ? "blur(0px)" : "blur(12px)",
								fontSize: isPostSettle ? "0.75rem" : "1.4rem",
								marginTop: isPostSettle ? "0.5rem" : "1rem",
							}}
							transition={{ duration: 0.5, ease: easeOut }}
						>
							{getGraphStatsText(explorer)}
						</motion.p>
					</motion.div>
					<motion.div
						className="flex min-w-0 max-w-full flex-wrap items-center justify-center gap-2 text-center"
						initial="hidden"
						animate={isControlsRevealed ? "shown" : "hidden"}
						variants={{
							hidden: {},
							shown: { transition: { staggerChildren: 0.06, delayChildren: 0 } },
						}}
					>
						{error ? (
							<p className="max-w-[360px] truncate text-xs text-text-danger">{error.message}</p>
						) : null}
						<motion.div
							variants={{
								hidden: { opacity: 0, y: 10, filter: "blur(8px)" },
								shown: { opacity: 1, y: 0, filter: "blur(0px)" },
							}}
							transition={{ duration: 0.4, ease: easeOut }}
							style={{ willChange: "transform, filter, opacity" }}
						>
							<PersonalGraphVaultPicker onVaultChanged={handleRefreshAll} />
						</motion.div>
						<motion.div
							variants={{
								hidden: { opacity: 0, y: 10, filter: "blur(8px)" },
								shown: { opacity: 1, y: 0, filter: "blur(0px)" },
							}}
							transition={{ duration: 0.4, ease: easeOut }}
							style={{ willChange: "transform, filter, opacity" }}
						>
							<Popover open={isCaptureQueueOpen} onOpenChange={handleCaptureQueueOpenChange}>
								<PopoverTrigger
									render={
										<Button
											aria-label="Capture queue"
											className="size-10 rounded-full border-border bg-bg-neutral-subtle text-text shadow-none hover:bg-bg-neutral-subtle-hovered"
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
									className="w-[min(320px,calc(100vw-32px))] bg-transparent p-0 text-text shadow-none"
									sideOffset={10}
								>
									<PersonalGraphGlassPanel contentClassName="max-h-[min(70svh,560px)] overflow-y-auto p-4" radius={24}>
										<PersonalGraphCaptureQueue onRawAdded={handleRefreshAll} refreshKey={refreshKey} />
									</PersonalGraphGlassPanel>
								</PopoverContent>
							</Popover>
						</motion.div>
						<motion.div
							variants={{
								hidden: { opacity: 0, y: 10, filter: "blur(8px)" },
								shown: { opacity: 1, y: 0, filter: "blur(0px)" },
							}}
							transition={{ duration: 0.4, ease: easeOut }}
							style={{ willChange: "transform, filter, opacity" }}
						>
							<Button
								aria-label="Refresh graph"
								className="size-10 rounded-full border-border bg-bg-neutral-subtle text-text shadow-none hover:bg-bg-neutral-subtle-hovered"
								disabled={isLoading}
								onClick={handleRefreshAll}
								size="icon"
								variant="outline"
							>
								<RefreshIcon label="" />
							</Button>
						</motion.div>
						<motion.div
							variants={{
								hidden: { opacity: 0, y: 10, filter: "blur(8px)" },
								shown: { opacity: 1, y: 0, filter: "blur(0px)" },
							}}
							transition={{ duration: 0.4, ease: easeOut }}
							style={{ willChange: "transform, filter, opacity" }}
						>
							<Button
								aria-expanded={isParameterPanelOpen}
								aria-label="Graph parameters"
								className="size-10 rounded-full border-border bg-bg-neutral-subtle text-text shadow-none hover:bg-bg-neutral-subtle-hovered"
								onClick={handleToggleParameterPanel}
								size="icon"
								variant="outline"
							>
								<SettingsIcon label="" />
							</Button>
						</motion.div>
						<motion.div
							className="[&_[data-slot=button]]:size-10 [&_[data-slot=button]]:rounded-full [&_[data-slot=button]]:border [&_[data-slot=button]]:border-border [&_[data-slot=button]]:bg-bg-neutral-subtle [&_[data-slot=button]]:text-text [&_[data-slot=button]]:shadow-none [&_[data-slot=button]:hover]:bg-bg-neutral-subtle-hovered"
							variants={{
								hidden: { opacity: 0, y: 10, filter: "blur(8px)" },
								shown: { opacity: 1, y: 0, filter: "blur(0px)" },
							}}
							transition={{ duration: 0.4, ease: easeOut }}
							style={{ willChange: "transform, filter, opacity" }}
						>
							<ThemeToggle />
						</motion.div>
					</motion.div>
				</motion.div>
			</header>

			<motion.section
				className="absolute inset-0 z-10"
				aria-label="Vault graph"
				initial={{ clipPath: "circle(0% at 50% 92%)", opacity: 0.4 }}
				animate={{
					clipPath: isGraphRevealed ? "circle(180% at 50% 92%)" : "circle(0% at 50% 92%)",
					opacity: isGraphRevealed ? 1 : 0.4,
				}}
				transition={{
					clipPath: { duration: 1.2, ease: [0.16, 1, 0.3, 1] },
					opacity: { duration: 0.8, ease: easeOut },
				}}
			>
				<div className="h-full" style={{ transform: "translateY(-10px)" }}>
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
						variant="fill"
					/>
				</div>
			</motion.section>

			<motion.section
				aria-label="Personal Graph search and chat"
				className="pointer-events-none absolute left-4 right-4 z-40 flex justify-center sm:inset-x-6 lg:left-[360px] lg:right-[360px]"
				initial={{ opacity: 0, bottom: -120 }}
				animate={{
					opacity: isSearchRevealed ? 1 : 0,
					bottom: isSearchRevealed ? 24 : -120,
				}}
				transition={{
					opacity: { duration: 0.5, ease: easeOut },
					bottom: { duration: 0.6, ease: easeOut },
				}}
			>
				<div className="pointer-events-auto relative w-full max-w-[760px]">
					<div className="pointer-events-none absolute left-1/2 top-0 z-10 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-border-inverse bg-bg-neutral-bold shadow-lg" />
					<PersonalGraphSearch
						onSelectSlug={(slug) => {
							const node = explorer?.nodes.find((candidate) => candidate.slug === slug);
							if (node) setSelectedNodeId(node.id);
						}}
					/>
				</div>
			</motion.section>

			{isParameterPanelOpen ? (
				<aside
					aria-label="Neural graph parameters"
					className="absolute right-6 top-[320px] z-40 w-[min(320px,calc(100vw-32px))] text-text xl:top-[112px]"
				>
					<PersonalGraphGlassPanel contentClassName="max-h-[calc(100svh-136px)] overflow-y-auto p-4" radius={24}>
						<div className="mb-4 flex items-center justify-between gap-3">
							<p className="text-xs font-semibold text-text">Neural graph</p>
							<Button
								aria-label="Close graph parameters"
								className="size-8 rounded-full bg-bg-neutral-subtle text-text shadow-none hover:bg-bg-neutral-subtle-hovered"
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
