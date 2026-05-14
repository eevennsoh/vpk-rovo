const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const JIRA_VIEW_SOURCE = fs.readFileSync(path.join(__dirname, "page.tsx"), "utf8");

test("JiraView reads chatSurface and isFloatingPinned from useRovoChat", () => {
	assert.match(
		JIRA_VIEW_SOURCE,
		/const\s+\{\s*[^}]*\bchatSurface\b[^}]*\bisFloatingPinned\b[^}]*\}\s*=\s*useRovoChat\(\)/u,
	);
});

test("JiraView reads promoteModalToInline from the presentation controller", () => {
	assert.match(
		JIRA_VIEW_SOURCE,
		/const\s+\{\s*state:\s*presentationState,\s*promoteModalToInline\s*\}\s*=\s*workItemPresentation;/u,
	);
});

test("JiraView promotes the modal to inline when the user switches the pinned floating chat back to the sidebar", () => {
	const promoteEffectPattern =
		/useEffect\(\(\)\s*=>\s*\{\s*if\s*\(\s*!isModalOpen\s*\|\|\s*chatSurface\s*!==\s*"sidebar"\s*\|\|\s*!isFloatingPinned\s*\)\s*return;\s*promoteModalToInline\(\);\s*\},\s*\[\s*isModalOpen,\s*chatSurface,\s*isFloatingPinned,\s*promoteModalToInline\s*\]\);/u;
	assert.match(JIRA_VIEW_SOURCE, promoteEffectPattern);
});
