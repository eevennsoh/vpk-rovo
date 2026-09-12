"use client";

import type { ReactNode, RefObject } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Editor } from "@tiptap/react";

import AddIcon from "@atlaskit/icon/core/add";
import AlignTextCenterIcon from "@atlaskit/icon/core/align-text-center";
import AlignTextLeftIcon from "@atlaskit/icon/core/align-text-left";
import AlignTextRightIcon from "@atlaskit/icon/core/align-text-right";
import AngleBracketsIcon from "@atlaskit/icon/core/angle-brackets";
import ChevronDownIcon from "@atlaskit/icon/core/chevron-down";
import DataFlowIcon from "@atlaskit/icon/core/data-flow";
import LinkIcon from "@atlaskit/icon/core/link";
import ListBulletedIcon from "@atlaskit/icon/core/list-bulleted";
import ListChecklistIcon from "@atlaskit/icon/core/list-checklist";
import ListNumberedIcon from "@atlaskit/icon/core/list-numbered";
import MarkdownIcon from "@atlaskit/icon/core/markdown";
import QuotationMarkIcon from "@atlaskit/icon/core/quotation-mark";
import SnippetIcon from "@atlaskit/icon/core/snippet";
import TableIcon from "@atlaskit/icon/core/table";
import TextIcon from "@atlaskit/icon/core/text";
import TextBoldIcon from "@atlaskit/icon/core/text-bold";
import TextItalicIcon from "@atlaskit/icon/core/text-italic";
import TextStrikethroughIcon from "@atlaskit/icon/core/text-strikethrough";
import TextUnderlineIcon from "@atlaskit/icon/core/text-underline";
import DividerElementIcon from "@atlaskit/icon-lab/core/divider-element";
import TextHeadingFiveIcon from "@atlaskit/icon-lab/core/text-heading-five";
import TextHeadingFourIcon from "@atlaskit/icon-lab/core/text-heading-four";
import TextHeadingOneIcon from "@atlaskit/icon-lab/core/text-heading-one";
import TextHeadingSixIcon from "@atlaskit/icon-lab/core/text-heading-six";
import TextHeadingThreeIcon from "@atlaskit/icon-lab/core/text-heading-three";
import TextHeadingTwoIcon from "@atlaskit/icon-lab/core/text-heading-two";

import { useClickOutside } from "@/components/hooks/use-click-outside";
import { useToolbarOverflow } from "@/components/blocks/editor-toolbar/hooks/use-toolbar-overflow";
import { Button } from "@/components/ui/button";
import { IconTile } from "@/components/ui/icon-tile";
import { Separator } from "@/components/ui/separator";
import { Toggle } from "@/components/ui/toggle";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { MarkdownFormatKind } from "@/components/ui-custom/rich-text-editor/markdown-format";
import { RICH_TEXT_REFERENCE_CATEGORY_OPTIONS } from "@/components/ui-custom/rich-text-editor/reference-categories";
import type { RichTextReferenceCategory } from "@/components/ui-custom/rich-text-editor/types";
import { TextNormalIcon } from "@/components/ui/vpk-icons";
import { cn } from "@/lib/utils";

type DropdownType =
	| "textStyle"
	| "formatting"
	| "list"
	| "align"
	| "insert"
	| null;
type TextStyleType =
	| "normal"
	| "h1"
	| "h2"
	| "h3"
	| "h4"
	| "h5"
	| "h6"
	| "quote";
type Alignment = "left" | "center" | "right";

const TOOLBAR_SPLIT_TOGGLE_GROUP_CLASS_NAME = "*:data-[slot=toggle-group-item]:w-6! *:data-[slot=toggle-group-item]:min-w-6! *:data-[slot=toggle-group-item]:px-0!";

// Number of separator-bounded control groups that can fold into the "+" insert
// dropdown when space is tight: 0 text style, 1 inline formatting, 2 lists,
// 3 alignment + link, 4 code block + rule + table. The "+" insert group is the
// pinned anchor and is intentionally not counted here.
const FOLDABLE_GROUP_COUNT = 5;

const TEXT_STYLE_TO_MARKDOWN: Record<TextStyleType, MarkdownFormatKind> = {
	normal: "normal",
	h1: "h1",
	h2: "h2",
	h3: "h3",
	h4: "h4",
	h5: "h5",
	h6: "h6",
	quote: "quote",
};

// The "+" button inserts a reference token at the caret. Each option maps to a
// mention category whose `id` prefix drives the chip styling (see
// `data-mention-category` rules in rich-text-editor.css) and reuses the same
// category icons as the "@"/"/" suggestion menus.
type InsertReferenceCategory = RichTextReferenceCategory;

export type EditorToolbarInsertReferenceCategory = InsertReferenceCategory;
export type EditorToolbarViewMode = "rendered" | "markdown" | "data-flow";

