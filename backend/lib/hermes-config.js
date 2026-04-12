const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");

const HERMES_SKILLS_BLOCK_KEY = "skills";

function toNonEmptyString(value) {
	return typeof value === "string" && value.trim().length > 0
		? value.trim()
		: null;
}

function getHermesHomeDir() {
	return toNonEmptyString(process.env.HERMES_HOME)
		?? path.join(os.homedir(), ".hermes");
}

function getHermesConfigPath() {
	return path.join(getHermesHomeDir(), "config.yaml");
}

function getHermesMemoriesDir() {
	return path.join(getHermesHomeDir(), "memories");
}

function getHermesSkillsDir() {
	return path.join(getHermesHomeDir(), "skills");
}

function getVendoredHermesSkillsDir() {
	return toNonEmptyString(process.env.HERMES_VENDOR_SKILLS_DIR)
		?? path.join(__dirname, "..", "..", ".agents", "vendor", "hermes-agent", "skills");
}

function getHermesMemoryPath(target) {
	const targetMap = {
		memory: "MEMORY.md",
		user: "USER.md",
	};
	const filename = targetMap[target];
	if (!filename) {
		const error = new Error(`Unsupported Hermes memory target: ${target}`);
		error.code = "INVALID_TARGET";
		throw error;
	}

	return path.join(getHermesHomeDir(), "memories", filename);
}

function getHermesMemoryLimit(target) {
	const envKey = target === "user" ? "HERMES_USER_MEMORY_LIMIT" : "HERMES_MEMORY_LIMIT";
	const rawLimit = toNonEmptyString(process.env[envKey]);
	if (!rawLimit) {
		return null;
	}

	const parsedLimit = Number.parseInt(rawLimit, 10);
	return Number.isFinite(parsedLimit) && parsedLimit > 0 ? parsedLimit : null;
}

function countIndent(line) {
	const match = line.match(/^\s*/u);
	return match ? match[0].length : 0;
}

function stripYamlQuotes(value) {
	const trimmedValue = value.trim();
	if (
		(trimmedValue.startsWith("\"") && trimmedValue.endsWith("\""))
		|| (trimmedValue.startsWith("'") && trimmedValue.endsWith("'"))
	) {
		return trimmedValue.slice(1, -1);
	}

	return trimmedValue;
}

function parseInlineYamlList(rawValue) {
	const trimmedValue = rawValue.trim();
	if (!trimmedValue.startsWith("[") || !trimmedValue.endsWith("]")) {
		return null;
	}

	const innerValue = trimmedValue.slice(1, -1).trim();
	if (!innerValue) {
		return [];
	}

	return innerValue
		.split(",")
		.map((item) => stripYamlQuotes(item))
		.filter(Boolean);
}

function readYamlList(lines, startIndex, parentIndent) {
	const values = [];
	let index = startIndex;

	for (; index < lines.length; index += 1) {
		const line = lines[index];
		const trimmedLine = line.trim();
		if (!trimmedLine || trimmedLine.startsWith("#")) {
			continue;
		}

		const indent = countIndent(line);
		if (indent <= parentIndent) {
			break;
		}

		if (trimmedLine.startsWith("- ")) {
			values.push(stripYamlQuotes(trimmedLine.slice(2)));
			continue;
		}

		break;
	}

	return values;
}

function findTopLevelBlock(lines, blockKey) {
	for (let index = 0; index < lines.length; index += 1) {
		const line = lines[index];
		if (line.trim() === `${blockKey}:`) {
			return {
				index,
				indent: countIndent(line),
			};
		}
	}

	return null;
}

function findBlockEnd(lines, startIndex, parentIndent) {
	for (let index = startIndex + 1; index < lines.length; index += 1) {
		const line = lines[index];
		const trimmedLine = line.trim();
		if (!trimmedLine || trimmedLine.startsWith("#")) {
			continue;
		}

		if (countIndent(line) <= parentIndent) {
			return index;
		}
	}

	return lines.length;
}

function extractNestedBlockList(lines, blockKey, listKey) {
	const block = findTopLevelBlock(lines, blockKey);
	if (!block) {
		return null;
	}

	const blockEnd = findBlockEnd(lines, block.index, block.indent);
	for (let index = block.index + 1; index < blockEnd; index += 1) {
		const line = lines[index];
		const trimmedLine = line.trim();
		if (!trimmedLine || trimmedLine.startsWith("#")) {
			continue;
		}

		if (countIndent(line) <= block.indent) {
			break;
		}

		if (!trimmedLine.startsWith(`${listKey}:`)) {
			continue;
		}

		const inlineValue = trimmedLine.slice(`${listKey}:`.length).trim();
		if (inlineValue) {
			return parseInlineYamlList(inlineValue) ?? [];
		}

		return readYamlList(lines, index + 1, countIndent(line));
	}

	return null;
}

