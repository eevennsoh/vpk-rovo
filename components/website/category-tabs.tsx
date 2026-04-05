"use client";

import { useRouter } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AUDIO_COMPONENTS, AI_COMPONENTS, UI_COMPONENTS, BLOCK_COMPONENTS, PROJECT_COMPONENTS, UTILITY_COMPONENTS, VISUAL_COMPONENTS } from "@/app/data/component-manifest";

export type WebsiteCategoryTab = "ui" | "ui-audio" | "ui-ai" | "blocks" | "projects" | "utility" | "visual";

const CATEGORY_OPTIONS: ReadonlyArray<{ key: WebsiteCategoryTab; title: string; count: number }> = [
	{ key: "projects", title: "Projects", count: PROJECT_COMPONENTS.length },
	{ key: "ui", title: "UI", count: UI_COMPONENTS.length },
	{ key: "ui-audio", title: "UI — Audio", count: AUDIO_COMPONENTS.length },
	{ key: "ui-ai", title: "UI — AI", count: AI_COMPONENTS.length },
	{ key: "blocks", title: "Blocks", count: BLOCK_COMPONENTS.length },
	{ key: "utility", title: "Utils", count: UTILITY_COMPONENTS.length },
	{ key: "visual", title: "Visual", count: VISUAL_COMPONENTS.length },
];

interface CategoryTabsProps {
	activeCategory?: WebsiteCategoryTab | null;
}

export function CategoryTabs({ activeCategory }: Readonly<CategoryTabsProps>) {
	const router = useRouter();

	function handleCategoryChange(value: string) {
		router.push(`/${value}`);
	}

	return (
		<div className="w-full overflow-x-auto">
			<Tabs
				value={activeCategory ?? "__none__"}
				onValueChange={handleCategoryChange}
			>
				<TabsList className="min-w-max">
					{CATEGORY_OPTIONS.map((cat) => (
						<TabsTrigger
							key={cat.key}
							id={`home-category-tab-${cat.key}`}
							value={cat.key}
							className="gap-2 px-3"
						>
							<span>{cat.title}</span>
							<span className="text-xs text-text-subtle">{cat.count}</span>
						</TabsTrigger>
					))}
				</TabsList>
			</Tabs>
		</div>
	);
}
