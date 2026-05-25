const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

function readProjectFile(relativePath) {
	return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

test("Studio is registered in project catalog and demo surfaces", () => {
	assert.match(
		readProjectFile("app/data/components.ts"),
		/projectComponent\("studio", "Studio"\)/u,
	);
	assert.match(
		readProjectFile("app/data/component-manifest.ts"),
		/projectComponent\("studio", "Studio"\)/u,
	);
	assert.match(
		readProjectFile("app/data/details/projects.ts"),
		/import Studio from "@\/components\/projects\/studio";/u,
	);
	assert.match(
		readProjectFile("components/website/registry.ts"),
		/studio: dynamic\(\(\) => import\("\.\/demos\/projects\/studio-demo"\)/u,
	);
});
