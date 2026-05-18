"use client";

import { useState, type ComponentProps, type ReactNode } from "react";
import AddIcon from "@atlaskit/icon/core/add";
import AttachmentIcon from "@atlaskit/icon/core/attachment";
import AutomationIcon from "@atlaskit/icon/core/automation";
import ChevronDownIcon from "@atlaskit/icon/core/chevron-down";
import ChevronRightIcon from "@atlaskit/icon/core/chevron-right";
import ClockIcon from "@atlaskit/icon/core/clock";
import CommentIcon from "@atlaskit/icon/core/comment";
import DeleteIcon from "@atlaskit/icon/core/delete";
import ProjectStatusIcon from "@atlaskit/icon/core/project-status";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Lozenge } from "@/components/ui/lozenge";
import { Separator } from "@/components/ui/separator";
import {
	PromptInput,
	PromptInputBody,
	PromptInputFooter,
	PromptInputTextarea,
} from "@/components/ui-custom/prompt-input";
import { cn } from "@/lib/utils";
import {
	RFP_DRAFTING_BOARD_NAME,
	RFP_DRAFTING_COLUMN_NAME,
	type AgentsRfpDemoState,
} from "../lib/rfp-demo-state";

const TRIGGER_OPTIONS = [
	{
		id: "ticket-enters-column",
		label: "Ticket enters column",
		description: "Run when an RFP ticket moves into Drafting.",
		icon: <AutomationIcon label="" size="small" />,
	},
	{
		id: "status-changes",
		label: "Status changes",
		description: "Run when an RFP ticket status changes.",
		icon: <ProjectStatusIcon label="" size="small" />,
	},
	{
		id: "attachment-added",
		label: "Attachment added",
		description: "Run when supplier files are added to an RFP ticket.",
		icon: <AttachmentIcon label="" size="small" />,
	},
	{
		id: "comment-added",
		label: "Comment added",
		description: "Run when the proposal team adds a comment.",
		icon: <CommentIcon label="" size="small" />,
	},
	{
		id: "webhook",
		label: "Webhook",
		description: "Run from an external RFP workflow event.",
		icon: <ClockIcon label="" size="small" />,
	},
] as const;

function DetailsSection({
	children,
	title,
}: Readonly<{
	children: ReactNode;
	title: string;
}>): React.ReactElement {
	return (
		<section className="grid gap-2">
			<h3 className="text-sm font-semibold text-text">{title}</h3>
			{children}
		</section>
	);
}

function TriggerAddButton({
	className,
	label = "Add Trigger",
	...props
}: Readonly<ComponentProps<"button"> & {
	label?: string;
}>): React.ReactElement {
	return (
		<button
			type="button"
			className={cn(
				"flex min-h-11 w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-text-subtle outline-none transition-colors duration-normal hover:bg-bg-neutral-subtle-hovered focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
				className,
			)}
			{...props}
		>
			<AddIcon label="" size="small" />
			<span className="text-sm font-medium">{label}</span>
		</button>
	);
}

function TriggerChip({
	children,
}: Readonly<{
	children: ReactNode;
}>): React.ReactElement {
	return (
		<span className="inline-flex h-8 items-center gap-1 rounded-md bg-bg-neutral px-2.5 text-sm font-medium text-text">
			{children}
			<ChevronDownIcon label="" size="small" />
		</span>
	);
}

function TriggerPicker({
	onSelect,
}: Readonly<{
	onSelect: (option: typeof TRIGGER_OPTIONS[number]) => void;
}>): React.ReactElement {
	return (
		<div className="grid gap-1">
			<div className="px-3 py-2 text-sm text-text-subtle">Search triggers...</div>
			{TRIGGER_OPTIONS.map((option) => (
				<button
					key={option.id}
					type="button"
					className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm text-text outline-none transition-colors duration-normal hover:bg-bg-neutral-subtle-hovered focus-visible:bg-bg-neutral-subtle-hovered focus-visible:ring-3 focus-visible:ring-ring/50"
					onClick={() => onSelect(option)}
				>
					<span className="flex size-5 shrink-0 items-center justify-center text-icon-subtle">
						{option.icon}
					</span>
					<span className="min-w-0 flex-1">
						<span className="block font-medium">{option.label}</span>
						<span className="block truncate text-sm text-text-subtle">{option.description}</span>
					</span>
					<ChevronRightIcon label="" size="small" />
				</button>
			))}
		</div>
	);
}

