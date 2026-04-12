const fs = require("node:fs/promises");
const path = require("node:path");

const {
	getHermesHomeDir,
	getHermesSkillsDir,
	getVendoredHermesSkillsDir,
	parseHermesSkillsConfig,
	readHermesConfigText,
	writeHermesSkillConfig,
} = require("./hermes-config");
const { validateSkillBundle } = require("./hermes-skills-hub");

function normalizeSkillCategory(relativePathSegments) {
	if (relativePathSegments.length <= 1) {
		return "local";
	}

	return relativePathSegments.slice(0, -1).join("__");
}

function normalizeSkillName(relativePathSegments) {
	return relativePathSegments[relativePathSegments.length - 1] ?? "unknown";
}

function parseSkillSummary(content) {
	const lines = content.replace(/\r\n?/gu, "\n").split("\n");
	for (const line of lines) {
		const trimmedLine = line.trim();
		if (!trimmedLine || trimmedLine.startsWith("#")) {
			continue;
		}

		return trimmedLine;
	}

	return null;
}

function parseSkillTitle(content, fallbackTitle) {
	const headingMatch = content.match(/^#\s+(.+)$/mu);
	return headingMatch?.[1]?.trim() || fallbackTitle;
}

function buildSkillConfigCandidates(skill) {
	return [
		skill.id,
		skill.name,
		skill.category === "local" ? skill.name : `${skill.category}/${skill.name}`,
	];
}

function isSkillDisabled(skill, config) {
	const candidates = buildSkillConfigCandidates(skill);
	return candidates.some((candidate) =>
		config.disabled.includes(candidate) || config.platformDisabled.includes(candidate),
	);
}

function stripSkillContent(skill) {
	if (!skill || typeof skill !== "object") {
		return skill;
	}

	const nextSkill = { ...skill };
	delete nextSkill.content;
	return nextSkill;
}

function toSkillCategoryPath(category) {
	if (typeof category !== "string" || category.trim().length === 0 || category === "local") {
		return [];
	}

	return category
		.split("__")
		.map((segment) => segment.trim())
		.filter(Boolean);
}

function buildSkillBundleFromInput(input) {
	const name = typeof input?.name === "string" ? input.name.trim() : "";
	const category = typeof input?.category === "string" ? input.category.trim() : "";
	const files = Array.isArray(input?.files)
		? input.files
				.filter((file) => file && typeof file === "object")
				.map((file) => ({
					path: typeof file.path === "string" ? file.path.trim() : "",
					content: typeof file.content === "string" ? file.content : "",
				}))
				.filter((file) => file.path.length > 0)
		: [];

	return {
		name,
		category,
		files,
	};
}

async function walkFiles(currentDirectory, rootDirectory, files) {
	const directoryEntries = await readDirectoryEntries(currentDirectory);

	for (const entry of directoryEntries) {
		if (entry.name.startsWith(".")) {
			continue;
		}

		const entryPath = path.join(currentDirectory, entry.name);
		if (entry.isDirectory()) {
			await walkFiles(entryPath, rootDirectory, files);
			continue;
		}

		if (!entry.isFile()) {
			continue;
		}

		files.push({
			path: path.relative(rootDirectory, entryPath).split(path.sep).join("/"),
			content: await fs.readFile(entryPath, "utf8"),
		});
	}
}

async function readSkillBundleFromDir(skillDir) {
	const files = [];
	await walkFiles(skillDir, skillDir, files);
	return files.sort((left, right) => left.path.localeCompare(right.path));
}

async function writeSkillBundleToDir(skillDir, bundle) {
	const stagingRootDir = await fs.mkdtemp(
		path.join(path.dirname(skillDir), ".tmp-hermes-skill-"),
	);

	try {
		for (const file of bundle.files) {
			const filePath = path.join(stagingRootDir, file.path);
			await fs.mkdir(path.dirname(filePath), { recursive: true });
			await fs.writeFile(filePath, file.content, "utf8");
		}

		await fs.rm(skillDir, { recursive: true, force: true });
		await fs.rename(stagingRootDir, skillDir);
	} catch (error) {
		await fs.rm(stagingRootDir, { recursive: true, force: true }).catch(() => {});
		throw error;
	}
}

async function setSkillDisabledState(skill, enabled) {
	const configText = await readHermesConfigText();
	const skillConfig = parseHermesSkillsConfig(configText);
	const removeCandidates = new Set(buildSkillConfigCandidates(skill));
	const nextDisabled = skillConfig.disabled.filter((candidate) => !removeCandidates.has(candidate));
	const nextPlatformDisabled = skillConfig.platformDisabled.filter(
		(candidate) => !removeCandidates.has(candidate),
	);

	if (!enabled) {
		nextDisabled.push(skill.id);
	}

	await writeHermesSkillConfig({
		disabled: Array.from(new Set(nextDisabled)).sort(),
		platformDisabled: Array.from(new Set(nextPlatformDisabled)).sort(),
	});
}

async function readDirectoryEntries(directoryPath) {
	try {
		return await fs.readdir(directoryPath, { withFileTypes: true });
	} catch (error) {
		if (error && error.code === "ENOENT") {
			return [];
		}

		throw error;
	}
}

async function walkSkillDirectory(baseDirectory, source, currentDirectory, skills) {
	const directoryEntries = await readDirectoryEntries(currentDirectory);
	const skillDocEntry = directoryEntries.find((entry) => entry.isFile() && entry.name === "SKILL.md");

	if (skillDocEntry) {
		const relativeSkillPath = path.relative(baseDirectory, currentDirectory);
		const segments = relativeSkillPath.split(path.sep).filter(Boolean);
		const skillPath = path.join(currentDirectory, "SKILL.md");
		const [skillContent, skillStats] = await Promise.all([
			fs.readFile(skillPath, "utf8"),
			fs.stat(skillPath),
		]);
		const normalizedName = normalizeSkillName(segments);
		const summary = parseSkillSummary(skillContent);
		skills.push({
			category: normalizeSkillCategory(segments),
			content: skillContent,
			description: summary,
			id: segments.join("/"),
			name: normalizedName,
			path: currentDirectory,
			rootDir: baseDirectory,
			slug: normalizedName,
			source,
			summary,
			title: parseSkillTitle(skillContent, normalizedName),
			updatedAt: skillStats.mtime.toISOString(),
		});
		return;
	}

	for (const entry of directoryEntries) {
		if (!entry.isDirectory() || entry.name.startsWith(".")) {
			continue;
		}

		await walkSkillDirectory(
			baseDirectory,
			source,
			path.join(currentDirectory, entry.name),
			skills,
		);
	}
}

async function collectSkills() {
	const homeDir = getHermesHomeDir();
	const skillsRoot = path.join(homeDir, "skills");
	const vendoredSkillsRoot = getVendoredHermesSkillsDir();
	const configText = await readHermesConfigText();
	const skillConfig = parseHermesSkillsConfig(configText);
	const allSkillRoots = [
		{ directory: skillsRoot, source: "local" },
		...skillConfig.externalDirs.map((directory) => ({
			directory,
			source: "external",
		})),
		{ directory: vendoredSkillsRoot, source: "vendored-upstream" },
	];

	const skillsById = new Map();
	for (const skillRoot of allSkillRoots) {
		const discoveredSkills = [];
		await walkSkillDirectory(
			skillRoot.directory,
			skillRoot.source,
			skillRoot.directory,
			discoveredSkills,
		);

		for (const skill of discoveredSkills) {
			if (!skillsById.has(skill.id)) {
				skillsById.set(skill.id, skill);
			}
		}
	}

	return Array.from(skillsById.values())
		.map((skill) => ({
			...skill,
			enabled: !isSkillDisabled(skill, skillConfig),
		}))
		.sort((left, right) =>
			left.category.localeCompare(right.category) || left.title.localeCompare(right.title),
		);
}

async function listHermesSkills({ query } = {}) {
	const skills = await collectSkills();
	const normalizedQuery = typeof query === "string" ? query.trim().toLowerCase() : "";
	if (!normalizedQuery) {
		return skills.map(stripSkillContent);
	}

	return skills
		.filter((skill) =>
			skill.title.toLowerCase().includes(normalizedQuery)
			|| skill.name.toLowerCase().includes(normalizedQuery)
			|| skill.category.toLowerCase().includes(normalizedQuery)
			|| skill.summary?.toLowerCase().includes(normalizedQuery),
		)
		.map(stripSkillContent);
}

async function listHermesSkillRecords(options) {
	return listHermesSkills(options);
}

async function getHermesSkill(category, name) {
	const skills = await collectSkills();
	const skill = skills.find((candidate) =>
		candidate.category === category && candidate.name === name,
	);
	if (!skill) {
		const error = new Error(`Skill ${category}/${name} was not found.`);
		error.code = "ENOENT";
		throw error;
	}

	return skill;
}

async function getHermesSkillRecord(category, name) {
	try {
		return await getHermesSkill(category, name);
	} catch (error) {
		if (error?.code === "ENOENT") {
			return null;
		}
		throw error;
	}
}

async function getHermesSkillBundle(category, name) {
	const skill = await getHermesSkill(category, name);
	return {
		...skill,
		files: await readSkillBundleFromDir(skill.path),
	};
}

async function createHermesSkillFromBundle(input) {
	const bundle = buildSkillBundleFromInput(input);
	const validation = validateSkillBundle(bundle);
	if (!validation.valid) {
		const error = new Error(validation.error);
		error.code = "INVALID_INPUT";
		throw error;
	}

	const categorySegments = toSkillCategoryPath(bundle.category);
	const skillDir = path.join(getHermesSkillsDir(), ...categorySegments, bundle.name);
	try {
		await fs.access(skillDir);
		const error = new Error(`Skill ${bundle.category}/${bundle.name} already exists.`);
		error.code = "EEXIST";
		throw error;
	} catch (error) {
		if (error?.code !== "ENOENT") {
			throw error;
		}
	}

	await fs.mkdir(path.dirname(skillDir), { recursive: true });
	await writeSkillBundleToDir(skillDir, bundle);
	const createdSkill = await getHermesSkill(
		categorySegments.join("__") || "local",
		bundle.name,
	);
	await setSkillDisabledState(createdSkill, true);
	return getHermesSkillBundle(createdSkill.category, createdSkill.name);
}

async function updateHermesSkillFromBundle(input) {
	const bundle = buildSkillBundleFromInput(input);
	const validation = validateSkillBundle(bundle);
	if (!validation.valid) {
		const error = new Error(validation.error);
		error.code = "INVALID_INPUT";
		throw error;
	}

	const existingSkill = await getHermesSkill(bundle.category, bundle.name);
	if (existingSkill.source !== "local") {
		const error = new Error(`Only local Hermes skills can be updated: ${bundle.category}/${bundle.name}`);
		error.code = "INVALID_INPUT";
		throw error;
	}

	await writeSkillBundleToDir(existingSkill.path, bundle);
	return getHermesSkillBundle(existingSkill.category, existingSkill.name);
}

async function archiveHermesSkill(category, name) {
	const existingSkill = await getHermesSkill(category, name);
	if (existingSkill.source !== "local") {
		const error = new Error(`Only local Hermes skills can be archived: ${category}/${name}`);
		error.code = "INVALID_INPUT";
		throw error;
	}

	const archiveTimestamp = new Date().toISOString().replace(/[:.]/gu, "-");
	const archiveRootDir = path.join(
		getHermesHomeDir(),
		"archive",
		"skills",
		archiveTimestamp,
	);
	const archivePath = path.join(
		archiveRootDir,
		...toSkillCategoryPath(existingSkill.category),
		existingSkill.name,
	);
	await fs.mkdir(path.dirname(archivePath), { recursive: true });
	await fs.rename(existingSkill.path, archivePath);
	await setSkillDisabledState(existingSkill, false);
	return {
		...existingSkill,
		archivedPath: archivePath,
	};
}

async function toggleHermesSkill(category, name, enabled) {
	const skill = await getHermesSkill(category, name);
	await setSkillDisabledState(skill, enabled);
	return getHermesSkill(category, name);
}

module.exports = {
	archiveHermesSkill,
	createHermesSkillFromBundle,
	getHermesSkill,
	getHermesSkillBundle,
	getHermesSkillRecord,
	listHermesSkills,
	listHermesSkillRecords,
	toggleHermesSkill,
	updateHermesSkillFromBundle,
};
