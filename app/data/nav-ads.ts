import { getAdsDisplayInfo } from "@/app/data/ads-equivalents";

const ADS_UI_DISCOVERY_SLUGS = new Set(["skill-card", "sidebar-nav-item"]);

const ADS_AI_SLUGS = new Set([
	"animated-dots",
	"animated-rovo",
	"artifact",
	"chain-of-thought",
	"code-block",
	"conversation",
	"message",
	"morphing-rovo",
	"plan",
	"prompt-input",
	"queue",
	"reasoning",
	"shimmer",
	"sources",
	"speech-input",
	"suggestion",
	"task",
	"tool",
]);

const ADS_BLOCK_SLUGS = new Set([
	"agent-progress",
	"answer-card",
	"top-navigation",
	"prompt-gallery",
	"make-artifact",
	"make-gallery",
	"make-grid",
	"make-item",
	"make-page",
	"generative-card",
	"chat-configuration",
	"product-sidebar",
	"sidebar-rail",
	"work-item-widget",
	"question-card",
	"approval-card",
	"terminal-switch",
]);

export function resolveUiAdsPackage(slug: string) {
	if (ADS_UI_DISCOVERY_SLUGS.has(slug)) {
		return "Atlassian Design System";
	}
	return getAdsDisplayInfo(slug)?.displayText ?? (slug === "switch" ? "Atlassian Design System" : undefined);
}

export function resolveUiAdsTagVariant(slug: string): "discovery" | undefined {
	return ADS_UI_DISCOVERY_SLUGS.has(slug) ? "discovery" : undefined;
}

export function resolveAiAdsPackage(slug: string) {
	return ADS_AI_SLUGS.has(slug) ? "Atlassian Design System" : undefined;
}

export function resolveBlockAdsPackage(slug: string) {
	return ADS_BLOCK_SLUGS.has(slug) ? "Atlassian Design System" : undefined;
}