function extractDottedList(lines, dottedKey) {
	for (let index = 0; index < lines.length; index += 1) {
		const line = lines[index];
		const trimmedLine = line.trim();
		if (!trimmedLine.startsWith(`${dottedKey}:`)) {
			continue;
		}

		const inlineValue = trimmedLine.slice(`${dottedKey}:`.length).trim();
		if (inlineValue) {
			return parseInlineYamlList(inlineValue) ?? [];
		}

		return readYamlList(lines, index + 1, countIndent(line));
	}

	return null;
}

function parseHermesSkillsConfig(rawConfig) {
	const normalizedConfig = typeof rawConfig === "string"
		? rawConfig.replace(/\r\n?/gu, "\n")
		: "";
	const lines = normalizedConfig.split("\n");

	const externalDirs =
		extractNestedBlockList(lines, HERMES_SKILLS_BLOCK_KEY, "external_dirs")
		?? extractDottedList(lines, "skills.external_dirs")
		?? [];
	const disabled =
		extractNestedBlockList(lines, HERMES_SKILLS_BLOCK_KEY, "disabled")
		?? extractDottedList(lines, "skills.disabled")
		?? [];
	const platformDisabled =
		extractNestedBlockList(lines, HERMES_SKILLS_BLOCK_KEY, "platform_disabled")
		?? extractDottedList(lines, "skills.platform_disabled")
		?? [];

	return {
		externalDirs,
		disabled,
		platformDisabled,
	};
}

function quoteYamlString(value) {
	return JSON.stringify(value);
}

function upsertSkillsList(rawConfig, listKey, items) {
	const normalizedConfig = typeof rawConfig === "string"
		? rawConfig.replace(/\r\n?/gu, "\n")
		: "";
	const lines = normalizedConfig.length > 0 ? normalizedConfig.split("\n") : [];
	const block = findTopLevelBlock(lines, HERMES_SKILLS_BLOCK_KEY);

	if (!block) {
		const nextLines = [...lines];
		if (nextLines.length > 0 && nextLines[nextLines.length - 1] !== "") {
			nextLines.push("");
		}
		nextLines.push(`${HERMES_SKILLS_BLOCK_KEY}:`);
		nextLines.push(...formatSkillsListBlock(0, listKey, items));
		return nextLines.join("\n").replace(/\n{3,}/gu, "\n\n").trimEnd() + "\n";
	}

	const blockEnd = findBlockEnd(lines, block.index, block.indent);
	let keyIndex = -1;
	for (let index = block.index + 1; index < blockEnd; index += 1) {
		const line = lines[index];
		const trimmedLine = line.trim();
		if (!trimmedLine || trimmedLine.startsWith("#")) {
			continue;
		}

		if (countIndent(line) <= block.indent) {
			break;
		}

		if (trimmedLine.startsWith(`${listKey}:`)) {
			keyIndex = index;
			break;
		}
	}

	const replacementLines = formatSkillsListBlock(block.indent, listKey, items);
	if (keyIndex === -1) {
		lines.splice(blockEnd, 0, ...replacementLines);
		return lines.join("\n").replace(/\n{3,}/gu, "\n\n").trimEnd() + "\n";
	}

	const keyIndent = countIndent(lines[keyIndex]);
	let removeEnd = keyIndex + 1;
	for (; removeEnd < blockEnd; removeEnd += 1) {
		const line = lines[removeEnd];
		const trimmedLine = line.trim();
		if (!trimmedLine || trimmedLine.startsWith("#")) {
			continue;
		}

		if (countIndent(line) <= keyIndent) {
			break;
		}
	}

	lines.splice(keyIndex, removeEnd - keyIndex, ...replacementLines);
	return lines.join("\n").replace(/\n{3,}/gu, "\n\n").trimEnd() + "\n";
}

function formatSkillsListBlock(baseIndent, listKey, items) {
	const keyPrefix = `${" ".repeat(baseIndent + 2)}${listKey}:`;
	if (items.length === 0) {
		return [`${keyPrefix} []`];
	}

	return [
		keyPrefix,
		...items.map((item) => `${" ".repeat(baseIndent + 4)}- ${quoteYamlString(item)}`),
	];
}

async function readHermesConfigText() {
	try {
		return await fs.readFile(getHermesConfigPath(), "utf8");
	} catch (error) {
		if (error && error.code === "ENOENT") {
			return "";
		}

		throw error;
	}
}

async function writeHermesSkillConfig({
	disabled,
	platformDisabled,
}) {
	const configPath = getHermesConfigPath();
	const existingConfig = await readHermesConfigText();
	let nextConfig = upsertSkillsList(existingConfig, "disabled", disabled);
	nextConfig = upsertSkillsList(nextConfig, "platform_disabled", platformDisabled);
	await fs.mkdir(path.dirname(configPath), { recursive: true });
	await fs.writeFile(configPath, nextConfig, "utf8");
	return nextConfig;
}

module.exports = {
	getHermesConfigPath,
	getHermesHomeDir,
	getHermesMemoryLimit,
	getHermesMemoriesDir,
	getHermesMemoryPath,
	getHermesSkillsDir,
	getVendoredHermesSkillsDir,
	parseHermesSkillsConfig,
	readHermesConfigText,
	upsertSkillsList,
	writeHermesSkillConfig,
};
