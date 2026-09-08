import type { ComponentDetail } from "@/app/data/component-detail-types";

export const AGENT_SESSION_COLUMN_DETAIL: ComponentDetail = {
	description:
		'A kanban column of agent sessions that never became work items. It has two hosts: an in-flow board column (`headerSurface="column"`, the default) and a docked Panel (`headerSurface="panel"`). The catalog shows both. In-flow framing is a second axis: `columnFrame="caption"` (the shared-block default, and simple kanban chrome) leaves the header on the board surface so the title shares a baseline with status captions; `columnFrame="enclosed"` (default kanban chrome) moves that title inside the well so Untracked reads as one painted object, matching the status columns beside it. The well stays `bg-surface` plus a 1px `border-border-disabled` stroke — not `surface-sunken` — because Untracked is outside the workflow, and it only appears while the column is expanded. In the ordinary collapsed presentation, the count sits in the same 24px header slot as a status pill. `collapsedPresentation="gutter"` hides that visual count at rest, keeps its expand control keyboard-reachable, and leaves the rail top-aligned below the same header slot. Hover preview switches to `"column"` so the count and expand control return. Inside the plane the column renders the Agent Session block verbatim, with each session led by the human who invoked it while the coding-agent identity continues to own Resume and flyout behavior. Each card keeps its dashed uncaptured-work chrome, its untracked-work flyout with Link / Create / Add as a subtask, its hover Resume and Archive / Unarchive, its Captured state, and its resume gating. Archive removes a session from the active list; when any are archived a sticky Archived N footer opens an Archived view of those sessions, with a header back arrow to return, and unarchiving the last one returns automatically. The list is a scrollport with top and bottom fade masks and a reserved 4px focus-ring gutter, so a focused card\'s ring is never clipped. `hasScrollingEffect` opts into the depth tail, extended bottom fade, and animated end summary; it is off by default. On the experimental board the in-flow host is pinned to the left of the horizontal scrollport rather than added to `boardColumns`, because untracked work is not a status: it has no place in the left-to-right progression the status columns describe, and it stays visible while the reader scrolls to the last column. A hover-revealed control collapses it, but not into the rotated label a status column becomes: a status is only a name, while these are live sessions, so the collapsed column is a full-height 32px marker rail. `notchShape="circle"` is the default: circular user dots rest at 4px, grow with the same gradual neighbor falloff as the original lines, and never exceed 12px; newly synced dots rest at 4px in `color.icon.subtle` after the arrival face shrinks into that rest. Hovering or focusing the selected dot reveals the same human face as the expanded card. `notchShape="line"` preserves the original horizontal marks and their length falloff. Both modes open the same payload-driven session flyout an Agent List row opens. Collapsing exits Archived so the rail never mixes the two lists; the gutter-rest compact scrollport shows at most the latest ten markers with a bottom mask while older sessions remain scrollable. Hovering the scaled hit area lifts that cap so every session is reachable in the column height, same as once the rail leaves the gutter (`collapsedPresentation="column"`). Panel framing does not apply: the docked header skin sits above a fill-only plane.',

	demoLayout: { previewHeight: "fit", examplesContentWidth: "bleed" },
	importStatement: `import { AgentSessionColumn } from "@/components/blocks/agent-session-column";`,
	usage: `import { AgentSessionColumn } from "@/components/blocks/agent-session-column";

<AgentSessionColumn
  title="Untracked work"
  headerSurface="panel"
  hasScrollingEffect
  onCreateWorkItem={(item) => console.log("create", item.id)}
  onLinkWorkItem={(item) => console.log("link", item.id)}
/>

// The board omits headerSurface — it defaults to "column".
// Circle markers are the default; pass notchShape="line" for the original rail.
// Kanban hosts overwrite columnFrame from columnChrome.`,
	examples: [
		{
			title: "Panel",
			description: "Docked headerSurface=panel. Framing does not apply.",
			demoSlug: "agent-session-column-demo-panel",
		},
		{
			title: "Kanban",
			description: "In-flow column. Use Default / Simple on the board to switch chrome.",
			demoSlug: "agent-session-column-demo",
		},
		{
			title: "Kanban simple",
			description: "Same board, starting on simple chrome. Toggle back to Default on the board.",
			demoSlug: "agent-session-column-demo-simple",
		},
	],
	props: [
		{
			name: "title",
			type: "string",
			default: '"Untracked work"',
			description:
				"Header label. Also seeds the column's accessible name and its `data-agent-session-column` attribute.",
		},
		{
			name: "items",
			type: "readonly AgentSessionItem[]",
			default: "built-in sample data",
			description:
				"Sessions to render. `AgentSessionItem` is the Agent List row model, so a surface that already builds those rows needs no conversion.",
		},
		{
			name: "count",
			type: "number",
			default: "items.length",
			description:
				"Header count. Override when the column shows a filtered slice of a larger backlog.",
		},
		{
			name: "hasScrollingEffect",
			type: "boolean",
			default: "false",
			description:
				"Enables the bottom depth tail, extended scroll fade, and animated end summary.",
		},
		{
			name: "emptyLabel",
			type: "string",
			default: '"No untracked sessions"',
			description: "Copy shown in place of the list when there are no sessions.",
		},
		{
			name: "defaultCollapsed",
			type: "boolean",
			default: "false",
			description:
				"Whether the column starts collapsed into its compact marker rail. The column owns the state from there — the hover-revealed shrink/grow control toggles it.",
		},
		{
			name: "notchShape",
			type: '"circle" | "line"',
			default: '"circle"',
			description:
				'Collapsed marker treatment. "circle" renders 4px human-avatar dots; reviewed rest in `icon.disabled` and newly synced rest in `color.icon.subtle`; they grow with gradual neighbor falloff to a 12px maximum and reveal the face on hover or focus. "line" preserves the original horizontal marks, length falloff, and tone treatment.',
		},
		{
			name: "collapsedPresentation",
			type: '"column" | "gutter"',
			default: '"column"',
			description:
				'Use "gutter" for the count-hidden, top-aligned compact rail at rest. The expand control remains keyboard-reachable. `"column"` keeps that total visible. The in-flow board uses `"gutter"` only while the rail is tucked; hover preview switches to `"column"` so the count and expand control return.',
		},
		{
			name: "onCollapsedChange",
			type: "(collapsed: boolean) => void",
			description: "Called after the viewer collapses or expands the column.",
		},
		{
			name: "headerSurface",
			type: '"column" | "panel"',
			default: '"column"',
			description:
				'Which chrome the header wears. `"column"` is the in-flow board title row. `"panel"` is the docked rail\'s PanelHeader skin. The collapsed rail keeps its compact header in both modes. The board omits this prop so it stays on the default.',
		},
		{
			name: "columnFrame",
			type: '"enclosed" | "caption"',
			default: '"caption"',
			description:
				'In-flow well framing. "enclosed" puts the header inside the well. "caption" leaves it on the host surface. Ignored when headerSurface is "panel". Kanban hosts derive this from columnChrome and overwrite whatever is passed on agentSessionColumn.',
		},
		{
			name: "triage",
			type: "UntrackedWorkTriage",
			description:
				"Enables hover select, the Selected N header, and bulk Link / Create / Archive / Clear. Omit it and the column stays a read-only list with Resume and Archive. `locateTarget` is the only lookup — `attach` consumes that value.",
		},
		{
			name: "capturedItemIds",
			type: "ReadonlySet<string>",
			description:
				"Ids of sessions whose chin should read Captured instead of offering Link and Create.",
		},
		{
			name: "newItemIds",
			type: "ReadonlySet<string>",
			description:
				"Ids that arrived in the last sync and have not been reviewed. Each one plays a one-shot arrival beat and carries a persistent unreviewed mark: expanded, the card steps in from above and its dashed border recolours to discovery with an information-colored leading dot; collapsed, circle markers reveal the same human avatar used by the expanded card, hold, then morph — the face shrinks 12→4 as one disc — before the photo is dropped and the unread rest takes `color.icon.subtle` while the markers below slide down to make room, and the rail's head stays count-hidden in the gutter, including the hover-scaled hit area. Once the rail is out of the gutter (column presentation), that total stays visible. Circle mode paints unread rests with `color.icon.subtle` and reviewed rests with `icon.disabled`. Line mode retains its original new-state tone and grows from its centre. The mark is the load-bearing half — it survives a backgrounded tab, a collapsed column, and prefers-reduced-motion, where the beat does not.",
		},
		{
			name: "onLinkWorkItem",
			type: "(item: AgentSessionItem, workItemKey?: string) => void",
			description:
				"Links a session to a suggested work item from the chin. Receives the row's key when several are offered. The header overflow's Link all suggestions action calls this once per uncaptured session in the current view.",
		},
		{
			name: "onCreateWorkItem",
			type: "(item: AgentSessionItem) => void",
			description:
				"Creates a work item from a session. When omitted, the action is exposed as unavailable.",
		},
		{
			name: "isResumable",
			type: "(item: AgentSessionItem) => boolean",
			default: "() => true",
			description:
				"Whether a session can be resumed. Rows that answer false render no Resume control at all, because the control copies the command before `onCopyResume` runs.",
		},
		{
			name: "onCopyResume",
			type: "(item: AgentSessionItem) => void",
			description: "Called after the hover Resume control copies the resume command.",
		},
		{
			name: "onView",
			type: "(item: AgentSessionItem) => void",
			description: "Called when a card body is activated.",
		},
		{
			name: "className",
			type: "string",
			description: "Additional classes applied to the column region that wraps the header and the session plane.",
		},
		{
			name: "listClassName",
			type: "string",
			description: "Classes applied to the inner session list.",
		},
	],
};
