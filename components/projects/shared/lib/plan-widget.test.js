const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const esbuild = require("esbuild");
const { loadCjsModuleFromText } = require(path.join(process.cwd(), "scripts/lib/esbuild-cjs-loader.js"));

function loadPlanWidgetHarness() {
	const result = esbuild.buildSync({
		stdin: {
			contents: `
				export {
					buildExitPlanModeDeferredToolResponse,
					fetchEnrichedPlanTitle,
					getLatestPlanWidgetPayload,
					getLatestPendingPlanWidget,
					parsePlanWidgetPayload,
					updatePlanWidgetMetadataInMessages,
				} from "./components/projects/shared/lib/plan-widget";
			`,
			loader: "ts",
			resolveDir: process.cwd(),
			sourcefile: "plan-widget-harness.ts",
		},
		bundle: true,
		format: "cjs",
		platform: "node",
		tsconfig: path.join(process.cwd(), "tsconfig.json"),
		write: false,
	});

	return loadCjsModuleFromText(result.outputFiles[0].text);
}

const {
	buildExitPlanModeDeferredToolResponse,
	fetchEnrichedPlanTitle,
	getLatestPlanWidgetPayload,
	getLatestPendingPlanWidget,
	parsePlanWidgetPayload,
	updatePlanWidgetMetadataInMessages,
} = loadPlanWidgetHarness();

function createAssistantMessage(parts) {
	return {
		role: "assistant",
		id: `assistant-${Math.random().toString(36).slice(2, 8)}`,
		parts,
	};
}

function createUserMessage() {
	return {
		role: "user",
		id: `user-${Math.random().toString(36).slice(2, 8)}`,
		parts: [{ type: "text", text: "Accepted the plan." }],
	};
}

function createPlanWidgetPart(overrides = {}) {
	return {
		type: "data-widget-data",
		data: {
			type: "plan",
			payload: {
				title: "Sprint Board Plan",
				tasks: [
					{ id: "task-1", label: "Create board shell" },
					{ id: "task-2", label: "Add drag and drop" },
				],
				...overrides,
			},
		},
	};
}

function createGenuiWidgetPart() {
	return {
		type: "data-widget-data",
		data: {
			type: "genui-preview",
			payload: {
				spec: {
					root: "main",
					elements: {},
				},
			},
		},
	};
}

test("getLatestPlanWidgetPayload keeps the latest plan when a newer non-plan widget exists in the same message", () => {
	const messages = [
		createAssistantMessage([
			createPlanWidgetPart(),
			createGenuiWidgetPart(),
		]),
	];

	const payload = getLatestPlanWidgetPayload(messages);
	assert.ok(payload);
	assert.equal(payload.title, "Sprint Board Plan");
	assert.equal(payload.tasks.length, 2);
	assert.equal(payload.tasks[0].id, "task-1");
});

test("getLatestPlanWidgetPayload continues scanning earlier messages when the newest message has only non-plan widgets", () => {
	const messages = [
		createAssistantMessage([createPlanWidgetPart({ title: "Older plan" })]),
		createAssistantMessage([createGenuiWidgetPart()]),
	];

	const payload = getLatestPlanWidgetPayload(messages);
	assert.ok(payload);
	assert.equal(payload.title, "Older plan");
	assert.equal(payload.tasks.length, 2);
});

test("getLatestPlanWidgetPayload returns null when no valid plan widget exists", () => {
	const messages = [
		createAssistantMessage([createGenuiWidgetPart()]),
	];

	assert.equal(getLatestPlanWidgetPayload(messages), null);
});

test("getLatestPendingPlanWidget returns the latest deferred plan until the user responds", () => {
	const olderPlan = createAssistantMessage([
		createPlanWidgetPart({
			title: "Older plan",
			deferredToolCallId: "ai-gateway-exit_plan_mode-old",
		}),
	]);
	const latestPlan = createAssistantMessage([
		createPlanWidgetPart({
			title: "Current plan",
			deferredToolCallId: "ai-gateway-exit_plan_mode-current",
		}),
	]);

	const pending = getLatestPendingPlanWidget([olderPlan, latestPlan]);
	assert.ok(pending);
	assert.equal(pending.sourceMessageId, latestPlan.id);
	assert.equal(
		pending.planWidget.deferredToolCallId,
		"ai-gateway-exit_plan_mode-current",
	);

	assert.equal(
		getLatestPendingPlanWidget([olderPlan, latestPlan, createUserMessage()]),
		null,
	);
});

