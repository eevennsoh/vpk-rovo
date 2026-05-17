const assert = require("node:assert/strict");
const path = require("node:path");
const test = require("node:test");
const esbuild = require("esbuild");
const { loadCjsModuleFromText } = require(path.join(process.cwd(), "scripts/lib/esbuild-cjs-loader.js"));

async function loadRovoAppTimelineHarness() {
	const result = await esbuild.build({
		stdin: {
			contents: `
				export { deriveRovoAppTimelineItems } from "./components/projects/rovo/lib/rovo-app-timeline";
			`,
			loader: "ts",
			resolveDir: process.cwd(),
			sourcefile: "rovo-app-timeline-harness.ts",
		},
		bundle: true,
		format: "cjs",
		platform: "node",
		tsconfig: path.join(process.cwd(), "tsconfig.json"),
		write: false,
	});

	return loadCjsModuleFromText(result.outputFiles[0].text);
}

function formatExpectedTimestamp(timestamp) {
	return new Intl.DateTimeFormat("en-US", {
		timeStyle: "short",
	}).format(new Date(timestamp));
}

test("derives newest-first timeline items from visible user prompts only", async () => {
	const { deriveRovoAppTimelineItems } = await loadRovoAppTimelineHarness();
	const items = deriveRovoAppTimelineItems([
		{
			id: "user-1",
			role: "user",
			metadata: {
				createdAt: "2026-03-31T09:15:00.000Z",
			},
			parts: [{ type: "text", text: "First visible prompt", state: "done" }],
		},
		{
			id: "assistant-1",
			role: "assistant",
			metadata: {
				createdAt: "2026-03-31T09:16:00.000Z",
			},
			parts: [{ type: "text", text: "Assistant reply", state: "done" }],
		},
		{
			id: "user-hidden",
			role: "user",
			metadata: {
				createdAt: "2026-03-31T09:17:00.000Z",
				visibility: "hidden",
			},
			parts: [{ type: "text", text: "Hidden prompt", state: "done" }],
		},
		{
			id: "user-2",
			role: "user",
			metadata: {
				createdAt: "2026-03-31T09:18:00.000Z",
			},
			parts: [{ type: "text", text: "Newest visible prompt", state: "done" }],
		},
	]);

	assert.deepEqual(
		items,
		[
			{
				id: "user-2",
				label: "Prompt 2",
				text: "Newest visible prompt",
				timestampLabel: formatExpectedTimestamp("2026-03-31T09:18:00.000Z"),
			},
			{
				id: "user-1",
				label: "Prompt 1",
				text: "First visible prompt",
				timestampLabel: formatExpectedTimestamp("2026-03-31T09:15:00.000Z"),
			},
		],
	);
});

test("falls back to updatedAt when createdAt is missing or invalid", async () => {
	const { deriveRovoAppTimelineItems } = await loadRovoAppTimelineHarness();
	const items = deriveRovoAppTimelineItems([
		{
			id: "user-updated",
			role: "user",
			metadata: {
				createdAt: "not-a-date",
				updatedAt: "2026-03-31T11:45:00.000Z",
			},
			parts: [{ type: "text", text: "Uses updated timestamp", state: "done" }],
		},
	]);

	assert.deepEqual(items, [
		{
			id: "user-updated",
			label: "Prompt 1",
			text: "Uses updated timestamp",
			timestampLabel: formatExpectedTimestamp("2026-03-31T11:45:00.000Z"),
		},
	]);
});

test("reuses one timestamp formatter across timeline derivations", async () => {
	let formatterConstructs = 0;
	const OriginalDateTimeFormat = Intl.DateTimeFormat;

	function PatchedDateTimeFormat(...args) {
		formatterConstructs += 1;
		return new OriginalDateTimeFormat(...args);
	}
	PatchedDateTimeFormat.prototype = OriginalDateTimeFormat.prototype;

	try {
		Intl.DateTimeFormat = PatchedDateTimeFormat;
		const { deriveRovoAppTimelineItems } = await loadRovoAppTimelineHarness();
		const messages = Array.from({ length: 6 }, (_, index) => ({
			id: `user-${index}`,
			role: "user",
			metadata: {
				createdAt: new Date(Date.UTC(2026, 2, 31, 9, index)).toISOString(),
			},
			parts: [{ type: "text", text: `Prompt ${index}`, state: "done" }],
		}));

		deriveRovoAppTimelineItems(messages);
		deriveRovoAppTimelineItems(messages);

		assert.equal(formatterConstructs, 1);
	} finally {
		Intl.DateTimeFormat = OriginalDateTimeFormat;
	}
});
