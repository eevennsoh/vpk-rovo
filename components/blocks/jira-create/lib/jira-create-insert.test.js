const assert = require("node:assert/strict");
const path = require("node:path");
const test = require("node:test");
const esbuild = require("esbuild");
const { loadCjsModuleFromText } = require(path.join(process.cwd(), "scripts/lib/esbuild-cjs-loader.js"));

async function loadInsertHarness() {
	const result = await esbuild.build({
		stdin: {
			contents: `
				export {
					getJiraCreateInsertIndex,
					insertItemsAt,
					isJiraCreateInsertPosition,
				} from "./components/blocks/jira-create/lib/jira-create-insert";
			`,
			loader: "ts",
			resolveDir: process.cwd(),
			sourcefile: "jira-create-insert-harness.ts",
		},
		bundle: true,
		format: "cjs",
		platform: "node",
		tsconfig: path.join(process.cwd(), "tsconfig.json"),
		write: false,
	});

	return loadCjsModuleFromText(result.outputFiles[0].text, "jira-create-insert-harness.cjs");
}

test("insert index maps top, middle, and bottom onto a column", async () => {
	const harness = await loadInsertHarness();

	assert.equal(harness.getJiraCreateInsertIndex("top", 2), 0);
	assert.equal(harness.getJiraCreateInsertIndex("middle", 2), 1);
	assert.equal(harness.getJiraCreateInsertIndex("middle", 3), 1);
	assert.equal(harness.getJiraCreateInsertIndex("middle", 0), 0);
	assert.equal(harness.getJiraCreateInsertIndex("bottom", 2), 2);
	assert.equal(harness.getJiraCreateInsertIndex("bottom", 0), 0);
});

test("insertItemsAt splices cards at the resolved index", async () => {
	const harness = await loadInsertHarness();
	const column = ["a", "b"];

	assert.deepEqual(
		harness.insertItemsAt(column, ["new"], harness.getJiraCreateInsertIndex("top", column.length)),
		["new", "a", "b"],
	);
	assert.deepEqual(
		harness.insertItemsAt(column, ["new"], harness.getJiraCreateInsertIndex("middle", column.length)),
		["a", "new", "b"],
	);
	assert.deepEqual(
		harness.insertItemsAt(column, ["new"], harness.getJiraCreateInsertIndex("bottom", column.length)),
		["a", "b", "new"],
	);
});

test("isJiraCreateInsertPosition accepts only the three positions", async () => {
	const harness = await loadInsertHarness();

	assert.equal(harness.isJiraCreateInsertPosition("top"), true);
	assert.equal(harness.isJiraCreateInsertPosition("middle"), true);
	assert.equal(harness.isJiraCreateInsertPosition("bottom"), true);
	assert.equal(harness.isJiraCreateInsertPosition("center"), false);
});
