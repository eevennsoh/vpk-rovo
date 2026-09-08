const assert = require("node:assert/strict");
const test = require("node:test");

test("component test report separates classified and legacy-drift node:test files", async () => {
	const { buildComponentTestReport } = await import("./run-js-unit-tests.mjs");
	const report = buildComponentTestReport([
		{
			filePath: "components/allowed.test.js",
			source: 'const test = require("node:test");',
		},
		{
			filePath: "components/skipped.test.js",
			source: 'const test = require("node:test");',
		},
		{
			filePath: "components/not-node-test.test.js",
			source: "module.exports = {};",
		},
		{
			filePath: "lib/included-by-prefix.test.js",
			source: 'const test = require("node:test");',
		},
	], {
		classificationByFile: new Map([["components/allowed.test.js", "stable"]]),
		includedTestFiles: new Set(["components/allowed.test.js"]),
		includedTestPrefixes: ["lib/"],
		excludedTestFiles: new Set(),
	});

	assert.deepEqual(report, {
		version: 1,
		componentRoot: "components/",
		includedCount: 1,
		excludedCount: 1,
		includedFiles: ["components/allowed.test.js"],
		excludedFiles: [
			{
				classification: "legacy-drift",
				filePath: "components/skipped.test.js",
				reason: "legacy-drift",
			},
		],
	});
});

test("component test report output chunks only payloads that exceed the line limit", async () => {
	const { formatComponentTestReport } = await import("./run-js-unit-tests.mjs");
	const smallReport = { includedFiles: ["components/a.test.js"] };
	assert.equal(
		formatComponentTestReport(smallReport),
		`JS_UNIT_COMPONENT_TEST_REPORT ${JSON.stringify(smallReport)}`,
	);

	const largeReport = { excludedFiles: Array.from({ length: 20 }, (_, index) => ({
		filePath: `components/long-component-name-${index}.test.js`,
	})) };
	const output = formatComponentTestReport(largeReport, { maxLineBytes: 128 });
	const lines = output.split("\n");
	assert.equal(lines[0].startsWith("JS_UNIT_COMPONENT_TEST_REPORT_BEGIN "), true);
	assert.equal(lines.at(-1), "JS_UNIT_COMPONENT_TEST_REPORT_END");
	assert.equal(lines.every((line) => Buffer.byteLength(line) <= 128), true);
	const reconstructed = lines.slice(1, -1)
		.map((line) => line.replace(/^JS_UNIT_COMPONENT_TEST_REPORT_CHUNK \d+\/\d+ /u, ""))
		.join("");
	assert.deepEqual(JSON.parse(reconstructed), largeReport);
});

test("runnable test selection includes manifest classifications in the CI gate", async () => {
	const { selectRunnableTestFiles } = await import("./run-js-unit-tests.mjs");
	const runnableFiles = selectRunnableTestFiles([
		{
			filePath: "components/stable.test.js",
			source: 'const test = require("node:test");',
		},
		{
			filePath: "components/source-contract.test.js",
			source: 'const test = require("node:test");',
		},
		{
			filePath: "components/legacy-drift.test.js",
			source: 'const test = require("node:test");',
		},
	], {
		classificationByFile: new Map([
			["components/stable.test.js", "stable"],
			["components/source-contract.test.js", "source-contract"],
			["components/legacy-drift.test.js", "legacy-drift"],
		]),
		excludedTestFiles: new Set(),
		includedTestFiles: new Set(),
		includedTestPrefixes: [],
	});

	assert.deepEqual(runnableFiles, [
		"components/stable.test.js",
		"components/source-contract.test.js",
	]);
});

test("runnable test selection preserves the existing prefix and explicit-file gates", async () => {
	const { selectRunnableTestFiles } = await import("./run-js-unit-tests.mjs");
	const runnableFiles = selectRunnableTestFiles([
		{
			filePath: "backend/included-by-prefix.test.js",
			source: 'const test = require("node:test");',
		},
		{
			filePath: "components/allowed.test.js",
			source: 'const test = require("node:test");',
		},
		{
			filePath: "components/skipped.test.js",
			source: 'const test = require("node:test");',
		},
		{
			filePath: "scripts/not-node-test.test.js",
			source: "module.exports = {};",
		},
	], {
		includedTestFiles: new Set(["components/allowed.test.js"]),
		includedTestPrefixes: ["backend/", "scripts/"],
		excludedTestFiles: new Set(),
	});

	assert.deepEqual(runnableFiles, [
		"backend/included-by-prefix.test.js",
		"components/allowed.test.js",
	]);
});

test("CLI selection options can narrow tests to named slices", async () => {
	const { buildSelectionOptions, parseTestSelectionArgs, selectRunnableTestFiles } = await import("./run-js-unit-tests.mjs");
	const selection = parseTestSelectionArgs([
		"--prefix",
		"backend/,app/api/",
		"--file=components/allowed.test.js",
	]);
	const options = {
		...buildSelectionOptions(selection),
		classificationByFile: new Map([
			["components/stable-outside-selection.test.js", "stable"],
		]),
	};
	const runnableFiles = selectRunnableTestFiles([
		{
			filePath: "backend/included.test.js",
			source: 'const test = require("node:test");',
		},
		{
			filePath: "app/api/included.test.ts",
			source: 'import test from "node:test";',
		},
		{
			filePath: "components/allowed.test.js",
			source: 'const test = require("node:test");',
		},
		{
			filePath: "components/stable-outside-selection.test.js",
			source: 'const test = require("node:test");',
		},
		{
			filePath: "lib/excluded.test.js",
			source: 'const test = require("node:test");',
		},
	], options);

	assert.deepEqual(selection, {
		files: ["components/allowed.test.js"],
		prefixes: ["backend/", "app/api/"],
	});
	assert.deepEqual(runnableFiles, [
		"backend/included.test.js",
		"app/api/included.test.ts",
		"components/allowed.test.js",
	]);
});

