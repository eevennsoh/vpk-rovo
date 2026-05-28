"use client";

import type { ReactNode } from "react";
import { ReactRenderer } from "@tiptap/react";
import type { Editor } from "@tiptap/core";
import type {
	SuggestionKeyDownProps,
	SuggestionProps,
} from "@tiptap/suggestion";

import AppsIcon from "@atlaskit/icon/core/apps";
import AutomationIcon from "@atlaskit/icon/core/automation";
import BookWithBookmarkIcon from "@atlaskit/icon/core/book-with-bookmark";
import BranchIcon from "@atlaskit/icon/core/branch";
import LinkIcon from "@atlaskit/icon/core/link";
import ToolsIcon from "@atlaskit/icon/core/tools";
import AlignTextCenterIcon from "@atlaskit/icon/core/align-text-center";
import AlignTextLeftIcon from "@atlaskit/icon/core/align-text-left";
import AlignTextRightIcon from "@atlaskit/icon/core/align-text-right";
import ListBulletedIcon from "@atlaskit/icon/core/list-bulleted";
import ListNumberedIcon from "@atlaskit/icon/core/list-numbered";
import QuotationMarkIcon from "@atlaskit/icon/core/quotation-mark";
import TextIcon from "@atlaskit/icon/core/text";
import TextBoldIcon from "@atlaskit/icon/core/text-bold";
import TextItalicIcon from "@atlaskit/icon/core/text-italic";
import TextStrikethroughIcon from "@atlaskit/icon/core/text-strikethrough";
import TextUnderlineIcon from "@atlaskit/icon/core/text-underline";
import TextHeadingOneIcon from "@atlaskit/icon-lab/core/text-heading-one";
import TextHeadingThreeIcon from "@atlaskit/icon-lab/core/text-heading-three";
import TextHeadingTwoIcon from "@atlaskit/icon-lab/core/text-heading-two";

import { cn } from "@/lib/utils";

import type {
	RichTextMentionCategory,
	RichTextMentionItem,
	RichTextMentionSources,
} from "./types";

export interface RichTextCommandItem {
	id: string;
	label: string;
	description?: string;
	shortcut?: string;
	icon: ReactNode;
	run: (editor: Editor) => void;
}

interface RichTextSuggestionMenuItem {
	id: string;
	label: string;
	description?: string;
	shortcut?: string;
	icon: ReactNode;
	disabled?: boolean;
}

interface RichTextSuggestionMenuProps {
	emptyLabel: string;
	items: readonly RichTextSuggestionMenuItem[];
	onBack?: () => void;
	onSelect: (item: RichTextSuggestionMenuItem) => void;
	selectedIndex: number;
	title: string;
}

interface SuggestionPopupState {
	component: ReactRenderer<unknown, RichTextSuggestionMenuProps> | null;
	element: HTMLDivElement | null;
}

const CATEGORY_LABELS: Record<RichTextMentionCategory, string> = {
	skill: "Skills",
	link: "Links",
	memory: "Memory",
	trigger: "Triggers",
	tool: "Tools",
};

const CATEGORY_ORDER: readonly RichTextMentionCategory[] = [
	"skill",
	"link",
	"memory",
	"trigger",
	"tool",
];

