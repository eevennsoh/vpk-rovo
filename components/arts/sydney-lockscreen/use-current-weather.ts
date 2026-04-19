"use client";

import { useEffect, useState } from "react";

export interface CurrentWeather {
	temperatureCelsius: number | null;
	apparentTemperatureCelsius: number | null;
	weatherCode: number | null;
	isDay: boolean;
	humidity: number | null;
	updatedAt: string | null;
	loading: boolean;
	error: string | null;
}

const REFRESH_INTERVAL_MS = 10 * 60 * 1000;

interface OpenMeteoCurrent {
	time?: string;
	temperature_2m?: number;
	apparent_temperature?: number;
	relative_humidity_2m?: number;
	weather_code?: number;
	is_day?: number;
}

interface OpenMeteoResponse {
	current?: OpenMeteoCurrent;
}

const INITIAL_STATE: CurrentWeather = {
	temperatureCelsius: null,
	apparentTemperatureCelsius: null,
	weatherCode: null,
	isDay: true,
	humidity: null,
	updatedAt: null,
	loading: true,
	error: null,
};

export function useCurrentWeather(latitude: number, longitude: number, timezone: string): CurrentWeather {
	const [state, setState] = useState<CurrentWeather>(INITIAL_STATE);

	useEffect(() => {
		let cancelled = false;
		const controller = new AbortController();

		async function load() {
			setState((previous) => ({ ...previous, loading: true, error: null }));
			try {
				const url = new URL("https://api.open-meteo.com/v1/forecast");
				url.searchParams.set("latitude", latitude.toString());
				url.searchParams.set("longitude", longitude.toString());
				url.searchParams.set(
					"current",
					[
						"temperature_2m",
						"apparent_temperature",
						"relative_humidity_2m",
						"weather_code",
						"is_day",
					].join(","),
				);
				url.searchParams.set("timezone", timezone);

				const response = await fetch(url.toString(), { signal: controller.signal });
				if (!response.ok) {
					throw new Error(`Weather request failed: ${response.status}`);
				}
				const data = (await response.json()) as OpenMeteoResponse;
				if (cancelled) return;
				const current = data.current ?? {};
				setState({
					temperatureCelsius: typeof current.temperature_2m === "number" ? current.temperature_2m : null,
					apparentTemperatureCelsius:
						typeof current.apparent_temperature === "number" ? current.apparent_temperature : null,
					weatherCode: typeof current.weather_code === "number" ? current.weather_code : null,
					isDay: current.is_day === undefined ? true : current.is_day === 1,
					humidity: typeof current.relative_humidity_2m === "number" ? current.relative_humidity_2m : null,
					updatedAt: current.time ?? null,
					loading: false,
					error: null,
				});
			} catch (error) {
				if (cancelled) return;
				if (error instanceof DOMException && error.name === "AbortError") return;
				setState((previous) => ({
					...previous,
					loading: false,
					error: error instanceof Error ? error.message : "Unknown weather error",
				}));
			}
		}

		void load();
		const interval = window.setInterval(() => {
			void load();
		}, REFRESH_INTERVAL_MS);

		return () => {
			cancelled = true;
			controller.abort();
			window.clearInterval(interval);
		};
	}, [latitude, longitude, timezone]);

	return state;
}
