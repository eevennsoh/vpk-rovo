const assert = require("node:assert/strict");
const test = require("node:test");

const {
	INITIAL_AGENTS_WORK_ITEM_PRESENTATION_STATE,
	agentsWorkItemPresentationReducer,
} = require("./agents-work-item-presentation.ts");

const WORK_ITEM = {
	title: "Qualify enterprise service-management RFP",
	code: "RFP-101",
};

test("agents work item presentation opens selected cards in the modal", () => {
	assert.deepEqual(
		agentsWorkItemPresentationReducer(INITIAL_AGENTS_WORK_ITEM_PRESENTATION_STATE, {
			type: "open-modal",
			workItem: WORK_ITEM,
		}),
		{
			mode: "modal",
			workItem: WORK_ITEM,
		},
	);
});

test("agents work item presentation closes the modal back to the board", () => {
	const modalState = {
		mode: "modal",
		workItem: WORK_ITEM,
	};

	assert.deepEqual(
		agentsWorkItemPresentationReducer(modalState, { type: "close-modal" }),
		INITIAL_AGENTS_WORK_ITEM_PRESENTATION_STATE,
	);
});

test("agents work item presentation promotes an open modal to an inline work item page", () => {
	const modalState = {
		mode: "modal",
		workItem: WORK_ITEM,
	};

	assert.deepEqual(
		agentsWorkItemPresentationReducer(modalState, { type: "promote-modal-to-inline" }),
		{
			mode: "inline",
			workItem: WORK_ITEM,
		},
	);
});

test("agents work item presentation does not promote when no modal work item is active", () => {
	assert.deepEqual(
		agentsWorkItemPresentationReducer(INITIAL_AGENTS_WORK_ITEM_PRESENTATION_STATE, {
			type: "promote-modal-to-inline",
		}),
		INITIAL_AGENTS_WORK_ITEM_PRESENTATION_STATE,
	);

	const inlineState = {
		mode: "inline",
		workItem: WORK_ITEM,
	};

	assert.deepEqual(
		agentsWorkItemPresentationReducer(inlineState, { type: "promote-modal-to-inline" }),
		inlineState,
	);
});
