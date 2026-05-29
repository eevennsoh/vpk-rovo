const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

function readProjectFile(relativePath) {
	return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

test("Skills Directory is exposed as a website block", () => {
	assert.match(
		readProjectFile("app/data/components.ts"),
		/blockComponent\("skills-directory", "Skills Directory"\)/u,
	);
	assert.match(
		readProjectFile("app/data/component-manifest.ts"),
		/blockComponent\("skills-directory", "Skills Directory"\)/u,
	);
	assert.match(
		readProjectFile("app/data/details/blocks.ts"),
		/import \{ SkillsDirectoryDialog \} from "@\/components\/blocks\/skills-directory";/u,
	);
	assert.match(
		readProjectFile("components/website/registry.ts"),
		/"skills-directory": dynamic\(\s*\(\) => import\("\.\/demos\/blocks\/skills-directory-demo"\)/u,
	);
});

test("Skills Directory docs demo starts closed until the trigger is clicked", () => {
	assert.match(
		readProjectFile("components/blocks/skills-directory/page.tsx"),
		/const \[open, setOpen\] = useState\(false\);/u,
	);
});

test("Skills Directory duplicates the Agents Directory data and browser shell", () => {
	const source = readProjectFile("components/blocks/skills-directory/components/skills-directory.tsx");
	const pageSource = readProjectFile("components/blocks/skills-directory/page.tsx");
	const defaultSidebarGroupsSource = readProjectFile("components/blocks/skills-directory/data/sidebar-groups.ts");

	assert.match(source, /AgentBrowserDialog/u);
	assert.match(source, /DEFAULT_SKILLS_DIRECTORY_SIDEBAR_GROUPS/u);
	assert.match(pageSource, /DEMO_AGENT_BROWSER_AGENTS/u);
	assert.match(pageSource, /attributionKind: "team"/u);
	assert.match(pageSource, /attributionKind: "person"/u);
	assert.match(defaultSidebarGroupsSource, /title: "By teams"/u);
	assert.match(defaultSidebarGroupsSource, /title: "By companies"/u);
});
