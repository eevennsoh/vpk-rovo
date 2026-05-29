const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

function readProjectFile(relativePath) {
	return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

test("Agent Templates is exposed as a website block", () => {
	assert.match(
		readProjectFile("app/data/components.ts"),
		/blockComponent\("agent-templates", "Agent Templates"\)/u,
	);
	assert.match(
		readProjectFile("app/data/component-manifest.ts"),
		/blockComponent\("agent-templates", "Agent Templates"\)/u,
	);
	assert.match(
		readProjectFile("app/data/details/blocks.ts"),
		/import \{ AgentTemplatesDialog \} from "@\/components\/blocks\/agent-templates";/u,
	);
	assert.match(
		readProjectFile("components/website/registry.ts"),
		/"agent-templates": dynamic\(\s*\(\) => import\("\.\/demos\/blocks\/agent-templates-demo"\)/u,
	);
});

test("Agent Templates docs demo starts closed until the trigger is clicked", () => {
	assert.match(
		readProjectFile("components/blocks/agent-templates/page.tsx"),
		/const \[open, setOpen\] = useState\(false\);/u,
	);
});

test("Agent Templates duplicates the Agents Directory data and browser shell", () => {
	const source = readProjectFile("components/blocks/agent-templates/components/agent-templates.tsx");
	const pageSource = readProjectFile("components/blocks/agent-templates/page.tsx");
	const defaultSidebarGroupsSource = readProjectFile("components/blocks/agent-templates/data/sidebar-groups.ts");

	assert.match(source, /AgentBrowserDialog/u);
	assert.match(source, /DEFAULT_AGENT_TEMPLATES_SIDEBAR_GROUPS/u);
	assert.match(source, /title = "Agent templates"/u);
	assert.match(pageSource, /DEMO_AGENT_BROWSER_AGENTS/u);
	assert.match(pageSource, /attributionKind: "team"/u);
	assert.match(pageSource, /attributionKind: "person"/u);
	assert.match(defaultSidebarGroupsSource, /title: "By teams"/u);
	assert.match(defaultSidebarGroupsSource, /title: "By companies"/u);
});