export interface EditorToolbarProps {
	editor: Editor;
	className?: string;
	controlsClassName?: string;
	leadingSlot?: ReactNode;
	endSlot?: ReactNode;
	isMarkdownMode?: boolean;
	mode?: EditorToolbarViewMode;
	controlsOverflow?: "responsive" | "fixed";
	/** Hide document-formatting groups for minimal composer schemas. */
	showFormattingControls?: boolean;
	showDataFlowMode?: boolean;
	onToggleMarkdownMode?: () => void;
	onModeChange?: (mode: EditorToolbarViewMode) => void;
	onMarkdownFormat?: (kind: MarkdownFormatKind) => void;
	onInsertReferenceOption?: (category: EditorToolbarInsertReferenceCategory, label: string) => boolean | void;
}

export interface EditorToolbarModeTabsProps {
	mode: EditorToolbarViewMode;
	showDataFlowMode?: boolean;
	onModeChange: (mode: EditorToolbarViewMode) => void;
}

export function EditorToolbarModeTabs({
	mode,
	showDataFlowMode = false,
	onModeChange,
}: Readonly<EditorToolbarModeTabsProps>) {
	function handleValueChange(value: readonly string[]): void {
		const next = value[0];
		if (
			next !== "rendered" &&
			next !== "markdown" &&
			next !== "data-flow"
		) {
			return;
		}

		if (next === "data-flow" && !showDataFlowMode) {
			return;
		}

		onModeChange(next);
	}

	// 6px padding (p-1.5) overrides joined outline group `*:data-slot:px-3`.
	// Idle icons use text-icon-subtle; pressed uses toggleVariants' icon-selected.
	const modeItemClassName = "p-1.5! text-icon-subtle";

	return (
		<ToggleGroup
			aria-label="Editor view mode"
			multiple={false}
			size="default"
			value={[mode]}
			variant="outline"
			onValueChange={handleValueChange}
		>
			<ToggleGroupItem aria-label="Rendered text" className={modeItemClassName} value="rendered">
				<TextNormalIcon size="small" />
			</ToggleGroupItem>
			<ToggleGroupItem aria-label="Markdown source" className={modeItemClassName} value="markdown">
				<MarkdownIcon label="" size="small" />
			</ToggleGroupItem>
			{showDataFlowMode ? (
				<ToggleGroupItem aria-label="Data flow diagram" className={modeItemClassName} value="data-flow">
					<DataFlowIcon label="" size="small" />
				</ToggleGroupItem>
			) : null}
		</ToggleGroup>
	);
}

interface DropdownMenuItemProps {
	icon: ReactNode;
	label: string;
	isSelected: boolean;
	onClick: () => void;
	className?: string;
	disabled?: boolean;
}

interface DropdownMenuContainerProps {
	children: ReactNode;
	align?: "left" | "right";
}

function useEditorTransactionRerender(editor: Editor): void {
	const [, setVersion] = useState(0);

	useEffect(() => {
		const update = () => setVersion((version) => version + 1);

		editor.on("transaction", update);
		editor.on("selectionUpdate", update);
		editor.on("update", update);
		// Focus/blur flip `editor.isFocused`, which gates the active-state
		// toggles, so the toolbar must re-render on those too.
		editor.on("focus", update);
		editor.on("blur", update);

		return () => {
			editor.off("transaction", update);
			editor.off("selectionUpdate", update);
			editor.off("update", update);
			editor.off("focus", update);
			editor.off("blur", update);
		};
	}, [editor]);
}

function DropdownMenuItem({
	icon,
	label,
	isSelected,
	onClick,
	className,
	disabled = false,
}: Readonly<DropdownMenuItemProps>) {
	return (
		<button
			type="button"
			aria-label={label}
			aria-pressed={isSelected}
			disabled={disabled}
			className={cn(
				"flex w-full items-center gap-2 rounded px-2 py-2 text-left text-sm text-text-subtle transition-colors hover:bg-bg-neutral-subtle-hovered",
				isSelected && "bg-bg-selected text-text-selected",
				disabled && "cursor-not-allowed opacity-50 hover:bg-transparent",
				className,
			)}
			onClick={onClick}
		>
			<IconTile
				icon={icon}
				label=""
				variant="transparent"
				size="small"
				className="text-icon-subtle"
				aria-hidden
			/>
			<span className="min-w-0 truncate">{label}</span>
		</button>
	);
}

function DropdownMenuContainer({
	children,
	align = "left",
}: Readonly<DropdownMenuContainerProps>) {
	return (
		<div
			className={cn(
				"absolute top-full z-50 mt-1 min-w-52 rounded-xl bg-popover p-1 text-popover-foreground shadow-2xl",
				align === "right" ? "right-0" : "left-0",
			)}
		>
			{children}
		</div>
	);
}

