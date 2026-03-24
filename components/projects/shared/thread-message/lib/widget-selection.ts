import type { RovoDataPart, RovoUIMessage } from "@/lib/rovo-ui-messages";

export interface NormalizedWidgetDataPart {
	part: RovoDataPart<"widget-data">;
	widgetType: string;
}

function getNonEmptyString(value: unknown): string | null {
	if (typeof value !== "string") {
		return null;
	}

	const trimmedValue = value.trim();
	return trimmedValue.length > 0 ? trimmedValue : null;
}

export function getNormalizedWidgetDataParts(
	message: Pick<RovoUIMessage, "parts">,
): NormalizedWidgetDataPart[] {
	const normalizedParts: NormalizedWidgetDataPart[] = [];

	for (const part of message.parts) {
		if (part.type !== "data-widget-data") {
			continue;
		}

		const widgetType = getNonEmptyString(part.data?.type);
		if (!widgetType) {
			continue;
		}

		normalizedParts.push({
			part: part as RovoDataPart<"widget-data">,
			widgetType,
		});
	}

	return normalizedParts;
}

export function selectLatestRenderableWidgetPart(
	widgetDataParts: ReadonlyArray<NormalizedWidgetDataPart>,
	isRenderable?: (widgetDataPart: NormalizedWidgetDataPart) => boolean,
): NormalizedWidgetDataPart | null {
	if (widgetDataParts.length === 0) {
		return null;
	}

	if (typeof isRenderable === "function") {
		for (let index = widgetDataParts.length - 1; index >= 0; index -= 1) {
			const widgetDataPart = widgetDataParts[index];
			try {
				if (isRenderable(widgetDataPart)) {
					return widgetDataPart;
				}
			} catch (error) {
				console.warn(
					`[widget-selection] Skipping widget part at index ${index} (type: ${widgetDataPart.widgetType}) — isRenderable threw:`,
					error,
				);
			}
		}
	}

	return widgetDataParts[widgetDataParts.length - 1];
}
