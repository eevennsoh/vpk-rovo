"use client";

import { useEffect, useRef } from "react";
import AiGenerativeTextSummaryIcon from "@atlaskit/icon/core/ai-generative-text-summary";
import DownloadIcon from "@atlaskit/icon/core/download";
import RefreshIcon from "@atlaskit/icon/core/refresh";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { usePersonalGraphSummary } from "./hooks/use-personal-graph-summary";
import type { PersonalGraphSummaryLength, VaultExplorer, VaultNode } from "./lib/personal-graph-types";
import { PersonalGraphGlassPanel } from "./personal-graph-glass-panel";

const SUMMARY_LENGTH_OPTIONS: Array<{ label: string; value: PersonalGraphSummaryLength }> = [
	{ label: "Short", value: "short" },
	{ label: "Medium", value: "medium" },
	{ label: "Long", value: "long" },
];

const TWG_WORK_WINDOW_OPTIONS = [
	{ label: "7 days", value: "7d" },
	{ label: "14 days", value: "14d" },
	{ label: "30 days", value: "30d" },
] as const;

interface PersonalGraphSummaryPanelProps {
	explorer: VaultExplorer | null;
	node: VaultNode | null;
	onSelectNode?: (nodeId: string) => void;
	onWorkWindowChange?: (workWindow: string) => void;
	workWindow?: string;
}

function downloadHtml(filename: string, html: string) {
	const blob = new Blob([html], { type: "text/html;charset=utf-8" });
	const url = URL.createObjectURL(blob);
	const link = document.createElement("a");
	link.href = url;
	link.download = filename;
	link.click();
	URL.revokeObjectURL(url);
}

