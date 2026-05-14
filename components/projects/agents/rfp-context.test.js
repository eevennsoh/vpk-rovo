const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const esbuild = require("esbuild");
const { loadCjsModuleFromText } = require(path.join(process.cwd(), "scripts/lib/esbuild-cjs-loader.js"));

const AGENTS_VIEW_SOURCE = fs.readFileSync(path.join(__dirname, "page.tsx"), "utf8");
const AGENTS_DEMO_SOURCE = fs.readFileSync(
	path.join(process.cwd(), "components/website/demos/projects/agents-demo.tsx"),
	"utf8",
);
const ROVO_CHAT_CONTEXT_SOURCE = fs.readFileSync(
	path.join(process.cwd(), "app/contexts/context-rovo-chat.tsx"),
	"utf8",
);

async function loadRfpContextHarness() {
	const result = await esbuild.build({
		stdin: {
			contents: `
				export {
					AGENTS_BOARD_CONTEXT_LABEL,
					RFP_101_WORK_ITEM,
					formatActiveJiraWorkItemContext,
					formatAgentsBoardContext,
					getAgentsWorkItemForCard,
					resolveAgentsChatScreenContext,
				} from "./components/projects/agents/data/rfp-work-items";
				export { mergeRovoContextDescriptions } from "./lib/rovo-context";
			`,
			loader: "ts",
			resolveDir: process.cwd(),
			sourcefile: "rfp-context-harness.ts",
		},
		bundle: true,
		format: "cjs",
		platform: "node",
		tsconfig: path.join(process.cwd(), "tsconfig.json"),
		write: false,
	});

	return loadCjsModuleFromText(result.outputFiles[0].text);
}

test("RFP-101 active work item formats a bounded hidden Jira context block", async () => {
	const harness = await loadRfpContextHarness();
	const context = harness.formatActiveJiraWorkItemContext(harness.RFP_101_WORK_ITEM);

	assert.match(context, /^\[Active Jira Work Item Context\]/);
	assert.match(context, /\[End Active Jira Work Item Context\]$/);
	assert.match(context, /Acme Mobility/);
	assert.match(context, /Description: Acme Mobility is evaluating a switch/);
	assert.match(context, /Due date: Oct 28, 2026/);
	assert.match(context, /10,000 seats/);
	assert.match(context, /LegacyWorks Enterprise/);
	assert.match(context, /Response team needs:/);
	assert.match(context, /RFP-105: Build compliance matrix/);
	assert.match(context, /Acme-Mobility-enterprise-RFP\.pdf/);
	assert.match(context, /Recent activity:/);
	assert.match(context, /Sales engineering can own migration architecture/);
});

test("board fallback formats bounded visible /agents context", async () => {
	const harness = await loadRfpContextHarness();
	const context = harness.formatAgentsBoardContext();

	assert.match(context, /^\[Agents Board Context\]/);
	assert.match(context, /\[End Agents Board Context\]$/);
	assert.match(context, /VitaFleet Q4 RFP Response/);
	assert.match(context, /RFP Intake: 9 work items/);
	assert.match(context, /RFP-101: Qualify inbound Acme Mobility RFP/);
	assert.ok(context.length < 1_500);
});

test("non-RFP-101 work items format a lightweight active work item context", async () => {
	const harness = await loadRfpContextHarness();
	const workItem = harness.getAgentsWorkItemForCard({
		code: "RFP-102",
		title: "Log procurement portal requirements",
	});

	assert.deepEqual(workItem, {
		code: "RFP-102",
		title: "Log procurement portal requirements",
	});
	assert.equal(
		harness.formatActiveJiraWorkItemContext(workItem),
		[
			"[Active Jira Work Item Context]",
			"Source: /agents Jira work item.",
			"Key: RFP-102",
			"Title: Log procurement portal requirements",
			"[End Active Jira Work Item Context]",
		].join("\n"),
	);
	assert.equal(harness.formatActiveJiraWorkItemContext(null), undefined);
});

test("agents chat screen resolver switches from board fallback to active work item", async () => {
	const harness = await loadRfpContextHarness();

	const boardContext = harness.resolveAgentsChatScreenContext(null);
	assert.deepEqual(boardContext.chatContextBar, {
		label: harness.AGENTS_BOARD_CONTEXT_LABEL,
		iconName: "board",
		signature: "agents-board:vitafleet-q4-rfp-response",
	});
	assert.match(boardContext.contextDescription, /^\[Agents Board Context\]/);

	const workItemContext = harness.resolveAgentsChatScreenContext(harness.RFP_101_WORK_ITEM);
	assert.deepEqual(workItemContext.chatContextBar, {
		label: "RFP-101: Qualify inbound Acme Mobility RFP",
		iconName: "work-item",
		signature: "agents-work-item:RFP-101",
	});
	assert.match(workItemContext.contextDescription, /^\[Active Jira Work Item Context\]/);
});

test("Rovo context merging preserves active work item context and suggestion context", async () => {
	const harness = await loadRfpContextHarness();
	const merged = harness.mergeRovoContextDescriptions(
		"[Active Jira Work Item Context]\nKey: RFP-101\n[End Active Jira Work Item Context]",
		"[Work Summary Scope]\nSearch Jira and Confluence.\n[End Work Summary Scope]",
	);

	assert.equal(
		merged,
		[
			"[Active Jira Work Item Context]\nKey: RFP-101\n[End Active Jira Work Item Context]",
			"[Work Summary Scope]\nSearch Jira and Confluence.\n[End Work Summary Scope]",
		].join("\n\n"),
	);
});

test("Rovo provider merges default context with per-prompt context", () => {
	assert.match(
		ROVO_CHAT_CONTEXT_SOURCE,
		/import \{ mergeRovoContextDescriptions \} from "@\/lib\/rovo-context";/,
	);
	assert.match(
		ROVO_CHAT_CONTEXT_SOURCE,
		/contextDescription: mergeRovoContextDescriptions\(\s*defaultOptions\.contextDescription,\s*options\.contextDescription\s*\)/,
	);
});

test("Agents view opens the richer active work item through the presentation controller", () => {
	assert.match(AGENTS_VIEW_SOURCE, /const workItem = getAgentsWorkItemForCard\(\{ title, code \}\);/);
	assert.match(AGENTS_VIEW_SOURCE, /workItemPresentation\.openModal\(workItem\)/);
	assert.match(AGENTS_VIEW_SOURCE, /workItem=\{selectedWorkItem\}/);
});

test("Agents demo feeds active work item context into RovoChatProvider defaults", () => {
	assert.match(
		AGENTS_DEMO_SOURCE,
		/resolveAgentsChatScreenContext\(workItemPresentation\.state\.workItem\)/,
	);
	assert.match(AGENTS_DEMO_SOURCE, /contextDescription: mergeRovoContextDescriptions/);
	assert.match(AGENTS_DEMO_SOURCE, /agentsChatScreenContext\.contextDescription/);
	assert.match(AGENTS_DEMO_SOURCE, /<RovoChatProvider defaultPromptOptions=\{chatPromptOptions\}>/);
	assert.match(AGENTS_DEMO_SOURCE, /chatContextBar=\{agentsChatScreenContext\.chatContextBar\}/);
});
