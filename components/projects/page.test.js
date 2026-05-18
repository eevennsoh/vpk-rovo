const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const PROJECT_LAYOUT_SOURCE = fs.readFileSync(path.join(__dirname, "page.tsx"), "utf8");
const FLOATING_ROVO_BUTTON_SOURCE = fs.readFileSync(
	path.join(__dirname, "shared/components/floating-rovo-button.tsx"),
	"utf8",
);
const ROVO_CANVAS_SOURCE = fs.readFileSync(
	path.join(__dirname, "../blocks/rovo-canvas/components/rovo-canvas.tsx"),
	"utf8",
);
const ROVO_CANVAS_HEADER_SOURCE = fs.readFileSync(
	path.join(__dirname, "../blocks/rovo-canvas/components/rovo-canvas-header.tsx"),
	"utf8",
);

test("hideFloatingRovo suppresses the layout-owned floating chat surface", () => {
	assert.match(
		PROJECT_LAYOUT_SOURCE,
		/const shouldHideRovoAction = hideRovoAction \|\| isRovoCanvasOpen;/,
	);
	assert.match(
		PROJECT_LAYOUT_SOURCE,
		/const showFloatingChat = !isEmbedded && !hideFloatingRovo && !shouldHideRovoAction && isFloatingChatActive;/,
	);
	assert.match(
		PROJECT_LAYOUT_SOURCE,
		/const showFloatingRovoButton = !isEmbedded && !hideFloatingRovo && !shouldHideRovoAction;/,
	);
	assert.match(
		PROJECT_LAYOUT_SOURCE,
		/\{showFloatingChat \? \(\s*<RovoFloatingChat[\s\S]*\/>\s*\) : null\}/,
	);
	assert.match(
		PROJECT_LAYOUT_SOURCE,
		/rovoButtonSuggestion\?: FloatingRovoButtonSuggestion \| null;/u,
	);
	assert.match(
		PROJECT_LAYOUT_SOURCE,
		/rovoButtonOnboarding\?: FloatingRovoButtonOnboardingConfig \| null;/u,
	);
	assert.match(
		PROJECT_LAYOUT_SOURCE,
		/<FloatingRovoButton[\s\S]*key="floating-rovo-button"[\s\S]*product=\{product\}[\s\S]*embedded=\{isEmbedded\}[\s\S]*suggestion=\{rovoButtonSuggestion\}[\s\S]*onboarding=\{rovoButtonOnboarding\}[\s\S]*\/>/u,
	);
});

