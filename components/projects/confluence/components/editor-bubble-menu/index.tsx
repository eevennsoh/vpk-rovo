"use client";

import React, { useState, useRef, useMemo } from "react";
import { Editor } from "@tiptap/react";
import { token } from "@/lib/tokens";

import { Button } from "@/components/ui/button";
import { useClickOutside } from "@/components/hooks/use-click-outside";
import { useSelectionPosition } from "./hooks/use-selection-position";
import { TextStyleDropdown } from "./text-style-dropdown";
import { FormattingDropdown } from "./formatting-dropdown";
import { ListDropdown } from "./list-dropdown";
import { AlignmentDropdown } from "./alignment-dropdown";
import { AIToolsSection } from "./ai-tools-section";
import CommentIcon from "@atlaskit/icon/core/comment";
import LinkIcon from "@atlaskit/icon/core/link";
import ShowMoreHorizontalIcon from "@atlaskit/icon/core/show-more-horizontal";

type DropdownType = "textStyle" | "bold" | "list" | "align" | null;

interface EditorBubbleMenuProps {
	editor: Editor;
}

export default function EditorBubbleMenu({ editor }: Readonly<EditorBubbleMenuProps>): React.ReactElement | null {
	const { show, position } = useSelectionPosition(editor);
	const [openDropdown, setOpenDropdown] = useState<DropdownType>(null);
	const menuRef = useRef<HTMLDivElement>(null);

	const textStyleMenuRef = useRef<HTMLDivElement>(null);
	const boldMenuRef = useRef<HTMLDivElement>(null);
	const listMenuRef = useRef<HTMLDivElement>(null);
	const alignMenuRef = useRef<HTMLDivElement>(null);

	const dropdownRefs = useMemo(
		() => [textStyleMenuRef, boldMenuRef, listMenuRef, alignMenuRef],
		[]
	);

	useClickOutside(dropdownRefs, () => setOpenDropdown(null), openDropdown !== null);

	function toggleDropdown(dropdown: DropdownType): void {
		setOpenDropdown(openDropdown === dropdown ? null : dropdown);
	}

	function closeDropdown(): void {
		setOpenDropdown(null);
	}

	function addLink(): void {
		const url = window.prompt("Enter URL");
		if (url) {
			editor.chain().focus().setLink({ href: url }).run();
		}
	}

	if (!show) {
		return null;
	}

	return (
		<div
			ref={menuRef}
			style={{
				position: "fixed",
				top: position.top,
				left: position.left,
				transform: "translate(-50%, -100%)",
				display: "flex",
				alignItems: "stretch",
				backgroundColor: token("elevation.surface.overlay"),
				borderRadius: token("radius.large"),
				boxShadow: token("elevation.shadow.overlay"),
				zIndex: 1000,
				pointerEvents: "auto",
			}}
		>
			<AIToolsSection />

			<div style={{ padding: `${token("space.050")} ${token("space.100")}` }}>
				<div className="flex items-center gap-1">
					<TextStyleDropdown
						ref={textStyleMenuRef}
						editor={editor}
						isOpen={openDropdown === "textStyle"}
						onToggle={() => toggleDropdown("textStyle")}
						onClose={closeDropdown}
					/>

					<FormattingDropdown
						ref={boldMenuRef}
						editor={editor}
						isOpen={openDropdown === "bold"}
						onToggle={() => toggleDropdown("bold")}
						onClose={closeDropdown}
					/>

					<ListDropdown
						ref={listMenuRef}
						editor={editor}
						isOpen={openDropdown === "list"}
						onToggle={() => toggleDropdown("list")}
						onClose={closeDropdown}
					/>

					<AlignmentDropdown
						ref={alignMenuRef}
						editor={editor}
						isOpen={openDropdown === "align"}
						onToggle={() => toggleDropdown("align")}
						onClose={closeDropdown}
					/>

					<Button
						aria-label="Link"
						size="icon-sm"
						variant={editor.isActive("link") ? "secondary" : "ghost"}
						onClick={addLink}
					>
						<LinkIcon label="" size="small" />
					</Button>

					<Button className="gap-2" size="sm" variant="ghost">
						<CommentIcon label="" size="small" />
						Comment
					</Button>

					<Button aria-label="More options" size="icon-sm" variant="ghost">
						<ShowMoreHorizontalIcon label="" size="small" />
					</Button>
				</div>
			</div>
		</div>
	);
}
