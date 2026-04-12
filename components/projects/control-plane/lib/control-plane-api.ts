"use client";

import { API_ENDPOINTS } from "@/lib/api-config";
import { normalizeRuntimeStatusSnapshot } from "@/lib/rovo-runtime-status";
import type {
	Checkpoint,
	HermesHubBrowseResult,
	HermesHubInstallResult,
	HermesHubInspectResult,
	HermesHubSkill,
	HermesJob,
	HermesMemoryDocument,
	HermesMemoryEntry,
	HermesMemoryTarget,
	HermesSkillBundleDetail,
	HermesSkillDraftDetail,
	HermesSkillDraftSummary,
	HermesSkillDetail,
	HermesSkillSummary,
	RuntimeStatusSnapshot,
	SessionSearchResult,
	WikiStatus,
	WikiStatusFileSummary,
} from "@/lib/rovo-runtime-types";

function getString(value: unknown): string | null {
	return typeof value === "string" && value.trim().length > 0
		? value.trim()
		: null;
}

async function parseJsonResponse<T>(response: Response): Promise<T> {
	if (!response.ok) {
		let message = `Request failed with status ${response.status}`;
		try {
			const payload = await response.json() as { error?: unknown; details?: unknown };
			if (typeof payload.error === "string" && payload.error.trim()) {
				message = payload.error.trim();
			} else if (typeof payload.details === "string" && payload.details.trim()) {
				message = payload.details.trim();
			}
		} catch {
			const fallbackText = await response.text().catch(() => "");
			if (fallbackText.trim()) {
				message = fallbackText.trim();
			}
		}
		throw new Error(message);
	}

	return response.json() as Promise<T>;
}

function deriveJobStatus(rawJob: Record<string, unknown>): HermesJob["status"] {
	const statusToken = getString(rawJob.status)?.toLowerCase()
		?? getString(rawJob.state)?.toLowerCase()
		?? "";

	if (statusToken.includes("run") || statusToken.includes("progress")) {
		return "running";
	}
	if (statusToken.includes("pause")) {
		return "paused";
	}
	if (statusToken.includes("fail") || statusToken.includes("error")) {
		return "failed";
	}
	return "scheduled";
}

function normalizeHermesJob(rawJob: unknown): HermesJob {
	const job = rawJob && typeof rawJob === "object"
		? rawJob as Record<string, unknown>
		: {};
	const rawLastRun = job.lastRun && typeof job.lastRun === "object"
		? job.lastRun as Record<string, unknown>
		: null;
	return {
		artifactTarget: getString(job.artifactTarget),
		description: getString(job.description),
		id: getString(job.id) ?? "job-unknown",
		lastError: getString(job.lastError),
		lastRunAt:
			getString(rawLastRun?.finishedAt)
			?? getString(rawLastRun?.startedAt)
			?? getString(job.lastRunAt)
			?? getString(job.last_run_at),
		linkedThreadId: getString(job.linkedThreadId),
		name: getString(job.name) ?? "Untitled job",
		nextRunAt:
			getString(job.nextRunAt)
			?? getString(job.next_run_at)
			?? getString(job.nextRun),
		paused:
			job.paused === true
			|| deriveJobStatus(job) === "paused"
			|| job.enabled === false,
		postResultToThread: job.postResultToThread === true,
		raw: job,
		schedule:
			getString(job.schedule)
			?? getString(job.schedule_display)
			?? (job.schedule && typeof job.schedule === "object"
				? getString((job.schedule as Record<string, unknown>).display)
				: null)
			?? getString(job.cron)
			?? getString(job.expression),
		status: deriveJobStatus(job),
	};
}

function normalizeHermesMemoryEntry(rawEntry: unknown, index: number): HermesMemoryEntry {
	const entry = rawEntry && typeof rawEntry === "object"
		? rawEntry as Record<string, unknown>
		: {};
	const text = getString(entry.content) ?? getString(entry.text) ?? "";
	return {
		chars:
			typeof entry.charCount === "number" && Number.isFinite(entry.charCount)
				? entry.charCount
				: text.length,
		id: getString(entry.id) ?? `${index}`,
		index:
			typeof entry.order === "number" && Number.isFinite(entry.order)
				? entry.order
				: index,
		text,
	};
}

