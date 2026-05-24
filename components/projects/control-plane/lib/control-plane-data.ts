export interface ControlPlaneSurfaceLink {
	description: string;
	href: string;
	label: string;
}

export const CONTROL_PLANE_SURFACES: readonly ControlPlaneSurfaceLink[] = [
	{
		description: "Scheduled work and run history",
		href: "/rovo/jobs",
		label: "Jobs",
	},
	{
		description: "Compiled wiki-backed memory and proposal status",
		href: "/rovo/memories",
		label: "Memories",
	},
	{
		description: "Installed skills and skill details",
		href: "/rovo/skills",
		label: "Skills",
	},
	{
		description: "Provider routing, compiled memory, and wiki mirror controls",
		href: "/rovo/settings",
		label: "Settings",
	},
] as const;

const CONTROL_PLANE_HEADER_SURFACE_LABELS = new Set<ControlPlaneSurfaceLink["label"]>([
	"Jobs",
	"Memories",
	"Skills",
	"Settings",
]);

export const CONTROL_PLANE_HEADER_SURFACES: readonly ControlPlaneSurfaceLink[] =
	CONTROL_PLANE_SURFACES.filter((surface) => {
		return CONTROL_PLANE_HEADER_SURFACE_LABELS.has(surface.label);
	});

export const CONTROL_PLANE_SIDEBAR_SURFACES: readonly ControlPlaneSurfaceLink[] =
	CONTROL_PLANE_SURFACES.filter((surface) => {
		return !CONTROL_PLANE_HEADER_SURFACE_LABELS.has(surface.label);
	});

export type ControlPlaneJobStatus = "scheduled" | "running" | "paused" | "failed";
export type ControlPlaneJobSurface = "rovo" | "research" | "system" | "agents-rfp-demo";

export interface ControlPlaneJobTrigger {
	type: string;
	board?: string;
	column?: string;
	label?: string;
}

export interface ControlPlaneJobThreadLink {
	ticketCode: string;
	threadId: string;
}

export interface ControlPlaneJobRunSummary {
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
	threadLinks: ControlPlaneJobThreadLink[];
	summary: string | null;
}

export interface ControlPlaneJob {
	artifactTarget?: string | null;
	enabled: boolean;
	id: string;
	lastError?: string | null;
	lastRunAt?: string | null;
	linkedThreadId?: string | null;
	name: string;
	nextRunAt?: string | null;
	notes?: string;
	postResultToThread?: boolean;
	runHistory?: ControlPlaneJobRunSummary[];
	surface?: ControlPlaneJobSurface;
	schedule: string;
	status: ControlPlaneJobStatus;
	target: string;
	trigger?: ControlPlaneJobTrigger | null;
	triggerLabel?: string | null;
	updatedAt: string;
}

export type ControlPlaneMemoryTarget = "memory" | "user";

export interface ControlPlaneMemoryEntry {
	id: string;
	source: "manual" | "imported";
	text: string;
	updatedAt: string;
}

export interface ControlPlaneSkill {
	category: string;
	content: string;
	description: string;
	enabled: boolean;
	name: string;
	path: string;
	slug: string;
	sourceDir: string;
	tags: string[];
	updatedAt: string;
}

export interface ControlPlaneProviderRoutes {
	browser: string;
	chat: string;
	summarization: string;
	vision: string;
	voice: string;
	jobs: string;
}

export interface ControlPlaneSettingsState {
	advancedAutomation: boolean;
	providerRoutes: ControlPlaneProviderRoutes;
	runtimeMirroring: boolean;
}

export const CONTROL_PLANE_MEMORY_LIMITS: Record<ControlPlaneMemoryTarget, number> = {
	memory: 8000,
	user: 4000,
};

export const INITIAL_CONTROL_PLANE_JOBS: readonly ControlPlaneJob[] = [
	{
		artifactTarget: "rovo/runs",
		enabled: true,
		id: "job-nightly-summary",
		lastRunAt: "2026-04-05T22:30:00.000Z",
		linkedThreadId: "rovo-2041",
		name: "Nightly product summary",
		nextRunAt: "2026-04-06T22:30:00.000Z",
		notes: "Summarise the latest run outcomes and attach the result to the linked thread.",
		postResultToThread: true,
		surface: "rovo",
		schedule: "0 22 * * *",
		status: "scheduled",
		target: "synthesise a digest of high-signal Rovo runs",
		updatedAt: "2026-04-05T22:30:00.000Z",
	},
	{
		artifactTarget: "research/experiments",
		enabled: true,
		id: "job-eval-export",
		lastRunAt: "2026-04-05T15:20:00.000Z",
		name: "Eval dataset export",
		nextRunAt: "2026-04-06T15:20:00.000Z",
		notes: "Collect trajectories for the current evaluation batch and export a dataset snapshot.",
		postResultToThread: false,
		surface: "research",
		schedule: "every 6h",
		status: "running",
		target: "export trajectories for the latest experiment set",
		updatedAt: "2026-04-05T15:20:00.000Z",
	},
	{
		enabled: false,
		id: "job-memory-prune",
		lastError: "Paused while reviewing the pruning threshold.",
		lastRunAt: "2026-04-04T08:05:00.000Z",
		name: "Memory pruning sweep",
		nextRunAt: null,
		notes: "Refresh memory buckets and keep the compact summary under review.",
		postResultToThread: false,
		surface: "system",
		schedule: "Sunday 08:00",
		status: "paused",
		target: "prune redundant memory entries",
		updatedAt: "2026-04-04T08:05:00.000Z",
	},
];

