"use client";

import { Button } from "@/components/ui/button";
import type { ToolApprovalPayload } from "@/lib/rovo-ui-messages";
import { useMemo, useState } from "react";

interface ToolApprovalDecision {
	approved: boolean;
	denyMessage?: string;
}

interface ToolApprovalSubmitDecision {
	toolCallId: string;
	approved: boolean;
	denyMessage?: string;
}

interface FutureChatToolApprovalBarProps {
	toolApproval: ToolApprovalPayload;
	isSubmitting?: boolean;
	onSubmit: (
		toolApproval: ToolApprovalPayload,
		decisions: ToolApprovalSubmitDecision[],
	) => Promise<void> | void;
}

function getRiskLabel(riskLevel?: "low" | "medium" | "high"): string {
	if (riskLevel === "high") {
		return "High impact";
	}
	if (riskLevel === "low") {
		return "Low impact";
	}
	return "Medium impact";
}

export function FutureChatToolApprovalBar({
	toolApproval,
	isSubmitting = false,
	onSubmit,
}: Readonly<FutureChatToolApprovalBarProps>) {
	const [activeIndex, setActiveIndex] = useState(0);
	const [decisionsByToolCallId, setDecisionsByToolCallId] = useState<Record<string, ToolApprovalDecision>>({});

	const items = toolApproval.items;
	const activeItem = items[activeIndex] ?? items[0] ?? null;
	const activeDecision = activeItem ? decisionsByToolCallId[activeItem.toolCallId] ?? null : null;
	const hasMultipleItems = items.length > 1;

	const buildSubmissionPayload = useMemo(() => {
		return (decisionsMap: Record<string, ToolApprovalDecision>) => {
		const result: ToolApprovalSubmitDecision[] = [];
		for (const item of items) {
				const decision = decisionsMap[item.toolCallId];
			if (!decision) {
				continue;
			}

			result.push({
				toolCallId: item.toolCallId,
				approved: decision.approved,
				denyMessage: decision.denyMessage,
			});
		}
		return result;
		};
	}, [items]);

	const advanceToNextUndecided = (decisionsMap: Record<string, ToolApprovalDecision>) => {
		const nextIndex = items.findIndex((item, index) => {
			return index > activeIndex && !decisionsMap[item.toolCallId];
		});
		if (nextIndex >= 0) {
			setActiveIndex(nextIndex);
			return;
		}

		const fallbackIndex = items.findIndex((item) => !decisionsMap[item.toolCallId]);
		if (fallbackIndex >= 0) {
			setActiveIndex(fallbackIndex);
		}
	};

	const submitOrAdvance = async (approved: boolean) => {
		if (!activeItem || isSubmitting) {
			return;
		}

		const nextDecisionsByToolCallId = {
			...decisionsByToolCallId,
			[activeItem.toolCallId]: { approved },
		};
		setDecisionsByToolCallId(nextDecisionsByToolCallId);

		const nextSubmissionPayload = buildSubmissionPayload(nextDecisionsByToolCallId);
		if (nextSubmissionPayload.length === items.length) {
			await onSubmit(toolApproval, nextSubmissionPayload);
			return;
		}

		advanceToNextUndecided(nextDecisionsByToolCallId);
	};

	if (!activeItem) {
		return null;
	}

	return (
		<div className="rounded-xl border border-border bg-surface-raised px-4 py-3 shadow-[0_-2px_24px_rgba(9,30,66,0.08)]">
			<div className="flex items-start justify-between gap-3">
				<div className="min-w-0">
					<p className="text-text-subtlest text-xs uppercase tracking-[0.16em]">
						Write approval required
					</p>
					<h3 className="mt-1 text-sm font-semibold text-text">
						{activeItem.title}
					</h3>
					<p className="mt-1 text-sm text-text-subtle">
						{activeItem.description}
					</p>
				</div>
				{hasMultipleItems ? (
					<div className="shrink-0 rounded-full border border-border bg-surface px-2 py-1 text-[11px] font-medium text-text-subtle">
						{activeIndex + 1} / {items.length}
					</div>
				) : null}
			</div>

			<div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-text-subtle">
				<div className="rounded-full bg-bg-neutral px-2 py-1">
					{getRiskLabel(activeItem.riskLevel)}
				</div>
				{activeItem.targetPath ? (
					<div className="max-w-full truncate rounded-full bg-bg-neutral px-2 py-1 font-mono text-[11px]">
						{activeItem.targetPath}
					</div>
				) : null}
				{activeItem.commandPreview ? (
					<div className="max-w-full truncate rounded-full bg-bg-neutral px-2 py-1 font-mono text-[11px]">
						{activeItem.commandPreview}
					</div>
				) : null}
			</div>

			<div className="mt-4 flex items-center gap-2">
				<Button
					type="button"
					variant={activeDecision?.approved === true ? "default" : "outline"}
					disabled={isSubmitting}
					onClick={() => void submitOrAdvance(true)}
				>
					Allow
				</Button>
				<Button
					type="button"
					variant={activeDecision?.approved === false ? "destructive" : "outline"}
					disabled={isSubmitting}
					onClick={() => void submitOrAdvance(false)}
				>
					Deny
				</Button>

				{hasMultipleItems ? (
					<div className="ml-auto flex items-center gap-2">
						<Button
							type="button"
							variant="ghost"
							disabled={isSubmitting || activeIndex === 0}
							onClick={() => setActiveIndex((previous) => Math.max(0, previous - 1))}
						>
							Previous
						</Button>
						<Button
							type="button"
							variant="ghost"
							disabled={isSubmitting || activeIndex >= items.length - 1}
							onClick={() =>
								setActiveIndex((previous) => Math.min(items.length - 1, previous + 1))
							}
						>
							Next
						</Button>
					</div>
				) : null}
			</div>

			{isSubmitting ? (
				<div className="mt-4 flex items-center justify-end">
					<span className="text-xs font-medium text-text-subtle">Submitting approval...</span>
				</div>
			) : null}
		</div>
	);
}
