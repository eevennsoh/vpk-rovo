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
		/<AgentsView[\s\S]*workItemPresentation=\{workItemPresentation\}[\s\S]*rfpDemo=\{rfpDemo\}[\s\S]*isAgentDetailsOpen=\{isAgentDetailsOpen\}[\s\S]*onAgentDetailsOpenChange=\{setIsAgentDetailsOpen\}[\s\S]*onCreateRfpDraftingAgent=\{handleCreateRfpDraftingAgent\}[\s\S]*chatContextBar=\{agentsChatScreenContext\.chatContextBar\}[\s\S]*chatGreeting=\{agentsChatScreenContext\.greeting\}/u,
	);
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

test("AgentsDemo shows the collapsed Rovo agent nudge after the report is attached", () => {
	assert.match(
		AGENTS_DEMO_SOURCE,
		/import \{ RovoChatProvider, useRovoChat \} from "@\/app\/contexts";/u,
	);
	assert.match(
		AGENTS_DEMO_SOURCE,
		/const ROVO_BUTTON_AGENT_SUGGESTION_ID = "agents-rfp-drafting-agent-after-report-attach";/u,
	);
	assert.match(
		AGENTS_DEMO_SOURCE,
		/const \{ isOpen: isChatOpen, openChat, sendPrompt \} = useRovoChat\(\);/u,
	);
	assert.match(
		AGENTS_DEMO_SOURCE,
		/const isRfp101Presented = \([\s\S]*workItemPresentation\.state\.mode === "modal" \|\| workItemPresentation\.state\.mode === "inline"[\s\S]*workItemPresentation\.state\.workItem\?\.code === RFP_101_WORK_ITEM\.code[\s\S]*\);/u,
	);
	assert.match(
		AGENTS_DEMO_SOURCE,
		/const shouldShowRovoButtonSuggestion = \([\s\S]*rfpDemo\.state\.report\.stage === "attached"[\s\S]*!rfpDemo\.state\.agent[\s\S]*isRfp101Presented[\s\S]*!rfpDemo\.state\.canvas\.open[\s\S]*!isChatOpen[\s\S]*dismissedRovoButtonSuggestionId !== ROVO_BUTTON_AGENT_SUGGESTION_ID[\s\S]*\);/u,
	);
	assert.match(
		AGENTS_DEMO_SOURCE,
		/label: "Create RFP agent to handle similar work items"[\s\S]*ariaLabel: "Create RFP agent to handle similar work items"[\s\S]*onSelect: handleCreateRfpDraftingAgent/u,
	);
	assert.match(
		AGENTS_DEMO_SOURCE,
		/backToBoard\(\);[\s\S]*createAgent\(\);[\s\S]*openChat\("floating"\);[\s\S]*sendPrompt\(RFP_AGENT_CREATION_PROMPT,[\s\S]*creationMode: "agent"/u,
	);
	const createAgentHandler = AGENTS_DEMO_SOURCE.match(
		/const handleCreateRfpDraftingAgent = useCallback\(\(\) => \{([\s\S]*?)\n\t\}, \[backToBoard/u,
	)?.[1] ?? "";
	assert.doesNotMatch(createAgentHandler, /setIsAgentDetailsOpen\(true\)/u);
	assert.match(
		AGENTS_DEMO_SOURCE,
		/import \{ ROVO_AGENT_RESULT_OPEN_EVENT \} from "@\/components\/projects\/sidebar-chat\/components\/agent-result-card";/u,
	);
	assert.match(
		AGENTS_DEMO_SOURCE,
		/import \{ formatRfpDemoContext, RFP_DRAFTING_AGENT_ID \} from "@\/components\/projects\/agents\/lib\/rfp-demo-state";/u,
	);
	assert.match(
		AGENTS_DEMO_SOURCE,
		/window\.addEventListener\(ROVO_AGENT_RESULT_OPEN_EVENT, handleOpenAgentResult\);[\s\S]*window\.removeEventListener\(ROVO_AGENT_RESULT_OPEN_EVENT, handleOpenAgentResult\);/u,
	);
	assert.match(
		AGENTS_DEMO_SOURCE,
		/detail\?\.agentId !== RFP_DRAFTING_AGENT_ID[\s\S]*createAgent\(\);[\s\S]*setIsAgentDetailsOpen\(true\);/u,
	);
	assert.match(
		AGENTS_DEMO_SOURCE,
		/rovoButtonSuggestion=\{rovoButtonSuggestion\}/u,
	);
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
