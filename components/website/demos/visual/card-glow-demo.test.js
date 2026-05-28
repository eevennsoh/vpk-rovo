const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const ROOT = path.join(__dirname, "../../../..");
const DEMO_SOURCE = fs.readFileSync(path.join(__dirname, "card-glow-demo.tsx"), "utf8");
const REGISTRY_SOURCE = fs.readFileSync(path.join(ROOT, "components/website/registry.ts"), "utf8");
const COMPONENTS_SOURCE = fs.readFileSync(path.join(ROOT, "app/data/components.ts"), "utf8");
const MANIFEST_SOURCE = fs.readFileSync(path.join(ROOT, "app/data/component-manifest.ts"), "utf8");
const NAV_UTILS_SOURCE = fs.readFileSync(path.join(ROOT, "app/data/nav-utils.ts"), "utf8");
const DETAILS_SOURCE = fs.readFileSync(path.join(ROOT, "app/data/details/visual.ts"), "utf8");

test("Card Glow is registered as a top-level visual component", () => {
	assert.match(REGISTRY_SOURCE, /"card-glow": dynamic\(\(\) => import\("\.\/demos\/visual\/card-glow-demo"\)/);
	assert.ok(COMPONENTS_SOURCE.includes('visualComponent("card-glow", "Card Glow", "@/components/website/demos/visual/card-glow-demo")'));
	assert.ok(MANIFEST_SOURCE.includes('visualComponent("card-glow", "Card Glow", "@/components/website/demos/visual/card-glow-demo")'));
	assert.match(DETAILS_SOURCE, /"card-glow": \{/);

	const shadersStart = NAV_UTILS_SOURCE.indexOf("shaders: [");
	const shadersEnd = NAV_UTILS_SOURCE.indexOf("],", shadersStart);
	assert.notEqual(shadersStart, -1);
	assert.notEqual(shadersEnd, -1);
	assert.doesNotMatch(NAV_UTILS_SOURCE.slice(shadersStart, shadersEnd), /"card-glow"/);
});

test("Card Glow exposes CodePen-equivalent defaults and GUI controls", () => {
	for (const expected of [
		"export interface CardGlowConfig",
		"export const CARD_GLOW_DEFAULT_CONFIG",
		"theme: \"light\"",
		"iconBlur: 28",
		"iconSaturate: 5",
		"iconBrightness: 1.3",
		"iconContrast: 1.4",
		"iconScale: 3.4",
		"iconOpacity: 0.25",
		"borderWidth: 1",
		"borderBlur: 0",
		"borderSaturate: 4.2",
		"borderBrightness: 2.5",
		"borderContrast: 2.5",
		"exclude: false",
		"css: true",
		"label=\"blur\"",
		"label=\"saturate\"",
		"label=\"brightness\"",
		"label=\"contrast\"",
		"label=\"scale\"",
		"label=\"opacity\"",
		"label=\"width\"",
		"label=\"exclude\"",
		"label=\"css\"",
		"label=\"theme\"",
	]) {
		assert.ok(DEMO_SOURCE.includes(expected), expected);
	}
});

test("Card Glow uses the Studio Insights bento tile data locally", () => {
	for (const expected of [
		"Customer Insights",
		"Jira Theme Analyzer",
		"Transcript Insights Reporter",
		"Meeting Insights",
		"Trend Spotter",
		"/avatar-agent/teamwork-agents/customer-insights.svg",
		"/avatar-agent/dev-agents/code-reviewer.svg",
		"/avatar-agent/strategy-agents/wildcard-1.svg",
		"/avatar-agent/product-agents/wildcard-6.svg",
		"/avatar-agent/service-agents/wildcard-5.svg",
		"accentColor: \"#6A9A23\"",
		"accentColor: \"#FFC400\"",
		"auto-rows-[144px]",
		"lg:grid-cols-5",
	]) {
		assert.ok(DEMO_SOURCE.includes(expected), expected);
	}

	assert.doesNotMatch(DEMO_SOURCE, /HOME_STARTER_VIEWS/);
	assert.doesNotMatch(DEMO_SOURCE, /components\/projects\/studio\/components\/rovo-app-shell/);
});

test("Card Glow tracks pointer position from each tile center", () => {
	assert.match(DEMO_SOURCE, /const centerX = rect\.left \+ rect\.width \/ 2/);
	assert.match(DEMO_SOURCE, /const centerY = rect\.top \+ rect\.height \/ 2/);
	assert.match(DEMO_SOURCE, /const normalizedX = relativeX \/ \(rect\.width \/ 2\)/);
	assert.match(DEMO_SOURCE, /const normalizedY = relativeY \/ \(rect\.height \/ 2\)/);
	assert.match(DEMO_SOURCE, /--card-glow-pointer-x", normalizedX\.toFixed\(3\)/);
	assert.match(DEMO_SOURCE, /--card-glow-pointer-y", normalizedY\.toFixed\(3\)/);
	assert.match(DEMO_SOURCE, /resetTilePointer/);
});

test("Card Glow duplicates avatars for the glow and renders a masked border ring", () => {
	assert.match(DEMO_SOURCE, /getCardGlowFilter/);
	assert.match(DEMO_SOURCE, /url\(#\$\{filterId\}\)/);
	assert.match(DEMO_SOURCE, /<feGaussianBlur in="SourceGraphic" stdDeviation=\{config\.iconBlur\}/);
	assert.match(DEMO_SOURCE, /calc\(var\(--card-glow-pointer-x, -10\) \* 50cqi\)/);
	assert.match(DEMO_SOURCE, /scale: "var\(--card-glow-icon-scale\)"/);
	assert.match(DEMO_SOURCE, /opacity-\[var\(--card-glow-icon-opacity\)\]/);
	assert.match(DEMO_SOURCE, /group-hover\/card-glow:opacity-\[var\(--card-glow-icon-opacity\)\]/);
	assert.match(DEMO_SOURCE, /function getCardBorderClassName/);
	assert.match(DEMO_SOURCE, /const borderGlowStyle: CSSProperties = \{/);
	assert.match(DEMO_SOURCE, /backdropFilter: borderFilter/);
	assert.match(DEMO_SOURCE, /circle at /);
	assert.match(DEMO_SOURCE, /var\(--card-glow-tile-accent\) 78%/);
	assert.match(DEMO_SOURCE, /"--card-glow-tile-accent": tile\.accentColor/);
	assert.match(DEMO_SOURCE, /getCardBorderClassName\(config\.theme\)/);
	assert.match(DEMO_SOURCE, /absolute inset-0 z-\[1\] rounded-\[inherit\] border/);
	assert.match(DEMO_SOURCE, /absolute inset-0 z-\[2\] overflow-hidden rounded-\[inherit\] border border-transparent/);
	assert.match(DEMO_SOURCE, /style=\{borderGlowStyle\}/);
	assert.match(DEMO_SOURCE, /borderColor: "transparent"/);
	assert.match(DEMO_SOURCE, /maskComposite: "exclude"/);
	assert.match(DEMO_SOURCE, /WebkitBackdropFilter: borderFilter/);
	assert.match(DEMO_SOURCE, /WebkitMaskComposite: "xor"/);
	assert.doesNotMatch(DEMO_SOURCE, /style=\{borderStyle\}/);
	assert.doesNotMatch(DEMO_SOURCE, /const borderGlowLayerStyle/);
	assert.doesNotMatch(DEMO_SOURCE, /borderColor: "var\(--card-glow-tile-accent\)"/);
	assert.doesNotMatch(DEMO_SOURCE, /--card-glow-proximity/);
	assert.doesNotMatch(DEMO_SOURCE, /hover:border/);
	assert.doesNotMatch(DEMO_SOURCE, /hover:bg/);
	assert.doesNotMatch(DEMO_SOURCE, /rounded-lg border p-4/);
});
