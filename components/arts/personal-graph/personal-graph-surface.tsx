"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring } from "motion/react";
import ChevronRightIcon from "@atlaskit/icon/core/chevron-right";
import CopyIcon from "@atlaskit/icon/core/copy";
import CrossIcon from "@atlaskit/icon/core/cross";
import LinkExternalIcon from "@atlaskit/icon/core/link-external";
import ShowMoreHorizontalIcon from "@atlaskit/icon/core/show-more-horizontal";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useTheme } from "@/components/utils/theme-wrapper";
import Graph, { ROVO_GRAPH_DEFAULT_PARAMS } from "@/components/website/demos/visual/graph";
import { cn } from "@/lib/utils";
import { usePersonalGraphIntro } from "./hooks/use-personal-graph-intro";
import { useVaultExplorer } from "./hooks/use-vault-explorer";
import { useVaultSettings } from "./hooks/use-vault-settings";
import { DEFAULT_NEURAL_RAY_SOUND_SETTINGS } from "./lib/neural-graph/ray-sound";
import {
	RESPONSIVE_PERSONAL_GRAPH_WIDTHS,
	getResponsivePersonalGraphParams,
	shouldAnimateResponsivePersonalGraphParams,
	type ResponsivePersonalGraphViewport,
} from "./lib/neural-graph/responsive-params";
import type { NeuralGraphParams } from "./lib/neural-graph/params";
import type { VaultExplorer, VaultNode, VaultNodeKind } from "./lib/personal-graph-types";
import { PersonalGraphBackdrop } from "./personal-graph-backdrop";
import type { PersonalGraphControlFlyoutAction } from "./personal-graph-control-flyout";
import { PersonalGraphDropzone } from "./personal-graph-dropzone";
import { PersonalGraphGlassPanel } from "./personal-graph-glass-panel";
import { PersonalGraphIngestButton } from "./personal-graph-ingest-button";
import { PersonalGraphLog } from "./personal-graph-log";
import {
	PixelDarkIcon,
	PixelIngestIcon,
	PixelLightIcon,
	PixelRefreshIcon,
	PixelResetIcon,
	PixelSystemIcon,
	PixelVaultIcon,
} from "./personal-graph-pixel-icons";
import { PersonalGraphSearch } from "./personal-graph-search";
import { PersonalGraphTitle } from "./personal-graph-title-scramble";

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

const PERSONAL_GRAPH_TITLE_LONGEST_LINE_WIDTH_EM = 3.15;
const PERSONAL_GRAPH_SETTLED_TITLE_SCRAMBLE_LINE_CHAR_COUNT = 8;
const PERSONAL_GRAPH_HEADER_INITIAL_Y = "35svh";
const PERSONAL_GRAPH_HEADER_SETTLED_Y = "0px";
const PERSONAL_GRAPH_TITLE_INK_TOP_PADDING = "0px";
const PERSONAL_GRAPH_INITIAL_TITLE_SIZE =
	`min(8rem, calc((100svw - 3rem) / ${PERSONAL_GRAPH_TITLE_LONGEST_LINE_WIDTH_EM}))`;
const PERSONAL_GRAPH_SETTLED_TITLE_SIZE =
	`min(3rem, calc((100cqw - 1rem) / ${PERSONAL_GRAPH_SETTLED_TITLE_SCRAMBLE_LINE_CHAR_COUNT}))`;
const PERSONAL_GRAPH_PROMPT_INPUT_BOTTOM_PX = 24;
const PERSONAL_GRAPH_PROMPT_INPUT_HEIGHT_PX = 64;
const PERSONAL_GRAPH_TAIL_PROMPT_GAP_PX = 8;
const PERSONAL_GRAPH_TAIL_MARKER_SIZE_PX = ROVO_GRAPH_DEFAULT_PARAMS.originMarkerSize;
const PERSONAL_GRAPH_STAGE_TRANSLATE_Y_PX = -10;
const PERSONAL_GRAPH_TAIL_BOTTOM_OFFSET_PX =
	PERSONAL_GRAPH_PROMPT_INPUT_BOTTOM_PX +
	PERSONAL_GRAPH_PROMPT_INPUT_HEIGHT_PX +
	PERSONAL_GRAPH_TAIL_PROMPT_GAP_PX +
	PERSONAL_GRAPH_TAIL_MARKER_SIZE_PX / 2 +
	PERSONAL_GRAPH_STAGE_TRANSLATE_Y_PX;
