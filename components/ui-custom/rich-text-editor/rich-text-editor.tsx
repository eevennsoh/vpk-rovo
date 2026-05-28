"use client";

import type { ComponentProps, CSSProperties, ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";

import { cn } from "@/lib/utils";

import { createRichTextEditorExtensions } from "./extensions";
import "./rich-text-editor.css";
import {
	RichTextEditorBubbleMenu,
	RichTextEditorFloatingMenu,
	RichTextEditorToolbar,
} from "./toolbar";
import type { RichTextMentionSources } from "./types";

interface RichTextEditorProps
	extends Omit<ComponentProps<"div">, "onChange"> {
	value?: string;
	placeholder?: string;
	editorClassName?: string;
	contentClassName?: string;
	toolbarEndSlot?: ReactNode;
	mentionSources?: RichTextMentionSources;
	onMarkdownChange?: (value: string) => void;
	onPlainTextChange?: (value: string) => void;
	showToolbar?: boolean;
	showBubbleMenu?: boolean;
	showFloatingMenu?: boolean;
	showCommentControl?: boolean;
	showMoreControl?: boolean;
	"aria-label"?: string;
}

function toCssString(value: string): string {
	return JSON.stringify(value);
}

export function RichTextEditor({
	value,
	placeholder,
	className,
	editorClassName,
	contentClassName,
	toolbarEndSlot,
	mentionSources,
	onMarkdownChange,
	onPlainTextChange,
	showToolbar = true,
	showBubbleMenu = true,
	showFloatingMenu = false,
	showCommentControl = true,
	showMoreControl = true,
	"aria-label": ariaLabel,
	...props
}: Readonly<RichTextEditorProps>) {
	const mentionSourcesRef = useRef(mentionSources);
	const onMarkdownChangeRef = useRef(onMarkdownChange);
	const onPlainTextChangeRef = useRef(onPlainTextChange);
	const [isEmpty, setIsEmpty] = useState(() => !value?.trim());
	const extensions = useMemo(
		() => createRichTextEditorExtensions({
			getMentionSources: () => mentionSourcesRef.current,
		}),
		[],
	);
	const editor = useEditor({
		extensions,
		content: value ?? "",
		contentType: "markdown",
		immediatelyRender: false,
		editorProps: {
			attributes: {
				"aria-label": ariaLabel ?? "Rich text editor",
				class: cn("tiptap-editor", editorClassName),
			},
		},
		onUpdate: ({ editor: activeEditor }) => {
			setIsEmpty(activeEditor.isEmpty);
			const markdown = activeEditor.getMarkdown();
			onMarkdownChangeRef.current?.(markdown);
			onPlainTextChangeRef.current?.(markdown);
		},
	});

	useEffect(() => {
		mentionSourcesRef.current = mentionSources;
	}, [mentionSources]);

	useEffect(() => {
		onMarkdownChangeRef.current = onMarkdownChange;
	}, [onMarkdownChange]);

	useEffect(() => {
		onPlainTextChangeRef.current = onPlainTextChange;
	}, [onPlainTextChange]);

	useEffect(() => {
		if (!editor) {
			return;
		}

		const nextValue = value ?? "";

		if (editor.getMarkdown() === nextValue) {
			return;
		}

		editor.commands.setContent(nextValue, {
			contentType: "markdown",
			emitUpdate: false,
		});
		setIsEmpty(!nextValue.trim());
	}, [editor, value]);

	return (
		<div className={cn("space-y-2", className)} {...props}>
			{showToolbar && editor ? (
				<RichTextEditorToolbar
					editor={editor}
					endSlot={toolbarEndSlot}
					showCommentControl={showCommentControl}
					showMoreControl={showMoreControl}
				/>
			) : null}
			<div
				className={cn("rich-text-editor-content relative", contentClassName)}
				data-empty={isEmpty ? "true" : undefined}
				style={
					placeholder
						? ({
								"--rich-text-placeholder": toCssString(placeholder),
							} as CSSProperties)
						: undefined
					}
				>
				<EditorContent editor={editor} />
				{showBubbleMenu && editor ? (
					<RichTextEditorBubbleMenu
						editor={editor}
						showCommentControl={showCommentControl}
						showMoreControl={showMoreControl}
					/>
				) : null}
				{showFloatingMenu && editor ? (
					<RichTextEditorFloatingMenu
						editor={editor}
						showCommentControl={showCommentControl}
						showMoreControl={showMoreControl}
					/>
				) : null}
			</div>
		</div>
	);
}

export {
	RichTextEditorBubbleMenu,
	RichTextEditorFloatingMenu,
	RichTextEditorToolbar,
};
export type { RichTextMentionSources };
