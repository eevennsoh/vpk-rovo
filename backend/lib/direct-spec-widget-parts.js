const { createRouteDecisionPart } = require("./route-decision");

function buildDirectSpecWidgetParts({
	latestUserMessage,
	narrative,
	requestOrigin,
	spec,
	widgetId,
	widgetType,
}) {
	return [
		{
			type: "data-widget-loading",
			id: widgetId,
			data: { type: widgetType, loading: true },
		},
		{
			type: "data-widget-data",
			id: widgetId,
			data: {
				type: widgetType,
				payload: {
					spec,
					summary: narrative || latestUserMessage,
					source: "direct-rovodev-spec",
				},
			},
		},
		{
			type: "data-widget-loading",
			id: widgetId,
			data: { type: widgetType, loading: false },
		},
		createRouteDecisionPart({
			intent: "genui",
			origin: requestOrigin,
			reason: "intent_task_toolable",
		}),
	];
}

module.exports = {
	buildDirectSpecWidgetParts,
};
