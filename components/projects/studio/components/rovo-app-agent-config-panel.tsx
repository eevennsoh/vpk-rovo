"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import CrossIcon from "@atlaskit/icon/core/cross";
import AddIcon from "@atlaskit/icon/core/add";

import { Agent, AgentContent, AgentHeader } from "@/components/ui-custom/agent";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type {
	StudioAgentPublishStatus,
	StudioSessionAgentEntry,
} from "@/app/contexts/context-rovo-chat";
import type { RovoDataParts } from "@/lib/rovo-ui-messages";
import { cn } from "@/lib/utils";

type AgentResult = RovoDataParts["agent-result"];

const FIELD_GAP_CLASS = "space-y-1.5";

interface RovoAppAgentConfigPanelProps {
	entry: StudioSessionAgentEntry;
	onClose: () => void;
	onCommitPublishReady: (profileId: string) => void;
	onPublish: (profileId: string) => void;
	onUpdateDraft: (
		profileId: string,
		patch: Partial<AgentResult>,
	) => void;
	headerSlot?: React.ReactNode;
	className?: string;
	tabSwitcher?: React.ReactNode;
}

function stringifyForComparison(value: unknown): string {
	try {
		return JSON.stringify(value);
	} catch {
		return String(value);
	}
}

function getMissingFieldWarnings(result: AgentResult): readonly string[] {
	const missing: string[] = [];
	if (!result.name || result.name.trim().length === 0) {
		missing.push("name");
	}
	if (!result.description && !result.summary) {
		missing.push("description");
	}
	if (!result.instructions || result.instructions.trim().length === 0) {
		missing.push("instructions");
	}
	if (!Array.isArray(result.conversationStarters) || result.conversationStarters.length === 0) {
		missing.push("conversation starters");
	}
	return missing;
}

function getPublishLabel(status: StudioAgentPublishStatus): string {
	return status === "published" ? "Published" : "Testing";
}

function getPublishBadgeVariant(
	status: StudioAgentPublishStatus,
): "success" | "primary" {
	return status === "published" ? "success" : "primary";
}

