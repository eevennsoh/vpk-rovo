const test = require("node:test");
const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const SCAFFOLD_TARGET_PATH = path.resolve(__dirname, "scaffold-target.mjs");

function writeFile(filePath, contents) {
	fs.mkdirSync(path.dirname(filePath), { recursive: true });
	fs.writeFileSync(filePath, contents, "utf8");
}

function createFixture() {
	const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "vpk-build-scaffold-"));
	const repoRoot = path.join(tempDir, "repo");
	const targetDir = path.join(tempDir, "output");
	const planPath = path.join(tempDir, "plan.json");

	try {
		writeFile(
			path.join(repoRoot, "app", "awake", "page.tsx"),
			`import { createElement, use } from "react";
import { loadDemoComponent } from "@/components/website/demo-registry-loader";

export default function AwakePage() {
	const Demo = use(loadDemoComponent("awake", "arts"));

	return createElement(Demo);
}
`,
		);
		writeFile(
			path.join(repoRoot, "app", "tailwind-theme.css"),
			":root { --fixture-color: #fff; }\n",
		);
		writeFile(
			path.join(repoRoot, "components", "utils", "theme-wrapper.tsx"),
			`export function ThemeWrapper({ children }) {
	return children;
}
`,
		);
		writeFile(
			path.join(repoRoot, "lib", "utils.ts"),
			`export function cn(...classes) {
	return classes.filter(Boolean).join(" ");
}
`,
		);
		writeFile(
			path.join(repoRoot, "public", "fonts", "ark-es", "ARK-ES-SolidLight.woff"),
			"solid-light-font\n",
		);
		writeFile(
			path.join(repoRoot, "public", "fonts", "ark-es", "ARK-ES-Bold.woff"),
			"bold-font\n",
		);
		writeFile(
			planPath,
			JSON.stringify(
				{
					repoRoot,
					route: "/awake",
					entry: "app/awake/page.tsx",
					layout: null,
					files: [
						"app/awake/page.tsx",
						"components/utils/theme-wrapper.tsx",
						"lib/utils.ts",
					],
					assets: [],
					npmPackages: {
						next: "16.2.4",
						react: "19.2.5",
					},
					contextFiles: [],
				},
				null,
				2,
			),
		);

		execFileSync("git", ["init"], { cwd: repoRoot, stdio: "ignore" });
		execFileSync("git", ["config", "user.email", "test@example.com"], {
			cwd: repoRoot,
			stdio: "ignore",
		});
		execFileSync("git", ["config", "user.name", "Test User"], {
			cwd: repoRoot,
			stdio: "ignore",
		});
		execFileSync("git", ["add", "."], { cwd: repoRoot, stdio: "ignore" });
		execFileSync("git", ["commit", "-m", "init"], { cwd: repoRoot, stdio: "ignore" });

		return {
			targetDir,
			planPath,
			cleanup() {
				fs.rmSync(tempDir, { recursive: true, force: true });
			},
		};
	} catch (error) {
		fs.rmSync(tempDir, { recursive: true, force: true });
		throw error;
	}
}

test("scaffold-target emits the updated layout, shim, config, and fonts for extracted routes", () => {
	const fixture = createFixture();

	try {
		execFileSync(process.execPath, [SCAFFOLD_TARGET_PATH, fixture.planPath, "--target", fixture.targetDir], {
			encoding: "utf8",
			env: {
				...process.env,
				GIT_AUTHOR_NAME: "Test User",
				GIT_AUTHOR_EMAIL: "test@example.com",
				GIT_COMMITTER_NAME: "Test User",
				GIT_COMMITTER_EMAIL: "test@example.com",
			},
			stdio: "pipe",
		});

		const page = fs.readFileSync(path.join(fixture.targetDir, "app", "page.tsx"), "utf8");
		const layout = fs.readFileSync(path.join(fixture.targetDir, "app", "layout.tsx"), "utf8");
		const featureFlagsShim = fs.readFileSync(
			path.join(fixture.targetDir, "app", "feature-flags-shim.ts"),
			"utf8",
		);
		const nextConfig = fs.readFileSync(path.join(fixture.targetDir, "next.config.ts"), "utf8");

		assert.match(
			page,
			/import AwakeDemo from "@\/components\/website\/demos\/arts\/awake-demo";/,
		);
		assert.match(page, /return <AwakeDemo \/>;/);

		assert.ok(
			layout.includes('import "./feature-flags-shim";'),
			"layout should import the feature flag shim",
		);
		assert.ok(
			layout.indexOf('import "./feature-flags-shim";') < layout.indexOf('import type { Metadata } from "next";'),
			"feature flag shim should load before other imports",
		);
		assert.match(layout, /import \{ Geist \} from "next\/font\/google";/);
		assert.match(layout, /import localFont from "next\/font\/local";/);
		assert.match(layout, /import \{ getThemeStyles \} from "@atlaskit\/tokens";/);
		assert.match(layout, /const geist = Geist\(\{ subsets: \["latin"\], variable: "--font-sans" \}\);/);
		assert.match(layout, /src: "\.\.\/public\/fonts\/ark-es\/ARK-ES-SolidLight\.woff"/);
		assert.match(layout, /const themeStyles = await getThemeStyles\(THEME_STATE\);/);
		assert.doesNotMatch(layout, /next\/script/);
		assert.doesNotMatch(layout, /clientShim/);

		assert.match(featureFlagsShim, /__PLATFORM_FEATURE_FLAGS__/);
		assert.match(featureFlagsShim, /booleanResolver: \(\) => false/);

		assert.equal(
			fs.readFileSync(
				path.join(fixture.targetDir, "public", "fonts", "ark-es", "ARK-ES-SolidLight.woff"),
				"utf8",
			),
			"solid-light-font\n",
		);
		assert.equal(
			fs.readFileSync(
				path.join(fixture.targetDir, "public", "fonts", "ark-es", "ARK-ES-Bold.woff"),
				"utf8",
			),
			"bold-font\n",
		);
		assert.equal(
			fs.readFileSync(path.join(fixture.targetDir, "app", "tailwind-theme.css"), "utf8"),
			":root { --fixture-color: #fff; }\n",
		);

		assert.match(nextConfig, /root: process\.cwd\(\),/);
		assert.doesNotMatch(nextConfig, /root:\s*fileURLToPath\(/);
	} finally {
		fixture.cleanup();
	}
});
