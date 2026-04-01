export function formatElapsedTime(totalSeconds: number): string {
	const minutes = Math.floor(totalSeconds / 60);
	const seconds = totalSeconds % 60;
	return `${minutes}m ${seconds.toString().padStart(2, "0")}s`;
}

export function getElapsedSeconds(runCreatedAt: string | null, runCompletedAt: string | null, nowMs: number): number {
	if (!runCreatedAt) return 0;
	const startTime = Date.parse(runCreatedAt);
	if (!Number.isFinite(startTime)) return 0;
	const completedTime = runCompletedAt ? Date.parse(runCompletedAt) : Number.NaN;
	const endTime = Number.isFinite(completedTime) ? completedTime : nowMs;
	return Math.max(0, Math.floor((endTime - startTime) / 1000));
}

export function resolveInitialNowMs({
	initialNowMs,
	runCreatedAt,
	runCompletedAt,
}: Readonly<{
	initialNowMs?: number;
	runCreatedAt: string | null;
	runCompletedAt: string | null;
}>): number {
	if (typeof initialNowMs === "number" && Number.isFinite(initialNowMs)) {
		return initialNowMs;
	}

	const completedTime = runCompletedAt ? Date.parse(runCompletedAt) : Number.NaN;
	if (Number.isFinite(completedTime)) {
		return completedTime;
	}

	const createdTime = runCreatedAt ? Date.parse(runCreatedAt) : Number.NaN;
	if (Number.isFinite(createdTime)) {
		return createdTime;
	}

	return 0;
}