const STATIC_MENTION_ITEMS: RichTextMentionSources = {
	link: [
		{
			category: "link",
			id: "link:agent-definition",
			label: "Agent definition",
			description: "Reference the canonical generated agent profile.",
		},
		{
			category: "link",
			id: "link:studio-thread",
			label: "Studio thread",
			description: "Reference the active Studio conversation.",
		},
		{
			category: "link",
			id: "link:work-item",
			label: "Work item",
			description: "Reference a Jira or project work item.",
		},
	],
	trigger: [
		{
			category: "trigger",
			id: "trigger:manual",
			label: "Manual run",
			description: "Run only when a user starts the agent.",
		},
		{
			category: "trigger",
			id: "trigger:ticket-enters-column",
			label: "Ticket enters column",
			description: "Run when a work item moves into a configured column.",
		},
		{
			category: "trigger",
			id: "trigger:schedule",
			label: "Schedule",
			description: "Run on a reviewed recurring schedule.",
		},
	],
	tool: [
		{
			category: "tool",
			id: "tool:web-search",
			label: "Web search",
			description: "Search the web for current public information.",
		},
		{
			category: "tool",
			id: "tool:teamwork-graph",
			label: "Teamwork Graph",
			description: "Find project, people, and work-item context.",
		},
		{
			category: "tool",
			id: "tool:jira",
			label: "Jira work items",
			description: "Read and update relevant Jira work items.",
		},
		{
			category: "tool",
			id: "tool:google-drive",
			label: "Google Drive",
			description: "Reference Drive and Docs content.",
		},
		{
			category: "tool",
			id: "tool:create-image",
			label: "Create image",
			description: "Generate visual assets when the agent task needs them.",
		},
	],
};

export const SLASH_COMMANDS: readonly RichTextCommandItem[] = [
	{
		id: "normal-text",
		label: "Normal text",
		shortcut: "Text",
		icon: <TextIcon label="" size="small" />,
		run: (editor) => editor.chain().focus().setParagraph().run(),
	},
	{
		id: "heading-1",
		label: "Heading 1",
		shortcut: "#",
		icon: <TextHeadingOneIcon label="" size="small" />,
		run: (editor) => editor.chain().focus().toggleHeading({ level: 1 }).run(),
	},
	{
		id: "heading-2",
		label: "Heading 2",
		shortcut: "##",
		icon: <TextHeadingTwoIcon label="" size="small" />,
		run: (editor) => editor.chain().focus().toggleHeading({ level: 2 }).run(),
	},
	{
		id: "heading-3",
		label: "Heading 3",
		shortcut: "###",
		icon: <TextHeadingThreeIcon label="" size="small" />,
		run: (editor) => editor.chain().focus().toggleHeading({ level: 3 }).run(),
	},
	{
		id: "quote",
		label: "Quote",
		icon: <QuotationMarkIcon label="" size="small" />,
		run: (editor) => editor.chain().focus().toggleBlockquote().run(),
	},
	{
		id: "bold",
		label: "Bold",
		icon: <TextBoldIcon label="" size="small" />,
		run: (editor) => editor.chain().focus().toggleBold().run(),
	},
	{
		id: "italic",
		label: "Italic",
		icon: <TextItalicIcon label="" size="small" />,
		run: (editor) => editor.chain().focus().toggleItalic().run(),
	},
	{
		id: "underline",
		label: "Underline",
		icon: <TextUnderlineIcon label="" size="small" />,
		run: (editor) => editor.chain().focus().toggleUnderline().run(),
	},
	{
		id: "strikethrough",
		label: "Strikethrough",
		icon: <TextStrikethroughIcon label="" size="small" />,
		run: (editor) => editor.chain().focus().toggleStrike().run(),
	},
	{
		id: "bulleted-list",
		label: "Bulleted list",
		shortcut: "-",
		icon: <ListBulletedIcon label="" size="small" />,
		run: (editor) => editor.chain().focus().toggleBulletList().run(),
	},
	{
		id: "numbered-list",
		label: "Numbered list",
		shortcut: "1.",
		icon: <ListNumberedIcon label="" size="small" />,
		run: (editor) => editor.chain().focus().toggleOrderedList().run(),
	},
	{
		id: "align-left",
		label: "Align left",
		icon: <AlignTextLeftIcon label="" size="small" />,
		run: (editor) => editor.chain().focus().setTextAlign("left").run(),
	},
	{
		id: "align-center",
		label: "Align center",
		icon: <AlignTextCenterIcon label="" size="small" />,
		run: (editor) => editor.chain().focus().setTextAlign("center").run(),
	},
	{
		id: "align-right",
		label: "Align right",
		icon: <AlignTextRightIcon label="" size="small" />,
		run: (editor) => editor.chain().focus().setTextAlign("right").run(),
	},
	{
		id: "link",
		label: "Link",
		icon: <LinkIcon label="" size="small" />,
		run: (editor) => {
			const url = window.prompt("Enter URL");
			if (url) {
				editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
			}
		},
	},
];

