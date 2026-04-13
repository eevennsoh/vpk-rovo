import type { AtlassianLogoName } from "@/components/ui/logo";
import type { IconTileVariant } from "@/components/ui/icon-tile";
import type { GenerativeContentType } from "@/components/projects/shared/lib/generative-widget";

type ArtifactVisualIdentityKind = "text" | "code" | "image" | "sheet" | "react" | "excalidraw" | "browser";

export const VISUAL_IDENTITY_TILE_VARIANTS = [
	"gray",
	"blue",
	"teal",
	"green",
	"lime",
	"yellow",
	"orange",
	"red",
	"magenta",
	"purple",
] as const satisfies ReadonlyArray<IconTileVariant>;

export type VisualIdentityTileVariant = (typeof VISUAL_IDENTITY_TILE_VARIANTS)[number];

export interface VisualIdentity {
	iconName: string;
	tileVariant: VisualIdentityTileVariant;
}

export type ResolvedCardIdentity =
	| { kind: "external-logo"; logoSrc: string }
	| { kind: "atlassian-logo"; logoName: AtlassianLogoName }
	| { kind: "icon-tile"; iconName: string; tileVariant: VisualIdentityTileVariant };

export interface GeneratedCardIdentityInput {
	contentType: GenerativeContentType;
	title?: string;
	description?: string;
	sourceName?: string;
	sourceLogoSrc?: string;
	iconHint?: string;
	hintText?: string;
	identitySeed?: string;
}

export interface ArtifactCardIdentityInput {
	kind: ArtifactVisualIdentityKind;
	title?: string;
	description?: string;
	sourceName?: string;
	sourceLogoSrc?: string;
	iconHint?: string;
	hintText?: string;
	identitySeed?: string;
	visualIdentity?: VisualIdentity;
}

interface SemanticIdentityCatalogEntry {
	fallbackIconName: string;
	allowedHintAliases?: string[];
	sourceKeywords?: string[];
}

const DEFAULT_VISUAL_IDENTITY: VisualIdentity = {
	iconName: "lab/generative-indicator",
	tileVariant: "gray",
};

export const DEFAULT_VISUAL_IDENTITY_ICON_NAME = DEFAULT_VISUAL_IDENTITY.iconName;

const GENERATED_CARD_CONTENT_CATALOG: Record<
	GenerativeContentType,
	SemanticIdentityCatalogEntry
