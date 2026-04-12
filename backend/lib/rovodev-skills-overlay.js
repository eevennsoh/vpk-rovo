const fs = require("node:fs/promises");
const path = require("node:path");

async function walkHermesSkillDirectories(rootDir, currentDir = rootDir) {
	let entries;
	try {
		entries = await fs.readdir(currentDir, { withFileTypes: true });
	} catch (error) {
		if (error && error.code === "ENOENT") {
			return [];
		}
		throw error;
	}

	const hasSkillMarkdown = entries.some((entry) => entry.isFile() && entry.name === "SKILL.md");

	if (hasSkillMarkdown) {
		const relativePath = path.relative(rootDir, currentDir);
		const targetSegments = relativePath.split(path.sep).filter(Boolean);
		return [
			{
				sourcePath: currentDir,
				targetSegments,
			},
		];
	}

	const collected = [];
	for (const entry of entries) {
		if (!entry.isDirectory()) {
			continue;
		}

		collected.push(
			...(await walkHermesSkillDirectories(rootDir, path.join(currentDir, entry.name))),
		);
	}

	return collected.sort((left, right) =>
		left.targetSegments.join("/").localeCompare(right.targetSegments.join("/")),
	);
}

function stripWrappingQuotes(value) {
	const trimmedValue = value.trim();
	if (
		(trimmedValue.startsWith("\"") && trimmedValue.endsWith("\""))
		|| (trimmedValue.startsWith("'") && trimmedValue.endsWith("'"))
	) {
		return trimmedValue.slice(1, -1);
	}

	return trimmedValue;
}

function parseHermesSkillMarkdown(markdown) {
	const normalized = typeof markdown === "string" ? markdown.replace(/\r\n?/gu, "\n") : "";
	if (!normalized.startsWith("---\n")) {
		return {
			body: normalized,
			description: null,
			name: null,
		};
	}

	const lines = normalized.split("\n");
	let delimiterIndex = -1;
	for (let index = 1; index < lines.length; index += 1) {
		if (lines[index].trim() === "---") {
			delimiterIndex = index;
			break;
		}
	}

	if (delimiterIndex === -1) {
		return {
			body: normalized,
			description: null,
			name: null,
		};
	}

	const frontmatterLines = lines.slice(1, delimiterIndex);
	const body = lines.slice(delimiterIndex + 1).join("\n");
	let name = null;
	let description = null;

	for (let index = 0; index < frontmatterLines.length; index += 1) {
		const line = frontmatterLines[index];

		if (line.startsWith("name:")) {
			name = stripWrappingQuotes(line.slice("name:".length));
			continue;
		}

		if (line.startsWith("description:")) {
			const inlineValue = line.slice("description:".length).trim();
			if (inlineValue && inlineValue !== ">" && inlineValue !== "|") {
				description = stripWrappingQuotes(inlineValue);
				continue;
			}

			const foldedLines = [];
			for (let nextIndex = index + 1; nextIndex < frontmatterLines.length; nextIndex += 1) {
				const nextLine = frontmatterLines[nextIndex];
				if (/^\S/u.test(nextLine)) {
					break;
				}
				foldedLines.push(nextLine.trim());
				index = nextIndex;
			}
			description = foldedLines.join(" ").trim();
		}
	}

	return {
		body,
		description: description && description.length > 0 ? description : null,
		name: name && name.length > 0 ? name : null,
	};
}

function sanitizeHermesSkillMarkdown(markdown) {
	const parsed = parseHermesSkillMarkdown(markdown);
	if (!parsed.name || !parsed.description) {
		throw new Error("Hermes skill markdown must include frontmatter `name` and `description`.");
	}

	const body = parsed.body.replace(/^\n+/u, "");
	return [
		"---",
		`name: ${JSON.stringify(parsed.name)}`,
		`description: ${JSON.stringify(parsed.description)}`,
		"---",
		"",
		body,
	].join("\n");
}

async function syncRovodevSkillsOverlay({
	hermesSkillsDir,
	targetSkillsDir,
}) {
	if (!hermesSkillsDir || !targetSkillsDir) {
		throw new Error("hermesSkillsDir and targetSkillsDir are required.");
	}

	const hermesSkillEntries = await walkHermesSkillDirectories(hermesSkillsDir);
	const targetEntryNames = new Map();

	for (const entry of hermesSkillEntries) {
		const targetName = entry.targetSegments[entry.targetSegments.length - 1];
		if (!targetName) {
			throw new Error(`Unable to derive a target skill name for ${entry.sourcePath}.`);
		}

		const existingEntry = targetEntryNames.get(targetName);
		if (existingEntry) {
			throw new Error(
				[
					`Duplicate Hermes skill name "${targetName}" cannot be flattened into .rovodev/skills.`,
					`Conflicting skills: ${existingEntry.targetSegments.join("/")} and ${entry.targetSegments.join("/")}.`,
				].join(" "),
			);
		}

		targetEntryNames.set(targetName, entry);
	}

	await fs.rm(targetSkillsDir, { recursive: true, force: true });
	await fs.mkdir(targetSkillsDir, { recursive: true });

	for (const entry of hermesSkillEntries) {
		const sourceSkillDir = entry.sourcePath;
		const targetSkillName = entry.targetSegments[entry.targetSegments.length - 1];
		const targetSkillDir = path.join(targetSkillsDir, targetSkillName);
		await fs.mkdir(targetSkillDir, { recursive: true });

		const skillMarkdown = await fs.readFile(path.join(sourceSkillDir, "SKILL.md"), "utf8");
		await fs.writeFile(
			path.join(targetSkillDir, "SKILL.md"),
			sanitizeHermesSkillMarkdown(skillMarkdown),
			"utf8",
		);

		const childEntries = await fs.readdir(sourceSkillDir, { withFileTypes: true });
		for (const childEntry of childEntries) {
			if (childEntry.name === "SKILL.md") {
				continue;
			}

			const sourceChildPath = path.join(sourceSkillDir, childEntry.name);
			const targetChildPath = path.join(targetSkillDir, childEntry.name);
			const relativeSourcePath = path.relative(path.dirname(targetChildPath), sourceChildPath);
			await fs.symlink(relativeSourcePath, targetChildPath, childEntry.isDirectory() ? "dir" : "file");
		}
	}

	return {
		entries: hermesSkillEntries,
		hermesCount: hermesSkillEntries.length,
		sharedCount: 0,
		targetSkillsDir,
		totalCount: hermesSkillEntries.length,
	};
}

module.exports = {
	parseHermesSkillMarkdown,
	sanitizeHermesSkillMarkdown,
	syncRovodevSkillsOverlay,
	walkHermesSkillDirectories,
};
