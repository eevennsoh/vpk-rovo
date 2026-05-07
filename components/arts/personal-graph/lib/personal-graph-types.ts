export type VaultNodeKind = "source" | "entity" | "concept" | "synthesis" | "raw";

export type GraphProvider = "vault" | "twg";

export type VaultEdgeKind =
	| "wiki_link"
	| "frontmatter_source"
	| "worked-on"
	| "mentioned-in"
	| "viewed"
	| "reports-to"
	| "aligned-to"
	| "member-of"
	| "attended"
	| "reviewed";

export interface VaultNode {
	bodyPreview: string;
	connectionCount: number;
	dangling: boolean;
	externalUrl: string | null;
	frontmatter: Record<string, unknown>;
	id: string;
	kind: VaultNodeKind;
	label: string;
	missing: boolean;
	path: string | null;
	provider: GraphProvider;
	relativePath: string;
	size: number;
	slug: string;
	title: string;
	updatedAt: string | null;
	wikiLinks?: string[];
}

export interface VaultEdge {
	id: string;
	kind: VaultEdgeKind;
	label: string;
	metadata: Record<string, unknown>;
	relationKinds: VaultEdgeKind[];
	source: string;
	target: string;
}

export interface VaultExplorer {
	edges: VaultEdge[];
	generatedAt: string;
	nodes: VaultNode[];
	stats: {
		danglingCount: number;
		edgeCount: number;
		nodeCount: number;
		rawCount: number;
		wikiCount: number;
	};
}

export interface VaultSettings {
	message: string;
	rawDirectoryExists: boolean;
	root: string | null;
	source: "folder-picker" | null;
	status: "ready" | "missing" | "invalid" | "unconfigured";
	wikiDirectoryExists: boolean;
}

export interface PageBody {
	body: string;
	content: string;
	frontmatter: Record<string, unknown>;
	path: string;
	relativePath: string;
	slug: string;
	updatedAt: string;
}

export interface RawSourceWriteResult {
	name: string;
	path: string;
	relativePath: string;
	size: number;
	slug: string;
	updatedAt: string;
}

export interface CaptureResult {
	assetPath: string | null;
	frontmatter: Record<string, unknown>;
	rawPath: string;
	slug: string;
}

export interface UnprocessedRawSources {
	count: number;
	paths: string[];
}

export interface QmdResult {
	excerpt: string;
	path: string;
	score: number;
	slug: string;
	title: string;
}

export interface LogEntry {
	date?: string;
	pagesWritten?: string[];
	raw?: string;
	source?: string;
	type?: string;
	[key: string]: unknown;
}

export type LibrarianStreamEvent =
	| { stage: string; type: "stage"; sourcePath?: string }
	| { stage: string; summary: string; takeaways: string[]; type: "summary" }
	| { related: QmdResult[]; stage: string; type: "related" }
	| { stage: "awaiting-confirmation"; token: string; type: "confirmation" }
	| { logEntry: LogEntry; pagesWritten: string[]; stage: "done"; type: "done" }
	| { error: string; stage: "error"; type: "error" };