function normalizeHermesMemoryDocument(
	target: HermesMemoryTarget,
	rawDocument: unknown,
): HermesMemoryDocument {
	const document = rawDocument && typeof rawDocument === "object"
		? rawDocument as Record<string, unknown>
		: {};
	const entries = Array.isArray(document.entries)
		? document.entries.map(normalizeHermesMemoryEntry)
		: [];
	return {
		entries,
		exists: document.exists !== false,
		limit:
			typeof document.limit === "number" && Number.isFinite(document.limit)
				? document.limit
				: null,
		path: getString(document.path) ?? "",
		target,
		totalChars:
			typeof document.charCount === "number" && Number.isFinite(document.charCount)
				? document.charCount
				: entries.reduce((total, entry) => total + entry.chars, 0),
		updatedAt: getString(document.updatedAt),
	};
}

function normalizeCountRecord(rawRecord: unknown): Record<string, number> {
	const record = rawRecord && typeof rawRecord === "object"
		? rawRecord as Record<string, unknown>
		: {};

	return Object.fromEntries(
		Object.entries(record)
			.filter(([, value]) => typeof value === "number" && Number.isFinite(value))
			.map(([key, value]) => [key, value as number]),
	);
}

function normalizeWikiStatusFileSummary(rawFile: unknown, fallbackPath = ""): WikiStatusFileSummary {
	const file = rawFile && typeof rawFile === "object"
		? rawFile as Record<string, unknown>
		: {};

	return {
		exists: file.exists === true,
		path: getString(file.path) ?? fallbackPath,
		updatedAt: getString(file.updatedAt),
	};
}

function sumCountRecord(record: Record<string, number>): number {
	return Object.values(record).reduce((total, value) => total + value, 0);
}

function normalizeWikiStatus(rawStatus: unknown): WikiStatus {
	const status = rawStatus && typeof rawStatus === "object"
		? rawStatus as Record<string, unknown>
		: {};
	const files = status.files && typeof status.files === "object"
		? status.files as Record<string, unknown>
		: {};
	const canonicalCounts = normalizeCountRecord(status.canonicalCounts);
	const rawCounts = normalizeCountRecord(status.rawCounts);

	return {
		canonicalCounts,
		files: {
			index: normalizeWikiStatusFileSummary(files.index, "index.md"),
			log: normalizeWikiStatusFileSummary(files.log, "log.md"),
			schema: normalizeWikiStatusFileSummary(files.schema, "SCHEMA.md"),
		},
		generatedAt: getString(status.generatedAt) ?? new Date().toISOString(),
		hasWikiDigestEntry: status.hasWikiDigestEntry === true,
		rawCounts,
		totalCanonicalPages:
			typeof status.totalCanonicalPages === "number" && Number.isFinite(status.totalCanonicalPages)
				? status.totalCanonicalPages
				: sumCountRecord(canonicalCounts),
		totalRawCaptures:
			typeof status.totalRawCaptures === "number" && Number.isFinite(status.totalRawCaptures)
				? status.totalRawCaptures
				: sumCountRecord(rawCounts),
		wikiDir: getString(status.wikiDir) ?? "",
	};
}

function normalizeHermesSkillSummary(rawSkill: unknown): HermesSkillSummary {
	const skill = rawSkill && typeof rawSkill === "object"
		? rawSkill as Record<string, unknown>
		: {};
	return {
		category: getString(skill.category) ?? "local",
		description: getString(skill.description) ?? getString(skill.summary),
		disabled: skill.enabled === false || skill.disabled === true,
		id: getString(skill.id) ?? getString(skill.name) ?? "skill-unknown",
		name: getString(skill.name) ?? "unknown",
		path: getString(skill.path) ?? "",
		rootDir: getString(skill.rootDir) ?? "",
		source:
			skill.source === "external"
				? "external"
				: skill.source === "vendored-upstream"
					? "vendored-upstream"
					: "local",
		title: getString(skill.title) ?? getString(skill.name) ?? "Unknown skill",
		updatedAt: getString(skill.updatedAt),
	};
}

function normalizeHermesSkillDetail(rawSkill: unknown): HermesSkillDetail {
	const summary = normalizeHermesSkillSummary(rawSkill);
	const skill = rawSkill && typeof rawSkill === "object"
		? rawSkill as Record<string, unknown>
		: {};
	return {
		...summary,
		content: getString(skill.content) ?? "",
	};
}