> = {
	image: {
		fallbackIconName: "image",
		allowedHintAliases: ["photo", "picture", "illustration", "mockup", "banner"],
	},
	memory: {
		fallbackIconName: "database",
		allowedHintAliases: ["memory", "recall", "persistent memory"],
	},
	skill: {
		fallbackIconName: "skill",
		allowedHintAliases: ["skill", "procedural memory", "tooling"],
	},
	text: {
		fallbackIconName: "text",
		allowedHintAliases: ["summary", "draft", "notes", "transcript"],
	},
	translation: {
		fallbackIconName: "translate",
		allowedHintAliases: ["translation", "translate"],
	},
	message: {
		fallbackIconName: "comment",
		allowedHintAliases: ["comment", "chat", "reply"],
		sourceKeywords: ["slack"],
	},
	calendar: {
		fallbackIconName: "calendar",
		allowedHintAliases: ["calendar", "events"],
		sourceKeywords: ["google calendar", "calendar"],
	},
	"chart-bar": {
		fallbackIconName: "chart-bar",
		allowedHintAliases: ["bar chart", "column chart", "histogram"],
	},
	"chart-line": {
		fallbackIconName: "chart-trend",
		allowedHintAliases: ["line chart", "trend chart", "time series"],
	},
	"chart-area": {
		fallbackIconName: "chart-trend",
		allowedHintAliases: ["area chart"],
	},
	"chart-pie": {
		fallbackIconName: "chart-pie",
		allowedHintAliases: ["pie chart", "donut chart", "doughnut chart"],
	},
	"chart-radar": {
		fallbackIconName: "chart-matrix",
		allowedHintAliases: ["radar chart", "spider chart"],
	},
	"chart-scatter": {
		fallbackIconName: "chart-bubble",
		allowedHintAliases: ["scatter plot", "scatter chart", "bubble chart"],
	},
	chart: {
		fallbackIconName: "chart-bar",
		allowedHintAliases: ["chart", "graph", "plot", "visualization"],
	},
	feed: {
		fallbackIconName: "feed",
		allowedHintAliases: ["feed", "news", "headlines"],
	},
	sound: {
		fallbackIconName: "audio",
		allowedHintAliases: ["audio", "sound", "voice", "narration"],
	},
	video: {
		fallbackIconName: "video",
		allowedHintAliases: ["video", "clip", "reel"],
	},
	"work-item": {
		fallbackIconName: "work-item",
		allowedHintAliases: ["work item", "task", "issue", "ticket", "bug", "story", "epic"],
		sourceKeywords: ["jira"],
	},
	page: {
		fallbackIconName: "page",
		allowedHintAliases: ["page", "document", "doc", "wiki", "article"],
		sourceKeywords: ["confluence"],
	},
	board: {
		fallbackIconName: "board",
		allowedHintAliases: ["board", "kanban", "sprint board"],
	},
	table: {
		fallbackIconName: "table",
		allowedHintAliases: ["table", "grid", "spreadsheet", "dataset"],
	},
	code: {
		fallbackIconName: "angle-brackets",
		allowedHintAliases: ["code", "snippet", "script", "sql", "json", "markdown"],
	},
	ui: {
		fallbackIconName: "file",
		allowedHintAliases: ["ui", "interface", "layout", "form", "app"],
	},
	other: {
		fallbackIconName: DEFAULT_VISUAL_IDENTITY.iconName,
		allowedHintAliases: ["sparkle", "generative"],
	},
};

const ATLASSIAN_LOGO_CATALOG: ReadonlyArray<{
	logoName: AtlassianLogoName;
	keywords: readonly string[];
}> = [
	{ logoName: "confluence", keywords: ["confluence", "wiki"] },
	{ logoName: "jira", keywords: ["jira"] },
	{ logoName: "bitbucket", keywords: ["bitbucket"] },
	{ logoName: "loom", keywords: ["loom"] },
	{ logoName: "rovo", keywords: ["rovo"] },
	{ logoName: "trello", keywords: ["trello"] },
	{ logoName: "statuspage", keywords: ["statuspage"] },
];

const EXTERNAL_LOGO_CATALOG: ReadonlyArray<{
	logoSrc: string;
	keywords: readonly string[];
}> = [
	{ logoSrc: "/3p/google-calendar/16-borderless.svg", keywords: ["google calendar", "gcal"] },
	{ logoSrc: "/3p/slack/16-borderless.svg", keywords: ["slack", "direct message"] },
	{ logoSrc: "/3p/figma/16.svg", keywords: ["figma"] },
];

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}

function hashString(value: string): number {
	let hash = 0;
	for (let index = 0; index < value.length; index += 1) {
		hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
	}
	return hash;
}

function normalizeText(value: string): string {
	return value
		.replace(/([a-z0-9])([A-Z])/g, "$1 $2")
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, " ")
		.trim();
}

function buildSearchText(values: Array<string | null | undefined>): string {
	return values
		.filter((value): value is string => typeof value === "string" && value.trim().length > 0)
		.map((value) => normalizeText(value))
		.filter(Boolean)
		.join(" ")
		.trim();
}

