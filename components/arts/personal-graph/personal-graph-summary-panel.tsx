"use client";

import AiGenerativeTextSummaryIcon from "@atlaskit/icon/core/ai-generative-text-summary";
import DownloadIcon from "@atlaskit/icon/core/download";
import ProjectionScreenIcon from "@atlaskit/icon/core/projection-screen";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { usePersonalGraphSummary } from "./hooks/use-personal-graph-summary";
import type { PersonalGraphSummaryLength, VaultNode } from "./lib/personal-graph-types";
import { PersonalGraphGlassPanel } from "./personal-graph-glass-panel";

const SUMMARY_LENGTH_OPTIONS: Array<{ label: string; value: PersonalGraphSummaryLength }> = [
	{ label: "Short", value: "short" },
	{ label: "Medium", value: "medium" },
	{ label: "Long", value: "long" },
];

interface PersonalGraphSummaryPanelProps {
	node: VaultNode | null;
	onConfirmed?: () => void;
}

function downloadMarkdown(filename: string, content: string) {
	const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
	const url = URL.createObjectURL(blob);
	const link = document.createElement("a");
	link.href = url;
	link.download = filename;
	link.click();
	URL.revokeObjectURL(url);
}

export function PersonalGraphSummaryPanel({
	node,
	onConfirmed,
}: Readonly<PersonalGraphSummaryPanelProps>) {
	const summary = usePersonalGraphSummary(node?.id ?? null);
	if (!node) return null;

	const canConfirm = node.provider === "vault" && node.kind === "raw" && Boolean(summary.summary);
	const isRunning = summary.status === "running";
	const isDeckRunning = summary.deckStatus === "running";
	const statusText = summary.error
		? summary.error
		: isRunning
			? `Generating ${summary.length} summary...`
			: summary.status === "done"
				? "Summary preview ready."
				: "Choose a summary length.";

	return (
		<PersonalGraphGlassPanel
			className="mb-3 text-text"
			contentClassName="max-h-[min(56svh,520px)] overflow-auto p-4"
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
								summary.length === option.value && summary.status !== "idle"
									? "bg-bg-selected text-text-selected hover:bg-bg-selected-hovered"
									: "text-text-subtle",
							)}
							disabled={isRunning && summary.length === option.value}
							key={option.value}
							onClick={() => void summary.generateSummary(option.value)}
							size="sm"
							type="button"
							variant="ghost"
						>
							{option.label}
						</Button>
					))}
				</div>
			</div>
			<div
				className={cn(
					"mt-3 rounded-md border border-border bg-bg-neutral px-3 py-2 text-xs text-text-subtle",
					summary.error ? "border-border-danger text-text-danger" : null,
				)}
			>
				{statusText}
			</div>
			{summary.summary ? (
				<div className="mt-4 space-y-4">
					<div className="rounded-md border border-border bg-surface px-3 py-3">
						<div className="mb-2 text-xs font-medium text-text-subtle">Markdown summary</div>
						<div className="max-h-56 overflow-auto whitespace-pre-wrap text-sm leading-6 text-text">
							{summary.summary}
						</div>
					</div>
					{summary.takeaways.length > 0 ? (
						<div>
							<div className="mb-2 text-xs font-medium text-text-subtle">Takeaways</div>
							<ul className="list-disc space-y-1 pl-4 text-sm leading-5 text-text">
								{summary.takeaways.map((takeaway) => <li key={takeaway}>{takeaway}</li>)}
							</ul>
						</div>
					) : null}
					<div className="flex flex-wrap gap-2">
						{canConfirm ? (
							<Button
								disabled={summary.confirmStatus === "running"}
								isLoading={summary.confirmStatus === "running"}
								onClick={() => void summary.confirm(node.relativePath, onConfirmed)}
								size="sm"
								type="button"
							>
								Confirm
							</Button>
						) : null}
						<Button
							disabled={isDeckRunning}
							isLoading={isDeckRunning}
							onClick={() => void summary.generateDeck()}
							size="sm"
							type="button"
							variant="outline"
						>
							<ProjectionScreenIcon label="" />
							Generate slides
						</Button>
					</div>
				</div>
			) : null}
			{summary.confirmStatus === "done" ? (
				<div className="mt-3 rounded-md border border-border bg-bg-success-subtler px-3 py-2 text-xs text-text-success">
					Confirmed into the Personal Graph wiki.
				</div>
			) : null}
			{summary.deck ? (
				<div className="mt-4 rounded-md border border-border bg-surface p-3">
					<div className="mb-2 flex items-center justify-between gap-2">
						<div className="text-xs font-medium text-text-subtle">Marp deck</div>
						<Button
							onClick={() => downloadMarkdown(`${node.slug.replace(/[^\w.-]+/gu, "-") || "personal-graph-summary"}.marp.md`, summary.deck)}
							size="sm"
							type="button"
							variant="outline"
						>
							<DownloadIcon label="" />
							Download .md
						</Button>
					</div>
					<pre className="max-h-56 overflow-auto whitespace-pre-wrap text-xs leading-5 text-text-subtle">
						{summary.deck}
					</pre>
				</div>
			) : null}
		</PersonalGraphGlassPanel>
	);
}
