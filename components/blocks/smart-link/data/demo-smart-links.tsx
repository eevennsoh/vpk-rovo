"use client";

import AtlassianIntelligenceIcon from "@atlaskit/icon/core/atlassian-intelligence";
import ClockIcon from "@atlaskit/icon/core/clock";
import CommentIcon from "@atlaskit/icon/core/comment";
import EyeOpenIcon from "@atlaskit/icon/core/eye-open";
import GoalIcon from "@atlaskit/icon/core/goal";
import LinkIcon from "@atlaskit/icon/core/link";
import PageIcon from "@atlaskit/icon/core/page";
import PeopleGroupIcon from "@atlaskit/icon/core/people-group";
import StarUnstarredIcon from "@atlaskit/icon/core/star-unstarred";
import ThumbsUpIcon from "@atlaskit/icon/core/thumbs-up";
import WorkItemIcon from "@atlaskit/icon/core/work-item";

import type { SmartLinkItem } from "@/components/blocks/smart-link/components/smart-link";
import {
	SMART_LINK_MODAL_ACTIONS,
	SMART_LINK_PANEL_ACTIONS,
} from "@/components/blocks/smart-link/data/smart-link-actions";
import { toPullRequestSmartLink } from "@/components/blocks/smart-link/lib/pull-request-smart-link";

// Existing-assets-only demo data: Atlassian logos and checked-in /3p assets are
// used directly; unavailable external artwork falls back to configurable tiles.
// Standard preview/copy actions come from the shared smart-link action presets.

