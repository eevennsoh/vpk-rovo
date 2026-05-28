const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

function readProjectFile(relativePath) {
	return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

test("Agents Directory is exposed as a website block and used by Studio", () => {
	assert.match(
		readProjectFile("app/data/components.ts"),
		/blockComponent\("agents-directory", "Agents Directory"\)/u,
	);
	assert.match(
		readProjectFile("app/data/component-manifest.ts"),
		/blockComponent\("agents-directory", "Agents Directory"\)/u,
	);
	assert.match(
		readProjectFile("app/data/details/blocks.ts"),
		/import \{ AgentsDirectoryDialog \} from "@\/components\/blocks\/agents-directory";/u,
	);
	assert.match(
		readProjectFile("components/website/registry.ts"),
		/"agents-directory": dynamic\(\s*\(\) => import\("\.\/demos\/blocks\/agents-directory-demo"\)/u,
	);
	assert.match(
		readProjectFile("components/projects/studio/components/rovo-app-shell.tsx"),
		/import \{ AgentsDirectoryDialog \} from "@\/components\/blocks\/agents-directory";/u,
	);
});

test("Agents Directory docs demo starts closed until the trigger is clicked", () => {
	assert.match(
		readProjectFile("components/blocks/agents-directory/page.tsx"),
		/const \[open, setOpen\] = useState\(false\);/u,
	);
});

test("Agents Directory close button sits in the dialog header", () => {
	const source = readProjectFile("components/blocks/agent-browser/components/agent-browser.tsx");

	assert.match(
		source,
		/import \{ Dialog, DialogClose, DialogContent, DialogTitle \} from "@\/components\/ui\/dialog";/u,
	);
	assert.match(source, /import CrossIcon from "@atlaskit\/icon\/core\/cross";/u);
	assert.match(
		source,
		/<DialogContent[\s\S]*showCloseButton=\{false\}[\s\S]*<div className="flex items-center justify-between px-6 pt-6 pb-4">[\s\S]*<DialogTitle[\s\S]*\{title\}[\s\S]*<\/DialogTitle>[\s\S]*<DialogClose render=\{<Button variant="ghost" size="icon" \/>\}>[\s\S]*<CrossIcon label="" \/>[\s\S]*<span className="sr-only">Close<\/span>[\s\S]*<\/DialogClose>/u,
	);
	assert.doesNotMatch(source, /className="absolute top-4 right-4"/u);
});

test("Agents Directory sidebar nav uses the shared SidebarNavItem primitive", () => {
	const source = readProjectFile("components/blocks/agent-browser/components/agent-browser.tsx");
	const sidebarNavItemSource = readProjectFile("components/ui/sidebar-nav-item.tsx");

	assert.match(
		source,
		/import \{ SidebarNavItem \} from "@\/components\/ui\/sidebar-nav-item";/u,
	);
	assert.match(source, /import AlignTextLeftIcon from "@atlaskit\/icon\/core\/align-text-left";/u);
	assert.match(source, /import \{ Avatar, AvatarImage \} from "@\/components\/ui\/avatar";/u);
	assert.match(
		source,
		/<SidebarNavItem label=\{label\} isSelected=\{active\} onClick=\{onClick\} \/>/u,
	);
	assert.match(source, /<SidebarNavItem[\s\S]*label=\{item\.label\}[\s\S]*leading=\{<SidebarItemAvatar item=\{item\} \/>\}[\s\S]*onClick=\{agent \? \(\) => onSelectAgent\?\.\(agent\) : undefined\}/u);
	assert.match(source, /function SidebarItemAvatar\(\{ item \}: Readonly<\{ item: AgentBrowserSidebarItem \}>\)/u);
	assert.match(source, /if \(item\.avatarSrc\.startsWith\("\/avatar-project\/"\)\)/u);
	assert.match(source, /<span className="flex size-6 shrink-0 items-center justify-center">[\s\S]*<Avatar size="sm" shape="square" label=\{item\.label\} className="size-5">[\s\S]*<AvatarImage alt="" aria-hidden src=\{item\.avatarSrc\} \/>/u);
	assert.match(source, /<Avatar size="sm" shape="square" className="shrink-0 after:border-0">/u);
	assert.match(source, /export interface AgentBrowserSidebarItem/u);
	assert.match(source, /items\?: readonly AgentBrowserSidebarItem\[\];/u);
	assert.match(source, /showAll\?: boolean;/u);
	assert.match(source, /function getSidebarGroupItems/u);
	assert.match(source, /showAll=\{group\.showAll\}/u);
	assert.match(source, /label="Show all"[\s\S]*leading=\{<AlignTextLeftIcon label="" size="small" \/>\}[\s\S]*leadingSize="medium"/u);
	assert.doesNotMatch(source, /className="flex w-full items-center gap-2 rounded-xs px-3 py-1\.5/u);
	assert.doesNotMatch(source, /aria-current=\{active \? "page" : undefined\}/u);
	assert.match(
		sidebarNavItemSource,
		/data-slot="sidebar-nav-item-content" className="min-w-0 flex-1 pl-0\.5"/u,
	);
});

test("Agents Directory uses independent column scrolling without extra content padding", () => {
	const source = readProjectFile("components/blocks/agent-browser/components/agent-browser.tsx");

	assert.match(source, /className="grid h-\[min\(800px,calc\(100svh-2rem\)\)\] max-h-\[calc\(100svh-2rem\)\] grid-rows-\[auto_minmax\(0,1fr\)\] gap-0 overflow-hidden p-0 sm:max-w-\[1200px\]"/u);
	assert.doesNotMatch(source, /max-h-\[85vh\]/u);
	assert.doesNotMatch(source, /className="grid max-h-\[800px\] grid-rows-\[auto_minmax\(0,1fr\)\] gap-0 p-0 sm:max-w-\[1200px\]"/u);
	assert.match(source, /<div className="min-h-0 overflow-hidden px-6 pb-6">/u);
	assert.match(source, /<div className="grid h-full min-h-0 grid-cols-1 gap-8 md:grid-cols-\[220px_minmax\(0,1fr\)\]">/u);
	assert.match(source, /<div className="flex min-h-0 min-w-0 flex-col gap-5 overflow-y-auto">/u);
	assert.match(source, /<nav aria-label="Agent categories" className="hidden h-full min-h-0 w-\[220px\] shrink-0 flex-col gap-5 overflow-y-auto md:flex">/u);
	assert.match(source, /import \{ token \} from "@\/lib\/tokens";/u);
	assert.match(
		source,
		/<p style=\{\{ font: token\("font\.heading\.xxsmall"\) \}\} className="px-1\.5 text-text-subtlest">/u,
	);
	assert.match(source, /<Button variant="outline">\s*Sort by popularity/u);
	assert.doesNotMatch(source, /<Button variant="outline" size=/u);
	assert.doesNotMatch(source, /<Button variant="outline"[^>]*className=/u);
	assert.doesNotMatch(source, /<SidebarNavItem[^>]+className=/u);
	assert.doesNotMatch(source, /Agent categories" className="[^"]*\bpr-\d/u);
	assert.doesNotMatch(source, /<p className="px-3 text-xs font-semibold uppercase leading-4 tracking-wide text-text-subtlest">/u);
	assert.doesNotMatch(source, /text-xs font-semibold uppercase leading-4 tracking-wide text-text-subtlest/u);
	assert.doesNotMatch(source, /<div className="min-h-0 overflow-y-auto px-6 pb-6">/u);
	assert.doesNotMatch(source, /<div className="min-h-0 overflow-hidden px-6">/u);
	assert.doesNotMatch(source, /<div className="min-h-0 min-w-0 flex-1 overflow-y-auto pb-6 pr-1">/u);
	assert.doesNotMatch(source, /<div className="flex min-w-0 flex-col gap-5 pr-5">/u);
	assert.doesNotMatch(source, /overflow-y-auto pb-6 pr-1/u);
	assert.doesNotMatch(source, /sticky top-0/u);
});

test("Agents Directory uses one unsegmented results grid and updated sidebar labels", () => {
	const source = readProjectFile("components/blocks/agent-browser/components/agent-browser.tsx");
	const defaultSidebarGroupsSource = readProjectFile("components/blocks/agents-directory/data/sidebar-groups.ts");
	const demoSidebarGroupsSource = readProjectFile("components/blocks/agent-browser/data/demo-agents.ts");
	const pageSource = readProjectFile("components/blocks/agents-directory/page.tsx");

	assert.match(source, /<AgentSection agents=\{filtered\} onSelectAgent=\{onSelectAgent\} \/>/u);
	assert.match(source, /<section aria-label="Agents">/u);
	assert.doesNotMatch(source, /recommendedCount/u);
	assert.doesNotMatch(source, /DEFAULT_RECOMMENDED_COUNT/u);
	assert.doesNotMatch(source, /const recommended = filtered\.slice/u);
	assert.doesNotMatch(source, /const rest = filtered\.slice/u);
	assert.doesNotMatch(source, /title="Recommended"/u);
	assert.doesNotMatch(source, /title="All agents"/u);
	assert.doesNotMatch(source, />\s*\{title\}\s*<\/h2>/u);

	for (const groupsSource of [defaultSidebarGroupsSource, demoSidebarGroupsSource]) {
		assert.match(groupsSource, /title: "By teams"/u);
		assert.match(groupsSource, /title: "By teams",\n\t\tshowAll: true/u);
		assert.match(groupsSource, /label: "Product Experience"/u);
		assert.match(groupsSource, /avatarSrc: "\/avatar-project\/compass\.svg"/u);
		assert.match(groupsSource, /label: "Platform Engineering"/u);
		assert.match(groupsSource, /avatarSrc: "\/avatar-project\/code\.svg"/u);
		assert.match(groupsSource, /label: "Customer Success"/u);
		assert.match(groupsSource, /avatarSrc: "\/avatar-project\/service-bell\.svg"/u);
		assert.match(groupsSource, /label: "Revenue Operations"/u);
		assert.match(groupsSource, /avatarSrc: "\/avatar-project\/graph\.svg"/u);
		assert.match(groupsSource, /title: "By companies"/u);
		assert.match(groupsSource, /title: "By companies",\n\t\tshowAll: true/u);
		assert.doesNotMatch(groupsSource, /By my teams/u);
		assert.doesNotMatch(groupsSource, /By partners/u);
	}

	assert.match(source, /attributionKind\?: "company" \| "team" \| "person";/u);
	assert.match(source, /function isVerified\(agent: AgentBrowserAgent, publisher: string\): boolean/u);
	assert.match(source, /if \(agent\.attributionKind\) return agent\.attributionKind === "company";/u);
	assert.match(demoSidebarGroupsSource, /attributionKind: "company"/u);
	assert.match(demoSidebarGroupsSource, /attributionKind: "team"/u);
	assert.match(demoSidebarGroupsSource, /attributionKind: "person"/u);
	assert.match(demoSidebarGroupsSource, /by Product Experience|by Customer Success|by Platform Engineering/u);
	assert.match(demoSidebarGroupsSource, /by Mei Tan|by Priya Shah/u);
	assert.match(pageSource, /attributionKind: "team"/u);
	assert.match(pageSource, /attributionKind: "person"/u);
	assert.match(pageSource, /by Revenue Operations/u);
	assert.match(pageSource, /by Alex Kim/u);
	for (const dataSource of [demoSidebarGroupsSource, pageSource]) {
		assert.doesNotMatch(dataSource, /Custom agent/u);
	}
});

test("Agents Directory cards hover with overlay elevation and hidden stroke", () => {
	const source = readProjectFile("components/blocks/agent-browser/components/agent-browser.tsx");

	assert.match(source, /import \{ motion, useReducedMotion \} from "motion\/react";/u);
	assert.match(source, /import AiChatIcon from "@atlaskit\/icon\/core\/ai-chat";/u);
	assert.match(source, /import ShowMoreHorizontalIcon from "@atlaskit\/icon\/core\/show-more-horizontal";/u);
	assert.match(source, /import StarUnstarredIcon from "@atlaskit\/icon\/core\/star-unstarred";/u);
	assert.doesNotMatch(source, /@atlaskit\/icon\/core\/comment/u);
	assert.doesNotMatch(source, /@atlaskit\/icon\/core\/star-starred/u);
	assert.match(source, /const AGENT_CARD_OVERLAY_SHADOW = token\("elevation\.shadow\.overlay"\);/u);
	assert.match(source, /const AGENT_CARD_HOVER_ANIMATION = \{[\s\S]*borderColor: "transparent",[\s\S]*boxShadow: AGENT_CARD_OVERLAY_SHADOW,[\s\S]*transform: "scale\(1\.006\)",[\s\S]*\} as const;/u);
	assert.match(source, /const AGENT_CARD_REDUCED_HOVER_ANIMATION = \{[\s\S]*borderColor: "transparent",[\s\S]*boxShadow: AGENT_CARD_OVERLAY_SHADOW,[\s\S]*\} as const;/u);
	assert.match(source, /const AGENT_CARD_HOVER_TRANSITION = \{[\s\S]*type: "spring",[\s\S]*bounce: 0\.16,[\s\S]*visualDuration: 0\.22,[\s\S]*\} as const;/u);
	assert.match(source, /<div className="flex items-start gap-2">/u);
	assert.doesNotMatch(source, /<div className="flex items-start gap-3">/u);
	assert.match(source, /function getDirectoryCardAvatarClassName\(agent: AgentBrowserAgent\): string/u);
	assert.match(source, /if \(agent\.id === "google-drive" \|\| agent\.id === "slack"\)/u);
	assert.match(source, /return "size-full scale-85 object-contain";/u);
	assert.match(source, /className=\{getDirectoryCardAvatarClassName\(agent\)\}/u);
	assert.match(source, /<p className="line-clamp-2 min-h-10 text-sm leading-5 text-text">/u);
	assert.doesNotMatch(source, /line-clamp-2 min-h-10 text-xs leading-5 text-text-subtle/u);
	assert.match(source, /const handleMoreActionClick = \(event: MouseEvent<HTMLButtonElement>\) => \{[\s\S]*event\.stopPropagation\(\);[\s\S]*\};/u);
	assert.match(
		source,
		/<Button[\s\S]*aria-label=\{`More actions for \$\{agent\.name\}`\}[\s\S]*className="size-6 shrink-0 cursor-pointer opacity-0 transition-opacity duration-fast ease-out group-hover\/card:opacity-100 group-focus-within\/card:opacity-100"[\s\S]*onClick=\{handleMoreActionClick\}[\s\S]*size="icon-xs"[\s\S]*type="button"[\s\S]*variant="ghost"[\s\S]*<ShowMoreHorizontalIcon label="" size="small" \/>[\s\S]*<\/Button>/u,
	);
	assert.match(source, /<div className="flex items-center gap-4 text-xs leading-4 text-text-subtlest">/u);
	assert.match(
		source,
		/<Icon[\s\S]*className="size-3 text-icon-subtlest \[&_svg\]:size-3"[\s\S]*render=\{<StarUnstarredIcon label="" size="small" spacing="none" color="currentColor" \/>\}/u,
	);
	assert.match(
		source,
		/<Icon[\s\S]*className="size-3 text-icon-subtlest \[&_svg\]:size-3"[\s\S]*render=\{<AiChatIcon label="" size="small" spacing="none" color="currentColor" \/>\}/u,
	);
	assert.match(
		source,
		/"group\/card flex h-full w-full cursor-pointer flex-col gap-3 rounded-md border border-border bg-surface p-4 text-left outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring\/50"/u,
	);
	assert.match(source, /const shouldReduceMotion = useReducedMotion\(\);/u);
	assert.match(source, /whileHover: hoverAnimation/u);
	assert.match(source, /whileTap=\{tapAnimation\}/u);
	assert.match(source, /style: \{ willChange: "transform, box-shadow, border-color" \}/u);
	assert.match(source, /<motion\.article[\s\S]*role="button"[\s\S]*tabIndex=\{0\}[\s\S]*whileTap=\{tapAnimation\}[\s\S]*\{content\}[\s\S]*<\/motion\.article>/u);
	assert.match(source, /return <motion\.article \{\.\.\.cardMotionProps\}>\{content\}<\/motion\.article>;/u);
	assert.doesNotMatch(source, /hover:-translate-y/u);
	assert.doesNotMatch(source, /hover:border-border-selected/u);
	assert.doesNotMatch(source, /hover:bg-surface-hovered/u);
	assert.doesNotMatch(source, /hover:shadow-2xl/u);
	assert.doesNotMatch(source, /transition-\[background-color,border-color,box-shadow,transform\]/u);
});
