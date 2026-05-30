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

test("Agent Templates renders the strategy dialog layout with card-directory cards", () => {
	const source = readProjectFile("components/blocks/agent-templates/components/agent-templates.tsx");
	const pageSource = readProjectFile("components/blocks/agent-templates/page.tsx");
	const demoAgentsSource = readProjectFile("components/blocks/agent-templates/data/demo-template-agents.ts");
	const defaultSidebarGroupsSource = readProjectFile("components/blocks/agent-templates/data/sidebar-groups.ts");

	assert.doesNotMatch(source, /AgentBrowserDialog/u);
	assert.match(source, /Personal agents that run routines, organize your context, and help you follow through\./u);
	assert.match(source, /AGENT_TEMPLATES_CATEGORIES/u);
	assert.match(source, /label: "Projects"/u);
	assert.match(source, /label: "Admin"/u);
	assert.match(source, /label: "Content"/u);
	assert.match(source, /label: "Analytics"/u);
	assert.match(source, /label: "Development"/u);
	assert.match(source, /label: "Support"/u);
	assert.match(source, /label: "Design"/u);
	assert.match(source, /label: "Security"/u);
	assert.match(source, /label: "People"/u);
	assert.match(source, /label: "Sales"/u);
	assert.match(source, /aria-pressed=\{active\}/u);
	// Carousel cards now render via the card-directory expanded agent card.
	assert.match(source, /AgentTemplateCard/u);
	assert.match(source, /CardDirectoryAgentExpanded/u);
	assert.match(source, /deriveAgentPublisher/u);
	assert.match(source, /scrollBy\(\{/u);
	// The page wires the carousel to the block-local rich demo dataset.
	assert.match(pageSource, /DEMO_AGENT_TEMPLATES/u);
	assert.match(pageSource, /DEMO_AGENT_TEMPLATES_SESSION/u);
	// Demo agents carry the expanded-card detail the cards render.
	assert.match(demoAgentsSource, /capabilities:/u);
	assert.match(demoAgentsSource, /sources:/u);
	assert.match(demoAgentsSource, /skills:/u);
	assert.match(demoAgentsSource, /attributionKind: "team"/u);
	assert.match(demoAgentsSource, /attributionKind: "person"/u);
	assert.match(defaultSidebarGroupsSource, /title: "By teams"/u);
	assert.match(defaultSidebarGroupsSource, /title: "By companies"/u);
});