function normalizeHermesSkillBundleDetail(rawSkill: unknown): HermesSkillBundleDetail {
	const detail = normalizeHermesSkillDetail(rawSkill);
	const skill = rawSkill && typeof rawSkill === "object"
		? rawSkill as Record<string, unknown>
		: {};

	return {
		...detail,
		files: Array.isArray(skill.files)
			? skill.files.flatMap((file) => {
				const item = file && typeof file === "object"
					? file as Record<string, unknown>
					: {};
				const filePath = getString(item.path);
				if (!filePath) {
					return [];
				}

				return [{
					path: filePath,
					content: typeof item.content === "string" ? item.content : "",
				}];
			})
			: [],
	};
}

function normalizeHermesSkillDraftSummary(rawDraft: unknown): HermesSkillDraftSummary {
	const draft = rawDraft && typeof rawDraft === "object"
		? rawDraft as Record<string, unknown>
		: {};

	return {
		id: getString(draft.id) ?? "draft-unknown",
		status:
			draft.status === "approved" || draft.status === "rejected"
				? draft.status
				: "pending",
		action:
			draft.action === "create" || draft.action === "update" || draft.action === "delete"
				? draft.action
				: "create",
		category: getString(draft.category) ?? "local",
		name: getString(draft.name) ?? "unknown",
		summary: getString(draft.summary),
		rationale: getString(draft.rationale),
		sourceThreadId: getString(draft.sourceThreadId),
		sourceMessageId: getString(draft.sourceMessageId),
		createdAt: getString(draft.createdAt) ?? new Date().toISOString(),
		updatedAt: getString(draft.updatedAt) ?? new Date().toISOString(),
		reviewedAt: getString(draft.reviewedAt),
	};
}

function normalizeHermesSkillDraftDetail(rawDraft: unknown): HermesSkillDraftDetail {
	const summary = normalizeHermesSkillDraftSummary(rawDraft);
	const draft = rawDraft && typeof rawDraft === "object"
		? rawDraft as Record<string, unknown>
		: {};

	return {
		...summary,
		files: Array.isArray(draft.files)
			? draft.files.flatMap((file) => {
				const item = file && typeof file === "object"
					? file as Record<string, unknown>
					: {};
				const filePath = getString(item.path);
				if (!filePath) {
					return [];
				}

				return [{
					path: filePath,
					content: typeof item.content === "string" ? item.content : "",
				}];
			})
			: [],
	};
}

export async function fetchRuntimeStatusSnapshot(): Promise<RuntimeStatusSnapshot> {
	const payload = await parseJsonResponse<unknown>(await fetch(API_ENDPOINTS.STATUS, {
		method: "GET",
	}));
	return normalizeRuntimeStatusSnapshot(payload);
}

export async function fetchWikiStatus(): Promise<WikiStatus> {
	const payload = await parseJsonResponse<{ wiki?: unknown }>(await fetch(API_ENDPOINTS.WIKI_STATUS, {
		method: "GET",
	}));
	return normalizeWikiStatus(payload.wiki);
}

export async function fetchJobs(): Promise<HermesJob[]> {
	const payload = await parseJsonResponse<{ jobs?: unknown[] }>(await fetch(API_ENDPOINTS.JOBS, {
		method: "GET",
	}));
	return Array.isArray(payload.jobs) ? payload.jobs.map(normalizeHermesJob) : [];
}

export async function createJob(input: Record<string, unknown>): Promise<HermesJob> {
	const payload = await parseJsonResponse<{ job?: unknown }>(await fetch(API_ENDPOINTS.JOBS, {
		body: JSON.stringify(input),
		headers: {
			"Content-Type": "application/json",
		},
		method: "POST",
	}));
	return normalizeHermesJob(payload.job);
}

export async function updateJob(jobId: string, input: Record<string, unknown>): Promise<HermesJob> {
	const payload = await parseJsonResponse<{ job?: unknown }>(await fetch(API_ENDPOINTS.job(jobId), {
		body: JSON.stringify(input),
		headers: {
			"Content-Type": "application/json",
		},
		method: "PATCH",
	}));
	return normalizeHermesJob(payload.job);
}

export async function deleteJob(jobId: string): Promise<void> {
	const response = await fetch(API_ENDPOINTS.job(jobId), {
		method: "DELETE",
	});
	if (!response.ok && response.status !== 204) {
		await parseJsonResponse(response);
	}
}