test("CLI selection rejects unknown or incomplete arguments", async () => {
	const { parseTestSelectionArgs } = await import("./run-js-unit-tests.mjs");

	assert.throws(() => parseTestSelectionArgs(["--prefix"]), /requires a value/);
	assert.throws(() => parseTestSelectionArgs(["--unknown"]), /Unknown argument/);
});

test("component coverage report is skipped for non-component slices", async () => {
	const { shouldReportComponentCoverage } = await import("./run-js-unit-tests.mjs");

	assert.equal(shouldReportComponentCoverage(), true);
	assert.equal(shouldReportComponentCoverage({ prefixes: ["backend/"] }), false);
	assert.equal(shouldReportComponentCoverage({ prefixes: ["components/website/"] }), true);
	assert.equal(shouldReportComponentCoverage({ files: ["components/ui/button.test.js"] }), true);
});

test("test discovery skips files deleted or moved before staging", async () => {
	const { filterExistingTestFiles } = await import("./run-js-unit-tests.mjs");

	assert.deepEqual(
		filterExistingTestFiles([
			"components/projects/rovo/components/deleted.test.js",
			"components/projects/rovo-core/components/moved.test.js",
		], (filePath) => filePath.includes("rovo-core")),
		["components/projects/rovo-core/components/moved.test.js"],
	);
});

test("classified test paths fail validation with a deterministic diagnostic", async () => {
	const { assertClassifiedTestFilesExist } = await import("./run-js-unit-tests.mjs");

	assert.throws(
		() => assertClassifiedTestFilesExist({
			stable: ["components/present.test.js", "components/missing.test.js"],
			"source-contract": ["app/data/moved.test.js"],
		}, (filePath) => filePath === "components/present.test.js"),
		new Error([
			"js-unit-tests: classified test paths do not exist:",
			"- source-contract: app/data/moved.test.js",
			"- stable: components/missing.test.js",
		].join("\n")),
	);
});

test("Jira and ASX tests renamed to v0, v1, and v2 remain classified", async () => {
	const {
		TEST_FILE_CLASSIFICATIONS,
	} = await import("./js-unit-test-manifest.mjs");
	const sourceContractFiles = new Set(TEST_FILE_CLASSIFICATIONS["source-contract"]);

	for (const filePath of [
		"components/projects/jira-golden-journeys-v0/kanban-stage.test.js",
		"components/projects/jira-golden-journeys-v0/queue-stage.test.js",
		"components/projects/jira-golden-journeys-v1/agent-chat-demo.test.js",
		"components/projects/jira-golden-journeys-v1/kanban-stage.test.js",
		"components/projects/jira-golden-journeys-v2/jira-golden-journeys-v2.test.js",
		"app/data/jira-golden-journeys-v1-contract.test.js",
	]) {
		assert.equal(sourceContractFiles.has(filePath), true, `${filePath} should remain source-contract`);
	}
});

test("every checked-in classified test path exists", async () => {
	const { TEST_FILE_CLASSIFICATIONS } = await import("./js-unit-test-manifest.mjs");
	const { assertClassifiedTestFilesExist } = await import("./run-js-unit-tests.mjs");

	assert.doesNotThrow(() => assertClassifiedTestFilesExist(TEST_FILE_CLASSIFICATIONS));
});

test("test batching groups ordinary node tests by directory and isolates vm-module tests", async () => {
	const { buildTestFileBatches } = await import("./run-js-unit-tests.mjs");
	const sourceByFile = new Map([
		["backend/a.test.js", 'const test = require("node:test");'],
		["backend/b.test.js", 'const test = require("node:test");'],
		["backend/lib/c.test.js", 'const test = require("node:test");'],
		["scripts/vm.test.js", "const module = new vm.SourceTextModule('');"],
		["scripts/ordinary.test.js", 'const test = require("node:test");'],
	]);

	assert.deepEqual(
		buildTestFileBatches([...sourceByFile.keys()], {
			readFile: (filePath) => sourceByFile.get(filePath),
		}),
		[
			{
				files: ["backend/a.test.js", "backend/b.test.js"],
				nodeArgs: [],
				reason: "directory",
			},
			{
				files: ["backend/lib/c.test.js"],
				nodeArgs: [],
				reason: "directory",
			},
			{
				files: ["scripts/vm.test.js"],
				nodeArgs: ["--experimental-vm-modules"],
				reason: "vm-modules",
			},
			{
				files: ["scripts/ordinary.test.js"],
				nodeArgs: [],
				reason: "directory",
			},
		],
	);
});

test("runTestFiles invokes node:test once per batch", async () => {
	const { runTestFiles } = await import("./run-js-unit-tests.mjs");
	const calls = [];
	const sourceByFile = new Map([
		["backend/a.test.js", 'const test = require("node:test");'],
		["backend/b.test.js", 'const test = require("node:test");'],
		["scripts/vm.test.js", "const module = new vm.SyntheticModule([], () => {});"],
	]);

	runTestFiles([...sourceByFile.keys()], {
		readFile: (filePath) => sourceByFile.get(filePath),
		spawn: (command, args, options) => {
			calls.push({ args, command, options });
			return { status: 0 };
		},
	});

	assert.deepEqual(calls, [
		{
			command: process.execPath,
			args: ["--test", "backend/a.test.js", "backend/b.test.js"],
			options: { stdio: "inherit" },
		},
		{
			command: process.execPath,
			args: ["--experimental-vm-modules", "--test", "scripts/vm.test.js"],
			options: { stdio: "inherit" },
		},
	]);
});
