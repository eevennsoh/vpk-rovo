/**
 * Skills Hub client for browsing and installing community skills.
 *
 * Provides a local-first skills installation system:
 * - Validate skill bundles (path traversal protection, required files)
 * - Install skills from bundles to ~/.hermes/skills/{category}/{name}/
 * - List installed hub skills
 *
 * The hub search API (agentskills.io) is stubbed for now and can be
 * connected when the external API is available.
 */

const fs = require("node:fs/promises");
const path = require("node:path");

const DEFAULT_CATEGORY = "community";

/**
 * @typedef {{ path: string, content: string }} BundleFile
 * @typedef {{ name: string, category?: string, description?: string, files: BundleFile[] }} SkillBundle
 * @typedef {{ valid: boolean, error?: string }} ValidationResult
 */

/**
 * Validate a skill bundle for safety and completeness.
 *
 * @param {SkillBundle} bundle
 * @returns {ValidationResult}
 */
function validateSkillBundle(bundle) {
	if (!bundle || typeof bundle !== "object") {
		return { valid: false, error: "Bundle is not an object" };
	}

	if (typeof bundle.name !== "string" || !bundle.name.trim()) {
		return { valid: false, error: "Bundle name is empty" };
	}

	if (!Array.isArray(bundle.files) || bundle.files.length === 0) {
		return { valid: false, error: "Bundle has no files" };
	}

	// Check for path traversal and absolute paths
	for (const file of bundle.files) {
		if (typeof file.path !== "string" || !file.path.trim()) {
			return { valid: false, error: "File has empty path" };
		}

		const normalized = path.normalize(file.path);
		if (normalized.startsWith("..") || normalized.includes("/../") || normalized.includes("\\..\\")) {
			return { valid: false, error: `Rejected path traversal in file: ${file.path}` };
		}

		if (path.isAbsolute(file.path)) {
			return { valid: false, error: `Rejected absolute path in file: ${file.path}` };
		}
	}

	// Must include SKILL.md
	const hasSkillMd = bundle.files.some(
		(f) => path.basename(f.path).toUpperCase() === "SKILL.MD",
	);
	if (!hasSkillMd) {
		return { valid: false, error: "Bundle must include a SKILL.md file" };
	}

	return { valid: true };
}

/**
 * Create a skills hub client.
 *
 * @param {{ skillsDir: string }} options
 */
function createSkillsHubClient({ skillsDir }) {
	/**
	 * Install a skill from a validated bundle.
	 *
	 * @param {SkillBundle} bundle
	 * @returns {Promise<{ installed: boolean, path: string }>}
	 */
	async function installFromBundle(bundle) {
		const validation = validateSkillBundle(bundle);
		if (!validation.valid) {
			throw new Error(validation.error);
		}

		const category = typeof bundle.category === "string" && bundle.category.trim()
			? bundle.category.trim()
			: DEFAULT_CATEGORY;
		const skillDir = path.join(skillsDir, category, bundle.name.trim());

		for (const file of bundle.files) {
			const filePath = path.join(skillDir, file.path);
			await fs.mkdir(path.dirname(filePath), { recursive: true });
			await fs.writeFile(filePath, file.content, "utf8");
		}

		return {
			installed: true,
			path: skillDir,
			name: bundle.name.trim(),
			category,
		};
	}

	/**
	 * List skills installed via the hub.
	 *
	 * @returns {Promise<Array<{ name: string, category: string, path: string }>>}
	 */
	async function listInstalled() {
		const results = [];

		let categories;
		try {
			categories = await fs.readdir(skillsDir);
		} catch (error) {
			if (error && error.code === "ENOENT") {
				return [];
			}
			throw error;
		}

		for (const category of categories) {
			const categoryDir = path.join(skillsDir, category);
			let stat;
			try {
				stat = await fs.stat(categoryDir);
			} catch {
				continue;
			}
			if (!stat.isDirectory()) {
				continue;
			}

			let skills;
			try {
				skills = await fs.readdir(categoryDir);
			} catch {
				continue;
			}

			for (const skillName of skills) {
				const skillDir = path.join(categoryDir, skillName);
				const skillMdPath = path.join(skillDir, "SKILL.md");
				try {
					await fs.access(skillMdPath);
					results.push({
						name: skillName,
						category,
						path: skillDir,
					});
				} catch {
					// Not a valid skill directory
				}
			}
		}

		return results;
	}

	/**
	 * Search the skills hub (stub — returns empty until external API connected).
	 *
	 * @param {string} _query
	 * @returns {Promise<Array<{ name: string, description: string, category: string }>>}
	 */
	async function search(_query) {
		// Stub: will connect to agentskills.io when API is available
		return [];
	}

	return {
		installFromBundle,
		listInstalled,
		search,
	};
}

module.exports = {
	createSkillsHubClient,
	validateSkillBundle,
};
