const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const { parseHermesSkillsConfig } = require("./hermes-config");
const {
	getHermesSkill,
	listHermesSkills,
	toggleHermesSkill,
} = require("./hermes-skills");

test("listHermesSkills discovers markdown skills and respects config filters", async () => {
	const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "vpk-hermes-skills-"));
	const previousHome = process.env.HERMES_HOME;

	process.env.HERMES_HOME = tmpDir;

	try {
		await fs.mkdir(path.join(tmpDir, "skills", "agents", "planner"), { recursive: true });
		await fs.writeFile(
			path.join(tmpDir, "skills", "agents", "planner", "SKILL.md"),
			"# Planner\n\nCoordinates multi-step work.",
			"utf8",
		);
		await fs.writeFile(
			path.join(tmpDir, "config.yaml"),
			[
				"skills:",
				"  disabled:",
				"    - general/ignored",
			].join("\n"),
			"utf8",
		);

		const skills = await listHermesSkills();
		assert.equal(skills.length, 1);
		assert.equal(skills[0].category, "agents");
		assert.equal(skills[0].name, "planner");
		assert.equal(skills[0].title, "Planner");
		assert.equal(skills[0].summary, "Coordinates multi-step work.");
		assert.equal(skills[0].enabled, true);

		const skill = await getHermesSkill("agents", "planner");
		assert.equal(skill.id, "agents/planner");

		const toggled = await toggleHermesSkill("agents", "planner", false);
		assert.equal(toggled.enabled, false);
		assert.equal(
			parseHermesSkillsConfig(await fs.readFile(path.join(tmpDir, "config.yaml"), "utf8")).disabled.includes("agents/planner"),
			true,
		);
	} finally {
		process.env.HERMES_HOME = previousHome;
		await fs.rm(tmpDir, { recursive: true, force: true });
	}
});
