const test = require("node:test");
const assert = require("node:assert/strict");

const {
	shouldScheduleTimelineAutoCollapse,
	shouldScheduleCompletionAutoCollapse,
} = require("./reasoning-auto-collapse.ts");

test("does not schedule timeline auto-collapse when disabled", () => {
	assert.equal(
		shouldScheduleTimelineAutoCollapse({
			allowAutoCollapse: false,
			isStreaming: true,
			isOpen: true,
			hasAutoCollapsedAtCount: false,
			timelineEntryCount: 6,
			autoCollapseAtCount: 5,
		}),
		false
	);
});

test("does not schedule completion auto-collapse when disabled", () => {
	assert.equal(
		shouldScheduleCompletionAutoCollapse({
			allowAutoCollapse: false,
			hasEverStreamed: true,
			isStreaming: false,
			isOpen: true,
			hasAutoCollapsedOnCompletion: false,
		}),
		false
	);
});

test("schedules completion auto-collapse only after streaming completes", () => {
	assert.equal(
		shouldScheduleCompletionAutoCollapse({
			allowAutoCollapse: true,
			hasEverStreamed: true,
			isStreaming: false,
			isOpen: true,
			hasAutoCollapsedOnCompletion: false,
		}),
		true
	);

	assert.equal(
		shouldScheduleCompletionAutoCollapse({
			allowAutoCollapse: true,
			hasEverStreamed: true,
			isStreaming: true,
			isOpen: true,
			hasAutoCollapsedOnCompletion: false,
		}),
		false
	);
});
