const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const AGENTS_DEMO_SOURCE = fs.readFileSync(path.join(__dirname, "agents-demo.tsx"), "utf8");

test("AgentsDemo owns work item presentation so layout chat switches can promote modals", () => {
	assert.match(
		AGENTS_DEMO_SOURCE,
		/import \{ useAgentsWorkItemPresentation \} from "@\/components\/projects\/agents\/hooks\/use-agents-work-item-presentation";/u,
	);
	assert.match(
		AGENTS_DEMO_SOURCE,
		/const workItemPresentation = useAgentsWorkItemPresentation\(\);/u,
	);
});

test("AgentsDemo promotes the open modal before switching floating chat to the sidebar", () => {
	assert.match(
		AGENTS_DEMO_SOURCE,
		/if\s*\(\s*surface\s*!==\s*"sidebar"\s*\)\s*return;\s*promoteModalToInline\(\);/u,
	);
	assert.match(
		AGENTS_DEMO_SOURCE,
		/onChatSurfaceSwitch=\{handleChatSurfaceSwitch\}/u,
	);
	assert.match(
		AGENTS_DEMO_SOURCE,
		/<AgentsView workItemPresentation=\{workItemPresentation\} \/>/u,
	);
});

test("AgentsDemo closes the work item modal before opening an artifact dialog", () => {
	assert.match(
		AGENTS_DEMO_SOURCE,
		/const\s+\{\s*closeModal,\s*promoteModalToInline\s*\}\s*=\s*workItemPresentation;/u,
	);
	assert.match(
		AGENTS_DEMO_SOURCE,
		/const isWorkItemModalOpen = workItemPresentation\.state\.mode === "modal";/u,
	);
	assert.match(
		AGENTS_DEMO_SOURCE,
		/const handleArtifactDialogOpen = useCallback\(\(\) => \{\s*if \(!isWorkItemModalOpen\) return;\s*closeModal\(\);\s*\}, \[closeModal, isWorkItemModalOpen\]\);/u,
	);
	assert.match(
		AGENTS_DEMO_SOURCE,
		/onArtifactDialogOpen=\{handleArtifactDialogOpen\}/u,
	);
	assert.match(
		AGENTS_DEMO_SOURCE,
		/preserveFloatingSurfaceOnArtifactDialogOpen=\{isWorkItemModalOpen\}/u,
	);
});
