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
	const sidebarNavItemSource = readProjectFile("components/ui-custom/sidebar-nav-item.tsx");

	assert.match(
		source,
		/import \{ SidebarNavItem \} from "@\/components\/ui-custom\/sidebar-nav-item";/u,
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
	assert.match(source, /<div className="min-h-0 overflow-hidden px-6">/u);
	assert.match(source, /<div className="grid h-full min-h-0 grid-cols-1 gap-8 md:grid-cols-\[220px_minmax\(0,1fr\)\]">/u);
	assert.match(source, /<div className="-mx-4 flex min-h-0 min-w-0 flex-col gap-5 overflow-y-auto px-4 pt-2 pb-6">/u);
	assert.match(source, /<nav aria-label="Agent categories" className="hidden h-full min-h-0 w-\[220px\] shrink-0 flex-col gap-5 overflow-y-auto pt-1 md:flex">/u);
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

test("Agents Directory cards render the shared CardDirectoryAgent with overlay elevation", () => {
	const source = readProjectFile("components/blocks/agent-browser/components/agent-browser.tsx");

	// Cards are delegated to the shared ui-custom component — no inlined shell duplication.
	assert.match(source, /import \{ CardDirectoryAgent \} from "@\/components\/ui-custom\/card-directory";/u);
	assert.match(source, /<CardDirectoryAgent[\s\S]*avatarImageClassName=\{getDirectoryCardAvatarClassName\(agent\)\}/u);
	assert.match(source, /onSelect=\{onSelectAgent \? \(\) => onSelectAgent\(agent\) : undefined\}/u);
	assert.doesNotMatch(source, /AgentDirectoryCard/u);
	assert.doesNotMatch(source, /AGENT_CARD_OVERLAY_SHADOW/u);
	assert.doesNotMatch(source, /import \{ motion, useReducedMotion \}/u);

	// Avatar scaling for wide third-party logos is still derived locally.
	assert.match(source, /function getDirectoryCardAvatarClassName\(agent: AgentBrowserAgent\): string/u);
	assert.match(source, /if \(agent\.id === "google-drive" \|\| agent\.id === "slack"\)/u);
	assert.match(source, /return "size-full scale-85 object-contain";/u);

	// The hover/elevation/keyboard contract now lives in the shared shell + agent wrapper.
	const shell = readProjectFile("components/ui-custom/card-directory/card-directory.tsx");
	const interaction = readProjectFile("components/ui-custom/card-directory/use-card-interaction.ts");
	const agentWrapper = readProjectFile("components/ui-custom/card-directory/card-directory-agent.tsx");

	assert.match(interaction, /token\("elevation\.shadow\.overlay"\)/u);
	assert.match(interaction, /scale: 1\.006/u);
	assert.match(interaction, /type: "spring",[\s\S]*bounce: 0\.16,[\s\S]*visualDuration: 0\.22/u);
	assert.match(shell, /group\/card flex h-full w-full flex-col gap-3 rounded-md border border-border bg-surface p-4/u);
	assert.match(shell, /focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring\/50/u);
	assert.match(shell, /willChange: "transform"/u);
	assert.match(shell, /role="button"[\s\S]*tabIndex=\{0\}[\s\S]*whileTap=\{tapAnimation\}/u);

	assert.match(agentWrapper, /shape="hexagon"/u);
	assert.match(agentWrapper, /<CardDirectoryByline/u);
	assert.match(agentWrapper, /StarUnstarredIcon/u);
	assert.match(agentWrapper, /AiChatIcon/u);

	assert.doesNotMatch(shell, /hover:-translate-y/u);
	assert.doesNotMatch(shell, /hover:shadow-2xl/u);
});
