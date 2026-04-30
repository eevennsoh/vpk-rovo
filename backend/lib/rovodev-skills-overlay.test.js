const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const {
	ensureRovodevSkillsSymlink,
	parseHermesSkillMarkdown,
	sanitizeHermesSkillMarkdown,
	syncRovodevSkillsOverlay,
} = require("./rovodev-skills-overlay");

async function withTempDir(fn) {
	const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "vpk-rovodev-skills-"));
	try {
		await fn(tempDir);
	} finally {
		await fs.rm(tempDir, { recursive: true, force: true });
	}
}

test("ensureRovodevSkillsSymlink replaces existing skill directory with relative symlink", async () => {
	await withTempDir(async (tempDir) => {
		const repoRoot = path.join(tempDir, "repo");
		const sharedSkillsDir = path.join(repoRoot, ".agents", "skills");
		const rovodevSkillsDir = path.join(repoRoot, ".rovodev", "skills");

		await fs.mkdir(path.join(sharedSkillsDir, "vpk-tidy"), { recursive: true });
		await fs.mkdir(path.join(rovodevSkillsDir, "old-custom-skill"), { recursive: true });

		const result = await ensureRovodevSkillsSymlink({ repoRoot });

		assert.equal(result.targetSkillsDir, rovodevSkillsDir);
		assert.equal(result.sharedSkillsDir, sharedSkillsDir);
		assert.equal(result.linkTarget, "../.agents/skills");
		assert.equal(await fs.readlink(rovodevSkillsDir), "../.agents/skills");
		assert.deepEqual(
			(await fs.readdir(rovodevSkillsDir)).filter((entry) => entry !== ".DS_Store"),
			["vpk-tidy"],
		);
	});
});

test("parseHermesSkillMarkdown extracts name, description, and body from Hermes frontmatter", () => {
	const parsed = parseHermesSkillMarkdown([
		"---",
		"name: llm-wiki",
		"description: >",
		"  Karpathy's LLM Wiki",
		"  for persistent research notes.",
		"metadata:",
		"  hermes:",
		"    tags: [wiki]",
		"---",
		"",
		"# Heading",
		"",
		"Body",
	].join("\n"));

	assert.equal(parsed.name, "llm-wiki");
	assert.equal(parsed.description, "Karpathy's LLM Wiki for persistent research notes.");
	assert.match(parsed.body, /# Heading/);
});

test("sanitizeHermesSkillMarkdown strips incompatible Hermes metadata and preserves the body", () => {
	const sanitized = sanitizeHermesSkillMarkdown([
		"---",
		"name: p5js",
		"description: \"Creative coding\"",
		"metadata:",
		"  hermes:",
		"    tags: [creative]",
		"---",
		"",
		"# p5.js",
		"",
		"Use this skill.",
	].join("\n"));

	assert.match(sanitized, /^---\nname: "p5js"\ndescription: "Creative coding"\n---/u);
	assert.doesNotMatch(sanitized, /metadata:/u);
	assert.match(sanitized, /# p5\.js/u);
});

test("syncRovodevSkillsOverlay creates sanitized Hermes SKILL.md files and symlinked support files", async () => {
	await withTempDir(async (tempDir) => {
		const hermesSkillsDir = path.join(tempDir, "hermes");
		const targetSkillsDir = path.join(tempDir, "rovodev", "skills");

		await fs.mkdir(path.join(hermesSkillsDir, "research", "llm-wiki", "references"), { recursive: true });
		await fs.writeFile(
			path.join(hermesSkillsDir, "research", "llm-wiki", "SKILL.md"),
			[
				"---",
				"name: llm-wiki",
				"description: \"Karpathy's LLM Wiki\"",
				"metadata:",
				"  hermes:",
				"    tags: [wiki]",
				"---",
				"",
				"# LLM Wiki",
				"",
				"Body",
			].join("\n"),
			"utf8",
		);
		await fs.writeFile(
			path.join(hermesSkillsDir, "research", "llm-wiki", "references", "guide.md"),
			"Guide",
			"utf8",
		);

		const result = await syncRovodevSkillsOverlay({
			hermesSkillsDir,
			targetSkillsDir,
		});

		assert.equal(result.hermesCount, 1);
		assert.equal(result.sharedCount, 0);
		assert.equal(result.totalCount, 1);

		const sanitizedSkill = await fs.readFile(
			path.join(targetSkillsDir, "llm-wiki", "SKILL.md"),
			"utf8",
		);
		assert.match(sanitizedSkill, /name: "llm-wiki"/u);
		assert.doesNotMatch(sanitizedSkill, /metadata:/u);

		const guideLinkTarget = await fs.readlink(
			path.join(targetSkillsDir, "llm-wiki", "references"),
		);
		assert.equal(
			guideLinkTarget,
			path.relative(
				path.join(targetSkillsDir, "llm-wiki"),
				path.join(hermesSkillsDir, "research", "llm-wiki", "references"),
			),
		);
	});
});

test("syncRovodevSkillsOverlay rejects duplicate leaf skill names when flattening", async () => {
	await withTempDir(async (tempDir) => {
		const hermesSkillsDir = path.join(tempDir, "hermes");
		const targetSkillsDir = path.join(tempDir, "rovodev", "skills");

		await fs.mkdir(path.join(hermesSkillsDir, "research", "llm-wiki"), { recursive: true });
		await fs.writeFile(
			path.join(hermesSkillsDir, "research", "llm-wiki", "SKILL.md"),
			"---\nname: llm-wiki\ndescription: \"Research wiki\"\n---\n",
			"utf8",
		);
		await fs.mkdir(path.join(hermesSkillsDir, "notes", "llm-wiki"), { recursive: true });
		await fs.writeFile(
			path.join(hermesSkillsDir, "notes", "llm-wiki", "SKILL.md"),
			"---\nname: llm-wiki\ndescription: \"Notes wiki\"\n---\n",
			"utf8",
		);

		await assert.rejects(
			syncRovodevSkillsOverlay({
				hermesSkillsDir,
				targetSkillsDir,
			}),
			/Duplicate Hermes skill name "llm-wiki"/u,
		);
	});
});
