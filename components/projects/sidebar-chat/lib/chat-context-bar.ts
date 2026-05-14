export type ChatContextBarIconName = "board" | "work-item";

export interface ChatContextBarDescriptor {
	label: string;
	iconName: ChatContextBarIconName;
	signature: string;
}
