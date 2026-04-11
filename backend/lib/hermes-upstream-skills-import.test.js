const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const {
	SNAPSHOT_METADATA_FILENAME,
	writeVendoredHermesSkillsSnapshot,
} = require("./hermes-upstream-skills-import");

async function withTempDir(fn) {
	const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "vpk-hermes-upstream-"));

	try {
		await fn(tempDir);
	} finally {
		await fs.rm(tempDir, { force: true, recursive: true });
	}
}

test("writeVendoredHermesSkillsSnapshot imports every upstream skill blob and preserves nested files", async () => {
	await withTempDir(async (tempDir) => {
		const vendorRootDir = path.join(tempDir, "vendor", "hermes-agent");
		const treePayload = {
			sha: "tree-sha-1",
			tree: [
				{ path: "skills/creative/p5js/SKILL.md", type: "blob", url: "blob://p5-skill" },
				{ path: "skills/creative/p5js/references/guide.md", type: "blob", url: "blob://p5-guide" },
				{ path: "skills/research/llm-wiki/SKILL.md", type: "blob", url: "blob://wiki-skill" },
				{ path: "skills/research/llm-wiki/assets/reference.pdf", type: "blob", url: "blob://wiki-pdf" },
			],
		};
		const textByPath = new Map([
			["skills/creative/p5js/SKILL.md", "# p5js\n\nCreative coding skill."],
			["skills/creative/p5js/references/guide.md", "Use p5.js for sketches."],
			["skills/research/llm-wiki/SKILL.md", "# LLM Wiki\n\nPersistent wiki skill."],
		]);
		const binaryByPath = new Map([
			["skills/research/llm-wiki/assets/reference.pdf", Buffer.from("%PDF-1.4\nfake pdf\n", "utf8")],
		]);

		const metadata = await writeVendoredHermesSkillsSnapshot({
			readBinaryFile: async (upstreamPath) => binaryByPath.get(upstreamPath),
			readTextFile: async (upstreamPath) => textByPath.get(upstreamPath),
			ref: "main",
			repo: "NousResearch/hermes-agent",
			treePayload,
			vendorRootDir,
		});

		assert.equal(metadata.skillCount, 2);
		assert.equal(metadata.blobCount, 4);
		assert.equal(metadata.sourceTreeSha, "tree-sha-1");

		assert.equal(
			await fs.readFile(path.join(vendorRootDir, "skills", "creative", "p5js", "SKILL.md"), "utf8"),
			textByPath.get("skills/creative/p5js/SKILL.md"),
		);
		assert.equal(
			await fs.readFile(path.join(vendorRootDir, "skills", "creative", "p5js", "references", "guide.md"), "utf8"),
			textByPath.get("skills/creative/p5js/references/guide.md"),
		);
		assert.deepEqual(
			await fs.readFile(path.join(vendorRootDir, "skills", "research", "llm-wiki", "assets", "reference.pdf")),
			binaryByPath.get("skills/research/llm-wiki/assets/reference.pdf"),
		);

		const metadataPayload = JSON.parse(
			await fs.readFile(path.join(vendorRootDir, SNAPSHOT_METADATA_FILENAME), "utf8"),
		);
		assert.equal(metadataPayload.skillCount, 2);
		assert.equal(metadataPayload.blobCount, 4);
	});
});

test("writeVendoredHermesSkillsSnapshot replaces stale vendored content on rerun", async () => {
	await withTempDir(async (tempDir) => {
		const vendorRootDir = path.join(tempDir, "vendor", "hermes-agent");

		await writeVendoredHermesSkillsSnapshot({
			readTextFile: async (upstreamPath) => `first:${upstreamPath}`,
			treePayload: {
				sha: "tree-sha-old",
				tree: [
					{ path: "skills/creative/p5js/SKILL.md", type: "blob", url: "blob://old" },
				],
			},
			vendorRootDir,
		});

		await writeVendoredHermesSkillsSnapshot({
			readTextFile: async (upstreamPath) => `second:${upstreamPath}`,
			treePayload: {
				sha: "tree-sha-new",
				tree: [
					{ path: "skills/research/llm-wiki/SKILL.md", type: "blob", url: "blob://new" },
				],
			},
			vendorRootDir,
		});

		await assert.rejects(
			() => fs.readFile(path.join(vendorRootDir, "skills", "creative", "p5js", "SKILL.md"), "utf8"),
			{ code: "ENOENT" },
		);
		assert.equal(
			await fs.readFile(path.join(vendorRootDir, "skills", "research", "llm-wiki", "SKILL.md"), "utf8"),
			"second:skills/research/llm-wiki/SKILL.md",
		);
	});
});

test("writeVendoredHermesSkillsSnapshot rejects malformed upstream skill paths", async () => {
	await withTempDir(async (tempDir) => {
		await assert.rejects(
			() =>
				writeVendoredHermesSkillsSnapshot({
					readTextFile: async () => "bad",
					treePayload: {
						sha: "tree-sha-bad",
						tree: [
							{ path: "skills/../escape/SKILL.md", type: "blob", url: "blob://bad" },
						],
					},
					vendorRootDir: path.join(tempDir, "vendor", "hermes-agent"),
				}),
			/(path traversal|non-skills upstream path)/i,
		);
	});
});