function buildCuratedHintAliasMap(): ReadonlyMap<string, string> {
	const aliasEntries: Array<[string, string]> = [];
	const catalogEntries = Object.values(GENERATED_CARD_CONTENT_CATALOG);

	for (const entry of catalogEntries) {
		const normalizedIconName = normalizeText(entry.fallbackIconName);
		if (normalizedIconName) {
			aliasEntries.push([normalizedIconName, entry.fallbackIconName]);
		}

		for (const alias of entry.allowedHintAliases ?? []) {
			const normalizedAlias = normalizeText(alias);
			if (normalizedAlias) {
				aliasEntries.push([normalizedAlias, entry.fallbackIconName]);
			}
		}
	}

	return new Map(aliasEntries);
}

const CURATED_HINT_ALIAS_MAP = buildCuratedHintAliasMap();

export const GENERATED_CARD_ICON_HINT_NAMES = Array.from(
	new Set(CURATED_HINT_ALIAS_MAP.values()),
).sort();

export function normalizeVisualIdentity(value: unknown): VisualIdentity | undefined {
	if (!isRecord(value)) {
		return undefined;
	}

	const iconName =
		typeof value.iconName === "string" && value.iconName.trim().length > 0
			? value.iconName.trim()
			: null;
	const tileVariant =
		typeof value.tileVariant === "string" &&
		VISUAL_IDENTITY_TILE_VARIANTS.includes(value.tileVariant as VisualIdentityTileVariant)
			? (value.tileVariant as VisualIdentityTileVariant)
			: null;

	if (!iconName || !tileVariant) {
		return undefined;
	}

	return {
		iconName,
		tileVariant,
	};
}

export function resolveVisualIdentityTileVariant(seed: string): VisualIdentityTileVariant {
	const normalizedSeed = normalizeText(seed);
	if (!normalizedSeed) {
		return VISUAL_IDENTITY_TILE_VARIANTS[0];
	}

	return (
		VISUAL_IDENTITY_TILE_VARIANTS[
			hashString(normalizedSeed) % VISUAL_IDENTITY_TILE_VARIANTS.length
		] ?? VISUAL_IDENTITY_TILE_VARIANTS[0]
	);
}

function resolveIdentitySeed(
	explicitSeed: string | undefined,
	fallbackValues: Array<string | null | undefined>,
): string {
	if (typeof explicitSeed === "string" && explicitSeed.trim().length > 0) {
		return explicitSeed.trim();
	}

	const fallbackSeed = fallbackValues
		.filter((value): value is string => typeof value === "string" && value.trim().length > 0)
		.join("|")
		.trim();

	return fallbackSeed || DEFAULT_VISUAL_IDENTITY.iconName;
}

function createIconTileIdentity(
	iconName: string,
	seed: string,
): ResolvedCardIdentity {
	return {
		kind: "icon-tile",
		iconName,
		tileVariant: resolveVisualIdentityTileVariant(seed),
	};
}

function resolveArtifactFallbackIconName(kind: ArtifactVisualIdentityKind): string {
	switch (kind) {
		case "code":
			return "angle-brackets";
		case "excalidraw":
			return "diagram";
		case "image":
			return "image";
		case "sheet":
			return "table";
		case "react":
			return "app";
		default:
			return "text";
	}
}

function resolveCuratedIconHint(iconHint?: string): string | null {
	if (!iconHint) {
		return null;
	}

	const normalizedHint = normalizeText(iconHint);
	if (!normalizedHint) {
		return null;
	}

	return CURATED_HINT_ALIAS_MAP.get(normalizedHint) ?? null;
}

function includesKeyword(searchText: string, keyword: string): boolean {
	return searchText.includes(normalizeText(keyword));
}

function resolveAtlassianLogoFromSearchText(
	searchText: string,
): AtlassianLogoName | null {
	if (!searchText) {
		return null;
	}

	for (const entry of ATLASSIAN_LOGO_CATALOG) {
		if (entry.keywords.some((keyword) => includesKeyword(searchText, keyword))) {
			return entry.logoName;
		}
	}

	return null;
}

