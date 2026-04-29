"use client";

import { useEffect, useMemo, useState } from "react";

export interface LocationClock {
	hours: string;
	minutes: string;
	seconds: string;
	weekday: string;
	day: string;
	month: string;
	year: string;
	timeOfDay: "morning" | "afternoon" | "evening" | "night";
	isReady: boolean;
}

const TIME_FORMAT_OPTIONS: Intl.DateTimeFormatOptions = {
	hour: "2-digit",
	minute: "2-digit",
	second: "2-digit",
	hour12: false,
};

const DATE_FORMAT_OPTIONS: Intl.DateTimeFormatOptions = {
	weekday: "long",
	day: "2-digit",
	month: "long",
	year: "numeric",
};

function pad(value: string | number, length = 2): string {
	const stringValue = String(value);
	if (stringValue.length >= length) return stringValue;
	return stringValue.padStart(length, "0");
}

function classifyTimeOfDay(hourString: string): LocationClock["timeOfDay"] {
	const hour = Number.parseInt(hourString, 10);
	if (Number.isNaN(hour)) return "night";
	if (hour >= 5 && hour < 12) return "morning";
	if (hour >= 12 && hour < 17) return "afternoon";
	if (hour >= 17 && hour < 21) return "evening";
	return "night";
}

export function useLocationClock(timezone: string): LocationClock {
	const [now, setNow] = useState<Date | null>(null);

	const formatters = useMemo(() => {
		try {
			return {
				timeFormatter: new Intl.DateTimeFormat("en-GB", {
					...TIME_FORMAT_OPTIONS,
					timeZone: timezone,
				}),
				dateFormatter: new Intl.DateTimeFormat("en-GB", {
					...DATE_FORMAT_OPTIONS,
					timeZone: timezone,
				}),
			};
		} catch {
			return null;
		}
	}, [timezone]);

	useEffect(() => {
		setNow(new Date());
		const interval = window.setInterval(() => {
			setNow(new Date());
		}, 1000);
		return () => window.clearInterval(interval);
	}, []);

	return useMemo<LocationClock>(() => {
		const fallback: LocationClock = {
			hours: "--",
			minutes: "--",
			seconds: "--",
			weekday: "",
			day: "--",
			month: "",
			year: "----",
			timeOfDay: "night",
			isReady: false,
		};

		if (!now || !formatters) {
			return fallback;
		}

		try {
			const { timeFormatter, dateFormatter } = formatters;
			const timeParts = timeFormatter.formatToParts(now);
			const dateParts = dateFormatter.formatToParts(now);

			const hours = pad(timeParts.find((part) => part.type === "hour")?.value ?? "00");
			const minutes = pad(timeParts.find((part) => part.type === "minute")?.value ?? "00");
			const seconds = pad(timeParts.find((part) => part.type === "second")?.value ?? "00");
			const weekday = dateParts.find((part) => part.type === "weekday")?.value ?? "";
			const day = pad(dateParts.find((part) => part.type === "day")?.value ?? "00");
			const month = dateParts.find((part) => part.type === "month")?.value ?? "";
			const year = dateParts.find((part) => part.type === "year")?.value ?? "----";

			return {
				hours,
				minutes,
				seconds,
				weekday,
				day,
				month,
				year,
				timeOfDay: classifyTimeOfDay(hours),
				isReady: true,
			};
		} catch {
			return fallback;
		}
	}, [formatters, now]);
}