function getRunTone(status: string): "neutral" | "success" | "warning" | "danger" {
	if (status === "completed") {
		return "success";
	}
	if (status === "completed-with-failures") {
		return "warning";
	}
	if (status === "failed") {
		return "danger";
	}
	return "neutral";
}

export function RfpAgentTriggerDetails({
	onClearTrigger,
	onSetTrigger,
	state,
}: Readonly<{
	onClearTrigger?: () => void;
	onSetTrigger?: (prompt: string) => void;
	state: AgentsRfpDemoState;
}>): React.ReactElement {
	const agent = state.agent;
	const trigger = agent?.trigger ?? null;
	const [isPickerOpen, setIsPickerOpen] = useState(false);
	const [selectedTriggerId, setSelectedTriggerId] = useState<string | null>(null);
	const [promptDraft, setPromptDraft] = useState(trigger?.prompt ?? "");
	const isPromptEditorOpen = selectedTriggerId !== null;
	const canSaveTrigger = promptDraft.trim().length > 0;
	const handleSelectTrigger = (option: typeof TRIGGER_OPTIONS[number]) => {
		setSelectedTriggerId(option.id);
		setPromptDraft(trigger?.prompt ?? "");
		setIsPickerOpen(false);
	};
	const handleCancelTriggerPrompt = () => {
		setSelectedTriggerId(null);
		setPromptDraft(trigger?.prompt ?? "");
	};
	const handleSaveTriggerPrompt = () => {
		const nextPrompt = promptDraft.trim();
		if (!nextPrompt) {
			return;
		}

		onSetTrigger?.(nextPrompt);
		setSelectedTriggerId(null);
		setPromptDraft(nextPrompt);
	};
	const addTriggerControl = (
		<div className="relative">
			<TriggerAddButton
				aria-expanded={isPickerOpen}
				aria-label="Add trigger condition"
				onClick={() => setIsPickerOpen((open) => !open)}
			/>
			{isPickerOpen ? (
				<div className="absolute left-0 top-full z-50 mt-2 w-[320px] rounded-lg border border-border bg-surface p-2 shadow-xl">
					<h4 className="sr-only">Add trigger condition</h4>
					<TriggerPicker onSelect={handleSelectTrigger} />
				</div>
			) : null}
		</div>
	);

	return (
		<div className="grid gap-5">
			<DetailsSection title="Triggers">
				<div className="rounded-xl border border-border bg-surface p-2">
					{trigger ? (
						<>
							<div className="group/trigger-row flex min-h-14 items-center gap-3 rounded-lg px-3 py-2 transition-colors duration-normal hover:bg-bg-neutral-subtle-hovered">
								<span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-bg-neutral text-icon-subtle">
									<AutomationIcon label="" size="small" />
								</span>
								<div className="flex min-w-0 flex-1 flex-wrap items-center gap-2 text-sm text-text">
									<span className="font-medium">Status changed to</span>
									<TriggerChip>{RFP_DRAFTING_COLUMN_NAME}</TriggerChip>
									<span className="font-medium">in</span>
									<TriggerChip>{RFP_DRAFTING_BOARD_NAME}</TriggerChip>
								</div>
								<Button
									aria-label="Delete trigger"
									className="opacity-0 transition-opacity duration-normal group-hover/trigger-row:opacity-100 focus-visible:opacity-100"
									onClick={onClearTrigger}
									size="icon-sm"
									variant="ghost"
								>
									<DeleteIcon label="" size="small" />
								</Button>
							</div>
							<Separator className="my-2" />
							{addTriggerControl}
						</>
					) : (
						addTriggerControl
					)}
				</div>
			</DetailsSection>

			{isPromptEditorOpen ? (
				<DetailsSection title="Agent Instructions">
					<PromptInput
						className="w-full rounded-xl border border-border bg-surface p-4 [&>[data-slot=input-group]]:h-auto [&>[data-slot=input-group]]:border-0 [&>[data-slot=input-group]]:bg-transparent [&>[data-slot=input-group]]:shadow-none [&>[data-slot=input-group]]:ring-0"
						onSubmit={handleSaveTriggerPrompt}
					>
						<PromptInputBody>
							<PromptInputTextarea
								aria-label="Trigger natural language prompt"
								className="min-h-28 px-0 py-0 text-sm leading-5"
								onChange={(event) => setPromptDraft(event.currentTarget.value)}
								placeholder="Type @ to mention tools or MCP servers, / for skills..."
								rows={4}
								value={promptDraft}
							/>
						</PromptInputBody>
						<PromptInputFooter className="mt-4 justify-between border-t border-border px-0 pt-3">
							<span className="text-sm text-text-subtle">GPT-5.5 Medium</span>
							<div className="flex items-center gap-2">
								<Button onClick={handleCancelTriggerPrompt} type="button" variant="ghost">
									Cancel
								</Button>
								<Button disabled={!canSaveTrigger} type="submit">
									Save
								</Button>
							</div>
						</PromptInputFooter>
					</PromptInput>
				</DetailsSection>
			) : null}
		</div>
	);
}

