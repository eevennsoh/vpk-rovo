import type { ComponentDetail } from "@/app/data/component-detail-types";

export const PULL_REQUEST_HEADER_DETAIL: ComponentDetail = {
	description:
		"Pull-request detail header with expanded and compact variants plus an optional bottom-edge tab-navigation slot. The title row stays visible with a Merge split button (primary label + merge method / Auto merge menu) and a More actions menu (Copy link, Open in {SCM}, Convert to draft, Close pull request); use `variant` or `scrollContainerRef` to collapse the status, repository, and branch meta row while keeping the tabs anchored. Compact mode also shrinks the PR number and title to `text-sm`.",
	importStatement: `import { PullRequestHeader } from "@/components/blocks/pull-request-header";
import type { PullRequestHeaderProps } from "@/components/blocks/pull-request-header";`,
	usage: `import { useRef } from "react";

import { PullRequestHeader } from "@/components/blocks/pull-request-header";

const scrollContainerRef = useRef<HTMLDivElement | null>(null);

// Controlled mode
<PullRequestHeader
  number={1847}
  title="Add the guest checkout storefront flow"
  status="Open"
  baseBranch="main"
  headBranch="feature/guest-checkout"
  repository="acme/storefront"
  mergeState="ready"
  defaultMergeMethod="squash"
  defaultAutoMerge
  variant="compact"
/>

// Scroll-driven mode
<PullRequestHeader
  {...pullRequest}
  collapseOffset={16}
  scrollContainerRef={scrollContainerRef}
/>
<div ref={scrollContainerRef}>{content}</div>`,
	demoLayout: {
		previewContentWidth: "full",
		examplesContentWidth: "full",
	},
	props: [
		{
			name: "tabNavigation",
			type: "ReactNode",
			description:
				"Tab list rendered on the header's bottom edge. Keep the owning Tabs root outside the header so related panels can remain beside it.",
		},
		{
			name: "variant",
			type: '"expanded" | "compact"',
			description:
				"Controlled presentation override. When provided, it takes precedence over scroll-driven collapse. Compact also applies `text-sm` to the PR number and title.",
		},
		{
			name: "scrollContainerRef",
			type: "RefObject<HTMLElement | null>",
			description:
				"Scrollable element used to derive expanded or compact state when `variant` is omitted.",
		},
		{
			name: "collapseOffset",
			type: "number",
			default: "16",
			description:
				"Scroll distance in pixels at which scroll-driven mode becomes compact.",
		},
		{
			name: "number",
			type: "number",
			required: true,
			description: "Pull request number shown as subtle `#N` before the title.",
		},
		{
			name: "title",
			type: "string",
			required: true,
			description: "Pull request title shown after the number.",
		},
		{
			name: "status",
			type: '"Open" | "Merged"',
			required: true,
			description:
				"Review state rendered as a status lozenge in the meta row (Open = success, Merged = discovery).",
		},
		{
			name: "baseBranch",
			type: "string | null",
			description:
				"Target / base branch shown after the arrow. Branch text omits when either side is missing.",
		},
		{
			name: "headBranch",
			type: "string | null",
			description: "Source / head branch shown before the arrow.",
		},
		{
			name: "repository",
			type: "string",
			required: true,
			description: "Owner/name path shown in the GitHub repository tag.",
		},
		{
			name: "mergeState",
			type: '"checks-running" | "merge-conflicts" | "ready"',
			default: '"ready"',
			description:
				'Merge split-button primary label: `"checks-running"` → "Checks running", `"merge-conflicts"` → "Merge conflicts", `"ready"` → the selected merge method label. Primary actions enable when their matching callback is available. The chevron menu stays available for merge method + Auto merge.',
		},
		{
			name: "mergeMethod",
			type: '"squash" | "merge" | "rebase"',
			description:
				"Controlled merge method radio selection in the merge options menu. Prefer with `onMergeMethodChange`.",
		},
		{
			name: "defaultMergeMethod",
			type: '"squash" | "merge" | "rebase"',
			default: '"squash"',
			description:
				'Uncontrolled merge method default. `"squash"` unless overridden.',
		},
		{
			name: "onMergeMethodChange",
			type: "(method: \"squash\" | \"merge\" | \"rebase\") => void",
			description:
				"Called when a merge method radio option is selected in the merge options menu.",
		},
		{
			name: "autoMerge",
			type: "boolean",
			description:
				"Controlled Auto merge switch state in the merge options menu. Prefer with `onAutoMergeChange`.",
		},
		{
			name: "defaultAutoMerge",
			type: "boolean",
			default: "true",
			description:
				"Uncontrolled Auto merge default. On (`true`) unless overridden.",
		},
		{
			name: "onAutoMergeChange",
			type: "(enabled: boolean) => void",
			description:
				"Called when the Auto merge switch in the merge options menu changes.",
		},
		{
			name: "onMergeClick",
			type: "() => void",
			description:
				"Called when the Merge primary action is activated (enabled only when `mergeState` is `ready`).",
		},
		{
			name: "onChecksRunningClick",
			type: "() => void",
			description:
				"Called when the Checks running primary is activated (enabled only when `mergeState` is `checks-running`). In the work-item PR detail, this expands the CI checks disclosure in the metadata rail.",
		},
		{
			name: "onMergeConflictsClick",
			type: "() => void",
			description:
				"Called when the Merge conflicts primary is activated. Jira PR detail uses it to switch to Details and expand the CI checks section.",
		},
		{
			name: "url",
			type: "string",
			description:
				"Pull request URL for More actions → Copy link and Open in {SCM}. Those items stay disabled when omitted.",
		},
		{
			name: "scmProviderName",
			type: "string",
			description:
				'SCM product name for More actions → "Open in {name}" (e.g. `"GitHub"`). When omitted, derived from the `url` hostname.',
		},
		{
			name: "onConvertToDraftClick",
			type: "() => void",
			description:
				"Called when More actions → Convert to draft is selected. The item stays disabled for merged PRs; pass a no-op stub to enable it for open PR demos.",
		},
		{
			name: "onClosePullRequestClick",
			type: "() => void",
			description:
				"Called when More actions → Close pull request is selected. The item stays disabled for merged PRs; pass a no-op stub to enable it for open PR demos.",
		},
	],
};
