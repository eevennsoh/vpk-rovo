const assert = require("node:assert/strict");
const test = require("node:test");

const {
	INITIAL_AGENTS_WORK_ITEM_PRESENTATION_STATE,
	agentsWorkItemPresentationReducer,
} = require("./agents-work-item-presentation.ts");

const WORK_ITEM = {
	title: "Live demo: Define live-demo-first landing page narrative",
	code: "OMNI-101",
};

test("agents2 work item presentation opens selected Omni Live cards in the modal", () => {
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

test("agents2 work item presentation promotes an open modal to inline", () => {
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
