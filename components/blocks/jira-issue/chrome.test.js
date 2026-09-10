const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const esbuild = require("esbuild");
const { loadCjsModuleFromText } = require(path.join(process.cwd(), "scripts/lib/esbuild-cjs-loader.js"));

const CHROME_SOURCE = readFileSync(
	path.join(__dirname, "chrome.ts"),
	"utf8",
);

async function loadChromeHarness() {
	const result = await esbuild.build({
		stdin: {
			contents: `
				export { resolveJiraIssueChrome } from "./components/blocks/jira-issue/chrome";
				export { token } from "./lib/tokens";
			`,
			loader: "ts",
			resolveDir: process.cwd(),
			sourcefile: "jira-issue-chrome-harness.ts",
		},
		bundle: true,
		format: "cjs",
		platform: "node",
		tsconfig: path.join(process.cwd(), "tsconfig.json"),
		write: false,
	});

	return loadCjsModuleFromText(result.outputFiles[0].text, "jira-issue-chrome-harness.cjs");
}

test("raised names idle transparent border, hover fill, and the raised shadow", async () => {
	const harness = await loadChromeHarness();
	const chrome = harness.resolveJiraIssueChrome("raised");

	assert.equal(chrome.restClassName, "border-transparent");
	assert.equal(chrome.hoverClassName, "hover:not-has-[[data-slot=jira-issue-subtask-card]:hover]:bg-surface-hovered");
	assert.equal(
		chrome.agentSurfaceHoverClassName,
		"group-[&:hover:not(:has([data-slot=jira-issue-subtask-card]:hover))]/jira-issue-card:bg-surface-hovered",
	);
	assert.equal(chrome.boxShadow, harness.token("elevation.shadow.raised"));
	assert.doesNotMatch(chrome.restClassName, /bg-surface/u);
	assert.doesNotMatch(chrome.restClassName, /border-border/u);
	assert.doesNotMatch(chrome.hoverClassName, /border-border/u);
	assert.doesNotMatch(chrome.agentSurfaceHoverClassName, /border-border/u);
});

test("stroke names the disabled rest hairline, hover border, and no shadow", async () => {
	const harness = await loadChromeHarness();
	const chrome = harness.resolveJiraIssueChrome("stroke");

	assert.equal(chrome.restClassName, "border-border-disabled");
	assert.equal(chrome.hoverClassName, "hover:not-has-[[data-slot=jira-issue-subtask-card]:hover]:border-border");
	assert.equal(
		chrome.agentSurfaceHoverClassName,
		"group-[&:hover:not(:has([data-slot=jira-issue-subtask-card]:hover))]/jira-issue-card:border-border",
	);
	assert.equal(chrome.boxShadow, "none");
	assert.doesNotMatch(chrome.restClassName, /bg-surface/u);
});

test("omit and undefined resolve to raised", async () => {
	const harness = await loadChromeHarness();
	const omitted = harness.resolveJiraIssueChrome();
	const explicitUndefined = harness.resolveJiraIssueChrome(undefined);
	const namedRaised = harness.resolveJiraIssueChrome("raised");

	assert.equal(omitted, namedRaised);
	assert.equal(explicitUndefined, namedRaised);
	assert.equal(omitted.restClassName, "border-transparent");
});

test("repeated resolve returns the same frozen object", async () => {
	const harness = await loadChromeHarness();
	const firstRaised = harness.resolveJiraIssueChrome("raised");
	const secondRaised = harness.resolveJiraIssueChrome("raised");
	const firstStroke = harness.resolveJiraIssueChrome("stroke");
	const secondStroke = harness.resolveJiraIssueChrome("stroke");

	assert.equal(firstRaised, secondRaised);
	assert.equal(firstStroke, secondStroke);
	assert.notEqual(firstRaised, firstStroke);
	assert.equal(Object.isFrozen(firstRaised), true);
	assert.equal(Object.isFrozen(firstStroke), true);
});

test("the recipe module does not import design-variants or export density", () => {
	assert.doesNotMatch(CHROME_SOURCE, /design-variants/u);
	assert.doesNotMatch(CHROME_SOURCE, /useDesignVariants/u);
	assert.doesNotMatch(CHROME_SOURCE, /usesStrokeChrome/u);
});
