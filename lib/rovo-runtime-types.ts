export type RuntimeHealth = "ok" | "degraded" | "down";
export type RuntimeSurfaceName = "rovodev" | "hermes";

export interface RuntimeSurfaceStatus {
	name: RuntimeSurfaceName;
	available: boolean;
	health: RuntimeHealth;
	status: string;
	message: string | null;
	url: string | null;
	details?: Record<string, unknown>;
}

export interface RuntimeStatusSnapshot {
	status: RuntimeHealth;
	timestamp: string;
	surfaces: {
		rovodev: RuntimeSurfaceStatus;
		hermes: RuntimeSurfaceStatus;
	};
	degradedSurfaces: RuntimeSurfaceName[];
}

export type HermesMemoryTarget = "memory" | "user";

export interface HermesMemoryEntry {
	id: string;
	index: number;
	text: string;
	chars: number;
}

export interface HermesMemoryDocument {
	target: HermesMemoryTarget;
	exists: boolean;
	path: string;
	entries: HermesMemoryEntry[];
	totalChars: number;
	limit: number | null;
	updatedAt: string | null;
}

export interface WikiStatusFileSummary {
	path: string;
	exists: boolean;
	updatedAt: string | null;
}

export interface WikiStatus {
	wikiDir: string;
	generatedAt: string;
	canonicalCounts: Record<string, number>;
	rawCounts: Record<string, number>;
	totalCanonicalPages: number;
	totalRawCaptures: number;
	hasWikiDigestEntry: boolean;
	files: {
		index: WikiStatusFileSummary;
		log: WikiStatusFileSummary;
		schema: WikiStatusFileSummary;
	};
}

export interface HermesSkillSummary {
	id: string;
	category: string;
	name: string;
	title: string;
	description: string | null;
	disabled: boolean;
	path: string;
	rootDir: string;
	source: "local" | "external" | "vendored-upstream";
	updatedAt: string | null;
}

export interface HermesSkillDetail extends HermesSkillSummary {
	content: string;
}

export interface HermesSkillBundleDetail extends HermesSkillDetail {
	files: Array<{
		path: string;
		content: string;
	}>;
}

export type HermesSkillDraftAction = "create" | "update" | "delete";
export type HermesSkillDraftStatus = "pending" | "approved" | "rejected";

export interface HermesSkillDraftFile {
	path: string;
	content: string;
}

export interface HermesSkillDraftSummary {
	id: string;
	status: HermesSkillDraftStatus;
	action: HermesSkillDraftAction;
	category: string;
	name: string;
	summary: string | null;
	rationale: string | null;
	sourceThreadId: string | null;
	sourceMessageId: string | null;
	createdAt: string;
	updatedAt: string;
	reviewedAt: string | null;
}

export interface HermesSkillDraftDetail extends HermesSkillDraftSummary {
	files: HermesSkillDraftFile[];
}

export interface HermesJob {
	id: string;
	name: string;
	description: string | null;
	schedule: string | null;
	status: string | null;
	paused: boolean;
	nextRunAt: string | null;
	lastRunAt: string | null;
	lastError: string | null;
	linkedThreadId: string | null;
	postResultToThread: boolean;
	artifactTarget: string | null;
	raw: Record<string, unknown>;
}

export interface SessionSearchResult {
	threadId: string;
	title: string;
	snippet: string;
	matchCount: number;
	lastMessageAt: string;
}

export interface Checkpoint {
	id: string;
	name: string;
	description: string | null;
	createdAt: string;
}

export interface HermesHubSkill {
	name: string;
	description: string | null;
	category: string;
	source: string | null;
	identifier: string | null;
	trustLevel: "builtin" | "community" | "trusted" | null;
	tags: string[];
	extra: Record<string, unknown>;
}

export interface HermesHubInstallResult {
	installed: boolean;
	path: string;
	name: string;
	category: string;
}

export interface HermesHubBrowseResult {
	results: HermesHubSkill[];
	total: number;
	page: number;
	totalPages: number;
}

export interface HermesHubInspectResult {
	meta: HermesHubSkill | null;
	preview: string | null;
}
