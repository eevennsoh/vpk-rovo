const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const HOOK_SOURCE = fs.readFileSync(path.join(__dirname, "use-rovo-app.ts"), "utf8");
const TYPES_SOURCE = fs.readFileSync(
	path.join(process.cwd(), "lib/rovo-app-types.ts"),
	"utf8",
);

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