export function RfpAgentActivityDetails({
	state,
}: Readonly<{
	state: AgentsRfpDemoState;
}>): React.ReactElement {
	const runs = state.agent?.jobRunSummaries ?? [];

	return (
		<div className="grid gap-5">
			<DetailsSection title="Run log">
				{runs.length > 0 ? (
					<ul className="grid gap-3">
						{runs.map((run) => (
							<li key={run.id} className="grid gap-2 rounded-lg border border-border bg-surface-raised p-3">
								<div className="flex flex-wrap items-center justify-between gap-2">
									<div className="min-w-0">
										<p className="text-sm font-medium text-text">{run.summary}</p>
										<p className="text-xs text-text-subtlest">{run.triggerLabel} · {run.source}</p>
									</div>
									<Lozenge variant={getRunTone(run.status)}>{run.status}</Lozenge>
								</div>
								<div className="flex flex-wrap gap-2 text-xs text-text-subtle">
									<Badge variant="secondary">Processed {run.processedTicketCodes.length}</Badge>
									<Badge variant="secondary">Skipped {run.skippedTicketCodes.length}</Badge>
									<Badge variant="secondary">Failed {run.failedTicketCodes.length}</Badge>
								</div>
								{run.threadLinks.length > 0 ? (
									<div className="flex flex-wrap gap-2">
										{run.threadLinks.map((link) => (
											<a
												key={`${run.id}-${link.ticketCode}`}
												className="text-xs font-medium text-link hover:underline"
												href={`/rovo/${encodeURIComponent(link.threadId)}`}
											>
												{link.ticketCode} thread
											</a>
										))}
									</div>
								) : null}
							</li>
						))}
					</ul>
				) : (
					<p className="text-sm text-text-subtle">No event runs yet.</p>
				)}
			</DetailsSection>

			<Separator />

			<DetailsSection title="Activity">
				{state.customAgentActivity.length > 0 ? (
					<ul className="grid gap-3">
						{state.customAgentActivity.map((activity) => (
							<li key={activity.id} className="grid gap-1 border-l-2 border-border pl-3">
								<p className="text-sm text-text">{activity.message}</p>
								<p className="text-xs text-text-subtlest">{activity.timestampLabel}</p>
							</li>
						))}
					</ul>
				) : (
					<p className="text-sm text-text-subtle">No custom-agent activity yet.</p>
				)}
			</DetailsSection>
		</div>
	);
}
