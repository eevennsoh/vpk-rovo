import type { NavItem } from "@/components/website/website-sidebar-nav";
import { getAdsDisplayInfo } from "@/app/data/ads-equivalents";
import { compareByNameNatural } from "@/lib/utils";

export interface ComponentLike {
	name: string;
	slug: string;
}

function toTitleCase(slug: string): string {
	return slug
		.split("-")
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(" ");
}

function sortNavItemsByName(items: readonly NavItem[]): NavItem[] {
	return [...items]
		.map((item) => ({
			...item,
			children: item.children ? sortNavItemsByName(item.children) : undefined,
		}))
		.sort(compareByNameNatural);
}

/**
 * Maps a parent slug to the slugs of its children.
 * Children will be nested under the parent in the sidebar.
 */
export const UI_GROUPS: Record<string, string[]> = {
	// Intentionally flat: expose all UI components directly in the sidebar.
};

export const VISUAL_GROUPS: Record<string, string[]> = {
	shaders: ["particles", "wave-gradient", "liquid-gradient", "bands", "rings", "blockify", "pixels", "truchet", "fluted-glass", "liquid-glass", "holo", "mesh", "mesh-02", "chromatic-aberration"],
};

export const BLOCK_GROUPS: Record<string, string[]> = {
	sidebar: [
		"app-sidebar",
		"sidebar-01",
		"sidebar-02",
		"sidebar-03",
		"sidebar-04",
		"sidebar-05",
		"sidebar-06",
		"sidebar-07",
		"sidebar-08",
		"sidebar-09",
		"sidebar-10",
		"sidebar-11",
		"sidebar-12",
		"sidebar-13",
		"sidebar-14",
		"sidebar-15",
		"sidebar-16",
	],
	login: ["login-01", "login-02", "login-03", "login-04", "login-05"],
	signup: ["signup-01", "signup-02", "signup-03", "signup-04", "signup-05"],
};

/**
 * Transforms a flat list of components into a nested NavItem array,
 * grouping children under their parent according to the groups config.
 */
export function buildNavItems(
	components: readonly ComponentLike[],
	hrefPrefix: string,
	groups: Record<string, string[]>,
	adsResolver?: (slug: string) => string | undefined,
	adsTagVariantResolver?: (slug: string) => NavItem["adsTagVariant"],
): NavItem[] {
	const childSlugs = new Set<string>();
	for (const children of Object.values(groups)) {
		for (const slug of children) {
			childSlugs.add(slug);
		}
	}

	const resolveAds =
		adsResolver ??
		((slug: string) => {
			return getAdsDisplayInfo(slug)?.displayText ?? (slug === "switch" ? "Atlassian Design System" : undefined);
		});

	const componentsBySlug = new Map<string, ComponentLike>();
	for (const c of components) {
		componentsBySlug.set(c.slug, c);
	}

	const items: NavItem[] = [];

	// Track which group parents we've already emitted
	const emittedGroups = new Set<string>();

	for (const c of components) {
		if (childSlugs.has(c.slug)) {
			// Before emitting a child, check if its parent group hasn't been emitted yet.
			// This handles groups whose parent slug has no entry in the components array.
			for (const [parentSlug, children] of Object.entries(groups)) {
				if (children.includes(c.slug) && !emittedGroups.has(parentSlug)) {
					emittedGroups.add(parentSlug);
					items.push({
						name: toTitleCase(parentSlug),
						href: `${hrefPrefix}${parentSlug}`,
						expandOnly: true,
						children: children
							.map((slug) => componentsBySlug.get(slug))
							.filter((child): child is ComponentLike => child != null)
							.map((child) => ({
								name: child.name,
								href: `${hrefPrefix}${child.slug}`,
								adsPackage: resolveAds(child.slug),
								adsTagVariant: adsTagVariantResolver?.(child.slug),
							})),
					});
				}
			}
			continue;
		}

		// Skip if this parent group was already emitted by an earlier child
		if (emittedGroups.has(c.slug)) continue;

		const item: NavItem = {
			name: c.name,
			href: `${hrefPrefix}${c.slug}`,
			adsPackage: resolveAds(c.slug),
			adsTagVariant: adsTagVariantResolver?.(c.slug),
		};

		const childSlugsForParent = groups[c.slug];
		if (childSlugsForParent) {
			emittedGroups.add(c.slug);
			item.children = childSlugsForParent
				.map((slug) => componentsBySlug.get(slug))
				.filter((child): child is ComponentLike => child != null)
				.map((child) => ({
					name: child.name,
					href: `${hrefPrefix}${child.slug}`,
					adsPackage: resolveAds(child.slug),
					adsTagVariant: adsTagVariantResolver?.(child.slug),
				}));
		}

		items.push(item);
	}

	return sortNavItemsByName(items);
}
