const fs = require("node:fs/promises");
const path = require("node:path");

const DEFAULT_UPSTREAM_REPO = "NousResearch/hermes-agent";
const DEFAULT_UPSTREAM_REF = "main";
const SNAPSHOT_METADATA_FILENAME = "snapshot.json";
const BINARY_EXTENSIONS = new Set([
	"pdf",
	"png",
	"jpg",
	"jpeg",
	"gif",
	"webp",
	"ico",
	"zip",
]);

function buildGitHubTreeApiUrl({
	repo = DEFAULT_UPSTREAM_REPO,
	ref = DEFAULT_UPSTREAM_REF,
} = {}) {
	return `https://api.github.com/repos/${repo}/git/trees/${encodeURIComponent(ref)}?recursive=1`;
}

function buildGitHubRawBlobUrl({
	repo = DEFAULT_UPSTREAM_REPO,
	ref = DEFAULT_UPSTREAM_REF,
	filePath,
}) {
	return `https://raw.githubusercontent.com/${repo}/${encodeURIComponent(ref)}/${filePath}`;
}

function getSkillBlobEntries(treePayload) {
	if (!treePayload || typeof treePayload !== "object" || !Array.isArray(treePayload.tree)) {
		throw new Error("GitHub tree payload was missing the tree array.");
	}

	return treePayload.tree.filter((entry) =>
		entry
		&& entry.type === "blob"
		&& typeof entry.path === "string"
		&& entry.path.startsWith("skills/"),
	);
}

function toVendoredSkillRelativePath(upstreamPath) {
	if (typeof upstreamPath !== "string" || upstreamPath.trim().length === 0) {
		throw new Error("Skill path must be a non-empty string.");
	}

	if (path.posix.isAbsolute(upstreamPath)) {
		throw new Error(`Rejected absolute upstream skill path: ${upstreamPath}`);
	}

	const normalizedPath = path.posix.normalize(upstreamPath.trim());
	if (!normalizedPath.startsWith("skills/")) {
		throw new Error(`Rejected non-skills upstream path: ${upstreamPath}`);
	}

	const relativePath = normalizedPath.slice("skills/".length);
	if (!relativePath || relativePath.startsWith("../") || relativePath.includes("/../")) {
		throw new Error(`Rejected path traversal in upstream skill path: ${upstreamPath}`);
	}

	return relativePath;
}

function isBinarySkillFile(upstreamPath) {
	const extension = path.extname(upstreamPath).replace(/^\./u, "").toLowerCase();
	return BINARY_EXTENSIONS.has(extension);
}

function collectSkillIds(skillBlobEntries) {
	return Array.from(
		new Set(
			skillBlobEntries
				.filter((entry) => entry.path.endsWith("/SKILL.md"))
				.map((entry) => toVendoredSkillRelativePath(entry.path).slice(0, -"/SKILL.md".length)),
		),
	).sort();
}

async function writeVendoredHermesSkillsSnapshot({
	treePayload,
	vendorRootDir,
	repo = DEFAULT_UPSTREAM_REPO,
	ref = DEFAULT_UPSTREAM_REF,
	fetchedAt = new Date().toISOString(),
	readTextFile,
	readBinaryFile,
}) {
	if (typeof vendorRootDir !== "string" || vendorRootDir.trim().length === 0) {
		throw new Error("vendorRootDir is required.");
	}

	if (typeof readTextFile !== "function") {
		throw new Error("readTextFile is required.");
	}

	const skillBlobEntries = getSkillBlobEntries(treePayload);
	const skillIds = collectSkillIds(skillBlobEntries);
	const vendorParentDir = path.dirname(vendorRootDir);

	await fs.mkdir(vendorParentDir, { recursive: true });
	const stagingRootDir = await fs.mkdtemp(path.join(vendorParentDir, ".tmp-hermes-agent-"));

	try {
		for (const entry of skillBlobEntries) {
			const relativePath = toVendoredSkillRelativePath(entry.path);
			const targetPath = path.join(stagingRootDir, "skills", relativePath);
			await fs.mkdir(path.dirname(targetPath), { recursive: true });

			if (isBinarySkillFile(entry.path)) {
				if (typeof readBinaryFile !== "function") {
					throw new Error(`readBinaryFile is required for binary skill file ${entry.path}.`);
				}

				const fileBuffer = await readBinaryFile(entry.path, entry);
				await fs.writeFile(targetPath, fileBuffer);
				continue;
			}

			const fileText = await readTextFile(entry.path, entry);
			await fs.writeFile(targetPath, fileText, "utf8");
		}

		const metadata = {
			blobCount: skillBlobEntries.length,
			fetchedAt,
			ref,
			repo,
			skillCount: skillIds.length,
			skillsRoot: "skills",
			sourceTreeSha: typeof treePayload.sha === "string" ? treePayload.sha : null,
			treeUrl: buildGitHubTreeApiUrl({ repo, ref }),
		};
		await fs.writeFile(
			path.join(stagingRootDir, SNAPSHOT_METADATA_FILENAME),
			JSON.stringify(metadata, null, "\t") + "\n",
			"utf8",
		);

		await fs.rm(vendorRootDir, { recursive: true, force: true });
		await fs.rename(stagingRootDir, vendorRootDir);

		return metadata;
	} catch (error) {
		await fs.rm(stagingRootDir, { recursive: true, force: true }).catch(() => {});
		throw error;
	}
}

async function importHermesUpstreamSkills({
	vendorRootDir,
	repo = DEFAULT_UPSTREAM_REPO,
	ref = DEFAULT_UPSTREAM_REF,
	fetchedAt = new Date().toISOString(),
	fetchTree,
	readTextFile,
	readBinaryFile,
}) {
	if (typeof fetchTree !== "function") {
		throw new Error("fetchTree is required.");
	}

	const treePayload = await fetchTree({ repo, ref });
	return writeVendoredHermesSkillsSnapshot({
		treePayload,
		vendorRootDir,
		repo,
		ref,
		fetchedAt,
		readTextFile,
		readBinaryFile,
	});
}

module.exports = {
	BINARY_EXTENSIONS,
	DEFAULT_UPSTREAM_REF,
	DEFAULT_UPSTREAM_REPO,
	SNAPSHOT_METADATA_FILENAME,
	buildGitHubRawBlobUrl,
	buildGitHubTreeApiUrl,
	collectSkillIds,
	getSkillBlobEntries,
	importHermesUpstreamSkills,
	isBinarySkillFile,
	toVendoredSkillRelativePath,
	writeVendoredHermesSkillsSnapshot,
};
