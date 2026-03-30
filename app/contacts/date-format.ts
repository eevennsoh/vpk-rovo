export function getHydrationSafeDateFallback(dateStr: string): string {
	const parsedDate = new Date(dateStr);
	if (Number.isNaN(parsedDate.getTime())) {
		return dateStr;
	}

	return parsedDate.toISOString().slice(0, 10);
}

export function formatDateForDisplay(
	dateStr: string,
	dateStyle: Intl.DateTimeFormatOptions["dateStyle"]
): string {
	const parsedDate = new Date(dateStr);
	if (Number.isNaN(parsedDate.getTime())) {
		return getHydrationSafeDateFallback(dateStr);
	}

	return new Intl.DateTimeFormat(undefined, { dateStyle }).format(parsedDate);
}
