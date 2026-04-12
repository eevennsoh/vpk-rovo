const assert = require("node:assert/strict");
const test = require("node:test");

const {
	parseHermesSkillsConfig,
	upsertSkillsList,
} = require("./hermes-config");

test("parseHermesSkillsConfig reads nested skill lists", () => {
	const config = [
		"skills:",
		"  external_dirs:",
		"    - /tmp/skills",
		"  disabled:",
		"    - experimental/foo",
		"  platform_disabled: []",
	].join("\n");

	assert.deepEqual(parseHermesSkillsConfig(config), {
		disabled: ["experimental/foo"],
		externalDirs: ["/tmp/skills"],
		platformDisabled: [],
	});
});

test("upsertSkillsList adds a disabled list into an existing skills block", () => {
	const config = [
		"skills:",
		"  external_dirs:",
		"    - /tmp/skills",
	].join("\n");

	assert.equal(
		upsertSkillsList(config, "disabled", ["foo/bar"]),
		[
			"skills:",
			"  external_dirs:",
			"    - /tmp/skills",
			"  disabled:",
			"    - \"foo/bar\"",
		].join("\n") + "\n",
	);
});
