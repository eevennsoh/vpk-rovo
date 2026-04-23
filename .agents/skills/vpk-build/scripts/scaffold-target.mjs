#!/usr/bin/env node
/**
 * scaffold-target.mjs
 *
 * Reads an extraction plan produced by trace-imports.mjs and materializes a
 * standalone sibling Next.js project. Copies files verbatim (preserving
 * repo-relative paths so `@/*` imports resolve without rewriting), fills in
 * templated scaffold files, copies public assets, and initializes a git repo.
 *
 * Usage:
 *   node scaffold-target.mjs <plan.json> [--target <dir>] [--force]
 *
 * The route entry (app/<route>/page.tsx) is promoted to app/page.tsx so the
 * extracted project serves the prototype at `/`. The original route's import
 * of loadDemoComponent is rewritten to import the demo component directly,
 * since the demo-registry-loader.ts dispatcher is intentionally not copied.
 */

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { execSync } from "node:child_process";

const SKILL_ROOT = path.resolve(new URL(".", import.meta.url).pathname, "..");
const SCAFFOLD_DIR = path.join(SKILL_ROOT, "references", "scaffold");
const MICROS_DIR = path.join(SKILL_ROOT, "references", "micros");

// -------- CLI ------------------------------------------------------------

function parseArgs(argv) {
	const args = { plan: null, target: null, force: false };
	for (let i = 0; i < argv.length; i++) {
		const a = argv[i];
		if (a === "--target") args.target = argv[++i];
		else if (a === "--force") args.force = true;
		else if (a.startsWith("--")) throw new Error(`Unknown flag: ${a}`);
		else if (!args.plan) args.plan = a;
	}
	if (!args.plan) {
		throw new Error("Usage: scaffold-target.mjs <plan.json> [--target <dir>] [--force]");
	}
	return args;
}

function readJSON(p) {
	return JSON.parse(fs.readFileSync(p, "utf8"));
}

// -------- Route promotion -------------------------------------------------

/**
 * Rewrite `app/<route>/page.tsx` so it renders directly without going through
 * loadDemoComponent. We replace the blacklisted dispatcher call with a direct
 * import from components/website/demos/<category>/<slug>-demo. If the page
 * doesn't use loadDemoComponent, we copy it verbatim.
 */
