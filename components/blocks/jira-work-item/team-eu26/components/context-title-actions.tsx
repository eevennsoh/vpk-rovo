"use client";

import type { ReactNode } from "react";

import ChevronDownIcon from "@atlaskit/icon/core/chevron-down";
import CopyIcon from "@atlaskit/icon/core/copy";

import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import type { ThirdPartyLogoName } from "@/components/ui/data/logo-third-party-data";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RovoColorIcon, type LogoSize } from "@/components/ui/logo";
import { LogoThirdParty } from "@/components/ui/logo-third-party";
import { CodeIcon } from "@/components/ui/vpk-icons";

export type CodingAgentId =
	| "claude-cli"
	| "claude-code"
	| "codex"
	| "rovo-cli"
	| "cursor"
	| "vs-code"
	| "github-copilot"
	| "gemini";

type CodingAgent = Readonly<{
	/** Stable id used for React keys. */
	id: CodingAgentId;
	/** Human-readable label shown in the button/menu. */
	label: string;
	/** Compact brand glyph shown in the primary split-button action. */
	buttonLogo: ReactNode;
	/** Brand glyph. Rovo is a 1P mark; the rest render via `LogoThirdParty`. */
	logo: ReactNode;
}>;

function thirdPartyAgentLogo(name: ThirdPartyLogoName, size: LogoSize = "small"): ReactNode {
	// No dark-mode class here: LogoThirdParty inverts near-black glyphs itself,
	// and CSS filters on nested elements compose — a second invert would return
	// the glyph to near-black.
	return <LogoThirdParty name={name} size={size} borderless />;
}

/**
 * Coding editors and agents available from the primary local-action split
 * button. Most map to a registered `LogoThirdParty` brand
 * (Codex/Cursor/Copilot ship with the upstream package or a local `public/3p`
 * fallback); Rovo uses the 1P `RovoColorIcon`.
 */
const CODING_AGENTS: readonly CodingAgent[] = [
	{ id: "claude-code", label: "Claude", buttonLogo: thirdPartyAgentLogo("claude", "xxsmall"), logo: thirdPartyAgentLogo("claude") },
	{ id: "claude-cli", label: "Claude CLI", buttonLogo: thirdPartyAgentLogo("claude", "xxsmall"), logo: thirdPartyAgentLogo("claude") },
	{ id: "codex", label: "Codex", buttonLogo: thirdPartyAgentLogo("openai-codex", "xxsmall"), logo: thirdPartyAgentLogo("openai-codex") },
	{ id: "cursor", label: "Cursor", buttonLogo: thirdPartyAgentLogo("cursor", "xxsmall"), logo: thirdPartyAgentLogo("cursor") },
	{ id: "gemini", label: "Gemini", buttonLogo: thirdPartyAgentLogo("google-gemini", "xxsmall"), logo: thirdPartyAgentLogo("google-gemini") },
	{ id: "github-copilot", label: "GitHub Copilot", buttonLogo: thirdPartyAgentLogo("github-copilot", "xxsmall"), logo: thirdPartyAgentLogo("github-copilot") },
	{ id: "rovo-cli", label: "Rovo CLI", buttonLogo: <RovoColorIcon size="small" />, logo: <RovoColorIcon size="small" /> },
	{ id: "vs-code", label: "VS Code", buttonLogo: thirdPartyAgentLogo("vs-code", "xxsmall"), logo: thirdPartyAgentLogo("vs-code") },
];

/**
 * Resource-row split button for opening the work item with the primary coding
 * agent locally or choosing another agent directly. Lock, watch, and share live
 * in the modal header.
 */
