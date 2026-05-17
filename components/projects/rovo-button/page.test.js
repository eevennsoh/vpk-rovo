const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const ROVO_BUTTON_PAGE_SOURCE = fs.readFileSync(path.join(__dirname, "page.tsx"), "utf8");

test("Rovo button project page owns demo-only onboarding state", () => {
	assert.match(
		ROVO_BUTTON_PAGE_SOURCE,
		/useState<FloatingRovoButtonOnboardingStatus>\("idle"\)/u,
	);
	assert.match(
		ROVO_BUTTON_PAGE_SOURCE,
		/const onboarding = useMemo<FloatingRovoButtonOnboardingConfig>\(\(\) => \(\{/u,
	);
	assert.match(
		ROVO_BUTTON_PAGE_SOURCE,
		/id: "rovo-button-rfp-drafter-onboarding-demo"/u,
	);
	assert.match(
		ROVO_BUTTON_PAGE_SOURCE,
		/title: "Create a new agent"[\s\S]*agentName: "RFP Drafter"[\s\S]*prompt: "Repeating RFP review manually every time\? We can automate it\."/u,
	);
	assert.match(
		ROVO_BUTTON_PAGE_SOURCE,
		/<FloatingRovoButton[\s\S]*ariaLabel="Open onboarding demo"[\s\S]*forceVisible[\s\S]*onboarding=\{onboarding\}[\s\S]*placement=\{ONBOARDING_BUTTON_PLACEMENT\}[\s\S]*product="home"/u,
	);
});

test("Rovo button project page shows chat, proactive suggestion, and onboarding examples", () => {
	assert.match(
		ROVO_BUTTON_PAGE_SOURCE,
		/import \{ AnimatePresence \} from "motion\/react";/u,
	);
	assert.match(
		ROVO_BUTTON_PAGE_SOURCE,
		/import RovoFloatingChat from "@\/components\/projects\/rovo-floating-chat\/components\/rovo-floating-chat";/u,
	);
	assert.match(
		ROVO_BUTTON_PAGE_SOURCE,
		/import \{ useRovoChat \} from "@\/app\/contexts";/u,
	);
	assert.match(
		ROVO_BUTTON_PAGE_SOURCE,
		/const CHAT_BUTTON_PLACEMENT = \{ right: "176px", bottom: "32px" \} satisfies FloatingRovoButtonPlacement;/u,
	);
	assert.match(
		ROVO_BUTTON_PAGE_SOURCE,
		/const SUGGESTION_BUTTON_PLACEMENT = \{ right: "328px", bottom: "32px" \} satisfies FloatingRovoButtonPlacement;/u,
	);
	assert.match(
		ROVO_BUTTON_PAGE_SOURCE,
		/const ONBOARDING_BUTTON_PLACEMENT = \{ right: "24px", bottom: "32px" \} satisfies FloatingRovoButtonPlacement;/u,
	);
	assert.match(
		ROVO_BUTTON_PAGE_SOURCE,
		/<FloatingRovoButton[\s\S]*ariaLabel="Open Rovo chat demo"[\s\S]*placement=\{CHAT_BUTTON_PLACEMENT\}[\s\S]*product="home"/u,
	);
	assert.match(
		ROVO_BUTTON_PAGE_SOURCE,
		/<FloatingRovoButton[\s\S]*ariaLabel="Show proactive suggestion demo"[\s\S]*forceVisible[\s\S]*onButtonClick=\{handleSuggestionButtonClick\}[\s\S]*placement=\{SUGGESTION_BUTTON_PLACEMENT\}[\s\S]*suggestion=\{suggestion\}/u,
	);
	assert.match(
		ROVO_BUTTON_PAGE_SOURCE,
		/\{chatSurface === "floating" \? <RovoFloatingChat key="floating-chat" \/> : null\}/u,
	);
});

test("Rovo button onboarding demo does not wire into agents or RFP state", () => {
	assert.doesNotMatch(ROVO_BUTTON_PAGE_SOURCE, /RFP_AGENT_CREATION_PROMPT/u);
	assert.doesNotMatch(ROVO_BUTTON_PAGE_SOURCE, /components\/projects\/agents/u);
	assert.match(
		ROVO_BUTTON_PAGE_SOURCE,
		/getDemoPrimaryActionLabel\(demoOnboardingStatus\)/u,
	);
	assert.match(
		ROVO_BUTTON_PAGE_SOURCE,
		/primaryActionDisabled: demoOnboardingStatus !== "idle"/u,
	);
});
