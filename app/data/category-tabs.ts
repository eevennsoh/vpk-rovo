import {
	ART_COMPONENTS,
	AUDIO_COMPONENTS,
	AI_COMPONENTS,
	BLOCK_COMPONENTS,
	PROJECT_COMPONENTS,
	UI_COMPONENTS,
	UTILITY_COMPONENTS,
	VISUAL_COMPONENTS,
} from "@/app/data/component-manifest";

export type WebsiteCategoryTab =
	| "ui"
	| "ui-audio"
	| "ui-ai"
	| "blocks"
	| "projects"
	| "arts"
	| "utility"
	| "visual";

export interface CategoryTabOption {
	key: WebsiteCategoryTab;
	title: string;
	count: number;
}

export const CATEGORY_TAB_OPTIONS: ReadonlyArray<CategoryTabOption> = [
	{ key: "projects", title: "Projects", count: PROJECT_COMPONENTS.length },
	{ key: "arts", title: "Arts", count: ART_COMPONENTS.length },
	{ key: "ui", title: "UI", count: UI_COMPONENTS.length },
	{ key: "ui-audio", title: "UI — Audio", count: AUDIO_COMPONENTS.length },
	{ key: "ui-ai", title: "UI — AI", count: AI_COMPONENTS.length },
	{ key: "blocks", title: "Blocks", count: BLOCK_COMPONENTS.length },
	{ key: "utility", title: "Utils", count: UTILITY_COMPONENTS.length },
	{ key: "visual", title: "Visual", count: VISUAL_COMPONENTS.length },
];
