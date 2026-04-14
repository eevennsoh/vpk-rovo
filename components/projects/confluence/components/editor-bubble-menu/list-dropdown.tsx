"use client";

import React from "react";
import { Editor } from "@tiptap/react";
import { Button } from "@/components/ui/button";
import { DropdownMenuItem, DropdownMenuContainer } from "./dropdown-menu-item";
import { DROPDOWN_POSITIONS } from "../../data/editor-colors";
import ChevronDownIcon from "@atlaskit/icon/core/chevron-down";
import ListBulletedIcon from "@atlaskit/icon/core/list-bulleted";
import ListNumberedIcon from "@atlaskit/icon/core/list-numbered";

interface ListDropdownProps {
	ref?: React.Ref<HTMLDivElement>;
	editor: Editor;
	isOpen: boolean;
	onToggle: () => void;
	onClose: () => void;
}

export function ListDropdown({ ref, editor, isOpen, onToggle, onClose }: Readonly<ListDropdownProps>) {
	function handleBulletList(): void {
		editor.chain().focus().toggleBulletList().run();
		onClose();
	}

	function handleNumberedList(): void {
		editor.chain().focus().toggleOrderedList().run();
		onClose();
	}

	const position = DROPDOWN_POSITIONS.list;

	return (
		<div style={{ position: "relative", display: "flex" }}>
			<Button
				aria-label="Bulleted list"
				size="icon-sm"
				variant={editor.isActive("bulletList") ? "secondary" : "ghost"}
				onClick={() => editor.chain().focus().toggleBulletList().run()}
			>
				<ListBulletedIcon label="" size="small" />
			</Button>
			<Button
				aria-label="More list options"
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
							icon={<ListBulletedIcon label="Bulleted list" size="small" />}
							label="Bulleted list"
							isSelected={editor.isActive("bulletList")}
							onClick={handleBulletList}
						/>
						<DropdownMenuItem
							icon={<ListNumberedIcon label="Numbered list" size="small" />}
							label="Numbered list"
							isSelected={editor.isActive("orderedList")}
							onClick={handleNumberedList}
						/>
					</DropdownMenuContainer>
				</div>
			) : null}
		</div>
	);
}
