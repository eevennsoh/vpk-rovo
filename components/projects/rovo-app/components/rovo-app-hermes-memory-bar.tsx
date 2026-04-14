"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Lozenge } from "@/components/ui/lozenge";
import type { WikiMemoryProposalSummary } from "@/lib/rovo-runtime-types";

interface RovoAppHermesMemoryBarProps {
	onOpenMemories: () => void;
	proposals: ReadonlyArray<WikiMemoryProposalSummary>;
	threadId: string;
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

function formatScopeLabel(scope: string | null | undefined): string {
	if (scope === "profile") {
		return "Profile";
	}
	if (scope === "work") {
		return "Work";
	}
	return scope ?? "Memory";
}

export function RovoAppHermesMemoryBar({
	onOpenMemories,
	proposals,
	threadId,
}: Readonly<RovoAppHermesMemoryBarProps>) {
	return (
		<section className="w-full" data-slot="hermes-memory-review">
			<Card
				className="gap-0 overflow-hidden border-border bg-surface-raised shadow-[0_-2px_24px_rgba(9,30,66,0.08)]"
				size="sm"
			>
				<CardHeader className="border-b border-border/70 pb-3">
					<div className="flex items-start justify-between gap-3">
						<div className="min-w-0">
							<p className="text-[11px] font-semibold tracking-[0.18em] text-text-subtlest uppercase">
								Hermes memory activity
							</p>
							<CardTitle className="mt-1 text-sm">
								{proposals.length} recent capture{proposals.length === 1 ? "" : "s"} for this thread
							</CardTitle>
							<p className="mt-1 text-sm leading-6 text-text-subtle">
								Thread-aware durable memory proposals queued or ingested from the latest conversation turns.
							</p>
						</div>
						<Badge variant="neutral">{threadId}</Badge>
					</div>
				</CardHeader>

				<CardContent className="space-y-3 py-3">
					{proposals.slice(0, 3).map((proposal) => (
						<div key={proposal.id} className="rounded-xl border border-border bg-surface px-3 py-3">
							<div className="flex flex-wrap items-center gap-2">
								<Lozenge size="compact" variant={formatProposalTone(proposal.status)}>
									{proposal.status}
								</Lozenge>
								<Badge variant="outline">{formatScopeLabel(proposal.scope)}</Badge>
								{proposal.target ? (
									<Badge variant="neutral">{proposal.target}</Badge>
								) : null}
								{proposal.origin ? (
									<Badge variant="neutral">{proposal.origin}</Badge>
								) : null}
							</div>
							<div className="mt-2 text-sm font-medium text-text">
								{proposal.summary || proposal.content || "Untitled memory proposal"}
							</div>
							{proposal.reason ? (
								<div className="mt-1 text-xs text-text-subtle">{proposal.reason}</div>
							) : null}
						</div>
					))}
				</CardContent>

				<CardFooter className="flex items-center justify-between gap-2">
					<div className="text-xs text-text-subtle">
						Open the memory explorer to inspect graph links, canonical blocks, and exports.
					</div>
					<Button size="sm" type="button" onClick={onOpenMemories}>
						Open memories
					</Button>
				</CardFooter>
			</Card>
		</section>
	);
}
