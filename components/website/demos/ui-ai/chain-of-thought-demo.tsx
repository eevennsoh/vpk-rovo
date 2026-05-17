import {
	ChainOfThought,
	ChainOfThoughtContent,
	ChainOfThoughtHeader,
	ChainOfThoughtImage,
	ChainOfThoughtSearchResult,
	ChainOfThoughtSearchResults,
	ChainOfThoughtStep,
} from "@/components/ui-ai/chain-of-thought";
import { renderResolvedToolIcon, resolveToolIcon } from "@/components/projects/shared/lib/tool-icon-resolver";
import ImageIcon from "@atlaskit/icon/core/image";
import SearchIcon from "@atlaskit/icon/core/search";
import AiSparkleIcon from "@atlaskit/icon/core/ai-sparkle";
import CheckCircleIcon from "@atlaskit/icon/core/check-circle";
import Image from "next/image";

const PROFILE_SOURCES = [
	"https://www.x.com/haydenbleasel",
	"https://www.instagram.com/haydenbleasel",
	"https://www.github.com/haydenbleasel",
] as const;

const RECENT_WORK_SOURCES = [
	"https://www.github.com/haydenbleasel",
	"https://www.dribbble.com/haydenbleasel",
] as const;

type ToolIconRow = {
	category: string;
	toolName: string;
	note: string;
	mcpServer?: string;
};

const TOOL_ICON_ROWS: ReadonlyArray<ToolIconRow> = [
	{ category: "Built-in", toolName: "invoke_subagents", note: "Agent orchestration" },
	{ category: "Built-in", toolName: "get_skill", note: "Skill lookup" },
	{ category: "Built-in", toolName: "exit_plan_mode", note: "Plan handoff" },
	{ category: "Built-in", toolName: "ask_user_questions", note: "Question prompt" },
	{ category: "Built-in", toolName: "update_todo", note: "Checklist update" },
	{ category: "Built-in", toolName: "open_files", note: "Open files" },
	{ category: "Built-in", toolName: "create_file", note: "Create file" },
	{ category: "Built-in", toolName: "delete_file", note: "Delete file" },
	{ category: "Built-in", toolName: "move_file", note: "Move file" },
	{ category: "Built-in", toolName: "expand_code_chunks", note: "Expand code chunks" },
	{ category: "Built-in", toolName: "find_and_replace_code", note: "Find and replace" },
	{ category: "Built-in", toolName: "grep", note: "Search code" },
	{ category: "Built-in", toolName: "expand_folder", note: "Expand folder" },
	{ category: "Built-in", toolName: "bash", note: "Shell command" },
	{ category: "Built-in", toolName: "multi_tool_use.parallel", note: "Parallel tool execution" },

	{ category: "Fallback", toolName: "custom_internal_tool", note: "Tool fallback — wrench icon" },
	{ category: "Fallback", toolName: "mcp__custom_server__run", mcpServer: "custom-server", note: "MCP fallback — globe icon" },

	{ category: "MCP", toolName: "mcp__atlassian__invoke_tool", mcpServer: "atlassian", note: "Atlassian platform logo" },
	{ category: "MCP", toolName: "mcp__bitbucket__search_repositories", mcpServer: "bitbucket", note: "Bitbucket logo" },
	{ category: "MCP", toolName: "mcp__google_calendar__list_events", mcpServer: "google-calendar", note: "3P logo" },
	{ category: "MCP", toolName: "mcp__google_drive__search_files", mcpServer: "google-drive", note: "3P logo" },
	{ category: "MCP", toolName: "mcp__gcp__list_projects", mcpServer: "gcp", note: "MCP server" },
	{ category: "MCP", toolName: "mcp__gmail__search_messages", mcpServer: "gmail", note: "3P logo" },
	{ category: "MCP", toolName: "mcp__atlassian_tenant__get_sites", mcpServer: "atlassian-tenant", note: "Atlassian platform logo" },
	{ category: "MCP", toolName: "mcp__atlassian_project__search_issues", mcpServer: "atlassian-project", note: "Projects logo" },
	{ category: "MCP", toolName: "mcp__atlassian_goal__list_goals", mcpServer: "atlassian-goal", note: "Goals logo" },
	{ category: "MCP", toolName: "mcp__atlassian_team__search_teams", mcpServer: "atlassian-team", note: "Teams logo" },
	{ category: "MCP", toolName: "mcp__teamwork_graph__search", mcpServer: "teamwork-graph", note: "Teamwork graph" },
	{ category: "MCP", toolName: "mcp__s360__search", mcpServer: "s360", note: "S360 logo" },
	{ category: "MCP", toolName: "mcp__slack__post_message", mcpServer: "slack", note: "3P logo" },
	{ category: "MCP", toolName: "mcp__compass__find_component", mcpServer: "compass", note: "Compass logo" },
	{ category: "MCP", toolName: "mcp__talent__search_people", mcpServer: "talent", note: "Talent logo" },
	{ category: "MCP", toolName: "mcp__remote_bitbucket_search__search", mcpServer: "remote-bitbucket-search", note: "MCP server" },
	{ category: "MCP", toolName: "mcp__rovodev__run", mcpServer: "rovodev", note: "Rovodev logo" },
	{ category: "MCP", toolName: "mcp__forge_knowledge__search", mcpServer: "forge-knowledge", note: "Forge logo" },
	{ category: "MCP", toolName: "mcp__ads_mcp__ads_plan", mcpServer: "ads-mcp", note: "ADS logo" },
	{ category: "MCP", toolName: "mcp__web_search__search", mcpServer: "web-search", note: "Web search" },
	{ category: "MCP", toolName: "mcp__chrome_devtools__navigate_page", mcpServer: "chrome-devtools", note: "Google Chrome logo" },
] as const;