function getCategoryIcon(category: RichTextMentionCategory): ReactNode {
	switch (category) {
		case "skill":
			return <AppsIcon label="" size="small" />;
		case "link":
			return <LinkIcon label="" size="small" />;
		case "memory":
			return <BookWithBookmarkIcon label="" size="small" />;
		case "trigger":
			return <AutomationIcon label="" size="small" />;
		case "tool":
			return <ToolsIcon label="" size="small" />;
	}
}

function RichTextSuggestionMenu({
	emptyLabel,
	items,
	onBack,
	onSelect,
	selectedIndex,
	title,
}: Readonly<RichTextSuggestionMenuProps>) {
	return (
		<div className="rich-text-command-menu" role="listbox" aria-label={title}>
			<div className="rich-text-command-menu-title">{title}</div>
			{onBack ? (
				<button
					type="button"
					className="rich-text-command-menu-item rich-text-command-menu-back"
					onMouseDown={(event) => event.preventDefault()}
					onClick={onBack}
				>
					<BranchIcon label="" size="small" />
					<span>Back</span>
				</button>
			) : null}
			<div className="rich-text-command-menu-list">
				{items.length > 0 ? (
					items.map((item, index) => (
						<button
							type="button"
							key={item.id}
							role="option"
							aria-selected={index === selectedIndex}
							className={cn(
								"rich-text-command-menu-item",
								index === selectedIndex && "rich-text-command-menu-item-selected",
							)}
							disabled={item.disabled}
							onMouseDown={(event) => event.preventDefault()}
							onClick={() => onSelect(item)}
						>
							<span className="rich-text-command-menu-icon">{item.icon}</span>
							<span className="rich-text-command-menu-copy">
								<span className="rich-text-command-menu-label">{item.label}</span>
								{item.description ? (
									<span className="rich-text-command-menu-description">
										{item.description}
									</span>
								) : null}
							</span>
							{item.shortcut ? (
								<span className="rich-text-command-menu-shortcut">
									{item.shortcut}
								</span>
							) : null}
						</button>
					))
				) : (
					<div className="rich-text-command-menu-empty">{emptyLabel}</div>
				)}
			</div>
		</div>
	);
}

function filterItems<T extends { label: string; description?: string }>(
	items: readonly T[],
	query: string,
): readonly T[] {
	const normalizedQuery = query.trim().toLowerCase();
	if (!normalizedQuery) {
		return items;
	}

	return items.filter((item) => {
		const haystack = `${item.label} ${item.description ?? ""}`.toLowerCase();
		return haystack.includes(normalizedQuery);
	});
}

function createPopup(): HTMLDivElement {
	const element = document.createElement("div");
	element.className = "rich-text-command-menu-popover";
	document.body.appendChild(element);
	return element;
}

function positionPopup(
	element: HTMLDivElement | null,
	clientRect?: (() => DOMRect | null) | null,
): void {
	if (!element || !clientRect) {
		return;
	}

	const rect = clientRect();
	if (!rect) {
		return;
	}

	element.style.left = `${rect.left}px`;
	element.style.top = `${rect.bottom + 6}px`;
}

