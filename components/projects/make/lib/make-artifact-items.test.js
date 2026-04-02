const test = require("node:test");
const assert = require("node:assert/strict");
const {
	selectMakeArtifactRuns,
	mapRunsToMakeGalleryItems,
	mapRunsToSidebarAppItems,
} = require("./make-artifact-items.ts");

function createRun(overrides = {}) {
	return {
		runId: "run-1",
		status: "completed",
		error: null,
		createdAt: "2026-03-01T09:00:00.000Z",
		updatedAt: "2026-03-01T10:00:00.000Z",
		completedAt: "2026-03-01T10:01:00.000Z",
		plan: {
			title: "Build release dashboard",
			description: "Create a release readiness dashboard",
			emoji: "🚀",
			agents: ["Planner"],
			tasks: [
				{
					id: "task-1",
					label: "Build release dashboard",
					agent: "Planner",
					blockedBy: [],
				},
			],
		},
		tasks: [
			{
				id: "task-1",
				label: "Build release dashboard",
				agentName: "Planner",
				agentId: "planner",
				blockedBy: [],
				status: "done",
				attempts: 1,
				startedAt: null,
				completedAt: null,
				error: null,
				output: null,
				outputSummary: null,
			},
		],
		...overrides,
	};
}

test("selectMakeArtifactRuns keeps only running/completed runs", () => {
	const runs = [
		createRun({ runId: "run-completed", status: "completed" }),
		createRun({ runId: "run-running", status: "running" }),
		createRun({ runId: "run-failed", status: "failed" }),
	];

	const selected = selectMakeArtifactRuns(runs);

	assert.deepEqual(
		selected.map((run) => run.runId),
		["run-running", "run-completed"],
	);
});

test("selectMakeArtifactRuns sorts by recency", () => {
	const runs = [
		createRun({
			runId: "older",
			status: "completed",
			updatedAt: "2026-03-01T10:00:00.000Z",
			createdAt: "2026-03-01T09:00:00.000Z",
		}),
		createRun({
			runId: "newer",
			status: "completed",
			updatedAt: "2026-03-01T11:00:00.000Z",
			createdAt: "2026-03-01T10:30:00.000Z",
		}),
	];

	const selected = selectMakeArtifactRuns(runs);
	assert.deepEqual(selected.map((run) => run.runId), ["newer", "older"]);
});

test("gallery and sidebar mappings preserve exact run identity", () => {
	const runs = [
		createRun({
			runId: "run-xyz",
			status: "completed",
			updatedAt: "2026-03-01T12:00:00.000Z",
		}),
	];

	const galleryItems = mapRunsToMakeGalleryItems(runs);
	const sidebarItems = mapRunsToSidebarAppItems(runs);

	assert.equal(galleryItems.length, 1);
	assert.equal(sidebarItems.length, 1);
	assert.equal(galleryItems[0].id, "run-xyz");
	assert.equal(galleryItems[0].runMeta.runId, "run-xyz");
	assert.equal(sidebarItems[0].runId, "run-xyz");
	assert.equal(galleryItems[0].title, sidebarItems[0].title);
});

test("gallery descriptions prefer shortDescription when available", () => {
	const galleryItems = mapRunsToMakeGalleryItems([
		createRun({
			plan: {
				title: "Build release dashboard",
				description: "Create a release readiness dashboard with implementation details.",
				shortDescription: "Track release readiness across teams",
				emoji: "🚀",
				agents: ["Planner"],
				tasks: [
					{
						id: "task-1",
						label: "Build release dashboard",
						agent: "Planner",
						blockedBy: [],
					},
				],
			},
		}),
	]);

	assert.equal(galleryItems[0]?.description, "1 step • Track release readiness across teams");
});
