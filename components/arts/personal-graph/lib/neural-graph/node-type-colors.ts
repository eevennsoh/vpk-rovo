import type { VaultNode, VaultNodeKind } from "../personal-graph-types";

export type PersonalGraphNodeTypeCategory =
	| VaultNodeKind
	| "confluence-blogpost"
	| "confluence-page"
	| "confluence-space"
	| "confluence-whiteboard"
	| "jira"
	| "loom-meeting"
	| "loom-video"
	| "person";

const GRAPH_KIND_CATEGORIES = new Set<PersonalGraphNodeTypeCategory>([
	"concept",
	"entity",
	"raw",
	"source",
	"synthesis",
]);

const NODE_TYPE_ACCENT_TOKENS: Partial<Record<PersonalGraphNodeTypeCategory, string>> = {
	"confluence-blogpost": "var(--ds-icon-accent-green)",
	"confluence-page": "var(--ds-icon-accent-blue)",
	"confluence-space": "var(--ds-icon-accent-gray)",
	"confluence-whiteboard": "var(--ds-icon-accent-teal)",
	jira: "var(--ds-icon-accent-purple)",
	"loom-meeting": "var(--ds-icon-accent-orange)",
	"loom-video": "var(--ds-icon-accent-magenta)",
	person: "var(--ds-icon-accent-lime)",
};

const METADATA_TYPE_KEYS = [
	"graphType",
	"nodeType",
	"entityType",
	"type",
	"product",
] as const;

function normalizeTypeValue(value: string): string {
	return value
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9]+/gu, "");
}

function getFrontmatterString(frontmatter: Record<string, unknown>, key: string): string | null {
	const value = frontmatter[key];
	return typeof value === "string" && value.trim() ? value.trim() : null;
}

function getCategoryFromValue(value: string): PersonalGraphNodeTypeCategory | null {
	const normalized = normalizeTypeValue(value);
	if (!normalized) return null;

	if (
		normalized.includes("atlassianaccountuser")
		|| normalized.includes("identityuser")
		|| normalized === "user"
		|| normalized === "person"
		|| normalized === "people"
	) {
		return "person";
	}
	if (normalized.includes("confluenceblogpost") || normalized.includes("blogpost")) return "confluence-blogpost";
	if (normalized.includes("confluencewhiteboard") || normalized.includes("whiteboard")) return "confluence-whiteboard";
	if (normalized.includes("confluencespace")) return "confluence-space";
	if (normalized.includes("confluencepage")) return "confluence-page";
	if (normalized.includes("confluence")) return "confluence-page";
	if (normalized.includes("jira") || normalized.includes("issue") || normalized.includes("workitem")) return "jira";
	if (normalized.includes("loommeeting")) return "loom-meeting";
	if (normalized.includes("loomvideo")) return "loom-video";
	if (normalized.includes("loom")) return "loom-video";
	if (normalized === "source" || normalized === "sources") return "source";
	if (normalized === "entity" || normalized === "entities") return "entity";
	if (normalized === "concept" || normalized === "concepts") return "concept";
	if (normalized === "synthesis" || normalized === "syntheses") return "synthesis";
	if (normalized === "raw") return "raw";

	return null;
}

function getMetadataCandidates(node: VaultNode): string[] {
	const frontmatter = node.frontmatter ?? {};
	const metadataCandidates = METADATA_TYPE_KEYS
		.map((key) => getFrontmatterString(frontmatter, key))
		.filter((value): value is string => Boolean(value));
	const identityCandidates = [
		getFrontmatterString(frontmatter, "ari"),
		node.id,
		node.relativePath,
		node.externalUrl,
	].filter((value): value is string => typeof value === "string" && value.trim().length > 0);

	return [...metadataCandidates, ...identityCandidates];
}

export function getPersonalGraphNodeTypeCategory(node: VaultNode): PersonalGraphNodeTypeCategory {
	for (const candidate of getMetadataCandidates(node)) {
		const category = getCategoryFromValue(candidate);
		if (category) return category;
	}

	return node.kind;
}

export function getPersonalGraphNodeTypeAccentToken(node: VaultNode): string | null {
	const category = getPersonalGraphNodeTypeCategory(node);
	if (GRAPH_KIND_CATEGORIES.has(category)) return null;
	return NODE_TYPE_ACCENT_TOKENS[category] ?? null;
}