export const SMART_LINK_DEMO_ITEMS = [
	{
		id: "engineering-whiteboard",
		href: "#engineering-whiteboard",
		title: "Engineering Whiteboard for Platform Foundation | List",
		variant: "jira",
		provider: { name: "Jira", logo: { kind: "atlassian", name: "jira" } },
		icon: { kind: "icon-tile", icon: <WorkItemIcon label="" size="medium" />, tone: "information" },
		assignee: { name: "Priya Hansra", src: "/avatar-human/priya-hansra.png" },
		status: {
			label: "In progress",
			variant: "information",
			options: [
				{ label: "To do", variant: "neutral" },
				{ label: "In progress", variant: "information" },
				{ label: "Done", variant: "success" },
			],
		},
		priority: "lowest",
		description: "Planning board for platform foundation engineering work, motion design reviews, and rollout dependencies.",
		actions: SMART_LINK_MODAL_ACTIONS,
	},
	{
		id: "verge",
		href: "#verge",
		title: "The Verge",
		variant: "article",
		provider: { name: "Website", logo: { kind: "text", label: "W", tone: "discovery" } },
		icon: { kind: "text", label: "W", tone: "discovery" },
		previewImage: {
			kind: "brand-panel",
			title: "The Verge",
			tone: "discovery",
		},
		actions: [
			{
				id: "copy-link",
				label: "Copy link",
				icon: <LinkIcon label="" size="medium" />,
			},
		],
	},
	{
		id: "laptop-refresh",
		href: "#laptop-refresh",
		title: "Updates To Our Laptop Refresh Process",
		variant: "confluence",
		provider: { name: "Confluence", logo: { kind: "atlassian", name: "confluence" } },
		icon: { kind: "icon-tile", icon: <PageIcon label="" size="medium" />, tone: "information" },
		author: { name: "Charlie Atlas", src: "/avatar-human/andrea-wilson.png" },
		date: "Updated 5 days ago",
		description:
			"To further strengthen our security, reduce unnecessary risk, and support more responsible hardware management, we're updating Atlassian's 3-year laptop refresh process.",
		actions: [
			...SMART_LINK_MODAL_ACTIONS,
			{
				id: "summarize",
				label: "Summarize with Rovo",
				icon: <AtlassianIntelligenceIcon label="" size="medium" />,
			},
			{
				id: "related",
				label: "View related links",
				icon: <ClockIcon label="" size="medium" />,
			},
		],
	},
	{
		id: "trust-scorecards",
		href: "#trust-scorecards",
		title: "[Trust Scorecards team] Core Design.",
		variant: "team",
		provider: { name: "Teams", logo: { kind: "atlassian", name: "teams" } },
		icon: { kind: "icon-tile", icon: <PeopleGroupIcon label="" size="medium" />, tone: "magenta" },
		avatars: [
			{ name: "Priya Hansra", src: "/avatar-human/priya-hansra.png" },
			{ name: "Veronica Rodriguez", src: "/avatar-human/veronica-rodriguez.png" },
			{ name: "Anthony Chen", src: "/avatar-human/anthony-chen.png" },
		],
		avatarOverflow: 48,
		metadata: [{ label: "50+ members" }],
		description:
			"Team created for purpose of Trust Scorecard reports. Model Ownership: aou_group Owner: Charlie Sutton Organisation Name: Core Design",
		actions: SMART_LINK_PANEL_ACTIONS,
	},
	{
		id: "q3-motion-goal",
		href: "#q3-motion-goal",
		title: "By end of Q3FY25, we have formed a nucleus of motion design SMEs who are actively advising/consulting the broader design org on motion use",
		variant: "goal",
		provider: { name: "Goals", logo: { kind: "atlassian", name: "goals" } },
		icon: { kind: "icon", icon: <GoalIcon label="" size="medium" /> },
		author: { name: "Omar Salah", src: "/avatar-human/omar-salah.png" },
		date: "Updated on Jul 17, 2026",
		metadata: [{ label: "6", icon: <PeopleGroupIcon label="" size="small" /> }],
		status: { label: "On track", variant: "success", metric: "0.7" },
		dueDate: "Dec 31, 2027",
		description:
			"Build a reliable motion practice that teams can consult for transitions, micro-interactions, and reduced-motion guidance across product surfaces.",
		actions: [
			...SMART_LINK_PANEL_ACTIONS,
			{
				id: "follow",
				label: "Follow",
				icon: <GoalIcon label="" size="medium" />,
			},
		],
	},
	{
		id: "custom-skills-project",
		href: "#custom-skills-project",
		title: "Custom Skills in Studio and Chat M1 - Open Beta",
		variant: "project",
		provider: { name: "Projects", logo: { kind: "atlassian", name: "projects" } },
		icon: { kind: "avatar", src: "/avatar-project/rocket.svg", alt: "Custom Skills project" },
		author: { name: "Alfredo Huitron", src: "/avatar-human/omar-salah.png" },
		date: "Updated on Jul 19, 2026",
		metadata: [{ label: "27", icon: <PeopleGroupIcon label="" size="small" /> }],
		status: { label: "On track", variant: "success" },
		dueDate: "Jul 31, 2026",
		description:
			"We are enabling customers to create their own custom skills in Atlassian Studio and Rovo Chat, adopting the Anthropic skill standard. Custom skills are reusable, structured instruction sets that extend agent capabilities.",
		actions: [
			...SMART_LINK_PANEL_ACTIONS,
			{
				id: "unfollow",
				label: "Unfollow",
				icon: <StarUnstarredIcon label="" size="medium" />,
			},
		],
	},
	{
		id: "loom-agent-directory",
		href: "#loom-agent-directory",
		title: "Agent Directory and Editing Experience Walkthrough",
		variant: "loom",
		provider: { name: "Loom", logo: { kind: "atlassian", name: "loom" } },
		icon: { kind: "atlassian", name: "loom" },
		author: { name: "Olivia Yang", src: "/avatar-human/olivia-yang.png" },
		date: "Updated 2 days ago",
		description:
			"This Loom reviews updated UI design for an Agent Directory and agent edit experience. It proposes an empty state by default for users without agency.",
		actions: SMART_LINK_MODAL_ACTIONS,
	},
	{
		id: "project-slingshot",
		href: "#project-slingshot",
		title: "Project Slingshot Release Plan",
		variant: "file",
		provider: { name: "Google Drive", logo: { kind: "third-party", name: "google-drive" } },
		icon: { kind: "third-party", name: "google-drive" },
		previewImage: {
			kind: "brand-panel",
			title: "ATLASSIAN",
			tone: "information",
		},
		metadata: [{ label: "Updated 9 hours ago" }],
		description: "Project Slingshot is an AI-powered health monitoring app that helps owners keep track of important signals.",
		actions: [
			...SMART_LINK_MODAL_ACTIONS,
			{
				id: "summarize",
				label: "Summarize with AI",
				icon: <AtlassianIntelligenceIcon label="" size="medium" />,
			},
		],
	},
	{
		id: "slack-release-plan",
		href: "#slack-release-plan",
		title: "Message from John Duncan in #yum-council",
		variant: "generic",
		provider: { name: "Slack", logo: { kind: "third-party", name: "slack" } },
		icon: { kind: "third-party", name: "slack" },
		avatars: [
			{ name: "John Duncan", src: "/avatar-human/omar-salah.png" },
			{ name: "Priya Hansra", src: "/avatar-human/priya-hansra.png" },
			{ name: "Veronica Rodriguez", src: "/avatar-human/veronica-rodriguez.png" },
			{ name: "Anthony Chen", src: "/avatar-human/anthony-chen.png" },
		],
		date: "Sent on Jul 21, 2026",
		metadata: [
			{ label: "", metric: 1, icon: <ThumbsUpIcon label="" size="small" /> },
			{ label: "", metric: 13, icon: <CommentIcon label="" size="small" /> },
		],
		description:
			"Maybe a spicey one, I don't like the tab component. Feels like we're using it to add the kitchen sink in everywhere. And the weird gray version on the new work item looks like its from Windows 95.",
	},
	{
		id: "github-storefront",
		href: "https://github.com/acme/storefront",
		title: "acme/storefront",
		variant: "generic",
		provider: { name: "GitHub", logo: { kind: "third-party", name: "github" } },
		icon: { kind: "third-party", name: "github" },
		author: { name: "eevensoh", src: "/avatar-user/venn/venn.png" },
		date: "Updated 3 hours ago",
		metadata: [
			{ label: "1", icon: <PeopleGroupIcon label="" size="small" /> },
			{ label: "", metric: 1, icon: <EyeOpenIcon label="" size="small" /> },
		],
		description:
			"Venn Prototype Kit — a Next.js + Express playground for Atlassian Design System prototypes, Rovo chat, and AI-assisted UI experiments.",
	},
	toPullRequestSmartLink({
		id: "pr-1847-guest-checkout",
		number: 1847,
		title: "Add guest checkout to the storefront",
		status: "Open",
		files: 6,
		additions: 86,
		deletions: 21,
		repository: "acme/storefront",
		branch: "feature/shop-4821-guest-checkout",
		targetBranch: "main",
		author: { name: "eevensoh", src: "/avatar-user/venn/venn.png" },
		description:
			"## Summary - Add experimental-v2 pull requests panel with phase sorting, plus activity filtering and guest checkout for the storefront.",
	}),
] satisfies SmartLinkItem[];

