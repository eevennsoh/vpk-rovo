const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const { loadCjsModuleFromText } = require(path.join(process.cwd(), "scripts/lib/esbuild-cjs-loader.js"));
const esbuild = require("esbuild");

async function loadRovoAppSidebarSurfacePreviewHarness() {
	const result = await esbuild.build({
		stdin: {
			contents: `
				import { getRovoAppSidebarSurfacePreview } from "./components/projects/rovo/lib/rovo-app-sidebar-surface-preview.ts";

				export { getRovoAppSidebarSurfacePreview };
			`,
			loader: "ts",
			resolveDir: process.cwd(),
			sourcefile: "rovo-app-sidebar-surface-preview-harness.ts",
		},
		bundle: true,
		format: "cjs",
		platform: "node",
		tsconfig: path.join(process.cwd(), "tsconfig.json"),
		write: false,
	});

	return loadCjsModuleFromText(result.outputFiles[0].text);
}

test("does not build a New chat hover preview", async () => {
	const { getRovoAppSidebarSurfacePreview } = await loadRovoAppSidebarSurfacePreviewHarness();

	assert.equal(
		getRovoAppSidebarSurfacePreview({
			label: "New chat",
			selected: false,
		}),
		null,
	);
});

test("builds control-plane previews from configured surface data", async () => {
	const { getRovoAppSidebarSurfacePreview } = await loadRovoAppSidebarSurfacePreviewHarness();
	const preview = getRovoAppSidebarSurfacePreview({
		description: "Scheduled work and run history",
		label: "Jobs",
		selected: true,
	});

	assert.deepEqual(preview?.rows, [
		{ label: "Nightly product summary", value: "Scheduled" },
		{ label: "Eval dataset export", value: "Running" },
		{ label: "Memory pruning sweep", value: "Paused" },
	]);
	assert.equal(preview?.description, "Scheduled work and run history");
	assert.equal(preview?.footerLabel, "Active");
	assert.equal(preview?.footerValue, "1 running, 1 scheduled");
	assert.equal(preview?.title, "Jobs");
});

test("returns null for unknown sidebar labels", async () => {
	const { getRovoAppSidebarSurfacePreview } = await loadRovoAppSidebarSurfacePreviewHarness();

	assert.equal(
		getRovoAppSidebarSurfacePreview({
			label: "Unknown",
			selected: false,
		}),
		null,
	);
});