const toHostname = (url: string) => new URL(url).hostname;

export default function ChainOfThoughtDemo() {
	return <ChainOfThoughtDemoThinking />;
}

export function ChainOfThoughtDemoPreload() {
	return (
		<ChainOfThought className="w-full max-w-2xl">
			<ChainOfThoughtHeader showChevron={false} state="preload" shimmer />
			<ChainOfThoughtContent>
				<ChainOfThoughtStep
					icon={SearchIcon}
					label="Searching the web"
					description="Searching public profiles for Hayden Bleasel"
					status="pending"
				/>
			</ChainOfThoughtContent>
		</ChainOfThought>
	);
}

export function ChainOfThoughtDemoThinking() {
	return (
		<ChainOfThought defaultOpen className="w-full max-w-2xl">
			<ChainOfThoughtHeader state="thinking" />
			<ChainOfThoughtContent>
				<ChainOfThoughtStep
					icon={SearchIcon}
					label="Searching the web"
					description="Searching public profiles for Hayden Bleasel"
					status="complete"
					collapsible
				>
					<ChainOfThoughtSearchResults>
						{PROFILE_SOURCES.map((website) => (
							<ChainOfThoughtSearchResult key={website}>
								{toHostname(website)}
							</ChainOfThoughtSearchResult>
						))}
					</ChainOfThoughtSearchResults>
				</ChainOfThoughtStep>

				<ChainOfThoughtStep
					icon={ImageIcon}
					label="Selecting profile image"
					description="Found a likely profile image from the source set"
					status="complete"
					collapsible
				>
					<ChainOfThoughtImage caption="Public profile image selected from matched sources.">
						<Image
							alt="Profile image result"
							className="h-40 w-40 rounded-md border border-border object-cover"
							height={160}
							src="/avatar-human/anthony-chen.png"
							width={160}
						/>
					</ChainOfThoughtImage>
				</ChainOfThoughtStep>

				<ChainOfThoughtStep
					icon={AiSparkleIcon}
					label="Synthesizing summary"
					description="Synthesizing a short profile summary from validated signals"
					status="complete"
				/>

				<ChainOfThoughtStep
					icon={SearchIcon}
					label="Checking work updates"
					description="Searching GitHub and Dribbble for recent work updates"
					status="active"
					collapsible
				>
					<ChainOfThoughtSearchResults>
						{RECENT_WORK_SOURCES.map((website) => (
							<ChainOfThoughtSearchResult key={website}>
								{toHostname(website)}
							</ChainOfThoughtSearchResult>
						))}
					</ChainOfThoughtSearchResults>
				</ChainOfThoughtStep>
			</ChainOfThoughtContent>
		</ChainOfThought>
	);
}

export function ChainOfThoughtDemoCompleted() {
	return (
		<ChainOfThought className="w-full max-w-2xl">
			<ChainOfThoughtHeader state="completed" duration={5} />
			<ChainOfThoughtContent>
				<ChainOfThoughtStep
					icon={SearchIcon}
					label="Searching the web"
					description="Searching public profiles for Hayden Bleasel"
					status="complete"
					collapsible
				>
					<ChainOfThoughtSearchResults>
						{PROFILE_SOURCES.map((website) => (
							<ChainOfThoughtSearchResult key={website}>
								{toHostname(website)}
							</ChainOfThoughtSearchResult>
						))}
					</ChainOfThoughtSearchResults>
				</ChainOfThoughtStep>

				<ChainOfThoughtStep
					icon={ImageIcon}
					label="Selecting profile image"
					description="Found a likely profile image from the source set"
					status="complete"
					collapsible
				>
					<ChainOfThoughtImage caption="Public profile image selected from matched sources.">
						<Image
							alt="Profile image result"
							className="h-40 w-40 rounded-md border border-border object-cover"
							height={160}
							src="/avatar-human/anthony-chen.png"
							width={160}
						/>
					</ChainOfThoughtImage>
				</ChainOfThoughtStep>

				<ChainOfThoughtStep
					icon={AiSparkleIcon}
					label="Synthesizing summary"
					description="Synthesizing a short profile summary from validated signals"
					status="complete"
				/>

				<ChainOfThoughtStep
					icon={SearchIcon}
					label="Checking work updates"
					description="Checked recent work updates across matched sources"
					status="complete"
					collapsible
				>
					<ChainOfThoughtSearchResults>
						{RECENT_WORK_SOURCES.map((website) => (
							<ChainOfThoughtSearchResult key={website}>
								{toHostname(website)}
							</ChainOfThoughtSearchResult>
						))}
					</ChainOfThoughtSearchResults>
				</ChainOfThoughtStep>

				<ChainOfThoughtStep
					icon={CheckCircleIcon}
					label="Done"
					description="Reasoning trace complete"
					status="complete"
				/>
			</ChainOfThoughtContent>
		</ChainOfThought>
	);
}

