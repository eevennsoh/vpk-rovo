export type ChatContextBarIconName = "artifact" | "board" | "work-item";
export type ChatContextBarVariant = "context" | "edit";

export interface ChatContextBarDescriptor {
	label: string;
	iconName: ChatContextBarIconName;
	signature: string;
	variant?: ChatContextBarVariant;
}
