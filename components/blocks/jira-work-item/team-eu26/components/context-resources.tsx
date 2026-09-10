"use client";

import { useState, type ReactElement } from "react";

import AddIcon from "@atlaskit/icon/core/add";
import AttachmentIcon from "@atlaskit/icon/core/attachment";
import BranchIcon from "@atlaskit/icon/core/branch";
import ChildWorkItemsIcon from "@atlaskit/icon/core/child-work-items";
import CommitIcon from "@atlaskit/icon/core/commit";
import FileIcon from "@atlaskit/icon/core/file";
import LinkIcon from "@atlaskit/icon/core/link";

import { AgentFilledSummaryRow } from "@/components/blocks/agent/components/agent-summary-row";
import { AttachmentsPopover } from "@/components/blocks/jira-work-item/team-eu26/components/attachments-popover";
import {
	ContextTitleActions,
	ContextTitleActionsSubmenu,
	type CodingAgentId,
} from "@/components/blocks/jira-work-item/team-eu26/components/context-title-actions";
import { StatusPill } from "@/components/blocks/jira-work-item/team-eu26/components/detail-field-editors";
import { LinkedWorkItemsPopover } from "@/components/blocks/jira-work-item/team-eu26/components/linked-work-items-popover";
import { SubtasksPopover } from "@/components/blocks/jira-work-item/team-eu26/components/subtasks-popover";
import {
	useJiraWorkItemActions,
	useJiraWorkItemMeta,
	useJiraWorkItemState,
} from "@/components/blocks/jira-work-item/team-eu26/context-jira-work-item";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

type ContextResourceActionId = "attachments" | "subtasks" | "linkedItems";

interface ContextResourceAction {
	id: ContextResourceActionId;
	buttonLabel: string;
	icon: ReactElement;
	renderPopover: (
		trigger: ReactElement,
		open: boolean,
		onOpenChange: (open: boolean) => void,
	) => ReactElement;
}

interface ContextResourcesProps {
	compact?: boolean;
	outputs?: readonly string[];
	primaryCodingAgentId?: CodingAgentId;
}

export function ContextResources({
	compact = false,
	outputs = [],
	primaryCodingAgentId,
}: Readonly<ContextResourcesProps>) {
	const { initialPreset } = useJiraWorkItemMeta();
	const { metadata, planner } = useJiraWorkItemState();
	const actions = useJiraWorkItemActions();
	const hasPlanner = planner.status !== "inactive" && planner.status !== "applied";
	const [activeResourceAction, setActiveResourceAction] = useState<ContextResourceActionId | null>(null);
	const [selectedAgentId, setSelectedAgentId] = useState<CodingAgentId | null>(
		primaryCodingAgentId ?? (initialPreset === "blank" ? null : "claude-code"),
	);
	const resources: readonly ContextResourceAction[] = [
		{
			id: "attachments",
			buttonLabel: "Add attachments",
			icon: <AttachmentIcon label="" size="small" />,
			renderPopover: (trigger, open, onOpenChange) => (
				<AttachmentsPopover key="attachments" open={open} onOpenChange={onOpenChange} trigger={trigger} />
			),
		},
		{
			id: "subtasks",
			buttonLabel: "Add subtasks",
			icon: <ChildWorkItemsIcon label="" size="small" />,
			renderPopover: (trigger, open, onOpenChange) => (
				<SubtasksPopover key="subtasks" open={open} onOpenChange={onOpenChange} trigger={trigger} />
			),
		},
		{
			id: "linkedItems",
			buttonLabel: "Link work items",
			icon: <LinkIcon label="" size="small" />,
			renderPopover: (trigger, open, onOpenChange) => (
				<LinkedWorkItemsPopover key="linkedItems" open={open} onOpenChange={onOpenChange} trigger={trigger} />
			),
		},
	];
	const closeResourceAction = () => setActiveResourceAction(null);

	return (
		<div
			className={cn(compact ? "w-max" : "mt-3")}
			data-jira-work-item-resource-row-shell
		>
			{/*
			 * Sits in the dialog header band under the title, so it spans the full
			 * width rather than only the description column. No
			 * `@container/agentlayout` ancestor exists here — keep spacing plain and
			 * let `@container/resource-row` below own the responsive collapse.
			 */}
			<div
				className={cn(
					"relative z-10",
					hasPlanner
						? "bg-bg-input [&_[data-slot=button]]:bg-bg-input [&_[data-slot=button]:hover]:bg-bg-neutral-subtle-hovered [&_[data-slot=button]:active]:bg-bg-neutral-subtle-pressed"
						: null,
				)}
				data-jira-work-item-resource-row
			>
				<div
					className={cn(
						"@container/resource-row flex items-center gap-2 *:focus-visible:relative *:focus-visible:z-10",
						compact ? "flex-nowrap" : "flex-wrap",
					)}
					data-jira-work-item-resource-row-content
					style={compact ? { containerType: "normal" } : undefined}
				>
					<StatusPill
						compact={compact}
						onChange={(next) => actions.updateMetadata({ status: next })}
						value={metadata.status}
					/>
					{compact ? null : (
						<ContextTitleActions
							onSelectedAgentIdChange={setSelectedAgentId}
							selectedAgentId={selectedAgentId}
						/>
					)}
					<div className="relative inline-flex">
						<DropdownMenu>
							<DropdownMenuTrigger
								render={(
									<Button
										aria-label="Add to work item"
										size={compact ? "icon-compact" : "icon"}
										type="button"
										variant="outline"
									/>
								)}
							>
								<AddIcon label="" size="small" />
							</DropdownMenuTrigger>
							<DropdownMenuContent align="start" positionerClassName="z-[502]">
								{compact ? (
									<>
										<ContextTitleActionsSubmenu
											onSelectedAgentIdChange={setSelectedAgentId}
										/>
										<DropdownMenuSeparator />
									</>
								) : null}
								<DropdownMenuGroup>
									{resources.map((resource) => (
										<DropdownMenuItem
											elemBefore={resource.icon}
											key={resource.id}
											onSelect={() => setActiveResourceAction(resource.id)}
										>
											{resource.buttonLabel}
										</DropdownMenuItem>
									))}
									<DropdownMenuItem elemBefore={<CommitIcon label="" size="small" />}>
										Create commit
									</DropdownMenuItem>
									<DropdownMenuItem elemBefore={<BranchIcon label="" size="small" />}>
										Create branch
									</DropdownMenuItem>
								</DropdownMenuGroup>
							</DropdownMenuContent>
						</DropdownMenu>
						{resources.map((resource) =>
							resource.renderPopover(
								<Button
									aria-hidden
									className="pointer-events-none absolute inset-0 opacity-0"
									tabIndex={-1}
									type="button"
								/>,
								activeResourceAction === resource.id,
								(open) => {
									if (open) {
										setActiveResourceAction(resource.id);
										return;
									}
									closeResourceAction();
								},
							),
						)}
					</div>
				</div>
			</div>
			{outputs.length > 0 ? (
				<div className="mt-1">
					<AgentFilledSummaryRow
						agentFieldName="outputs"
						itemElemBefore={() => (
							<Icon aria-hidden render={<FileIcon color="currentColor" label="" size="small" />} />
						)}
						items={outputs}
						label="Output"
						labelClassName="whitespace-nowrap sm:w-28"
						tagColor="standard"
					/>
				</div>
			) : null}
		</div>
	);
}
