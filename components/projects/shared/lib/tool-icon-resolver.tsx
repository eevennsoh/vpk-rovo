import type { ReactNode } from "react";
import type { NewCoreIconProps } from "@atlaskit/icon/base-new";

import { Icon } from "@/components/ui/icon";
import { AtlassianLogo, type AtlassianLogoName } from "@/components/ui/logo";
import { cn } from "@/lib/utils";
import QuestionCircleIcon from "@atlaskit/icon/core/question-circle";
import RoadmapIcon from "@atlaskit/icon/core/roadmap";
import TaskToDoIcon from "@atlaskit/icon/core/task-to-do";
import AiAgentIcon from "@atlaskit/icon/core/ai-agent";
import SearchIcon from "@atlaskit/icon/core/search";
import FolderOpenIcon from "@atlaskit/icon/core/folder-open";
import FileIcon from "@atlaskit/icon/core/file";
import ClipboardIcon from "@atlaskit/icon/core/clipboard";
import ChangesIcon from "@atlaskit/icon/core/changes";
import AngleBracketsIcon from "@atlaskit/icon/core/angle-brackets";
import DeleteIcon from "@atlaskit/icon/core/delete";
import ShieldIcon from "@atlaskit/icon/core/shield";
import GlobeIcon from "@atlaskit/icon/core/globe";
import SkillIcon from "@atlaskit/icon-lab/core/skill";
import DiagramSymbolFrontendIcon from "@atlaskit/icon-lab/core/diagram-symbol-frontend";
import TerminalIcon from "@atlaskit/icon-lab/core/terminal";
import AiComputeIcon from "@atlaskit/icon-lab/core/ai-compute";
import WrenchIcon from "@atlaskit/icon-lab/core/wrench";
import TeamworkGraphIcon from "@atlaskit/icon-lab/core/teamwork-graph";
import Image from "next/image";

export type { AtlassianLogoName };

export type ResolvedToolIconKind =
	| "vpk-icon"
	| "vpk-logo"
	| "third-party-icon"
	| "generic-icon";

export interface ResolvedToolIcon {
	kind: ResolvedToolIconKind;
	label: string;
	toolName: string | null;
	provider: string | null;
	iconComponent?: (props: NewCoreIconProps) => ReactNode;
	logoPath?: string;
	atlassianLogoName?: AtlassianLogoName;
}

const MCP_WRAPPER_TOOLS = new Set([
	"mcp_invoke_tool",
	"mcp__atlassian__invoke_tool",
	"mcp__atlassian__get_tool_schema",
	"mcp__scout__invoke_tool",
]);

const NATIVE_TOOL_ICONS = new Map<string, (props: NewCoreIconProps) => ReactNode>([
	[normalizeToken("ask_user_questions")!, QuestionCircleIcon],
	[normalizeToken("create_technical_plan")!, RoadmapIcon],
	[normalizeToken("exit_plan_mode")!, ClipboardIcon],
	[normalizeToken("update_todo")!, TaskToDoIcon],
	[normalizeToken("invoke_subagents")!, AiAgentIcon],
	[normalizeToken("get_skill")!, SkillIcon],
	[normalizeToken("open_files")!, FolderOpenIcon],
	[normalizeToken("expand_code_chunks")!, DiagramSymbolFrontendIcon],
	[normalizeToken("grep")!, AngleBracketsIcon],
	[normalizeToken("expand_folder")!, FolderOpenIcon],
	[normalizeToken("create_file")!, FileIcon],
	[normalizeToken("copy_to_clipboard")!, ClipboardIcon],
	[normalizeToken("move_file")!, ChangesIcon],
	[normalizeToken("find_and_replace_code")!, AngleBracketsIcon],
	[normalizeToken("delete_file")!, DeleteIcon],
	[normalizeToken("bash")!, TerminalIcon],
	[normalizeToken("powershell")!, AiComputeIcon],
	[normalizeToken("update_allowed_external_paths")!, ShieldIcon],
	[normalizeToken("parallel")!, ClipboardIcon],
]);

const MCP_SERVER_ICON_OVERRIDES = new Map<string, (props: NewCoreIconProps) => ReactNode>([
	["web-search", SearchIcon],
	["teamwork-graph", TeamworkGraphIcon],
]);

