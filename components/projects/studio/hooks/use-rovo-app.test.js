const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const HOOK_SOURCE = fs.readFileSync(path.join(__dirname, "use-rovo-app.ts"), "utf8");
const ROVO_HOOK_SOURCE = fs.readFileSync(
	path.join(process.cwd(), "components/projects/rovo/hooks/use-rovo-app.ts"),
	"utf8",
);
const THREAD_LIST_SOURCE = fs.readFileSync(
	path.join(__dirname, "use-rovo-app-thread-list.ts"),
	"utf8",
);
const ROVO_THREAD_LIST_SOURCE = fs.readFileSync(
	path.join(process.cwd(), "components/projects/rovo/hooks/use-rovo-app-thread-list.ts"),
	"utf8",
);
const TYPES_SOURCE = fs.readFileSync(
	path.join(process.cwd(), "lib/rovo-app-types.ts"),
	"utf8",
);

test("passive Rovo app thread refresh is quiet and not a 3-second poll", () => {
	for (const source of [HOOK_SOURCE, ROVO_HOOK_SOURCE]) {
		assert.match(source, /const ROVO_APP_PASSIVE_THREAD_REFRESH_INTERVAL_MS = 15_000;/u);
		assert.match(source, /reportBackendUnavailable\?: boolean;/u);
		assert.match(source, /const reportBackendUnavailable = options\.reportBackendUnavailable \?\? true;/u);
		assert.match(source, /void refreshThreads\(\{ reportBackendUnavailable: false \}\);/u);
		assert.match(source, /if \(reportBackendUnavailable\) \{\s*setInputError\(getRovoAppBackendUnavailableUserMessage\(\)\);/u);
		assert.doesNotMatch(source, /void refreshThreads\(\{ reportBackendUnavailable: false \}\);[\s\S]{0,160}\}, 3000\);/u);
	}

	assert.doesNotMatch(THREAD_LIST_SOURCE, /setInterval\(/u);
	assert.match(THREAD_LIST_SOURCE, /document\.addEventListener\("visibilitychange", handleVisibilityChange\);/u);
	assert.match(ROVO_THREAD_LIST_SOURCE, /const ROVO_APP_PASSIVE_THREAD_REFRESH_INTERVAL_MS = 15_000;/u);
	assert.doesNotMatch(ROVO_THREAD_LIST_SOURCE, /setInterval\([\s\S]*,\s*3000\);/u);
});

test("Studio thread list keeps its serialized refresh cache aligned with optimistic deletes", () => {
	assert.match(
		THREAD_LIST_SOURCE,
		/function serializeRovoAppThreads\(threads: ReadonlyArray<RovoAppThread>\): string \{\s*return JSON\.stringify\(threads\);\s*\}/u,
	);
	assert.match(
		THREAD_LIST_SOURCE,
		/const nextSerialized = serializeRovoAppThreads\(result\);/u,
	);
	assert.match(
		THREAD_LIST_SOURCE,
		/setThreads\(\(prev\) => \{\s*const nextThreads = prev\.filter\(\(t\) => t\.id !== threadId\);\s*lastSerializedRef\.current = serializeRovoAppThreads\(nextThreads\);\s*return nextThreads;\s*\}\);/u,
	);
});

test("Studio queued prompt actions preserve explicit creation mode", () => {
	assert.match(
		TYPES_SOURCE,
		/export type RovoAppCreationMode = "agent" \| "skill";/u,
	);
	assert.match(
		TYPES_SOURCE,
		/export interface RovoAppQueuedPromptAction[\s\S]*creationMode\?: RovoAppCreationMode;[\s\S]*mode: RovoAppPromptMode;/u,
	);
	assert.match(
		HOOK_SOURCE,
		/type RovoAppCreationMode,/u,
	);
	assert.match(
		HOOK_SOURCE,
		/const enqueuePromptAction = useCallback\([\s\S]*creationMode\?: RovoAppCreationMode;[\s\S]*const queuedAction: RovoAppQueuedPromptAction = \{[\s\S]*creationMode,[\s\S]*mode,/u,
	);
	assert.match(
		HOOK_SOURCE,
		/await dispatchPromptNow\(\{[\s\S]*creationMode: nextAction\.creationMode,[\s\S]*mode: nextAction\.mode,/u,
	);
});

test("Studio prompt dispatch only sends creation mode when callers pass it", () => {
	assert.match(
		HOOK_SOURCE,
		/submitPrompt: \(payload: \{[\s\S]*creationMode\?: RovoAppCreationMode;/u,
	);
	assert.match(
		HOOK_SOURCE,
		/const submitPrompt = useCallback\([\s\S]*creationMode,[\s\S]*\}: \{[\s\S]*creationMode\?: RovoAppCreationMode;/u,
	);
	assert.match(
		HOOK_SOURCE,
		/await dispatchPromptNow\(\{[\s\S]*creationMode,[\s\S]*mode: promptMode,/u,
	);
	assert.match(
		HOOK_SOURCE,
		/body: \{[\s\S]*contextDescription,[\s\S]*\.\.\.\(creationMode \? \{ creationMode \} : \{\}\),[\s\S]*hermesContext,/u,
	);
	assert.doesNotMatch(
		HOOK_SOURCE,
		/creationMode:\s*(?:mode|promptMode|isPlanMode|requestedPlanMode)/u,
	);
});

test("Studio transport preserves creation mode in prepared request bodies", () => {
	assert.match(
		HOOK_SOURCE,
		/const requestedCreationMode =[\s\S]*body\?\.creationMode === "agent" \|\| body\?\.creationMode === "skill"[\s\S]*\? body\.creationMode[\s\S]*: undefined;/u,
	);
	assert.match(
		HOOK_SOURCE,
		/body: \{[\s\S]*\.\.\.\(body \?\? \{\}\),[\s\S]*\.\.\.\(requestedCreationMode[\s\S]*\? \{ creationMode: requestedCreationMode \}[\s\S]*: \{\}\),/u,
	);
});

test("Studio clarification continuations can preserve agent creation mode", () => {
	assert.match(
		HOOK_SOURCE,
		/interface RovoAppClarificationSubmitOptions \{[\s\S]*contextDescription\?: string;[\s\S]*creationMode\?: RovoAppCreationMode;[\s\S]*\}/u,
	);
	assert.match(
		HOOK_SOURCE,
		/const AGENT_CREATION_POST_CLARIFICATION_CONTEXT = \[[\s\S]*POST-CLARIFICATION — Studio Agent Creation[\s\S]*structured agent result/u,
	);
	assert.match(
		HOOK_SOURCE,
		/const submitClarification = useCallback\([\s\S]*options\?: RovoAppClarificationSubmitOptions[\s\S]*const creationMode = options\?\.creationMode;[\s\S]*const wasPlanModeActive = !creationMode && isPlanModeRef\.current;/u,
	);
	assert.match(
		HOOK_SOURCE,
		/body: Record<string, unknown> = \{[\s\S]*contextDescription,[\s\S]*\.\.\.\(creationMode \? \{ creationMode \} : \{\}\),[\s\S]*clarification:/u,
	);
	assert.doesNotMatch(
		HOOK_SOURCE,
		/isPlanModeRef\.current \|\| Boolean\(questionCard\.deferredToolCallId\)/u,
	);
});
