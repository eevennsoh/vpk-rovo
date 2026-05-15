const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const CHAT_PANEL_FILE = path.join(__dirname, "page.tsx");
const CHAT_PANEL_SOURCE = fs.readFileSync(CHAT_PANEL_FILE, "utf8");

function extractSlice(startMarker, endMarker) {
	const startIndex = CHAT_PANEL_SOURCE.indexOf(startMarker);
	assert.notEqual(startIndex, -1, `Expected to find start marker: ${startMarker}`);

	const endIndex = CHAT_PANEL_SOURCE.indexOf(endMarker, startIndex);
	assert.notEqual(endIndex, -1, `Expected to find end marker: ${endMarker}`);

	return CHAT_PANEL_SOURCE.slice(startIndex, endIndex);
}

test("compact chat uses the shared pending-plan approval flow", () => {
	assert.match(
		CHAT_PANEL_SOURCE,
		/import \{ ApprovalCard \} from "@\/components\/blocks\/approval-card\/page";/,
	);
	assert.match(
		CHAT_PANEL_SOURCE,
		/getLatestPendingPlanWidget\(rawUiMessages\)/,
	);
	assert.match(
		CHAT_PANEL_SOURCE,
		/const \[dismissedApprovalCardKey, setDismissedApprovalCardKey\] = useState<string \| null>\(null\);/,
	);
	assert.match(
		CHAT_PANEL_SOURCE,
		/submitPlanApproval\(activePendingPlan\.planWidget, selection\)/,
	);
});

test("compact chat renders approval card before falling back to the composer", () => {
	const approvalBranch = extractSlice(
		") : shouldShowApprovalCard && activePendingPlan ? (",
		") : (",
	);

	assert.match(approvalBranch, /<ApprovalCard/);
	assert.match(approvalBranch, /onDismiss=\{handleDismissApprovalCard\}/);
	assert.match(approvalBranch, /onSelect=\{handlePlanApprovalSubmit\}/);
	assert.match(
		approvalBranch,
		/<QuestionCardShortcutsFooter escLabel="cancel" \/>/,
	);
});
