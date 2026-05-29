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
const AGENT_CONFIG_PANEL_SOURCE = fs.readFileSync(
	path.join(__dirname, "rovo-app-agent-config-panel.tsx"),
	"utf8",
);
const UI_CUSTOM_AGENT_SOURCE = fs.readFileSync(
	path.join(process.cwd(), "components/ui-custom/agent.tsx"),
	"utf8",
);
const NAV_HOOK_SOURCE = fs.readFileSync(
	path.join(process.cwd(), "components/blocks/top-navigation/hooks/use-top-navigation.ts"),
	"utf8",
);

test("RovoAppShell starts Studio agent creation only from the default-agent home composer", () => {
	assert.match(SHELL_SOURCE, /const DEFAULT_COMPOSER_PLACEHOLDER = "Describe the agent you want to build";/u);
	assert.match(SHELL_SOURCE, /function buildStudioAgentCreationContext\(originalBrief: string\): string/u);
	assert.match(SHELL_SOURCE, /\[Studio Agent Creation Request\]/u);
	assert.match(SHELL_SOURCE, /"Source: \/studio prompt input\."/u);
	assert.match(SHELL_SOURCE, /"Original user brief:"/u);
	assert.match(SHELL_SOURCE, /Required agent profile fields/u);
	assert.match(SHELL_SOURCE, /- agentId: stable kebab-case slug/u);
	assert.match(SHELL_SOURCE, /- conversationStarters: 2.{1,3}4 starter prompts/u);
	assert.match(SHELL_SOURCE, /Clarification rule: Use the existing ask_user_questions\/question-card flow/u);
	assert.match(SHELL_SOURCE, /Expected output: build the agent profile now and emit exactly one structured AGENT_RESULT marker/u);
	assert.match(SHELL_SOURCE, /const isDefaultAgentHomeState = showHomeState && !isCustomAgentSelected;/u);
	assert.match(SHELL_SOURCE, /const shouldStartStudioAgentCreation = isDefaultAgentHomeStateRef\.current && !isRealtimeActive;/u);
	assert.match(SHELL_SOURCE, /\.\.\.\(shouldStartStudioAgentCreation \? \{ creationMode: "agent" as const \} : \{\}\)/u);
	assert.ok((SHELL_SOURCE.match(/creationMode: "agent"/gu) ?? []).length >= 1);
});

