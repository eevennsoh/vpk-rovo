/** Shared bounds for the metadata rail and embedded chat panel. */
export const METADATA_PANEL_DEFAULT_WIDTH_PX = 440;
export const METADATA_PANEL_MIN_WIDTH_PX = 424;
export const METADATA_PANEL_FALLBACK_MAX_WIDTH_PX = 620;
export const DESCRIPTION_PANEL_MIN_WIDTH_PX = 480;

/** Bounds for the Insights column when it sits beside the work item. */
export const INSIGHTS_PANEL_DEFAULT_WIDTH_PX = 400;
export const INSIGHTS_PANEL_MIN_WIDTH_PX = 280;
export const WORK_ITEM_SPLIT_MIN_WIDTH_PX = 320;

export function resolveMetadataPanelMaxWidth(dialogWidth: number) {
	return Math.max(
		METADATA_PANEL_MIN_WIDTH_PX,
		Math.min(METADATA_PANEL_FALLBACK_MAX_WIDTH_PX, dialogWidth - DESCRIPTION_PANEL_MIN_WIDTH_PX),
	);
}

export function resolveInsightsPanelMaxWidth(containerWidth: number) {
	return Math.max(INSIGHTS_PANEL_MIN_WIDTH_PX, containerWidth - WORK_ITEM_SPLIT_MIN_WIDTH_PX);
}
