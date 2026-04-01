"use client";

import {
	formatRelativeDateForDisplay,
	getHydrationSafeDateFallback,
} from "@/lib/date-format";
import { useHasHydrated } from "@/lib/use-hydrated";

interface FormattedRelativeDateProps {
	dateStr: string;
}

export default function FormattedRelativeDate({
	dateStr,
}: Readonly<FormattedRelativeDateProps>) {
	const hasHydrated = useHasHydrated();
	const formattedDate = hasHydrated
		? formatRelativeDateForDisplay(dateStr)
		: getHydrationSafeDateFallback(dateStr);

	return <span suppressHydrationWarning>{formattedDate}</span>;
}
