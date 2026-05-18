const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const esbuild = require("esbuild");
const { loadCjsModuleFromText } = require(path.join(process.cwd(), "scripts/lib/esbuild-cjs-loader.js"));

const AGENTS_DEMO_SOURCE = fs.readFileSync(
	path.join(process.cwd(), "components/website/demos/projects/agents2-demo.tsx"),
	"utf8",
);

async function loadAgents2ContextHarness() {
	const mockModules = new Map([
		["@atlaskit/icon/core/file", "export default function FileIcon() { return null; }"],
		[
			"@/lib/rovo-suggestions",
			`
				export const defaultSuggestions = [
					{ id: "work-last-7-days", label: "Last 7 days of work", type: "skill" },
					{ id: "translate-text", label: "Translate this text", type: "skill" },
				];
			`,
		],
	]);
	const result = await esbuild.build({
		stdin: {
			contents: `
				export { BOARD_COLUMNS, RFP_CLIENT_NAMES_BY_CODE } from "./components/projects/agents2/data/board-data";
				export {
					AGENTS_BOARD_CONTEXT_LABEL,
					RFP_101_WORK_ITEM,
					formatActiveJiraWorkItemContext,
					formatAgentsBoardContext,
					getAgentsWorkItemForCard,
					resolveAgentsChatScreenContext,
				} from "./components/projects/agents2/data/rfp-work-items";
			`,
			loader: "ts",
			resolveDir: process.cwd(),
			sourcefile: "agents2-context-harness.ts",
		},
		bundle: true,
		format: "cjs",
		platform: "node",
		tsconfig: path.join(process.cwd(), "tsconfig.json"),
		write: false,
		plugins: [{
			name: "agents2-context-test-mocks",
			setup(build) {
				build.onResolve({ filter: /.*/ }, (args) => mockModules.has(args.path)
					? { path: args.path, namespace: "agents2-context-test-mock" }
					: undefined);
				build.onLoad({ filter: /.*/, namespace: "agents2-context-test-mock" }, (args) => ({
					contents: mockModules.get(args.path),
					loader: "tsx",
					resolveDir: process.cwd(),
				}));
			},
		}],
	});

	return loadCjsModuleFromText(result.outputFiles[0].text);
}

test("agents2 board is rewritten as the Omni Live Launch kanban", async () => {
	const harness = await loadAgents2ContextHarness();

	assert.equal(harness.AGENTS_BOARD_CONTEXT_LABEL, "Omni Live Launch");
	assert.deepEqual(harness.BOARD_COLUMNS.map((column) => column.title), [
		"Briefing",
		"Outline Drafting",
		"Experience Build",
		"Launch Ready",
	]);
	assert.equal(harness.BOARD_COLUMNS.flatMap((column) => column.cards).length, 16);
	assert.equal(harness.RFP_CLIENT_NAMES_BY_CODE["OMNI-101"], "Live demo");
	assert.equal(harness.RFP_101_WORK_ITEM.code, "OMNI-101");
	assert.match(harness.RFP_101_WORK_ITEM.title, /Live demo: Define live-demo-first landing page narrative/u);
});

test("OMNI-101 active context carries Omni Live landing-page facts", async () => {
	const harness = await loadAgents2ContextHarness();
	const context = harness.formatActiveJiraWorkItemContext(harness.RFP_101_WORK_ITEM);

	assert.match(context, /^\[Active Jira Work Item Context\]/u);
	assert.match(context, /Source: \/agents2 Omni Live work item modal/u);
	assert.match(context, /Key: OMNI-101/u);
	assert.match(context, /Omni Live public landing page launch/u);
	assert.match(context, /Developer Preview by May 28; Public Beta by June 18; GA by July 9/u);
	assert.match(context, /Audience priorities:/u);
	assert.match(context, /Page success criteria:/u);
	assert.match(context, /Positioning themes:/u);
	assert.match(context, /Launch team needs:/u);
	assert.match(context, /VoiceMate/u);
	assert.doesNotMatch(context, /Acmecorp|RFP Intake|DACI|bid\/no-bid/u);
});

test("board and work-item chat context use Omni Live labels and suggestions", async () => {
	const harness = await loadAgents2ContextHarness();
	const boardContext = harness.resolveAgentsChatScreenContext(null);
	const workItemContext = harness.resolveAgentsChatScreenContext(harness.RFP_101_WORK_ITEM);
	const outlinePrompt = workItemContext.greeting.suggestions.find((suggestion) => suggestion.id === "translate-text");

	assert.deepEqual(boardContext.chatContextBar, {
		label: "Omni Live Launch",
		iconName: "board",
		signature: "agents2-board:omni-live-launch",
	});
	assert.match(boardContext.contextDescription, /Source: \/agents2 Omni Live launch board/u);
	assert.deepEqual(workItemContext.chatContextBar, {
		label: "OMNI-101: Live demo: Define live-demo-first landing page narrative",
		iconName: "work-item",
		signature: "agents2-work-item:OMNI-101",
	});
	assert.equal(outlinePrompt.label, "Draft the landing page outline");
	assert.equal(outlinePrompt.prompt, "Draft the landing page outline for Omni Live.");
});

test("generated agents2 work items use OMNI codes and substantial Omni Live content", async () => {
	const harness = await loadAgents2ContextHarness();
	const cards = harness.BOARD_COLUMNS.flatMap((column) => column.cards);

	for (const card of cards) {
		const workItem = harness.getAgentsWorkItemForCard(card);
		assert.match(workItem.code, /^OMNI-\d+$/u);
		assert.equal(workItem.title, card.title);
		assert.ok(workItem.description.length > 120, `${workItem.code} description is too short`);
		assert.deepEqual(workItem.labels, card.tags.map((tag) => tag.text));
		assert.deepEqual(workItem.labelTags, card.tags);
	}
});

test("agents2 demo onboarding sends VoiceMate and Omni Live context", () => {
	assert.match(AGENTS_DEMO_SOURCE, /Create an \$\{RFP_DRAFTING_AGENT_NAME\} for the Outline Drafting column on the Omni Live Launch board/u);
	assert.match(AGENTS_DEMO_SOURCE, /Source: \/agents2 VoiceMate agent onboarding/u);
	assert.match(AGENTS_DEMO_SOURCE, /attach a landing-page outline/u);
	assert.match(AGENTS_DEMO_SOURCE, /Dismiss VoiceMate onboarding/u);
	assert.doesNotMatch(AGENTS_DEMO_SOURCE, /\/agents RFP|RFP agent|backend event flow/u);
});
