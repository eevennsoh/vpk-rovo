"use client";

import { Editor } from "@tiptap/react";

import { RichTextEditorBubbleMenu } from "@/components/ui-custom/rich-text-editor";
import { AIToolsSection } from "./ai-tools-section";

interface EditorBubbleMenuProps {
	editor: Editor;
}

export default function EditorBubbleMenu({ editor }: Readonly<EditorBubbleMenuProps>): React.ReactElement | null {
	return (
		<RichTextEditorBubbleMenu
			editor={editor}
			leadingSlot={<AIToolsSection />}
		/>
	);
}
