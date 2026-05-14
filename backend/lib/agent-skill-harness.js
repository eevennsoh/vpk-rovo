const fs = require("node:fs/promises");
const path = require("node:path");
const { execFile } = require("node:child_process");

const DEFAULT_REPO_ROOT = path.resolve(__dirname, "..", "..");
const DEFAULT_SCRIPT_TIMEOUT_MS = 30_000;
const DEFAULT_SCRIPT_MAX_BUFFER_BYTES = 4 * 1024 * 1024;

const DEFAULT_ALLOWED_SCRIPTS = [
	{
		scriptPath: "scripts/build.mjs",
		argsPrefix: ["--check-placeholders"],
	},
	{
		scriptPath: "scripts/build.mjs",
		argsPrefix: ["--verify"],
	},
	{
		scriptPath: "scripts/check-html.mjs",
		argsPrefix: [],
	},
];

function normalizeRelativePath(relativePath) {
	if (typeof relativePath !== "string" || relativePath.trim().length === 0) {
		throw new Error("Agent Skill path must be a non-empty relative path.");
	}

	const normalized = relativePath.trim().replace(/\\/gu, "/");
	if (path.isAbsolute(normalized)) {
		throw new Error("Agent Skill paths must be relative to the skill root.");
	}

	return normalized;
}

function toPortablePath(filePath) {
	return filePath.split(path.sep).join("/");
}

