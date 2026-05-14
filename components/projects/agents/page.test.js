const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const AGENTS_VIEW_SOURCE = fs.readFileSync(path.join(__dirname, "page.tsx"), "utf8");

test("AgentsView reads chat surface pin state from useRovoChat", () => {
	assert.match(
		AGENTS_VIEW_SOURCE,
		/const\s+\{\s*[^}]*\bchatSurface\b[^}]*\bisFloatingPinned\b[^}]*\bpinFloating\b[^}]*\bunpinFloating\b[^}]*\}\s*=\s*useRovoChat\(\)/u,
	);
});

test("AgentsView promotes the modal to inline when pinned floating chat switches to sidebar", () => {
	const promoteEffectPattern =
		/useEffect\(\(\)\s*=>\s*\{\s*if\s*\(\s*!isModalOpen\s*\|\|\s*chatSurface\s*!==\s*"sidebar"\s*\|\|\s*!isFloatingPinned\s*\)\s*return;\s*promoteModalToInline\(\);\s*\},\s*\[\s*isModalOpen,\s*chatSurface,\s*isFloatingPinned,\s*promoteModalToInline\s*\]\);/u;
	assert.match(AGENTS_VIEW_SOURCE, promoteEffectPattern);
});

test("AgentsView renders selected work item inline after promotion", () => {
	assert.match(
		AGENTS_VIEW_SOURCE,
		/import \{ AgentsWorkItemInlinePage \} from "\.\/components\/agents-work-item-inline-page";/u,
	);
	assert.match(
		AGENTS_VIEW_SOURCE,
		/if\s*\(\s*presentationState\.mode\s*===\s*"inline"\s*&&\s*selectedWorkItem\s*\)\s*\{[\s\S]*<AgentsWorkItemInlinePage[\s\S]*workItem=\{selectedWorkItem\}[\s\S]*onBackToBoard=\{workItemPresentation\.backToBoard\}/u,
	);
});
