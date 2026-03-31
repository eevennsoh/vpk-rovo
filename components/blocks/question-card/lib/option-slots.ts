export type FocusDirection = "up" | "down";

function normalizeNonNegativeInteger(value: number): number {
	if (!Number.isFinite(value)) {
		return 0;
	}

	return Math.max(0, Math.floor(value));
}

export function getVisibleOptionCount(optionCount: number, maxGeneratedOptions: number): number {
	const normalizedOptionCount = normalizeNonNegativeInteger(optionCount);
	const normalizedMaxGeneratedOptions = normalizeNonNegativeInteger(maxGeneratedOptions);

	return Math.min(normalizedOptionCount, normalizedMaxGeneratedOptions);
}

export function getCustomOptionIndex(visibleOptionCount: number): number {
	return normalizeNonNegativeInteger(visibleOptionCount);
}

export function getTotalOptionSlots(visibleOptionCount: number): number {
	return getCustomOptionIndex(visibleOptionCount) + 1;
}

export function getNextFocusedIndex(currentIndex: number, totalOptionSlots: number, direction: FocusDirection): number {
	const normalizedTotalOptionSlots = Math.max(1, normalizeNonNegativeInteger(totalOptionSlots));
	const maxIndex = normalizedTotalOptionSlots - 1;
	const normalizedCurrentIndex = Math.min(maxIndex, normalizeNonNegativeInteger(currentIndex));

	if (direction === "up") {
		return normalizedCurrentIndex <= 0 ? 0 : normalizedCurrentIndex - 1;
	}

	return normalizedCurrentIndex >= maxIndex ? maxIndex : normalizedCurrentIndex + 1;
}
