"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Lozenge } from "@/components/ui/lozenge";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { HermesSkillDraftDetail, HermesSkillDraftSummary } from "@/lib/rovo-runtime-types";
import type { ReactElement } from "react";

interface RovoAppHermesSkillDraftBarProps {
	activeIndex: number;
	draft: HermesSkillDraftSummary;
	draftDetail: HermesSkillDraftDetail | null;
	totalDrafts: number;
	isSubmitting?: boolean;
	onApprove: (draft: HermesSkillDraftSummary) => Promise<void> | void;
	onOpenReview: (draft: HermesSkillDraftSummary) => void;
	onReject: (draft: HermesSkillDraftSummary) => Promise<void> | void;
	onSelectIndex: (index: number) => void;
}

function getActionVariant(action: HermesSkillDraftSummary["action"]): "danger" | "neutral" | "success" | "warning" {
	if (action === "delete") {
		return "danger";
	}
	if (action === "update") {
		return "warning";
	}
	return "success";
}

export function RovoAppHermesSkillDraftBar({
	activeIndex,
	draft,
	draftDetail,
	totalDrafts,
	isSubmitting = false,
	onApprove,
	onOpenReview,
	onReject,
	onSelectIndex,
}: Readonly<RovoAppHermesSkillDraftBarProps>): ReactElement {
	const skillMarkdown = draftDetail?.files.find((file) => file.path === "SKILL.md")?.content ?? null;

	return (
		<section className="w-full" data-slot="hermes-skill-draft-review">
			<Card
				className="gap-0 overflow-hidden border-border bg-surface-raised shadow-[0_-2px_24px_rgba(9,30,66,0.08)]"
				size="sm"
			>
				<CardHeader className="border-b border-border/70 pb-3">
					<div className="flex items-start justify-between gap-3">
						<div className="min-w-0">
							<p className="text-[11px] font-semibold tracking-[0.18em] text-text-subtlest uppercase">
								Hermes skill review
							</p>
							<CardTitle className="mt-1 text-sm">
								{draft.category}/{draft.name}
							</CardTitle>
							<p className="mt-1 text-sm leading-6 text-text-subtle">
								{draft.rationale ?? draft.summary ?? "Review the proposed Hermes skill change for this thread."}
							</p>
						</div>
						{totalDrafts > 1 ? (
							<div className="shrink-0 rounded-full border border-border bg-surface px-2.5 py-1 text-[11px] font-medium text-text-subtle">
								{activeIndex + 1} / {totalDrafts}
							</div>
						) : null}
					</div>
				</CardHeader>

				<CardContent className="space-y-4 py-3">
					<div className="flex flex-wrap items-center gap-2">
						<Lozenge size="compact" variant={getActionVariant(draft.action)}>
							{draft.action}
						</Lozenge>
						<Badge variant="neutral">
							{draftDetail?.files.length ?? 0} file{draftDetail?.files.length === 1 ? "" : "s"}
						</Badge>
						{draft.sourceThreadId ? (
							<Badge variant="neutral">{draft.sourceThreadId}</Badge>
						) : null}
					</div>

					{skillMarkdown ? (
						<div className="space-y-2">
							<div className="text-xs font-medium uppercase tracking-wide text-text-subtlest">
								Draft SKILL.md preview
							</div>
							<ScrollArea className="max-h-40 rounded-xl border border-border bg-surface p-3">
								<pre className="whitespace-pre-wrap text-sm text-text-subtle">
									{skillMarkdown}
								</pre>
							</ScrollArea>
						</div>
					) : null}
				</CardContent>

				<CardFooter className="flex flex-wrap items-center gap-2">
					<Button
						disabled={isSubmitting}
						onClick={() => void onApprove(draft)}
						size="sm"
						type="button"
					>
						Approve
					</Button>
					<Button
						disabled={isSubmitting}
						onClick={() => void onReject(draft)}
						size="sm"
						type="button"
						variant="outline"
					>
						Reject
					</Button>
					<Button
						disabled={isSubmitting}
						onClick={() => onOpenReview(draft)}
						size="sm"
						type="button"
						variant="ghost"
					>
						Open full review
					</Button>

					{totalDrafts > 1 ? (
						<div className="ml-auto flex items-center gap-2">
							<Button
								disabled={isSubmitting || activeIndex === 0}
								onClick={() => onSelectIndex(Math.max(0, activeIndex - 1))}
								size="sm"
								type="button"
								variant="ghost"
							>
								Previous
							</Button>
							<Button
								disabled={isSubmitting || activeIndex >= totalDrafts - 1}
								onClick={() => onSelectIndex(Math.min(totalDrafts - 1, activeIndex + 1))}
								size="sm"
								type="button"
								variant="ghost"
							>
								Next
							</Button>
						</div>
					) : null}

					{isSubmitting ? (
						<span className="ml-auto text-xs font-medium text-text-subtle">
							Submitting review...
						</span>
					) : null}
				</CardFooter>
			</Card>
		</section>
	);
}