export function createSlashSuggestionRenderer() {
	const popupState: SuggestionPopupState = { component: null, element: null };
	let selectedIndex = 0;
	let currentProps: SuggestionProps<RichTextCommandItem, RichTextCommandItem> | null = null;

	function getMenuItems(props: SuggestionProps<RichTextCommandItem, RichTextCommandItem>) {
		return props.items.map((item) => ({
			description: item.description,
			icon: item.icon,
			id: item.id,
			label: item.label,
			shortcut: item.shortcut,
		}));
	}

	function selectItem(index: number): boolean {
		if (!currentProps) {
			return false;
		}

		const item = currentProps.items[index];
		if (!item) {
			return false;
		}

		currentProps.command(item);
		return true;
	}

	function update(props: SuggestionProps<RichTextCommandItem, RichTextCommandItem>) {
		currentProps = props;
		selectedIndex = Math.min(selectedIndex, Math.max(props.items.length - 1, 0));
		positionPopup(popupState.element, props.clientRect);
		popupState.component?.updateProps({
			emptyLabel: "No commands found",
			items: getMenuItems(props),
			onSelect: (item: RichTextSuggestionMenuItem) => {
				const nextIndex = props.items.findIndex((candidate) => candidate.id === item.id);
				selectItem(Math.max(nextIndex, 0));
			},
			selectedIndex,
			title: "Basic blocks",
		});
	}

	return {
		onStart: (props: SuggestionProps<RichTextCommandItem, RichTextCommandItem>) => {
			popupState.element = createPopup();
			popupState.component = new ReactRenderer(RichTextSuggestionMenu, {
				editor: props.editor,
				props: {
					emptyLabel: "No commands found",
					items: getMenuItems(props),
					onSelect: (item: RichTextSuggestionMenuItem) => {
						const nextIndex = props.items.findIndex((candidate) => candidate.id === item.id);
						selectItem(Math.max(nextIndex, 0));
					},
					selectedIndex,
					title: "Basic blocks",
				},
			});
			popupState.element.appendChild(popupState.component.element);
			update(props);
		},
		onUpdate: update,
		onKeyDown: ({ event }: SuggestionKeyDownProps) => {
			if (!currentProps) {
				return false;
			}
			if (event.key === "ArrowDown") {
				selectedIndex = currentProps.items.length > 0
					? (selectedIndex + 1) % currentProps.items.length
					: 0;
				update(currentProps);
				return true;
			}
			if (event.key === "ArrowUp") {
				selectedIndex = currentProps.items.length > 0
					? (selectedIndex + currentProps.items.length - 1) % currentProps.items.length
					: 0;
				update(currentProps);
				return true;
			}
			if (event.key === "Enter") {
				return selectItem(selectedIndex);
			}
			if (event.key === "Escape") {
				return false;
			}
			return false;
		},
		onExit: () => {
			popupState.component?.destroy();
			popupState.element?.remove();
			popupState.component = null;
			popupState.element = null;
			currentProps = null;
			selectedIndex = 0;
		},
	};
}

function getMergedMentionSources(
	sources: RichTextMentionSources | undefined,
): RichTextMentionSources {
	return {
		...STATIC_MENTION_ITEMS,
		...sources,
		link: sources?.link ?? STATIC_MENTION_ITEMS.link,
		trigger: sources?.trigger ?? STATIC_MENTION_ITEMS.trigger,
		tool: sources?.tool ?? STATIC_MENTION_ITEMS.tool,
	};
}

function getCategoryItems(
	sources: RichTextMentionSources | undefined,
	category: RichTextMentionCategory,
): readonly RichTextMentionItem[] {
	return getMergedMentionSources(sources)[category] ?? [];
}

