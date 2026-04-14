"use client";

import { Editor } from "@tiptap/react";
import QuotationMarkIcon from "@atlaskit/icon/core/quotation-mark";
import TextHeadingFiveIcon from "@atlaskit/icon-lab/core/text-heading-five";
import TextHeadingFourIcon from "@atlaskit/icon-lab/core/text-heading-four";
import TextHeadingOneIcon from "@atlaskit/icon-lab/core/text-heading-one";
import TextHeadingSixIcon from "@atlaskit/icon-lab/core/text-heading-six";
import TextHeadingThreeIcon from "@atlaskit/icon-lab/core/text-heading-three";
import TextHeadingTwoIcon from "@atlaskit/icon-lab/core/text-heading-two";
import TextIcon from "@atlaskit/icon/core/text";

type TextStyleType = "normal" | "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "quote";

interface UseTextStyleResult {
	currentStyle: string;
	currentIcon: typeof TextIcon;
	setTextStyle: (style: TextStyleType) => void;
}

export function useTextStyle(editor: Editor): UseTextStyleResult {
	function getCurrentTextStyle(): string {
		if (editor.isActive("heading", { level: 1 })) return "Heading 1";
		if (editor.isActive("heading", { level: 2 })) return "Heading 2";
		if (editor.isActive("heading", { level: 3 })) return "Heading 3";
		if (editor.isActive("heading", { level: 4 })) return "Heading 4";
		if (editor.isActive("heading", { level: 5 })) return "Heading 5";
		if (editor.isActive("heading", { level: 6 })) return "Heading 6";
		if (editor.isActive("blockquote")) return "Quote";
		return "Normal text";
	}

	function getCurrentTextStyleIcon(): typeof TextIcon {
		if (editor.isActive("heading", { level: 1 })) return TextHeadingOneIcon;
		if (editor.isActive("heading", { level: 2 })) return TextHeadingTwoIcon;
		if (editor.isActive("heading", { level: 3 })) return TextHeadingThreeIcon;
		if (editor.isActive("heading", { level: 4 })) return TextHeadingFourIcon;
		if (editor.isActive("heading", { level: 5 })) return TextHeadingFiveIcon;
		if (editor.isActive("heading", { level: 6 })) return TextHeadingSixIcon;
		if (editor.isActive("blockquote")) return QuotationMarkIcon;
		return TextIcon;
	}

	function setTextStyle(style: TextStyleType): void {
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

	return {
		currentStyle: getCurrentTextStyle(),
		currentIcon: getCurrentTextStyleIcon(),
		setTextStyle,
	};
}

export type { TextStyleType };
