const { spawn } = require("node:child_process");
const path = require("node:path");
const fs = require("node:fs/promises");
const { readFileSync } = require("node:fs");

/** VPK project root (two levels up from backend/make/) */
const VPK_ROOT = path.resolve(__dirname, "..", "..");

/**
 * Strip ANSI escape codes from a string.
 */
function stripAnsi(text) {
	// biome-ignore lint: ANSI escape sequence pattern
	return text.replace(/\x1B\[[0-9;]*[A-Za-z]/g, "").replace(/\x1B\].*?\x07/g, "");
}

/**
 * Clean up script output for display: strip ANSI codes and collapse whitespace.
 */
function cleanScriptOutput(text) {
	return stripAnsi(text).replace(/\n{3,}/g, "\n\n").trim();
}

/**
 * Check if Forge CLI is available.
 */
async function isForgeAvailable() {
	return new Promise((resolve) => {
		const proc = spawn("forge", ["--version"], {
			stdio: ["pipe", "pipe", "pipe"],
			timeout: 10_000,
		});
		proc.on("error", () => resolve(false));
		proc.on("close", (exitCode) => resolve(exitCode === 0));
	});
}

/**
 * Run `forge create` directly as a child process.
 */
function runForgeCreate({ template, appName, devSpaceId, cwd, timeoutMs = 60_000 }) {
	return new Promise((resolve, reject) => {
		const args = [
			"create",
			"--template", template,
			appName,
			"--developer-space-id", devSpaceId,
			"--accept-terms",
		];

		const proc = spawn("forge", args, {
			cwd,
			timeout: timeoutMs,
			stdio: ["pipe", "pipe", "pipe"],
		});

		let stdout = "";
		let stderr = "";

		proc.stdout.on("data", (chunk) => {
			stdout += chunk.toString();
		});
		proc.stderr.on("data", (chunk) => {
			stderr += chunk.toString();
		});

		proc.on("error", (err) => reject(err));
		proc.on("close", (code) => {
			resolve({ code: code ?? 1, stdout, stderr });
		});
	});
}

/**
 * Run a forge CLI command as a child process.
 */
function runForgeCommand(args, { cwd, timeoutMs = 120_000 } = {}) {
	return new Promise((resolve, reject) => {
		const proc = spawn("forge", args, {
			cwd,
			timeout: timeoutMs,
			stdio: ["pipe", "pipe", "pipe"],
		});

		let stdout = "";
		let stderr = "";

		proc.stdout.on("data", (chunk) => {
			stdout += chunk.toString();
		});
		proc.stderr.on("data", (chunk) => {
			stderr += chunk.toString();
		});

		proc.on("error", (err) => reject(err));
		proc.on("close", (code) => {
			resolve({ code: code ?? 1, stdout, stderr });
		});
	});
}

/**
 * Run a Python script as a child process and collect its output.
 */
function runPythonScript(moduleName, args = [], { cwd, timeoutMs = 120_000 } = {}) {
	const skillDir = path.resolve(
		VPK_ROOT, ".cursor", "skills", "vpk-forge",
	);
	return new Promise((resolve, reject) => {
		const proc = spawn("python3", ["-m", moduleName, ...args], {
			cwd: cwd ?? skillDir,
			timeout: timeoutMs,
			stdio: ["pipe", "pipe", "pipe"],
		});

		let stdout = "";
		let stderr = "";

		proc.stdout.on("data", (chunk) => {
			stdout += chunk.toString();
		});
		proc.stderr.on("data", (chunk) => {
			stderr += chunk.toString();
		});

		proc.on("error", (err) => reject(err));
		proc.on("close", (code) => {
			resolve({ code: code ?? 1, stdout, stderr });
		});
	});
}

/**
 * Discover available Atlassian sites by running `forge settings list`.
 */