test("parsePlanWidgetPayload preserves both generic and legacy tool call ids", () => {
	const payload = parsePlanWidgetPayload({
		type: "plan",
		tool_call_id: "tool-call-123",
		title: "Sprint Board Plan",
		markdown: "# Sprint Board Plan\n\n1. Create board shell",
		tasks: [{ id: "task-1", label: "Create board shell" }],
	});

	assert.ok(payload);
	assert.equal(payload.toolCallId, "tool-call-123");
	assert.equal(payload.deferredToolCallId, "tool-call-123");
	assert.equal(payload.markdown, "# Sprint Board Plan\n\n1. Create board shell");
});

test("parsePlanWidgetPayload accepts raw markdown plans without tasks", () => {
	const payload = parsePlanWidgetPayload({
		tool_call_id: "tool-call-456",
		plan: "# Raw Plan\n\nDo the work in this order.",
	});

	assert.ok(payload);
	assert.equal(payload.title, "Plan");
	assert.equal(payload.markdown, "# Raw Plan\n\nDo the work in this order.");
	assert.deepEqual(payload.tasks, []);
	assert.equal(payload.deferredToolCallId, "tool-call-456");
});

test("buildExitPlanModeDeferredToolResponse preserves the deferred tool call id", () => {
	assert.deepEqual(
		buildExitPlanModeDeferredToolResponse(
			{
				title: "Current plan",
				markdown: "# Current plan",
				tasks: [{ id: "task-1", label: "Build it", blockedBy: [] }],
				agents: [],
				deferredToolCallId: "ai-gateway-exit_plan_mode-current",
			},
			"  Accept.  ",
		),
		{
			tool_call_id: "ai-gateway-exit_plan_mode-current",
			result: "Accept.",
		},
	);

	assert.equal(
		buildExitPlanModeDeferredToolResponse(
			{
				title: "Current plan",
				markdown: "# Current plan",
				tasks: [],
				agents: [],
			},
			"Accept.",
		),
		null,
	);
});

test("parsePlanWidgetPayload preserves shortDescription when present", () => {
	const payload = parsePlanWidgetPayload({
		title: "Sprint Board Plan",
		shortDescription: "Kanban board for sprint work",
		description: "Build a sprint board with drag-and-drop planning.",
		tasks: [{ id: "task-1", label: "Create board shell" }],
	});

	assert.ok(payload);
	assert.equal(payload.shortDescription, "Kanban board for sprint work");
	assert.equal(payload.description, "Build a sprint board with drag-and-drop planning.");
});

test("updatePlanWidgetMetadataInMessages patches the targeted plan widget payload", () => {
	const untouchedMessage = createAssistantMessage([createPlanWidgetPart({ title: "Older plan" })]);
	const targetMessage = createAssistantMessage([createPlanWidgetPart()]);
	const messages = [untouchedMessage, targetMessage];

	const updatedMessages = updatePlanWidgetMetadataInMessages(messages, {
		sourceMessageId: targetMessage.id,
		title: "Sprint Tracking App",
		shortDescription: "Track sprint work on a board",
	});

	assert.notEqual(updatedMessages, messages);
	assert.equal(updatedMessages[0], untouchedMessage);
	assert.notEqual(updatedMessages[1], targetMessage);

	const updatedPayload = updatedMessages[1].parts[0].data.payload;
	assert.equal(updatedPayload.title, "Sprint Tracking App");
	assert.equal(updatedPayload.shortDescription, "Track sprint work on a board");
	assert.equal(updatedMessages[0].parts[0].data.payload.title, "Older plan");
});

test("fetchEnrichedPlanTitle reads shortDescription from the API response", async () => {
	const originalFetch = global.fetch;
	global.fetch = async (_input, init) => {
		const body = JSON.parse(String(init?.body ?? "{}"));
		assert.equal(body.title, "Plan");
		assert.equal(body.description, "Build a board");
		assert.equal(body.markdown, "# Sprint Board Plan\n\nBuild a board");
		assert.deepEqual(body.tasks, ["Create board shell"]);

		return {
			ok: true,
			json: async () => ({
				title: "Sprint Tracking App",
				shortDescription: "Track sprint work on a board",
			}),
		};
	};

	try {
		const result = await fetchEnrichedPlanTitle({
			title: "Plan",
			description: "Build a board",
			shortDescription: undefined,
			markdown: "# Sprint Board Plan\n\nBuild a board",
			tasks: [{ id: "task-1", label: "Create board shell", blockedBy: [] }],
			agents: [],
		});

		assert.deepEqual(result, {
			title: "Sprint Tracking App",
			shortDescription: "Track sprint work on a board",
		});
	} finally {
		global.fetch = originalFetch;
	}
});
