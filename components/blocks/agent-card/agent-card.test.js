const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

function readProjectFile(relativePath) {
	return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

test("Agent Card preview uses a direct route instead of the generic dynamic preview loader", () => {
	const source = readProjectFile("app/preview/blocks/agent-card/page.tsx");

	assert.match(
		source,
		/import AgentCardPage from "@\/components\/blocks\/agent-card\/page";/u,
	);
	assert.match(
		source,
		/import \{ getPreviewPageTitle \} from "@\/lib\/project-page-title";/u,
	);
	assert.match(source, /title: getPreviewPageTitle\("agent-card", "blocks"\),/u);
	assert.match(source, /return <AgentCardPage \/>;/u);
	assert.doesNotMatch(source, /RenderPreviewCategoryPage/u);
});
