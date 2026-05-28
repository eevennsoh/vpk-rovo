"use client";

import { Extension, mergeAttributes } from "@tiptap/core";
import Color from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import Link from "@tiptap/extension-link";
import Mention from "@tiptap/extension-mention";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import Underline from "@tiptap/extension-underline";
import { Markdown } from "@tiptap/markdown";
import { PluginKey } from "@tiptap/pm/state";
import { Suggestion } from "@tiptap/suggestion";
import StarterKit from "@tiptap/starter-kit";

import {
	SLASH_COMMANDS,
	createMentionSuggestionRenderer,
	createSlashSuggestionRenderer,
	type RichTextCommandItem,
} from "./suggestion-menu";
import type {
	RichTextEditorExtensionOptions,
	RichTextMentionItem,
} from "./types";

const slashCommandPluginKey = new PluginKey("rich-text-slash-command");

const SlashCommand = Extension.create<RichTextEditorExtensionOptions>({
	name: "slashCommand",

	addProseMirrorPlugins() {
		return [
			Suggestion<RichTextCommandItem, RichTextCommandItem>({
				editor: this.editor,
				char: "/",
				pluginKey: slashCommandPluginKey,
				items: ({ query }) => {
					const normalizedQuery = query.trim().toLowerCase();
					if (!normalizedQuery) {
						return [...SLASH_COMMANDS];
					}

					return SLASH_COMMANDS.filter((item) => (
						`${item.label} ${item.description ?? ""}`.toLowerCase()
							.includes(normalizedQuery)
					));
				},
				command: ({ editor, range, props }) => {
					editor.chain().focus().deleteRange(range).run();
					props.run(editor);
				},
				render: createSlashSuggestionRenderer,
			}),
		];
	},
});

function getMentionCategory(id: unknown): string {
	if (typeof id !== "string") {
		return "context";
	}

	return id.split(":")[0] || "context";
}

export function createRichTextEditorExtensions(
	options: RichTextEditorExtensionOptions = {},
) {
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
		Mention.configure({
			HTMLAttributes: {
				class: "rich-text-mention",
			},
			deleteTriggerWithBackspace: true,
			renderText: ({ node }) => `@${node.attrs.label ?? node.attrs.id}`,
			renderHTML: ({ node, options: mentionOptions }) => [
				"span",
				mergeAttributes(
					mentionOptions.HTMLAttributes,
					{
						"data-mention-category": getMentionCategory(node.attrs.id),
						"data-type": "mention",
					},
				),
				node.attrs.label ?? node.attrs.id,
			],
			suggestion: {
				char: "@",
				items: () => [],
				command: ({ editor, range, props }) => {
					const mention = props as RichTextMentionItem;
					editor
						.chain()
						.focus()
						.insertContentAt(range, [
							{
								type: "mention",
								attrs: {
									id: mention.id,
									label: mention.label,
									mentionSuggestionChar: "@",
								},
							},
							{ type: "text", text: " " },
						])
						.run();
				},
				render: () => createMentionSuggestionRenderer(options.getMentionSources),
			},
		}),
		SlashCommand.configure(options),
		Markdown.configure({
			indentation: {
				style: "tab",
				size: 1,
			},
		}),
	];
}