export function RovoAppAgentConfigPanel({
	entry,
	onClose,
	onCommitPublishReady,
	onPublish,
	onUpdateDraft,
	headerSlot,
	className,
	tabSwitcher,
}: Readonly<RovoAppAgentConfigPanelProps>) {
	const draft = entry.draftResult;
	const shouldReduceMotion = useReducedMotion();
	const profileId = entry.profile.id;

	const updateDraft = useCallback(
		(patch: Partial<AgentResult>) => {
			onUpdateDraft(profileId, patch);
		},
		[onUpdateDraft, profileId],
	);

	const handleStringChange = useCallback(
		(field: keyof AgentResult) => (value: string) => {
			updateDraft({ [field]: value } as Partial<AgentResult>);
		},
		[updateDraft],
	);

	const handleTextareaChange = useCallback(
		(field: keyof AgentResult) =>
			(event: React.ChangeEvent<HTMLTextAreaElement>) => {
				updateDraft({ [field]: event.currentTarget.value } as Partial<AgentResult>);
			},
		[updateDraft],
	);

	const tools = useMemo<readonly string[]>(() => {
		return Array.isArray(draft.tools) ? draft.tools : [];
	}, [draft.tools]);

	const conversationStarters = useMemo<readonly string[]>(() => {
		return Array.isArray(draft.conversationStarters)
			? draft.conversationStarters
			: [];
	}, [draft.conversationStarters]);

	const updateListItem = useCallback(
		(field: "tools" | "conversationStarters", index: number, value: string) => {
			const current = field === "tools" ? tools : conversationStarters;
			const next = [...current];
			next[index] = value;
			updateDraft({ [field]: next } as Partial<AgentResult>);
		},
		[conversationStarters, tools, updateDraft],
	);

	const removeListItem = useCallback(
		(field: "tools" | "conversationStarters", index: number) => {
			const current = field === "tools" ? tools : conversationStarters;
			const next = current.filter((_, itemIndex) => itemIndex !== index);
			updateDraft({ [field]: next } as Partial<AgentResult>);
		},
		[conversationStarters, tools, updateDraft],
	);

	const appendListItem = useCallback(
		(field: "tools" | "conversationStarters") => {
			const current = field === "tools" ? tools : conversationStarters;
			updateDraft({ [field]: [...current, ""] } as Partial<AgentResult>);
		},
		[conversationStarters, tools, updateDraft],
	);

	const hasUpdateChanges = useMemo(() => {
		return (
			stringifyForComparison(entry.draftResult) !==
			stringifyForComparison(entry.publishReadyResult)
		);
	}, [entry.draftResult, entry.publishReadyResult]);

	const hasPublishChanges = useMemo(() => {
		if (!entry.publishedResult) {
			return true;
		}
		return (
			stringifyForComparison(entry.publishReadyResult) !==
			stringifyForComparison(entry.publishedResult)
		);
	}, [entry.publishReadyResult, entry.publishedResult]);

	const missingFields = useMemo(() => getMissingFieldWarnings(draft), [draft]);

	const [justUpdatedAt, setJustUpdatedAt] = useState<number | null>(null);
	const justUpdatedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		return () => {
			if (justUpdatedTimerRef.current) {
				clearTimeout(justUpdatedTimerRef.current);
			}
		};
	}, []);

	const handleUpdate = useCallback(() => {
		onCommitPublishReady(profileId);
		setJustUpdatedAt(Date.now());
		if (justUpdatedTimerRef.current) {
			clearTimeout(justUpdatedTimerRef.current);
		}
		justUpdatedTimerRef.current = setTimeout(() => {
			setJustUpdatedAt(null);
		}, 1500);
	}, [onCommitPublishReady, profileId]);

	const handlePublish = useCallback(() => {
		// Ensure publish-ready snapshot reflects current draft before publishing.
		if (hasUpdateChanges) {
			onCommitPublishReady(profileId);
		}
		onPublish(profileId);
	}, [hasUpdateChanges, onCommitPublishReady, onPublish, profileId]);

	const publishStatusLabel = getPublishLabel(entry.publishStatus);
	const badgeVariant = getPublishBadgeVariant(entry.publishStatus);
	const agentName = draft.name?.trim() || entry.profile.name || "Untitled agent";

	return (
		<motion.div
			className={cn("flex h-full w-full flex-col overflow-hidden", className)}
			initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.24, ease: [0, 0.4, 0, 1] }}
		>
			<div className="flex items-center justify-between gap-3 border-b border-border bg-surface px-4 py-3">
				<div className="flex min-w-0 items-center gap-2">
					<div className="flex min-w-0 flex-col gap-0.5">
						<div className="flex items-center gap-2">
							<span className="truncate font-medium text-sm text-text">
								{agentName}
							</span>
							<Badge variant={badgeVariant} data-testid="agent-config-status-lozenge">
								{publishStatusLabel}
							</Badge>
						</div>
						{headerSlot ? (
							<div className="text-text-subtlest text-xs">{headerSlot}</div>
						) : null}
					</div>
				</div>
				<div className="flex shrink-0 items-center gap-2">
					<Button
						type="button"
						size="sm"
						variant="ghost"
						onClick={handleUpdate}
						disabled={!hasUpdateChanges}
						data-testid="agent-config-update"
					>
						{justUpdatedAt ? "Updated" : "Update"}
					</Button>
					<Button
						type="button"
						size="sm"
						variant="default"
						onClick={handlePublish}
						disabled={!hasPublishChanges}
						data-testid="agent-config-publish"
					>
						Publish
					</Button>
					<Button
						type="button"
						size="icon"
						variant="ghost"
						onClick={onClose}
						aria-label="Close agent config"
					>
						<CrossIcon label="" spacing="none" />
					</Button>
				</div>
			</div>
			{tabSwitcher ? (
				<div className="border-b border-border bg-surface px-4 py-2">{tabSwitcher}</div>
			) : null}
			<div className="min-h-0 flex-1 overflow-y-auto">
				<div className="mx-auto w-full max-w-[760px] px-4 py-5">
					<AnimatePresence>
						{missingFields.length > 0 ? (
							<motion.div
								className="mb-4 rounded-md border border-border-warning bg-bg-warning-subtler px-3 py-2 text-text-warning-bolder text-xs"
								initial={shouldReduceMotion ? false : { opacity: 0, y: -4 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0, y: -4 }}
							>
								Generation looks partial — fill in {missingFields.join(", ")} before publishing.
							</motion.div>
						) : null}
					</AnimatePresence>
					<Agent>
						<AgentHeader
							className="border-b border-border"
							name={agentName}
							model={draft.action === "update" ? "update" : "create"}
						/>
						<AgentContent className="space-y-5 p-4">
							<div className={FIELD_GAP_CLASS}>
								<Label htmlFor={`agent-${profileId}-name`}>Name</Label>
								<Input
									id={`agent-${profileId}-name`}
									value={draft.name ?? ""}
									placeholder="Agent name"
									onValueChange={handleStringChange("name")}
								/>
							</div>

							<div className={FIELD_GAP_CLASS}>
								<Label htmlFor={`agent-${profileId}-description`}>Description</Label>
								<Textarea
									id={`agent-${profileId}-description`}
									value={draft.description ?? draft.summary ?? ""}
									placeholder="Short summary of what this agent does"
									onChange={(event) => {
										updateDraft({
											description: event.currentTarget.value,
											summary: event.currentTarget.value,
										});
									}}
								/>
							</div>

							<div className={FIELD_GAP_CLASS}>
								<Label htmlFor={`agent-${profileId}-instructions`}>Instructions</Label>
								<Textarea
									id={`agent-${profileId}-instructions`}
									value={draft.instructions ?? ""}
									placeholder="How the agent should think and respond"
									className="min-h-32"
									onChange={handleTextareaChange("instructions")}
								/>
							</div>

							<div className={FIELD_GAP_CLASS}>
								<Label htmlFor={`agent-${profileId}-context-description`}>
									Context description
								</Label>
								<Textarea
									id={`agent-${profileId}-context-description`}
									value={draft.contextDescription ?? ""}
									placeholder="Extra context appended to chat turns"
									onChange={handleTextareaChange("contextDescription")}
								/>
							</div>

							<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
								<div className={FIELD_GAP_CLASS}>
									<Label htmlFor={`agent-${profileId}-trigger`}>Trigger</Label>
									<Input
										id={`agent-${profileId}-trigger`}
										value={draft.trigger ?? ""}
										placeholder="When this agent should run"
										onValueChange={handleStringChange("trigger")}
									/>
								</div>
								<div className={FIELD_GAP_CLASS}>
									<Label htmlFor={`agent-${profileId}-guardrail`}>Guardrail</Label>
									<Input
										id={`agent-${profileId}-guardrail`}
										value={draft.guardrail ?? ""}
										placeholder="Safety / scope boundary"
										onValueChange={handleStringChange("guardrail")}
									/>
								</div>
							</div>

							<div className="space-y-2">
								<div className="flex items-center justify-between">
									<Label>Tools</Label>
									<Button
										type="button"
										size="sm"
										variant="ghost"
										onClick={() => appendListItem("tools")}
									>
										<AddIcon label="" spacing="none" />
										Add tool
									</Button>
								</div>
								{tools.length === 0 ? (
									<p className="text-text-subtlest text-xs">
										No tools yet. Add tool names this agent should be able to use.
									</p>
								) : (
									<ul className="space-y-2">
										{tools.map((tool, index) => (
											<li
												key={`tool-${index}`}
												className="flex items-center gap-2"
											>
												<Input
													value={tool}
													placeholder="Tool name"
													onValueChange={(value) =>
														updateListItem("tools", index, value)
													}
												/>
												<Button
													type="button"
													size="icon"
													variant="ghost"
													aria-label={`Remove tool ${index + 1}`}
													onClick={() => removeListItem("tools", index)}
												>
													<CrossIcon label="" spacing="none" />
												</Button>
											</li>
										))}
									</ul>
								)}
							</div>

							<div className="space-y-2">
								<div className="flex items-center justify-between">
									<Label>Conversation starters</Label>
									<Button
										type="button"
										size="sm"
										variant="ghost"
										onClick={() => appendListItem("conversationStarters")}
									>
										<AddIcon label="" spacing="none" />
										Add starter
									</Button>
								</div>
								{conversationStarters.length === 0 ? (
									<p className="text-text-subtlest text-xs">
										No conversation starters yet. Add prompts users can click to start a chat.
									</p>
								) : (
									<ul className="space-y-2">
										{conversationStarters.map((starter, index) => (
											<li
												key={`starter-${index}`}
												className="flex items-center gap-2"
											>
												<Input
													value={starter}
													placeholder="Conversation starter"
													onValueChange={(value) =>
														updateListItem(
															"conversationStarters",
															index,
															value,
														)
													}
												/>
												<Button
													type="button"
													size="icon"
													variant="ghost"
													aria-label={`Remove conversation starter ${index + 1}`}
													onClick={() => removeListItem("conversationStarters", index)}
												>
													<CrossIcon label="" spacing="none" />
												</Button>
											</li>
										))}
									</ul>
								)}
							</div>

							<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
								<div className={FIELD_GAP_CLASS}>
									<Label htmlFor={`agent-${profileId}-agent-id`}>Agent ID</Label>
									<Input
										id={`agent-${profileId}-agent-id`}
										value={draft.agentId ?? ""}
										readOnly
										aria-readonly
									/>
								</div>
								<div className={FIELD_GAP_CLASS}>
									<Label htmlFor={`agent-${profileId}-action`}>Action</Label>
									<Input
										id={`agent-${profileId}-action`}
										value={draft.action ?? ""}
										readOnly
										aria-readonly
									/>
								</div>
							</div>
						</AgentContent>
					</Agent>
				</div>
			</div>
		</motion.div>
	);
}
