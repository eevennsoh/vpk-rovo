import type { ReactNode } from "react";
import Image from "next/image";
import { Tile } from "@/components/ui/tile";
import { token } from "@/lib/tokens";
import { defaultSuggestions, type RovoSuggestion } from "@/lib/rovo-suggestions";
import type { GenerativeContentType } from "@/components/projects/shared/lib/generative-widget";
import { ICON_REGISTRY } from "./icon-registry";

const SUGGESTION_BY_ID: ReadonlyMap<string, RovoSuggestion> = new Map(
	defaultSuggestions.map((suggestion) => [suggestion.id, suggestion])
);

const BLUE_ICON_SUGGESTION_IDS = new Set(["work-last-7-days", "draft-confluence-page"]);

/**
 * Maps contentType values to their icon registry key.
 * Used as fallback when no iconHint is provided.
 */
const CONTENT_TYPE_TO_ICON: ReadonlyMap<GenerativeContentType, string> = new Map([
	["image", "image"],
	["text", "text"],
	["translation", "translate"],
	["message", "comment"],
	["chart-bar", "chart-bar"],
	["chart-line", "chart-trend"],
	["chart-area", "chart-trend"],
	["chart-pie", "chart-pie"],
	["chart-radar", "chart-matrix"],
	["chart-scatter", "chart-bubble"],
	["chart", "chart-bar"],
	["feed", "feed"],
	["sound", "audio"],
	["video", "video"],
	["calendar", "calendar"],
	["work-item", "work-item"],
	["page", "page"],
	["board", "board"],
	["table", "table"],
	["code", "angle-brackets"],
	["ui", "file"],
]);

const DEFAULT_ICON_NAME = "lab/generative-indicator";

function getSuggestionById(id: string): RovoSuggestion | null {
	return SUGGESTION_BY_ID.get(id) ?? null;
}

function resolveSuggestionIconColor(suggestionId: string): string {
	return BLUE_ICON_SUGGESTION_IDS.has(suggestionId)
		? token("color.icon.accent.blue")
		: token("color.icon.subtlest");
}

function resolveGreetingSuggestion({
	contentType,
	title,
	description,
	sourceName,
	hintText,
}: Readonly<{
	contentType: GenerativeContentType;
	title?: string;
	description?: string;
	sourceName?: string;
	hintText?: string;
}>): RovoSuggestion | null {
	const searchText = [title, description, sourceName, hintText]
		.filter((value): value is string => typeof value === "string" && value.trim().length > 0)
		.join(" ")
		.toLowerCase();

	if (/\bfigma\b/.test(searchText)) {
		return getSuggestionById("figma-design-context");
	}

	if (/\bslack\b/.test(searchText)) {
		return getSuggestionById("send-slack-message");
	}

	if (/\bgoogle\s+calendar\b|\bcalendar\s+events?\b/.test(searchText)) {
		return getSuggestionById("list-google-calendar-events");
	}

	if (contentType === "translation" || /\btranslate|translation\b/.test(searchText)) {
		return getSuggestionById("translate-text");
	}

	if (
		contentType === "work-item" &&
		/\bwork\s*summary\b|\blast\s*7\s*days?\b|\brecent\s+work\b/.test(searchText)
	) {
		return getSuggestionById("work-last-7-days");
	}

	if (
		contentType === "page" &&
		/\bconfluence\b|\bdraft\b/.test(searchText)
	) {
		return getSuggestionById("draft-confluence-page");
	}

	return null;
}

function renderGreetingSuggestionIcon(suggestion: RovoSuggestion): ReactNode {
	if (suggestion.imageSrc) {
		return (
			<Image
				src={suggestion.imageSrc}
				alt={suggestion.label}
				width={16}
				height={16}
				className="size-4 object-contain"
			/>
		);
	}

	const IconComponent = suggestion.icon;
	if (!IconComponent) {
		return null;
	}

	return (
		<IconComponent
			label={suggestion.label}
			color={resolveSuggestionIconColor(suggestion.id)}
			size="small"
		/>
	);
}

function renderRegistryIcon(iconName: string): ReactNode {
	const IconComponent = ICON_REGISTRY.get(iconName);
	if (!IconComponent) return null;
	return <IconComponent label="" size="small" />;
}

function renderContentTypeIcon(contentType: GenerativeContentType): ReactNode {
	const iconName = CONTENT_TYPE_TO_ICON.get(contentType) ?? DEFAULT_ICON_NAME;
	return renderRegistryIcon(iconName) ?? renderRegistryIcon(DEFAULT_ICON_NAME);
}

export function ContentTypeTile({
	contentType,
	label,
	size = "medium",
	title,
	description,
	sourceName,
	sourceLogoSrc,
	iconHint,
	hintText,
}: Readonly<{
	contentType: GenerativeContentType;
	label: string;
	size?: "medium" | "large";
	title?: string;
	description?: string;
	sourceName?: string;
	sourceLogoSrc?: string;
	iconHint?: string;
	hintText?: string;
}>): ReactNode {
	const normalizedSourceLogoSrc =
		typeof sourceLogoSrc === "string" && sourceLogoSrc.trim().length > 0
			? sourceLogoSrc.trim()
			: null;
	const matchedGreetingSuggestion = resolveGreetingSuggestion({
		contentType,
		title,
		description,
		sourceName,
		hintText,
	});

	// Icon resolution priority:
	// 1. sourceLogoSrc (explicit image)
	// 2. iconHint from AI (looked up in ICON_REGISTRY)
	// 3. Greeting suggestion match
	// 4. contentType mapped to icon name via ICON_REGISTRY
	// 5. Default generative-indicator sparkle
	let icon: ReactNode = null;

	if (normalizedSourceLogoSrc) {
		icon = (
			<Image
				src={normalizedSourceLogoSrc}
				alt={sourceName || label}
				width={16}
				height={16}
				className="size-4 object-contain"
			/>
		);
	} else if (iconHint && ICON_REGISTRY.has(iconHint)) {
		icon = renderRegistryIcon(iconHint);
	} else if (matchedGreetingSuggestion) {
		icon = renderGreetingSuggestionIcon(matchedGreetingSuggestion) ?? renderContentTypeIcon(contentType);
	} else {
		icon = renderContentTypeIcon(contentType);
	}

	return (
		<Tile label={label} size={size} variant="transparent" hasBorder className="text-icon-subtle [&_img]:!size-4 [&_span]:!size-4 [&_svg]:!size-4">
			{icon}
		</Tile>
	);
}