export const INITIAL_CONTROL_PLANE_MEMORIES: Record<ControlPlaneMemoryTarget, ControlPlaneMemoryEntry[]> = {
	memory: [
		{
			id: "memory-1",
			source: "manual",
			text: "Prefer Hermes-backed memory for stable long-term context.",
			updatedAt: "2026-04-05T09:30:00.000Z",
		},
		{
			id: "memory-2",
			source: "imported",
			text: "Keep the interactive Rovo loop on rovo serve for v1.",
			updatedAt: "2026-04-04T14:12:00.000Z",
		},
		{
			id: "memory-3",
			source: "manual",
			text: "Use explicit route links instead of hidden state for control-plane surfaces.",
			updatedAt: "2026-04-02T18:48:00.000Z",
		},
	],
	user: [
		{
			id: "user-1",
			source: "manual",
			text: "Prefers concise implementation notes with absolute file paths.",
			updatedAt: "2026-04-05T09:40:00.000Z",
		},
		{
			id: "user-2",
			source: "imported",
			text: "The workspace is shared and edits should preserve concurrent changes.",
			updatedAt: "2026-04-04T14:18:00.000Z",
		},
	],
};

export const INITIAL_CONTROL_PLANE_SKILLS: readonly ControlPlaneSkill[] = [
	{
		category: "automation",
		content: [
			"# Bootstrap automation",
			"",
			"- Prefer explicit bootstrap steps.",
			"- Track file changes in the thread metadata.",
			"- Keep high-risk actions user-visible.",
		].join("\n"),
		description: "Bootstraps repeatable workflows and records the execution path.",
		enabled: true,
		name: "bootstrap-automation",
		path: "~/.hermes/skills/automation/bootstrap-automation/SKILL.md",
		slug: "bootstrap-automation",
		sourceDir: "~/.hermes/skills",
		tags: ["bootstrap", "workflow", "hooks"],
		updatedAt: "2026-04-05T11:00:00.000Z",
	},
	{
		category: "memory",
		content: [
			"# Wiki memory sync",
			"",
			"- Read compiled wiki memory context artifacts.",
			"- Treat canonical wiki pages as the source of truth.",
			"- Process durable-memory proposals through the llm-wiki flow.",
		].join("\n"),
		description: "Manages wiki-backed durable memory and compiled context refreshes.",
		enabled: true,
		name: "memory-sync",
		path: "~/.hermes/skills/memory/memory-sync/SKILL.md",
		slug: "memory-sync",
		sourceDir: "~/.hermes/skills",
		tags: ["memory", "context", "persistence"],
		updatedAt: "2026-04-04T16:20:00.000Z",
	},
	{
		category: "planning",
		content: [
			"# Plan mode discipline",
			"",
			"- Turn ambiguous requests into bounded work.",
			"- Separate research, spec, and implementation.",
			"- Preserve the approved scope.",
		].join("\n"),
		description: "Converts fuzzy requests into bounded execution plans.",
		enabled: false,
		name: "plan-discipline",
		path: "~/.hermes/skills/planning/plan-discipline/SKILL.md",
		slug: "plan-discipline",
		sourceDir: "~/.hermes/skills",
		tags: ["planning", "scoping", "review"],
		updatedAt: "2026-04-03T12:05:00.000Z",
	},
	{
		category: "research",
		content: [
			"# Research workbench",
			"",
			"- Batch processing and trajectory export.",
			"- Capture outputs with stable IDs.",
			"- Keep the experiment surface auditable.",
		].join("\n"),
		description: "Supports batch runs, exports, and research-oriented workflows.",
		enabled: true,
		name: "research-workbench",
		path: "~/.hermes/skills/research/research-workbench/SKILL.md",
		slug: "research-workbench",
		sourceDir: "~/.hermes/skills",
		tags: ["research", "datasets", "trajectories"],
		updatedAt: "2026-04-05T07:55:00.000Z",
	},
	{
		category: "voice",
		content: [
			"# Voice routing",
			"",
			"- Keep voice and TTS providers explicit.",
			"- Surface device selection and runtime status.",
			"- Route transcripts through the control plane.",
		].join("\n"),
		description: "Routes live voice and transcription jobs through the control plane.",
		enabled: false,
		name: "voice-routing",
		path: "~/.hermes/skills/voice/voice-routing/SKILL.md",
		slug: "voice-routing",
		sourceDir: "~/.hermes/skills",
		tags: ["voice", "tts", "transcription"],
		updatedAt: "2026-04-01T10:10:00.000Z",
	},
];

export const INITIAL_CONTROL_PLANE_SETTINGS: ControlPlaneSettingsState = {
	advancedAutomation: true,
	providerRoutes: {
		browser: "browser-extraction",
		chat: "rovo-serve",
		summarization: "ai-gateway",
		vision: "ai-gateway",
		voice: "local-realtime",
		jobs: "embedded-hermes",
	},
	runtimeMirroring: false,
};
