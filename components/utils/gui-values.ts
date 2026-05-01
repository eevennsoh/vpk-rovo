export function selectMountedGUIValues(
	values: Record<string, unknown>,
	mountedValueKeys: readonly string[],
): Record<string, unknown> {
	if (mountedValueKeys.length === 0) return values;

	const selectedValues: Record<string, unknown> = {};
	for (const key of mountedValueKeys) {
		if (Object.prototype.hasOwnProperty.call(values, key)) {
			selectedValues[key] = values[key];
		}
	}

	return selectedValues;
}