export function ChainOfThoughtDemoStatusVariants() {
	return (
		<ChainOfThought defaultOpen className="w-full max-w-xl">
			<ChainOfThoughtHeader>Status progression</ChainOfThoughtHeader>
			<ChainOfThoughtContent>
				<ChainOfThoughtStep label="Collecting sources" description="Collected source pages" status="complete" />
				<ChainOfThoughtStep label="Cross-checking dates" description="Cross-checking publication dates" status="active" />
				<ChainOfThoughtStep label="Drafting answer" description="Drafting the final answer" status="pending" />
			</ChainOfThoughtContent>
		</ChainOfThought>
	);
}

export function ChainOfThoughtDemoSearchResults() {
	return (
		<ChainOfThought defaultOpen className="w-full max-w-xl">
			<ChainOfThoughtHeader>Search result chips</ChainOfThoughtHeader>
			<ChainOfThoughtContent>
				<ChainOfThoughtStep
					icon={SearchIcon}
					label="Evaluating sources"
					description="Ranking sources by recency and authority"
					status="active"
					collapsible
				>
					<ChainOfThoughtSearchResults>
						{[
							"https://www.atlassian.com",
							"https://www.vercel.com",
							"https://www.github.com",
							"https://www.npmjs.com",
						].map((website) => (
							<ChainOfThoughtSearchResult key={website}>
								{toHostname(website)}
							</ChainOfThoughtSearchResult>
						))}
					</ChainOfThoughtSearchResults>
				</ChainOfThoughtStep>
			</ChainOfThoughtContent>
		</ChainOfThought>
	);
}

export function ChainOfThoughtDemoImageStep() {
	return (
		<ChainOfThought defaultOpen className="w-full max-w-xl">
			<ChainOfThoughtHeader>Image evidence</ChainOfThoughtHeader>
			<ChainOfThoughtContent>
				<ChainOfThoughtStep
					icon={ImageIcon}
					label="Attaching image evidence"
					description="Attached visual evidence for reasoning context"
					status="complete"
					collapsible
				>
					<ChainOfThoughtImage caption="Image context included before summary generation.">
						<Image
							alt="Reasoning evidence image"
							className="h-40 w-40 rounded-md border border-border object-cover"
							height={160}
							src="/avatar-human/priya-hansra.png"
							width={160}
						/>
					</ChainOfThoughtImage>
				</ChainOfThoughtStep>
			</ChainOfThoughtContent>
		</ChainOfThought>
	);
}

export function ChainOfThoughtDemoToolIconTable() {
	return (
		<div className="w-full max-w-4xl rounded-xl border border-border bg-background">
			<div className="border-b border-border px-4 py-3">
				<h3 className="font-medium text-sm text-text">Resolved tool icons and logos</h3>
				<p className="mt-1 text-sm text-text-subtle">
					Native tools, Atlassian/VPK branding, 3P logos, and fallback behavior used by chain-of-thought and tool UIs.
				</p>
			</div>
			<div className="overflow-x-auto">
				<table className="w-full min-w-[720px] text-left text-sm">
					<thead className="bg-surface-raised text-text-subtle">
						<tr>
							<th className="px-4 py-2 font-medium">Type</th>
							<th className="px-4 py-2 font-medium">Resolved icon</th>
							<th className="px-4 py-2 font-medium">Tool / server</th>
							<th className="px-4 py-2 font-medium">Resolved kind</th>
							<th className="px-4 py-2 font-medium">Notes</th>
						</tr>
					</thead>
					<tbody>
						{TOOL_ICON_ROWS.map((row) => {
							const resolved = resolveToolIcon({
								toolName: row.toolName,
								mcpServer: row.mcpServer,
							});

							return (
								<tr key={`${row.category}-${row.toolName}-${row.mcpServer ?? "none"}`} className="border-t border-border align-middle">
									<td className="px-4 py-3 text-text-subtle">{row.category}</td>
									<td className="px-4 py-3">
										<div className="inline-flex size-8 items-center justify-center rounded-md border border-border bg-surface">
											{renderResolvedToolIcon(resolved, { className: "size-4" })}
										</div>
									</td>
									<td className="px-4 py-3">
										<div className="font-mono text-xs text-text">{row.toolName}</div>
										{row.mcpServer ? (
											<div className="mt-1 text-xs text-text-subtle">server: {row.mcpServer}</div>
										) : null}
									</td>
									<td className="px-4 py-3 text-text-subtle">{resolved.kind}</td>
									<td className="px-4 py-3 text-text-subtle">{row.note}</td>
								</tr>
							);
						})}
					</tbody>
				</table>
			</div>
		</div>
	);
}
