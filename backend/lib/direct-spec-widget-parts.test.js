const test = require("node:test");
const assert = require("node:assert/strict");

const { buildDirectSpecWidgetParts } = require("./direct-spec-widget-parts");

test("buildDirectSpecWidgetParts emits widget parts and a final genui route decision", () => {
	const spec = {
		root: "main",
		elements: {
			main: {
				type: "Card",
				props: { title: "Overview" },
				children: [],
			},
		},
	};

	const parts = buildDirectSpecWidgetParts({
		latestUserMessage: "show me the data",
		narrative: "Here is the UI.",
		requestOrigin: "text",
		spec,
		widgetId: "widget-direct-spec-1",
		widgetType: "genui-preview",
	});

	assert.equal(parts.length, 4);
	assert.deepEqual(parts[0], {
		type: "data-widget-loading",
		id: "widget-direct-spec-1",
		data: { type: "genui-preview", loading: true },
	});
	assert.deepEqual(parts[1], {
		type: "data-widget-data",
		id: "widget-direct-spec-1",
		data: {
			type: "genui-preview",
			payload: {
				spec,
				summary: "Here is the UI.",
				source: "direct-rovodev-spec",
			},
		},
	});
	assert.deepEqual(parts[2], {
		type: "data-widget-loading",
		id: "widget-direct-spec-1",
		data: { type: "genui-preview", loading: false },
	});
	assert.deepEqual(parts[3], {
		type: "data-route-decision",
		data: {
			intent: "genui",
			presentation: "genui_card",
			confidence: 1,
			reason: "intent_task_toolable",
			origin: "text",
		},
	});
});
