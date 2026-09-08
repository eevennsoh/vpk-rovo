import type { ComponentDetail } from "@/app/data/component-detail-types";

export const AGENT_SESSION_DETAIL: ComponentDetail = {
	description:
		'Agent sessions in four footprints and relationship states. Large is the default detached, solid uncaptured-work card: a linked pull request takes the metadata line as a lifecycle glyph plus a clickable, truncating `#number: title`, followed by `· timestamp`; sessions without a pull request show the timestamp alone. Resume plus Archive or Unarchive actions appear on hover or focus. Medium detached condenses that local session into the Jira Agents row — a 276px surface card with a solid disabled stroke — while Medium attached reuses the exact Jira Issue activity row for a session already connected to work. Small becomes the collapsed Agent Session Column notch. Detached footprints open the untracked-work Agent Session Flyout with Link, Create, and add-as-subtask actions; Medium attached opens session details because its Jira relationship already exists. Captured ids use a solid border, and rows the host cannot resume omit Resume.',
	demoLayout: { previewHeight: "fit" },
	examples: [
		{
			title: "Medium detached",
			description:
				"A compact 276px local-session row that is still detached from Jira work: a solid disabled border that darkens to default on hover, and it opens the untracked-work flyout.",
			demoSlug: "agent-session-demo-medium-detached",
		},
		{
			title: "Medium attached",
			description:
				"The Jira Issue agent activity row for a session already attached to work, with its session-details flyout available on hover or focus.",
			demoSlug: "agent-session-demo-medium-attached",
		},
		{
			title: "Small",
			description:
				"The shared 12×2px session mark from the collapsed Agent Session Column rail, with the same session flyout available on hover or focus.",
			demoSlug: "agent-session-demo-small",
		},
	],
	importStatement: `import { AgentSession } from "@/components/blocks/agent-session";`,
	usage: `import { AgentSession } from "@/components/blocks/agent-session";

<AgentSession
  onCreateWorkItem={(item) => console.log("create", item.id)}
  onLinkWorkItem={(item) => console.log("link", item.id)}
/>`,
	props: [
		{
			name: "variant",
			type: '"large" | "medium-detached" | "medium-attached" | "small"',
			default: '"large"',
			description:
				"Visual footprint and Jira relationship. Medium detached is uncaptured local work; Medium attached is the canonical Jira Issue activity row for work with an existing relationship.",
		},
		{
			name: "items",
			type: "readonly AgentSessionItem[]",
			default: "built-in sample data",
			description:
				"Sessions to render. `AgentSessionItem` is the Agent List row model, so a surface that already builds those rows needs no conversion. `sessionDetails.pullRequestNumber`, `pullRequestTitle`, and `pullRequestUrl` add a truncating PR link before the timestamp in large-row metadata, with `prStatus` selecting the created, merged, or failed glyph; rows without a PR show the timestamp alone. `sessionDetails.issueKey` seeds the untracked-work flyout suggestion and `sessionDetails.worktreePath` the copied resume command. Local host and machine metadata remain available in the flyout.",
		},
		{
			name: "capturedItemIds",
			type: "ReadonlySet<string>",
			description:
				"Ids of sessions marked captured. Medium detached uses the same solid disabled border at rest, and the default border on hover.",
		},
		{
			name: "onLinkWorkItem",
			type: "(item: AgentSessionItem, workItemKey?: string) => void",
			description:
				"Links a session to a suggested work item from the untracked-work flyout. Receives the flyout's offered key.",
		},
		{
			name: "onCreateWorkItem",
			type: "(item: AgentSessionItem) => void",
			description:
				"Creates a work item from a session via the untracked-work flyout. When omitted, the action is exposed as unavailable.",
		},
		{
			name: "onSubtasks",
			type: "(item: AgentSessionItem) => void",
			description:
				"Add-as-subtask action behind the untracked-work flyout menu. Omit to expose the menu option as unavailable.",
		},
		{
			name: "getSuggestedWorkItemKeys",
			type: "(item: AgentSessionItem) => readonly string[] | undefined",
			description:
				"Several candidate keys for a session. The untracked-work flyout offers the first key, taking precedence over `getSuggestedWorkItemKey`.",
		},
		{
			name: "getSuggestedWorkItemKey",
			type: "(item: AgentSessionItem) => string | undefined",
			description:
				"Suggested Jira key for the untracked-work flyout. Defaults to `sessionDetails.issueKey`.",
		},
		{
			name: "getResumeCommand",
			type: "(item: AgentSessionItem) => string | undefined",
			description:
				"Overrides the shell command the hover Resume control copies. Defaults to `cd <worktree> && claude --resume <id>`.",
		},
		{
			name: "isResumable",
			type: "(item: AgentSessionItem) => boolean",
			default: "() => true",
			description:
				"Whether a session can be resumed. Rows that answer false render no Resume control at all, because the button copies the command to the clipboard before `onCopyResume` ever runs.",
		},
		{
			name: "onCopyResume",
			type: "(item: AgentSessionItem) => void",
			description:
				"Called after the hover Resume control copies the resume command, so a host can announce or restore a terminal session.",
		},
		{
			name: "onToggleVisibility",
			type: "(item: AgentSessionItem) => void",
			description:
				"Archive / Unarchive toggle behind the hover archive control. The button always renders; omit this on a bare list to leave the control a no-op. Agent Session Column supplies it so Archive removes the card and Unarchive restores it.",
		},
		{
			name: "visibilityLabel",
			type: "string",
			default: '"Archive"',
			description:
				"Tooltip and accessible name for the hover archive control. The column passes Unarchive when the list is the hidden-work view.",
		},
		{
			name: "onView",
			type: "(item: AgentSessionItem) => void",
			description:
				"Called when a card body is activated. Coding-agent rows stay activatable regardless of `canViewItem`.",
		},
		{
			name: "canViewItem",
			type: "(item: AgentSessionItem) => boolean",
			description:
				"When `onView` is set, non-coding rows for which this returns false omit the body action.",
		},
		{
			name: "className",
			type: "string",
			description: "Additional classes applied to the list element.",
		},
	],
};
