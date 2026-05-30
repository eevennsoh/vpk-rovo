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

test("Agent Templates renders the strategy dialog layout with temporary placeholders", () => {
	const source = readProjectFile("components/blocks/agent-templates/components/agent-templates.tsx");
	const pageSource = readProjectFile("components/blocks/agent-templates/page.tsx");
	const defaultSidebarGroupsSource = readProjectFile("components/blocks/agent-templates/data/sidebar-groups.ts");

	assert.doesNotMatch(source, /AgentBrowserDialog/u);
	assert.doesNotMatch(source, /CardDirectory/u);
	assert.match(source, /Personal agents that run routines, organize your context, and help you follow through\./u);
	assert.match(source, /AGENT_TEMPLATES_CATEGORIES/u);
	assert.match(source, /label: "Analyze"/u);
	assert.match(source, /label: "Brainstorm"/u);
	assert.match(source, /label: "Review"/u);
	assert.match(source, /label: "Summarize"/u);
	assert.match(source, /label: "Create"/u);
	assert.match(source, /label: "Execute"/u);
	assert.match(source, /label: "Find"/u);
	assert.match(source, /label: "Learn"/u);
	assert.match(source, /aria-pressed=\{active\}/u);
	assert.match(source, /AgentTemplatePlaceholderCard/u);
	assert.match(source, /scrollBy\(\{/u);
	assert.match(pageSource, /DEMO_AGENT_BROWSER_AGENTS/u);
	assert.match(pageSource, /attributionKind: "team"/u);
	assert.match(pageSource, /attributionKind: "person"/u);
	assert.match(defaultSidebarGroupsSource, /title: "By teams"/u);
	assert.match(defaultSidebarGroupsSource, /title: "By companies"/u);
});