export function createMentionSuggestionRenderer(
	getMentionSources?: () => RichTextMentionSources | undefined,
) {
	const popupState: SuggestionPopupState = { component: null, element: null };
	let selectedIndex = 0;
	let activeCategory: RichTextMentionCategory | null = null;
	let currentProps: SuggestionProps<RichTextMentionItem, RichTextMentionItem> | null = null;

	function getParentItems(query: string): readonly RichTextSuggestionMenuItem[] {
		const sources = getMentionSources?.();
		const items = CATEGORY_ORDER.map((category) => ({
			description: `${getCategoryItems(sources, category).length} available`,
			icon: getCategoryIcon(category),
			id: category,
			label: CATEGORY_LABELS[category],
		}));
		return filterItems(items, query);
	}

	function getChildItems(query: string): readonly RichTextSuggestionMenuItem[] {
		if (!activeCategory) {
			return [];
		}

		return filterItems(
			getCategoryItems(getMentionSources?.(), activeCategory).map((item) => ({
				description: item.description,
				icon: getCategoryIcon(item.category),
				id: item.id,
				label: item.label,
			})),
			query,
		);
	}

	function getVisibleItems(
		props: SuggestionProps<RichTextMentionItem, RichTextMentionItem>,
	): readonly RichTextSuggestionMenuItem[] {
		return activeCategory ? getChildItems(props.query) : getParentItems(props.query);
	}

	function update(props: SuggestionProps<RichTextMentionItem, RichTextMentionItem>) {
		currentProps = props;
		const items = getVisibleItems(props);
		selectedIndex = Math.min(selectedIndex, Math.max(items.length - 1, 0));
		positionPopup(popupState.element, props.clientRect);
		popupState.component?.updateProps({
			emptyLabel: activeCategory ? "No matching items" : "No mention categories found",
			items,
			onBack: activeCategory
				? () => {
						activeCategory = null;
						selectedIndex = 0;
						update(props);
					}
				: undefined,
			onSelect: (item: RichTextSuggestionMenuItem) => selectItem(item),
			selectedIndex,
			title: activeCategory ? CATEGORY_LABELS[activeCategory] : "Add context",
		});
	}

	function selectItem(item: RichTextSuggestionMenuItem | undefined): boolean {
		if (!item || !currentProps) {
			return false;
		}

		if (!activeCategory) {
			activeCategory = item.id as RichTextMentionCategory;
			selectedIndex = 0;
			update(currentProps);
			return true;
		}

		const mention = getCategoryItems(getMentionSources?.(), activeCategory)
			.find((candidate) => candidate.id === item.id);
		if (!mention) {
			return false;
		}

		currentProps.command(mention);
		return true;
	}

	return {
		onStart: (props: SuggestionProps<RichTextMentionItem, RichTextMentionItem>) => {
			popupState.element = createPopup();
			popupState.component = new ReactRenderer(RichTextSuggestionMenu, {
				editor: props.editor,
				props: {
					emptyLabel: "No mention categories found",
					items: getVisibleItems(props),
					onSelect: (item: RichTextSuggestionMenuItem) => selectItem(item),
					selectedIndex,
					title: "Add context",
				},
			});
			popupState.element.appendChild(popupState.component.element);
			update(props);
		},
		onUpdate: update,
		onKeyDown: ({ event }: SuggestionKeyDownProps) => {
			if (!currentProps) {
				return false;
			}
			const items = getVisibleItems(currentProps);
			if (event.key === "ArrowDown") {
				selectedIndex = items.length > 0 ? (selectedIndex + 1) % items.length : 0;
				update(currentProps);
				return true;
			}
			if (event.key === "ArrowUp") {
				selectedIndex = items.length > 0
					? (selectedIndex + items.length - 1) % items.length
					: 0;
				update(currentProps);
				return true;
			}
			if (event.key === "Enter") {
				return selectItem(items[selectedIndex]);
			}
			if (event.key === "Backspace" && activeCategory) {
				activeCategory = null;
				selectedIndex = 0;
				update(currentProps);
				return true;
			}
			if (event.key === "Escape") {
				return false;
			}
			return false;
		},
		onExit: () => {
			popupState.component?.destroy();
			popupState.element?.remove();
			popupState.component = null;
			popupState.element = null;
			currentProps = null;
			selectedIndex = 0;
			activeCategory = null;
		},
	};
}
