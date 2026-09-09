"use client";

import { isPlannerProcessing } from "@/components/blocks/jira-work-item/data/planner-state";
import {
	useJiraWorkItemActions,
	useJiraWorkItemState,
} from "@/components/blocks/jira-work-item/team-eu26/context-jira-work-item";
import { ContextDescriptionEditor } from "@/components/blocks/jira-work-item/team-eu26/components/context-description-editor";
import {
	CONTEXT_TITLE_FONT_STYLE,
	CONTEXT_TITLE_COMPACT_FONT_STYLE,
	CONTEXT_TITLE_READ_VIEW_CLASS_NAME,
} from "@/components/blocks/jira-work-item/team-eu26/components/inline-edit-treatment";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/**
 * Live work item title field.
 *
 * Matches the description editor’s direct-edit UX: click/focus the text and
 * type — no InlineEdit read-view button, confirm/cancel, or hover-to-reveal
 * chrome. Commits on every keystroke via `editContextText`.
 */
export function ContextEditableTitle({ compact = false }: Readonly<{ compact?: boolean }>) {
	const { contextResources } = useJiraWorkItemState();
	const actions = useJiraWorkItemActions();
	return (
		<Input
			aria-label="Work item title"
			className={cn(
				CONTEXT_TITLE_READ_VIEW_CLASS_NAME,
				"w-full min-w-0 rounded-none font-medium! text-text transition-[font-size,line-height] duration-medium ease-in-out motion-reduce:transition-none focus-visible:ring-0",
				"min-h-8",
			)}
			data-jira-work-item-title
			placeholder="Add a title"
			style={compact ? CONTEXT_TITLE_COMPACT_FONT_STYLE : CONTEXT_TITLE_FONT_STYLE}
			value={contextResources.title}
			variant="none"
			onChange={(event) => actions.editContextText("title", event.currentTarget.value)}
		/>
	);
}

/**
 * Live work item description editor.
 *
 * Thin adapter over {@link ContextDescriptionEditor}: binds work-item state and
 * planner hug behavior. Pull request overview uses the same shared surface with
 * PR description content.
 */
export function ContextEditableDescription() {
	const { contextResources, planner } = useJiraWorkItemState();
	const actions = useJiraWorkItemActions();
	// While the Teamwork Graph planner is running, drop the editor's min-height so
	// the description hugs its content instead of reserving empty space.
	const isProcessing = isPlannerProcessing(planner);
	return (
		<ContextDescriptionEditor
			aria-label="Work item description"
			hugContent={isProcessing}
			value={contextResources.description}
			viewMode="rendered"
			onMarkdownChange={(value) => actions.editContextText("description", value)}
		/>
	);
}