export function ContextTitleActions({
	onSelectedAgentIdChange,
	selectedAgentId,
}: Readonly<{
	onSelectedAgentIdChange: (agentId: CodingAgentId) => void;
	selectedAgentId: CodingAgentId | null;
}>) {
	const primaryCodingAgent = selectedAgentId
		? CODING_AGENTS.find((agent) => agent.id === selectedAgentId)
		: undefined;
	const codingAgents = primaryCodingAgent
		? CODING_AGENTS.filter((agent) => agent.id !== primaryCodingAgent.id)
		: CODING_AGENTS;

	return (
		<ButtonGroup className="shrink-0" variant="split">
			<Button
				aria-label={primaryCodingAgent ? `Open in ${primaryCodingAgent.label}` : "Open in"}
				className="has-data-[icon=inline-start]:pl-2 @max-[36rem]/resource-row:px-2 [&_[aria-hidden][data-agent-logo=rovo]_img]:size-3! [&_[aria-hidden][data-agent-logo=rovo]_svg]:size-3! [&_[aria-hidden][data-agent-logo=third-party]_img]:size-4! [&_[aria-hidden][data-agent-logo=third-party]_svg]:size-4!"
				size="default"
				variant="outline"
			>
				<span
					aria-hidden
					className="inline-flex size-4 shrink-0 items-center justify-center [&_span]:flex! [&_span]:items-center! [&_span]:justify-center!"
					data-agent-logo={primaryCodingAgent?.id === "rovo-cli" ? "rovo" : primaryCodingAgent ? "third-party" : undefined}
					data-icon={primaryCodingAgent ? "inline-start" : undefined}
				>
					{primaryCodingAgent ? primaryCodingAgent.buttonLogo : <CodeIcon aria-hidden size="small" />}
				</span>
				{/*
				 * Resource-row container query: drop the visible label under 36rem so
				 * the split control keeps logo (+ chevron sibling) when chrome is tight.
				 * Accessible name stays on aria-label.
				 */}
				<span className="@max-[36rem]/resource-row:hidden">
					{primaryCodingAgent ? `Open in ${primaryCodingAgent.label}` : "Open in"}
				</span>
			</Button>
			<DropdownMenu>
				<DropdownMenuTrigger
					render={
						<Button aria-label="More open options" size="icon" variant="outline">
							<ChevronDownIcon label="" size="small" />
						</Button>
					}
				/>
				<DropdownMenuContent
					align="end"
					className="max-h-[var(--available-height)] p-0"
					positionerClassName="z-[502]"
				>
					<div className="p-1">
						<DropdownMenuGroup>
							{codingAgents.map((agent) => (
								<DropdownMenuItem
									elemBefore={<span aria-hidden className="inline-flex items-center justify-center leading-none">{agent.logo}</span>}
									key={agent.id}
									onSelect={() => onSelectedAgentIdChange(agent.id)}
								>
									{agent.label}
								</DropdownMenuItem>
							))}
						</DropdownMenuGroup>
					</div>
					<div className="sticky bottom-0 bg-surface-overlay px-1 pb-1">
						<DropdownMenuSeparator className="mt-0" />
						<DropdownMenuItem
							elemBefore={<CopyIcon label="" size="small" />}
						>
							Copy prompt
						</DropdownMenuItem>
					</div>
				</DropdownMenuContent>
			</DropdownMenu>
		</ButtonGroup>
	);
}

export function ContextTitleActionsSubmenu({
	onSelectedAgentIdChange,
}: Readonly<{
	onSelectedAgentIdChange: (agentId: CodingAgentId) => void;
}>) {
	return (
		<DropdownMenuSub>
			<DropdownMenuSubTrigger className="gap-3">
				<span aria-hidden className="inline-flex size-6 shrink-0 items-center justify-center text-icon-subtle [&_svg]:size-4">
					<CodeIcon aria-hidden size="small" />
				</span>
				<span>Open in</span>
			</DropdownMenuSubTrigger>
			<DropdownMenuSubContent
				className="max-h-[var(--available-height)]"
				positionerClassName="z-[503]"
			>
				<DropdownMenuGroup>
					{CODING_AGENTS.map((agent) => (
						<DropdownMenuItem
							elemBefore={<span aria-hidden className="inline-flex items-center justify-center leading-none">{agent.logo}</span>}
							key={agent.id}
							onSelect={() => onSelectedAgentIdChange(agent.id)}
						>
							{agent.label}
						</DropdownMenuItem>
					))}
				</DropdownMenuGroup>
				<DropdownMenuSeparator />
				<DropdownMenuItem
					elemBefore={<CopyIcon label="" size="small" />}
				>
					Copy prompt
				</DropdownMenuItem>
			</DropdownMenuSubContent>
		</DropdownMenuSub>
	);
}