function resolveExternalLogoFromSearchText(searchText: string): string | null {
	if (!searchText) {
		return null;
	}

	for (const entry of EXTERNAL_LOGO_CATALOG) {
		if (entry.keywords.some((keyword) => includesKeyword(searchText, keyword))) {
			return entry.logoSrc;
		}
	}

	return null;
}

export function resolveGenerativeCardIdentity(
	input: Readonly<GeneratedCardIdentityInput>,
): ResolvedCardIdentity {
	const identitySeed = resolveIdentitySeed(input.identitySeed, [
		input.contentType,
		input.title,
		input.sourceName,
		input.description,
		input.hintText,
	]);
	const explicitLogoSrc =
		typeof input.sourceLogoSrc === "string" && input.sourceLogoSrc.trim().length > 0
			? input.sourceLogoSrc.trim()
			: null;
	if (explicitLogoSrc) {
		return {
			kind: "external-logo",
			logoSrc: explicitLogoSrc,
		};
	}

	const logoSearchText = buildSearchText([
		input.sourceName,
		input.title,
	]);
	const searchText = buildSearchText([
		input.sourceName,
		input.title,
		input.description,
		input.hintText,
	]);
	const inferredAtlassianLogo = resolveAtlassianLogoFromSearchText(logoSearchText);
	if (inferredAtlassianLogo) {
		return {
			kind: "atlassian-logo",
			logoName: inferredAtlassianLogo,
		};
	}

	const inferredExternalLogo = resolveExternalLogoFromSearchText(searchText);
	if (inferredExternalLogo) {
		return {
			kind: "external-logo",
			logoSrc: inferredExternalLogo,
		};
	}

	const hintedIconName = resolveCuratedIconHint(input.iconHint);
	if (hintedIconName) {
		return createIconTileIdentity(hintedIconName, identitySeed);
	}

	const catalogEntry =
		GENERATED_CARD_CONTENT_CATALOG[input.contentType] ??
		GENERATED_CARD_CONTENT_CATALOG.other;

	return createIconTileIdentity(catalogEntry.fallbackIconName, identitySeed);
}

export function resolveArtifactCardIdentity(
	input: Readonly<ArtifactCardIdentityInput>,
): ResolvedCardIdentity {
	const explicitVisualIdentity = normalizeVisualIdentity(input.visualIdentity);
	if (explicitVisualIdentity) {
		return {
			kind: "icon-tile",
			...explicitVisualIdentity,
		};
	}

	const explicitLogoSrc =
		typeof input.sourceLogoSrc === "string" && input.sourceLogoSrc.trim().length > 0
			? input.sourceLogoSrc.trim()
			: null;
	if (explicitLogoSrc) {
		return {
			kind: "external-logo",
			logoSrc: explicitLogoSrc,
		};
	}

	const logoSearchText = buildSearchText([
		input.sourceName,
		input.title,
	]);
	const searchText = buildSearchText([
		input.sourceName,
		input.title,
		input.description,
		input.hintText,
	]);
	const inferredAtlassianLogo = resolveAtlassianLogoFromSearchText(logoSearchText);
	if (inferredAtlassianLogo) {
		return {
			kind: "atlassian-logo",
			logoName: inferredAtlassianLogo,
		};
	}

	const inferredExternalLogo = resolveExternalLogoFromSearchText(searchText);
	if (inferredExternalLogo) {
		return {
			kind: "external-logo",
			logoSrc: inferredExternalLogo,
		};
	}

	const identitySeed = resolveIdentitySeed(input.identitySeed, [
		input.kind,
		input.title,
		input.sourceName,
		input.description,
	]);
	const hintedIconName = resolveCuratedIconHint(input.iconHint);
	if (hintedIconName) {
		return createIconTileIdentity(hintedIconName, identitySeed);
	}

	return createIconTileIdentity(
		resolveArtifactFallbackIconName(input.kind),
		identitySeed,
	);
}
