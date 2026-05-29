"use client";

import type { ReactNode, RefObject } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Editor } from "@tiptap/react";
import { BubbleMenu, FloatingMenu } from "@tiptap/react/menus";

import AlignTextCenterIcon from "@atlaskit/icon/core/align-text-center";
import AlignTextLeftIcon from "@atlaskit/icon/core/align-text-left";
import AlignTextRightIcon from "@atlaskit/icon/core/align-text-right";
import ChevronDownIcon from "@atlaskit/icon/core/chevron-down";
import CommentIcon from "@atlaskit/icon/core/comment";
import LinkIcon from "@atlaskit/icon/core/link";
import ListBulletedIcon from "@atlaskit/icon/core/list-bulleted";
import ListNumberedIcon from "@atlaskit/icon/core/list-numbered";
import QuotationMarkIcon from "@atlaskit/icon/core/quotation-mark";
import ShowMoreHorizontalIcon from "@atlaskit/icon/core/show-more-horizontal";
import TextIcon from "@atlaskit/icon/core/text";
import TextBoldIcon from "@atlaskit/icon/core/text-bold";
import TextItalicIcon from "@atlaskit/icon/core/text-italic";
import TextStrikethroughIcon from "@atlaskit/icon/core/text-strikethrough";
import TextUnderlineIcon from "@atlaskit/icon/core/text-underline";
import TextHeadingOneIcon from "@atlaskit/icon-lab/core/text-heading-one";
import TextHeadingThreeIcon from "@atlaskit/icon-lab/core/text-heading-three";
import TextHeadingTwoIcon from "@atlaskit/icon-lab/core/text-heading-two";

import { useClickOutside } from "@/components/hooks/use-click-outside";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type DropdownType = "textStyle" | "formatting" | "list" | "align" | null;
type TextStyleType = "normal" | "h1" | "h2" | "h3" | "quote";
type Alignment = "left" | "center" | "right";

interface RichTextEditorToolbarProps {
	editor: Editor;
	className?: string;
	controlsClassName?: string;
	leadingSlot?: ReactNode;
	endSlot?: ReactNode;
	showCommentControl?: boolean;
	showMoreControl?: boolean;
}

interface RichTextEditorBubbleMenuProps {
	editor: Editor;
	leadingSlot?: ReactNode;
	showCommentControl?: boolean;
	showMoreControl?: boolean;
}

interface RichTextEditorFloatingMenuProps {
	editor: Editor;
	leadingSlot?: ReactNode;
	showCommentControl?: boolean;
	showMoreControl?: boolean;
}

interface DropdownMenuItemProps {
	icon: ReactNode;
	label: string;
	isSelected: boolean;
	onClick: () => void;
	className?: string;
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

		return () => {
			editor.off("transaction", update);
			editor.off("selectionUpdate", update);
			editor.off("update", update);
		};
	}, [editor]);
}

