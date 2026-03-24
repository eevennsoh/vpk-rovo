const fs = require("node:fs/promises");
const path = require("node:path");

const REGISTRY_FILENAME = "app-registry.json";

/**
 * Creates an app registry manager that tracks generated apps.
 *
 * @param {object} options
 * @param {string} options.baseDir - Directory to store the registry JSON file
 * @param {object} [options.logger] - Logger instance (default: console)
 */
function createAppRegistry({ baseDir, logger = console }) {
	const registryPath = path.join(baseDir, REGISTRY_FILENAME);

	const readRegistry = async () => {
		try {
			const raw = await fs.readFile(registryPath, "utf8");
			const parsed = JSON.parse(raw);
			return Array.isArray(parsed.apps) ? parsed.apps : [];
		} catch (error) {
			if (error && error.code === "ENOENT") {
				return [];
			}
			logger.warn(`[app-registry] Failed to read registry: ${error.message}`);
			return [];
		}
	};

	const writeRegistry = async (apps) => {
		await fs.mkdir(baseDir, { recursive: true });
		await fs.writeFile(
			registryPath,
			JSON.stringify({ apps }, null, "\t") + "\n",
			"utf8",
		);
	};

	/**
	 * List all registered apps.
	 */
	const listApps = async () => {
		return readRegistry();
	};

	/**
	 * Get a single app by slug.
	 */
	const getApp = async (slug) => {
		const apps = await readRegistry();
		return apps.find((app) => app.slug === slug) ?? null;
	};

	/**
	 * Register a new generated app.
	 *
	 * @param {object} entry
	 * @param {string} entry.slug - URL-safe identifier
	 * @param {string} entry.runId - Associated make run ID
	 * @param {string} entry.title - Display name
	 */
	const registerApp = async ({ slug, runId, title }) => {
		const apps = await readRegistry();
		const existing = apps.find((app) => app.slug === slug);
		const entryFile = `app/apps/${slug}/page.tsx`;
		if (existing) {
			existing.runId = runId;
			existing.title = title;
			existing.entryFile = entryFile;
			existing.updatedAt = new Date().toISOString();
		} else {
			apps.push({
				slug,
				runId,
				title,
				createdAt: new Date().toISOString(),
				entryFile,
			});
		}
		await writeRegistry(apps);
		logger.info(`[app-registry] Registered app: ${slug} (run: ${runId})`);
	};

	/**
	 * Unregister an app by slug.
	 */
	const unregisterApp = async (slug) => {
		const apps = await readRegistry();
		const filtered = apps.filter((app) => app.slug !== slug);
		if (filtered.length < apps.length) {
			await writeRegistry(filtered);
			logger.info(`[app-registry] Unregistered app: ${slug}`);
		}
	};

	/**
	 * Unregister all apps, clearing the entire registry.
	 */
	const unregisterAllApps = async () => {
		const apps = await readRegistry();
		if (apps.length > 0) {
			await writeRegistry([]);
			logger.info(`[app-registry] Unregistered all ${apps.length} app(s)`);
		}
		return apps;
	};

	/**
	 * Unregister all apps associated with a given run ID.
	 */
	const unregisterByRunId = async (runId) => {
		const apps = await readRegistry();
		const removed = [];
		const kept = [];
		for (const app of apps) {
			if (app.runId === runId) {
				removed.push(app.slug);
			} else {
				kept.push(app);
			}
		}
		if (removed.length > 0) {
			await writeRegistry(kept);
			logger.info(
				`[app-registry] Unregistered ${removed.length} app(s) for run ${runId}: ${removed.join(", ")}`,
			);
		}
	};

	/**
	 * Derive a URL-safe slug from a title, ensuring uniqueness within the registry.
	 */
	const deriveSlug = async (title) => {
		const base = title
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, "-")
			.replace(/^-+|-+$/g, "")
			|| "app";

		const apps = await readRegistry();
		const existingSlugs = new Set(apps.map((app) => app.slug));

		if (!existingSlugs.has(base)) {
			return base;
		}

		let counter = 2;
		while (existingSlugs.has(`${base}-${counter}`)) {
			counter++;
		}
		return `${base}-${counter}`;
	};

	/**
	 * Update or set forge publish metadata on an app entry.
	 *
	 * @param {string} slug
	 * @param {object} forgeData - Partial forge metadata to merge
	 */
	const updateForgeMetadata = async (slug, forgeData) => {
		const apps = await readRegistry();
		const app = apps.find((a) => a.slug === slug);
		if (!app) {
			throw new Error(`App not found: ${slug}`);
		}
		app.forge = { ...(app.forge || {}), ...forgeData };
		app.updatedAt = new Date().toISOString();
		await writeRegistry(apps);
		logger.info(`[app-registry] Updated forge metadata for: ${slug}`);
		return app;
	};

	/**
	 * Get forge publish metadata for an app by slug.
	 */
	const getForgeMetadata = async (slug) => {
		const app = await getApp(slug);
		return app?.forge ?? null;
	};

	/**
	 * Find the app entry associated with a given run ID.
	 */
	const getAppByRunId = async (runId) => {
		const apps = await readRegistry();
		return apps.find((app) => app.runId === runId) ?? null;
	};

	return {
		listApps,
		getApp,
		getAppByRunId,
		registerApp,
		unregisterApp,
		unregisterAllApps,
		unregisterByRunId,
		updateForgeMetadata,
		getForgeMetadata,
		deriveSlug,
	};
}

module.exports = { createAppRegistry };
