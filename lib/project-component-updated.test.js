const assert = require("node:assert/strict");
const fs = require("node:fs");
const { stripTypeScriptTypes } = require("node:module");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

async function loadProjectComponentUpdatedHarness({
	artComponents,
	projectComponents,
	existingPaths,
	gitLogByPath,
}) {
	const execCalls = [];
	const availablePaths = new Set(existingPaths);
	const context = vm.createContext({
		console,
		Date,
		Map,
		Number,
		process,
	});
	const moduleBySpecifier = new Map();

	moduleBySpecifier.set(
		"server-only",
		new vm.SyntheticModule([], () => {}, { context }),
	);
	moduleBySpecifier.set(
		"node:child_process",
		new vm.SyntheticModule(
			["execFileSync"],
			function setChildProcessExports() {
				this.setExport("execFileSync", (command, args) => {
					execCalls.push({ command, args });
					const targetPath = args.at(-1);
					if (!(targetPath in gitLogByPath)) {
						throw new Error(`missing git fixture for ${targetPath}`);
					}

					return gitLogByPath[targetPath];
				});
			},
			{ context },
		),
	);
	moduleBySpecifier.set(
		"node:fs",
		new vm.SyntheticModule(
			["existsSync"],
			function setFsExports() {
				this.setExport("existsSync", (candidatePath) => {
					return availablePaths.has(candidatePath);
				});
			},
			{ context },
		),
	);
	moduleBySpecifier.set(
		"@/app/data/component-manifest",
		new vm.SyntheticModule(
			["ART_COMPONENTS", "PROJECT_COMPONENTS"],
			function setManifestExports() {
				this.setExport("ART_COMPONENTS", artComponents);
				this.setExport("PROJECT_COMPONENTS", projectComponents);
			},
			{ context },
		),
	);

	const sourcePath = path.join(process.cwd(), "lib/project-component-updated.ts");
	const source = stripTypeScriptTypes(fs.readFileSync(sourcePath, "utf8"));
	const projectComponentUpdatedModule = new vm.SourceTextModule(source, {
		context,
		identifier: sourcePath,
	});

	await projectComponentUpdatedModule.link(async (specifier) => {
		const fixtureModule = moduleBySpecifier.get(specifier);
		if (!fixtureModule) {
			throw new Error(`Unsupported test import: ${specifier}`);
		}

		return fixtureModule;
	});
	await projectComponentUpdatedModule.evaluate();

	return {
		getArtComponentsWithUpdatedAt:
			projectComponentUpdatedModule.namespace.getArtComponentsWithUpdatedAt,
		getProjectComponentsWithUpdatedAt:
			projectComponentUpdatedModule.namespace.getProjectComponentsWithUpdatedAt,
		getExecCalls() {
			return execCalls.map((call) => ({
				command: call.command,
				args: [...call.args],
			}));
		},
	};
}

function toPlainJson(value) {
	return JSON.parse(JSON.stringify(value));
}

test("getArtComponentsWithUpdatedAt includes app routes and caches the result within the TTL", async () => {
	const harness = await loadProjectComponentUpdatedHarness({
		artComponents: [
			{
				name: "Sydney Lockscreen",
				slug: "sydney-lockscreen",
				importPath: "@/components/arts/sydney-lockscreen",
				category: "arts",
			},
		],
		projectComponents: [],
		existingPaths: ["app/sydney-lockscreen"],
		gitLogByPath: {
			"components/arts/sydney-lockscreen": "2026-04-10T10:00:00.000Z\n",
			"app/sydney-lockscreen": "2026-04-12T10:00:00.000Z\n",
		},
	});

	const originalDateNow = Date.now;
	Date.now = () => 1_000;

	try {
		const firstResult = harness.getArtComponentsWithUpdatedAt();
		const secondResult = harness.getArtComponentsWithUpdatedAt();

		assert.deepEqual(toPlainJson(firstResult), [
			{
				name: "Sydney Lockscreen",
				slug: "sydney-lockscreen",
				importPath: "@/components/arts/sydney-lockscreen",
				category: "arts",
				updatedAt: "2026-04-12T10:00:00.000Z",
			},
		]);
		assert.deepEqual(toPlainJson(secondResult), toPlainJson(firstResult));
		assert.deepEqual(
			harness.getExecCalls().map((call) => call.args.at(-1)),
			["components/arts/sydney-lockscreen", "app/sydney-lockscreen"],
		);
	} finally {
		Date.now = originalDateNow;
	}
});

test("project and art timestamp caches stay isolated by prefix", async () => {
	const harness = await loadProjectComponentUpdatedHarness({
		artComponents: [
			{
				name: "Sydney Lockscreen",
				slug: "sydney-lockscreen",
				importPath: "@/components/arts/sydney-lockscreen",
				category: "arts",
			},
		],
		projectComponents: [
			{
				name: "Rovo App",
				slug: "rovo-app",
				importPath: "@/components/projects/rovo-app",
				category: "projects",
			},
		],
		existingPaths: [],
		gitLogByPath: {
			"components/arts/sydney-lockscreen": "2026-04-12T10:00:00.000Z\n",
			"components/projects/rovo-app": "2026-04-15T08:30:00.000Z\n",
		},
	});

	const originalDateNow = Date.now;
	Date.now = () => 5_000;

	try {
		const artEntries = harness.getArtComponentsWithUpdatedAt();
		const projectEntries = harness.getProjectComponentsWithUpdatedAt();

		assert.deepEqual(toPlainJson(artEntries), [
			{
				name: "Sydney Lockscreen",
				slug: "sydney-lockscreen",
				importPath: "@/components/arts/sydney-lockscreen",
				category: "arts",
				updatedAt: "2026-04-12T10:00:00.000Z",
			},
		]);
		assert.deepEqual(toPlainJson(projectEntries), [
			{
				name: "Rovo App",
				slug: "rovo-app",
				importPath: "@/components/projects/rovo-app",
				category: "projects",
				updatedAt: "2026-04-15T08:30:00.000Z",
			},
		]);
		assert.deepEqual(
			harness.getExecCalls().map((call) => call.args.at(-1)),
			["components/arts/sydney-lockscreen", "components/projects/rovo-app"],
		);
	} finally {
		Date.now = originalDateNow;
	}
});
