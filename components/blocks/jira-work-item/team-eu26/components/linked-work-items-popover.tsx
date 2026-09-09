"use client";

import { useState, type ReactElement } from "react";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	CONTEXT_POPOVER_ROW_CLASS,
	CONTEXT_POPOVER_SECTION_HEADING_CLASS,
	CONTEXT_POPOVER_TABS_LIST_CLASS,
	PopoverOptionPicker,
	PopoverSubmitField,
	SuggestionPanel,
	WorkItemTypeIcon,
} from "@/components/blocks/jira-work-item/team-eu26/components/context-popover-parts";
import { useJiraWorkItemActions } from "@/components/blocks/jira-work-item/team-eu26/context-jira-work-item";
import {
	createLinkedItem,
	linkExistingItem,
	LINK_RECENT,
	LINK_RELATIONSHIPS,
	LINK_SEARCH_SCOPES,
	LINK_SIMILAR,
	LINK_TYPES,
} from "@/components/blocks/jira-work-item/data/context-fixtures";
import type {
	ContextLinkedItem,
	LinkedWorkItemType,
	RelationshipOption,
} from "@/components/blocks/jira-work-item/data/session-state";

/**
 * Relationship starts unset so the picker reads as the "Define relationship"
 * prompt rather than silently pre-committing to one. Links added before a choice
 * fall back to the neutral relationship instead of blocking the add.
 */
const DEFAULT_RELATIONSHIP: RelationshipOption = "relates to";

function LinkedResultItem({ item, onSelect }: Readonly<{ item: ContextLinkedItem; onSelect: () => void }>) {
	return (
		<button type="button" onClick={onSelect} className={CONTEXT_POPOVER_ROW_CLASS}>
			<WorkItemTypeIcon type={item.type} />
			<span className="min-w-0 flex-1 truncate">
				{item.key} {item.summary}
			</span>
		</button>
	);
}

interface LinkedWorkItemsPopoverProps {
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
	tooltip?: string;
	trigger: ReactElement;
}

export function LinkedWorkItemsPopover({
	open: controlledOpen,
	onOpenChange,
	tooltip,
	trigger,
}: Readonly<LinkedWorkItemsPopoverProps>) {
	const actions = useJiraWorkItemActions();
	const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
	const open = controlledOpen ?? uncontrolledOpen;
	const setOpen = onOpenChange ?? setUncontrolledOpen;
	const [relationship, setRelationship] = useState<RelationshipOption | null>(null);
	const [type, setType] = useState<LinkedWorkItemType>("Task");
	const [scope, setScope] = useState<string>("Local");
	const [name, setName] = useState("");
	const [query, setQuery] = useState("");

	const add = (item: ContextLinkedItem) => {
		actions.addContextResource("link", item);
		setName("");
		setQuery("");
		setOpen(false);
	};

	const createFromName = () => {
		if (!name.trim()) return;
		add(createLinkedItem(relationship ?? DEFAULT_RELATIONSHIP, type, name));
	};

	const trimmedQuery = query.trim().toLowerCase();
	const matchesQuery = (item: Readonly<ContextLinkedItem>) =>
		`${item.key} ${item.summary}`.toLowerCase().includes(trimmedQuery);
	const recent = trimmedQuery ? LINK_RECENT.filter(matchesQuery) : LINK_RECENT;
	const similar = trimmedQuery ? LINK_SIMILAR.filter(matchesQuery) : LINK_SIMILAR;

	const relationshipPicker = (
		<PopoverOptionPicker
			ariaLabel="Relationship"
			onChange={setRelationship}
			options={LINK_RELATIONSHIPS}
			placeholder="Define relationship"
			value={relationship}
		/>
	);

	return (
		<Popover open={open} onOpenChange={setOpen}>
			{tooltip ? (
				<Tooltip>
					<TooltipTrigger render={<span className="inline-flex" />}>
						<PopoverTrigger render={trigger} />
					</TooltipTrigger>
					<TooltipContent positionerClassName="z-[502]">{tooltip}</TooltipContent>
				</Tooltip>
			) : (
				<PopoverTrigger render={trigger} />
			)}
			<PopoverContent align="start" className="w-[24rem] p-0" positionerClassName="z-[502]">
				<Tabs defaultValue="create" className="gap-0">
					<TabsList className={CONTEXT_POPOVER_TABS_LIST_CLASS}>
						<TabsTrigger value="create">Create new</TabsTrigger>
						<TabsTrigger value="existing">Add existing</TabsTrigger>
					</TabsList>

					<TabsContent value="create" className="flex flex-col gap-2.5 p-2.5">
						{relationshipPicker}
						<PopoverSubmitField
							ariaLabel="Work item name"
							leading={
								<PopoverOptionPicker
									ariaLabel="Work item type"
									leading={<WorkItemTypeIcon type={type} />}
									onChange={setType}
									options={LINK_TYPES}
									value={type}
									variant="inline"
								/>
							}
							onChange={setName}
							onSubmit={createFromName}
							placeholder="Name this work item"
							submitLabel="Create linked work item"
							value={name}
						/>
					</TabsContent>

					<TabsContent value="existing" className="flex max-h-[24rem] flex-col gap-2.5 overflow-y-auto p-2.5">
						{relationshipPicker}
						<PopoverSubmitField
							ariaLabel="Search work items or paste a link"
							leading={
								<PopoverOptionPicker
									ariaLabel="Search scope"
									onChange={setScope}
									options={LINK_SEARCH_SCOPES}
									value={scope}
									variant="inline"
								/>
							}
							onChange={setQuery}
							onSubmit={() => {
								const [first] = [...recent, ...similar];
								if (first) add(linkExistingItem(first, relationship ?? DEFAULT_RELATIONSHIP));
							}}
							placeholder="Search work items or paste a link"
							submitLabel="Link first matching work item"
							value={query}
						/>

						{recent.length > 0 ? (
							<section className="flex flex-col gap-0.5">
								<h3 className={CONTEXT_POPOVER_SECTION_HEADING_CLASS}>{trimmedQuery ? "Results" : "Recent issues"}</h3>
								{recent.map((item) => (
									<LinkedResultItem
										key={item.id}
										item={item}
										onSelect={() => add(linkExistingItem(item, relationship ?? DEFAULT_RELATIONSHIP))}
									/>
								))}
							</section>
						) : null}

						{similar.length > 0 ? (
							<SuggestionPanel title={`${similar.length} similar work ${similar.length === 1 ? "item" : "items"}`}>
								{similar.map((item) => (
									<LinkedResultItem
										key={item.id}
										item={item}
										onSelect={() => add(linkExistingItem(item, relationship ?? DEFAULT_RELATIONSHIP))}
									/>
								))}
							</SuggestionPanel>
						) : null}

						{recent.length === 0 && similar.length === 0 ? (
							<p className="px-2 py-2 text-sm text-text-subtlest">No matching work items.</p>
						) : null}
					</TabsContent>
				</Tabs>
			</PopoverContent>
		</Popover>
	);
}
