import type {
	RovoAppHermesContext,
	RovoAppThread,
	RovoAppVisibility,
} from "@/lib/rovo-app-types";
import type { RovoUIMessage } from "@/lib/rovo-ui-messages";

export const ROVO_APP_ROOT_PATH = "/studio";

export function buildRovoAppThreadPersistKey(options: {
	messages: ReadonlyArray<RovoUIMessage>;
	realtimeMessages: ReadonlyArray<RovoUIMessage>;
	visibility: RovoAppVisibility;
	activeDocumentId: string | null;
	hermesContext?: RovoAppHermesContext | null;
	title: string;
}): string {
	return JSON.stringify({
		messages: options.messages,
		realtimeMessages: options.realtimeMessages,
		visibility: options.visibility,
		activeDocumentId: options.activeDocumentId,
		hermesContext: options.hermesContext ?? null,
		title: options.title,
	});
}

export function buildRovoAppThreadPath(threadId: string): string {
	return `${ROVO_APP_ROOT_PATH}/${encodeURIComponent(threadId)}`;
}

const ROVO_APP_RESERVED_SEGMENTS = new Set(["jobs", "memories", "skills", "settings"]);

export function getRovoAppThreadIdFromPath(pathname: string): string | null {
	const normalizedPath =
		pathname === `${ROVO_APP_ROOT_PATH}/`
			? ROVO_APP_ROOT_PATH
			: pathname;

	if (normalizedPath === ROVO_APP_ROOT_PATH) {
		return null;
	}

	const threadPathPrefix = `${ROVO_APP_ROOT_PATH}/`;
	if (!normalizedPath.startsWith(threadPathPrefix)) {
		return null;
	}

	const threadIdSegment = normalizedPath.slice(threadPathPrefix.length);
	if (!threadIdSegment || threadIdSegment.includes("/")) {
		return null;
	}

	if (ROVO_APP_RESERVED_SEGMENTS.has(threadIdSegment)) {
		return null;
	}

	try {
		return decodeURIComponent(threadIdSegment);
	} catch {
		return null;
	}
}

export function shouldReplaceRovoAppRouteAfterPersistence(options: {
	pendingThreadId: string | null;
	thread: RovoAppThread;
	messages: ReadonlyArray<RovoUIMessage>;
	realtimeMessages: ReadonlyArray<RovoUIMessage>;
	visibility: RovoAppVisibility;
	activeDocumentId: string | null;
	hermesContext?: RovoAppHermesContext | null;
	title: string;
}): boolean {
	if (!options.pendingThreadId || options.thread.id !== options.pendingThreadId) {
		return false;
	}

	const expectedPersistKey = buildRovoAppThreadPersistKey({
		messages: options.messages,
		realtimeMessages: options.realtimeMessages,
		visibility: options.visibility,
		activeDocumentId: options.activeDocumentId,
		hermesContext: options.hermesContext ?? null,
		title: options.title,
	});
	const persistedThreadKey = buildRovoAppThreadPersistKey({
		messages: options.thread.messages,
		realtimeMessages: options.thread.realtimeMessages,
		visibility: options.thread.visibility,
		activeDocumentId: options.thread.activeDocumentId,
		hermesContext: options.thread.hermesContext ?? null,
		title: options.thread.title,
	});

	return persistedThreadKey === expectedPersistKey;
}

export function shouldSkipRovoAppThreadLoad(options: {
	activeThreadId: string | null;
	hasHydratedThreadState: boolean;
	requestedThreadId: string;
}): boolean {
	if (!options.activeThreadId || !options.hasHydratedThreadState) {
		return false;
	}

	return options.activeThreadId === options.requestedThreadId;
}

export function shouldLoadInitialRovoAppThread(options: {
	initialThreadId: string | null;
	lastLoadedInitialThreadId: string | null;
}): options is {
	initialThreadId: string;
	lastLoadedInitialThreadId: string | null;
} {
	if (!options.initialThreadId) {
		return false;
	}

	return options.initialThreadId !== options.lastLoadedInitialThreadId;
}

export function shouldReplacePendingRovoAppRoute(options: {
	activeThreadId: string | null;
	embedded: boolean;
	hasPersistedThreadState: boolean;
	isStreaming: boolean;
	isVoiceMode: boolean;
	pendingThreadId: string | null;
}): boolean {
	if (options.embedded || options.isVoiceMode || options.isStreaming) {
		return false;
	}

	if (!options.activeThreadId || !options.pendingThreadId) {
		return false;
	}

	if (!options.hasPersistedThreadState) {
		return false;
	}

	return options.activeThreadId === options.pendingThreadId;
}
