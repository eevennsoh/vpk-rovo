const test = require("node:test");
const assert = require("node:assert/strict");

const {
	getRovoAppSidebarSurfacePreview,
} = require("./rovo-app-sidebar-surface-preview.ts");

test("builds the new chat preview with shortcut and blank-thread copy", () => {
	assert.deepEqual(
		getRovoAppSidebarSurfacePreview({
			label: "New chat",
			selected: false,
		}),
		{
			description:
				"Start a fresh conversation and route the next message into a blank thread.",
			footerLabel: "Action",
			footerValue: "Starts a fresh conversation",
			rows: [
				{ label: "Shortcut", value: "⌘⇧O" },
				{ label: "Thread", value: "Blank conversation" },
			],
			title: "New chat",
		},
	);
});

test("marks selected control-plane surfaces as the current section", () => {
	const preview = getRovoAppSidebarSurfacePreview({
		description: "Scheduled work and run history",
		label: "Jobs",
		selected: true,
	});

	assert.deepEqual(preview?.rows, [
		{ label: "Manage", value: "Run, pause, resume" },
		{ label: "Track", value: "Status, schedule, history" },
	]);
	assert.equal(preview?.description, "Scheduled work and run history");
	assert.equal(preview?.footerLabel, "Status");
	assert.equal(preview?.footerValue, "Current section");
	assert.equal(preview?.title, "Jobs");
});

test("returns null for unknown sidebar labels", () => {
	assert.equal(
		getRovoAppSidebarSurfacePreview({
			label: "Unknown",
			selected: false,
		}),
		null,
	);
});