function parseScalarFrontmatterValue(rawValue) {
	const value = rawValue.trim();
	const quotedMatch = value.match(/^(['"])([\s\S]*)\1$/u);
	return quotedMatch ? quotedMatch[2] : value;
}

function parseSkillFrontmatter(skillMarkdown) {
	if (typeof skillMarkdown !== "string" || !skillMarkdown.startsWith("---\n")) {
		return {
			body: skillMarkdown || "",
			metadata: {},
		};
	}

	const endIndex = skillMarkdown.indexOf("\n---", 4);
	if (endIndex === -1) {
		return {
			body: skillMarkdown,
			metadata: {},
		};
	}

	const frontmatter = skillMarkdown.slice(4, endIndex).trim();
	const body = skillMarkdown.slice(endIndex + "\n---".length).replace(/^\r?\n/u, "");
	const metadata = {};
	let currentMapKey = null;

	for (const line of frontmatter.split(/\r?\n/u)) {
		if (!line.trim()) {
			continue;
		}

		const nestedMatch = line.match(/^\s{2,}([A-Za-z0-9_-]+):\s*(.*)$/u);
		if (nestedMatch && currentMapKey) {
			metadata[currentMapKey] = {
				...(metadata[currentMapKey] && typeof metadata[currentMapKey] === "object"
					? metadata[currentMapKey]
					: {}),
				[nestedMatch[1]]: parseScalarFrontmatterValue(nestedMatch[2]),
			};
			continue;
		}

		const match = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/u);
		if (!match) {
			currentMapKey = null;
			continue;
		}

		const [, key, rawValue] = match;
		if (rawValue.trim().length === 0) {
			metadata[key] = {};
			currentMapKey = key;
			continue;
		}

		metadata[key] = parseScalarFrontmatterValue(rawValue);
		currentMapKey = null;
	}

	return {
		body,
		metadata,
	};
}

function isInsideDirectory(rootDir, targetPath) {
	const relative = path.relative(rootDir, targetPath);
	return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

function normalizeAllowedScripts(allowedScripts) {
	return (Array.isArray(allowedScripts) && allowedScripts.length > 0
		? allowedScripts
		: DEFAULT_ALLOWED_SCRIPTS
	).map((entry) => ({
		scriptPath: normalizeRelativePath(entry.scriptPath),
		argsPrefix: Array.isArray(entry.argsPrefix)
			? entry.argsPrefix.map((arg) => String(arg))
			: [],
	}));
}

function isAllowedScriptInvocation({
	args,
	allowedScripts,
	scriptPath,
}) {
	const normalizedArgs = Array.isArray(args) ? args.map((arg) => String(arg)) : [];
	return allowedScripts.some((entry) => {
		if (entry.scriptPath !== scriptPath) {
			return false;
		}

		if (normalizedArgs.length < entry.argsPrefix.length) {
			return false;
		}

		return entry.argsPrefix.every((arg, index) => normalizedArgs[index] === arg);
	});
}

function createRepoAgentSkillHarness({
	allowedScripts = DEFAULT_ALLOWED_SCRIPTS,
	repoRoot = DEFAULT_REPO_ROOT,
	skillsRoot = path.join(repoRoot, ".agents", "skills"),
} = {}) {
	const resolvedRepoRoot = path.resolve(repoRoot);
	const resolvedSkillsRoot = path.resolve(skillsRoot);
	const normalizedAllowedScripts = normalizeAllowedScripts(allowedScripts);

	function getSkillRoot(skillName) {
		const normalizedSkillName = normalizeRelativePath(skillName);
		const skillRoot = path.resolve(resolvedSkillsRoot, normalizedSkillName);
		if (!isInsideDirectory(resolvedSkillsRoot, skillRoot)) {
			throw new Error(`Agent Skill path escapes the skills root: ${skillName}`);
		}
		return skillRoot;
	}

	function resolveSkillPath(skillName, relativePath) {
		const skillRoot = getSkillRoot(skillName);
		const normalizedPath = normalizeRelativePath(relativePath);
		const targetPath = path.resolve(skillRoot, normalizedPath);
		if (!isInsideDirectory(skillRoot, targetPath)) {
			throw new Error(`Agent Skill file path escapes the skill root: ${relativePath}`);
		}
		return targetPath;
	}

	async function loadSkill(skillName) {
		const skillRoot = getSkillRoot(skillName);
		const skillPath = path.join(skillRoot, "SKILL.md");
		const content = await fs.readFile(skillPath, "utf8");
		const { body, metadata } = parseSkillFrontmatter(content);

		return {
			body,
			content,
			description: typeof metadata.description === "string" ? metadata.description : "",
			metadata,
			name: typeof metadata.name === "string" ? metadata.name : path.basename(skillRoot),
			skillPath,
			skillRoot,
		};
	}

	async function loadSkillMetadata(skillName) {
		const skill = await loadSkill(skillName);
		return {
			description: skill.description,
			metadata: skill.metadata,
			name: skill.name,
			skillPath: skill.skillPath,
			skillRoot: skill.skillRoot,
		};
	}

	async function readSkillFile(skillName, relativePath) {
		return fs.readFile(resolveSkillPath(skillName, relativePath), "utf8");
	}

	async function runSkillScript(skillName, scriptPath, args = [], options = {}) {
		const normalizedScriptPath = normalizeRelativePath(scriptPath);
		const normalizedArgs = Array.isArray(args) ? args.map((arg) => String(arg)) : [];
		if (!isAllowedScriptInvocation({
			args: normalizedArgs,
			allowedScripts: normalizedAllowedScripts,
			scriptPath: normalizedScriptPath,
		})) {
			throw new Error(`Agent Skill script is not allowlisted: ${normalizedScriptPath} ${normalizedArgs.join(" ")}`.trim());
		}

		const absoluteScriptPath = resolveSkillPath(skillName, normalizedScriptPath);
		const cwd = typeof options.cwd === "string" && options.cwd.trim().length > 0
			? path.resolve(options.cwd)
			: resolvedRepoRoot;

		return new Promise((resolve, reject) => {
			execFile(
				process.execPath,
				[absoluteScriptPath, ...normalizedArgs],
				{
					cwd,
					env: {
						...process.env,
						...(options.env && typeof options.env === "object" ? options.env : {}),
					},
					maxBuffer: options.maxBuffer || DEFAULT_SCRIPT_MAX_BUFFER_BYTES,
					signal: options.signal,
					timeout: options.timeoutMs || DEFAULT_SCRIPT_TIMEOUT_MS,
				},
				(error, stdout, stderr) => {
					if (error) {
						error.stdout = stdout;
						error.stderr = stderr;
						reject(error);
						return;
					}

					resolve({
						ok: true,
						scriptPath: toPortablePath(path.relative(getSkillRoot(skillName), absoluteScriptPath)),
						stdout,
						stderr,
					});
				},
			);
		});
	}

	return {
		loadSkill,
		loadSkillMetadata,
		readSkillFile,
		repoRoot: resolvedRepoRoot,
		resolveSkillPath,
		runSkillScript,
		skillsRoot: resolvedSkillsRoot,
	};
}

module.exports = {
	DEFAULT_ALLOWED_SCRIPTS,
	createRepoAgentSkillHarness,
	parseSkillFrontmatter,
};
