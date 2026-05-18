const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const AGENTS_DEMO_SOURCE = fs.readFileSync(path.join(__dirname, "agents-demo.tsx"), "utf8");
const PROJECT_DEMO_EMBEDDED_HOOK_SOURCE = fs.readFileSync(
	path.join(__dirname, "use-project-demo-embedded.ts"),
	"utf8",
);

test("AgentsDemo owns work item presentation so layout chat switches can promote modals", () => {
	assert.match(
		AGENTS_DEMO_SOURCE,
		/import \{ useAgentsWorkItemPresentation, type AgentsWorkItemPresentationController \} from "@\/components\/projects\/agents\/hooks\/use-agents-work-item-presentation";/u,
	);
	assert.match(
		AGENTS_DEMO_SOURCE,
		/const workItemPresentation = useAgentsWorkItemPresentation\(\);/u,
	);
});

test("AgentsDemo promotes the open modal before switching floating chat to the sidebar", () => {
	assert.match(
		AGENTS_DEMO_SOURCE,
		/if\s*\(\s*surface\s*!==\s*"sidebar"\s*\)\s*return;\s*promoteModalToInline\(\);/u,
	);
	assert.match(
		AGENTS_DEMO_SOURCE,
		/onChatSurfaceSwitch=\{handleChatSurfaceSwitch\}/u,
	);
	assert.match(
		AGENTS_DEMO_SOURCE,
		/<AgentsView[\s\S]*workItemPresentation=\{workItemPresentation\}[\s\S]*rfpDemo=\{rfpDemo\}[\s\S]*onCreateRfpDraftingAgent=\{handleCreateRfpDraftingAgent\}[\s\S]*chatContextBar=\{agentsChatScreenContext\.chatContextBar\}[\s\S]*chatGreeting=\{agentsChatScreenContext\.greeting\}/u,
	);
	assert.doesNotMatch(AGENTS_DEMO_SOURCE, /isAgentDetailsOpen/u);
	assert.doesNotMatch(AGENTS_DEMO_SOURCE, /onAgentDetailsOpenChange/u);
});

test("AgentsDemo hides the layout-owned Rovo surfaces while the report canvas is open", () => {
	assert.match(
		AGENTS_DEMO_SOURCE,
		/hideRovoAction=\{rfpDemo\.state\.canvas\.open\}/u,
	);
});

test("AgentsDemo closes the work item modal before opening an artifact dialog", () => {
	assert.match(
		AGENTS_DEMO_SOURCE,
		/const\s+\{\s*backToBoard,\s*closeModal,\s*promoteModalToInline\s*\}\s*=\s*workItemPresentation;/u,
	);
	assert.match(
		AGENTS_DEMO_SOURCE,
		/const isWorkItemModalOpen = workItemPresentation\.state\.mode === "modal";/u,
	);
	assert.match(
		AGENTS_DEMO_SOURCE,
		/const handleArtifactDialogOpen = useCallback\(\(\) => \{\s*if \(!isWorkItemModalOpen\) return;\s*closeModal\(\);\s*\}, \[closeModal, isWorkItemModalOpen\]\);/u,
	);
	assert.match(
		AGENTS_DEMO_SOURCE,
		/onArtifactDialogOpen=\{handleArtifactDialogOpen\}/u,
	);
	assert.match(
		AGENTS_DEMO_SOURCE,
		/preserveFloatingSurfaceOnArtifactDialogOpen=\{isWorkItemModalOpen\}/u,
	);
});

