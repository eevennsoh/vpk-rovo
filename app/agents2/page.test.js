const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const AGENTS_PAGE_FILE = path.join(__dirname, "page.tsx");
const AGENTS_LAYOUT_FILE = path.join(__dirname, "layout.tsx");
const AGENTS_PAGE_SOURCE = fs.readFileSync(AGENTS_PAGE_FILE, "utf8");
const AGENTS_LAYOUT_SOURCE = fs.readFileSync(AGENTS_LAYOUT_FILE, "utf8");

test("Agents2Page mounts the projects catalog demo as its full route view", () => {
	assert.match(
		AGENTS_PAGE_SOURCE,
		/import \{ loadDemoComponent \} from "@\/components\/website\/demo-registry-loader";/,
	);
	assert.match(AGENTS_PAGE_SOURCE, /loadDemoComponent\("agents2", "projects"\)/);
	assert.match(AGENTS_PAGE_SOURCE, /createElement\(Demo\)/);
});

test("Agents2 route metadata follows project template naming", () => {
	assert.match(
		AGENTS_LAYOUT_SOURCE,
		/import \{ getProjectPageTitle \} from "@\/lib\/project-page-title";/,
	);
	assert.match(AGENTS_LAYOUT_SOURCE, /const title = getProjectPageTitle\("agents2"\)/);
	assert.match(AGENTS_LAYOUT_SOURCE, /title: `\$\{title\} — VPK`/);
});