export async function runJobAction(
	jobId: string,
	action: "pause" | "resume" | "run",
): Promise<HermesJob> {
	const payload = await parseJsonResponse<{ job?: unknown }>(await fetch(API_ENDPOINTS.jobAction(jobId, action), {
		body: JSON.stringify({}),
		headers: {
			"Content-Type": "application/json",
		},
		method: "POST",
	}));
	return normalizeHermesJob(payload.job);
}

export async function fetchMemoryDocument(target: HermesMemoryTarget): Promise<HermesMemoryDocument> {
	const payload = await parseJsonResponse<{ memory?: unknown }>(await fetch(API_ENDPOINTS.memory(target), {
		method: "GET",
	}));
	return normalizeHermesMemoryDocument(target, payload.memory);
}

export async function fetchMemoryDocuments(): Promise<Record<HermesMemoryTarget, HermesMemoryDocument>> {
	const [memory, user] = await Promise.all([
		fetchMemoryDocument("memory"),
		fetchMemoryDocument("user"),
	]);
	return { memory, user };
}

export async function replaceMemoryDocument(
	target: HermesMemoryTarget,
	input: { content?: string; entries?: Array<{ content: string }> | string[] },
): Promise<HermesMemoryDocument> {
	const payload = await parseJsonResponse<{ memory?: unknown }>(await fetch(API_ENDPOINTS.memory(target), {
		body: JSON.stringify(input),
		headers: {
			"Content-Type": "application/json",
		},
		method: "PUT",
	}));
	return normalizeHermesMemoryDocument(target, payload.memory);
}

export async function addMemoryEntry(
	target: HermesMemoryTarget,
	content: string,
): Promise<HermesMemoryDocument> {
	const payload = await parseJsonResponse<{ memory?: unknown }>(await fetch(API_ENDPOINTS.memoryEntry(target), {
		body: JSON.stringify({ content }),
		headers: {
			"Content-Type": "application/json",
		},
		method: "POST",
	}));
	return normalizeHermesMemoryDocument(target, payload.memory);
}

export async function deleteMemoryEntry(
	target: HermesMemoryTarget,
	entryId: string,
): Promise<HermesMemoryDocument> {
	const payload = await parseJsonResponse<{ memory?: unknown }>(await fetch(`${API_ENDPOINTS.memoryEntry(target)}?entryId=${encodeURIComponent(entryId)}`, {
		method: "DELETE",
	}));
	return normalizeHermesMemoryDocument(target, payload.memory);
}

export async function fetchSkills(query?: string): Promise<HermesSkillSummary[]> {
	const endpoint = query && query.trim()
		? `${API_ENDPOINTS.SKILLS}?q=${encodeURIComponent(query.trim())}`
		: API_ENDPOINTS.SKILLS;
	const payload = await parseJsonResponse<{ skills?: unknown[] }>(await fetch(endpoint, {
		method: "GET",
	}));
	return Array.isArray(payload.skills) ? payload.skills.map(normalizeHermesSkillSummary) : [];
}

export async function fetchSkillDetail(category: string, name: string): Promise<HermesSkillDetail> {
	const payload = await parseJsonResponse<{ skill?: unknown }>(await fetch(API_ENDPOINTS.skill(category, name), {
		method: "GET",
	}));
	return normalizeHermesSkillDetail(payload.skill);
}

export async function fetchSkillBundleDetail(category: string, name: string): Promise<HermesSkillBundleDetail> {
	const payload = await parseJsonResponse<{ skill?: unknown }>(await fetch(API_ENDPOINTS.skillBundle(category, name), {
		method: "GET",
	}));
	return normalizeHermesSkillBundleDetail(payload.skill);
}

export async function toggleSkill(category: string, name: string, enabled: boolean): Promise<HermesSkillDetail> {
	const payload = await parseJsonResponse<{ skill?: unknown }>(await fetch(API_ENDPOINTS.skillToggle(category, name), {
		body: JSON.stringify({ enabled }),
		headers: {
			"Content-Type": "application/json",
		},
		method: "POST",
	}));
	return normalizeHermesSkillDetail(payload.skill);
}

export async function fetchSkillDrafts(status?: HermesSkillDraftSummary["status"]): Promise<HermesSkillDraftSummary[]> {
	const endpoint = status
		? `${API_ENDPOINTS.SKILL_DRAFTS}?status=${encodeURIComponent(status)}`
		: API_ENDPOINTS.SKILL_DRAFTS;
	const payload = await parseJsonResponse<{ drafts?: unknown[] }>(await fetch(endpoint, {
		method: "GET",
	}));
	return Array.isArray(payload.drafts) ? payload.drafts.map(normalizeHermesSkillDraftSummary) : [];
}