function getCurrentTextStyle(editor: Editor): string {
	if (editor.isActive("heading", { level: 1 })) return "Heading 1";
	if (editor.isActive("heading", { level: 2 })) return "Heading 2";
	if (editor.isActive("heading", { level: 3 })) return "Heading 3";
	if (editor.isActive("heading", { level: 4 })) return "Heading 4";
	if (editor.isActive("heading", { level: 5 })) return "Heading 5";
	if (editor.isActive("heading", { level: 6 })) return "Heading 6";
	if (editor.isActive("blockquote")) return "Quote";
	if (editor.isActive("codeBlock")) return "Code block";
	return "Normal text";
}

function renderCurrentTextStyleIcon(editor: Editor) {
	if (editor.isActive("heading", { level: 1 })) {
		return <TextHeadingOneIcon label="" size="small" />;
	}
	if (editor.isActive("heading", { level: 2 })) {
		return <TextHeadingTwoIcon label="" size="small" />;
	}
	if (editor.isActive("heading", { level: 3 })) {
		return <TextHeadingThreeIcon label="" size="small" />;
	}
	if (editor.isActive("heading", { level: 4 })) {
		return <TextHeadingFourIcon label="" size="small" />;
	}
	if (editor.isActive("heading", { level: 5 })) {
		return <TextHeadingFiveIcon label="" size="small" />;
	}
	if (editor.isActive("heading", { level: 6 })) {
		return <TextHeadingSixIcon label="" size="small" />;
	}
	if (editor.isActive("blockquote")) {
		return <QuotationMarkIcon label="" size="small" />;
	}
	if (editor.isActive("codeBlock")) {
		return <AngleBracketsIcon label="" size="small" />;
	}
	return <TextIcon label="" size="small" />;
}

function setTextStyle(editor: Editor, style: TextStyleType): void {
	switch (style) {
		case "normal":
			editor.chain().focus().setParagraph().run();
			break;
		case "h1":
			editor.chain().focus().toggleHeading({ level: 1 }).run();
			break;
		case "h2":
			editor.chain().focus().toggleHeading({ level: 2 }).run();
			break;
		case "h3":
			editor.chain().focus().toggleHeading({ level: 3 }).run();
			break;
		case "h4":
			editor.chain().focus().toggleHeading({ level: 4 }).run();
			break;
		case "h5":
			editor.chain().focus().toggleHeading({ level: 5 }).run();
			break;
		case "h6":
			editor.chain().focus().toggleHeading({ level: 6 }).run();
			break;
		case "quote":
			editor.chain().focus().toggleBlockquote().run();
			break;
	}
}

function getCurrentAlignment(editor: Editor): Alignment {
	if (editor.isActive({ textAlign: "center" })) return "center";
	if (editor.isActive({ textAlign: "right" })) return "right";
	return "left";
}

function renderCurrentAlignmentIcon(alignment: Alignment) {
	if (alignment === "center") {
		return <AlignTextCenterIcon label="" size="small" />;
	}
	if (alignment === "right") {
		return <AlignTextRightIcon label="" size="small" />;
	}
	return <AlignTextLeftIcon label="" size="small" />;
}

function addLink(editor: Editor): void {
	const url = window.prompt("Enter URL");

	if (url) {
		editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
	}
}

function ToolbarSeparator() {
	return (
		<Separator
			orientation="vertical"
			className="mx-2 h-4 self-center bg-border data-vertical:self-center"
		/>
	);
}

