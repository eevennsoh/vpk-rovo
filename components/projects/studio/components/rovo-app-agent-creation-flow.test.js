const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const SHELL_SOURCE = fs.readFileSync(
	path.join(__dirname, "rovo-app-shell.tsx"),
	"utf8",
);
const MESSAGES_SOURCE = fs.readFileSync(
	path.join(__dirname, "rovo-app-messages.tsx"),
	"utf8",
);

test("RovoAppShell starts Studio agent creation only from the default-agent home composer", () => {
	assert.match(SHELL_SOURCE, /const DEFAULT_COMPOSER_PLACEHOLDER = "Describe the agent you want to build";/u);
	assert.match(SHELL_SOURCE, /function buildStudioAgentCreationContext\(originalBrief: string\): string/u);
	assert.match(SHELL_SOURCE, /"Source: \/studio prompt input"/u);
	assert.match(SHELL_SOURCE, /"Original user brief:"/u);
	assert.match(SHELL_SOURCE, /Clarification rule: Ask clarifying questions only when required agent profile details are missing/u);
	assert.match(SHELL_SOURCE, /Structured result rule: When the agent profile is ready, emit a structured data-agent-result/u);
	assert.match(SHELL_SOURCE, /const isDefaultAgentHomeState = showHomeState && !isCustomAgentSelected;/u);
	assert.match(SHELL_SOURCE, /const shouldStartStudioAgentCreation = isDefaultAgentHomeStateRef\.current && !isRealtimeActive;/u);
	assert.match(SHELL_SOURCE, /\.\.\.\(shouldStartStudioAgentCreation \? \{ creationMode: "agent" as const \} : \{\}\)/u);
	assert.ok((SHELL_SOURCE.match(/creationMode: "agent"/gu) ?? []).length >= 1);
});

test("Studio home starters frame agent building instead of generic one-off tasks", () => {
	assert.match(SHELL_SOURCE, /type HomeStarterCategory = "analyze" \| "brainstorm" \| "review" \| "summarize" \| "create";/u);
	assert.match(SHELL_SOURCE, /const HOME_STARTER_VIEWS: Readonly<Record<HomeStarterCategory, ReadonlyArray<HomeStarterTemplate>>>/u);
	assert.match(SHELL_SOURCE, /title: "Build a triage agent"/u);
	assert.match(SHELL_SOURCE, /title: "Build a code review agent"/u);
	assert.match(SHELL_SOURCE, /title: "Build a meeting agent"/u);
	assert.match(SHELL_SOURCE, /title: "Build a knowledge agent"/u);
	assert.doesNotMatch(SHELL_SOURCE, /title: "Analyze a workstream"/u);
	assert.doesNotMatch(SHELL_SOURCE, /prompt: "Summarize this into key points/u);
});

test("Studio agent results use guarded session-agent registration with preserve-thread selection", () => {
	assert.match(SHELL_SOURCE, /type StudioAgentRegistryContext = ReturnType<typeof useRovoSelectedAgent> & \{/u);
	assert.match(SHELL_SOURCE, /registerCreatedAgentFromResult\?:/u);
	assert.match(SHELL_SOURCE, /registerAgentResult\?:/u);
	assert.match(SHELL_SOURCE, /registerSessionAgent\?:/u);
	assert.match(SHELL_SOURCE, /normalizeStudioAgentResult\(agentResult\)/u);
	assert.match(SHELL_SOURCE, /studioAgentRegistry\.registerCreatedAgentFromResult\(agentResult, \{[\s\S]*preserveCurrentThread: true,[\s\S]*select: true,[\s\S]*sourceKey,/u);
	assert.match(SHELL_SOURCE, /if \(!didRegisterAgent\) \{[\s\S]*return false;[\s\S]*\}/u);
	assert.match(SHELL_SOURCE, /studioAgentRegistry\.selectAgent\(agentId, \{ preserveCurrentThread: true \}\);/u);
	assert.match(SHELL_SOURCE, /const agentResult = getMessageAgentResult\(message\);/u);
	assert.match(SHELL_SOURCE, /if \(handleStudioAgentResultSelect\(agentResult, \{ sourceMessageId: message\.id \}\)\) \{[\s\S]*handledAgentResultKeysRef\.current\.add\(agentResultKey\);/u);
	assert.match(SHELL_SOURCE, /studioAgentCreationThreadKeysRef\.current\.delete\(chat\.runtimeThreadId\);/u);
});

test("RovoAppMessages renders the shared /agents-style agent result card", () => {
	assert.match(MESSAGES_SOURCE, /getMessageAgentResult/u);
	assert.match(MESSAGES_SOURCE, /type RovoDataParts/u);
	assert.match(MESSAGES_SOURCE, /import \{ AgentResultCard \} from "@\/components\/projects\/sidebar-chat\/components\/agent-result-card";/u);
	assert.match(MESSAGES_SOURCE, /const agentResult = getMessageAgentResult\(message\);/u);
	assert.match(MESSAGES_SOURCE, /<AgentResultCard[\s\S]*agent=\{agentResult\}[\s\S]*sourceMessageId: message\.id/u);
	assert.doesNotMatch(MESSAGES_SOURCE, /function StudioAgentResultCard/u);
});

test("Studio clarification answers keep agent creation mode active", () => {
	assert.match(SHELL_SOURCE, /function buildStudioAgentCreationContinuationContext\(\): string/u);
	assert.match(SHELL_SOURCE, /Source: \/studio prompt input clarification answer/u);
	assert.match(SHELL_SOURCE, /const getStudioAgentCreationClarificationOptions = useCallback/u);
	assert.match(SHELL_SOURCE, /creationMode: "agent" as const/u);
	assert.match(SHELL_SOURCE, /submitClarification\([\s\S]*activeQuestionCard,[\s\S]*answers,[\s\S]*getStudioAgentCreationClarificationOptions\(\),/u);
	assert.match(SHELL_SOURCE, /onDismissQuestionCard: handleCancelClarificationQuestionSet/u);
});
