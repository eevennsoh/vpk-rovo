import type { ComponentDetail } from "@/app/data/component-detail-types";

export const CONTEXT_BAR_DETAIL: ComponentDetail = {
	description:
		"A contextual bar that sits above a composer or chat input to name the active context (an agent, artifact, board, work item, or pull request). Pairs a lead icon and label with a truncating tag chip and a dismiss affordance. The collapsible variant self-manages open state. ContextBarCreatePullRequest is the pre-PR variation (branch + diff + Create PR split button). ContextBarPullRequest is the open-PR variation: status, hoverable number, branch, diff stats, and the CI checks menu. ContextBarPromptFlyout is the suggested-prompt variation: one pill in the dock, with the rest stacking straight up on hover or click.",
	usage: `import {
  AnimatedCollapsibleContextBar,
  CollapsibleContextBar,
  ContextBar,
  ContextBarCreatePullRequest,
  ContextBarLead,
  ContextBarPill,
  ContextBarPromptFlyout,
  ContextBarPullRequest,
  ContextBarTag,
  ContextBarTagGroup,
  ContextBarTrigger,
} from "@/components/ui-custom/context-bar";

// Self-contained collapsible bar
<CollapsibleContextBar
  lead={<EditIcon label="" size="small" />}
  leadLabel="Edit:"
  collapsedIcon={<EditIcon label="" size="small" />}
  collapsedLabel="Edit agent"
  triggerAriaLabel="Edit agent: Research assistant"
>
  <ContextBarTag color="blue" title="Research assistant">
    Research assistant
  </ContextBarTag>
</CollapsibleContextBar>

// Animated morph between the pill and the bar (same props)
<AnimatedCollapsibleContextBar
  defaultOpen={false}
  lead={<EditIcon label="" size="small" />}
  leadLabel="Edit:"
  collapsedIcon={<EditIcon label="" size="small" />}
  collapsedLabel="Edit agent"
>
  <ContextBarTag color="blue" title="Research assistant">
    Research assistant
  </ContextBarTag>
</AnimatedCollapsibleContextBar>

// Pills with automatic overflow into a "…" popover
<ContextBarTagGroup
  overflowAriaLabel="Show more actions"
  items={[
    { id: "review", content: <ContextBarPill>Review</ContextBarPill> },
    { id: "move", content: <ContextBarPill>Move to Local</ContextBarPill> },
    { id: "prs", content: <ContextBarPill>Create PRs</ContextBarPill> },
  ]}
/>

// Suggested prompts: one pill in the dock, the rest stack straight up on hover or click
<ContextBarPromptFlyout
  icon={<LightbulbIcon label="" size="small" />}
  items={[
    { id: "date", label: "Is this epic going to hit its target date?", onSelect: handleAsk },
    { id: "behind", label: "Which stream is furthest behind?", onSelect: handleAsk },
    { id: "left", label: "What is left before the adapter can be deleted?", onSelect: handleAsk },
  ]}
/>

// Pre-PR variation (branch + diffs + Create PR split button)
<ContextBarCreatePullRequest
  repository="acme/storefront"
  branch="rovo/rfp-103-response-validation"
  additions={86}
  deletions={21}
  onCreate={handleCreate}
  onCreateDraft={handleCreateDraft}
  onCreateManually={handleCreateManually}
  onDismiss={handleDismiss}
/>

// Pull-request variation (status + hoverable #N + branch + diffs)
<ContextBarPullRequest
  number={1306}
  href="https://github.com/acme/storefront/pull/1306"
  title="Add guest checkout to the storefront"
  status="Open"
  branch="rovo/rfp-103-response-validation"
  additions={86}
  deletions={21}
  repository="acme/storefront"
  targetBranch="main"
  ci={{
    status: "passed",
    checks: [
      { id: "lint-types", name: "Lint and typecheck", status: "passed", details: "Passed in 1m 18s" },
      { id: "unit-tests", name: "Unit tests", status: "passed", details: "418 tests in 2m 46s" },
    ],
    summary: "2 CI checks",
    autoFixEnabled: false,
    autoMergeEnabled: true,
    onAutoFixChange,
    onAutoMergeChange,
  }}
  onDismiss={handleDismiss}
/>

// Or compose the pieces manually
<ContextBar onDismiss={handleDismiss}>
  <ContextBarLead icon={<LocationIcon label="" size="small" />}>
    Context:
  </ContextBarLead>
  <ContextBarTag color="blue" title="Q3 launch plan">Q3 launch plan</ContextBarTag>
</ContextBar>`,
	props: [
		{
			name: "onDismiss",
			type: "() => void",
			description:
				"ContextBar only. Dismiss handler. When omitted, a non-interactive placeholder keeps the layout stable.",
		},
		{
			name: "dismissLabel",
			type: "string",
			default: '"Close"',
			description: "Accessible label for the dismiss button.",
		},
		{
			name: "leadLabel",
			type: "string",
			required: true,
			description: "CollapsibleContextBar only. Prefix label shown before the tag (e.g. \"Edit:\").",
		},
		{
			name: "collapsedLabel",
			type: "string",
			required: true,
			description: "CollapsibleContextBar only. Label for the collapsed pill trigger.",
		},
		{
			name: "lead",
			type: "ReactNode",
			description: "CollapsibleContextBar only. Lead icon rendered before the label.",
		},
		{
			name: "collapsedIcon",
			type: "ReactNode",
			description: "CollapsibleContextBar only. Icon rendered inside the collapsed pill trigger.",
		},
		{
			name: "defaultOpen",
			type: "boolean",
			default: "true",
			description: "CollapsibleContextBar only. Whether the bar starts expanded. Remount with a key to reset.",
		},
		{
			name: "triggerAriaLabel",
			type: "string",
			description: "CollapsibleContextBar / AnimatedCollapsibleContextBar. Accessible label for the collapsed pill trigger.",
		},
		{
			name: "items",
			type: "Array<{ id: string; content: ReactNode }>",
			required: true,
			description: "ContextBarTagGroup only. Pills to lay out; overflowing items collapse behind the trailing \u2026 button.",
		},
		{
			name: "items (ContextBarPromptFlyout)",
			type: "Array<{ id: string; label: string; onSelect: () => void }>",
			required: true,
			description: "ContextBarPromptFlyout `items` prop, distinct from ContextBarTagGroup `items`. Prompts to offer. The longest label docks as the trigger; the rest stack straight up, left-aligned.",
		},
		{
			name: "icon",
			type: "ReactNode",
			description: "ContextBarPromptFlyout only. Lead icon shared by the docked pill and the stacked pills unless an item supplies its own.",
		},
		{
			name: "ariaLabel",
			type: "string",
			default: '"Suggested questions"',
			description: "ContextBarPromptFlyout only. Accessible name for the prompt group.",
		},
		{
			name: "defaultOpen (ContextBarPromptFlyout)",
			type: "boolean",
			default: "false",
			description: "ContextBarPromptFlyout only. Whether the extra prompts start stacked above the trigger. Remount with a key to reset.",
		},
		{
			name: "overflowAriaLabel",
			type: "string",
			default: '"Show more context"',
			description: "ContextBarTagGroup only. Accessible label for the overflow popover trigger.",
		},
		{
			name: "gap",
			type: "number",
			default: "8",
			description: "ContextBarTagGroup only. Horizontal gap (px) between pills, used for both layout and overflow measurement.",
		},
		{
			name: "number / href / title / status / branch",
			type: "number / string / string / Open | Merged / string",
			required: true,
			description: "ContextBarPullRequest only. Generic PR identity. Hovering the number shows the spacious PullRequest card.",
		},
		{
			name: "additions / deletions",
			type: "number",
			required: true,
			description: "ContextBarPullRequest only. Diff stats rendered as +N −N.",
		},
		{
			name: "ci",
			type: "ContextBarPullRequestCi",
			description: "ContextBarPullRequest only. CI checks menu: status, per-check rows, summary, and auto-fix / auto-merge handlers.",
		},
		{
			name: "mergeState / approvalsCurrent / approvalsRequired",
			type: "disabled | blocked | queued | merged / number / number",
			description: "ContextBarPullRequest only. Optional merge pill and approvals summary beside the CI menu.",
		},
		{
			name: "actions",
			type: "ReactNode",
			description: "ContextBarPullRequest only. Extra trailing chrome after the CI menu, before dismiss.",
		},
		{
			name: "repository / branch / additions / deletions",
			type: "string / string / number / number",
			required: true,
			description: "ContextBarCreatePullRequest only. Unpublished branch identity and diff stats, shown before a pull request exists.",
		},
		{
			name: "onCreate / onCreateDraft / onCreateManually",
			type: "() => void / () => void / () => void",
			description: "ContextBarCreatePullRequest only. Split-button actions: create a ready PR, create a draft, or create one manually. Selecting a menu item updates the primary action; omitting a callback disables its action.",
		},
	],
	subComponents: [
		{ name: "ContextBar", description: "Expanded bar above a composer. Renders children (lead + tag) on the left and the dismiss affordance on the right." },
		{ name: "ContextBarLead", description: "Lead icon plus label (e.g. \"Edit:\" / \"Context:\") rendered inside ContextBar." },
		{ name: "ContextBarTag", description: "Truncating chip naming the active context. Wraps the Tag primitive with overflow handling and an optional elemBefore icon or avatar." },
		{ name: "ContextBarTrigger", description: "Collapsed pill that brings the bar back. A styled button accepting an icon and label." },
		{ name: "CollapsibleContextBar", description: "Self-contained variant that owns its open state: starts expanded, collapses to ContextBarTrigger on dismiss, and re-expands when the trigger is pressed." },
		{ name: "AnimatedCollapsibleContextBar", description: "Same API as CollapsibleContextBar, but morphs between the collapsed pill and expanded bar with a Motion layout spring (cross-fading content via AnimatePresence). Respects prefers-reduced-motion." },
		{ name: "ContextBarPill", description: "Outlined, rounded-full action pill (optional leading icon) used as the building block for ContextBarTagGroup, e.g. \"Review +6 -3\"." },
		{ name: "ContextBarTagGroup", description: "Width-aware row of pills that shows as many as fit, then collapses the remainder behind a trailing circular \u2026 overflow button revealing the hidden pills in a popover. Takes an items array of { id, content }." },
		{ name: "ContextBarPromptFlyout", description: "Suggested-prompt variation: one context-bar pill in the dock; hover or click stacks the remaining prompts straight up, left-aligned, as the same context-bar pills so the reader can pick one." },
		{ name: "ContextBarCreatePullRequest", description: "Pre-PR variation: repository, branch, diff stats, and a Create PR split button (ready, draft, or manual) with dismiss. CI is unavailable until a pull request exists." },
		{ name: "ContextBarPullRequest", description: "Pull-request variation: status lozenge, hoverable #N (spacious PR card), branch, diff stats, CI checks menu, and dismiss." },
	],
	examples: [
		{ title: "Create pull request", description: "Composer bar for a branch that does not have a pull request yet. The split button creates a ready PR, a draft, or creates one manually.", demoSlug: "context-bar-demo-create-pull-request" },
		{ title: "Pull request", description: "Three compact permutations: open with failed CI, open with passed CI, and merged with passed CI. Hover a number to preview the spacious PR card.", demoSlug: "context-bar-demo-pull-request" },
		{ title: "Collapsible", description: "Self-contained bar that collapses to a pill on dismiss and re-expands when pressed.", demoSlug: "context-bar-demo-collapsible" },
		{ title: "Animated expand", description: "The collapsed pill morphs into the full bar with a Motion layout spring, and collapses back on dismiss.", demoSlug: "context-bar-demo-animated" },
		{ title: "Multiple pills with overflow", description: "A row of action pills that collapses overflowing items into a trailing \u2026 button revealing them in a popover.", demoSlug: "context-bar-demo-multi-pill" },
		{ title: "Prompt flyout", description: "One suggested-prompt pill in the dock. Hover or click stacks the rest straight up, left-aligned, as the same context-bar pills.", demoSlug: "context-bar-demo-prompt-flyout" },
		{ title: "Dismissible", description: "Manually composed bar with lead, tag, and a dismiss handler.", demoSlug: "context-bar-demo-dismissible" },
		{ title: "Trigger pill", description: "The standalone collapsed trigger pill on its own.", demoSlug: "context-bar-demo-trigger" },
	],
};
