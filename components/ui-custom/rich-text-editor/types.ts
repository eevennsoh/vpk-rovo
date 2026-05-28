"use client";

export type RichTextMentionCategory =
	| "skill"
	| "link"
	| "memory"
	| "trigger"
	| "tool";

export interface RichTextMentionItem {
	category: RichTextMentionCategory;
	id: string;
	label: string;
	description?: string;
}

export type RichTextMentionSources = Partial<
	Record<RichTextMentionCategory, readonly RichTextMentionItem[]>
>;

export interface RichTextEditorExtensionOptions {
	getMentionSources?: () => RichTextMentionSources | undefined;
}
