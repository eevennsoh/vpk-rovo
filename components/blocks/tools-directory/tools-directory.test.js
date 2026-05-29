const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

function readProjectFile(relativePath) {
	return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

test("Tools Directory is exposed as a website block", () => {
	assert.match(
		readProjectFile("app/data/components.ts"),
		/blockComponent\("tools-directory", "Tools Directory"\)/u,
	);
	assert.match(
		readProjectFile("app/data/component-manifest.ts"),
		/blockComponent\("tools-directory", "Tools Directory"\)/u,
	);
	assert.match(
		readProjectFile("app/data/details/blocks.ts"),
		/import \{ ToolsDirectoryDialog \} from "@\/components\/blocks\/tools-directory";/u,
	);
	assert.match(
		readProjectFile("components/website/registry.ts"),
		/"tools-directory": dynamic\(\s*\(\) => import\("\.\/demos\/blocks\/tools-directory-demo"\)/u,
	);
});

test("Tools Directory docs demo starts closed until the trigger is clicked", () => {
	assert.match(
		readProjectFile("components/blocks/tools-directory/page.tsx"),
		/const \[open, setOpen\] = useState\(false\);/u,
	);
});

test("Tools Directory duplicates the Agents Directory browser wrapper", () => {
	const source = readProjectFile("components/blocks/tools-directory/components/tools-directory.tsx");

	assert.match(source, /import \{\s*AgentBrowserDialog,[\s\S]*type AgentBrowserAgent,[\s\S]*type AgentBrowserSidebarGroup,[\s\S]*\} from "@\/components\/blocks\/agent-browser";/u);
	assert.match(source, /export type ToolsDirectoryTool = AgentBrowserAgent;/u);
	assert.match(source, /export type ToolsDirectorySidebarGroup = AgentBrowserSidebarGroup;/u);
	assert.match(source, /const directoryTools = useMemo\(\s*\(\) => \[\.\.\.tools, \.\.\.sessionTools\],[\s\S]*\[tools, sessionTools\],[\s\S]*\);/u);
	assert.match(source, /<AgentBrowserDialog[\s\S]*title=\{title \?\? "Browse tools"\}[\s\S]*agents=\{directoryTools\}[\s\S]*onSelectAgent=\{onSelectTool\}[\s\S]*sidebarGroups=\{sidebarGroups\}/u);
});
