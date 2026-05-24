const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const { parseHermesSkillsConfig } = require("./hermes-config");
const {
	archiveHermesSkill,
	createHermesSkillFromBundle,
	getHermesSkill,
	getHermesSkillBundle,
	listHermesSkills,
	toggleHermesSkill,
	updateHermesSkillFromBundle,
} = require("./hermes-skills");

test("listHermesSkills discovers markdown skills and respects config filters", async () => {
	const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "vpk-hermes-skills-"));
	const vendorDir = await fs.mkdtemp(path.join(os.tmpdir(), "vpk-hermes-vendor-"));
	const previousHome = process.env.HERMES_HOME;
	const previousVendorDir = process.env.HERMES_VENDOR_SKILLS_DIR;

	process.env.HERMES_HOME = tmpDir;
	process.env.HERMES_VENDOR_SKILLS_DIR = vendorDir;

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
		const plannerSkill = skills.find((skill) =>
			skill.category === "agents" && skill.name === "planner",
		);
		assert.ok(plannerSkill);
		assert.equal(plannerSkill.title, "Planner");
		assert.equal(plannerSkill.summary, "Coordinates multi-step work.");
		assert.equal(plannerSkill.enabled, true);

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
		process.env.HERMES_VENDOR_SKILLS_DIR = previousVendorDir;
		await Promise.all([
			fs.rm(tmpDir, { recursive: true, force: true }),
			fs.rm(vendorDir, { recursive: true, force: true }),
		]);
	}
});

test("listHermesSkills includes vendored upstream skills and dedupes by precedence", async () => {
	const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "vpk-hermes-skills-"));
	const vendorDir = await fs.mkdtemp(path.join(os.tmpdir(), "vpk-hermes-vendor-"));
	const externalDir = await fs.mkdtemp(path.join(os.tmpdir(), "vpk-hermes-external-"));
	const previousHome = process.env.HERMES_HOME;
	const previousVendorDir = process.env.HERMES_VENDOR_SKILLS_DIR;

	process.env.HERMES_HOME = tmpDir;
	process.env.HERMES_VENDOR_SKILLS_DIR = vendorDir;

	try {
		await fs.mkdir(path.join(tmpDir, "skills", "research", "llm-wiki"), { recursive: true });
		await fs.writeFile(
			path.join(tmpDir, "skills", "research", "llm-wiki", "SKILL.md"),
			"# Local Wiki\n\nLocal override.",
			"utf8",
		);
		await fs.mkdir(path.join(vendorDir, "creative", "p5js"), { recursive: true });
		await fs.writeFile(
			path.join(vendorDir, "creative", "p5js", "SKILL.md"),
			"# p5js\n\nVendored upstream skill.",
			"utf8",
		);
		await fs.mkdir(path.join(vendorDir, "research", "llm-wiki"), { recursive: true });
		await fs.writeFile(
			path.join(vendorDir, "research", "llm-wiki", "SKILL.md"),
			"# Vendored Wiki\n\nVendored upstream wiki.",
			"utf8",
		);
		await fs.mkdir(path.join(externalDir, "research", "llm-wiki"), { recursive: true });
		await fs.writeFile(
			path.join(externalDir, "research", "llm-wiki", "SKILL.md"),
			"# External Wiki\n\nExternal override.",
			"utf8",
		);
		await fs.writeFile(
			path.join(tmpDir, "config.yaml"),
			[
				"skills:",
				"  external_dirs:",
				`    - ${externalDir}`,
				"  disabled: []",
				"  platform_disabled: []",
			].join("\n"),
			"utf8",
		);

		const skills = await listHermesSkills();
		const wikiSkills = skills.filter((skill) => skill.id === "research/llm-wiki");
		assert.equal(wikiSkills.length, 1);
		assert.equal(wikiSkills[0].source, "local");
		assert.equal(wikiSkills[0].title, "Local Wiki");

		const p5Skill = skills.find((skill) => skill.id === "creative/p5js");
		assert.ok(p5Skill);
		assert.equal(p5Skill.source, "vendored-upstream");
	} finally {
		process.env.HERMES_HOME = previousHome;
		process.env.HERMES_VENDOR_SKILLS_DIR = previousVendorDir;
		await Promise.all([
			fs.rm(tmpDir, { recursive: true, force: true }),
			fs.rm(vendorDir, { recursive: true, force: true }),
			fs.rm(externalDir, { recursive: true, force: true }),
		]);
	}
});

test("local Hermes skill bundles can be created, updated, and archived", async () => {
	const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "vpk-hermes-skills-"));
	const vendorDir = await fs.mkdtemp(path.join(os.tmpdir(), "vpk-hermes-vendor-"));
	const previousHome = process.env.HERMES_HOME;
	const previousVendorDir = process.env.HERMES_VENDOR_SKILLS_DIR;

	process.env.HERMES_HOME = tmpDir;
	process.env.HERMES_VENDOR_SKILLS_DIR = vendorDir;

	try {
		const created = await createHermesSkillFromBundle({
			category: "research",
			name: "llm-wiki-helper",
			files: [
				{
					path: "SKILL.md",
					content: "# Wiki Helper\n\nUse this skill for wiki ingestion.",
				},
				{
					path: "references/guide.md",
					content: "# Guide\n\nHelpful details.",
				},
			],
		});
		assert.equal(created.category, "research");
		assert.equal(created.files.length, 2);
		assert.equal(created.enabled, true);

		const updated = await updateHermesSkillFromBundle({
			category: "research",
			name: "llm-wiki-helper",
			files: [
				{
					path: "SKILL.md",
					content: "# Wiki Helper\n\nUpdated skill body.",
				},
			],
		});
		assert.equal(updated.files.length, 1);
		assert.match(updated.files[0].content, /Updated skill body/u);

		const bundle = await getHermesSkillBundle("research", "llm-wiki-helper");
		assert.equal(bundle.files.length, 1);

		const archived = await archiveHermesSkill("research", "llm-wiki-helper");
		assert.equal(archived.category, "research");
		await assert.rejects(
			() => getHermesSkill("research", "llm-wiki-helper"),
			/was not found/u,
		);
		const config = parseHermesSkillsConfig(await fs.readFile(path.join(tmpDir, "config.yaml"), "utf8"));
		assert.equal(config.disabled.includes("research/llm-wiki-helper"), true);
	} finally {
		process.env.HERMES_HOME = previousHome;
		process.env.HERMES_VENDOR_SKILLS_DIR = previousVendorDir;
		await Promise.all([
			fs.rm(tmpDir, { recursive: true, force: true }),
			fs.rm(vendorDir, { recursive: true, force: true }),
		]);
	}
});
