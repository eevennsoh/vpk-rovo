import type { ComponentType } from "react";

export type DemoCategory =
	| "ui-audio"
	| "ui-ai"
	| "ui"
	| "blocks"
	| "projects"
	| "utility"
	| "visual";

const demoComponentCache = new Map<string, Promise<ComponentType | null>>();
const variantDemoComponentCache = new Map<string, Promise<ComponentType | null>>();
const variantDemoListCache = new Map<string, Promise<Array<ComponentType | null>>>();

function getDemoCacheKey(slug: string, category: DemoCategory): string {
	return `${category}:${slug}`;
}

export function loadDemoComponent(
	slug: string,
	category: DemoCategory,
): Promise<ComponentType | null> {
	const cacheKey = getDemoCacheKey(slug, category);
	const cached = demoComponentCache.get(cacheKey);
	if (cached) {
		return cached;
	}

	const promise = import("@/components/website/registry").then((module) => {
		return module.getDemoComponent(slug, category);
	});
	demoComponentCache.set(cacheKey, promise);
	return promise;
}

export function loadVariantDemoComponent(
	slug: string,
	category: DemoCategory,
): Promise<ComponentType | null> {
	const cacheKey = getDemoCacheKey(slug, category);
	const cached = variantDemoComponentCache.get(cacheKey);
	if (cached) {
		return cached;
	}

	const promise = import("@/components/website/registry").then((module) => {
		return module.getVariantDemoComponent(slug, category);
	});
	variantDemoComponentCache.set(cacheKey, promise);
	return promise;
}

export function loadVariantDemoComponents(
	slugs: ReadonlyArray<string>,
	category: DemoCategory,
): Promise<Array<ComponentType | null>> {
	const cacheKey = `${category}:${slugs.join("|")}`;
	const cached = variantDemoListCache.get(cacheKey);
	if (cached) {
		return cached;
	}

	const promise = Promise.all(
		slugs.map((slug) => loadVariantDemoComponent(slug, category)),
	);
	variantDemoListCache.set(cacheKey, promise);
	return promise;
}