test("Studio home starters frame agent building instead of generic one-off tasks", () => {
	assert.match(SHELL_SOURCE, /type HomeStarterCategory = "analyze" \| "brainstorm" \| "review" \| "summarize" \| "create";/u);
	assert.match(SHELL_SOURCE, /const HOME_STARTER_VIEWS: Readonly<Record<HomeStarterCategory, ReadonlyArray<HomeStarterTemplate>>>/u);
	const homeStarterViewsSource = SHELL_SOURCE.slice(
		SHELL_SOURCE.indexOf("const HOME_STARTER_VIEWS"),
		SHELL_SOURCE.indexOf("function parseCssDurationMs"),
	);
	const starterTitles = [...homeStarterViewsSource.matchAll(/\btitle: "([^"]+)"/gu)].map((match) => match[1]);

	assert.equal(starterTitles.length, 36);
	for (const title of starterTitles) {
		assert.doesNotMatch(title, /agent/iu);
	}

	for (const title of [
		"Product Requirements Guide",
		"Release Notes Drafter",
		"Brand Voice Crafter",
		"Social Media Writer",
		"Global Translator",
		"Meeting Insights",
		"Decision Director",
		"OKR Generator",
		"Work Item Planner",
		"Progress Tracker",
		"Work Item Organizer",
		"Blocker Checker",
		"Bug Report Assistant",
		"Readiness Checker",
		"Rovo Ops",
		"Service Request Helper",
		"Service Triage",
		"Jira Theme Analyzer",
		"Transcript Insights Reporter",
		"Customer Insights",
		"User Manual Writer",
		"Rovo Expert",
	]) {
		assert.ok(starterTitles.includes(title), `${title} should be available as a Studio starter`);
	}

	assert.match(SHELL_SOURCE, /prompt: "Build a Studio agent named Product Requirements Guide/u);
	assert.match(SHELL_SOURCE, /prompt: "Build a Studio agent named Rovo Expert/u);
	assert.doesNotMatch(SHELL_SOURCE, /title: "Analyze a workstream"/u);
	assert.doesNotMatch(homeStarterViewsSource, /\btitle: "Build .* agent"/iu);
	assert.doesNotMatch(SHELL_SOURCE, /prompt: "Summarize this into key points/u);
});

test("Studio home bento applies card glow pointer flow to starter tiles", () => {
	assert.match(SHELL_SOURCE, /const HOME_STARTER_CARD_GLOW_EFFECT_STYLE/u);
	// The hover stroke color is the tile's own agent-avatar color, derived from
	// the avatar group in `iconSrc` (each /avatar-agent/<group>/ family shares one
	// brand color) — not an index-cycled palette that drifts out of sync.
	assert.match(SHELL_SOURCE, /const HOME_STARTER_AVATAR_GROUP_ACCENTS: Readonly<Record<string, string>>/u);
	assert.match(SHELL_SOURCE, /"teamwork-agents": "#1868DB"/u);
	assert.match(SHELL_SOURCE, /function getHomeStarterCardGlowAccent\(iconSrc: string\)/u);
	assert.match(SHELL_SOURCE, /getHomeStarterCardGlowAccent\(template\.iconSrc\)/u);
	assert.match(SHELL_SOURCE, /function HomeStarterCardGlowLayers/u);
	assert.match(SHELL_SOURCE, /const tileRefs = useRef<Array<HTMLButtonElement \| null>>\(\[\]\);/u);
	assert.match(SHELL_SOURCE, /onPointerMove=\{handleBentoPointerMove\}/u);
	assert.match(SHELL_SOURCE, /onPointerLeave=\{resetBentoPointer\}/u);
	assert.match(SHELL_SOURCE, /--card-glow-pointer-x", normalizedX\.toFixed\(3\)/u);
	assert.match(SHELL_SOURCE, /--card-glow-pointer-y", normalizedY\.toFixed\(3\)/u);
	assert.match(SHELL_SOURCE, /"--card-glow-tile-accent": accentColor/u);
	assert.match(SHELL_SOURCE, /"--card-glow-border-core": 36/u);
	assert.match(SHELL_SOURCE, /"--card-glow-border-spread": 120/u);
	assert.match(SHELL_SOURCE, /<HomeStarterCardGlowLayers iconSrc=\{template\.iconSrc\} \/>/u);
	assert.match(SHELL_SOURCE, /const HOME_STARTER_CARD_BASE_BORDER_STYLE: CSSProperties/u);
	// Resting stroke uses the subtle `color.border` token (matches the tiles'
	// pre-glow default), not the heavier `color.border.bold`.
	assert.match(SHELL_SOURCE, /boxShadow: `inset 0 0 0 calc\(var\(--card-glow-border-width\) \* 1px\) \$\{token\("color\.border"\)\}`/u);
	assert.doesNotMatch(SHELL_SOURCE, /token\("color\.border\.bold"\)/u);
	assert.match(SHELL_SOURCE, /borderWidth: "calc\(var\(--card-glow-border-width\) \* 1px\)"/u);
	assert.match(SHELL_SOURCE, /transparent calc\(var\(--card-glow-border-spread\) \* 1px\)/u);
	assert.match(SHELL_SOURCE, /data-home-starter-card-base-border/u);
	assert.match(SHELL_SOURCE, /data-home-starter-card-glow-border/u);
	assert.match(SHELL_SOURCE, /absolute inset-0 z-\[1\] rounded-\[inherit\]/u);
	assert.match(SHELL_SOURCE, /style=\{HOME_STARTER_CARD_BASE_BORDER_STYLE\}/u);
	assert.match(SHELL_SOURCE, /absolute inset-0 z-\[2\] overflow-hidden rounded-\[inherit\] border border-transparent/u);
	// Regression: the glow ring must coexist with the always-on grey base stroke.
	// Two invariants enforce the desired behavior:
	// 1. No backdrop-filter on the ring — an always-on filter recolors the whole
	//    ring (even where the gradient is transparent) and crushes the grey stroke.
	// 2. No per-tile hover/focus opacity gate on the ring — the glow is driven by
	//    the container-level pointer tracking so edges still light up when the
	//    cursor is in the GAPS between tiles, not only over the hovered tile.
	assert.doesNotMatch(SHELL_SOURCE, /backdropFilter/u);
	assert.doesNotMatch(SHELL_SOURCE, /z-\[2\][^"]*group-hover\/home-starter-card:opacity-100/u);
	assert.match(SHELL_SOURCE, /onPointerMove=\{handleBentoPointerMove\}/u);
	assert.match(SHELL_SOURCE, /rounded-lg bg-background/u);
	assert.match(SHELL_SOURCE, /transition-\[background-color,box-shadow\]/u);
	assert.doesNotMatch(SHELL_SOURCE, /hover:border-border-bold/u);
	assert.doesNotMatch(SHELL_SOURCE, /color-mix\(in srgb, var\(--card-glow-tile-accent\) 92%, white\)/u);
	assert.doesNotMatch(SHELL_SOURCE, /rounded-lg border border-border bg-background/u);
});

test("Studio chat header is hidden until a chat is active", () => {
	assert.match(SHELL_SOURCE, /const shouldShowChatHeader = visibleMessages\.length > 0 \|\| hasActiveThreadRun \|\| chat\.isStreaming;/u);
	assert.match(SHELL_SOURCE, /\{shouldShowChatHeader \? \(\s*<RovoAppHeader/u);
	assert.doesNotMatch(SHELL_SOURCE, /\n\t\t\t\t<RovoAppHeader/u);
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
	assert.match(SHELL_SOURCE, /const unmarkStudioAgentCreationThread = useCallback[\s\S]*studioAgentCreationThreadKeysRef\.current\.delete\(threadId\);/u);
	assert.match(SHELL_SOURCE, /unmarkStudioAgentCreationThread\(chat\.runtimeThreadId\);/u);
	assert.match(SHELL_SOURCE, /import \{ AgentsDirectoryDialog \} from "@\/components\/blocks\/agents-directory";/u);
	assert.match(SHELL_SOURCE, /sessionAgentEntries=\{studioAgentRegistry\.sessionAgentEntries\}/u);
	assert.match(SHELL_SOURCE, /sessionAgents=\{studioAgentRegistry\.sessionAgentEntries\.map\(\(entry\) => entry\.profile\)\}/u);
	assert.match(SHELL_SOURCE, /agents=\{ROVO_DIRECTORY_AGENT_PROFILES\}/u);
	assert.match(SHELL_SOURCE, /selectedAgentId=\{studioAgentRegistry\.selectedAgentId\}/u);
	assert.match(SHELL_SOURCE, /onSelectAgent=\{handleStudioSidebarAgentSelect\}/u);
	assert.match(SHELL_SOURCE, /onViewAllAgents=\{\(\) => setIsSidebarAgentBrowserOpen\(true\)\}/u);
	assert.doesNotMatch(SHELL_SOURCE, /rovo-app-agents-directory/u);
});

test("Studio opens the sidebar chat once an agent finishes building", () => {
	// The navigation hook must expose a deterministic open (not just toggle),
	// otherwise an already-open sidebar would be closed on build completion.
	assert.match(NAV_HOOK_SOURCE, /const \{ toggleChat, openChat, chatSurface \} = useRovoChat\(\);/u);
	assert.match(NAV_HOOK_SOURCE, /\n\t\topenChat,\n/u);

	// The agent-result handler surfaces the sidebar chat (gated to non-embedded
	// shells) so the freshly selected agent is ready to test before publishing.
	assert.ok(
		(SHELL_SOURCE.match(/if \(!embedded\) \{\s*nav\.openChat\("sidebar"\);\s*\}/gu) ?? []).length >= 2,
		"both registration success paths should open the sidebar chat",
	);
	assert.match(SHELL_SOURCE, /\[chat\.activeThreadId, chat\.runtimeThreadId, studioAgentRegistry, nav, embedded\]/u);
});

test("RovoAppMessages renders the block agent result card after generation completes", () => {
	assert.match(MESSAGES_SOURCE, /getMessageAgentResult/u);
	assert.match(MESSAGES_SOURCE, /hasTurnCompleteSignal/u);
	assert.match(MESSAGES_SOURCE, /type RovoDataParts/u);
	assert.match(MESSAGES_SOURCE, /import \{ AgentResultCard, isGeneratedAgentResult \} from "@\/components\/projects\/sidebar-chat\/components\/agent-result-card";/u);
	assert.match(MESSAGES_SOURCE, /const agentResult = getMessageAgentResult\(message\);/u);
	assert.match(MESSAGES_SOURCE, /const completedAgentResult =[\s\S]*isGeneratedAgentResult\(agentResult\) && hasTurnCompleteSignal\(message\)[\s\S]*\? agentResult[\s\S]*: null;/u);
	assert.match(MESSAGES_SOURCE, /const resolvedArtifactDisplayForMessage =[\s\S]*completedAgentResult \? null : resolvedArtifactDisplay;/u);
	assert.match(MESSAGES_SOURCE, /resolvedArtifactDisplayForMessage \? \([\s\S]*<ArtifactCard/u);
	assert.match(MESSAGES_SOURCE, /completedAgentResult \? \([\s\S]*<AgentResultCard[\s\S]*agent=\{completedAgentResult\}[\s\S]*sourceMessageId: message\.id/u);
	assert.doesNotMatch(MESSAGES_SOURCE, /function StudioAgentResultCard/u);
});

test("Studio agent config panel renders the shared ui-custom agent config fields", () => {
	assert.match(UI_CUSTOM_AGENT_SOURCE, /export const AgentConfigFields = memo/u);
	assert.match(UI_CUSTOM_AGENT_SOURCE, /const AGENT_AVATAR_PROFILE_COVER_COLORS: Record<string, string>/u);
	assert.match(UI_CUSTOM_AGENT_SOURCE, /"product-agents": "#BF63F3"/u);
	assert.match(UI_CUSTOM_AGENT_SOURCE, /function getAgentProfileCoverBackgroundColor\(avatarSrc: string \| undefined\): string/u);
	assert.match(UI_CUSTOM_AGENT_SOURCE, /style=\{\{ backgroundColor: coverBackgroundColor \}\}/u);
	assert.match(UI_CUSTOM_AGENT_SOURCE, /Add triggers/u);
	assert.match(UI_CUSTOM_AGENT_SOURCE, /Add conversation starters/u);
	assert.match(UI_CUSTOM_AGENT_SOURCE, /Teamwork Graph/u);
	assert.match(UI_CUSTOM_AGENT_SOURCE, /Describe the agent’s role and what it should do/u);
	assert.match(AGENT_CONFIG_PANEL_SOURCE, /AgentConfigFields/u);
	assert.match(AGENT_CONFIG_PANEL_SOURCE, /config=\{draft\}/u);
	assert.match(AGENT_CONFIG_PANEL_SOURCE, /onTextChange=\{handleConfigTextChange\}/u);
	assert.doesNotMatch(AGENT_CONFIG_PANEL_SOURCE, /<Label htmlFor=\{`agent-\$\{profileId\}-name`\}/u);
});

test("Studio screen assistant applies draft patches without publishing agents", () => {
	assert.match(SHELL_SOURCE, /onScreenAssistantResult/u);
	assert.match(SHELL_SOURCE, /normalizeAgentDraftPatch/u);
	assert.match(SHELL_SOURCE, /studioAgentRegistry\.updateSessionAgentDraft/u);
	const screenAssistantHandlerSource = SHELL_SOURCE.slice(
		SHELL_SOURCE.indexOf("onScreenAssistantResult: useCallback"),
		SHELL_SOURCE.indexOf("chatMessages: chat.messages"),
	);
	assert.match(screenAssistantHandlerSource, /lastScreenAssistantMutationTurnIdRef/u);
	assert.match(screenAssistantHandlerSource, /activeSessionAgentEntry\.profile\.id/u);
	assert.doesNotMatch(screenAssistantHandlerSource, /publishSessionAgent/u);
	assert.match(AGENT_CONFIG_PANEL_SOURCE, /data-screen-assistant-target="studio-agent-config-panel"/u);
	assert.match(UI_CUSTOM_AGENT_SOURCE, /screenAssistantTargetPrefix/u);
	assert.match(UI_CUSTOM_AGENT_SOURCE, /data-agent-field="instructions"/u);
});

test("Studio clarification answers keep agent creation mode active", () => {
	assert.match(SHELL_SOURCE, /function buildStudioAgentCreationContinuationContext\(\): string/u);
	assert.match(SHELL_SOURCE, /Source: \/studio prompt input clarification answer\./u);
	assert.match(SHELL_SOURCE, /Trigger: The user has answered the clarification questions/u);
	assert.match(SHELL_SOURCE, /Expected output: otherwise, create the reusable custom agent now and emit exactly one structured AGENT_RESULT marker/u);
	assert.match(SHELL_SOURCE, /const getStudioAgentCreationClarificationOptions = useCallback/u);
	assert.match(SHELL_SOURCE, /creationMode: "agent" as const/u);
	assert.match(SHELL_SOURCE, /submitClarification\([\s\S]*activeQuestionCard,[\s\S]*answers,[\s\S]*getStudioAgentCreationClarificationOptions\(\),/u);
	assert.match(SHELL_SOURCE, /onDismissQuestionCard: handleCancelClarificationQuestionSet/u);
});
