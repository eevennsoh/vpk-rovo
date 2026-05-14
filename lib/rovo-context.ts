export function mergeRovoContextDescriptions(
	...contexts: Array<string | null | undefined>
): string | undefined {
	const merged = contexts
		.map((context) => context?.trim())
		.filter((context): context is string => Boolean(context))
		.join("\n\n");

	return merged.length > 0 ? merged : undefined;
}
