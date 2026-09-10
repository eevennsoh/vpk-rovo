import type { ComponentDetail } from "@/app/data/component-detail-types";

export const AGENT_SESSION_DETAIL: ComponentDetail = {
	description:
		'Agent sessions in four footprints and relationship states. Large is the default detached, solid uncaptured-work card, and it comes in two densities: `short` leads with a 32px identity and reads `agent · host · timestamp`, while `long` drops the leading avatar, gives the title its own line, and spends the room on `agent · host · status · artifact · timestamp` plus a trailing lifecycle indicator. Every row reveals one `…` menu on hover or focus, and its actions follow the host: a local session offers Continue in — the agent itself or Terminal, which copies the prompt and confirms with a check — while a cloud session offers Unlink, Rename, and Delete. Both end in a dismiss row. Medium detached condenses that local session into the Jira Agents row — a 276px surface card with a solid disabled stroke — while Medium attached reuses the exact Jira Issue activity row for a session already connected to work. Small becomes the collapsed Agent Session Column notch. Detached footprints open the untracked-work Agent Session Flyout with Link, Create, and add-as-subtask actions; Medium attached opens session details because its Jira relationship already exists. Captured ids use a solid border, and rows the host cannot resume disable the Terminal row.',
	demoLayout: { previewHeight: "fit" },
	examples: [
		{
			title: "Local — short",
			description:
				"The default avatar-led row for a session on the viewer's own machine. Its menu offers Continue in → the agent or Terminal, which copies the resume prompt and confirms with a green check.",
			demoSlug: "agent-session-demo-local-short",
		},
		{
			title: "Local — long",
			description:
				"Title-led rows with the full metadata line and a trailing lifecycle indicator, for a surface wide enough to state status and artifact alongside the host.",
			demoSlug: "agent-session-demo-local-long",
		},
		{
			title: "Cloud — short",
			description:
				"The same compact row for a hosted session. A cloud session cannot be resumed in a terminal, so its menu swaps the Continue in group for Unlink, Rename, and Delete.",
			demoSlug: "agent-session-demo-cloud-short",
		},
		{
			title: "Cloud — long",
			description:
				"Hosted sessions in the title-led density across working, needs-input, and complete — the experimental spinner grows in while an agent works and gives way to a success check when it lands.",
			demoSlug: "agent-session-demo-cloud-long",
		},
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
			name: "density",
			type: '"short" | "long"',
			default: '"short"',
			description:
				"Row shape for the large footprint. `short` leads with a 32px identity and states agent, host, and time. `long` drops the leading avatar, gives the title its own line, and adds lifecycle status, an artifact chip, and a trailing indicator. Ignored by the medium and small footprints, which have fixed geometry.",
		},
		{
			name: "items",
			type: "readonly AgentSessionItem[]",
			default: "built-in sample data",
			description:
				"Sessions to render. `AgentSessionItem` is the Agent List row model, so a surface that already builds those rows needs no conversion. `host` (falling back to `sessionDetails.host`) decides both the metadata glyph and which menu the row opens; a payload that declares neither omits the host segment in the long density rather than assuming the cloud. `sessionDetails.pullRequestNumber` and `pullRequestTitle` supply the long density's artifact chip, `sessionDetails.issueKey` seeds the untracked-work flyout suggestion, and `sessionDetails.worktreePath` the copied resume command.",
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
				"Overrides the shell command the menu's Terminal row copies. Defaults to `cd <worktree> && claude --resume <id>`.",
		},
		{
			name: "isResumable",
			type: "(item: AgentSessionItem) => boolean",
			default: "() => true",
			description:
				"Whether a session can be resumed. Rows that answer false disable the menu's Terminal row, because selecting it copies the command to the clipboard before `onCopyResume` ever runs.",
		},
		{
			name: "onCopyResume",
			type: "(item: AgentSessionItem) => void",
			description:
				"Called after the menu's Terminal row copies the resume command, so a host can announce or restore a terminal session. The trailing slot shows a green check with a Copied prompt tooltip either way.",
		},
		{
			name: "onContinueInAgent",
			type: "(item: AgentSessionItem) => void",
			description:
				"Reopens a local session in its own agent, behind the menu's Continue in group. Omit to render that row disabled. Cloud sessions never show it.",
		},
		{
			name: "onUnlinkSession",
			type: "(item: AgentSessionItem) => void",
			description:
				"Breaks a cloud session's link to its work item. Omit to render the menu's Unlink row disabled. Local sessions never show it.",
		},
		{
			name: "onRenameSession",
			type: "(item: AgentSessionItem) => void",
			description: "Renames a cloud session. Omit to render the menu's Rename row disabled.",
		},
		{
			name: "onDeleteSession",
			type: "(item: AgentSessionItem) => void",
			description:
				"Deletes a cloud session record, behind the menu's destructive Delete row. Omit to render it disabled.",
		},
		{
			name: "onToggleVisibility",
			type: "(item: AgentSessionItem) => void",
			description:
				"Archive / Unarchive capability behind the menu's dismiss row. Omit to render that row disabled. Agent Session Column supplies it so Dismiss removes the card and Unarchive restores it.",
		},
		{
			name: "visibilityLabel",
			type: "string",
			default: '"Archive"',
			description:
				"Copy for the menu's dismiss row, which reads Dismiss by default. The column passes Unarchive when the list is the hidden-work view, where the same capability restores rather than hides.",
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
