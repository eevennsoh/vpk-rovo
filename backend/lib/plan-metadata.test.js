const test = require("node:test");
const assert = require("node:assert/strict");

const {
	buildPlanMetadataPrompt,
	derivePlanExecutionArtifactTitle,
	generatePlanMetadata,
	getLatestPlanWidgetMetadata,
	parsePlanMetadataResponse,
} = require("./plan-metadata");

test("getLatestPlanWidgetMetadata returns the latest visible assistant plan widget", () => {
	const planWidget = getLatestPlanWidgetMetadata([
		{
			id: "assistant-hidden",
			role: "assistant",
			metadata: { visibility: "hidden" },
			parts: [
				{
					type: "data-widget-data",
					data: {
						type: "plan",
						payload: {
							title: "Hidden plan",
							shortDescription: "Do not use this",
							tasks: ["Hidden task"],
						},
					},
				},
			],
		},
		{
			id: "assistant-visible",
			role: "assistant",
			parts: [
				{
					type: "data-widget-data",
					data: {
						type: "plan",
						payload: {
							title: "Analytics Dashboard",
							description: "Build a dashboard with KPIs and campaign trends.",
							shortDescription: "Monitor KPIs and campaign trends",
							tasks: [
								{ label: "Create KPI cards" },
								{ title: "Add trend chart" },
							],
						},
					},
				},
			],
		},
	]);

	assert.deepEqual(planWidget, {
		title: "Analytics Dashboard",
		description: "Build a dashboard with KPIs and campaign trends.",
		shortDescription: "Monitor KPIs and campaign trends",
		tasks: ["Create KPI cards", "Add trend chart"],
	});
});

test("buildPlanMetadataPrompt includes the title, description, and task labels", () => {
	const prompt = buildPlanMetadataPrompt({
		title: "Analytics Dashboard",
		description: "Build a dashboard with KPIs and campaign trends.",
		tasks: ["Create KPI cards", "Add trend chart"],
	});

	assert.match(prompt, /Current title: Analytics Dashboard/);
	assert.match(prompt, /Current description: Build a dashboard with KPIs and campaign trends\./);
	assert.match(prompt, /Tasks \(2\): Create KPI cards; Add trend chart/);
});

test("derivePlanExecutionArtifactTitle prefers the plan title over the route slug", () => {
	const title = derivePlanExecutionArtifactTitle({
		appRoute: "/crm",
		planTitle: "CRM Analytics Dashboard",
	});

	assert.equal(title, "CRM Analytics Dashboard");
});

test("derivePlanExecutionArtifactTitle falls back to a titleized route slug", () => {
	const title = derivePlanExecutionArtifactTitle({
		appRoute: "/sales-pipeline",
		planTitle: "",
	});

	assert.equal(title, "Sales Pipeline");
});

test("parsePlanMetadataResponse falls back to the provided title when parsing fails", () => {
	const metadata = parsePlanMetadataResponse("not json", "Analytics Dashboard");

	assert.deepEqual(metadata, {
		title: "Analytics Dashboard",
		shortDescription: "",
	});
});

test("generatePlanMetadata parses generated JSON metadata", async () => {
	const metadata = await generatePlanMetadata({
		title: "Analytics Dashboard",
		description: "Build a dashboard with KPIs and campaign trends.",
		tasks: ["Create KPI cards"],
		generateText: async ({ system, prompt, maxOutputTokens, temperature }) => {
			assert.match(system, /Respond with JSON only/);
			assert.match(prompt, /Analytics Dashboard/);
			assert.equal(maxOutputTokens, 120);
			assert.equal(temperature, 0.4);
			return '{"title":"Analytics Dashboard","shortDescription":"Monitor KPIs, trends, and campaign performance metrics"}';
		},
	});

	assert.deepEqual(metadata, {
		title: "Analytics Dashboard",
		shortDescription: "Monitor KPIs, trends, and campaign performance metrics",
	});
});