async function discoverSites() {
	return new Promise((resolve) => {
		const proc = spawn("forge", ["settings", "list"], {
			stdio: ["pipe", "pipe", "pipe"],
			timeout: 15_000,
		});

		let stdout = "";
		proc.stdout.on("data", (chunk) => {
			stdout += chunk.toString();
		});

		proc.on("error", () => resolve([]));
		proc.on("close", (code) => {
			if (code !== 0) {
				resolve([]);
				return;
			}

			const sites = [];
			const sitePattern = /https?:\/\/[^\s]+\.atlassian\.net/g;
			const matches = stdout.match(sitePattern);
			if (matches) {
				for (const url of [...new Set(matches)]) {
					sites.push({ siteUrl: url, products: ["jira", "confluence"] });
				}
			}
			resolve(sites);
		});
	});
}

/**
 * Discover available developer spaces.
 */
async function discoverDevSpaces() {
	try {
		const result = await runPythonScript(
			"scripts.get_dev_spaces",
			[],
			{ timeoutMs: 30_000 },
		);

		if (result.code !== 0) {
			return [];
		}

		const jsonMatch = result.stdout.match(/JSON Output:\s*([\s\S]*?)(?:\n\nFor scripting:|$)/);
		if (jsonMatch?.[1]) {
			try {
				const spaces = JSON.parse(jsonMatch[1].trim());
				if (Array.isArray(spaces)) {
					return spaces;
				}
			} catch {
				// Fall through
			}
		}

		return [];
	} catch {
		return [];
	}
}

// ---------------------------------------------------------------------------
// Build pipeline — bundle VPK component into a standalone Forge Custom UI app
// ---------------------------------------------------------------------------

/**
 * Build the generated VPK component into static files for Forge Custom UI.
 *
 * Produces: static/default/index.html, app.js, app.css
 */
async function buildForgeApp(slug, forgeAppDir, logger = console) {
	const esbuild = require("esbuild");

	const sourceDir = path.resolve(VPK_ROOT, "app", "apps", slug);
	const outputDir = path.join(forgeAppDir, "static", "default");

	await fs.mkdir(outputDir, { recursive: true });

	// 1. Create React entry point that renders the page component
	const entryContent = [
		`import { view } from "@forge/bridge";`,
		`import { createRoot } from "react-dom/client";`,
		`import Page from ${JSON.stringify(sourceDir.replace(/\\/g, "/") + "/page")};`,
		``,
		`view.theme.enable();`,
		``,
		`const root = createRoot(document.getElementById("root"));`,
		`root.render(<Page />);`,
	].join("\n");

	const entryFile = path.join(forgeAppDir, "_entry.tsx");
	await fs.writeFile(entryFile, entryContent, "utf-8");

	// 2. esbuild plugin to resolve @/ alias to VPK root.
	//    We rewrite the import to a relative path and let esbuild re-resolve it
	//    so that resolveExtensions (e.g. .tsx, .ts) are applied automatically.
	const aliasPlugin = {
		name: "vpk-alias",
		setup(build) {
			build.onResolve({ filter: /^@\// }, (args) => {
				const resolved = path.resolve(VPK_ROOT, args.path.slice(2));
				return {
					path: resolved,
					namespace: "file",
					pluginData: { fromAlias: true },
				};
			});

			// After alias resolution, re-resolve extensionless paths via esbuild
			build.onLoad({ filter: /.*/, namespace: "file" }, async (args) => {
				// Only intervene for paths produced by our alias that lack an extension
				if (!args.pluginData?.fromAlias) return null;
				if (path.extname(args.path)) return null;

				// Try each extension
				const extensions = [".tsx", ".ts", ".jsx", ".js", ".json"];
				for (const ext of extensions) {
					try {
						const { existsSync } = require("node:fs");
						if (existsSync(args.path + ext)) {
							const content = readFileSync(args.path + ext, "utf-8");
							const loader = ext === ".tsx" ? "tsx" : ext === ".ts" ? "ts" : ext === ".jsx" ? "jsx" : ext === ".json" ? "json" : "js";
							return { contents: content, loader, resolveDir: path.dirname(args.path + ext) };
						}
					} catch {
						continue;
					}
				}
				// Also check for index files in directories
				for (const ext of extensions) {
					try {
						const indexPath = path.join(args.path, "index" + ext);
						const { existsSync } = require("node:fs");
						if (existsSync(indexPath)) {
							const content = readFileSync(indexPath, "utf-8");
							const loader = ext === ".tsx" ? "tsx" : ext === ".ts" ? "ts" : ext === ".jsx" ? "jsx" : ext === ".json" ? "json" : "js";
							return { contents: content, loader, resolveDir: path.dirname(indexPath) };
						}
					} catch {
						continue;
					}
				}
				return null;
			});
		},
	};

	try {
		logger.info("[forge-publish] Bundling with esbuild...");
		await esbuild.build({
			entryPoints: [entryFile],
			bundle: true,
			outfile: path.join(outputDir, "app.js"),
			format: "esm",
			target: "es2020",
			jsx: "automatic",
			plugins: [aliasPlugin],
			resolveExtensions: [".tsx", ".ts", ".jsx", ".js", ".json"],
			nodePaths: [
				path.join(VPK_ROOT, "node_modules"),
			],
			loader: {
				".tsx": "tsx",
				".ts": "ts",
				".jsx": "jsx",
				".css": "css",
				".svg": "dataurl",
			},
			define: {
				"process.env.NODE_ENV": '"production"',
			},
			minify: true,
			sourcemap: false,
		});
	} finally {
		await fs.unlink(entryFile).catch(() => {});
	}

	// 3. Compile Tailwind CSS with VPK theme
	logger.info("[forge-publish] Compiling Tailwind CSS...");
	const compiledCSS = await compileTailwindCSS(slug);

	await fs.writeFile(path.join(outputDir, "app.css"), compiledCSS, "utf-8");

	// 4. Generate index.html
	const indexHtml = generateIndexHtml();
	await fs.writeFile(path.join(outputDir, "index.html"), indexHtml, "utf-8");

	logger.info("[forge-publish] Build complete");
}

