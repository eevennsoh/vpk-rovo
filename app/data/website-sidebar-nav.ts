import type { NavItem, NavSection } from "@/components/website/website-sidebar-nav";
import { ART_COMPONENTS, AUDIO_COMPONENTS, AI_COMPONENTS, UI_COMPONENTS, BLOCK_COMPONENTS, PROJECT_COMPONENTS, UTILITY_COMPONENTS, VISUAL_COMPONENTS } from "@/app/data/component-manifest";
import { buildNavItems, UI_GROUPS, BLOCK_GROUPS, VISUAL_GROUPS } from "@/app/data/nav-utils";
import { resolveAiAdsPackage, resolveBlockAdsPackage, resolveUiAdsPackage, resolveUiAdsTagVariant } from "@/app/data/nav-ads";

export const WEBSITE_STATIC_PAGES: NavItem[] = [];

export const WEBSITE_NAV_SECTIONS: NavSection[] = [
	{
		title: "Projects",
		href: "/projects",
		defaultOpen: false,
		items: PROJECT_COMPONENTS.map((component) => ({
			name: component.name,
			href: `/components/projects/${component.slug}`,
		})),
	},
	{
		title: "Arts",
		href: "/arts",
		defaultOpen: false,
		items: ART_COMPONENTS.map((component) => ({
			name: component.name,
			href: `/components/arts/${component.slug}`,
		})),
	},
	{
		title: "UI",
		href: "/ui",
		defaultOpen: false,
		items: buildNavItems(UI_COMPONENTS, "/components/ui/", UI_GROUPS, resolveUiAdsPackage, resolveUiAdsTagVariant),
	},
	{
		title: "UI — Audio",
		href: "/ui-audio",
		defaultOpen: false,
		items: AUDIO_COMPONENTS.map((component) => ({
			name: component.name,
			href: `/components/ui-audio/${component.slug}`,
		})),
	},
	{
		title: "UI — AI",
		href: "/ui-ai",
		defaultOpen: false,
		items: AI_COMPONENTS.map((component) => ({
			name: component.name,
			href: `/components/ui-ai/${component.slug}`,
			adsPackage: resolveAiAdsPackage(component.slug),
		})),
	},
	{
		title: "Blocks",
		href: "/blocks",
		defaultOpen: false,
		items: buildNavItems(BLOCK_COMPONENTS, "/components/blocks/", BLOCK_GROUPS, resolveBlockAdsPackage),
	},
	{
		title: "Utils",
		href: "/utility",
		defaultOpen: false,
		items: UTILITY_COMPONENTS.map((component) => ({
			name: component.name,
			href: `/components/utility/${component.slug}`,
		})),
	},
	{
		title: "Visual",
		href: "/visual",
		defaultOpen: false,
		items: buildNavItems(VISUAL_COMPONENTS, "/components/visual/", VISUAL_GROUPS),
	},
];
