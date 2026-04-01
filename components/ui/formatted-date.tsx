"use client";

import {
	formatDateForDisplay,
	getHydrationSafeDateFallback,
} from "@/lib/date-format";
import { useHasHydrated } from "@/lib/use-hydrated";

interface FormattedDateProps {
	dateStr: string;
	dateStyle: Intl.DateTimeFormatOptions["dateStyle"];
}

export default function FormattedDate({
	dateStr,
	dateStyle,
}: Readonly<FormattedDateProps>) {
	const hasHydrated = useHasHydrated();
	const formattedDate = hasHydrated
		? formatDateForDisplay(dateStr, dateStyle)
		: getHydrationSafeDateFallback(dateStr);

	return <span suppressHydrationWarning>{formattedDate}</span>;
}
