"use client";

import { useState, type ReactElement, type ReactNode } from "react";

import { AttachmentsPopover } from "@/components/blocks/jira-work-item/team-eu26/components/attachments-popover";
import { ContextEditableDescription } from "@/components/blocks/jira-work-item/team-eu26/components/context-editable-header";
import { LinkedWorkItemsPopover } from "@/components/blocks/jira-work-item/team-eu26/components/linked-work-items-popover";
import { SubtasksPopover } from "@/components/blocks/jira-work-item/team-eu26/components/subtasks-popover";
import { Button } from "@/components/ui/button";

const DESCRIPTION_PLACEHOLDER = (
	<p className="tiptap-editor text-sm leading-[1.55] text-text-subtlest">Add a description</p>
);

function AddResourceButton({
	label,
	popover,
}: Readonly<{
	label: string;
	popover: (trigger: ReactElement, open: boolean, onOpenChange: (open: boolean) => void) => ReactNode;
}>) {
	const [open, setOpen] = useState(false);
	return popover(
		<Button className="h-auto px-0 text-text" size="compact" type="button" variant="link">
			{label}
		</Button>,
		open,
		setOpen,
	);
}

/**
 * Sparse left column for the Team EU26 empty preset (wiv-v2 empty density):
 * description placeholder and three add actions — no filled tables.
 */
export function EmptyWorkItemBody() {
	return (
		<article
			aria-label="Team EU26 empty work item content"
			className="flex min-w-0 flex-col gap-3"
			data-team-eu26-empty-body
		>
			<ContextEditableDescription
				hugContent
				placeholder="Add a description"
				placeholderSlot={DESCRIPTION_PLACEHOLDER}
			/>
			<div className="flex flex-wrap items-center gap-4">
				<AddResourceButton
					label="Add attachment"
					popover={(trigger, open, onOpenChange) => (
						<AttachmentsPopover onOpenChange={onOpenChange} open={open} trigger={trigger} />
					)}
				/>
				<AddResourceButton
					label="Add subtask"
					popover={(trigger, open, onOpenChange) => (
						<SubtasksPopover onOpenChange={onOpenChange} open={open} trigger={trigger} />
					)}
				/>
				<AddResourceButton
					label="Add linked work item"
					popover={(trigger, open, onOpenChange) => (
						<LinkedWorkItemsPopover onOpenChange={onOpenChange} open={open} trigger={trigger} />
					)}
				/>
			</div>
		</article>
	);
}