const VPK_PROVIDER_ALIASES: Record<string, AtlassianLogoName> = {
	atlassian: "atlassian",
	jira: "jira",
	confluence: "jira",
	bitbucket: "bitbucket",
	compass: "compass",
	rovo: "rovo",
	rovodev: "rovo-dev",
	"rovo-dev": "rovo-dev",
	"teamwork-graph": "atlassian",
	"atlassian-tenant": "atlassian",
	"atlassian-project": "projects",
	"atlassian-goal": "goals",
	"atlassian-team": "teams",
	teams: "teams",
	goals: "goals",
	projects: "projects",
	talent: "talent",
	"forge-knowledge": "atlassian",
	"ads-mcp": "atlassian",
	
	
	
	s360: "atlassian",
	"remote-bitbucket-search": "bitbucket",
};

const THIRD_PARTY_PROVIDER_ALIASES: Record<string, string> = {
	github: "github",
	figma: "figma",
	notion: "notion",
	slack: "slack",
	airtable: "airtable",
	monday: "monday",
	box: "box",
	gitlab: "gitlab",
	miro: "miro",
	clickup: "clickup",
	canva: "canva",
	workday: "workday",
	zendesk: "zendesk",
	hubspot: "hubspot",
	pagerduty: "pagerduty",
	todoist: "todoist",
	"google-drive": "google-drive",
	"google-calendar": "google-calendar",
	gcp: "google-cloud-platform",
	gmail: "gmail",
	"chrome-devtools": "google-chrome",
};

const KNOWN_MCP_SERVERS = new Set([
	"atlassian",
	"bitbucket",
	"google-calendar",
	"google-drive",
	"gcp",
	"gmail",
	"atlassian-tenant",
	"atlassian-project",
	"atlassian-goal",
	"atlassian-team",
	"teamwork-graph",
	"s360",
	"slack",
	"compass",
	"talent",
	"remote-bitbucket-search",
	"rovodev",
	"forge-knowledge",
	"ads-mcp",
	"web-search",
	"chrome-devtools",
]);

function normalizeToken(value: string | null | undefined): string | null {
	if (!value) return null;
	const normalized = value.trim().toLowerCase().replace(/[._:\/\s]+/g, "-");
	return normalized || null;
}

function splitCandidates(...values: Array<string | null | undefined>): string[] {
	const tokens = new Set<string>();
	for (const value of values) {
		const normalized = normalizeToken(value);
		if (!normalized) continue;
		tokens.add(normalized);
		for (const part of normalized.split("-")) {
			if (part) tokens.add(part);
		}
	}
	return [...tokens];
}

function resolveVpkProvider(candidates: string[]): AtlassianLogoName | null {
	for (const candidate of candidates) {
		if (candidate in VPK_PROVIDER_ALIASES) {
			return VPK_PROVIDER_ALIASES[candidate]!;
		}
	}
	return null;
}

function resolveThirdPartyProvider(candidates: string[]): string | null {
	for (const candidate of candidates) {
		if (candidate in THIRD_PARTY_PROVIDER_ALIASES) {
			return THIRD_PARTY_PROVIDER_ALIASES[candidate]!;
		}
	}
	return null;
}

function hasKnownMcpServer(candidates: string[]): boolean {
	return candidates.some((candidate) => KNOWN_MCP_SERVERS.has(candidate));
}

function isMcpToolName(toolName: string | null | undefined): boolean {
	return Boolean(toolName && toolName.trim().startsWith("mcp__"));
}

function resolveThirdPartyLogoPath(provider: string): string {
	return `/3p/${provider}/16-borderless.svg`;
}

function renderVpkLogo(
	name: AtlassianLogoName,
	label: string,
	className?: string,
) {
	return (
		<span className={cn("inline-flex items-center justify-center shrink-0 size-4", className)}>
			<AtlassianLogo name={name} label={label} size="xxsmall" />
		</span>
	);
}

export function normalizeToolName(toolName: string | null | undefined): string | null {
	const normalized = normalizeToken(toolName);
	if (!normalized) return null;
	const parts = normalized.split(".");
	return parts[parts.length - 1] ?? normalized;
}

