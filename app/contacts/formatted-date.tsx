"use client";

import { useEffect, useState } from "react";
import {
	formatDateForDisplay,
	getHydrationSafeDateFallback,
} from "./date-format";

interface FormattedDateProps {
	dateStr: string;
	dateStyle: Intl.DateTimeFormatOptions["dateStyle"];
}

export default function FormattedDate({
	dateStr,
	dateStyle,
}: Readonly<FormattedDateProps>) {
	const [formattedDate, setFormattedDate] = useState(() =>
		getHydrationSafeDateFallback(dateStr)
	);

	useEffect(() => {
		setFormattedDate(formatDateForDisplay(dateStr, dateStyle));
	}, [dateStr, dateStyle]);

	return <span suppressHydrationWarning>{formattedDate}</span>;
}