/**
 * Compile Tailwind CSS using the programmatic API with VPK theme.
 *
 * Scans the generated-app source files + shared VPK components for class usage.
 */
async function compileTailwindCSS(slug) {
	const { compile } = await import("tailwindcss");

	const tailwindTheme = readFileSync(
		path.join(VPK_ROOT, "app", "tailwind-theme.css"), "utf-8",
	);
	const shadcnTheme = readFileSync(
		path.join(VPK_ROOT, "app", "shadcn-theme.css"), "utf-8",
	);

	// Build a CSS input that imports Tailwind and includes VPK theme overrides.
	// source(none) prevents auto-detection so we control content scanning below.
	const cssInput = [
		'@import "tailwindcss" source(none);',
		tailwindTheme,
		shadcnTheme,
		"@custom-variant dark (&:is(.dark *));",
		"@layer base {",
		"  * { @apply border-border outline-ring/50; }",
		"  body { @apply bg-background text-foreground; font: var(--ds-font-body); }",
		"}",
	].join("\n");

	const tailwindCSSPath = path.join(
		VPK_ROOT, "node_modules", "tailwindcss", "index.css",
	);

	const result = await compile(cssInput, {
		base: VPK_ROOT,
		loadStylesheet: async (id, base) => {
			if (id === "tailwindcss") {
				return {
					content: readFileSync(tailwindCSSPath, "utf-8"),
					base: path.dirname(tailwindCSSPath),
				};
			}
			const resolved = path.join(base, id);
			return {
				content: readFileSync(resolved, "utf-8"),
				base: path.dirname(resolved),
			};
		},
	});

	// Scan source files for Tailwind class candidates
	const candidates = await collectClassCandidates(slug);

	return result.build(candidates);
}

/**
 * Collect Tailwind class candidates from the generated app and shared UI
 * components by scanning source files for class-like strings.
 */
async function collectClassCandidates(slug) {
	const candidates = new Set();

	const dirsToScan = [
		path.join(VPK_ROOT, "app", "apps", slug),
		path.join(VPK_ROOT, "components", "ui"),
		path.join(VPK_ROOT, "lib"),
	];

	for (const dir of dirsToScan) {
		try {
			await scanDirForCandidates(dir, candidates);
		} catch {
			// Directory may not exist
		}
	}

	return Array.from(candidates);
}

