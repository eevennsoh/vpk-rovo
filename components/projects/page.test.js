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
		/<AnimatePresence>\s*\{showFloatingRovoButton \? <FloatingRovoButton key="floating-rovo-button" product=\{product\} embedded=\{isEmbedded\} \/> : null\}\s*<\/AnimatePresence>/u,
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
		/import \{ motion \} from "motion\/react";/u,
	);
	assert.match(
		FLOATING_ROVO_BUTTON_SOURCE,
		/<motion\.button[\s\S]*exit=\{\{ opacity: 0, scale: 0\.92, y: 8 \}\}[\s\S]*whileHover=\{\{ scale: 1\.1 \}\}/u,
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