export async function fetchSkillDraftDetail(draftId: string): Promise<HermesSkillDraftDetail> {
	const payload = await parseJsonResponse<{ draft?: unknown }>(await fetch(API_ENDPOINTS.skillDraft(draftId), {
		method: "GET",
	}));
	return normalizeHermesSkillDraftDetail(payload.draft);
}

export async function approveSkillDraft(draftId: string): Promise<HermesSkillDraftDetail> {
	const payload = await parseJsonResponse<{ draft?: unknown }>(await fetch(API_ENDPOINTS.skillDraftApprove(draftId), {
		method: "POST",
	}));
	return normalizeHermesSkillDraftDetail(payload.draft);
}

export async function rejectSkillDraft(draftId: string): Promise<HermesSkillDraftDetail> {
	const payload = await parseJsonResponse<{ draft?: unknown }>(await fetch(API_ENDPOINTS.skillDraftReject(draftId), {
		method: "POST",
	}));
	return normalizeHermesSkillDraftDetail(payload.draft);
}

export async function deleteSkillDraft(draftId: string): Promise<HermesSkillDraftSummary | null> {
	const payload = await parseJsonResponse<{ draft?: unknown | null }>(await fetch(API_ENDPOINTS.skillDraft(draftId), {
		method: "DELETE",
	}));
	return payload.draft ? normalizeHermesSkillDraftSummary(payload.draft) : null;
}

export async function searchSessions(query: string, limit?: number): Promise<SessionSearchResult[]> {
	if (!query || !query.trim()) {
		return [];
	}

	const payload = await parseJsonResponse<{ results?: unknown[] }>(
		await fetch(API_ENDPOINTS.sessionSearch(query.trim(), limit), {
			method: "GET",
		}),
	);

	if (!Array.isArray(payload.results)) {
		return [];
	}

	return payload.results.map((raw) => {
		const item = raw && typeof raw === "object" ? raw as Record<string, unknown> : {};
		return {
			threadId: getString(item.threadId) ?? "",
			title: getString(item.title) ?? "Untitled",
			snippet: getString(item.snippet) ?? "",
			matchCount: typeof item.matchCount === "number" ? item.matchCount : 0,
			lastMessageAt: getString(item.lastMessageAt) ?? new Date().toISOString(),
		};
	});
}

function normalizeCheckpoint(raw: unknown): Checkpoint {
	const item = raw && typeof raw === "object" ? raw as Record<string, unknown> : {};
	return {
		id: getString(item.id) ?? "",
		name: getString(item.name) ?? "Unnamed",
		description: getString(item.description),
		createdAt: getString(item.createdAt) ?? new Date().toISOString(),
	};
}

export async function fetchCheckpoints(): Promise<Checkpoint[]> {
	const payload = await parseJsonResponse<{ checkpoints?: unknown[] }>(
		await fetch(API_ENDPOINTS.CHECKPOINTS, { method: "GET" }),
	);
	return Array.isArray(payload.checkpoints)
		? payload.checkpoints.map(normalizeCheckpoint)
		: [];
}

export async function createCheckpoint(name: string, description?: string): Promise<Checkpoint> {
	const payload = await parseJsonResponse<{ checkpoint?: unknown }>(
		await fetch(API_ENDPOINTS.CHECKPOINTS, {
			body: JSON.stringify({ name, description }),
			headers: { "Content-Type": "application/json" },
			method: "POST",
		}),
	);
	return normalizeCheckpoint(payload.checkpoint);
}

export async function rollbackCheckpoint(id: string): Promise<Checkpoint> {
	const payload = await parseJsonResponse<{ checkpoint?: unknown }>(
		await fetch(API_ENDPOINTS.checkpointRollback(id), { method: "POST" }),
	);
	return normalizeCheckpoint(payload.checkpoint);
}

export async function deleteCheckpoint(id: string): Promise<Checkpoint> {
	const payload = await parseJsonResponse<{ checkpoint?: unknown }>(
		await fetch(API_ENDPOINTS.checkpoint(id), { method: "DELETE" }),
	);
	return normalizeCheckpoint(payload.checkpoint);
}

