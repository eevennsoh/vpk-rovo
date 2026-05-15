const assert = require("node:assert/strict");
const test = require("node:test");

const {
	INITIAL_JIRA_WORK_ITEM_PRESENTATION_STATE,
	jiraWorkItemPresentationReducer,
} = require("./jira-work-item-presentation.ts");

const WORK_ITEM = {
	title: "Qualify global ITSM platform replacement RFP",
	code: "RFP-101",
};

test("jira work item presentation opens selected cards in the modal", () => {
	assert.deepEqual(
		jiraWorkItemPresentationReducer(INITIAL_JIRA_WORK_ITEM_PRESENTATION_STATE, {
			type: "open-modal",
			workItem: WORK_ITEM,
		}),
		{
			mode: "modal",
			workItem: WORK_ITEM,
		},
	);
});

test("jira work item presentation closes the modal back to the board", () => {
	const modalState = {
		mode: "modal",
		workItem: WORK_ITEM,
	};

	assert.deepEqual(
		jiraWorkItemPresentationReducer(modalState, { type: "close-modal" }),
		INITIAL_JIRA_WORK_ITEM_PRESENTATION_STATE,
	);
});

test("jira work item presentation promotes an open modal to an inline work item page", () => {
	const modalState = {
		mode: "modal",
		workItem: WORK_ITEM,
	};

	assert.deepEqual(
		jiraWorkItemPresentationReducer(modalState, { type: "promote-modal-to-inline" }),
		{
			mode: "inline",
			workItem: WORK_ITEM,
		},
	);
});

test("jira work item presentation does not promote when no modal work item is active", () => {
	assert.deepEqual(
		jiraWorkItemPresentationReducer(INITIAL_JIRA_WORK_ITEM_PRESENTATION_STATE, {
			type: "promote-modal-to-inline",
		}),
		INITIAL_JIRA_WORK_ITEM_PRESENTATION_STATE,
	);

	const inlineState = {
		mode: "inline",
		workItem: WORK_ITEM,
	};

	assert.deepEqual(
		jiraWorkItemPresentationReducer(inlineState, { type: "promote-modal-to-inline" }),
		inlineState,
	);
});
