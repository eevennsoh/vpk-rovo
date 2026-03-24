const test = require("node:test");
const assert = require("node:assert/strict");

const {
	extractPlanWidgetPayloadFromExitPlanToolInput,
	extractPlanWidgetPayloadFromText,
	extractProgressivePlanWidgetPayloadFromText,
	extractPlanWidgetPayloadFromStructuredText,
} = require("./plan-widget-fallback");

test("extracts tasks from action items section", () => {
	const input = `# Conference planning plan\n\nScope\n- In: Venue\n\nAction items\n- [ ] Define event goals\n- [ ] Secure venue\n- [ ] Create agenda\n\nNext section\n- Notes`;

	const result = extractPlanWidgetPayloadFromText(input);
	assert.ok(result);
	assert.equal(result.type, "plan");
	assert.equal(result.title, "Conference planning plan");
	assert.deepEqual(
		result.tasks.map((task) => task.label),
		["Define event goals", "Secure venue", "Create agenda"]
	);
});

test("extractPlanWidgetPayloadFromExitPlanToolInput parses JSON tool args", () => {
	const input = JSON.stringify({
		plan: [
			"# Data Visualization Dashboard",
			"",
			"## Tasks",
			"",
			"### Task 1: Create dashboard page and layout",
			"Set up the /dashboard route and layout.",
			"",
			"### Task 2: Build KPI metrics row",
			"Add a top row of Metric cards.",
		].join("\n"),
	});

	const result = extractPlanWidgetPayloadFromExitPlanToolInput(input, { minTasks: 1 });
	assert.ok(result);
	assert.equal(result.title, "Data Visualization Dashboard");
	assert.match(result.markdown, /# Data Visualization Dashboard/);
	assert.deepEqual(
		result.tasks.map((task) => task.label),
		["Create dashboard page and layout", "Build KPI metrics row"],
	);
});

test("supports unicode checklist bullets", () => {
	const input = `Plan\n\nAction items\n• ☐ Define event goals and format\n• ☐ Establish budget and sponsorship`;

	const result = extractPlanWidgetPayloadFromText(input);
	assert.ok(result);
	assert.equal(result.title, "Define event goals and format");
	assert.deepEqual(
		result.tasks.map((task) => task.label),
		[
			"Define event goals and format",
			"Establish budget and sponsorship",
		]
	);
});

test("falls back to first task heading when plan title is generic", () => {
	const input = `Plan

Action items
- [ ] Design onboarding flow — align activation milestones
- [ ] Validate onboarding copy`;

	const result = extractPlanWidgetPayloadFromText(input);
	assert.ok(result);
	assert.equal(result.title, "Design onboarding flow");
});

test("returns null when section has fewer than two tasks", () => {
	const input = `Action items\n- [ ] Only one task`;
	const result = extractPlanWidgetPayloadFromText(input);
	assert.equal(result, null);
});

test("returns null when no action items heading exists", () => {
	const input = `Plan\n- [ ] Task one\n- [ ] Task two`;
	const result = extractPlanWidgetPayloadFromText(input);
	assert.equal(result, null);
});

test("extracts tasks from scope in-list when action items heading is missing", () => {
	const input = `# Sprint board implementation plan

Scope
- In: 5-column Kanban board, drag-and-drop task movement, minimal task cards, in-memory state, responsive layout
- Out: Backend persistence, real-time collaboration`;

	const result = extractPlanWidgetPayloadFromText(input);
	assert.ok(result);
	assert.equal(result.type, "plan");
	assert.equal(result.title, "Sprint board implementation plan");
	assert.deepEqual(
		result.tasks.map((task) => task.label),
		[
			"5-column Kanban board",
			"drag-and-drop task movement",
			"minimal task cards",
			"in-memory state",
			"responsive layout",
		]
	);
});

test("extracts progressive plan payload without action items heading", () => {
	const input = `Conference rollout plan\n1. Define conference goals`;
	const result = extractProgressivePlanWidgetPayloadFromText(input);
	assert.ok(result);
	assert.equal(result.type, "plan");
	assert.equal(result.title, "Conference rollout plan");
	assert.deepEqual(
		result.tasks.map((task) => task.label),
		["Define conference goals"]
	);
});

test("progressive extractor replaces generic title with first task heading", () => {
	const input = `Execution plan
1. Deploy staging build
2. Validate smoke tests`;
	const result = extractProgressivePlanWidgetPayloadFromText(input);
	assert.ok(result);
	assert.equal(result.title, "Deploy staging build");
});

test("strict progressive mode ignores clarification-style numbered lists", () => {
	const input = `Let me get the create-plan skill to help
6 tasks
1. What is the AI project about?
2. A chatbot / conversational agent
3. An AI-powered feature within an existing app
4. A standalone AI application
5. Something else?`;

	const result = extractProgressivePlanWidgetPayloadFromText(input, {
		requireActionItemsHeading: true,
	});

	assert.equal(result, null);
});

test("strict progressive mode requires action-items heading and returns tasks", () => {
	const input = `Planning draft

Action items
1. Define conference goals
2. Secure venue`;
	const result = extractProgressivePlanWidgetPayloadFromText(input, {
		requireActionItemsHeading: true,
	});

	assert.ok(result);
	assert.deepEqual(
		result.tasks.map((task) => task.label),
		["Define conference goals", "Secure venue"]
	);
});

test("strict progressive mode accepts scope in-list as a plan signal", () => {
	const input = `I'd love to help with this build.

Plan

Scope
- In: 5-column Kanban board, drag-and-drop workflow, route at /sprint-board
- Out: Backend persistence`;
	const result = extractProgressivePlanWidgetPayloadFromText(input, {
		minTasks: 1,
		requireActionItemsHeading: true,
	});

	assert.ok(result);
	assert.equal(result.type, "plan");
	assert.equal(result.title, "5-column Kanban board");
	assert.deepEqual(
		result.tasks.map((task) => task.label),
		[
			"5-column Kanban board",
			"drag-and-drop workflow",
			"route at /sprint-board",
		]
	);
});

test("strips inline markdown bold markers from checklist labels", () => {
	const input = `# Conference planning plan

Action items
- [ ] **Define conference identity and date** — choose theme
- [ ] **Draft budget and funding model** — estimate costs`;
	const result = extractProgressivePlanWidgetPayloadFromText(input, {
		requireActionItemsHeading: true,
	});

	assert.ok(result);
	assert.deepEqual(
		result.tasks.map((task) => task.label),
		[
			"Define conference identity and date — choose theme",
			"Draft budget and funding model — estimate costs",
		]
	);
});

test("progressive extractor expands tasks as more list items appear", () => {
	const partialInput = `Execution plan\n- Define conference goals`;
	const completeInput = `${partialInput}\n- Secure venue`;

	const partialResult = extractProgressivePlanWidgetPayloadFromText(partialInput);
	const completeResult = extractProgressivePlanWidgetPayloadFromText(completeInput);

	assert.ok(partialResult);
	assert.ok(completeResult);
	assert.deepEqual(
		partialResult.tasks.map((task) => task.id),
		["task-1"]
	);
	assert.deepEqual(
		completeResult.tasks.map((task) => task.id),
		["task-1", "task-2"]
	);
});

test("progressive extractor ignores generic lists without plan signal", () => {
	const input = `Shopping list\n- Apples\n- Oranges`;
	const result = extractProgressivePlanWidgetPayloadFromText(input);
	assert.equal(result, null);
});

test("structured extractor parses phase-based numbered plan text", () => {
	const input = [
		"Team Event Plan",
		"",
		"Phase 1: Define & Scope",
		"1. Confirm headcount and attendee list",
		"2. Set the date and time",
		"",
		"Phase 2: Plan Activities",
		"3. Book a venue or virtual platform",
		"4. Plan 2-3 activities",
	].join("\n");

	const result = extractPlanWidgetPayloadFromStructuredText(input);
	assert.ok(result);
	assert.equal(result.type, "plan");
	assert.equal(result.title, "Team Event Plan");
	assert.deepEqual(
		result.tasks.map((task) => task.label),
		[
			"Confirm headcount and attendee list",
			"Set the date and time",
			"Book a venue or virtual platform",
			"Plan 2-3 activities",
		]
	);
});

test("structured extractor prefers concise plan heading over intro narrative for title", () => {
	const input = [
		"Thanks for the details! Let me put together a balanced team event plan for you.",
		"",
		"🎉 Team Event Plan",
		"",
		"Phase 1: Define & Scope",
		"1. Confirm headcount and attendee list",
		"2. Set the date and time",
	].join("\n");

	const result = extractPlanWidgetPayloadFromStructuredText(input);
	assert.ok(result);
	assert.equal(result.title, "🎉 Team Event Plan");
	assert.equal(result.tasks.length, 2);
});

test("structured extractor rejects clarification-style numbered questions", () => {
	const input = [
		"I'd love to help. Let me ask a few questions first.",
		"1. What type of event?",
		"2. Team size and location?",
		"3. Timeline and budget?",
	].join("\n");

	const result = extractPlanWidgetPayloadFromStructuredText(input);
	assert.equal(result, null);
});

test("extractPlanWidgetPayloadFromText infers DAG dependencies", () => {
	const input = [
		"# Project plan",
		"",
		"Action items",
		"- Research authentication options",
		"- Design authentication flow",
		"- Implement authentication service",
		"- Test authentication service",
	].join("\n");

	const result = extractPlanWidgetPayloadFromText(input);
	assert.ok(result);
	assert.equal(result.tasks.length, 4);
	// Research (phase 0) has no deps
	assert.deepEqual(result.tasks[0].blockedBy, []);
	// Design (phase 1) depends on Research (shared "authentication")
	assert.deepEqual(result.tasks[1].blockedBy, ["task-1"]);
	// Implement (phase 2) depends on Design
	assert.deepEqual(result.tasks[2].blockedBy, ["task-2"]);
	// Test (phase 3) depends on Implement
	assert.deepEqual(result.tasks[3].blockedBy, ["task-3"]);
});

test("extractProgressivePlanWidgetPayloadFromText infers DAG dependencies", () => {
	const input = [
		"Rollout plan",
		"1. Design frontend layout",
		"2. Design backend architecture",
		"3. Build frontend components",
		"4. Build backend services",
	].join("\n");

	const result = extractProgressivePlanWidgetPayloadFromText(input);
	assert.ok(result);
	assert.equal(result.tasks.length, 4);
	// Design tasks are same-phase, independent
	assert.deepEqual(result.tasks[0].blockedBy, []);
	assert.deepEqual(result.tasks[1].blockedBy, []);
	// Build frontend depends on Design frontend
	assert.deepEqual(result.tasks[2].blockedBy, ["task-1"]);
	// Build backend depends on Design backend
	assert.deepEqual(result.tasks[3].blockedBy, ["task-2"]);
});

test("flat tasks with no phase keywords remain independent after inference", () => {
	const input = [
		"# Todo",
		"",
		"Action items",
		"- Send email to stakeholders",
		"- Update spreadsheet",
		"- Schedule meeting",
	].join("\n");

	const result = extractPlanWidgetPayloadFromText(input);
	assert.ok(result);
	assert.equal(result.tasks.length, 3);
	// None of these labels match phase keywords, so all stay independent
	assert.deepEqual(result.tasks[0].blockedBy, []);
	assert.deepEqual(result.tasks[1].blockedBy, []);
	assert.deepEqual(result.tasks[2].blockedBy, []);
});

/* ---- Test Case 6: Plan widget structure (Plan tab + Tasks tab) ---- */

test("exit_plan_mode payload has required structure for frontend PlanTabContent (Test Case 6)", () => {
	const exitPlanModeMarkdown = [
		"# React Dashboard Plan",
		"",
		"Build a dashboard with three components.",
		"",
		"## Action items",
		"- [ ] Create stats overview card with key metrics",
		"- [ ] Build recent activity feed with timestamps",
		"- [ ] Implement notification bell dropdown",
	].join("\n");

	const payload = extractPlanWidgetPayloadFromText(exitPlanModeMarkdown);
	assert.ok(payload, "Payload must not be null");
	assert.strictEqual(payload.type, "plan");
	assert.ok(typeof payload.title === "string" && payload.title.trim().length > 0,
		"Plan must have a non-empty title for PlanTitle");
	assert.equal(payload.description, "Build a dashboard with three components.");
	assert.ok(Array.isArray(payload.tasks), "Tasks must be an array for PlanTaskList");
	assert.strictEqual(payload.tasks.length, 3);

	for (const task of payload.tasks) {
		assert.ok(typeof task.id === "string" && task.id.length > 0,
			"Each task must have an id for PlanTaskItem key");
		assert.ok(typeof task.label === "string" && task.label.trim().length > 0,
			"Each task must have a non-empty label for PlanTaskItem");
		assert.ok(Array.isArray(task.blockedBy),
			"Each task must have blockedBy array for dependency rendering");
	}
});

test("extractPlanWidgetPayloadFromExitPlanToolInput preserves summary paragraph for plan card", () => {
	const input = JSON.stringify({
		plan: [
			"# Customer CRUD App",
			"",
			"Build a customer-facing management app with searchable tables and inline editing.",
			"",
			"## Tasks",
			"",
			"### Task 1: Create app shell",
			"Set up the page structure and navigation.",
			"",
			"### Task 2: Add data tables",
			"Render sortable tables with filters.",
		].join("\n"),
	});

	const payload = extractPlanWidgetPayloadFromExitPlanToolInput(input, { minTasks: 1 });
	assert.ok(payload);
	assert.equal(
		payload.description,
		"Build a customer-facing management app with searchable tables and inline editing.",
	);
});

test("plan payload task ids are sequential for frontend rendering", () => {
	const input = "Plan\n\n## Action items\n- [ ] Task A\n- [ ] Task B\n- [ ] Task C\n- [ ] Task D";
	const payload = extractPlanWidgetPayloadFromText(input);
	assert.ok(payload);
	const ids = payload.tasks.map((t) => t.id);
	assert.deepStrictEqual(ids, ["task-1", "task-2", "task-3", "task-4"]);
});

test("plan payload works with all three extraction strategies", () => {
	const markdown = [
		"# Dashboard Plan",
		"",
		"Action items",
		"- [ ] Stats overview card",
		"- [ ] Activity feed",
		"- [ ] Notification dropdown",
	].join("\n");

	const primary = extractPlanWidgetPayloadFromText(markdown);
	assert.ok(primary, "Primary extraction should succeed");
	assert.strictEqual(primary.tasks.length, 3);

	const progressive = extractProgressivePlanWidgetPayloadFromText(markdown, {
		minTasks: 1,
		requirePlanSignal: false,
		requireActionItemsHeading: false,
	});
	assert.ok(progressive, "Progressive extraction should succeed as fallback");
	assert.ok(progressive.tasks.length >= 3);
});

test("plan Build CTA is enabled when single plan exists and no acceptance", () => {
	const input = "Plan\n\nAction items\n- [ ] Create component\n- [ ] Add styling\n- [ ] Write tests";
	const payload = extractPlanWidgetPayloadFromText(input);
	assert.ok(payload);

	assert.strictEqual(payload.tasks.length, 3);
	assert.ok(payload.tasks.every((t) => t.label.trim().length > 0),
		"All tasks have non-empty labels — Build CTA should be enabled");
});

test("extracts plan after conversational preamble (free-form lead-in before action items)", () => {
	const input = [
		"I'll outline the work as a checklist you can track.",
		"",
		"# Sprint goals",
		"",
		"Action items",
		"- [ ] Wire auth middleware",
		"- [ ] Add session storage",
		"- [ ] Ship smoke tests",
	].join("\n");

	const result = extractPlanWidgetPayloadFromText(input);
	assert.ok(result);
	assert.equal(result.type, "plan");
	assert.equal(result.title, "Sprint goals");
	assert.deepEqual(
		result.tasks.map((task) => task.label),
		["Wire auth middleware", "Add session storage", "Ship smoke tests"],
	);
});

test("primary extractor still finds action items when GenUI-style heading precedes markdown plan", () => {
	const input = [
		"Interactive summary: quick overview before the structured plan below.",
		"",
		"# Rollout",
		"",
		"Action items",
		"- [ ] Task one",
		"- [ ] Task two",
		"- [ ] Task three",
	].join("\n");

	const result = extractPlanWidgetPayloadFromText(input);
	assert.ok(result);
	assert.equal(result.title, "Rollout");
	assert.strictEqual(result.tasks.length, 3);
});