export function getToolDisplayInfo(
	toolName: string | null | undefined,
	input: unknown,
	explicitServer?: string | null | undefined,
): { displayName: string; server: string | null } {
	const safeToolName = toolName?.trim() || "Tool";
	const args = input !== null && typeof input === "object" ? (input as Record<string, unknown>) : null;

	if (MCP_WRAPPER_TOOLS.has(safeToolName)) {
		const nestedName = args && typeof args.tool_name === "string" ? args.tool_name : null;
		let server: string | null = explicitServer?.trim() || null;
		if (!server && args && typeof args.server_name === "string") {
			server = args.server_name;
		}
		if (!server) {
			const match = /^mcp__([^_]+)__/.exec(safeToolName);
			server = match ? match[1] : null;
		}
		return { displayName: nestedName ?? safeToolName, server: normalizeToken(server) };
	}

	const mcpMatch = /^mcp__([^_]+)__(.+)$/.exec(safeToolName);
	if (mcpMatch) {
		return {
			displayName: mcpMatch[2],
			server: normalizeToken(explicitServer?.trim() || mcpMatch[1]),
		};
	}

	return { displayName: safeToolName, server: normalizeToken(explicitServer?.trim() || null) };
}

export function resolveToolIcon(options: {
	toolName?: string | null;
	provider?: string | null;
	title?: string | null;
	input?: unknown;
	mcpServer?: string | null;
}): ResolvedToolIcon {
	const displayInfo = getToolDisplayInfo(
		options.toolName ?? options.title,
		options.input,
		options.mcpServer ?? options.provider,
	);
	const normalizedToolName = normalizeToolName(displayInfo.displayName);
	const providerCandidates = splitCandidates(
		displayInfo.server,
		options.provider,
		options.toolName,
		displayInfo.displayName,
		options.title,
	);
	const toolLabel = options.title ?? displayInfo.displayName ?? options.toolName ?? "Tool";

	const nativeIcon = normalizedToolName ? NATIVE_TOOL_ICONS.get(normalizedToolName) : undefined;
	if (nativeIcon) {
		return {
			kind: "vpk-icon",
			label: toolLabel,
			toolName: normalizedToolName,
			provider: displayInfo.server,
			iconComponent: nativeIcon,
		};
	}

	const thirdPartyProvider = resolveThirdPartyProvider(providerCandidates);
	if (thirdPartyProvider) {
		return {
			kind: "third-party-icon",
			label: toolLabel,
			toolName: normalizedToolName,
			provider: displayInfo.server ?? thirdPartyProvider,
			logoPath: resolveThirdPartyLogoPath(thirdPartyProvider),
		};
	}

	const serverIconOverride = displayInfo.server ? MCP_SERVER_ICON_OVERRIDES.get(displayInfo.server) : undefined;
	if (serverIconOverride) {
		return {
			kind: "vpk-icon",
			label: toolLabel,
			toolName: normalizedToolName,
			provider: displayInfo.server,
			iconComponent: serverIconOverride,
		};
	}

	const vpkProvider = resolveVpkProvider(providerCandidates);
	if (vpkProvider) {
		return {
			kind: "vpk-logo",
			label: toolLabel,
			toolName: normalizedToolName,
			provider: displayInfo.server,
			atlassianLogoName: vpkProvider,
		};
	}

	if (hasKnownMcpServer(providerCandidates) || isMcpToolName(options.toolName ?? options.title)) {
		return {
			kind: "generic-icon",
			label: toolLabel,
			toolName: normalizedToolName,
			provider: displayInfo.server,
			iconComponent: GlobeIcon,
		};
	}

	return {
		kind: "generic-icon",
		label: toolLabel,
		toolName: normalizedToolName,
		provider: displayInfo.server,
		iconComponent: WrenchIcon,
	};
}

export function renderResolvedToolIcon(
	resolved: ResolvedToolIcon,
	options?: {
		className?: string;
		label?: string;
		size?: "small" | "medium";
	}
): ReactNode {
	const size = options?.size ?? "small";
	const wrapperClassName = cn(
		"inline-flex items-center justify-center shrink-0",
		options?.className,
	);
	const label = options?.label ?? resolved.label;

	if (resolved.kind === "vpk-logo" && resolved.atlassianLogoName) {
		return renderVpkLogo(resolved.atlassianLogoName, label, wrapperClassName);
	}

	if (resolved.kind === "third-party-icon" && resolved.logoPath) {
		const px = size === "medium" ? 16 : 12;
		return (
			<span className={wrapperClassName} role="img" aria-label={label}>
				<Image alt="" aria-hidden height={px} src={resolved.logoPath} width={px} />
			</span>
		);
	}

	const IconComponent = resolved.iconComponent ?? WrenchIcon;
	return (
		<Icon
			className={wrapperClassName}
			label={label}
			render={<IconComponent label="" size={size} spacing="none" />}
		/>
	);
}
