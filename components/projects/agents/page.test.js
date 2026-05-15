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

test("AgentsView keeps column agent assignment state local to the board", () => {
	assert.match(
		AGENTS_VIEW_SOURCE,
		/import \{ BOARD_AGENTS \} from "\.\/data\/board-agents";/u,
	);
	assert.match(
		AGENTS_VIEW_SOURCE,
		/const\s+\[columnAgentAssignments,\s*setColumnAgentAssignments\]\s*=\s*useState<Record<string,\s*string\[\]>>\(\{\}\);/u,
	);
	assert.match(
		AGENTS_VIEW_SOURCE,
		/assignedAgentIdsByColumn=\{columnAgentAssignments\}/u,
	);
	assert.match(
		AGENTS_VIEW_SOURCE,
		/onToggleColumnAgent=\{handleToggleColumnAgent\}/u,
	);
});

test("AgentsView create-agent CTA opens Rovo chat in agent creation mode", () => {
	assert.match(
		AGENTS_VIEW_SOURCE,
		/\bopenChat\("floating"\);/u,
	);
	assert.match(
		AGENTS_VIEW_SOURCE,
		/sendPrompt\([\s\S]*Create an agent for the \$\{columnTitle\} column[\s\S]*creationMode:\s*"agent"[\s\S]*contextDescription/u,
	);
});
