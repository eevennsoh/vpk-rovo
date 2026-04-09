const fs = require("node:fs/promises");
const path = require("node:path");

const {
	getHermesHomeDir,
	parseHermesSkillsConfig,
	readHermesConfigText,
	writeHermesSkillConfig,
} = require("./hermes-config");

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
	const configText = await readHermesConfigText();
	const skillConfig = parseHermesSkillsConfig(configText);
	const allSkillRoots = [
		{ directory: skillsRoot, source: "local" },
		...skillConfig.externalDirs.map((directory) => ({
			directory,
			source: "external",
		})),
	];

	const skills = [];
	for (const skillRoot of allSkillRoots) {
		await walkSkillDirectory(skillRoot.directory, skillRoot.source, skillRoot.directory, skills);
	}

	return skills
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

async function toggleHermesSkill(category, name, enabled) {
	const skill = await getHermesSkill(category, name);
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

	return getHermesSkill(category, name);
}

module.exports = {
	getHermesSkill,
	getHermesSkillRecord,
	listHermesSkills,
	listHermesSkillRecords,
	toggleHermesSkill,
};
