const test = require("node:test");
const assert = require("node:assert/strict");

const {
	createTaskPrompt,
	buildBatchOrchestrationPrompt,
	resolveAppShellPolicy,
} = require("./make-runs");

function createRun(overrides = {}) {
	const task = {
		id: "task-1",
		label: "Build triage dashboard surface",
		agentName: "UI Agent",
		agentId: "ui-agent",
		blockedBy: [],
		status: "todo",
		output: null,
		...overrides.task,
	};

	return {
		id: "run-1",
		plan: {
			title: "Build work triage dashboard",
			description: "Create a focused dashboard for queue management.",
			agents: ["UI Agent"],
			tasks: [
				{
					id: task.id,
					label: task.label,
					agent: task.agentName,
					blockedBy: task.blockedBy,
				},
			],
		},
		tasks: [task],
		directives: [],
		appSlug: "work-triage-dashboard",
		sourceSurface: "future-chat",
		appShellPolicy: "embedded_feature",
		...overrides,
	};
}

test("createTaskPrompt adds Future Chat embedded-feature shell rules", () => {
	const run = createRun();
	const prompt = createTaskPrompt(run, run.tasks[0], [], [], []);

	assert.match(prompt, /Future Chat preview shell policy/u);
	assert.match(prompt, /mini feature or app widget, not a full product shell/u);
	assert.match(prompt, /@\/components\/projects\/page \(AppLayout\)/u);
	assert.match(prompt, /@\/components\/blocks\/top-navigation\/page/u);
	assert.match(prompt, /@\/components\/blocks\/product-sidebar\/page/u);
	assert.match(prompt, /@\/components\/projects\/shared\/components\/floating-rovo-button/u);
	assert.match(prompt, /@\/components\/projects\/fullscreen-chat/u);
});

test("buildBatchOrchestrationPrompt adds the same Future Chat shell rules", () => {
	const run = createRun();
	const laneAssignments = new Map([
		[
			"task-1",
			{
				agentId: "ui-agent",
				agentName: "UI Agent",
			},
		],
	]);

	const prompt = buildBatchOrchestrationPrompt(
		run,
		run.tasks,
		laneAssignments,
		new Map(),
	);

	assert.match(prompt, /Future Chat preview shell policy/u);
	assert.match(prompt, /mini feature or app widget, not a full product shell/u);
	assert.match(prompt, /@\/components\/projects\/page \(AppLayout\)/u);
	assert.match(prompt, /@\/components\/blocks\/top-navigation\/page/u);
	assert.match(prompt, /@\/components\/blocks\/product-sidebar\/page/u);
	assert.match(prompt, /@\/components\/projects\/shared\/components\/floating-rovo-button/u);
	assert.match(prompt, /@\/components\/projects\/fullscreen-chat/u);
});

test("standalone make runs keep file placement rules without Future Chat shell bans", () => {
	const run = createRun({
		sourceSurface: "make",
		appShellPolicy: "standalone_app",
	});
	const prompt = createTaskPrompt(run, run.tasks[0], [], [], []);

	assert.match(prompt, /Generated app rules/u);
	assert.doesNotMatch(prompt, /Future Chat preview shell policy/u);
	assert.doesNotMatch(prompt, /mini feature or app widget, not a full product shell/u);
});

test("Future Chat explicit shell prototype switches to standalone_app policy", () => {
	const result = resolveAppShellPolicy({
		sourceSurface: "future-chat",
		userPrompt: "Prototype the top navigation and product shell for this app.",
	});

	assert.deepEqual(result, {
		sourceSurface: "future-chat",
		appShellPolicy: "standalone_app",
	});
});

test("Future Chat defaults to embedded_feature when shell chrome is not requested", () => {
	const result = resolveAppShellPolicy({
		sourceSurface: "future-chat",
		userPrompt: "Build a work triage dashboard with filters and a backlog table.",
	});

	assert.deepEqual(result, {
		sourceSurface: "future-chat",
		appShellPolicy: "embedded_feature",
	});
});

test("Future Chat standalone_app prompts mention the explicit shell override", () => {
	const run = createRun({
		appShellPolicy: "standalone_app",
	});
	const prompt = createTaskPrompt(run, run.tasks[0], [], [], []);

	assert.match(prompt, /explicitly asked to prototype shell chrome/u);
	assert.match(prompt, /host shell elements are allowed for this run/u);
});