function rewriteRoutePage(sourceCode) {
	// Match a loadDemoComponent("slug", "category") call site
	const callMatch = sourceCode.match(
		/loadDemoComponent\(\s*["'`]([^"'`]+)["'`]\s*,\s*["'`]([^"'`]+)["'`]\s*\)/,
	);
	if (!callMatch) return sourceCode;

	const [, slug, category] = callMatch;
	const demoImportPath = `@/components/website/demos/${category}/${slug}-demo`;
	const demoIdentifier = toPascalCase(`${slug}-demo`);

	// Strip the dispatcher import, Suspense/use ceremony, and render the demo
	// component directly. This produces a tiny client page that any extracted
	// route can use regardless of what the original VPK wrapper looked like.
	return `"use client";

import ${demoIdentifier} from "${demoImportPath}";

export default function Page() {
	return <${demoIdentifier} />;
}
`;
}

function toPascalCase(kebab) {
	return kebab
		.split(/[-_]/)
		.map(part => part.charAt(0).toUpperCase() + part.slice(1))
		.join("");
}

// -------- Context + layout composition ----------------------------------

/**
 * Grep a context file's source for exported provider components. The VPK
 * convention is `export function <Name>Provider(...) { ... }`. We return the
 * set of Provider names to wrap the layout with.
 */
function parseProviderExports(source) {
	const names = new Set();
	const re = /export\s+function\s+([A-Z][A-Za-z0-9_]*Provider)\s*\(/g;
	let match;
	while ((match = re.exec(source)) !== null) names.add(match[1]);
	return [...names];
}

/**
 * Build a layout.tsx that injects @atlaskit/tokens CSS at runtime (the
 * package ships no static CSS file — all tokens are generated via the
 * getThemeStyles JS API), imports Tailwind's semantic theme, wraps with
 * ThemeWrapper, and nests any detected providers. Providers wrap in
 * alphabetical order (the order contextFiles came out of the trace);
 * if a provider needs to be inside another, the user reorders manually.
 */
function composeLayout({ targetName, routeSlug, providers }) {
	const providerImports = providers
		.map(p => `import { ${p.name} } from "${p.importPath}";`)
		.join("\n");

	// Build nested JSX: outermost provider opens first, innermost wraps {children}.
	let body = `{children}`;
	for (let i = providers.length - 1; i >= 0; i--) {
		const { name } = providers[i];
		body = `<${name}>\n\t\t\t\t\t${body}\n\t\t\t\t</${name}>`;
	}
	body = `<ThemeWrapper>\n\t\t\t\t${body}\n\t\t\t</ThemeWrapper>`;

	// Note: we do NOT inject a client-side FeatureGates shim here. Both
	// bare <script> tags and next/script in App Router trigger React's
	// "Encountered a script tag while rendering" warning on every render
	// in dev mode, which is louder than the one-time informational log
	// that @atlaskit/tokens emits client-side when the flag can't be
	// resolved. The server-side shim (via feature-flags-shim import below)
	// covers SSR; the client log is harmless and appears at most once.

	return `// IMPORTANT: this import MUST come first. It's a side-effect import that
// installs a FeatureGates resolver on globalThis before @atlaskit/tokens
// loads. ES modules hoist imports to the top of module execution order, so
// a bare assignment earlier in this file would still run AFTER the tokens
// package's own top-level init. Splitting the shim into a separate file
// and importing it first is the only way to guarantee side-effect order.
import "./feature-flags-shim";

import type { Metadata } from "next";
import { Geist } from "next/font/google";
import localFont from "next/font/local";
import { getThemeStyles } from "@atlaskit/tokens";

// Tailwind theme maps semantic classes (bg-surface, text-text-subtle, etc.)
// to --ds-* variables. Those variables are defined by the runtime-injected
// styles below from getThemeStyles — they do NOT ship as a static .css file.
import "./tailwind-theme.css";

import { ThemeWrapper } from "@/components/utils/theme-wrapper";
import { cn } from "@/lib/utils";
${providerImports ? "\n" + providerImports + "\n" : ""}
// Fonts — VPK prototypes reference --font-sans and --font-ark-es as CSS
// variables. Without these declarations the fonts fall back to browser
// defaults and the prototype's typography looks wrong (big display digits
// in particular lose the ARK-ES character).
const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

const arkEsSolidLight = localFont({
	src: "../public/fonts/ark-es/ARK-ES-SolidLight.woff",
	variable: "--font-ark-es",
	display: "swap",
});

const THEME_STATE = {
	colorMode: "light" as const,
	light: "light" as const,
	dark: "dark" as const,
	spacing: "spacing" as const,
	typography: "typography" as const,
	shape: "shape" as const,
};

export const metadata: Metadata = {
	title: "${targetName}",
	description: "Extracted from VPK-Rovo /${routeSlug}",
};

export default async function RootLayout({
	children,
}: Readonly<{ children: React.ReactNode }>) {
	const themeStyles = await getThemeStyles(THEME_STATE);

	return (
		<html lang="en" className="light" data-color-mode="light" suppressHydrationWarning>
			<head>
				{themeStyles.map((style) => (
					<style
						key={style.id}
						{...style.attrs}
						dangerouslySetInnerHTML={{ __html: style.css }}
					/>
				))}
			</head>
			<body className={cn("min-h-svh bg-bg-neutral text-text antialiased font-sans", geist.variable, arkEsSolidLight.variable)}>
				{/* Client-side FeatureGates shim — runs before any React hydration. */}
				<Script id="feature-flags-shim" strategy="beforeInteractive">
					{${JSON.stringify(clientShim)}}
				</Script>
				${body}
			</body>
		</html>
	);
}
`;
}

// -------- Copy helpers ---------------------------------------------------

function ensureDir(dir) {
	fs.mkdirSync(dir, { recursive: true });
}

function copyFileVerbatim(srcAbs, destAbs) {
	ensureDir(path.dirname(destAbs));
	fs.copyFileSync(srcAbs, destAbs);
}

function writeFileEnsuring(destAbs, contents) {
	ensureDir(path.dirname(destAbs));
	fs.writeFileSync(destAbs, contents);
}

// -------- Template substitution ------------------------------------------

function substituteTemplate(text, vars) {
	return text.replace(/\{\{([A-Z_]+)\}\}/g, (_m, key) => {
		if (key in vars) return String(vars[key]);
		return `{{${key}}}`;
	});
}

function buildDependenciesBlock(npmPackages) {
	// Produce a 2-space indented JSON block. The template already has a tab
	// before {{DEPENDENCIES_JSON}}, so we just output the object body.
	const entries = Object.entries(npmPackages).sort(([a], [b]) => a.localeCompare(b));
	if (entries.length === 0) return "{}";
	const lines = entries.map(([name, version]) => `\t\t"${name}": "${version}"`);
	return `{\n${lines.join(",\n")}\n\t}`;
}

// -------- Main ----------------------------------------------------------

function main() {
	const args = parseArgs(process.argv.slice(2));
	const plan = readJSON(path.resolve(args.plan));
	const repoRoot = plan.repoRoot;
	const route = plan.route;
	const routeSlug = route.replace(/^\//, "").replace(/\//g, "-");
	const targetName = `vpk-${routeSlug}`;
	const targetDir = args.target
		? path.resolve(args.target)
		: path.resolve(repoRoot, "..", targetName);

	// Refuse to clobber unless --force, but only if the target already has
	// content. An empty directory is fine to reuse.
	if (fs.existsSync(targetDir)) {
		const contents = fs.readdirSync(targetDir);
		if (contents.length > 0 && !args.force) {
			throw new Error(
				`Target directory ${targetDir} is not empty. Pass --force to overwrite.`,
			);
		}
	}
	ensureDir(targetDir);

	console.error(`Scaffolding ${targetName} at ${targetDir}`);
	console.error(`  Source: ${repoRoot}`);
	console.error(`  Route: ${route} | Files: ${plan.files.length} | npm: ${Object.keys(plan.npmPackages).length} | Assets: ${plan.assets.length}`);

	// ---- 1. Copy source files verbatim (preserve repo-relative paths) ----
	const entryRel = plan.entry; // e.g. "app/awake/page.tsx"
	const layoutRel = plan.layout; // e.g. "app/awake/layout.tsx" or null
	const entryAbs = path.join(repoRoot, entryRel);
	const layoutAbs = layoutRel ? path.join(repoRoot, layoutRel) : null;

	for (const rel of plan.files) {
		const srcAbs = path.join(repoRoot, rel);
		// Route entry + route layout get special handling — skip here.
		if (srcAbs === entryAbs || srcAbs === layoutAbs) continue;

		const destAbs = path.join(targetDir, rel);
		copyFileVerbatim(srcAbs, destAbs);
	}

	// ---- 2. Promote the route to the root ----
	// app/<route>/page.tsx → app/page.tsx (with loadDemoComponent rewritten)
	const originalPage = fs.readFileSync(entryAbs, "utf8");
	const rewrittenPage = rewriteRoutePage(originalPage);
	writeFileEnsuring(path.join(targetDir, "app", "page.tsx"), rewrittenPage);

	// ---- 3a. Write feature-flags-shim.ts alongside layout.tsx ----
	// Imported as a side-effect from layout.tsx. Runs BEFORE @atlaskit/tokens
	// loads so the FeatureGates global is installed in time. See the comment
	// at the top of the generated layout for the "why".
	writeFileEnsuring(
		path.join(targetDir, "app", "feature-flags-shim.ts"),
		`// Auto-generated by /vpk-build. Sets up a FeatureGates resolver that
// disables all flags, preventing "Client must be initialized" errors
// thrown by @atlaskit/tokens during SSR when a real FeatureGates client
// isn't wired up (extracted projects have no client by design).
(globalThis as Record<string, unknown>).__PLATFORM_FEATURE_FLAGS__ = {
\tbooleanResolver: () => false,
};
`,
	);

	// ---- 3b. Compose app/layout.tsx dynamically from detected contexts ----
	// If the plan found contextFiles (under app/contexts/), parse each for
	// exported *Provider components and wrap the layout with them. If none,
	// fall back to the slim template with just ThemeWrapper.
	const providers = [];
	for (const ctxRel of plan.contextFiles || []) {
		const ctxAbs = path.join(repoRoot, ctxRel);
		if (!fs.existsSync(ctxAbs)) continue;
		const providerNames = parseProviderExports(fs.readFileSync(ctxAbs, "utf8"));
		// Convert "app/contexts/context-rovo-chat.tsx" -> "@/app/contexts/context-rovo-chat"
		const importPath = "@/" + ctxRel.replace(/\.(tsx|ts|jsx|js)$/, "");
		for (const name of providerNames) {
			providers.push({ name, importPath });
		}
	}
	writeFileEnsuring(
		path.join(targetDir, "app", "layout.tsx"),
		composeLayout({ targetName, routeSlug, providers }),
	);

	// ---- 4. Always copy tailwind-theme.css into app/ ----
	const themeCssSrc = path.join(repoRoot, "app", "tailwind-theme.css");
	if (fs.existsSync(themeCssSrc)) {
		copyFileVerbatim(themeCssSrc, path.join(targetDir, "app", "tailwind-theme.css"));
	}

	// ---- 4b. Copy public/fonts/ (if any) ----
	// VPK prototypes reference fonts via CSS variables (--font-sans,
	// --font-ark-es) set up in the root layout. Without copying the font
	// files AND wiring them into the extracted layout, typography falls back
	// to browser defaults and the prototype's visual identity looks off.
	const fontsDir = path.join(repoRoot, "public", "fonts");
	if (fs.existsSync(fontsDir)) {
		copyTreeVerbatim(fontsDir, path.join(targetDir, "public", "fonts"));
	}

	// ---- 5. Copy public assets ----
	for (const assetPath of plan.assets) {
		const rel = assetPath.startsWith("/") ? assetPath.slice(1) : assetPath;
		const srcAbs = path.join(repoRoot, "public", rel);
		if (!fs.existsSync(srcAbs)) continue; // Asset might have been a regex false-positive
		copyFileVerbatim(srcAbs, path.join(targetDir, "public", rel));
	}

	// ---- 6. Copy static scaffold files (next.config.ts, tsconfig, etc.) ----
	const staticScaffolds = [
		"next.config.ts",
		"tsconfig.json",
		"postcss.config.mjs",
		"tailwind.config.ts",
		".gitignore",
	];
	for (const name of staticScaffolds) {
		copyFileVerbatim(path.join(SCAFFOLD_DIR, name), path.join(targetDir, name));
	}

	// ---- 7. Fill and write package.json from template ----
	const pkgTmpl = fs.readFileSync(path.join(SCAFFOLD_DIR, "package.json.tmpl"), "utf8");
	const pkgFilled = substituteTemplate(pkgTmpl, {
		TARGET_NAME: targetName,
		DEPENDENCIES_JSON: buildDependenciesBlock(plan.npmPackages),
	});
	fs.writeFileSync(path.join(targetDir, "package.json"), pkgFilled);

	// ---- 8. Fill and write README.md from template ----
	const sha = safeGitSha(repoRoot);
	const readmeTmpl = fs.readFileSync(path.join(SCAFFOLD_DIR, "README.md.tmpl"), "utf8");
	const readmeFilled = substituteTemplate(readmeTmpl, {
		TARGET_NAME: targetName,
		ROUTE_NAME: routeSlug,
		GENERATED_DATE: new Date().toISOString().slice(0, 10),
		SOURCE_SHA: sha,
	});
	fs.writeFileSync(path.join(targetDir, "README.md"), readmeFilled);

	// ---- 9. Copy Micros deploy scaffold ----
	if (fs.existsSync(MICROS_DIR)) {
		copyTreeVerbatim(MICROS_DIR, targetDir);
	}

	// ---- 10. git init + initial commit ----
	try {
		execSync("git init -q", { cwd: targetDir, stdio: "inherit" });
		execSync("git add -A", { cwd: targetDir, stdio: "inherit" });
		execSync(
			`git commit -q -m "Extract ${route} from VPK-Rovo at ${sha}"`,
			{ cwd: targetDir, stdio: "inherit" },
		);
	} catch (err) {
		console.error(`git init/commit failed: ${err.message}`);
		// Non-fatal — the scaffolded project is still usable without git.
	}

	console.error(`\n✅ Scaffold complete: ${targetDir}`);
	console.error(`Next steps:`);
	console.error(`  cd ${path.relative(process.cwd(), targetDir)}`);
	console.error(`  pnpm install`);
	console.error(`  pnpm dev`);
}

function copyTreeVerbatim(srcDir, destDir) {
	for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
		const srcAbs = path.join(srcDir, entry.name);
		const destAbs = path.join(destDir, entry.name);
		if (entry.isDirectory()) {
			ensureDir(destAbs);
			copyTreeVerbatim(srcAbs, destAbs);
		} else {
			copyFileVerbatim(srcAbs, destAbs);
		}
	}
}

function safeGitSha(repoRoot) {
	try {
		return execSync("git rev-parse --short HEAD", { cwd: repoRoot, encoding: "utf8" }).trim();
	} catch {
		return "unknown";
	}
}

try {
	main();
} catch (err) {
	console.error(`scaffold-target: ${err.message}`);
	process.exit(1);
}
