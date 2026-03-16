export type FutureChatSmartWidthClass = "compact" | "regular" | "wide";

interface FutureChatSmartGenerationLayoutInput {
	shellWidth?: number | null;
	viewportWidth?: number | null;
}

interface FutureChatSmartGenerationLayoutContext {
	containerWidthPx?: number;
	viewportWidthPx?: number;
	widthClass?: FutureChatSmartWidthClass;
}

function normalizeWidth(value: number | null | undefined): number | null {
	if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
		return null;
	}

	return Math.max(1, Math.round(value));
}

export function getFutureChatSmartWidthClass(widthPx: number): FutureChatSmartWidthClass {
	if (widthPx <= 520) {
		return "compact";
	}

	if (widthPx <= 900) {
		return "regular";
	}

	return "wide";
}

export function getFutureChatSmartGenerationLayoutContext(
	input: FutureChatSmartGenerationLayoutInput,
): FutureChatSmartGenerationLayoutContext {
	const containerWidthPx = normalizeWidth(input.shellWidth);
	const viewportWidthPx = normalizeWidth(input.viewportWidth);
	const widthSource = containerWidthPx ?? viewportWidthPx;

	return {
		containerWidthPx: containerWidthPx ?? undefined,
		viewportWidthPx: viewportWidthPx ?? undefined,
		widthClass:
			typeof widthSource === "number"
				? getFutureChatSmartWidthClass(widthSource)
				: undefined,
	};
}