/**
 * Recursively scan a directory for class candidate strings in source files.
 */
async function scanDirForCandidates(dir, candidates) {
	const entries = await fs.readdir(dir, { withFileTypes: true });
	for (const entry of entries) {
		const fullPath = path.join(dir, entry.name);
		if (entry.isDirectory() && entry.name !== "node_modules") {
			await scanDirForCandidates(fullPath, candidates);
		} else if (/\.(tsx?|jsx?)$/.test(entry.name)) {
			const content = await fs.readFile(fullPath, "utf-8");
			// Extract potential class names — any word-like token that matches
			// Tailwind utility patterns (including variants like dark:, hover:)
			const matches = content.match(
				/(?:^|[\s"'`{:,])([a-z][a-z0-9]*(?:[-/][a-z0-9.[\]]+)*(?:\/\d+)?)/g,
			);
			if (matches) {
				for (const m of matches) {
					candidates.add(m.trim().replace(/^["'`{:,]/, ""));
				}
			}
			// Also capture class strings inside className="..." or cn(...)
			const classStrings = content.match(/(?:className|class|cn\()=?\s*["'`]([^"'`]+)["'`]/g);
			if (classStrings) {
				for (const cs of classStrings) {
					const inner = cs.match(/["'`]([^"'`]+)["'`]/);
					if (inner?.[1]) {
						for (const cls of inner[1].split(/\s+/)) {
							if (cls) candidates.add(cls);
						}
					}
				}
			}
		}
	}
}

/**
 * Generate the index.html for the Forge Custom UI app.
 */
function generateIndexHtml() {
	return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="app.css">
  <style>
    :root { --radius: var(--ds-radius-medium, 6px); }
    body { margin: 0; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="app.js"></script>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Manifest generation — rewrite the UI Kit manifest for Custom UI
// ---------------------------------------------------------------------------

/**
 * Rewrite the Forge app manifest from UI Kit to Custom UI.
 * Preserves the app ID from the original manifest.
 */
async function rewriteManifestForCustomUI(forgeAppDir, appTitle, product = "jira") {
	const manifestPath = path.join(forgeAppDir, "manifest.yml");
	const original = await fs.readFile(manifestPath, "utf-8");

	// Extract the app ID — critical for Forge to recognize the app
	const idMatch = original.match(/^\s*id:\s*(.+)$/m);
	const appId = idMatch?.[1]?.trim();
	if (!appId) {
		throw new Error("Could not extract app ID from manifest");
	}

	// Extract runtime info
	const runtimeMatch = original.match(/name:\s*(nodejs\S+)/);
	const runtime = runtimeMatch?.[1] || "nodejs22.x";

	// Build module entry based on product
	let moduleEntry;
	if (product === "confluence") {
		moduleEntry = [
			"  confluence:contentByLineItem:",
			"    - key: app-panel",
			"      resource: main",
			`      title: ${appTitle}`,
		].join("\n");
	} else {
		moduleEntry = [
			"  jira:issuePanel:",
			"    - key: app-panel",
			"      resource: main",
			`      title: ${appTitle}`,
			"      icon: https://developer.atlassian.com/platform/forge/images/icons/issue-panel-icon.svg",
		].join("\n");
	}

	const manifest = [
		"modules:",
		moduleEntry,
		"resources:",
		"  - key: main",
		"    path: static/default",
		"permissions:",
		"  scopes: []",
		"  content:",
		"    scripts:",
		"      - 'unsafe-inline'",
		"    styles:",
		"      - 'unsafe-inline'",
		"app:",
		"  runtime:",
		`    name: ${runtime}`,
		`  id: ${appId}`,
	].join("\n") + "\n";

	await fs.writeFile(manifestPath, manifest, "utf-8");
}

// ---------------------------------------------------------------------------
// Publish manager
// ---------------------------------------------------------------------------

/**
 * Create a forge publish manager.
 *
 * @param {object} deps
 * @param {object} deps.appRegistry - App registry instance
 * @param {string} deps.baseDir - Base directory for forge app output
 * @param {object} [deps.logger]
 */
function createForgePublishManager({ appRegistry, baseDir, logger = console }) {
	const forgeAppsDir = path.join(baseDir, "forge-apps");

	const getPublishStatus = async (runId) => {
		const app = await appRegistry.getAppByRunId(runId);
		if (!app) {
			return { status: "unpublished" };
		}

		if (!app.forge) {
			return { status: "unpublished", appSlug: app.slug };
		}

		const storedError = app.forge.error;

		return {
			status: app.forge.status || "unpublished",
			appSlug: app.slug,
			appName: app.forge.appName,
			siteUrl: app.forge.siteUrl,
			product: app.forge.product,
			lastDeployedAt: app.forge.lastDeployedAt,
			error: typeof storedError === "string" ? cleanScriptOutput(storedError) : storedError,
		};
	};

	/**
	 * Publish or update a forge app.
	 */
	const publish = async (options, onProgress) => {
		const {
			appSlug,
			appName,
			siteUrl,
			product = "jira",
		} = options;

		const report = (step, message) => {
			logger.info(`[forge-publish] [${step}] ${message}`);
			if (onProgress) {
				onProgress({ step, message });
			}
		};

		try {
			const forgeOk = await isForgeAvailable();
			if (!forgeOk) {
				const errorMsg = "Forge CLI not found. Install with: npm install -g @forge/cli";
				report("error", errorMsg);
				await appRegistry.updateForgeMetadata(appSlug, {
					status: "failed",
					error: errorMsg,
				});
				return { success: false, error: errorMsg };
			}

			const app = await appRegistry.getApp(appSlug);
			const isFirstPublish = !app?.forge?.appDir;

			if (isFirstPublish) {
				// ------- First publish -------

				report("creating", "Discovering developer spaces...");

				let devSpaceId = options.devSpaceId;
				if (!devSpaceId) {
					const devSpaces = await discoverDevSpaces();
					if (devSpaces.length === 0) {
						const errorMsg = "No developer spaces found. Create one at https://developer.atlassian.com/console/";
						report("error", errorMsg);
						await appRegistry.updateForgeMetadata(appSlug, {
							status: "failed",
							error: errorMsg,
						});
						return { success: false, error: errorMsg };
					}
					devSpaceId = devSpaces[0].id;
				}

				const template = options.template || getTemplateForProduct(product);

				report("creating", "Creating Forge app...");

				const forgeAppName = sanitizeForgeAppName(appName);
				await fs.mkdir(forgeAppsDir, { recursive: true });

				const appDir = path.join(forgeAppsDir, forgeAppName);

				// Clean up previous failed attempt
				try {
					await fs.rm(appDir, { recursive: true, force: true });
				} catch {
					// Ignore
				}

				const createResult = await runForgeCreate({
					template,
					appName: forgeAppName,
					devSpaceId,
					cwd: forgeAppsDir,
					timeoutMs: 60_000,
				});

				if (createResult.code !== 0) {
					const errorMsg = cleanScriptOutput(
						`Failed to create Forge app: ${createResult.stderr || createResult.stdout}`,
					);
					report("error", errorMsg);
					await appRegistry.updateForgeMetadata(appSlug, {
						status: "failed",
						error: errorMsg,
					});
					return { success: false, error: errorMsg };
				}

				await appRegistry.updateForgeMetadata(appSlug, {
					appName: forgeAppName,
					appDir,
					siteUrl,
					product,
					devSpaceId,
					status: "publishing",
				});

				// Rewrite manifest for Custom UI
				report("deploying", "Configuring Custom UI manifest...");
				await rewriteManifestForCustomUI(appDir, appName, product);

				// Build VPK component into static bundle
				report("deploying", "Building app bundle...");
				await buildForgeApp(appSlug, appDir, logger);

				// Deploy
				report("deploying", "Deploying to development...");
				const deployResult = await runForgeCommand(
					["deploy", "--non-interactive", "-e", "development"],
					{ cwd: appDir, timeoutMs: 180_000 },
				);

				if (deployResult.code !== 0) {
					const errorMsg = cleanScriptOutput(
						`Deployment failed: ${deployResult.stderr || deployResult.stdout}`,
					);
					report("error", errorMsg);
					await appRegistry.updateForgeMetadata(appSlug, {
						status: "failed",
						error: errorMsg,
					});
					return { success: false, error: errorMsg };
				}

				// Install on site
				report("installing", "Installing on site...");
				const installResult = await runForgeCommand(
					[
						"install",
						"--non-interactive",
						"--site", siteUrl,
						"--product", product,
						"-e", "development",
					],
					{ cwd: appDir, timeoutMs: 60_000 },
				);

				if (installResult.code !== 0) {
					// Install failure is non-fatal — code was deployed
					logger.warn(
						`[forge-publish] install failed: ${cleanScriptOutput(installResult.stderr || installResult.stdout)}`,
					);
				}

				await appRegistry.updateForgeMetadata(appSlug, {
					status: "published",
					lastDeployedAt: new Date().toISOString(),
					error: null,
				});

				report("done", "Published successfully!");
				return { success: true };

			} else {
				// ------- Update existing app -------

				const appDir = app.forge.appDir;
				const effectiveSiteUrl = siteUrl || app.forge.siteUrl;
				const effectiveProduct = product || app.forge.product || "jira";

				// Rebuild VPK component
				report("deploying", "Building updated app bundle...");
				await buildForgeApp(appSlug, appDir, logger);

				// Always rewrite manifest to ensure Custom UI format
				report("deploying", "Updating manifest...");
				await rewriteManifestForCustomUI(
					appDir,
					appName || app.forge.appName,
					effectiveProduct,
				);

				report("deploying", "Deploying update...");
				const deployResult = await runForgeCommand(
					["deploy", "--non-interactive", "-e", "development"],
					{ cwd: appDir, timeoutMs: 180_000 },
				);

				if (deployResult.code !== 0) {
					const errorMsg = cleanScriptOutput(
						`Update deployment failed: ${deployResult.stderr || deployResult.stdout}`,
					);
					report("error", errorMsg);
					await appRegistry.updateForgeMetadata(appSlug, {
						status: "failed",
						error: errorMsg,
					});
					return { success: false, error: errorMsg };
				}

				if (effectiveSiteUrl) {
					report("installing", "Upgrading installation...");
					const upgradeResult = await runForgeCommand(
						[
							"install", "--upgrade",
							"--non-interactive",
							"--site", effectiveSiteUrl,
							"--product", effectiveProduct,
							"-e", "development",
						],
						{ cwd: appDir, timeoutMs: 60_000 },
					);

					if (upgradeResult.code !== 0) {
						logger.warn(
							`[forge-publish] install --upgrade failed: ${cleanScriptOutput(upgradeResult.stderr || upgradeResult.stdout)}`,
						);
					}
				}

				await appRegistry.updateForgeMetadata(appSlug, {
					status: "published",
					appName: appName || app.forge.appName,
					lastDeployedAt: new Date().toISOString(),
					error: null,
				});

				report("done", "Updated successfully!");
				return { success: true };
			}
		} catch (err) {
			const errorMsg = err instanceof Error ? err.message : String(err);
			report("error", errorMsg);
			try {
				await appRegistry.updateForgeMetadata(appSlug, {
					status: "failed",
					error: errorMsg,
				});
			} catch {
				// Best-effort
			}
			return { success: false, error: errorMsg };
		}
	};

	return {
		getPublishStatus,
		publish,
		discoverSites,
		discoverDevSpaces,
	};
}

/**
 * Pick a default Forge template based on the target product.
 * We use UI Kit templates for `forge create` (to get the app ID),
 * then rewrite the manifest to Custom UI before deploying.
 */
function getTemplateForProduct(product) {
	switch (product) {
		case "confluence":
			return "confluence-macro-ui-kit";
		case "jira":
		default:
			return "jira-issue-panel-ui-kit";
	}
}

/**
 * Sanitize an app name for Forge (lowercase, hyphens, no special chars).
 */
function sanitizeForgeAppName(name) {
	return name
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "")
		|| "forge-app";
}

module.exports = { createForgePublishManager };