export function EditorToolbar({
	editor,
	className,
	controlsClassName,
	leadingSlot,
	endSlot,
	isMarkdownMode = false,
	mode,
	controlsOverflow = "responsive",
	showFormattingControls = true,
	showDataFlowMode = false,
	onToggleMarkdownMode,
	onModeChange,
	onMarkdownFormat,
	onInsertReferenceOption,
}: Readonly<EditorToolbarProps>) {
	const [openDropdown, setOpenDropdown] = useState<DropdownType>(null);
	const toolbarRef = useRef<HTMLDivElement>(null);
	const outsideRefs = useMemo(
		() => [toolbarRef as RefObject<HTMLElement | null>],
		[],
	);
	const alignment = getCurrentAlignment(editor);
	const currentMode = mode ?? (isMarkdownMode ? "markdown" : "rendered");
	const controlsDisabled = currentMode === "data-flow";
	// Alignment has no raw-Markdown equivalent, so it stays disabled in source
	// mode. Every other control rewrites the textarea selection instead.
	const markdownUnsupported = currentMode === "markdown" || controlsDisabled;
	const foldsControls = controlsOverflow === "responsive";
	// Block/mark active state should only surface once the caret actually lives
	// inside the editor. Tiptap seeds the selection at the document start before
	// the user focuses, so reading `isActive` eagerly would, for content that
	// begins with a list, render the bullet toggle pre-pressed by "default".
	const reflectsActiveState = currentMode === "rendered" && editor.isFocused;
	const formattingValue = [
		...(reflectsActiveState && editor.isActive("bold") ? ["bold"] : []),
		...(openDropdown === "formatting" ? ["formatting"] : []),
	];
	const listValue = [
		...(reflectsActiveState && editor.isActive("bulletList") ? ["bulletList"] : []),
		...(openDropdown === "list" ? ["list"] : []),
	];
	const showModeTabs = Boolean(onToggleMarkdownMode || onModeChange);

	// The five separator-bounded control groups fold (right-to-left) into the
	// "+" insert dropdown when the toolbar runs out of horizontal room. The "+"
	// button is the pinned anchor and never folds.
	const toolbarGroupCount = showFormattingControls ? FOLDABLE_GROUP_COUNT : 0;
	const { containerRef, visibleCount: measuredVisibleCount } = useToolbarOverflow(
		toolbarGroupCount,
	);
	const visibleCount = foldsControls ? measuredVisibleCount : toolbarGroupCount;
	const isGroupFolded = (index: number): boolean => index >= visibleCount;
	const hasFoldedGroups = showFormattingControls && visibleCount < FOLDABLE_GROUP_COUNT;

	useEditorTransactionRerender(editor);
	useClickOutside(outsideRefs, () => setOpenDropdown(null), openDropdown !== null);
	if (currentMode !== "rendered" && openDropdown !== null) {
		setOpenDropdown(null);
	}

	function toggleDropdown(dropdown: DropdownType): void {
		setOpenDropdown((current) => (current === dropdown ? null : dropdown));
	}

	function closeDropdown(): void {
		setOpenDropdown(null);
	}

	function handleModeChange(value: string | null): void {
		if (
			value !== "rendered" &&
			value !== "markdown" &&
			value !== "data-flow"
		) {
			return;
		}

		if (value === "data-flow" && !showDataFlowMode) {
			return;
		}

		if (onModeChange) {
			onModeChange(value);
			return;
		}

		const nextIsMarkdownMode = value === "markdown";
		if (nextIsMarkdownMode !== isMarkdownMode) {
			onToggleMarkdownMode?.();
		}
	}

	// In source mode dispatch the Markdown-syntax transform; otherwise run the
	// equivalent Tiptap command against the rendered document.
	function runFormat(kind: MarkdownFormatKind, applyRich: () => void): void {
		if (isMarkdownMode) {
			onMarkdownFormat?.(kind);
			return;
		}

		applyRich();
	}

	function handleTextStyle(style: TextStyleType): void {
		runFormat(TEXT_STYLE_TO_MARKDOWN[style], () => setTextStyle(editor, style));
		closeDropdown();
	}

	function handleAlignment(nextAlignment: Alignment): void {
		editor.chain().focus().setTextAlign(nextAlignment).run();
		closeDropdown();
	}

	function handleFormattingValueChange(next: string[]): void {
		const boldActive = reflectsActiveState && editor.isActive("bold");
		const boldNext = next.includes("bold");

		if (boldNext !== boldActive) {
			runFormat("bold", () => editor.chain().focus().toggleBold().run());
		}

		const formattingNext = next.includes("formatting");

		if (formattingNext !== (openDropdown === "formatting")) {
			toggleDropdown("formatting");
		}
	}

	function handleListValueChange(next: string[]): void {
		const bulletListActive = reflectsActiveState && editor.isActive("bulletList");
		const bulletListNext = next.includes("bulletList");

		if (bulletListNext !== bulletListActive) {
			runFormat("bulletList", () => editor.chain().focus().toggleBulletList().run());
		}

		const listNext = next.includes("list");

		if (listNext !== (openDropdown === "list")) {
			toggleDropdown("list");
		}
	}

	function handleLinkPressedChange(pressed: boolean): void {
		if (isMarkdownMode) {
			onMarkdownFormat?.("link");
		} else if (pressed) {
			addLink(editor);
		} else {
			editor.chain().focus().unsetLink().run();
		}
	}

	function handleAddContent(): void {
		toggleDropdown("insert");
	}

	function handleToggleCodeBlock(): void {
		runFormat("codeBlock", () => editor.chain().focus().toggleCodeBlock().run());
	}

	function handleInsertTable(): void {
		editor
			.chain()
			.focus()
			.insertTable({ rows: 3, cols: 3, withHeaderRow: true })
			.run();
		closeDropdown();
	}

	function handleInsertHorizontalRule(): void {
		runFormat("horizontalRule", () => editor.chain().focus().setHorizontalRule().run());
		closeDropdown();
	}

	// Insert a category reference at the last caret position as a mention token.
	// `focus()` restores the editor's previous selection (the toolbar steals
	// focus on click), so the chip lands where the user last was typing. The id
	// prefix (`knowledge:`, `tool:`, …) is what `getMentionCategory` reads to
	// colour the chip.
	function handleInsertReference(
		category: InsertReferenceCategory,
		label: string,
	): void {
		const handledByConsumer = onInsertReferenceOption?.(category, label);
		if (handledByConsumer !== false && typeof onInsertReferenceOption !== "undefined") {
			closeDropdown();
			return;
		}

		editor
			.chain()
			.focus()
			.insertContent([
				{
					type: "mention",
					attrs: {
						id: `${category}:${category}`,
						label,
						mentionSuggestionChar: "@",
					},
				},
				{ type: "text", text: " " },
			])
			.run();
		closeDropdown();
	}

	// Menu mirror of a foldable group's controls, shown inside the "+" insert
	// dropdown when that group is hidden by the overflow measurement. Each item
	// reuses the same handler as its inline counterpart so behavior is identical.
	function renderFoldedGroupItems(groupIndex: number): ReactNode {
		switch (groupIndex) {
			case 0:
				return (
					<div key="folded-textStyle">
						<DropdownMenuItem
							icon={<TextIcon label="Normal text" size="small" />}
							label="Normal text"
							isSelected={editor.isActive("paragraph")}
							onClick={() => handleTextStyle("normal")}
						/>
						<DropdownMenuItem
							icon={<TextHeadingOneIcon label="Heading 1" size="small" />}
							label="Heading 1"
							isSelected={editor.isActive("heading", { level: 1 })}
							onClick={() => handleTextStyle("h1")}
						/>
						<DropdownMenuItem
							icon={<TextHeadingTwoIcon label="Heading 2" size="small" />}
							label="Heading 2"
							isSelected={editor.isActive("heading", { level: 2 })}
							onClick={() => handleTextStyle("h2")}
						/>
						<DropdownMenuItem
							icon={<TextHeadingThreeIcon label="Heading 3" size="small" />}
							label="Heading 3"
							isSelected={editor.isActive("heading", { level: 3 })}
							onClick={() => handleTextStyle("h3")}
						/>
						<DropdownMenuItem
							icon={<QuotationMarkIcon label="Quote" size="small" />}
							label="Quote"
							isSelected={editor.isActive("blockquote")}
							onClick={() => handleTextStyle("quote")}
						/>
					</div>
				);
			case 1:
				return (
					<div key="folded-formatting">
						<DropdownMenuItem
							icon={<TextBoldIcon label="Bold" size="small" />}
							label="Bold"
							isSelected={reflectsActiveState && editor.isActive("bold")}
							onClick={() => {
								runFormat("bold", () => editor.chain().focus().toggleBold().run());
								closeDropdown();
							}}
						/>
						<DropdownMenuItem
							icon={<TextItalicIcon label="Italic" size="small" />}
							label="Italic"
							isSelected={editor.isActive("italic")}
							onClick={() => {
								runFormat("italic", () => editor.chain().focus().toggleItalic().run());
								closeDropdown();
							}}
						/>
						<DropdownMenuItem
							icon={<TextUnderlineIcon label="Underline" size="small" />}
							label="Underline"
							isSelected={editor.isActive("underline")}
							onClick={() => {
								runFormat("underline", () => editor.chain().focus().toggleUnderline().run());
								closeDropdown();
							}}
						/>
						<DropdownMenuItem
							icon={<TextStrikethroughIcon label="Strikethrough" size="small" />}
							label="Strikethrough"
							isSelected={editor.isActive("strike")}
							onClick={() => {
								runFormat("strikethrough", () => editor.chain().focus().toggleStrike().run());
								closeDropdown();
							}}
						/>
						<DropdownMenuItem
							icon={<SnippetIcon label="Code" size="small" />}
							label="Code"
							isSelected={editor.isActive("code")}
							onClick={() => {
								runFormat("inlineCode", () => editor.chain().focus().toggleCode().run());
								closeDropdown();
							}}
						/>
					</div>
				);
			case 2:
				return (
					<div key="folded-list">
						<DropdownMenuItem
							icon={<ListBulletedIcon label="Bulleted list" size="small" />}
							label="Bulleted list"
							isSelected={editor.isActive("bulletList")}
							onClick={() => {
								runFormat("bulletList", () => editor.chain().focus().toggleBulletList().run());
								closeDropdown();
							}}
						/>
						<DropdownMenuItem
							icon={<ListNumberedIcon label="Numbered list" size="small" />}
							label="Numbered list"
							isSelected={editor.isActive("orderedList")}
							onClick={() => {
								runFormat("orderedList", () => editor.chain().focus().toggleOrderedList().run());
								closeDropdown();
							}}
						/>
						<DropdownMenuItem
							icon={<ListChecklistIcon label="Task list" size="small" />}
							label="Task list"
							isSelected={currentMode === "rendered" && editor.isActive("taskList")}
							disabled={isMarkdownMode}
							onClick={() => {
								editor.chain().focus().toggleTaskList().run();
								closeDropdown();
							}}
						/>
					</div>
				);
			case 3:
				return (
					<div key="folded-align">
						<DropdownMenuItem
							icon={<AlignTextLeftIcon label="Align left" size="small" />}
							label="Align left"
							isSelected={alignment === "left"}
							disabled={markdownUnsupported}
							onClick={() => handleAlignment("left")}
						/>
						<DropdownMenuItem
							icon={<AlignTextCenterIcon label="Align center" size="small" />}
							label="Align center"
							isSelected={alignment === "center"}
							disabled={markdownUnsupported}
							onClick={() => handleAlignment("center")}
						/>
						<DropdownMenuItem
							icon={<AlignTextRightIcon label="Align right" size="small" />}
							label="Align right"
							isSelected={alignment === "right"}
							disabled={markdownUnsupported}
							onClick={() => handleAlignment("right")}
						/>
						<DropdownMenuItem
							icon={<LinkIcon label="Link" size="small" />}
							label="Link"
							isSelected={currentMode === "rendered" && editor.isActive("link")}
							onClick={() => {
								handleLinkPressedChange(!(currentMode === "rendered" && editor.isActive("link")));
								closeDropdown();
							}}
						/>
					</div>
				);
			case 4:
				return (
					<div key="folded-blocks">
						<DropdownMenuItem
							icon={<AngleBracketsIcon label="Code block" size="small" />}
							label="Code block"
							isSelected={currentMode === "rendered" && editor.isActive("codeBlock")}
							onClick={() => {
								handleToggleCodeBlock();
								closeDropdown();
							}}
						/>
						<DropdownMenuItem
							icon={<DividerElementIcon label="Horizontal rule" size="small" />}
							label="Horizontal rule"
							isSelected={false}
							onClick={handleInsertHorizontalRule}
						/>
						<DropdownMenuItem
							icon={<TableIcon label="Table" size="small" />}
							label="Table"
							isSelected={false}
							disabled={isMarkdownMode}
							onClick={handleInsertTable}
						/>
					</div>
				);
			default:
				return null;
		}
	}

	function renderFoldedControls(): ReactNode {
		const items: ReactNode[] = [];
		for (let index = visibleCount; index < FOLDABLE_GROUP_COUNT; index += 1) {
			items.push(renderFoldedGroupItems(index));
		}
		return items;
	}

	return (
		<div
			ref={toolbarRef}
			className={cn("flex min-h-8 items-center justify-between gap-4", className)}
		>
			<div className={cn("flex items-center gap-1", foldsControls ? "min-w-0 flex-1" : "shrink-0")}>
				{leadingSlot}
				<div
					ref={containerRef}
					className={cn("flex items-center gap-1", foldsControls ? "min-w-0 flex-1" : "shrink-0", controlsClassName)}
				>
					{showFormattingControls ? (
						<>
					<div
						data-toolbar-group
						data-toolbar-folded={isGroupFolded(0) ? "true" : undefined}
						className={cn("relative flex items-center gap-1", isGroupFolded(0) && "hidden")}
					>
						<Button
							type="button"
							aria-label={getCurrentTextStyle(editor)}
							aria-expanded={openDropdown === "textStyle"}
							size="icon"
							variant="ghost"
							disabled={controlsDisabled}
							onClick={() => toggleDropdown("textStyle")}
						>
							{renderCurrentTextStyleIcon(editor)}
						</Button>
						{openDropdown === "textStyle" ? (
							<DropdownMenuContainer>
								<DropdownMenuItem
									icon={<TextIcon label="Normal text" size="small" />}
									label="Normal text"
									isSelected={editor.isActive("paragraph")}
									onClick={() => handleTextStyle("normal")}
								/>
								<DropdownMenuItem
									icon={<TextHeadingOneIcon label="Heading 1" size="small" />}
									label="Heading 1"
									isSelected={editor.isActive("heading", { level: 1 })}
									onClick={() => handleTextStyle("h1")}
									className="text-lg font-semibold"
								/>
								<DropdownMenuItem
									icon={<TextHeadingTwoIcon label="Heading 2" size="small" />}
									label="Heading 2"
									isSelected={editor.isActive("heading", { level: 2 })}
									onClick={() => handleTextStyle("h2")}
									className="font-semibold text-base"
								/>
								<DropdownMenuItem
									icon={<TextHeadingThreeIcon label="Heading 3" size="small" />}
									label="Heading 3"
									isSelected={editor.isActive("heading", { level: 3 })}
									onClick={() => handleTextStyle("h3")}
									className="font-semibold"
								/>
								<DropdownMenuItem
									icon={<TextHeadingFourIcon label="Heading 4" size="small" />}
									label="Heading 4"
									isSelected={editor.isActive("heading", { level: 4 })}
									onClick={() => handleTextStyle("h4")}
									className="font-semibold"
								/>
								<DropdownMenuItem
									icon={<TextHeadingFiveIcon label="Heading 5" size="small" />}
									label="Heading 5"
									isSelected={editor.isActive("heading", { level: 5 })}
									onClick={() => handleTextStyle("h5")}
									className="font-semibold"
								/>
								<DropdownMenuItem
									icon={<TextHeadingSixIcon label="Heading 6" size="small" />}
									label="Heading 6"
									isSelected={editor.isActive("heading", { level: 6 })}
									onClick={() => handleTextStyle("h6")}
									className="font-semibold"
								/>
								<DropdownMenuItem
									icon={<QuotationMarkIcon label="Quote" size="small" />}
									label="Quote"
									isSelected={editor.isActive("blockquote")}
									onClick={() => handleTextStyle("quote")}
								/>
							</DropdownMenuContainer>
						) : null}
					</div>

					<div
						data-toolbar-group
						data-toolbar-folded={isGroupFolded(1) ? "true" : undefined}
						className={cn("relative flex items-center gap-1", isGroupFolded(1) && "hidden")}
					>
						<ToggleGroup
							multiple
							value={formattingValue}
							className={TOOLBAR_SPLIT_TOGGLE_GROUP_CLASS_NAME}
							onValueChange={handleFormattingValueChange}
						>
							<ToggleGroupItem
								value="bold"
								aria-label="Bold"
								disabled={controlsDisabled}
							>
								<TextBoldIcon label="" size="small" />
							</ToggleGroupItem>
							<ToggleGroupItem
								value="formatting"
								aria-label="More formatting options"
								aria-expanded={openDropdown === "formatting"}
								disabled={controlsDisabled}
							>
								<ChevronDownIcon label="" size="small" />
							</ToggleGroupItem>
						</ToggleGroup>
						{openDropdown === "formatting" ? (
							<DropdownMenuContainer>
								<DropdownMenuItem
									icon={<TextItalicIcon label="Italic" size="small" />}
									label="Italic"
									isSelected={editor.isActive("italic")}
									onClick={() => {
										runFormat("italic", () => editor.chain().focus().toggleItalic().run());
										closeDropdown();
									}}
								/>
								<DropdownMenuItem
									icon={<TextUnderlineIcon label="Underline" size="small" />}
									label="Underline"
									isSelected={editor.isActive("underline")}
									onClick={() => {
										runFormat("underline", () => editor.chain().focus().toggleUnderline().run());
										closeDropdown();
									}}
								/>
								<DropdownMenuItem
									icon={<TextStrikethroughIcon label="Strikethrough" size="small" />}
									label="Strikethrough"
									isSelected={editor.isActive("strike")}
									onClick={() => {
										runFormat("strikethrough", () => editor.chain().focus().toggleStrike().run());
										closeDropdown();
									}}
								/>
								<DropdownMenuItem
									icon={<SnippetIcon label="Code" size="small" />}
									label="Code"
									isSelected={editor.isActive("code")}
									onClick={() => {
										runFormat("inlineCode", () => editor.chain().focus().toggleCode().run());
										closeDropdown();
									}}
								/>
							</DropdownMenuContainer>
						) : null}
					</div>

					<div
						data-toolbar-group
						data-toolbar-folded={isGroupFolded(2) ? "true" : undefined}
						className={cn("relative flex items-center gap-1", isGroupFolded(2) && "hidden")}
					>
						<ToolbarSeparator />
						<ToggleGroup
							multiple
							value={listValue}
							className={TOOLBAR_SPLIT_TOGGLE_GROUP_CLASS_NAME}
							onValueChange={handleListValueChange}
						>
							<ToggleGroupItem
								value="bulletList"
								aria-label="Bulleted list"
								disabled={controlsDisabled}
							>
								<ListBulletedIcon label="" size="small" />
							</ToggleGroupItem>
							<ToggleGroupItem
								value="list"
								aria-label="More list options"
								aria-expanded={openDropdown === "list"}
								disabled={controlsDisabled}
							>
								<ChevronDownIcon label="" size="small" />
							</ToggleGroupItem>
						</ToggleGroup>
						{openDropdown === "list" ? (
							<DropdownMenuContainer>
								<DropdownMenuItem
									icon={<ListBulletedIcon label="Bulleted list" size="small" />}
									label="Bulleted list"
									isSelected={editor.isActive("bulletList")}
									onClick={() => {
										runFormat("bulletList", () => editor.chain().focus().toggleBulletList().run());
										closeDropdown();
									}}
								/>
								<DropdownMenuItem
									icon={<ListNumberedIcon label="Numbered list" size="small" />}
									label="Numbered list"
									isSelected={editor.isActive("orderedList")}
									onClick={() => {
										runFormat("orderedList", () => editor.chain().focus().toggleOrderedList().run());
										closeDropdown();
									}}
								/>
								<DropdownMenuItem
									icon={<ListChecklistIcon label="Task list" size="small" />}
									label="Task list"
									isSelected={!isMarkdownMode && editor.isActive("taskList")}
									disabled={isMarkdownMode}
									onClick={() => {
										editor.chain().focus().toggleTaskList().run();
										closeDropdown();
									}}
								/>
							</DropdownMenuContainer>
						) : null}
					</div>

					<div
						data-toolbar-group
						data-toolbar-folded={isGroupFolded(3) ? "true" : undefined}
						className={cn("flex items-center gap-1", isGroupFolded(3) && "hidden")}
					>
						<ToolbarSeparator />
						<div className="relative">
							<Button
								type="button"
								aria-label="Text alignment"
								aria-expanded={openDropdown === "align"}
								size="icon"
								variant="ghost"
								disabled={markdownUnsupported}
								onClick={() => toggleDropdown("align")}
							>
								{renderCurrentAlignmentIcon(alignment)}
							</Button>
							{openDropdown === "align" ? (
								<DropdownMenuContainer>
									<DropdownMenuItem
										icon={<AlignTextLeftIcon label="Align left" size="small" />}
										label="Align left"
										isSelected={alignment === "left"}
										onClick={() => handleAlignment("left")}
									/>
									<DropdownMenuItem
										icon={<AlignTextCenterIcon label="Align center" size="small" />}
										label="Align center"
										isSelected={alignment === "center"}
										onClick={() => handleAlignment("center")}
									/>
									<DropdownMenuItem
										icon={<AlignTextRightIcon label="Align right" size="small" />}
										label="Align right"
										isSelected={alignment === "right"}
										onClick={() => handleAlignment("right")}
									/>
								</DropdownMenuContainer>
							) : null}
						</div>

						<Toggle
							aria-label="Link"
							pressed={currentMode === "rendered" && editor.isActive("link")}
							disabled={controlsDisabled}
							onPressedChange={handleLinkPressedChange}
						>
							<LinkIcon label="" size="small" />
						</Toggle>
					</div>

					<div
						data-toolbar-group
						data-toolbar-folded={isGroupFolded(4) ? "true" : undefined}
						className={cn("flex items-center gap-1", isGroupFolded(4) && "hidden")}
					>
						<ToolbarSeparator />
						<Toggle
							aria-label="Code block"
							pressed={currentMode === "rendered" && editor.isActive("codeBlock")}
							disabled={controlsDisabled}
							onPressedChange={handleToggleCodeBlock}
						>
							<AngleBracketsIcon label="" size="small" />
						</Toggle>
						<Button
							type="button"
							aria-label="Horizontal rule"
							size="icon"
							variant="ghost"
							disabled={controlsDisabled}
							onClick={handleInsertHorizontalRule}
						>
							<DividerElementIcon label="" size="small" />
						</Button>
						<Button
							type="button"
							aria-label="Table"
							size="icon"
							variant="ghost"
							disabled={isMarkdownMode || controlsDisabled}
							onClick={handleInsertTable}
						>
							<TableIcon label="" size="small" />
						</Button>
					</div>
						</>
					) : null}

					<div data-toolbar-anchor className="relative flex items-center gap-1">
						{hasFoldedGroups ? <ToolbarSeparator /> : null}
						<Button
							type="button"
							aria-label="Add content"
							aria-expanded={openDropdown === "insert"}
							size="icon"
							variant="ghost"
							disabled={isMarkdownMode || controlsDisabled}
							onClick={handleAddContent}
						>
							<AddIcon label="" size="small" />
						</Button>
						{openDropdown === "insert" ? (
							<DropdownMenuContainer align="right">
								{hasFoldedGroups ? (
									<>
										{renderFoldedControls()}
										<Separator className="my-1 bg-border" />
									</>
								) : null}
								{RICH_TEXT_REFERENCE_CATEGORY_OPTIONS.map((option) => (
									<DropdownMenuItem
										key={option.category}
										icon={option.icon}
										label={option.label}
										isSelected={false}
										onClick={() =>
											handleInsertReference(option.category, option.label)
										}
									/>
								))}
							</DropdownMenuContainer>
						) : null}
					</div>
				</div>
			</div>
			{endSlot || showModeTabs ? (
				<div className="flex shrink-0 items-center gap-2">
					{endSlot}
					{showModeTabs ? (
						<EditorToolbarModeTabs
							mode={currentMode}
							showDataFlowMode={showDataFlowMode}
							onModeChange={(nextMode) => handleModeChange(nextMode)}
						/>
					) : null}
				</div>
			) : null}
		</div>
	);
}
