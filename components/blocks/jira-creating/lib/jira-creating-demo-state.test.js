const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const esbuild = require("esbuild");
const { loadCjsModuleFromText } = require(path.join(process.cwd(), "scripts/lib/esbuild-cjs-loader.js"));

const HOOK_SOURCE = readFileSync(
	path.join(__dirname, "../hooks/use-jira-creating-demo.ts"),
	"utf8",
);
const PAGE_SOURCE = readFileSync(path.join(__dirname, "../page.tsx"), "utf8");

async function loadDemoStateHarness() {
	const result = await esbuild.build({
		stdin: {
			contents: `
				export {
					addJiraCreateDemoCards,
					createJiraCreateDemoColumnState,
					jiraCreateColumnHasCreatedItems,
					restartJiraCreateDemoColumn,
				} from "./components/blocks/jira-creating/lib/jira-creating-demo-state";
			`,
			loader: "ts",
			resolveDir: process.cwd(),
			sourcefile: "jira-creating-demo-state-harness.ts",
		},
		bundle: true,
		format: "cjs",
		platform: "node",
		tsconfig: path.join(process.cwd(), "tsconfig.json"),
		write: false,
	});

	return loadCjsModuleFromText(result.outputFiles[0].text, "jira-creating-demo-state-harness.cjs");
}

test("Restart rebuilds a resting column with no created work items", async () => {
	const harness = await loadDemoStateHarness();
	const added = harness.addJiraCreateDemoCards(harness.createJiraCreateDemoColumnState(), {
		count: 2,
		example: "work-item",
		idPrefix: "demo",
		position: "top",
	});

	assert.equal(harness.jiraCreateColumnHasCreatedItems(added.todoItems), true);
	assert.equal(added.todoItems.filter((item) => item.kind === "created").length, 2);
	assert.equal(added.todoItems[0].card.code, "PAY-132");

	const restarted = harness.restartJiraCreateDemoColumn();

	assert.equal(harness.jiraCreateColumnHasCreatedItems(restarted.todoItems), false);
	assert.deepEqual(
		restarted.todoItems.map((item) => item.kind),
		["resting", "resting"],
	);
	assert.deepEqual(
		restarted.todoItems.map((item) => item.card.code),
		["PAY-118", "PAY-124"],
	);
	assert.equal(restarted.todoItems.some((item) => item.card.code === "PAY-132"), false);
	assert.equal(restarted.createdSeq, 0);
	assert.equal(restarted.poolIndex, 0);
	assert.deepEqual(restarted.revealItemIds, []);
});

test("the page remounts the board from Restart, not a leftover replay path", () => {
	assert.match(HOOK_SOURCE, /restartJiraCreateDemoColumn\(\)/u);
	assert.match(
		HOOK_SOURCE,
		/const restart = useCallback\(\(\) => \{\s*resetColumn\(example\);\s*\}, \[example, resetColumn\]\);/u,
	);
	assert.match(HOOK_SOURCE, /setBoardGeneration\(\(current\) => current \+ 1\)/u);
	assert.doesNotMatch(HOOK_SOURCE, /generation: item\.generation \+ 1|const replay/u);
	assert.match(PAGE_SOURCE, /onRestart=\{demo\.restart\}/u);
	assert.match(PAGE_SOURCE, /<JiraCreateBoard[\s\S]*key=\{demo\.boardGeneration\}/u);
});
