"use client";

import type { Tool } from "ai";
import type { ComponentProps, ReactNode } from "react";
import { memo, useState } from "react";
import Image from "next/image";

import AddIcon from "@atlaskit/icon/core/add";
import AiModelIcon from "@atlaskit/icon-lab/core/ai-model";

import { Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
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
import { RichTextEditor } from "@/components/ui-custom/rich-text-editor";
import { cn } from "@/lib/utils";

import { CodeBlock } from "./code-block";

const AGENT_AVATAR_HEXAGON_PATH = "M19.01 0.922148C20.24 0.212148 21.76 0.212148 23 0.922148L40 10.6921C41.24 11.4021 42.01 12.7321 42.01 14.1621V33.6721C42.01 35.1021 41.24 36.4221 40 37.1421L23 46.9121C21.77 47.6221 20.25 47.6221 19.01 46.9121L2.01 37.1321C0.77 36.4221 0 35.0921 0 33.6621V14.1621C0 12.7321 0.77 11.4121 2.01 10.6921L19.01 0.922148Z";
const AGENT_AVATAR_SRC = "/avatar-agent/teamwork-agents/blocker-checker.svg";

const AGENT_KNOWLEDGE_SOURCES = [
	{ id: "twg", label: "Teamwork Graph", provider: "twg" },
	{ id: "jira", label: "Jira", provider: "jira" },
	{ id: "google-drive", label: "Google Drive", provider: "google-drive" },
	{ id: "confluence", label: "Confluence", provider: "confluence" },
	{ id: "teams", label: "Microsoft Teams", provider: "teams" },
	{ id: "salesforce", label: "Salesforce", provider: "salesforce" },
] as const satisfies readonly TwgToolSource[];

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
	guardrail?: string;
	tools?: readonly string[];
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
				<Image
					alt="Agent"
					className="h-6 w-[21px] shrink-0"
					height={48}
					src={AGENT_AVATAR_SRC}
					width={42}
				/>
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

function AgentProfileCover() {
	return (
		<div className="relative overflow-hidden rounded-t-xl bg-surface text-text">
			<div className="relative h-12 overflow-hidden bg-[#1868DB]">
				<Image
					alt=""
					aria-hidden
					className="absolute top-1/2 left-[88%] h-48 w-[168px] -translate-x-1/2 -translate-y-1/2 opacity-95"
					height={192}
					src={AGENT_AVATAR_SRC}
					width={168}
				/>
			</div>
			<div aria-hidden className="h-6" />
			<div className="absolute top-6 left-4 size-12">
				<Image
					alt="Agent avatar"
					className="h-12 w-[42px]"
					height={48}
					src={AGENT_AVATAR_SRC}
					width={42}
				/>
				<svg
					aria-hidden="true"
					className="pointer-events-none absolute top-0 left-0 h-12 w-[42px] overflow-visible"
					focusable="false"
					viewBox="0 0 43 48"
				>
					<path
						d={AGENT_AVATAR_HEXAGON_PATH}
						fill="none"
						stroke="white"
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
							isInset={false}
							label="Teamwork Graph"
							size="medium"
							variant="transparent"
						>
							<div className="size-4">
								<Image
									src="/icons/twg.svg"
									alt=""
									aria-hidden
									className="size-full"
									width={16}
									height={16}
								/>
							</div>
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
				onPlainTextChange={onInstructionsChange}
			/>
		</section>
	);
}

export interface AgentConfigFieldsProps extends ComponentProps<"div"> {
	config: AgentConfigFormValue;
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
					<AgentProfileCover />
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
