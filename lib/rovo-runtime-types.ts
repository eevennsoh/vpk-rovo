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

export interface WikiStatusFileSummary {
	path: string;
	exists: boolean;
	updatedAt: string | null;
}

export interface WikiCompiledContextDocument {
	charCount: number;
	exists: boolean;
	path: string;
	preview: string;
	updatedAt: string | null;
}

export interface WikiCanonicalMemoryBlock {
	charCount: number;
	content: string;
	id: string;
	lineCount: number;
	preview: string;
}

export interface WikiCanonicalMemoryDocument {
	blocks: WikiCanonicalMemoryBlock[];
	canonicalPath: string;
	compiledContext: WikiCompiledContextDocument | null;
	exists: boolean;
	revision: string;
	scope: "work" | "profile";
	title: string;
	updatedAt: string | null;
}

export interface WikiCanonicalMemoryDocuments {
	work: WikiCanonicalMemoryDocument;
	profile: WikiCanonicalMemoryDocument;
}

export interface WikiProposalCounts {
	queued: number;
	ingested: number;
	total: number;
}

export interface WikiMemoryProposalSummary {
	action: string;
	content?: string;
	createdAt: string | null;
	id: string;
	ingestedAt?: string | null;
	origin?: string | null;
	path: string;
	reason?: string | null;
	scope: string;
	sourceMessageId: string | null;
	sourceThreadId: string | null;
	status: string;
	summary: string;
	tags?: string[];
	target?: string | null;
}

export interface WikiStatus {
	wikiDir: string;
	generatedAt: string;
	canonicalCounts: Record<string, number>;
	rawCounts: Record<string, number>;
	totalCanonicalPages: number;
	totalRawCaptures: number;
	hasWikiDigestEntry: boolean;
	hasCompiledContextArtifacts?: boolean;
	compiledContexts?: {
		profile?: WikiCompiledContextDocument;
		work?: WikiCompiledContextDocument;
	};
	proposalCounts?: WikiProposalCounts;
	recentProposals?: WikiMemoryProposalSummary[];
	files: {
		index: WikiStatusFileSummary;
		log: WikiStatusFileSummary;
		schema: WikiStatusFileSummary;
	};
	qmd?: WikiQmdStatus;
}

export type WikiMemoryExplorerNodeKind =
	| "canonical-memory"
	| "compiled-context"
	| "linked-knowledge"
	| "raw-proposal";

export type WikiMemoryExplorerEdgeKind =
	| "canonical_to_compiled"
	| "inferred_topic"
	| "proposal_to_canonical"
	| "same_scope"
	| "same_thread"
	| "shared_tag"
	| "wiki_link";

export interface WikiMemoryExplorerNode {
	bodyPreview: string;
	charCount: number;
	connectionCount: number;
	createdAt: string | null;
	id: string;
	kind: WikiMemoryExplorerNodeKind;
	label: string;
	metadata: Record<string, unknown>;
	path: string;
	relativePath: string;
	scope: string | null;
	sourceMessageId: string | null;
	sourceThreadId: string | null;
	status: string | null;
	summary: string;
	tags: string[];
	target: string | null;
	title: string;
	topics: string[];
	updatedAt: string | null;
	wikiLinks: string[];
}

export interface WikiMemoryExplorerEdge {
	id: string;
	kind: WikiMemoryExplorerEdgeKind;
	label: string;
	metadata: Record<string, unknown>;
	relationKinds: WikiMemoryExplorerEdgeKind[];
	source: string;
	target: string;
}

export interface WikiMemoryExplorerFacet {
	count: number;
	label: string;
	value: string;
}

export interface WikiMemoryExplorerFacets {
	kinds: WikiMemoryExplorerFacet[];
	scopes: WikiMemoryExplorerFacet[];
	statuses: WikiMemoryExplorerFacet[];
	tags: WikiMemoryExplorerFacet[];
	threads: WikiMemoryExplorerFacet[];
}

export interface WikiMemoryExplorerFilters {
	includeLinkedKnowledge: boolean;
	kind: string | null;
	scope: string | null;
	status: string | null;
	tag: string | null;
	threadId: string | null;
}

export interface WikiMemoryExplorerStats {
	edgeCount: number;
	nodeCount: number;
	totalEdgeCount: number;
	totalNodeCount: number;
	visibleKindCounts: Record<string, number>;
	visibleScopeCounts: Record<string, number>;
	visibleStatusCounts: Record<string, number>;
}

export interface WikiMemoryExplorerResponse {
	edges: WikiMemoryExplorerEdge[];
	facets: WikiMemoryExplorerFacets;
	filters: WikiMemoryExplorerFilters;
	generatedAt: string;
	nodes: WikiMemoryExplorerNode[];
	stats: WikiMemoryExplorerStats;
}

export interface WikiMemoryGeneratedArtifact {
	content: string;
	format: "brief" | "deck";
	generatedAt: string;
	selectedNodeIds: string[];
	title: string;
}

export interface WikiQmdStatus {
	dbExists: boolean;
	dbPath: string;
	errorMessage: string | null;
	lastSyncedAt: string | null;
	latestCanonicalUpdateAt: string | null;
	needsEmbedding: number;
	stale: boolean;
	totalDocuments: number;
	collections: string[];
}

export interface WikiSearchResult {
	backend: "qmd" | "naive";
	collection: string | null;
	path: string | null;
	score: number;
	snippet: string;
	title: string;
}

export interface WikiSearchResponse {
	backend: "qmd" | "naive";
	results: WikiSearchResult[];
}

export interface WikiSyncResponse {
	qmd: WikiQmdStatus;
	sync: {
		didSync: boolean;
		reason: string;
		summary: WikiQmdStatus;
		syncResult?: {
			lastSyncedAt?: string | null;
			latestCanonicalUpdateAt?: string | null;
		} | null;
	};
}

export interface WikiMemoryDeleteResponse {
	memories: WikiCanonicalMemoryDocuments;
	removedBlock: WikiCanonicalMemoryBlock;
	wiki: WikiStatus;
}

export interface WikiMemoryProposalDeleteResponse {
	memories: WikiCanonicalMemoryDocuments;
	proposal: WikiMemoryProposalSummary;
	wiki: WikiStatus;
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
	trigger: HermesJobTrigger | null;
	triggerLabel: string | null;
	runHistory: HermesJobRunSummary[];
	raw: Record<string, unknown>;
}

export interface HermesJobTrigger {
	type: string;
	board?: string;
	column?: string;
	label?: string;
}

export interface HermesJobThreadLink {
	ticketCode: string;
	threadId: string;
}

export interface HermesJobRunSummary {
	id: string;
	jobId: string | null;
	source: string | null;
	triggerLabel: string | null;
	status: string;
	startedAt: string | null;
	finishedAt: string | null;
	processedTicketCodes: string[];
	skippedTicketCodes: string[];
	failedTicketCodes: string[];
	threadLinks: HermesJobThreadLink[];
	summary: string | null;
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
