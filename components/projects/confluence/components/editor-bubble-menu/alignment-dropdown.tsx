"use client";

import React from "react";
import { Editor } from "@tiptap/react";
import { Button } from "@/components/ui/button";
import { DropdownMenuItem, DropdownMenuContainer } from "./dropdown-menu-item";
import { DROPDOWN_POSITIONS } from "../../data/editor-colors";
import AlignTextCenterIcon from "@atlaskit/icon/core/align-text-center";
import AlignTextLeftIcon from "@atlaskit/icon/core/align-text-left";
import AlignTextRightIcon from "@atlaskit/icon/core/align-text-right";

type Alignment = "left" | "center" | "right";

interface AlignmentDropdownProps {
	ref?: React.Ref<HTMLDivElement>;
	editor: Editor;
	isOpen: boolean;
	onToggle: () => void;
	onClose: () => void;
}

export function AlignmentDropdown({ ref, editor, isOpen, onToggle, onClose }: Readonly<AlignmentDropdownProps>) {
	function getCurrentAlignment(): Alignment {
		if (editor.isActive({ textAlign: "center" })) return "center";
		if (editor.isActive({ textAlign: "right" })) return "right";
		return "left";
	}

	function handleAlignment(alignment: Alignment): void {
		editor.chain().focus().setTextAlign(alignment).run();
		onClose();
	}

	const currentAlignment = getCurrentAlignment();
	const position = DROPDOWN_POSITIONS.align;

	return (
		<div style={{ position: "relative" }}>
			<Button
				aria-label="Text alignment"
				size="icon-sm"
				variant="ghost"
				onClick={onToggle}
			>
				{currentAlignment === "center" ? (
					<AlignTextCenterIcon label="" size="small" />
				) : currentAlignment === "right" ? (
					<AlignTextRightIcon label="" size="small" />
				) : (
					<AlignTextLeftIcon label="" size="small" />
				)}
			</Button>

			{isOpen ? (
				<div ref={ref}>
					<DropdownMenuContainer top={position.top} left={position.left}>
						<DropdownMenuItem
							icon={<AlignTextLeftIcon label="Align left" size="small" />}
							label="Align left"
							isSelected={currentAlignment === "left"}
							onClick={() => handleAlignment("left")}
						/>
						<DropdownMenuItem
							icon={<AlignTextCenterIcon label="Align center" size="small" />}
							label="Align center"
							isSelected={currentAlignment === "center"}
							onClick={() => handleAlignment("center")}
						/>
						<DropdownMenuItem
							icon={<AlignTextRightIcon label="Align right" size="small" />}
							label="Align right"
							isSelected={currentAlignment === "right"}
							onClick={() => handleAlignment("right")}
						/>
					</DropdownMenuContainer>
				</div>
			) : null}
		</div>
	);
}
