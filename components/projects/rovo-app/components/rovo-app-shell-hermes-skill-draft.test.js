const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const SHELL_FILE = path.join(__dirname, "rovo-app-shell.tsx");
const SHELL_SOURCE = fs.readFileSync(SHELL_FILE, "utf8");

function extractSlice(startMarker, endMarker) {
	const startIndex = SHELL_SOURCE.indexOf(startMarker);
	assert.notEqual(startIndex, -1, `Expected to find start marker: ${startMarker}`);

	const endIndex = SHELL_SOURCE.indexOf(endMarker, startIndex);
	assert.notEqual(endIndex, -1, `Expected to find end marker: ${endMarker}`);

	return SHELL_SOURCE.slice(startIndex, endIndex);
}

test("RovoAppShell tracks active Hermes skill draft review state", () => {
	assert.match(
		SHELL_SOURCE,
		/const \[activePendingSkillDraftIndex, setActivePendingSkillDraftIndex\] = useState\(0\);/,
	);
	assert.match(
		SHELL_SOURCE,
		/const \[activePendingSkillDraftDetail, setActivePendingSkillDraftDetail\] = useState<HermesSkillDraftDetail \| null>\(null\);/,
	);
	assert.match(
		SHELL_SOURCE,
		/const \[submittingSkillDraftId, setSubmittingSkillDraftId\] = useState<string \| null>\(null\);/,
	);
	assert.match(
		SHELL_SOURCE,
		/const activePendingSkillDraft =\s*\n\t\t\tpendingThreadSkillDrafts\[activePendingSkillDraftIndex\] \?\? pendingThreadSkillDrafts\[0\] \?\? null;/,
	);
});

test("RovoAppShell renders the Hermes skill draft review bar inline with composer controls", () => {
	const regularComposerBranch = extractSlice(
		"{chat.activeToolApproval ? (",
		"<motion.div",
	);

	assert.match(regularComposerBranch, /<RovoAppToolApprovalBar/);
	assert.match(regularComposerBranch, /activePendingSkillDraft \? \(/);
	assert.match(regularComposerBranch, /<RovoAppHermesSkillDraftBar/);
	assert.match(regularComposerBranch, /onApprove=\{handleHermesSkillDraftApprove\}/);
	assert.match(regularComposerBranch, /onReject=\{handleHermesSkillDraftReject\}/);
	assert.match(regularComposerBranch, /onOpenReview=\{handleOpenHermesSkillDraftReview\}/);
});
