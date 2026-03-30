"use client";

import { ToolApproval } from "@/components/blocks/tool-approval";
import { BATCH_TOOL_APPROVAL_DEMO, SINGLE_TOOL_APPROVAL_DEMO } from "@/components/blocks/tool-approval/data/demo-approvals";
import { Button } from "@/components/ui/button";
import {
	PromptInput,
	PromptInputBody,
	PromptInputFooter,
	PromptInputSubmit,
	PromptInputTextarea,
	PromptInputTools,
} from "@/components/ui-ai/prompt-input";
import type { ToolApprovalPayload } from "@/lib/rovo-ui-messages";
import type { ReactElement } from "react";
import { useEffect, useRef, useState } from "react";

interface DemoMessage {
	id: string;
	role: "assistant" | "user";
	content: string;
}

interface ToolApprovalDemoSurfaceProps {
	initialToolApproval: ToolApprovalPayload;
	forceSubmitting?: boolean;
	helperLabel: string;
}

function formatDecisionSummary(
	payload: ToolApprovalPayload,
	decisions: ReadonlyArray<{ approved: boolean }>,
): string {
	if (payload.items.length === 1) {
		const singleDecision = decisions[0];
		return singleDecision?.approved ? "Approval granted. The tool can continue." : "Approval denied. The tool was stopped.";
	}

	const approvedCount = decisions.filter((decision) => decision.approved).length;
	const deniedCount = decisions.length - approvedCount;
	return `${approvedCount} approved, ${deniedCount} denied. The batch decision has been submitted.`;
}

function createInitialMessages(helperLabel: string): DemoMessage[] {
	return [
		{
			id: "assistant-intro",
			role: "assistant",
			content: helperLabel,
		},
	];
}

function ToolApprovalDemoSurface({
	initialToolApproval,
	forceSubmitting = false,
	helperLabel,
}: Readonly<ToolApprovalDemoSurfaceProps>): ReactElement {
	const timeoutRef = useRef<number | null>(null);
	const [prompt, setPrompt] = useState("");
	const [toolApproval, setToolApproval] = useState<ToolApprovalPayload | null>(initialToolApproval);
	const [isSubmitting, setIsSubmitting] = useState(forceSubmitting);
	const [messages, setMessages] = useState<DemoMessage[]>(createInitialMessages(helperLabel));

	useEffect(() => {
		return () => {
			if (timeoutRef.current !== null) {
				window.clearTimeout(timeoutRef.current);
			}
		};
	}, []);

	function resetDemo() {
		if (timeoutRef.current !== null) {
			window.clearTimeout(timeoutRef.current);
			timeoutRef.current = null;
		}

		setPrompt("");
		setToolApproval(initialToolApproval);
		setIsSubmitting(forceSubmitting);
		setMessages(createInitialMessages(helperLabel));
	}

	function submitApproval(
		payload: ToolApprovalPayload,
		decisions: Array<{ approved: boolean }>,
	) {
		if (forceSubmitting) {
			return;
		}

		setIsSubmitting(true);
		if (timeoutRef.current !== null) {
			window.clearTimeout(timeoutRef.current);
		}

		timeoutRef.current = window.setTimeout(() => {
			setIsSubmitting(false);
			setToolApproval(null);
			setMessages((currentMessages) => [
				...currentMessages,
				{
					id: `approval-${Date.now()}`,
					role: "assistant",
					content: formatDecisionSummary(payload, decisions),
				},
			]);
			timeoutRef.current = null;
		}, 700);
	}

	function handleComposerSubmit({ text }: { text: string }) {
		const trimmedText = text.trim();
		if (!trimmedText || toolApproval) {
			return;
		}

		setMessages((currentMessages) => [
			...currentMessages,
			{
				id: `user-${Date.now()}`,
				role: "user",
				content: trimmedText,
			},
		]);
		setPrompt("");
	}

	return (
		<div className="flex items-center justify-center p-6">
			<div className="w-full max-w-[760px] overflow-hidden rounded-[28px] border border-border bg-linear-to-b from-bg-neutral-subtle via-surface to-surface-raised shadow-[0_24px_70px_rgba(9,30,66,0.12)]">
				<div className="border-b border-border/70 px-5 py-4">
					<div className="flex items-center justify-between gap-4">
						<div>
							<p className="text-[11px] font-semibold tracking-[0.18em] text-text-subtlest uppercase">
								Approval Dock
							</p>
							<h2 className="mt-1 text-base font-semibold text-text">
								Tool Approval above the composer
							</h2>
						</div>
						<Button onClick={resetDemo} size="sm" type="button" variant="ghost">
							Reset demo
						</Button>
					</div>
				</div>

				<div className="space-y-4 px-5 py-5">
					<div className="space-y-3 rounded-[22px] border border-border/70 bg-surface p-4">
						{messages.map((message) => (
							<div
								key={message.id}
								className={message.role === "assistant" ? "mr-12 rounded-2xl rounded-bl-md bg-surface-raised px-4 py-3 text-sm text-text shadow-sm" : "ml-12 rounded-2xl rounded-br-md bg-primary px-4 py-3 text-sm text-primary-foreground shadow-sm"}
							>
								{message.content}
							</div>
						))}

						{toolApproval ? (
							<div className="pt-2">
								<ToolApproval
									isSubmitting={isSubmitting}
									onSubmit={submitApproval}
									toolApproval={toolApproval}
								/>
							</div>
						) : (
							<div className="rounded-2xl border border-dashed border-border bg-bg-neutral-subtle px-4 py-3 text-sm text-text-subtle">
								The tool request has been resolved. The composer is unlocked again.
							</div>
						)}

						<PromptInput
							className="rounded-2xl border border-border bg-surface shadow-sm"
							onSubmit={handleComposerSubmit}
						>
							<PromptInputBody>
								<PromptInputTextarea
									className="min-h-[88px]"
									onChange={(event) => setPrompt(event.currentTarget.value)}
									placeholder={
										toolApproval
											? "Approval is pending. You can draft your next prompt, but sending stays blocked until the tool is approved or denied."
											: "Ask the assistant for the next step once approval is resolved."
									}
									value={prompt}
								/>
							</PromptInputBody>
							<PromptInputFooter className="justify-between border-t border-border px-1 pt-2">
								<PromptInputTools>
									<span className="px-2 text-xs text-text-subtle">
										{toolApproval ? "Pending tool approval blocks send" : "Composer ready"}
									</span>
								</PromptInputTools>
								<PromptInputSubmit
									aria-label="Submit prompt"
									disabled={Boolean(toolApproval) || prompt.trim().length === 0}
								/>
							</PromptInputFooter>
						</PromptInput>
					</div>
				</div>
			</div>
		</div>
	);
}

export default function ToolApprovalPreview(): ReactElement {
	return (
		<ToolApprovalDemoSurface
			helperLabel="I need your approval before I edit the release notes draft in the workspace."
			initialToolApproval={SINGLE_TOOL_APPROVAL_DEMO}
		/>
	);
}

export function ToolApprovalDemoBatch(): ReactElement {
	return (
		<ToolApprovalDemoSurface
			helperLabel="I have three blocked tool steps queued. Review each one before the run can continue."
			initialToolApproval={BATCH_TOOL_APPROVAL_DEMO}
		/>
	);
}

export function ToolApprovalDemoSubmitting(): ReactElement {
	return (
		<ToolApprovalDemoSurface
			forceSubmitting
			helperLabel="The approval request is already being submitted, so the controls are intentionally locked."
			initialToolApproval={SINGLE_TOOL_APPROVAL_DEMO}
		/>
	);
}