test("project layout hides Rovo shell actions while any Rovo Canvas is open", () => {
	assert.match(PROJECT_LAYOUT_SOURCE, /function useIsRovoCanvasOpen\(\): boolean/u);
	assert.match(PROJECT_LAYOUT_SOURCE, /document\.documentElement\.dataset\.rovoCanvasOpen === "true"/u);
	assert.match(PROJECT_LAYOUT_SOURCE, /new MutationObserver\(updateRovoCanvasOpen\)/u);
	assert.match(PROJECT_LAYOUT_SOURCE, /attributeFilter: \["data-rovo-canvas-open"\]/u);
	assert.match(PROJECT_LAYOUT_SOURCE, /hideRovoAction=\{shouldHideRovoAction\}/u);
	assert.match(PROJECT_LAYOUT_SOURCE, /!\s*shouldHideRovoAction \? \(/u);
});

test("Rovo Canvas publishes a document-level open flag for shell handoff", () => {
	assert.match(ROVO_CANVAS_SOURCE, /const ROVO_CANVAS_OPEN_INSTANCES_KEY = "__vpkRovoCanvasOpenInstances";/u);
	assert.match(ROVO_CANVAS_SOURCE, /function getActiveRovoCanvasInstances\(\): Set<symbol>/u);
	assert.match(ROVO_CANVAS_SOURCE, /globalScope\[ROVO_CANVAS_OPEN_INSTANCES_KEY\] \?\?= new Set<symbol>\(\);/u);
	assert.match(ROVO_CANVAS_SOURCE, /document\.documentElement\.dataset\.rovoCanvasOpen = "true";/u);
	assert.match(ROVO_CANVAS_SOURCE, /delete document\.documentElement\.dataset\.rovoCanvasOpen;/u);
	assert.match(ROVO_CANVAS_SOURCE, /activeRovoCanvasInstances\.add\(instanceId\);/u);
	assert.match(ROVO_CANVAS_SOURCE, /getActiveRovoCanvasInstances\(\)\.delete\(instanceId\);/u);
});

test("Rovo Canvas hides the view switcher for single-view artefacts", () => {
	assert.match(
		ROVO_CANVAS_SOURCE,
		/resolvedViews\.length > 1 \? \(\s*<RovoCanvasViewSwitcher views=\{resolvedViews\} \/>\s*\) : \(\s*<div aria-hidden="true" \/>\s*\)/u,
	);
});

test("Rovo Canvas renders artefact identity text instead of an artefact dropdown", () => {
	assert.match(ROVO_CANVAS_SOURCE, /function RovoCanvasArtefactIdentity/u);
	assert.match(
		ROVO_CANVAS_SOURCE,
		/<RovoCanvasArtefactIdentity[\s\S]*label=\{resolvedArtefactLabel\}[\s\S]*metadata=\{artefactMetadata\}/u,
	);
	assert.match(
		ROVO_CANVAS_SOURCE,
		/<CardDescription className="line-clamp-2 text-xs leading-4">\{metadata\}<\/CardDescription>/u,
	);
	assert.match(
		ROVO_CANVAS_SOURCE,
		/className="grid min-h-\[60px\] shrink-0 grid-cols-\[minmax\(0,1fr\)_auto_minmax\(0,1fr\)\] items-center border-b border-border bg-surface px-4 py-3"/u,
	);
	assert.doesNotMatch(ROVO_CANVAS_SOURCE, /className="grid h-12 shrink-0/u);
	assert.doesNotMatch(ROVO_CANVAS_SOURCE, /aria-label="Choose artefact surface"/u);
	assert.doesNotMatch(ROVO_CANVAS_SOURCE, /DropdownMenuTrigger[\s\S]*resolvedArtefactLabel/u);
});

test("Rovo Canvas header keeps Rovo as static text without the agent selector", () => {
	assert.match(ROVO_CANVAS_HEADER_SOURCE, /function RovoCanvasBrand\(\): React\.ReactElement/u);
	assert.match(ROVO_CANVAS_HEADER_SOURCE, /src="\/1p\/rovo\.svg"/u);
	assert.match(ROVO_CANVAS_HEADER_SOURCE, /<span className="font-semibold">Rovo<\/span>/u);
	assert.match(ROVO_CANVAS_HEADER_SOURCE, /<RovoCanvasBrand \/>/u);
	assert.doesNotMatch(ROVO_CANVAS_HEADER_SOURCE, /RovoAppBrand/u);
	assert.doesNotMatch(ROVO_CANVAS_HEADER_SOURCE, /Select Rovo agent/u);
	assert.doesNotMatch(ROVO_CANVAS_HEADER_SOURCE, /ChevronDownIcon/u);
	assert.doesNotMatch(ROVO_CANVAS_HEADER_SOURCE, /AgentSelector/u);
});

test("Rovo Canvas version history entries expose selected state and selection callbacks", () => {
	assert.match(ROVO_CANVAS_SOURCE, /onVersionSelect\?: \(versionId: string\) => void;/u);
	assert.match(
		ROVO_CANVAS_SOURCE,
		/function VersionHistoryPanel\(\{[\s\S]*onVersionSelect,[\s\S]*versions,/u,
	);
	assert.match(
		ROVO_CANVAS_SOURCE,
		/aria-pressed=\{version\.isCurrent \? true : undefined\}[\s\S]*onClick=\{\(\) => onVersionSelect\?\.\(version\.id\)\}/u,
	);
	assert.match(
		ROVO_CANVAS_SOURCE,
		/<VersionHistoryPanel[\s\S]*onVersionSelect=\{onVersionSelect\}[\s\S]*versions=\{versionHistory\}/u,
	);
});

test("Rovo Canvas main artefact frame uses a border without elevation", () => {
	assert.match(
		ROVO_CANVAS_SOURCE,
		/<section className="flex min-h-\[420px\] min-w-0 flex-col overflow-hidden rounded-xl border border-border bg-surface lg:min-h-0">/u,
	);
	assert.doesNotMatch(
		ROVO_CANVAS_SOURCE,
		/<section className="[^"]*shadow-sm[^"]*">/u,
	);
});

test("floating Rovo button has an exit transition for canvas handoff", () => {
	assert.match(
		FLOATING_ROVO_BUTTON_SOURCE,
		/import \{ AnimatePresence, motion, useReducedMotion \} from "motion\/react";/u,
	);
	assert.match(
		FLOATING_ROVO_BUTTON_SOURCE,
		/<motion\.button[\s\S]*exit=\{shouldReduceMotion \? \{ opacity: 0 \} : \{ opacity: 0, transition: \{ duration: 0\.08 \} \}\}/u,
	);
});

test("floating Rovo button applies collapsed elevation to the button surface", () => {
	assert.match(
		FLOATING_ROVO_BUTTON_SOURCE,
		/<motion\.button[\s\S]*className="flex h-full w-full items-center justify-center bg-bg-neutral-bold"[\s\S]*boxShadow: token\("elevation\.shadow\.overlay"\)/u,
	);
	assert.match(
		FLOATING_ROVO_BUTTON_SOURCE,
		/boxShadow: onboardingOpen \? token\("elevation\.shadow\.overlay"\) : undefined/u,
	);
	assert.match(
		FLOATING_ROVO_BUTTON_SOURCE,
		/onboardingOpen\s*\?\s*"w-\[295px\] max-w-\[calc\(100vw-32px\)\] overflow-hidden"\s*:\s*"size-12"/u,
	);
});

test("floating Rovo button can render a collapsed proactive suggestion nudge", () => {
	assert.match(
		FLOATING_ROVO_BUTTON_SOURCE,
		/export interface FloatingRovoButtonSuggestion \{[\s\S]*id: string;[\s\S]*label: string;[\s\S]*onSelect: \(\) => void;[\s\S]*onDismiss\?: \(\) => void;/u,
	);
	assert.match(
		FLOATING_ROVO_BUTTON_SOURCE,
		/import AiAgentIcon from "@atlaskit\/icon\/core\/ai-agent";/u,
	);
	assert.match(
		FLOATING_ROVO_BUTTON_SOURCE,
		/import CrossIcon from "@atlaskit\/icon\/core\/cross";/u,
	);
	assert.match(
		FLOATING_ROVO_BUTTON_SOURCE,
		/export interface FloatingRovoButtonPlacement \{[\s\S]*right\?: string;[\s\S]*bottom\?: string;/u,
	);
	assert.match(
		FLOATING_ROVO_BUTTON_SOURCE,
		/placement \? null : "right-\[84px\] bottom-7"/u,
	);
	assert.match(
		FLOATING_ROVO_BUTTON_SOURCE,
		/right: `calc\(\$\{resolvedPlacement\.right\} \+ 60px\)`[\s\S]*bottom: `calc\(\$\{resolvedPlacement\.bottom\} \+ 4px\)`/u,
	);
	assert.match(
		FLOATING_ROVO_BUTTON_SOURCE,
		/initial=\{\{ opacity: 0, scaleX: 0\.24, x: 52 \}\}[\s\S]*animate=\{\{ opacity: 1, scaleX: 1, x: 0 \}\}[\s\S]*exit=\{\{ opacity: 0, scaleX: 0\.24, x: 52 \}\}/u,
	);
	assert.match(
		FLOATING_ROVO_BUTTON_SOURCE,
		/\{suggestion && shouldShowButton && !onboardingOpen \? \([\s\S]*<FloatingRovoButtonNudge key=\{suggestion\.id\} placement=\{placement\} suggestion=\{suggestion\} \/>[\s\S]*\) : null\}/u,
	);
});

test("floating Rovo button supports demo placement while preserving default chat behavior", () => {
	assert.match(
		FLOATING_ROVO_BUTTON_SOURCE,
		/ariaLabel\?: string;[\s\S]*placement\?: FloatingRovoButtonPlacement;[\s\S]*onButtonClick\?: \(\) => void;/u,
	);
	assert.match(
		FLOATING_ROVO_BUTTON_SOURCE,
		/right: resolvedPlacement\.right,[\s\S]*bottom: resolvedPlacement\.bottom,/u,
	);
	assert.match(
		FLOATING_ROVO_BUTTON_SOURCE,
		/const resolvedAriaLabel = ariaLabel \?\? \(shouldOpenOnboardingFromButton \? "Open onboarding" : "Open Rovo"\);/u,
	);
	assert.match(
		FLOATING_ROVO_BUTTON_SOURCE,
		/if \(onButtonClick\) \{[\s\S]*onButtonClick\(\);[\s\S]*return;[\s\S]*\}[\s\S]*if \(shouldOpenOnboardingFromButton\) \{[\s\S]*setOnboardingOpen\(true\);[\s\S]*return;[\s\S]*\}[\s\S]*openChat\("floating"\);/u,
	);
	assert.match(
		FLOATING_ROVO_BUTTON_SOURCE,
		/ariaLabel=\{resolvedAriaLabel\}/u,
	);
});

test("floating Rovo button can morph into an onboarding Spotlight panel", () => {
	assert.match(
		FLOATING_ROVO_BUTTON_SOURCE,
		/export interface FloatingRovoButtonOnboardingConfig \{[\s\S]*title: string;[\s\S]*agentName: string;[\s\S]*primaryActionLabel: string;[\s\S]*openOnButtonClick\?: boolean;[\s\S]*onPrimaryAction\?: \(\) => void;/u,
	);
	assert.match(
		FLOATING_ROVO_BUTTON_SOURCE,
		/function FloatingRovoButtonOnboardingPanel/u,
	);
	assert.match(
		FLOATING_ROVO_BUTTON_SOURCE,
		/data-testid="floating-rovo-button-onboarding"/u,
	);
	assert.match(
		FLOATING_ROVO_BUTTON_SOURCE,
		/const shouldOpenOnboardingFromButton = Boolean\(onboarding && \(onboarding\.openOnButtonClick \?\? true\)\);/u,
	);
	assert.match(
		FLOATING_ROVO_BUTTON_SOURCE,
		/aria-label=\{closeLabel\}[\s\S]*autoFocus/u,
	);
	assert.match(
		FLOATING_ROVO_BUTTON_SOURCE,
		/const AGENT_AVATAR_HEXAGON_PATH = "M19\.01 0\.922148/u,
	);
	assert.match(
		FLOATING_ROVO_BUTTON_SOURCE,
		/<path d=\{AGENT_AVATAR_HEXAGON_PATH\} fill="none" stroke="white" strokeWidth=\{2\} vectorEffect="non-scaling-stroke" \/>/u,
	);
	assert.match(
		FLOATING_ROVO_BUTTON_SOURCE,
		/event\.key === "Escape"[\s\S]*handleClose\(\);/u,
	);
});

test("project layout forwards chat context bars to sidebar and floating chat", () => {
	assert.match(
		PROJECT_LAYOUT_SOURCE,
		/chatContextBar\?: ChatContextBarDescriptor \| null;/,
	);
	assert.match(
		PROJECT_LAYOUT_SOURCE,
		/<ChatPanel[\s\S]*chatContextBar=\{chatContextBar\}/,
	);
	assert.match(
		PROJECT_LAYOUT_SOURCE,
		/<ChatPanel[\s\S]*abortOnUnmount=\{false\}[\s\S]*chatContextBar=\{chatContextBar\}/,
	);
	assert.match(
		PROJECT_LAYOUT_SOURCE,
		/<RovoFloatingChat[\s\S]*chatContextBar=\{chatContextBar\}/,
	);
});

test("project layout forwards artifact dialog lifecycle to both chat surfaces", () => {
	assert.match(
		PROJECT_LAYOUT_SOURCE,
		/onArtifactDialogOpen\?: \(\) => void;/,
	);
	assert.match(
		PROJECT_LAYOUT_SOURCE,
		/preserveFloatingSurfaceOnArtifactDialogOpen\?: boolean;/,
	);
	assert.match(
		PROJECT_LAYOUT_SOURCE,
		/<ChatPanel[\s\S]*onArtifactDialogOpen=\{onArtifactDialogOpen\}[\s\S]*preserveFloatingSurfaceOnArtifactDialogOpen=\{preserveFloatingSurfaceOnArtifactDialogOpen\}/,
	);
	assert.match(
		PROJECT_LAYOUT_SOURCE,
		/<RovoFloatingChat[\s\S]*onArtifactDialogOpen=\{onArtifactDialogOpen\}[\s\S]*preserveFloatingSurfaceOnArtifactDialogOpen=\{preserveFloatingSurfaceOnArtifactDialogOpen\}/,
	);
});
