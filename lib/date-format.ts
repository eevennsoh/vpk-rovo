const DAY_IN_MS = 1000 * 60 * 60 * 24;
const DISPLAY_DATE_FORMATTERS = new Map<
	Intl.DateTimeFormatOptions["dateStyle"],
	Intl.DateTimeFormat
>();

function getParsedDate(dateStr: string): Date | null {
	const parsedDate = new Date(dateStr);

	return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
}

export function getHydrationSafeDateFallback(dateStr: string): string {
	const parsedDate = getParsedDate(dateStr);

	if (parsedDate === null) {
		return dateStr;
	}

	return parsedDate.toISOString().slice(0, 10);
}

export function formatDateForDisplay(
	dateStr: string,
	dateStyle: Intl.DateTimeFormatOptions["dateStyle"],
): string {
	const parsedDate = getParsedDate(dateStr);

	if (parsedDate === null) {
		return getHydrationSafeDateFallback(dateStr);
	}

	let formatter = DISPLAY_DATE_FORMATTERS.get(dateStyle);
	if (!formatter) {
		formatter = new Intl.DateTimeFormat("en-US", { dateStyle });
		DISPLAY_DATE_FORMATTERS.set(dateStyle, formatter);
	}

	return formatter.format(parsedDate);
}

export function formatRelativeDateForDisplay(dateStr: string): string {
	const parsedDate = getParsedDate(dateStr);

	if (parsedDate === null) {
		return getHydrationSafeDateFallback(dateStr);
	}

	const now = new Date();
	const diffMs = now.getTime() - parsedDate.getTime();
	const diffDays = Math.floor(diffMs / DAY_IN_MS);

	if (diffDays <= 0) return "Today";
	if (diffDays === 1) return "Yesterday";
	if (diffDays < 7) return `${diffDays}d ago`;
	if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;

	return formatDateForDisplay(dateStr, "medium");
}

export function isDateOverdue(dateStr: string, now = new Date()): boolean {
	const dueDateKey = getHydrationSafeDateFallback(dateStr);
	const todayKey = now.toISOString().slice(0, 10);

	if (dueDateKey === dateStr && getParsedDate(dateStr) === null) {
		return false;
	}

	return dueDateKey < todayKey;
}
