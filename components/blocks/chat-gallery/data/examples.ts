export interface ChatGalleryExample {
	iconPath: string;
	title: string;
	description: string;
	useCase: string;
	role: string;
	prompt?: string;
}

export { DEFAULT_CHAT_GALLERY_EXAMPLES, CHAT_GALLERY_USE_CASE_OPTIONS, CHAT_GALLERY_ROLE_OPTIONS } from "./example-data";

export function getExamplePrompt(example: ChatGalleryExample): string {
	return example.prompt ?? `${example.title}. ${example.description}`;
}