function DropdownMenuItem({
	icon,
	label,
	isSelected,
	onClick,
	className,
}: Readonly<DropdownMenuItemProps>) {
	return (
		<button
			type="button"
			aria-pressed={isSelected}
			className={cn(
				"flex w-full items-center gap-2 rounded px-2 py-2 text-left text-sm text-text-subtle transition-colors hover:bg-bg-neutral-subtle-hovered",
				isSelected && "bg-bg-selected text-text-selected",
				className
			)}
			onClick={onClick}
		>
			{icon}
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
				"absolute top-full z-50 mt-1 min-w-52 rounded-lg bg-popover p-1 text-popover-foreground shadow-xl",
				align === "right" ? "right-0" : "left-0"
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
	if (editor.isActive("blockquote")) return "Quote";
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
	if (editor.isActive("blockquote")) {
		return <QuotationMarkIcon label="" size="small" />;
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

export function RichTextEditorToolbar({
	editor,
	className,
	controlsClassName,
	leadingSlot,
	endSlot,
	showCommentControl = true,
	showMoreControl = true,
}: Readonly<RichTextEditorToolbarProps>) {
	const [openDropdown, setOpenDropdown] = useState<DropdownType>(null);
	const toolbarRef = useRef<HTMLDivElement>(null);
	const outsideRefs = useMemo(
		() => [toolbarRef as RefObject<HTMLElement | null>],
		[]
	);
	const alignment = getCurrentAlignment(editor);

	useEditorTransactionRerender(editor);
	useClickOutside(outsideRefs, () => setOpenDropdown(null), openDropdown !== null);

	function toggleDropdown(dropdown: DropdownType): void {
		setOpenDropdown((current) => (current === dropdown ? null : dropdown));
	}

	function closeDropdown(): void {
		setOpenDropdown(null);
	}

	function handleTextStyle(style: TextStyleType): void {
		setTextStyle(editor, style);
		closeDropdown();
	}

	function handleAlignment(nextAlignment: Alignment): void {
		editor.chain().focus().setTextAlign(nextAlignment).run();
		closeDropdown();
	}

	return (
		<div
			ref={toolbarRef}
			className={cn("flex min-h-8 items-center justify-between gap-4", className)}
		>
			<div className="flex min-w-0 items-center gap-1">
				{leadingSlot}
				<div className={cn("flex min-w-0 items-center gap-1", controlsClassName)}>
					<div className="relative">
						<Button
							type="button"
							aria-label={getCurrentTextStyle(editor)}
							aria-expanded={openDropdown === "textStyle"}
							size="icon"
							variant="ghost"
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
									icon={<QuotationMarkIcon label="Quote" size="small" />}
									label="Quote"
									isSelected={editor.isActive("blockquote")}
									onClick={() => handleTextStyle("quote")}
								/>
							</DropdownMenuContainer>
						) : null}
					</div>

					<div className="relative flex">
						<Button
							type="button"
							aria-label="Bold"
							size="icon"
							variant={editor.isActive("bold") ? "secondary" : "ghost"}
							onClick={() => editor.chain().focus().toggleBold().run()}
						>
							<TextBoldIcon label="" size="small" />
						</Button>
						<Button
							type="button"
							aria-label="More formatting options"
							aria-expanded={openDropdown === "formatting"}
							size="icon"
							variant="ghost"
							onClick={() => toggleDropdown("formatting")}
						>
							<ChevronDownIcon label="" size="small" />
						</Button>
						{openDropdown === "formatting" ? (
							<DropdownMenuContainer>
								<DropdownMenuItem
									icon={<TextItalicIcon label="Italic" size="small" />}
									label="Italic"
									isSelected={editor.isActive("italic")}
									onClick={() => {
										editor.chain().focus().toggleItalic().run();
										closeDropdown();
									}}
								/>
								<DropdownMenuItem
									icon={<TextUnderlineIcon label="Underline" size="small" />}
									label="Underline"
									isSelected={editor.isActive("underline")}
									onClick={() => {
										editor.chain().focus().toggleUnderline().run();
										closeDropdown();
									}}
								/>
								<DropdownMenuItem
									icon={<TextStrikethroughIcon label="Strikethrough" size="small" />}
									label="Strikethrough"
									isSelected={editor.isActive("strike")}
									onClick={() => {
										editor.chain().focus().toggleStrike().run();
										closeDropdown();
									}}
								/>
							</DropdownMenuContainer>
						) : null}
					</div>

					<div className="relative flex">
						<Button
							type="button"
							aria-label="Bulleted list"
							size="icon"
							variant={editor.isActive("bulletList") ? "secondary" : "ghost"}
							onClick={() => editor.chain().focus().toggleBulletList().run()}
						>
							<ListBulletedIcon label="" size="small" />
						</Button>
						<Button
							type="button"
							aria-label="More list options"
							aria-expanded={openDropdown === "list"}
							size="icon"
							variant="ghost"
							onClick={() => toggleDropdown("list")}
						>
							<ChevronDownIcon label="" size="small" />
						</Button>
						{openDropdown === "list" ? (
							<DropdownMenuContainer>
								<DropdownMenuItem
									icon={<ListBulletedIcon label="Bulleted list" size="small" />}
									label="Bulleted list"
									isSelected={editor.isActive("bulletList")}
									onClick={() => {
										editor.chain().focus().toggleBulletList().run();
										closeDropdown();
									}}
								/>
								<DropdownMenuItem
									icon={<ListNumberedIcon label="Numbered list" size="small" />}
									label="Numbered list"
									isSelected={editor.isActive("orderedList")}
									onClick={() => {
										editor.chain().focus().toggleOrderedList().run();
										closeDropdown();
									}}
								/>
							</DropdownMenuContainer>
						) : null}
					</div>

					<div className="relative">
						<Button
							type="button"
							aria-label="Text alignment"
							aria-expanded={openDropdown === "align"}
							size="icon"
							variant="ghost"
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

					<Button
						type="button"
						aria-label="Link"
						size="icon"
						variant={editor.isActive("link") ? "secondary" : "ghost"}
						onClick={() => addLink(editor)}
					>
						<LinkIcon label="" size="small" />
					</Button>

					{showCommentControl ? (
						<Button type="button" className="gap-2" variant="ghost">
							<CommentIcon label="" size="small" />
							Comment
						</Button>
					) : null}

					{showMoreControl ? (
						<Button
							type="button"
							aria-label="More options"
							size="icon"
							variant="ghost"
						>
							<ShowMoreHorizontalIcon label="" size="small" />
						</Button>
					) : null}
				</div>
			</div>
			{endSlot ? <div className="shrink-0">{endSlot}</div> : null}
		</div>
	);
}

export function RichTextEditorBubbleMenu({
	editor,
	leadingSlot,
	showCommentControl,
	showMoreControl,
}: Readonly<RichTextEditorBubbleMenuProps>) {
	return (
		<BubbleMenu
			editor={editor}
			className="z-[1000] flex items-stretch rounded-lg bg-popover text-popover-foreground shadow-2xl"
			shouldShow={({ editor: activeEditor, from, to }) =>
				activeEditor.isEditable && from !== to
			}
		>
			<RichTextEditorToolbar
				editor={editor}
				leadingSlot={leadingSlot}
				showCommentControl={showCommentControl}
				showMoreControl={showMoreControl}
				className="gap-0"
				controlsClassName="px-2 py-1"
			/>
		</BubbleMenu>
	);
}

export function RichTextEditorFloatingMenu({
	editor,
	leadingSlot,
	showCommentControl,
	showMoreControl,
}: Readonly<RichTextEditorFloatingMenuProps>) {
	return (
		<FloatingMenu
			editor={editor}
			className="z-[1000] flex items-stretch rounded-lg bg-popover text-popover-foreground shadow-2xl"
		>
			<RichTextEditorToolbar
				editor={editor}
				leadingSlot={leadingSlot}
				showCommentControl={showCommentControl}
				showMoreControl={showMoreControl}
				className="gap-0"
				controlsClassName="px-2 py-1"
			/>
		</FloatingMenu>
	);
}
