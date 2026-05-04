const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const CONTROL_FLYOUT_SOURCE = fs.readFileSync(
	path.join(__dirname, "personal-graph-control-flyout.tsx"),
	"utf8",
);

test("Personal Graph flyout label chips are visible on narrow viewports", () => {
	assert.match(
		CONTROL_FLYOUT_SOURCE,
		/className="pointer-events-none absolute right-\[calc\(100%\+12px\)\] top-1\/2 -translate-y-1\/2 whitespace-nowrap rounded-md bg-bg-neutral-bold px-3 py-1\.5 text-xs text-text-inverse shadow-md"/,
	);
	assert.match(CONTROL_FLYOUT_SOURCE, /label=\{action\.label\}/);
	assert.match(CONTROL_FLYOUT_SOURCE, /aria-label=\{label\}/);
	assert.doesNotMatch(CONTROL_FLYOUT_SOURCE, /hidden -translate-y-1\/2/);
	assert.doesNotMatch(CONTROL_FLYOUT_SOURCE, /sm:block/);
	assert.doesNotMatch(
		CONTROL_FLYOUT_SOURCE,
		/rounded-lg border border-border bg-bg-neutral-subtle px-2\.5 py-1 text-xs font-medium text-text shadow-sm/,
	);
});

test("Personal Graph flyout action buttons reuse the shared glass panel at stable size", () => {
	assert.match(
		CONTROL_FLYOUT_SOURCE,
		/import \{ PersonalGraphGlassPanel \} from "\.\/personal-graph-glass-panel";/,
	);
	assert.match(CONTROL_FLYOUT_SOURCE, /<PersonalGraphGlassPanel/);
	assert.match(CONTROL_FLYOUT_SOURCE, /className="rounded-full"/);
	assert.match(CONTROL_FLYOUT_SOURCE, /contentClassName="flex size-8 items-center justify-center"/);
	assert.match(CONTROL_FLYOUT_SOURCE, /height=\{32\}/);
	assert.match(CONTROL_FLYOUT_SOURCE, /radius=\{9999\}/);
	assert.match(CONTROL_FLYOUT_SOURCE, /width=\{32\}/);
	assert.match(CONTROL_FLYOUT_SOURCE, /\[&_button\]:size-8/);
	assert.doesNotMatch(CONTROL_FLYOUT_SOURCE, /type LiquidGlassProps/);
	assert.doesNotMatch(CONTROL_FLYOUT_SOURCE, /const ACTION_GLASS_PROPS/);
	assert.doesNotMatch(CONTROL_FLYOUT_SOURCE, /<LiquidGlass/);
	assert.doesNotMatch(CONTROL_FLYOUT_SOURCE, /backgroundOpacity: 1,/);
});

test("Personal Graph flyout arc motion does not fade or scale glass buttons", () => {
	assert.match(
		CONTROL_FLYOUT_SOURCE,
		/animate=\{\{ offsetDistance: `\$\{distance\}%` \}\}/,
	);
	assert.match(CONTROL_FLYOUT_SOURCE, /initial=\{\{ offsetDistance: "0%" \}\}/);
	assert.match(CONTROL_FLYOUT_SOURCE, /exit=\{\{ offsetDistance: "0%" \}\}/);
	assert.match(CONTROL_FLYOUT_SOURCE, /willChange: "transform"/);
	assert.doesNotMatch(CONTROL_FLYOUT_SOURCE, /opacity: 1, scale: 1/);
	assert.doesNotMatch(CONTROL_FLYOUT_SOURCE, /opacity: 0, scale: 0\.3/);
	assert.doesNotMatch(CONTROL_FLYOUT_SOURCE, /ACTION_STAGGER_BLUR_FILTER/);
	assert.doesNotMatch(CONTROL_FLYOUT_SOURCE, /filter: "blur/);
	assert.doesNotMatch(CONTROL_FLYOUT_SOURCE, /filter: ACTION_STAGGER_BLUR_FILTER/);
	assert.doesNotMatch(CONTROL_FLYOUT_SOURCE, /willChange: "transform, opacity, filter"/);
});

test("Personal Graph flyout action motion uses direct index staggering", () => {
	assert.match(CONTROL_FLYOUT_SOURCE, /transition=\{\{ \.\.\.ITEM_TRANSITION, delay: index \* STAGGER_INTERVAL \}\}/);
	assert.doesNotMatch(CONTROL_FLYOUT_SOURCE, /function getFlyoutActionEnterDelay/);
	assert.doesNotMatch(CONTROL_FLYOUT_SOURCE, /function getFlyoutActionExitDelay/);
	assert.doesNotMatch(CONTROL_FLYOUT_SOURCE, /actionCount=\{actions\.length\}/);
	assert.doesNotMatch(CONTROL_FLYOUT_SOURCE, /filter: \{ duration:/);
});

test("Personal Graph flyout action buttons stay hidden while stacked at the arc origin", () => {
	assert.match(CONTROL_FLYOUT_SOURCE, /const ARC_ORIGIN_VISIBILITY_THRESHOLD_PERCENT = 5;/);
	assert.match(CONTROL_FLYOUT_SOURCE, /function PersonalGraphControlFlyoutActionItem/);
	assert.match(CONTROL_FLYOUT_SOURCE, /onUpdate=\{\(latest\) => updateOriginVisibility\(latest\.offsetDistance\)\}/);
	assert.match(CONTROL_FLYOUT_SOURCE, /visibility: "hidden"/);
	assert.match(CONTROL_FLYOUT_SOURCE, /item\.style\.visibility = isAtOrigin \? "hidden" : "";/);
	assert.match(CONTROL_FLYOUT_SOURCE, /item\.style\.pointerEvents = isAtOrigin \? "none" : "";/);
});
