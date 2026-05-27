"use client";

import type { ComponentProps, CSSProperties, ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";

import { cn } from "@/lib/utils";

import { createRichTextEditorExtensions } from "./extensions";
import "./rich-text-editor.css";
import { RichTextEditorBubbleMenu, RichTextEditorToolbar } from "./toolbar";

const BLOCK_SEPARATOR = "\n";

interface RichTextEditorProps
	extends Omit<ComponentProps<"div">, "onChange"> {
	value?: string;
	placeholder?: string;
	editorClassName?: string;
	contentClassName?: string;
	toolbarEndSlot?: ReactNode;
	onPlainTextChange?: (value: string) => void;
	showToolbar?: boolean;
	showBubbleMenu?: boolean;
	showCommentControl?: boolean;
	showMoreControl?: boolean;
	"aria-label"?: string;
}

function escapeHtml(value: string): string {
	return value
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#39;");
}

function plainTextToEditorHtml(value: string | undefined): string {
	const text = value ?? "";

	if (!text.trim()) {
		return "";
	}

	return text
		.split(/\n{2,}/)
		.map((block) => `<p>${escapeHtml(block).replace(/\n/g, "<br>")}</p>`)
		.join("");
}

function toCssString(value: string): string {
	return JSON.stringify(value);
}

function getEditorPlainText(editor: NonNullable<ReturnType<typeof useEditor>>): string {
	return editor.getText({ blockSeparator: BLOCK_SEPARATOR });
}

export function RichTextEditor({
	value,
	placeholder,
	className,
	editorClassName,
	contentClassName,
	toolbarEndSlot,
	onPlainTextChange,
	showToolbar = true,
	showBubbleMenu = true,
	showCommentControl = true,
	showMoreControl = true,
	"aria-label": ariaLabel,
	...props
}: Readonly<RichTextEditorProps>) {
	const onPlainTextChangeRef = useRef(onPlainTextChange);
	const [isEmpty, setIsEmpty] = useState(() => !value?.trim());
	const extensions = useMemo(() => createRichTextEditorExtensions(), []);
	const editor = useEditor({
		extensions,
		content: plainTextToEditorHtml(value),
		immediatelyRender: false,
		editorProps: {
			attributes: {
				"aria-label": ariaLabel ?? "Rich text editor",
				class: cn("tiptap-editor", editorClassName),
			},
		},
		onUpdate: ({ editor: activeEditor }) => {
			setIsEmpty(activeEditor.isEmpty);
			onPlainTextChangeRef.current?.(getEditorPlainText(activeEditor));
		},
	});

	useEffect(() => {
		onPlainTextChangeRef.current = onPlainTextChange;
	}, [onPlainTextChange]);

	useEffect(() => {
		if (!editor) {
			return;
		}

		const nextValue = value ?? "";

		if (getEditorPlainText(editor) === nextValue) {
			return;
		}

		editor.commands.setContent(plainTextToEditorHtml(nextValue), {
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
			</div>
		</div>
	);
}

export { RichTextEditorBubbleMenu, RichTextEditorToolbar };
