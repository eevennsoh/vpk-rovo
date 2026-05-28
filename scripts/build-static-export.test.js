const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const test = require("node:test");

const source = readFileSync("scripts/build-static-export.mjs", "utf8");

test("static export hides runtime-only Rovo and Studio skills detail routes", () => {
	for (const project of ["rovo", "studio"]) {
		assert.ok(
			source.includes(`source: join(rootDir, "app", "${project}", "skills", "[category]", "[name]")`),
			`expected ${project} skills detail route to be moved before static export`,
		);
		assert.ok(
			source.includes(`backup: join(rootDir, ".${project}-skills-detail-route-backup")`),
			`expected ${project} skills detail route backup to be restorable`,
		);
	}
});
