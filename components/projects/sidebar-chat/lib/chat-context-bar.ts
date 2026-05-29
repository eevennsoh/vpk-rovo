export type ChatContextBarIconName = "agent" | "artifact" | "board" | "work-item";
export type ChatContextBarVariant = "context" | "edit";

export interface ChatContextBarDescriptor {
	label: string;
	iconName: ChatContextBarIconName;
	signature: string;
	variant?: ChatContextBarVariant;
	/** Avatar image rendered in place of the icon (e.g. an agent avatar). */
	avatarSrc?: string;
	/** When true, the bar can collapse to a pill trigger and re-expand. */
	collapsible?: boolean;
	/** Label shown on the collapsed pill trigger (e.g. "Edit agent"). */
	collapsedLabel?: string;
}