test("AgentsDemo opens Rovo agent onboarding after returning to the attached report work item", () => {
	assert.match(
		AGENTS_DEMO_SOURCE,
		/import \{ RovoChatProvider, useRovoChat \} from "@\/app\/contexts";/u,
	);
	assert.match(
		AGENTS_DEMO_SOURCE,
		/import \{ BOARD_AGENTS, type BoardAgentData \} from "@\/components\/projects\/agents\/data\/board-agents";/u,
	);
	assert.match(
		AGENTS_DEMO_SOURCE,
		/import type \{ FloatingRovoButtonOnboardingConfig \} from "@\/components\/projects\/shared\/components\/floating-rovo-button";/u,
	);
	assert.match(
		AGENTS_DEMO_SOURCE,
		/const ROVO_BUTTON_AGENT_ONBOARDING_ID = "agents-rfp-drafting-agent-after-report-attach";/u,
	);
	assert.match(
		AGENTS_DEMO_SOURCE,
		/const ROVO_BUTTON_AGENT_ONBOARDING_DELAY_MS = 5000;/u,
	);
	assert.match(
		AGENTS_DEMO_SOURCE,
		/const RFP_DRAFTING_AGENT_ACCENT_COLOR = "#82B536";/u,
	);
	assert.match(
		AGENTS_DEMO_SOURCE,
		/function getAgentsDemoAgentProfiles\(state: AgentsRfpDemoState\): readonly RovoAgentProfile\[\] \{[\s\S]*return getRfpDemoAgents\(state, BOARD_AGENTS\)\.map\(\(agent\) => createAgentsDemoAgentProfile\(agent, state\)\);[\s\S]*\}/u,
	);
	assert.match(
		AGENTS_DEMO_SOURCE,
		/function getRfpDraftingAgentDescription\(state: AgentsRfpDemoState\): string \{[\s\S]*RFP_DRAFTING_AGENT_DESCRIPTION/u,
	);
	assert.match(
		AGENTS_DEMO_SOURCE,
		/function getRfpDraftingAgentStarters\(state: AgentsRfpDemoState\): RovoAgentProfile\["starters"\] \{[\s\S]*RFP_DRAFTING_AGENT_CONVERSATION_STARTERS/u,
	);
	assert.match(
		AGENTS_DEMO_SOURCE,
		/const autoSelectAgentId = rfpDemo\.state\.agent && rfpDemo\.state\.chat\.selectedAgentId === RFP_DRAFTING_AGENT_ID[\s\S]*\? RFP_DRAFTING_AGENT_ID[\s\S]*: undefined;/u,
	);
	assert.match(
		AGENTS_DEMO_SOURCE,
		/<RovoChatProvider[\s\S]*agentProfiles=\{chatAgentProfiles\}[\s\S]*autoSelectAgentId=\{autoSelectAgentId\}[\s\S]*defaultPromptOptions=\{chatPromptOptions\}/u,
	);
	assert.match(
		AGENTS_DEMO_SOURCE,
		/const \{ isOpen: isChatOpen, openChat, sendPrompt, uiMessages \} = useRovoChat\(\);/u,
	);
	assert.match(
		AGENTS_DEMO_SOURCE,
		/useState\(false\);[\s\S]*useState<string \| null>\(null\);/u,
	);
	assert.match(
		AGENTS_DEMO_SOURCE,
		/const isRfp101Presented = \([\s\S]*workItemPresentation\.state\.mode === "modal" \|\| workItemPresentation\.state\.mode === "inline"[\s\S]*workItemPresentation\.state\.workItem\?\.code === RFP_101_WORK_ITEM\.code[\s\S]*\);/u,
	);
	assert.match(
		AGENTS_DEMO_SOURCE,
		/const shouldOfferRovoButtonOnboarding = \([\s\S]*rfpDemo\.state\.report\.stage === "attached"[\s\S]*!rfpDemo\.state\.agent[\s\S]*isRfp101Presented[\s\S]*!rfpDemo\.state\.canvas\.open[\s\S]*!isChatOpen[\s\S]*dismissedRovoButtonOnboardingId !== ROVO_BUTTON_AGENT_ONBOARDING_ID[\s\S]*\);/u,
	);
	assert.match(
		AGENTS_DEMO_SOURCE,
		/window\.setTimeout\(\(\) => \{[\s\S]*setIsRovoButtonOnboardingOpen\(true\);[\s\S]*\}, ROVO_BUTTON_AGENT_ONBOARDING_DELAY_MS\);[\s\S]*window\.clearTimeout\(onboardingTimer\);/u,
	);
	assert.match(
		AGENTS_DEMO_SOURCE,
		/const rovoButtonOnboarding = useMemo<FloatingRovoButtonOnboardingConfig \| null>[\s\S]*title: "Create a new agent"[\s\S]*agentName: RFP_DRAFTING_AGENT_NAME[\s\S]*primaryActionLabel: "Create"[\s\S]*coverBackgroundColor: RFP_DRAFTING_AGENT_ACCENT_COLOR[\s\S]*onPrimaryAction: handleCreateRfpDraftingAgent/u,
	);
	assert.match(
		AGENTS_DEMO_SOURCE,
		/backToBoard\(\);[\s\S]*openChat\("floating"\);[\s\S]*sendPrompt\(RFP_AGENT_CREATION_PROMPT,\s*\{[\s\S]*creationMode: "agent"/u,
	);
	const createAgentHandler = AGENTS_DEMO_SOURCE.match(
		/const handleCreateRfpDraftingAgent = useCallback\(\(\) => \{([\s\S]*?)\n\t\}, \[[^\]]*backToBoard/u,
	)?.[1] ?? "";
	assert.doesNotMatch(createAgentHandler, /applyAgent/u);
	assert.match(createAgentHandler, /sendPrompt/u);
	assert.match(createAgentHandler, /openChat/u);
	assert.match(createAgentHandler, /setIsRovoButtonOnboardingOpen\(false\)/u);
	assert.match(
		AGENTS_DEMO_SOURCE,
		/import \{ ROVO_AGENT_RESULT_SELECT_EVENT \} from "@\/components\/projects\/sidebar-chat\/components\/agent-result-card";/u,
	);
	assert.match(
		AGENTS_DEMO_SOURCE,
		/import \{[\s\S]*formatRfpDemoContext,[\s\S]*RFP_DRAFTING_AGENT_AVATAR_SRC,[\s\S]*RFP_DRAFTING_AGENT_ID,[\s\S]*\} from "@\/components\/projects\/agents\/lib\/rfp-demo-state";/u,
	);
	assert.match(AGENTS_DEMO_SOURCE, /RFP_DRAFTING_AGENT_DESCRIPTION/u);
	assert.match(AGENTS_DEMO_SOURCE, /RFP_DRAFTING_AGENT_CONVERSATION_STARTERS/u);
	assert.match(
		AGENTS_DEMO_SOURCE,
		/const hasAppliedRfpDraftingAgent = rfpDemo\.state\.agent\?\.id === RFP_DRAFTING_AGENT_ID;/u,
	);
	assert.match(
		AGENTS_DEMO_SOURCE,
		/window\.addEventListener\(ROVO_AGENT_RESULT_SELECT_EVENT, handleSelectAgentResult\);[\s\S]*window\.removeEventListener\(ROVO_AGENT_RESULT_SELECT_EVENT, handleSelectAgentResult\);/u,
	);
	assert.match(
		AGENTS_DEMO_SOURCE,
		/detail\?\.agentId !== RFP_DRAFTING_AGENT_ID[\s\S]*if \(!hasAppliedRfpDraftingAgent\) \{[\s\S]*applyAgent\(\);[\s\S]*\}[\s\S]*setIsRovoButtonOnboardingOpen\(false\);/u,
	);
	const selectAgentResultHandler = AGENTS_DEMO_SOURCE.match(
		/const handleSelectAgentResult = \(event: Event\) => \{([\s\S]*?)\n\t\t\};/u,
	)?.[1] ?? "";
	assert.doesNotMatch(selectAgentResultHandler, /setIsAgentDetailsOpen/u);
	assert.match(
		AGENTS_DEMO_SOURCE,
		/getMessageAgentResult\(message\)[\s\S]*agentResult\?\.agentId !== RFP_DRAFTING_AGENT_ID[\s\S]*appliedAgentResultMessageIdsRef\.current\.add\(message\.id\)[\s\S]*applyAgent\(\);/u,
	);
	assert.match(
		AGENTS_DEMO_SOURCE,
		/if \(hasAppliedRfpDraftingAgent\) \{[\s\S]*continue;[\s\S]*\}[\s\S]*setDismissedRovoButtonOnboardingId\(ROVO_BUTTON_AGENT_ONBOARDING_ID\);[\s\S]*applyAgent\(\);/u,
	);
	assert.match(
		AGENTS_DEMO_SOURCE,
		/rovoButtonOnboarding=\{rovoButtonOnboarding\}/u,
	);
	assert.match(AGENTS_DEMO_SOURCE, /const RFP_AGENT_CREATION_PROMPT = `Create an \$\{RFP_DRAFTING_AGENT_NAME\}/u);
	assert.match(AGENTS_DEMO_SOURCE, /including its description and conversation starters/u);
	assert.match(AGENTS_DEMO_SOURCE, /"Conversation starters:"/u);
	assert.match(AGENTS_DEMO_SOURCE, /description: RFP_DRAFTING_AGENT_DESCRIPTION/u);
	assert.match(AGENTS_DEMO_SOURCE, /creationMode: "agent"/u);
	assert.doesNotMatch(AGENTS_DEMO_SOURCE, /rovoButtonSuggestion=\{/u);
	assert.doesNotMatch(AGENTS_DEMO_SOURCE, /FloatingRovoButtonSuggestion/u);
});

test("project preview demos honor the embedded query contract", () => {
	assert.doesNotMatch(
		PROJECT_DEMO_EMBEDDED_HOOK_SOURCE,
		/next\/navigation/u,
	);
	assert.match(PROJECT_DEMO_EMBEDDED_HOOK_SOURCE, /window\.location\.pathname/u);
	assert.match(PROJECT_DEMO_EMBEDDED_HOOK_SOURCE, /window\.location\.search/u);
	assert.match(
		PROJECT_DEMO_EMBEDDED_HOOK_SOURCE,
		/pathname\.startsWith\("\/components\/"\) \|\| searchParams\.get\("embedded"\) === "1";/u,
	);
});
