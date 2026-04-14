"use client";

import React from "react";
import { Editor } from "@tiptap/react";
import { Button } from "@/components/ui/button";
import { DropdownMenuItem, DropdownMenuContainer } from "./dropdown-menu-item";
import { DROPDOWN_POSITIONS } from "../../data/editor-colors";
import ChevronDownIcon from "@atlaskit/icon/core/chevron-down";
import TextBoldIcon from "@atlaskit/icon/core/text-bold";
import TextItalicIcon from "@atlaskit/icon/core/text-italic";
import TextStrikethroughIcon from "@atlaskit/icon/core/text-strikethrough";
import TextUnderlineIcon from "@atlaskit/icon/core/text-underline";

interface FormattingDropdownProps {
	ref?: React.Ref<HTMLDivElement>;
	editor: Editor;
	isOpen: boolean;
	onToggle: () => void;
	onClose: () => void;
}

export function FormattingDropdown({ ref, editor, isOpen, onToggle, onClose }: Readonly<FormattingDropdownProps>) {
	function handleItalic(): void {
		editor.chain().focus().toggleItalic().run();
		onClose();
	}

	function handleUnderline(): void {
		editor.chain().focus().toggleUnderline().run();
		onClose();
	}

	function handleStrikethrough(): void {
		editor.chain().focus().toggleStrike().run();
		onClose();
	}

	const position = DROPDOWN_POSITIONS.bold;

	return (
		<div style={{ position: "relative", display: "flex" }}>
			<Button
				aria-label="Bold"
				size="icon-sm"
				variant={editor.isActive("bold") ? "secondary" : "ghost"}
				onClick={() => editor.chain().focus().toggleBold().run()}
			>
				<TextBoldIcon label="" size="small" />
			</Button>
			<Button
				aria-label="More formatting options"
				size="icon-sm"
				variant="ghost"
				onClick={onToggle}
			>
				<ChevronDownIcon label="" size="small" />
			</Button>

			{isOpen ? (
				<div ref={ref}>
					<DropdownMenuContainer top={position.top} left={position.left}>
						<DropdownMenuItem
							icon={<TextItalicIcon label="Italic" size="small" />}
							label="Italic"
							isSelected={editor.isActive("italic")}
							onClick={handleItalic}
						/>
						<DropdownMenuItem
							icon={<TextUnderlineIcon label="Underline" size="small" />}
							label="Underline"
							isSelected={editor.isActive("underline")}
							onClick={handleUnderline}
						/>
						<DropdownMenuItem
							icon={<TextStrikethroughIcon label="Strikethrough" size="small" />}
							label="Strikethrough"
							isSelected={editor.isActive("strike")}
							onClick={handleStrikethrough}
						/>
					</DropdownMenuContainer>
				</div>
			) : null}
		</div>
	);
}
