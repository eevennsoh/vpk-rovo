const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

function readProjectFile(relativePath) {
	return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

test("Agents Directory is exposed as a website block and used by Studio", () => {
	assert.match(
		readProjectFile("app/data/components.ts"),
		/blockComponent\("agents-directory", "Agents Directory"\)/u,
	);
	assert.match(
		readProjectFile("app/data/component-manifest.ts"),
		/blockComponent\("agents-directory", "Agents Directory"\)/u,
	);
	assert.match(
		readProjectFile("app/data/details/blocks.ts"),
		/import \{ AgentsDirectoryDialog \} from "@\/components\/blocks\/agents-directory";/u,
	);
	assert.match(
		readProjectFile("components/website/registry.ts"),
		/"agents-directory": dynamic\(\s*\(\) => import\("\.\/demos\/blocks\/agents-directory-demo"\)/u,
	);
	assert.match(
		readProjectFile("components/projects/studio/components/rovo-app-shell.tsx"),
		/import \{ AgentsDirectoryDialog \} from "@\/components\/blocks\/agents-directory";/u,
	);
});

test("Agents Directory docs demo starts closed until the trigger is clicked", () => {
	assert.match(
		readProjectFile("components/blocks/agents-directory/page.tsx"),
		/const \[open, setOpen\] = useState\(false\);/u,
	);
});
