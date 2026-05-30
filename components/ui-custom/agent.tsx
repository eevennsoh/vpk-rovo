"use client";

import type { Tool } from "ai";
import type { ComponentProps, ReactNode } from "react";
import { memo, useEffect, useMemo, useState } from "react";
import Image from "next/image";

import AddIcon from "@atlaskit/icon/core/add";
import PageIcon from "@atlaskit/icon/core/page";
import AiModelIcon from "@atlaskit/icon-lab/core/ai-model";

import { Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { InlineEdit } from "@/components/ui/inline-edit";
import { Lozenge } from "@/components/ui/lozenge";
import { Tile } from "@/components/ui/tile";
import { CheckIcon } from "@/components/ui/vpk-icons";
import {
	ModelSelector,
	ModelSelectorContent,
	ModelSelectorGroup,
	ModelSelectorItem,
	ModelSelectorList,
	ModelSelectorName,
	ModelSelectorTrigger,
} from "@/components/ui-custom/model-selector";
import {
	TwgToolBannerBackground,
	TwgToolSourceStack,
	type TwgToolSource,
} from "@/components/ui-custom/twg-tool";
import {
	type RichTextMentionItem,
	type RichTextMentionSources,
	RichTextEditor,
} from "@/components/ui-custom/rich-text-editor";
import { SkillTag } from "@/components/ui-custom/skill-tag";
import type {
	HermesSkillSummary,
	WikiMemoryExplorerResponse,
} from "@/lib/rovo-runtime-types";
import { cn } from "@/lib/utils";

import { CodeBlock } from "./code-block";

const AGENT_AVATAR_HEXAGON_PATH = "M19.01 0.922148C20.24 0.212148 21.76 0.212148 23 0.922148L40 10.6921C41.24 11.4021 42.01 12.7321 42.01 14.1621V33.6721C42.01 35.1021 41.24 36.4221 40 37.1421L23 46.9121C21.77 47.6221 20.25 47.6221 19.01 46.9121L2.01 37.1321C0.77 36.4221 0 35.0921 0 33.6621V14.1621C0 12.7321 0.77 11.4121 2.01 10.6921L19.01 0.922148Z";
const AGENT_AVATAR_SRC = "/avatar-agent/teamwork-agents/blocker-checker.svg";
const DEFAULT_AGENT_PROFILE_COVER_COLOR = "#1868DB";
const AGENT_AVATAR_PROFILE_COVER_COLORS: Record<string, string> = {
	"dev-agents": "#82B536",
	"product-agents": "#BF63F3",
	"service-agents": "#FFC716",
	"strategy-agents": "#FF9F1A",
	"teamwork-agents": DEFAULT_AGENT_PROFILE_COVER_COLOR,
};

const AGENT_KNOWLEDGE_SOURCES = [
	{ id: "twg", label: "Teamwork Graph", provider: "twg" },
	{ id: "jira", label: "Jira", provider: "jira" },
	{ id: "google-drive", label: "Google Drive", provider: "google-drive" },
	{ id: "confluence", label: "Confluence", provider: "confluence" },
	{ id: "teams", label: "Microsoft Teams", provider: "teams" },
	{ id: "salesforce", label: "Salesforce", provider: "salesforce" },
] as const satisfies readonly TwgToolSource[];

const MENTION_SOURCE_LIMIT = 24;

interface AgentSkillMentionResponse {
	skills?: HermesSkillSummary[];
}

function toMentionId(category: RichTextMentionItem["category"], id: string): string {
	return `${category}:${id.trim().replace(/\s+/g, "-")}`;
}

function mapSkillsToMentionItems(
	skills: readonly HermesSkillSummary[] | undefined,
): RichTextMentionItem[] {
	return (skills ?? [])
		.filter((skill) => !skill.disabled)
		.slice(0, MENTION_SOURCE_LIMIT)
		.map((skill) => ({
			category: "skill",
			id: toMentionId("skill", skill.id || `${skill.category}/${skill.name}`),
			label: skill.title || skill.name,
			description: skill.description ?? `${skill.category} skill`,
		}));
}

function mapMemoryToMentionItems(
	explorer: WikiMemoryExplorerResponse | null,
): RichTextMentionItem[] {
	return (explorer?.nodes ?? [])
		.slice(0, MENTION_SOURCE_LIMIT)
		.map((node) => ({
			category: "memory",
			id: toMentionId("memory", node.id),
			label: node.title || node.label || node.id,
			description: node.summary || node.kind,
		}));
}

function getAgentProfileCoverBackgroundColor(avatarSrc: string | undefined): string {
	const category = avatarSrc?.match(/\/avatar-agent\/([^/]+)\//u)?.[1];
	return (category ? AGENT_AVATAR_PROFILE_COVER_COLORS[category] : undefined) ?? DEFAULT_AGENT_PROFILE_COVER_COLOR;
}

export type AgentConfigTextFieldName =
	| "name"
	| "description"
	| "instructions"
	| "contextDescription"
	| "trigger"
	| "guardrail";

export type AgentConfigListFieldName = "tools" | "conversationStarters";

export interface AgentConfigFormValue {
	name?: string;
	description?: string;
	summary?: string;
	instructions?: string;
	contextDescription?: string;
	trigger?: string;
	triggers?: readonly string[];
	skills?: readonly string[];
	guardrail?: string;
	tools?: readonly string[];
	subagents?: readonly string[];
	knowledge?: readonly string[];
	conversationStarters?: readonly string[];
	agentId?: string;
	action?: string;
}

export type AgentProps = ComponentProps<"div">;

export const Agent = memo(({ className, ...props }: Readonly<AgentProps>) => (
	<div
		className={cn("not-prose w-full overflow-hidden bg-surface text-text", className)}
		{...props}
	/>
));

export type AgentHeaderProps = ComponentProps<"div"> & {
	name: string;
	avatarSrc?: string;
	model?: string;
	primaryActionLabel?: string;
	secondaryActionLabel?: string;
	showActions?: boolean;
	actions?: ReactNode;
	badge?: ReactNode;
};

export const AgentHeader = memo(
	({
		className,
		avatarSrc = AGENT_AVATAR_SRC,
		model,
		name,
		primaryActionLabel = "Activate",
		secondaryActionLabel = "Test",
		showActions = true,
		actions,
		badge,
		...props
	}: Readonly<AgentHeaderProps>) => (
		<div
			className={cn(
				"flex h-14 w-full items-center justify-between gap-4 border-b border-border bg-surface px-6",
				className
			)}
			{...props}
		>
			<div className="flex min-w-0 items-center gap-2">
				<Avatar label="Agent" shape="hexagon" size="sm">
					<AvatarImage alt="" src={avatarSrc} />
				</Avatar>
				<span className="truncate text-sm font-semibold leading-5 text-text">{name}</span>
				{model ? (
					<Lozenge>
						{model}
					</Lozenge>
				) : null}
				{badge}
			</div>
			{showActions ? (
				<div className="flex shrink-0 items-center gap-2">
					{actions ?? (
						<>
							<Button size="default" variant="outline">
								{secondaryActionLabel}
							</Button>
							<Button size="default" variant="default">
								{primaryActionLabel}
							</Button>
						</>
					)}
				</div>
			) : null}
		</div>
	)
);

export type AgentContentProps = ComponentProps<"div">;

export const AgentContent = memo(
	({ className, ...props }: Readonly<AgentContentProps>) => (
		<div className={cn("space-y-4 p-6", className)} {...props} />
	)
);

export type AgentInstructionsProps = ComponentProps<"div"> & {
	children: string;
};

export const AgentInstructions = memo(
	({ className, children, ...props }: Readonly<AgentInstructionsProps>) => (
		<div className={cn("space-y-2", className)} {...props}>
			<span className="font-medium text-text-subtle text-sm">
				Instructions
			</span>
			<div className="rounded-md bg-surface-sunken p-3 text-text-subtle text-sm">
				<p>{children}</p>
			</div>
		</div>
	)
);

export type AgentToolsProps = ComponentProps<typeof Accordion>;

export const AgentTools = memo(({ className, ...props }: Readonly<AgentToolsProps>) => (
	<div className={cn("space-y-2", className)}>
		<span className="font-medium text-text-subtle text-sm">Tools</span>
		<Accordion className="rounded-md border border-border" {...props} />
	</div>
));

export type AgentToolProps = ComponentProps<typeof AccordionItem> & {
	tool: Tool;
};

export const AgentTool = memo(
	({ className, tool, value, ...props }: Readonly<AgentToolProps>) => {
		const schema =
			"jsonSchema" in tool && tool.jsonSchema
				? tool.jsonSchema
				: tool.inputSchema;

		return (
			<AccordionItem
				className={cn("border-b border-border last:border-b-0", className)}
				value={value}
				{...props}
			>
				<AccordionTrigger className="px-3 py-2 text-sm text-text-subtle transition-colors hover:text-text hover:no-underline">
					{tool.description ?? "No description"}
				</AccordionTrigger>
				<AccordionContent className="px-3 pb-3">
					<div className="rounded-md bg-surface-sunken">
						<CodeBlock code={JSON.stringify(schema, null, 2)} language="json" />
					</div>
				</AccordionContent>
			</AccordionItem>
		);
	}
);

export type AgentOutputProps = ComponentProps<"div"> & {
	schema: string;
};

export const AgentOutput = memo(
	({ className, schema, ...props }: Readonly<AgentOutputProps>) => (
		<div className={cn("space-y-2", className)} {...props}>
			<span className="font-medium text-text-subtle text-sm">
				Output Schema
			</span>
			<div className="rounded-md bg-surface-sunken">
				<CodeBlock code={schema} language="typescript" />
			</div>
		</div>
	)
);

interface AgentActionTileProps {
	agentFieldName?: string;
	label: string;
	onClick?: () => void;
	screenAssistantTargetId?: string;
}

function AgentIconTile({ children, label }: Readonly<{ children: ReactNode; label: string }>) {
	return (
		<Tile
			className="shrink-0 text-icon-subtle"
			label={label}
			size="medium"
			variant="neutral"
		>
			{children}
		</Tile>
	);
}

function AgentActionTile({
	agentFieldName,
	label,
	onClick,
	screenAssistantTargetId,
}: Readonly<AgentActionTileProps>) {
	return (
		<button
			type="button"
			data-agent-field={agentFieldName}
			data-screen-assistant-target={screenAssistantTargetId}
			className="flex min-h-11 w-full items-center gap-3 rounded-xl border border-border bg-surface p-1.5 text-left text-sm font-medium text-text transition-colors hover:bg-surface-raised-hovered focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
			onClick={onClick}
		>
			<AgentIconTile label="Add">
				<Icon render={<AddIcon label="" size="small" />} aria-hidden />
			</AgentIconTile>
			<span className="min-w-0 truncate">{label}</span>
		</button>
	);
}

function AgentSectionLabel({ children }: Readonly<{ children: ReactNode }>) {
	return (
		<div className="flex h-8 items-center text-xs font-semibold leading-4 text-text-subtlest">
			{children}
		</div>
	);
}

function getNonEmptyConfigItems(items: readonly string[] | undefined): readonly string[] {
	return (items ?? [])
		.map((item) => item.trim())
		.filter(Boolean);
}

function getAgentTriggerItems(config: AgentConfigFormValue): readonly string[] {
	const triggers = getNonEmptyConfigItems(config.triggers);
	if (triggers.length > 0) {
		return triggers;
	}

	const trigger = config.trigger?.trim();
	return trigger ? [trigger] : [];
}

function AgentReferenceChip({ label }: Readonly<{ label: string }>) {
	return (
		<span className="inline-flex h-7 max-w-full items-center gap-1 rounded-md border border-border bg-surface px-1.5 text-sm leading-5 text-link">
			<Icon
				render={<PageIcon label="" size="small" />}
				aria-hidden
				className="shrink-0 text-icon-selected"
			/>
			<span className="min-w-0 truncate">{label}</span>
		</span>
	);
}

function AgentSkillChip({ label }: Readonly<{ label: string }>) {
	return (
		<SkillTag
			color="teamwork"
			icon={<CheckIcon size="small" />}
			className="h-7 max-w-full text-sm leading-5"
		>
			{label}
		</SkillTag>
	);
}

interface AgentFilledSummaryRowProps {
	label: string;
	items: readonly string[];
	variant?: "reference" | "skill";
	agentFieldName?: string;
	screenAssistantTargetId?: string;
}

function AgentFilledSummaryRow({
	agentFieldName,
	items,
	label,
	screenAssistantTargetId,
	variant = "reference",
}: Readonly<AgentFilledSummaryRowProps>) {
	if (items.length === 0) {
		return null;
	}

	return (
		<div
			className="grid gap-x-5 gap-y-1 sm:grid-cols-[8rem_minmax(0,1fr)]"
			data-agent-field={agentFieldName}
			data-screen-assistant-target={screenAssistantTargetId}
		>
			<AgentSectionLabel>{label}</AgentSectionLabel>
			<div className="flex min-h-8 min-w-0 flex-wrap items-center gap-1.5">
				{items.map((item, index) => (
					variant === "skill" ? (
						<AgentSkillChip key={`${label}-${item}-${index}`} label={item} />
					) : (
						<AgentReferenceChip key={`${label}-${item}-${index}`} label={item} />
					)
				))}
			</div>
		</div>
	);
}

interface AgentFilledConfigSummaryProps {
	config: AgentConfigFormValue;
	screenAssistantTargetPrefix?: string;
}

function AgentFilledConfigSummary({
	config,
	screenAssistantTargetPrefix,
}: Readonly<AgentFilledConfigSummaryProps>) {
	const triggerItems = getAgentTriggerItems(config);
	const skillItems = getNonEmptyConfigItems(config.skills);
	const toolItems = getNonEmptyConfigItems(config.tools);
	const subagentItems = getNonEmptyConfigItems(config.subagents);
	const knowledgeItems = getNonEmptyConfigItems(config.knowledge);
	const starterItems = getNonEmptyConfigItems(config.conversationStarters);

	return (
		<div className="space-y-2">
			<AgentFilledSummaryRow
				agentFieldName="trigger"
				items={triggerItems}
				label="Triggers"
				screenAssistantTargetId={screenAssistantTargetPrefix ? `${screenAssistantTargetPrefix}:trigger` : undefined}
			/>
			<AgentFilledSummaryRow
				items={skillItems}
				label="Skills"
				variant="skill"
				screenAssistantTargetId={screenAssistantTargetPrefix ? `${screenAssistantTargetPrefix}:skills` : undefined}
			/>
			<AgentFilledSummaryRow
				agentFieldName="tools"
				items={toolItems}
				label="Tools"
				screenAssistantTargetId={screenAssistantTargetPrefix ? `${screenAssistantTargetPrefix}:tools` : undefined}
			/>
			<AgentFilledSummaryRow
				items={subagentItems}
				label="Subagents"
				screenAssistantTargetId={screenAssistantTargetPrefix ? `${screenAssistantTargetPrefix}:subagents` : undefined}
			/>
			<AgentFilledSummaryRow
				items={knowledgeItems}
				label="Knowledge"
				screenAssistantTargetId={screenAssistantTargetPrefix ? `${screenAssistantTargetPrefix}:knowledge` : undefined}
			/>
			<AgentFilledSummaryRow
				agentFieldName="conversationStarters"
				items={starterItems}
				label="Conversation starters"
				screenAssistantTargetId={screenAssistantTargetPrefix ? `${screenAssistantTargetPrefix}:conversation-starters` : undefined}
			/>
		</div>
	);
}

function hasFilledAgentConfig(config: AgentConfigFormValue): boolean {
	return (
		getAgentTriggerItems(config).length > 0 ||
		getNonEmptyConfigItems(config.skills).length > 0 ||
		getNonEmptyConfigItems(config.tools).length > 0 ||
		getNonEmptyConfigItems(config.subagents).length > 0 ||
		getNonEmptyConfigItems(config.knowledge).length > 0 ||
		getNonEmptyConfigItems(config.conversationStarters).length > 0
	);
}

function AgentProfileCover({ avatarSrc = AGENT_AVATAR_SRC }: Readonly<{ avatarSrc?: string }>) {
	const coverBackgroundColor = getAgentProfileCoverBackgroundColor(avatarSrc);

	return (
		<div className="relative overflow-hidden rounded-t-xl bg-surface text-text">
			<div className="relative h-12 overflow-hidden" style={{ backgroundColor: coverBackgroundColor }}>
				<Image
					alt=""
					aria-hidden
					className="absolute top-1/2 left-[88%] h-48 w-[168px] -translate-x-1/2 -translate-y-1/2 opacity-95"
					height={192}
					src={avatarSrc}
					width={168}
				/>
			</div>
			<div aria-hidden className="h-6" />
			<div className="absolute top-6 left-4 size-12">
				<Image
					alt="Agent avatar"
					className="h-12 w-[42px]"
					height={48}
					src={avatarSrc}
					width={42}
				/>
				<svg
					aria-hidden="true"
					className="pointer-events-none absolute top-0 left-0 h-12 w-[42px] overflow-visible"
					focusable="false"
					viewBox="0 0 43 48"
				>
					<path
						className="stroke-surface"
						d={AGENT_AVATAR_HEXAGON_PATH}
						fill="none"
						strokeWidth={2}
						vectorEffect="non-scaling-stroke"
					/>
				</svg>
			</div>
		</div>
	);
}

function AgentKnowledgePanel() {
	return (
		<section className="space-y-0">
			<AgentSectionLabel>Knowledge</AgentSectionLabel>
			<div className="rounded-xl border border-border bg-bg-input p-1.5">
				<div className="relative flex h-12 min-w-0 items-center justify-between gap-3 overflow-hidden rounded-lg bg-surface-sunken pl-1.5 pr-2">
					<TwgToolBannerBackground />
					<div className="relative z-10 flex min-w-0 items-center gap-2">
						<Tile
							className="bg-surface text-icon-discovery"
							hasBorder
							label="Teamwork Graph"
							size="medium"
							variant="transparent"
						>
							<svg
								className="size-4 text-icon"
								width={16}
								height={16}
								viewBox="0 0 16 16"
								fill="none"
								xmlns="http://www.w3.org/2000/svg"
								aria-hidden
							>
								<path d="M11 11L5 5" stroke="currentColor" strokeWidth={1.5} />
								<circle cx="3.5" cy="3.5" r="1.75" stroke="#1868DB" strokeWidth={1.5} />
								<circle cx="3.5" cy="12.5" r="1.75" stroke="#BF63F3" strokeWidth={1.5} />
								<circle cx="12.5" cy="12.5" r="1.75" stroke="#FCA700" strokeWidth={1.5} />
								<circle cx="12.5" cy="3.5" r="1.75" stroke="#6A9A23" strokeWidth={1.5} />
							</svg>
						</Tile>
						<span className="truncate text-sm font-medium text-text-subtle">Teamwork Graph</span>
					</div>
					<TwgToolSourceStack
						className="relative z-10 max-w-[42%]"
						iconSize="md"
						sources={AGENT_KNOWLEDGE_SOURCES}
					/>
				</div>
				<div className="flex items-center justify-between rounded-lg p-1.5 transition-colors hover:bg-bg-neutral-subtle-hovered">
					<div className="flex min-w-0 items-center gap-3">
						<AgentIconTile label="Memory">
							<Icon render={<AiModelIcon label="" />} aria-hidden />
						</AgentIconTile>
						<span className="truncate text-sm font-medium text-text-subtle">Memory</span>
					</div>
					<Button variant="ghost">
						Manage
					</Button>
				</div>
				<div className="px-1.5 py-1.5">
					<div className="h-px bg-border-disabled" />
				</div>
				<button
					type="button"
					className="flex w-full items-center gap-3 rounded-lg p-1.5 text-left text-sm font-medium text-text-subtle transition-colors hover:bg-bg-neutral-subtle-hovered focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
				>
					<AgentIconTile label="Add knowledge">
						<Icon render={<AddIcon label="" size="small" />} aria-hidden />
					</AgentIconTile>
					<span>Add knowledge</span>
				</button>
			</div>
		</section>
	);
}

const REASONING_MODE_SECTIONS = [
	{
		title: "Quick answer",
		options: [{ value: "quick-auto", label: "Searching and simple Q&A" }],
	},
	{
		title: "Think deeper",
		options: [
			{ value: "deep-auto", label: "Recommended" },
			{ value: "gemini-flash-3", label: "Gemini Flash 3" },
			{ value: "gpt-5.4", label: "GPT 5.4" },
			{ value: "sonnet-4.6", label: "Sonnet 4.6" },
			{ value: "opus-4.6", label: "Opus 4.6" },
		],
	},
] as const;

type ReasoningModeValue =
	(typeof REASONING_MODE_SECTIONS)[number]["options"][number]["value"];

function AgentInstructionsModelSelector() {
	const [selected, setSelected] = useState<ReasoningModeValue>("quick-auto");
	const current = REASONING_MODE_SECTIONS
		.flatMap((section) =>
			section.options.map((option) => ({
				...option,
				optionCount: section.options.length,
				section: section.title,
			}))
		)
		.find((option) => option.value === selected);

	return (
		<ModelSelector>
			<ModelSelectorTrigger
				render={<Button className="shrink-0 text-text-subtle" variant="ghost" />}
			>
				{current
					? current.optionCount === 1
						? current.section
						: `${current.section}: ${current.label}`
					: "Select mode"}
			</ModelSelectorTrigger>
			<ModelSelectorContent className="w-[360px] max-w-[calc(100vw-2rem)]">
				<ModelSelectorList>
					{REASONING_MODE_SECTIONS.map((section) => (
						<ModelSelectorGroup key={section.title} heading={section.title}>
							{section.options.map((option) => (
								<ModelSelectorItem
									key={option.value}
									data-checked={selected === option.value}
									value={option.value}
									onSelect={() => setSelected(option.value)}
								>
									<ModelSelectorName>{option.label}</ModelSelectorName>
									{selected === option.value ? (
										<CheckIcon size="small" className="ml-auto text-text-selected" />
									) : null}
								</ModelSelectorItem>
							))}
						</ModelSelectorGroup>
					))}
				</ModelSelectorList>
			</ModelSelectorContent>
		</ModelSelector>
	);
}

function AgentInstructionsComposer({
	instructions,
	onInstructionsChange,
	screenAssistantTargetId,
}: Readonly<{
	instructions?: string;
	onInstructionsChange?: (value: string) => void;
	screenAssistantTargetId?: string;
}>) {
	const [skills, setSkills] = useState<RichTextMentionItem[]>([]);
	const [memory, setMemory] = useState<RichTextMentionItem[]>([]);
	const mentionSources = useMemo<RichTextMentionSources>(() => ({
		skill: skills,
		memory,
	}), [memory, skills]);

	useEffect(() => {
		const abortController = new AbortController();

		async function loadMentionSources(): Promise<void> {
			try {
				const [skillsResponse, memoryResponse] = await Promise.all([
					fetch("/api/skills", { signal: abortController.signal }),
					fetch("/api/wiki/memory-explorer", { signal: abortController.signal }),
				]);

				if (skillsResponse.ok) {
					const payload = await skillsResponse.json() as AgentSkillMentionResponse;
					setSkills(mapSkillsToMentionItems(payload.skills));
				}

				if (memoryResponse.ok) {
					const payload = await memoryResponse.json() as WikiMemoryExplorerResponse;
					setMemory(mapMemoryToMentionItems(payload));
				}
			} catch (error) {
				if (error instanceof DOMException && error.name === "AbortError") {
					return;
				}
			}
		}

		void loadMentionSources();

		return () => abortController.abort();
	}, []);

	return (
		<section
			className="space-y-0"
			data-agent-field="instructions"
			data-screen-assistant-target={screenAssistantTargetId}
		>
			<AgentSectionLabel>Instructions</AgentSectionLabel>
			<RichTextEditor
				aria-label="Agent instructions"
				className="space-y-2"
				contentClassName="pt-2"
				editorClassName="agent-instructions-tiptap-editor"
				placeholder="Describe the agent’s role and what it should do. @mention, or / for skills"
				showBubbleMenu={false}
				toolbarEndSlot={<AgentInstructionsModelSelector />}
				value={instructions}
				mentionSources={mentionSources}
				onMarkdownChange={onInstructionsChange}
			/>
		</section>
	);
}

export interface AgentConfigFieldsProps extends ComponentProps<"div"> {
	config: AgentConfigFormValue;
	avatarSrc?: string;
	idPrefix: string;
	onTextChange?: (field: AgentConfigTextFieldName, value: string) => void;
	onListItemChange?: (field: AgentConfigListFieldName, index: number, value: string) => void;
	onRemoveListItem?: (field: AgentConfigListFieldName, index: number) => void;
	onAppendListItem?: (field: AgentConfigListFieldName) => void;
	screenAssistantTargetPrefix?: string;
}

export const AgentConfigFields = memo(
	({
		className,
		config,
		avatarSrc,
		idPrefix,
		onListItemChange,
		onAppendListItem,
		onRemoveListItem,
		onTextChange,
		screenAssistantTargetPrefix,
		...props
	}: Readonly<AgentConfigFieldsProps>) => {
		void onListItemChange;
		void onRemoveListItem;
		const isFilledConfig = hasFilledAgentConfig(config);

		return (
			<div
				className={cn("space-y-6", className)}
				data-agent-config-id={idPrefix}
				data-screen-assistant-target={screenAssistantTargetPrefix}
				{...props}
			>
				<section
					className="space-y-4 [&+*]:!mt-4"
					data-screen-assistant-target={screenAssistantTargetPrefix ? `${screenAssistantTargetPrefix}:profile` : undefined}
				>
					<AgentProfileCover avatarSrc={avatarSrc} />
					<div
						className="space-y-1"
						data-agent-field="name"
						data-screen-assistant-target={screenAssistantTargetPrefix ? `${screenAssistantTargetPrefix}:name` : undefined}
					>
						<InlineEdit
							value={config.name ?? ""}
							placeholder="Untitled agent"
							editButtonLabel="Edit agent name"
							readViewClassName="h-auto py-1 text-2xl leading-7 font-semibold"
							inputProps={{ className: "h-auto py-1 text-2xl leading-7 font-semibold md:text-2xl" }}
							onConfirm={(value) => onTextChange?.("name", value)}
						/>
						<div
							data-agent-field="description"
							data-screen-assistant-target={screenAssistantTargetPrefix ? `${screenAssistantTargetPrefix}:description` : undefined}
						>
							<InlineEdit
								value={config.description ?? config.summary ?? ""}
								placeholder="Add a description"
								editButtonLabel="Edit agent description"
								multiline
								textareaProps={{ rows: 1, className: "min-h-10 bg-bg-neutral-subtle focus-visible:ring-0 focus-visible:ring-offset-0 data-[variant=default]:border-transparent" }}
								onConfirm={(value) => onTextChange?.("description", value)}
							/>
						</div>
					</div>
				</section>

				{isFilledConfig ? (
					<>
						<AgentFilledConfigSummary
							config={config}
							screenAssistantTargetPrefix={screenAssistantTargetPrefix}
						/>
						<div className="h-px bg-border" />
					</>
				) : (
					<>
						<div className="grid grid-cols-2 gap-2">
							<AgentActionTile
								agentFieldName="trigger"
								label="Add triggers"
								screenAssistantTargetId={screenAssistantTargetPrefix ? `${screenAssistantTargetPrefix}:trigger` : undefined}
							/>
							<AgentActionTile
								label="Add skills"
								screenAssistantTargetId={screenAssistantTargetPrefix ? `${screenAssistantTargetPrefix}:skills` : undefined}
							/>
							<AgentActionTile
								agentFieldName="tools"
								label="Add tools"
								onClick={() => onAppendListItem?.("tools")}
								screenAssistantTargetId={screenAssistantTargetPrefix ? `${screenAssistantTargetPrefix}:tools` : undefined}
							/>
							<AgentActionTile
								agentFieldName="conversationStarters"
								label="Add conversation starters"
								onClick={() => onAppendListItem?.("conversationStarters")}
								screenAssistantTargetId={screenAssistantTargetPrefix ? `${screenAssistantTargetPrefix}:conversation-starters` : undefined}
							/>
						</div>

						<AgentKnowledgePanel />
					</>
				)}
				<AgentInstructionsComposer
					instructions={config.instructions}
					onInstructionsChange={(value) => onTextChange?.("instructions", value)}
					screenAssistantTargetId={screenAssistantTargetPrefix ? `${screenAssistantTargetPrefix}:instructions` : undefined}
				/>
			</div>
		);
	}
);

Agent.displayName = "Agent";
AgentHeader.displayName = "AgentHeader";
AgentContent.displayName = "AgentContent";
AgentInstructions.displayName = "AgentInstructions";
AgentTools.displayName = "AgentTools";
AgentTool.displayName = "AgentTool";
AgentOutput.displayName = "AgentOutput";
AgentConfigFields.displayName = "AgentConfigFields";
