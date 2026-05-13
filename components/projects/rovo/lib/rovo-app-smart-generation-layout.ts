export type RovoAppSmartWidthClass = "compact" | "regular" | "wide";

interface RovoAppSmartGenerationLayoutInput {
	shellWidth?: number | null;
	viewportWidth?: number | null;
}

interface RovoAppSmartGenerationLayoutContext {
	containerWidthPx?: number;
	viewportWidthPx?: number;
	widthClass?: RovoAppSmartWidthClass;
}

function normalizeWidth(value: number | null | undefined): number | null {
	if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
		return null;
	}

	return Math.max(1, Math.round(value));
}

export function getRovoAppSmartWidthClass(widthPx: number): RovoAppSmartWidthClass {
	if (widthPx <= 520) {
		return "compact";
	}

	if (widthPx <= 900) {
		return "regular";
	}

	return "wide";
}

export function getRovoAppSmartGenerationLayoutContext(
	input: RovoAppSmartGenerationLayoutInput,
): RovoAppSmartGenerationLayoutContext {
	const containerWidthPx = normalizeWidth(input.shellWidth);
	const viewportWidthPx = normalizeWidth(input.viewportWidth);
	const widthSource = containerWidthPx ?? viewportWidthPx;

	return {
		containerWidthPx: containerWidthPx ?? undefined,
		viewportWidthPx: viewportWidthPx ?? undefined,
		widthClass:
			typeof widthSource === "number"
				? getRovoAppSmartWidthClass(widthSource)
				: undefined,
	};
}
