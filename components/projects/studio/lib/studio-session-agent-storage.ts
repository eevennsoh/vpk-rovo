import type { RovoDataParts } from "@/lib/rovo-ui-messages";
import type {
	StudioAgentPublishStatus,
	StudioSessionAgentEntry,
} from "@/app/contexts/context-rovo-chat";

function isPlainRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

export const STUDIO_SESSION_AGENTS_STORAGE_KEY = "vpk:studio:session-agents:v1";
const LEGACY_PUBLISHED_AGENTS_STORAGE_KEY = "vpk:studio:published-agents:v1";

export interface PersistedSessionAgentRecord {
	readonly profileId: string;
	readonly resultKey: string;
	readonly sourceResult: RovoDataParts["agent-result"];
	readonly draftResult: RovoDataParts["agent-result"];
	readonly publishReadyResult: RovoDataParts["agent-result"];
	readonly publishedResult: RovoDataParts["agent-result"] | null;
	readonly publishStatus: StudioAgentPublishStatus;
	readonly lastTouchedAt: number;
}

interface LegacyPublishedAgentRecord {
	readonly profileId: string;
	readonly profileName?: string;
	readonly resultKey: string;
	readonly result: RovoDataParts["agent-result"];
	readonly lastTouchedAt?: number;
}

function isStorageAvailable(): boolean {
	return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function isAgentResult(value: unknown): value is RovoDataParts["agent-result"] {
	if (!isPlainRecord(value)) {
		return false;
	}
	return (
		typeof value.agentId === "string" &&
		typeof value.name === "string" &&
		typeof value.summary === "string" &&
		typeof value.action === "string"
	);
}

function isPublishStatus(value: unknown): value is StudioAgentPublishStatus {
	return value === "testing" || value === "published";
}

function isPersistedSessionAgentRecord(value: unknown): value is PersistedSessionAgentRecord {
	if (!isPlainRecord(value)) {
		return false;
	}
	return (
		typeof value.profileId === "string" &&
		typeof value.resultKey === "string" &&
		isAgentResult(value.sourceResult) &&
		isAgentResult(value.draftResult) &&
		isAgentResult(value.publishReadyResult) &&
		(value.publishedResult === null || isAgentResult(value.publishedResult)) &&
		isPublishStatus(value.publishStatus) &&
		typeof value.lastTouchedAt === "number" &&
		Number.isFinite(value.lastTouchedAt)
	);
}

function isLegacyPublishedAgentRecord(value: unknown): value is LegacyPublishedAgentRecord {
	if (!isPlainRecord(value)) {
		return false;
	}
	return (
		typeof value.profileId === "string" &&
		typeof value.resultKey === "string" &&
		isAgentResult(value.result)
	);
}

function parseStoredArray<T>(raw: string | null, guard: (value: unknown) => value is T): T[] {
	if (!raw) {
		return [];
	}
	try {
		const parsed = JSON.parse(raw) as unknown;
		if (!Array.isArray(parsed)) {
			return [];
		}
		return parsed.filter(guard);
	} catch {
		return [];
	}
}

function migrateLegacyRecord(record: LegacyPublishedAgentRecord): PersistedSessionAgentRecord {
	const lastTouchedAt =
		typeof record.lastTouchedAt === "number" && Number.isFinite(record.lastTouchedAt)
			? record.lastTouchedAt
			: Date.now();

	return {
		profileId: record.profileId,
		resultKey: record.resultKey,
		sourceResult: record.result,
		draftResult: record.result,
		publishReadyResult: record.result,
		publishedResult: record.result,
		publishStatus: "published",
		lastTouchedAt,
	};
}

export function readSessionAgentRecords(): PersistedSessionAgentRecord[] {
	if (!isStorageAvailable()) {
		return [];
	}

	try {
		const storage = window.localStorage;
		const currentRaw = storage.getItem(STUDIO_SESSION_AGENTS_STORAGE_KEY);
		if (currentRaw !== null) {
			return parseStoredArray(currentRaw, isPersistedSessionAgentRecord);
		}

		const legacyRaw = storage.getItem(LEGACY_PUBLISHED_AGENTS_STORAGE_KEY);
		if (legacyRaw === null) {
			return [];
		}

		const legacyRecords = parseStoredArray(legacyRaw, isLegacyPublishedAgentRecord);
		const migrated = legacyRecords.map(migrateLegacyRecord);

		// Persist the migrated payload, then delete the legacy key only if the
		// write succeeded. If setItem throws (quota, serialization), keep the
		// legacy key so a future read can retry the migration.
		try {
			storage.setItem(STUDIO_SESSION_AGENTS_STORAGE_KEY, JSON.stringify(migrated));
			storage.removeItem(LEGACY_PUBLISHED_AGENTS_STORAGE_KEY);
		} catch {
			// Persistence failed; keep legacy key for next attempt.
		}

		return migrated;
	} catch {
		return [];
	}
}

export function writeSessionAgentRecords(
	records: readonly PersistedSessionAgentRecord[],
): void {
	if (!isStorageAvailable()) {
		return;
	}
	try {
		window.localStorage.setItem(
			STUDIO_SESSION_AGENTS_STORAGE_KEY,
			JSON.stringify(records),
		);
	} catch {
		// Ignore quota / serialization failures; persistence is best-effort.
	}
}

export function toPersistedRecord(entry: StudioSessionAgentEntry): PersistedSessionAgentRecord {
	return {
		profileId: entry.profile.id,
		resultKey: entry.resultKey,
		sourceResult: entry.sourceResult,
		draftResult: entry.draftResult,
		publishReadyResult: entry.publishReadyResult,
		publishedResult: entry.publishedResult,
		publishStatus: entry.publishStatus,
		lastTouchedAt: entry.lastTouchedAt,
	};
}
