"use client";

import { useRouter } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { CategoryTabOption, WebsiteCategoryTab } from "@/app/data/category-tabs";

interface CategoryTabsProps {
	activeCategory?: WebsiteCategoryTab | null;
	options: ReadonlyArray<CategoryTabOption>;
}

export function CategoryTabs({ activeCategory, options }: Readonly<CategoryTabsProps>) {
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
					{options.map((cat) => (
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