function normalizeHubSkill(raw: unknown): HermesHubSkill {
	const item = raw && typeof raw === "object" ? raw as Record<string, unknown> : {};
	return {
		name: getString(item.name) ?? "unknown",
		description: getString(item.description),
		category: getString(item.category) ?? "community",
		source: getString(item.source),
		identifier: getString(item.identifier),
		trustLevel:
			item.trustLevel === "builtin" || item.trustLevel === "trusted" || item.trustLevel === "community"
				? item.trustLevel
				: null,
		tags: Array.isArray(item.tags) ? item.tags.filter((t): t is string => typeof t === "string") : [],
		extra: item.extra && typeof item.extra === "object" ? item.extra as Record<string, unknown> : {},
	};
}

export async function searchSkillsHub(
	query: string,
	options?: { source?: string; limit?: number },
): Promise<HermesHubSkill[]> {
	if (!query || !query.trim()) {
		return [];
	}

	const payload = await parseJsonResponse<{ results?: unknown[] }>(
		await fetch(API_ENDPOINTS.skillsHubSearch(query.trim(), options?.source, options?.limit), { method: "GET" }),
	);

	if (!Array.isArray(payload.results)) {
		return [];
	}

	return payload.results.map(normalizeHubSkill);
}

export async function browseSkillsHub(
	options?: { page?: number; pageSize?: number; source?: string },
): Promise<HermesHubBrowseResult> {
	const payload = await parseJsonResponse<{
		results?: unknown[];
		total?: number;
		page?: number;
		totalPages?: number;
	}>(
		await fetch(API_ENDPOINTS.skillsHubBrowse(options?.page, options?.pageSize, options?.source), {
			method: "GET",
		}),
	);

	return {
		results: Array.isArray(payload.results) ? payload.results.map(normalizeHubSkill) : [],
		total: typeof payload.total === "number" ? payload.total : 0,
		page: typeof payload.page === "number" ? payload.page : 1,
		totalPages: typeof payload.totalPages === "number" ? payload.totalPages : 1,
	};
}

export async function inspectHubSkill(identifier: string): Promise<HermesHubInspectResult> {
	const payload = await parseJsonResponse<{ meta?: unknown; preview?: unknown }>(
		await fetch(API_ENDPOINTS.skillsHubInspect(identifier), { method: "GET" }),
	);

	return {
		meta: payload.meta ? normalizeHubSkill(payload.meta) : null,
		preview: typeof payload.preview === "string" ? payload.preview : null,
	};
}

export async function installHubSkillById(
	identifier: string,
	options?: { category?: string; force?: boolean },
): Promise<HermesHubInstallResult> {
	const payload = await parseJsonResponse<Record<string, unknown>>(
		await fetch(API_ENDPOINTS.SKILLS_HUB_INSTALL_BY_ID, {
			body: JSON.stringify({
				identifier,
				category: options?.category,
				force: options?.force,
			}),
			headers: { "Content-Type": "application/json" },
			method: "POST",
		}),
	);
	return {
		installed: Boolean(payload.installed),
		path: getString(payload.path) ?? "",
		name: getString(payload.name) ?? identifier.split("/").pop() ?? "unknown",
		category: getString(payload.category) ?? options?.category ?? "community",
	};
}

export async function fetchInstalledHubSkills(): Promise<HermesHubSkill[]> {
	const payload = await parseJsonResponse<{ skills?: unknown[] }>(
		await fetch(API_ENDPOINTS.SKILLS_HUB_INSTALLED, { method: "GET" }),
	);

	if (!Array.isArray(payload.skills)) {
		return [];
	}

	return payload.skills.map(normalizeHubSkill);
}

export async function installHubSkill(bundle: {
	name: string;
	category?: string;
	files: Array<{ path: string; content: string }>;
}): Promise<HermesHubInstallResult> {
	const payload = await parseJsonResponse<Record<string, unknown>>(
		await fetch(API_ENDPOINTS.SKILLS_HUB_INSTALL, {
			body: JSON.stringify(bundle),
			headers: { "Content-Type": "application/json" },
			method: "POST",
		}),
	);
	return {
		installed: Boolean(payload.installed),
		path: getString(payload.path) ?? "",
		name: getString(payload.name) ?? bundle.name,
		category: getString(payload.category) ?? bundle.category ?? "community",
	};
}
