const assert = require("node:assert/strict");
const path = require("node:path");
const test = require("node:test");
const esbuild = require("esbuild");
const { loadCjsModuleFromText } = require(process.cwd() + "/scripts/lib/esbuild-cjs-loader.js");

const MODULE_PATH = path.join(__dirname, "development-commands.ts");

let modulePromise;
function loadModule() {
	if (!modulePromise) {
		modulePromise = esbuild
			.build({
				entryPoints: [MODULE_PATH],
				bundle: true,
				format: "cjs",
				platform: "node",
				tsconfig: path.join(process.cwd(), "tsconfig.json"),
				write: false,
			})
			.then((result) => loadCjsModuleFromText(result.outputFiles[0].text, "development-commands-harness.cjs"));
	}
	return modulePromise;
}

test("derives the branch name from the key plus a slugged summary", async () => {
	const { toDevelopmentCommands } = await loadModule();

	assert.equal(toDevelopmentCommands("PD-61", "Slingshot maneuver").branchName, "PD-61-slingshot-maneuver");
});

test("collapses punctuation and trims stray separators out of the slug", async () => {
	const { toBranchSlug } = await loadModule();

	assert.equal(toBranchSlug("  Fix: checkout (v2) — retry! "), "fix-checkout-v2-retry");
});

test("strips accents rather than leaking combining marks into the branch", async () => {
	const { toBranchSlug } = await loadModule();

	assert.equal(toBranchSlug("Résumé étape"), "resume-etape");
});

test("caps the slug so branch names stay shell-friendly and never end in a hyphen", async () => {
	const { toBranchSlug } = await loadModule();
	const slug = toBranchSlug("a".repeat(58) + " tail");

	assert.equal(slug.length <= 60, true);
	assert.equal(slug.endsWith("-"), false);
});

test("wraps the branch and summary in copy-ready git commands", async () => {
	const { toDevelopmentCommands } = await loadModule();
	const commands = toDevelopmentCommands("PD-61", "Slingshot maneuver");

	assert.equal(commands.branchCommand, "git checkout -b PD-61-slingshot-maneuver");
	assert.equal(commands.commitCommand, "git commit -m 'PD-61 Slingshot maneuver'");
	assert.equal(commands.workItemKey, "PD-61");
});

test("falls back to the bare key when the summary has no sluggable characters", async () => {
	const { toDevelopmentCommands } = await loadModule();
	const commands = toDevelopmentCommands(" PD-61 ", "  ***  ");

	assert.equal(commands.branchName, "PD-61");
	assert.equal(commands.branchCommand, "git checkout -b PD-61");
});

test("keeps the human summary verbatim in the commit subject", async () => {
	const { toDevelopmentCommands } = await loadModule();

	assert.equal(
		toDevelopmentCommands("PD-61", "  Fix: checkout (v2)  ").commitCommand,
		"git commit -m 'PD-61 Fix: checkout (v2)'",
	);
});

test("neutralises shell syntax so a pasted commit command cannot execute", async () => {
	const { toDevelopmentCommands } = await loadModule();

	// Single quotes make `$(…)`, backticks, `$VAR`, `\` and `"` literal.
	assert.equal(
		toDevelopmentCommands("PD-61", 'Fix $(whoami) and `id` for "$HOME\\path"').commitCommand,
		String.raw`git commit -m 'PD-61 Fix $(whoami) and ` + "`id`" + String.raw` for "$HOME\path"'`,
	);
});

test("escapes an apostrophe by closing, escaping, and reopening the quote", async () => {
	const { toDevelopmentCommands } = await loadModule();

	assert.equal(
		toDevelopmentCommands("PD-61", "Fix Bob's checkout").commitCommand,
		String.raw`git commit -m 'PD-61 Fix Bob'\''s checkout'`,
	);
});