export const SMART_LINK_VARIANT_EXAMPLES = {
	rich: SMART_LINK_DEMO_ITEMS.filter((item) => item.variant === "confluence" || item.variant === "jira"),
	article: SMART_LINK_DEMO_ITEMS.filter((item) => item.variant === "article"),
	team: SMART_LINK_DEMO_ITEMS.filter((item) => item.variant === "team"),
	goal: SMART_LINK_DEMO_ITEMS.filter((item) => item.variant === "goal"),
	project: SMART_LINK_DEMO_ITEMS.filter((item) => item.variant === "project"),
	loom: SMART_LINK_DEMO_ITEMS.filter((item) => item.variant === "loom"),
	generic: SMART_LINK_DEMO_ITEMS.filter((item) => item.variant === "file" || item.variant === "generic"),
	pullRequest: SMART_LINK_DEMO_ITEMS.filter((item) => item.variant === "pull-request"),
} as const;

// Inline-status examples: work items whose status renders as a trailing lozenge
// on the chip itself (via <SmartLink showStatus />). Plain statuses (no options)
// so the inline indicator stays static, matching the Jira issue reference chip.
export const SMART_LINK_STATUS_EXAMPLES = [
	{
		id: "jdsn-232",
		href: "#jdsn-232",
		title: "JDSN-232: test",
		variant: "jira",
		provider: { name: "Jira", logo: { kind: "atlassian", name: "jira" } },
		icon: { kind: "atlassian", name: "jira" },
		assignee: { name: "Priya Hansra", src: "/avatar-human/priya-hansra.png" },
		status: { label: "To Do", variant: "neutral" },
		description: "Reproduce the reported issue and capture a failing test before starting the fix.",
		actions: SMART_LINK_MODAL_ACTIONS,
	},
	{
		id: "jdsn-198",
		href: "#jdsn-198",
		title: "JDSN-198: Motion polish for hover cards",
		variant: "jira",
		provider: { name: "Jira", logo: { kind: "atlassian", name: "jira" } },
		icon: { kind: "atlassian", name: "jira" },
		assignee: { name: "Veronica Rodriguez", src: "/avatar-human/veronica-rodriguez.png" },
		status: { label: "In progress", variant: "information" },
		description: "Tune enter/exit easing on the smart link hover card to match the motion guidelines.",
		actions: SMART_LINK_MODAL_ACTIONS,
	},
	{
		id: "jdsn-154",
		href: "#jdsn-154",
		title: "JDSN-154: Ship inline status lozenge",
		variant: "jira",
		provider: { name: "Jira", logo: { kind: "atlassian", name: "jira" } },
		icon: { kind: "atlassian", name: "jira" },
		assignee: { name: "Anthony Chen", src: "/avatar-human/anthony-chen.png" },
		status: { label: "Done", variant: "success" },
		description: "Render the work item status at the end of the inline smart link chip.",
		actions: SMART_LINK_MODAL_ACTIONS,
	},
] satisfies SmartLinkItem[];

export const SMART_LINK_REQUIRED_VARIANTS = [
	"confluence",
	"jira",
	"team",
	"goal",
	"project",
	"loom",
	"article",
	"file",
	"generic",
	"pull-request",
] as const;
