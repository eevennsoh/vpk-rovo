export async function runPlanBuildAndCollapse(
	onBuild: (() => void | Promise<void>) | undefined,
	onCollapse: () => void,
): Promise<void> {
	if (!onBuild) {
		return;
	}

	await onBuild();
	onCollapse();
}