export function PersonalGraphSummaryPanel({
	explorer,
	node,
	onSelectNode,
	onWorkWindowChange,
	workWindow = "7d",
}: Readonly<PersonalGraphSummaryPanelProps>) {
	const articleFrameRef = useRef<HTMLIFrameElement | null>(null);
	const summary = usePersonalGraphSummary(node, explorer);

	useEffect(() => {
		if (!onSelectNode) return;
		const handleSelectNode: (nodeId: string) => void = onSelectNode;

		function handleMessage(event: MessageEvent) {
			const expectedSource = articleFrameRef.current?.contentWindow;
			if (!expectedSource || event.source !== expectedSource || event.origin !== "null") {
				return;
			}
			const data = event.data as { nodeId?: unknown; type?: unknown };
			if (data?.type !== "personal-graph-select-node" || typeof data.nodeId !== "string") {
				return;
			}
			handleSelectNode(data.nodeId);
		}

		window.addEventListener("message", handleMessage);
		return () => window.removeEventListener("message", handleMessage);
	}, [onSelectNode]);

	if (!node) return null;

	const isRunning = summary.status === "running";
	const hasArticle = Boolean(summary.summaryHtml);
	const isTwgNode = node.provider === "twg";
	const isTwgSetupError = summary.errorCode === "TWG_CACHE_REQUIRED" || /Team Work Graph/iu.test(summary.error ?? "");
	const statusText = summary.error
		? summary.error
		: isRunning
			? `Generating ${summary.length} article${summary.stage ? ` (${summary.stage})` : ""}...`
			: hasArticle
				? "Editorial HTML article ready."
				: "Generate an editorial HTML article.";

	function handleGenerate(nextLength = summary.length, bypassCache = false) {
		void summary.generateSummary(nextLength, {
			bypassCache,
			workWindow: isTwgNode ? workWindow : null,
		});
	}

	return (
		<PersonalGraphGlassPanel
			className="mb-3 text-text"
			contentClassName="max-h-[min(64svh,640px)] overflow-auto p-4"
			radius={24}
		>
			<div className="flex items-start justify-between gap-3">
				<div className="min-w-0">
					<div className="flex items-center gap-2 text-xs font-medium text-text-subtlest">
						<AiGenerativeTextSummaryIcon label="" />
						<span>Selected node summary</span>
					</div>
					<h2 className="mt-1 truncate text-sm font-semibold text-text">{node.title}</h2>
				</div>
				<div className="flex shrink-0 rounded-full border border-border bg-bg-neutral-subtle p-1">
					{SUMMARY_LENGTH_OPTIONS.map((option) => (
						<Button
							aria-pressed={summary.length === option.value}
							className={cn(
								"h-7 rounded-full px-3 text-xs shadow-none",
								summary.length === option.value
									? "bg-bg-selected text-text-selected hover:bg-bg-selected-hovered"
									: "text-text-subtle",
							)}
							disabled={isRunning}
							key={option.value}
							onClick={() => {
								if (summary.length !== option.value) {
									handleGenerate(option.value);
								}
							}}
							size="sm"
							type="button"
							variant="ghost"
						>
							{option.label}
						</Button>
					))}
				</div>
			</div>

			{isTwgNode ? (
				<div className="mt-3 flex flex-wrap items-center gap-2 rounded-md border border-border bg-bg-neutral px-3 py-2 text-xs text-text-subtle">
					<label className="font-medium text-text-subtle" htmlFor="personal-graph-summary-work-window">
						TWG work window
					</label>
					<select
						className="rounded-md border border-border bg-surface px-2 py-1 text-text outline-none focus:border-border-selected focus:ring-2 focus:ring-ring/30"
						disabled={isRunning}
						id="personal-graph-summary-work-window"
						onChange={(event) => onWorkWindowChange?.(event.target.value)}
						value={workWindow}
					>
						{TWG_WORK_WINDOW_OPTIONS.map((option) => (
							<option key={option.value} value={option.value}>{option.label}</option>
						))}
					</select>
					<span>Refreshes TWG context before future summaries.</span>
				</div>
			) : null}

			<div
				aria-live="polite"
				className={cn(
					"mt-3 flex items-center gap-2 rounded-md border border-border bg-bg-neutral px-3 py-2 text-xs text-text-subtle",
					summary.error ? "border-border-danger text-text-danger" : null,
				)}
				role="status"
			>
				{isRunning ? <Spinner label="Generating summary article" size="xs" /> : null}
				<span>{statusText}</span>
			</div>

			{isTwgSetupError ? (
				<div className="mt-3 rounded-md border border-border-warning bg-bg-warning px-3 py-2 text-xs leading-5 text-text">
					Run <code className="rounded bg-bg-neutral-subtle px-1 py-0.5 font-mono">twg login</code>, refresh Team Work Graph, then retry.
					This panel never accepts passwords, OAuth tokens, API tokens, or Authorization headers.
				</div>
			) : null}

			<div className="mt-3 flex flex-wrap gap-2">
				<Button
					disabled={isRunning}
					isLoading={isRunning}
					onClick={() => handleGenerate(summary.length, false)}
					size="sm"
					type="button"
				>
					{hasArticle ? "Load cached" : "Generate"}
				</Button>
				<Button
					disabled={isRunning}
					onClick={() => handleGenerate(summary.length, true)}
					size="sm"
					type="button"
					variant="outline"
				>
					<RefreshIcon label="" />
					Regenerate
				</Button>
				{hasArticle ? (
					<Button
						onClick={() => downloadHtml(summary.exportFilename || `${node.slug || "personal-graph-summary"}.html`, summary.summaryHtml)}
						size="sm"
						type="button"
						variant="outline"
					>
						<DownloadIcon label="" />
						Export HTML
					</Button>
				) : null}
				{summary.cacheStatus ? (
					<span className="self-center rounded-full border border-border bg-bg-neutral-subtle px-2.5 py-1 text-xs text-text-subtle">
						Cache {summary.cacheStatus}
					</span>
				) : null}
			</div>

			{summary.sourceNotice ? (
				<div className="mt-3 rounded-md border border-border-warning bg-bg-warning px-3 py-2 text-xs leading-5 text-text">
					{summary.sourceNotice}
				</div>
			) : null}

			{hasArticle ? (
				<div className="mt-4 overflow-hidden rounded-md border border-border bg-surface">
					<iframe
						className="h-[min(58svh,620px)] w-full bg-surface"
						ref={articleFrameRef}
						sandbox="allow-popups allow-scripts"
						srcDoc={summary.summaryHtml}
						title="Personal Graph summary article"
					/>
				</div>
			) : null}
		</PersonalGraphGlassPanel>
	);
}
