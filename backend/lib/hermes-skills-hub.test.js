const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const {
	createSkillsHubClient,
	validateSkillBundle,
} = require("./hermes-skills-hub");

async function withTempDir(fn) {
	const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "vpk-skills-hub-"));
	try {
		await fn(tmpDir);
	} finally {
		await fs.rm(tmpDir, { recursive: true, force: true });
	}
}

test("validateSkillBundle rejects path traversal", () => {
	const result = validateSkillBundle({
		name: "evil-skill",
		files: [
			{ path: "../../../etc/passwd", content: "root:x:0:0" },
		],
	});
	assert.equal(result.valid, false);
	assert.ok(result.error.includes("path traversal"));
});

test("validateSkillBundle rejects absolute paths", () => {
	const result = validateSkillBundle({
		name: "evil-skill",
		files: [
			{ path: "/etc/passwd", content: "root:x:0:0" },
		],
	});
	assert.equal(result.valid, false);
	assert.ok(result.error.includes("absolute path"));
});

test("validateSkillBundle accepts valid bundle", () => {
	const result = validateSkillBundle({
		name: "good-skill",
		files: [
			{ path: "SKILL.md", content: "# Good Skill\n\nDoes good things." },
		],
	});
	assert.equal(result.valid, true);
});

test("validateSkillBundle requires SKILL.md", () => {
	const result = validateSkillBundle({
		name: "no-skill-md",
		files: [
			{ path: "README.md", content: "# Not a skill file" },
		],
	});
	assert.equal(result.valid, false);
	assert.ok(result.error.includes("SKILL.md"));
});

test("validateSkillBundle rejects empty name", () => {
	const result = validateSkillBundle({
		name: "",
		files: [
			{ path: "SKILL.md", content: "# Skill" },
		],
	});
	assert.equal(result.valid, false);
});

test("createSkillsHubClient.installFromBundle writes files", async () => {
	await withTempDir(async (dir) => {
		const client = createSkillsHubClient({ skillsDir: dir });
		const bundle = {
			name: "test-skill",
			category: "general",
			files: [
				{ path: "SKILL.md", content: "# Test Skill\n\nTest description." },
				{ path: "references/guide.md", content: "# Guide\n\nDetails." },
			],
		};

		const result = await client.installFromBundle(bundle);
		assert.equal(result.installed, true);
		assert.ok(result.path.includes("test-skill"));

		const skillContent = await fs.readFile(
			path.join(dir, "general", "test-skill", "SKILL.md"),
			"utf8",
		);
		assert.ok(skillContent.includes("# Test Skill"));

		const guideContent = await fs.readFile(
			path.join(dir, "general", "test-skill", "references", "guide.md"),
			"utf8",
		);
		assert.ok(guideContent.includes("# Guide"));
	});
});

test("createSkillsHubClient.installFromBundle rejects invalid bundle", async () => {
	await withTempDir(async (dir) => {
		const client = createSkillsHubClient({ skillsDir: dir });
		const bundle = {
			name: "bad-skill",
			files: [
				{ path: "../escape.txt", content: "escaped" },
			],
		};

		try {
			await client.installFromBundle(bundle);
			assert.fail("Should have thrown");
		} catch (error) {
			assert.ok(error.message.includes("path traversal"));
		}
	});
});

test("createSkillsHubClient.installFromBundle uses default category", async () => {
	await withTempDir(async (dir) => {
		const client = createSkillsHubClient({ skillsDir: dir });
		const bundle = {
			name: "no-category-skill",
			files: [
				{ path: "SKILL.md", content: "# Skill\n\nDescription." },
			],
		};

		const result = await client.installFromBundle(bundle);
		assert.ok(result.path.includes("community"));
	});
});

test("createSkillsHubClient.listInstalled returns installed skills", async () => {
	await withTempDir(async (dir) => {
		const client = createSkillsHubClient({ skillsDir: dir });
		await client.installFromBundle({
			name: "skill-a",
			category: "tools",
			files: [{ path: "SKILL.md", content: "# Skill A" }],
		});
		await client.installFromBundle({
			name: "skill-b",
			category: "tools",
			files: [{ path: "SKILL.md", content: "# Skill B" }],
		});

		const installed = await client.listInstalled();
		assert.equal(installed.length, 2);
		assert.ok(installed.some((s) => s.name === "skill-a"));
		assert.ok(installed.some((s) => s.name === "skill-b"));
	});
});
