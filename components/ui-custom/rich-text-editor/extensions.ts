"use client";

import Color from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import Underline from "@tiptap/extension-underline";
import StarterKit from "@tiptap/starter-kit";

export function createRichTextEditorExtensions() {
	return [
		StarterKit.configure({
			link: false,
			underline: false,
		}),
		Underline,
		Link.configure({
			openOnClick: false,
			HTMLAttributes: {
				class: "editor-link",
			},
		}),
		TextAlign.configure({
			types: ["heading", "paragraph"],
			alignments: ["left", "center", "right"],
		}),
		TextStyle,
		Color,
		Highlight.configure({
			multicolor: true,
		}),
	];
}
