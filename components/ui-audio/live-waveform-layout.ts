export function getScrollingBarX({
	barGap,
	barWidth,
	index,
	width,
}: {
	barGap: number;
	barWidth: number;
	index: number;
	width: number;
}) {
	return width - barWidth - index * (barWidth + barGap);
}

export const STATIC_PROCESSING_TRAVEL_DURATION_MS = 500;
export const STATIC_ACTIVE_HANDOFF_DURATION_MS = 220;

export function getStaticProcessingTravelHead({
	barCount,
	elapsedMs,
	travelDurationMs = STATIC_PROCESSING_TRAVEL_DURATION_MS,
}: {
	barCount: number;
	elapsedMs: number;
	travelDurationMs?: number;
}) {
	const duration = Math.max(1, travelDurationMs);
	const phase = (elapsedMs % duration) / duration;

	return barCount + 2 - (barCount + 5) * phase;
}

export function getStaticBarDataIndex({
	barCount,
	dataLength,
	index,
}: {
	barCount: number;
	dataLength: number;
	index: number;
}) {
	if (dataLength <= 1 || barCount <= 1) {
		return 0;
	}

	const centerIndex = (barCount - 1) / 2;
	const mirrorIndex = Math.floor(Math.abs(index - centerIndex));
	const sideCount = Math.max(1, Math.ceil(barCount / 2));
	const dataIndex = Math.floor((mirrorIndex / sideCount) * dataLength);

	return Math.max(0, Math.min(dataLength - 1, dataIndex));
}

export function getStaticProcessingBarValue({
	barCount,
	elapsedMs,
	index,
	travelDurationMs = STATIC_PROCESSING_TRAVEL_DURATION_MS,
}: {
	barCount: number;
	elapsedMs: number;
	index: number;
	travelDurationMs?: number;
}) {
	if (barCount <= 1) {
		return 0.35;
	}

	const normalized = index / Math.max(1, barCount - 1);
	const centerDistance = Math.abs(normalized - 0.5) * 2;
	const centerWeight = 0.76 + (1 - centerDistance) * 0.2;
	const travelHead = getStaticProcessingTravelHead({
		barCount,
		elapsedMs,
		travelDurationMs,
	});
	const travelWidth = Math.max(2.5, barCount * 0.14);
	const travelDistance = Math.abs(index - travelHead);
	const sweep = Math.max(0, 1 - travelDistance / travelWidth);
	const timeSeconds = elapsedMs / 1000;
	const ripple = (Math.sin(timeSeconds * 6 - index * 0.55) + 1) * 0.09;
	const pulse = (Math.cos(timeSeconds * 2.4 + index * 0.28) + 1) * 0.06;
	const value = (0.1 + sweep * 0.48 + ripple + pulse) * centerWeight;

	return Math.max(0.05, Math.min(1, value));
}

export function getWaveformEaseOutProgress({
	durationMs,
	elapsedMs,
}: {
	durationMs: number;
	elapsedMs: number;
}) {
	const duration = Math.max(1, durationMs);
	const rawProgress = Math.max(0, Math.min(1, elapsedMs / duration));

	return 1 - (1 - rawProgress) ** 3;
}

export function getWaveformSeriesValue({
	bars,
	index,
	totalCount,
}: {
	bars: readonly number[];
	index: number;
	totalCount: number;
}) {
	if (bars.length === 0) {
		return 0.05;
	}

	if (bars.length === 1 || totalCount <= 1) {
		return bars[0] || 0.05;
	}

	const mappedIndex = Math.round(
		(index / Math.max(1, totalCount - 1)) * (bars.length - 1)
	);
	const clampedIndex = Math.max(0, Math.min(bars.length - 1, mappedIndex));

	return bars[clampedIndex] || 0.05;
}