const PERSONAL_GRAPH_RESPONSIVE_PARAMS_SPRING = {
	damping: 28,
	mass: 0.7,
	restDelta: 0.5,
	stiffness: 150,
} as const;
const PERSONAL_GRAPH_RESPONSIVE_PARAMS_INSTANT = {
	damping: 200,
	mass: 0.05,
	restDelta: 0.5,
	stiffness: 4000,
} as const;
const PERSONAL_GRAPH_RESPONSIVE_INITIAL_VIEWPORT = {
	height: 720,
	width: RESPONSIVE_PERSONAL_GRAPH_WIDTHS.wide,
} satisfies ResponsivePersonalGraphViewport;

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

function useResponsivePersonalGraphParams(stageRef: React.RefObject<HTMLDivElement | null>) {
	const reduceMotion = Boolean(useReducedMotion());
	const targetWidthMV = useMotionValue<number>(PERSONAL_GRAPH_RESPONSIVE_INITIAL_VIEWPORT.width);
	const smoothWidthMV = useSpring(
		targetWidthMV,
		reduceMotion ? PERSONAL_GRAPH_RESPONSIVE_PARAMS_INSTANT : PERSONAL_GRAPH_RESPONSIVE_PARAMS_SPRING,
	);
	const didMeasureViewportRef = useRef(false);
	const viewportRef = useRef<ResponsivePersonalGraphViewport>(PERSONAL_GRAPH_RESPONSIVE_INITIAL_VIEWPORT);
	const [viewport, setViewport] = useState<ResponsivePersonalGraphViewport>(PERSONAL_GRAPH_RESPONSIVE_INITIAL_VIEWPORT);
	const [params, setParams] = useState<NeuralGraphParams>(() =>
		getResponsivePersonalGraphParams(PERSONAL_GRAPH_RESPONSIVE_INITIAL_VIEWPORT, ROVO_GRAPH_DEFAULT_PARAMS),
	);

	useEffect(() => {
		const stageElement = stageRef.current;
		if (!stageElement) {
			return;
		}

		function updateViewport() {
			const currentStageElement = stageRef.current;
			if (!currentStageElement) {
				return;
			}

			const rect = currentStageElement.getBoundingClientRect();
			const nextViewport = {
				height: Math.max(1, rect.height),
				width: Math.max(1, rect.width),
			} satisfies ResponsivePersonalGraphViewport;

			setViewport((currentViewport) => {
				if (
					Math.abs(currentViewport.height - nextViewport.height) < 1 &&
					Math.abs(currentViewport.width - nextViewport.width) < 1
				) {
					return currentViewport;
				}

				return nextViewport;
			});
		}

		updateViewport();
		if (typeof ResizeObserver === "undefined") {
			window.addEventListener("resize", updateViewport);
			return () => {
				window.removeEventListener("resize", updateViewport);
			};
		}

		const resizeObserver = new ResizeObserver(updateViewport);
		resizeObserver.observe(stageElement);
		return () => resizeObserver.disconnect();
	}, [stageRef]);

	useEffect(() => {
		return smoothWidthMV.on("change", (width) => {
			setParams(getResponsivePersonalGraphParams({ ...viewportRef.current, width }, ROVO_GRAPH_DEFAULT_PARAMS));
		});
	}, [smoothWidthMV]);

	useEffect(() => {
		viewportRef.current = viewport;
		const shouldAnimateParams = shouldAnimateResponsivePersonalGraphParams({
			hasMeasuredViewport: didMeasureViewportRef.current,
			prefersReducedMotion: reduceMotion,
		});

		if (!shouldAnimateParams) {
			targetWidthMV.jump(viewport.width);
			smoothWidthMV.jump(viewport.width);
			setParams(getResponsivePersonalGraphParams(viewport, ROVO_GRAPH_DEFAULT_PARAMS));
			didMeasureViewportRef.current = true;
			return;
		}

		targetWidthMV.set(viewport.width);
	}, [reduceMotion, smoothWidthMV, targetWidthMV, viewport]);

	return params;
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
	const {
		isResetting: isVaultResetting,
		isSelecting: isVaultSelecting,
		resetFolder: resetVault,
		selectFolder: selectVault,
		settings: vaultSettings,
	} = useVaultSettings();
	const { actualTheme, setTheme, theme } = useTheme();
	const { phase } = usePersonalGraphIntro();
	const isHeaderRevealed = phase === "title" || phase === "subtext" || phase === "controls" || phase === "settle" || phase === "search" || phase === "graph" || phase === "done";
	const isSubtextRevealed = phase === "subtext" || phase === "controls" || phase === "settle" || phase === "search" || phase === "graph" || phase === "done";
	const isPostSettle = phase === "settle" || phase === "search" || phase === "graph" || phase === "done";
	const isSearchRevealed = phase === "search" || phase === "graph" || phase === "done";
	const isGraphRevealed = isSearchRevealed;
	const easeOut: [number, number, number, number] = [0, 0.4, 0, 1];
	const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
	const [refreshKey, setRefreshKey] = useState(0);
	const [isCaptureQueueOpen, setIsCaptureQueueOpen] = useState(false);
	const graphStageRef = useRef<HTMLDivElement | null>(null);
	const responsiveGraphParams = useResponsivePersonalGraphParams(graphStageRef);
	const displayedNode = useMemo(() => getSelectedNode(explorer, selectedNodeId), [explorer, selectedNodeId]);

	const handleRefreshAll = useCallback(() => {
		setRefreshKey((current) => current + 1);
		void refresh();
	}, [refresh]);
	const handleCaptureQueueOpenChange = useCallback((isOpen: boolean) => {
		setIsCaptureQueueOpen(isOpen);
	}, []);
	const handleChooseVault = useCallback(async () => {
		const next = await selectVault();
		if (next?.status === "ready") {
			handleRefreshAll();
		}
	}, [handleRefreshAll, selectVault]);
	const handleResetVault = useCallback(async () => {
		const next = await resetVault();
		if (next) {
			handleRefreshAll();
		}
	}, [handleRefreshAll, resetVault]);
	const handleToggleTheme = useCallback(() => {
		if (theme === "light") {
			setTheme("dark");
		} else if (theme === "dark") {
			setTheme("system");
		} else {
			setTheme("light");
		}
	}, [setTheme, theme]);

	const isVaultReady = vaultSettings?.status === "ready";
	const themeLabel = theme === "system" ? "System theme" : theme === "dark" ? "Dark theme" : "Light theme";

	const flyoutActions = useMemo<ReadonlyArray<PersonalGraphControlFlyoutAction>>(() => {
		const actions: PersonalGraphControlFlyoutAction[] = [
			{
				key: "vault",
				label: "Choose vault",
				render: (
					<Button
						aria-label="Choose Personal Graph vault folder"
						className="size-10 rounded-full border-border bg-bg-neutral-subtle text-text shadow-none hover:bg-bg-neutral-subtle-hovered disabled:border-transparent disabled:bg-bg-disabled disabled:text-text-disabled [&_svg]:text-icon-subtle"
						disabled={isVaultSelecting}
						isLoading={isVaultSelecting}
						onClick={handleChooseVault}
						size="icon"
						variant="outline"
					>
						<PixelVaultIcon />
					</Button>
				),
			},
			{
				key: "capture",
				label: "Capture queue",
				render: (
					<Popover open={isCaptureQueueOpen} onOpenChange={handleCaptureQueueOpenChange}>
						<PopoverTrigger
							render={
								<Button
									aria-label="Capture queue"
									className="size-10 rounded-full border-border bg-bg-neutral-subtle text-text shadow-none hover:bg-bg-neutral-subtle-hovered [&_svg]:text-icon-subtle"
									size="icon"
									variant="outline"
								/>
							}
						>
							<PixelIngestIcon />
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
				),
			},
			{
				key: "refresh",
				label: "Refresh graph",
				render: (
					<Button
						aria-label="Refresh graph"
						className="size-10 rounded-full border-border bg-bg-neutral-subtle text-text shadow-none hover:bg-bg-neutral-subtle-hovered [&_svg]:text-icon-subtle"
						disabled={isLoading}
						onClick={handleRefreshAll}
						size="icon"
						variant="outline"
					>
						<PixelRefreshIcon />
					</Button>
				),
			},
			{
				key: "theme",
				label: themeLabel,
				render: (
					<Button
						aria-label={themeLabel}
						className="size-10 rounded-full border-border bg-bg-neutral-subtle text-text shadow-none hover:bg-bg-neutral-subtle-hovered [&_svg]:text-icon-subtle"
						onClick={handleToggleTheme}
						size="icon"
						variant="outline"
					>
						{theme === "system" ? <PixelSystemIcon /> : actualTheme === "dark" ? <PixelDarkIcon /> : <PixelLightIcon />}
					</Button>
				),
			},
		];

		if (isVaultReady) {
			actions.push({
				key: "reset-vault",
				label: "Reset vault",
				render: (
					<Button
						aria-label="Reset Personal Graph vault selection"
						className="size-10 rounded-full border-border bg-bg-neutral-subtle text-text shadow-none hover:bg-bg-neutral-subtle-hovered disabled:border-transparent disabled:bg-bg-disabled disabled:text-text-disabled [&_svg]:text-icon-subtle"
						disabled={isVaultResetting}
						isLoading={isVaultResetting}
						onClick={handleResetVault}
						size="icon"
						variant="outline"
					>
						<PixelResetIcon />
					</Button>
				),
			});
		}

		return actions;
	}, [
		actualTheme,
		handleCaptureQueueOpenChange,
		handleChooseVault,
		handleRefreshAll,
		handleResetVault,
		handleToggleTheme,
		isCaptureQueueOpen,
		isLoading,
		isVaultReady,
		isVaultResetting,
		isVaultSelecting,
		refreshKey,
		theme,
		themeLabel,
	]);

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
			className={cn("relative isolate min-h-svh overflow-hidden bg-surface text-text", className)}
			style={style}
			{...props}
		>
			<PersonalGraphBackdrop className="z-0" />
			<header className="absolute inset-x-4 top-6 z-30 sm:inset-x-6 lg:inset-x-8">
				<motion.div
					className="relative flex flex-col items-center"
					initial={{ y: PERSONAL_GRAPH_HEADER_INITIAL_Y, gap: "24px" }}
					animate={{
						y: isPostSettle ? PERSONAL_GRAPH_HEADER_SETTLED_Y : PERSONAL_GRAPH_HEADER_INITIAL_Y,
						gap: isPostSettle ? "16px" : "24px",
					}}
					transition={{
						y: { duration: 0.7, ease: easeOut },
						gap: { duration: 0.45, ease: easeOut },
					}}
					style={{ willChange: "transform" }}
				>
					<motion.div
						className="mx-auto w-full min-w-0 max-w-full text-center text-text [container-type:inline-size]"
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
							initial={{ fontSize: PERSONAL_GRAPH_INITIAL_TITLE_SIZE, paddingTop: PERSONAL_GRAPH_TITLE_INK_TOP_PADDING }}
							animate={{
								fontSize: isPostSettle ? PERSONAL_GRAPH_SETTLED_TITLE_SIZE : PERSONAL_GRAPH_INITIAL_TITLE_SIZE,
								paddingTop: PERSONAL_GRAPH_TITLE_INK_TOP_PADDING,
							}}
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
					{error ? (
						<motion.p
							className="max-w-[360px] truncate text-xs text-text-danger"
							initial={{ opacity: 0 }}
							animate={{ opacity: isSubtextRevealed ? 1 : 0 }}
							transition={{ duration: 0.4, ease: easeOut }}
						>
							{error.message}
						</motion.p>
					) : null}
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
				<div
					className="h-full"
					ref={graphStageRef}
					style={{ transform: `translateY(${PERSONAL_GRAPH_STAGE_TRANSLATE_Y_PX}px)` }}
				>
					<Graph
						background="transparent"
						className="h-full"
						explorer={explorer}
						isLoading={isLoading}
						onSelectedNodeIdChange={setSelectedNodeId}
						params={responsiveGraphParams}
						rayOriginBottomOffset={PERSONAL_GRAPH_TAIL_BOTTOM_OFFSET_PX}
						raySoundSettings={DEFAULT_NEURAL_RAY_SOUND_SETTINGS}
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
				initial={{ bottom: -120 }}
				animate={{
					bottom: isSearchRevealed ? 24 : -120,
				}}
				transition={{
					bottom: { duration: 0.6, ease: easeOut },
				}}
			>
				<div className="pointer-events-auto relative w-full max-w-[760px]">
					<PersonalGraphSearch
						flyoutActions={flyoutActions}
						onSelectSlug={(slug) => {
							const node = explorer?.nodes.find((candidate) => candidate.slug === slug);
							if (node) setSelectedNodeId(node.id);
						}}
					/>
				</div>
			</motion.section>

			<PersonalGraphInspector
				explorer={explorer}
				node={displayedNode}
				onClose={() => setSelectedNodeId(null)}
				onSelectNode={setSelectedNodeId}
			/>

			<section className="sr-only" aria-label="Personal Graph text fallback">
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
			</section>
		</main>
	);
}

export const Surface = {
	Root: PersonalGraphSurface,
} as const;
