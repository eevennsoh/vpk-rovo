const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const COMPONENT_DETAIL_PAGE_FILE = path.join(
	__dirname,
	"[category]",
	"[slug]",
	"page.tsx",
);
const COMPONENT_DETAIL_PAGE_SOURCE = fs.readFileSync(
	COMPONENT_DETAIL_PAGE_FILE,
	"utf8",
);

test("Component detail static params include legacy Rovo App redirect route", () => {
	assert.ok(
		COMPONENT_DETAIL_PAGE_SOURCE.includes(
			'params.push({ category: "projects", slug: "rovo-app" });',
		),
	);
	assert.match(
		COMPONENT_DETAIL_PAGE_SOURCE,
		/return "\/components\/projects\/rovo";/,
	);
});
