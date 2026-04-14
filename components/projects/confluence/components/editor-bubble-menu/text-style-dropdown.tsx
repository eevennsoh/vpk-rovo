"use client";

import React from "react";
import { Editor } from "@tiptap/react";
import { Button } from "@/components/ui/button";
import { DropdownMenuItem, DropdownMenuContainer } from "./dropdown-menu-item";
import { useTextStyle, type TextStyleType } from "./hooks/use-text-style";
import { DROPDOWN_POSITIONS } from "../../data/editor-colors";
import QuotationMarkIcon from "@atlaskit/icon/core/quotation-mark";
import TextHeadingOneIcon from "@atlaskit/icon-lab/core/text-heading-one";
import TextHeadingThreeIcon from "@atlaskit/icon-lab/core/text-heading-three";
import TextHeadingTwoIcon from "@atlaskit/icon-lab/core/text-heading-two";
import TextIcon from "@atlaskit/icon/core/text";

interface TextStyleDropdownProps {
	ref?: React.Ref<HTMLDivElement>;
	editor: Editor;
	isOpen: boolean;
	onToggle: () => void;
	onClose: () => void;
}

export function TextStyleDropdown({ ref, editor, isOpen, onToggle, onClose }: Readonly<TextStyleDropdownProps>) {
	const { currentStyle, currentIcon: CurrentIcon, setTextStyle } = useTextStyle(editor);

	function handleStyleSelect(style: TextStyleType): void {
		setTextStyle(style);
		onClose();
	}

	const position = DROPDOWN_POSITIONS.textStyle;

	return (
		<div style={{ position: "relative" }}>
			<Button
				aria-label={currentStyle}
				size="icon-sm"
				variant="ghost"
				onClick={onToggle}
			>
				<CurrentIcon label="" size="small" />
			</Button>

			{isOpen ? (
				<div ref={ref}>
					<DropdownMenuContainer top={position.top} left={position.left}>
						<DropdownMenuItem
							icon={<TextIcon label="Normal text" size="small" />}
							label="Normal text"
							isSelected={editor.isActive("paragraph")}
							onClick={() => handleStyleSelect("normal")}
						/>
						<DropdownMenuItem
							icon={<TextHeadingOneIcon label="Heading 1" size="small" />}
							label="Heading 1"
							isSelected={editor.isActive("heading", { level: 1 })}
							onClick={() => handleStyleSelect("h1")}
							fontSize="18px"
							fontWeight={600}
						/>
						<DropdownMenuItem
							icon={<TextHeadingTwoIcon label="Heading 2" size="small" />}
							label="Heading 2"
							isSelected={editor.isActive("heading", { level: 2 })}
							onClick={() => handleStyleSelect("h2")}
							fontSize="16px"
							fontWeight={600}
						/>
						<DropdownMenuItem
							icon={<TextHeadingThreeIcon label="Heading 3" size="small" />}
							label="Heading 3"
							isSelected={editor.isActive("heading", { level: 3 })}
							onClick={() => handleStyleSelect("h3")}
							fontSize="14px"
							fontWeight={600}
						/>
						<DropdownMenuItem
							icon={<QuotationMarkIcon label="Quote" size="small" />}
							label="Quote"
							isSelected={editor.isActive("blockquote")}
							onClick={() => handleStyleSelect("quote")}
						/>
					</DropdownMenuContainer>
				</div>
			) : null}
		</div>
	);
}
