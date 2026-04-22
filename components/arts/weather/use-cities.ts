"use client";

import { useCallback, useEffect, useState } from "react";

import {
	readStoredCitiesState,
	type StoredCitiesState,
	WEATHER_CITY_STORAGE_KEY,
} from "./city-storage";
import { findLocation, type LockscreenLocation } from "./locations";
import {
	DEFAULT_PRESET_CITIES,
	DEFAULT_PRESET_CITY,
	PRESET_CITIES,
} from "./preset-cities";

export interface UseCitiesReturn {
	cities: ReadonlyArray<LockscreenLocation>;
	selectedIndex: number;
	selected: LockscreenLocation;
	setSelectedIndex: (index: number) => void;
	addCity: (city: LockscreenLocation) => void;
	/**
	 * Remove a city by id. Clamps `selectedIndex` so the focused city
	 * stays in range; refuses to remove the final city so the rail is
	 * never empty.
	 */
	removeCity: (cityId: string) => void;
}

interface InitialCitiesState {
	cities: LockscreenLocation[];
	selectedIndex: number;
}

function loadStoredState(): StoredCitiesState | null {
	if (typeof window === "undefined") return null;
	return readStoredCitiesState(window.localStorage);
}

function clampSelectedIndex(index: number, citiesLength: number): number {
	return Math.max(0, Math.min(index, citiesLength - 1));
}

function resolveStoredCities(
	stored: StoredCitiesState | null,
): LockscreenLocation[] {
	if (!stored) return [...DEFAULT_PRESET_CITIES];
	const resolved = stored.cityIds
		.map((id) => findLocation(id))
		.filter((c): c is LockscreenLocation => Boolean(c));
	return resolved.length > 0 ? resolved : [...DEFAULT_PRESET_CITIES];
}

function getInitialCitiesState(): InitialCitiesState {
	const stored = loadStoredState();
	const cities = resolveStoredCities(stored);
	return {
		cities,
		selectedIndex: stored
			? clampSelectedIndex(stored.selectedIndex, cities.length)
			: 0,
	};
}

export function useCities(): UseCitiesReturn {
	const [initialCitiesState] = useState(getInitialCitiesState);
	const [cities, setCities] = useState<LockscreenLocation[]>(
		initialCitiesState.cities,
	);
	const [selectedIndex, setSelectedIndexRaw] = useState(
		initialCitiesState.selectedIndex,
	);

	useEffect(() => {
		if (typeof window === "undefined") return;
		try {
			const payload: StoredCitiesState = {
				cityIds: cities.map((c) => c.id),
				selectedIndex,
			};
			window.localStorage.setItem(
				WEATHER_CITY_STORAGE_KEY,
				JSON.stringify(payload),
			);
		} catch {
			// Ignore quota / serialization errors.
		}
	}, [cities, selectedIndex]);

	const setSelectedIndex = useCallback(
		(index: number) => {
			setSelectedIndexRaw(clampSelectedIndex(index, cities.length));
		},
		[cities.length],
	);

	const addCity = useCallback((city: LockscreenLocation) => {
		setCities((prev) => {
			if (prev.some((currentCity) => currentCity.id === city.id)) {
				return prev;
			}

				const next = [...prev, city];
				setSelectedIndexRaw(next.length - 1);
				return next;
		});
	}, []);

	const removeCity = useCallback((cityId: string) => {
		setCities((prev) => {
			// Always keep at least one city so the rail and dependent
			// widgets (current weather, time card, etc.) have something
			// to render.
			if (prev.length <= 1) return prev;
			const removalIndex = prev.findIndex((c) => c.id === cityId);
			if (removalIndex === -1) return prev;

			const next = prev.filter((_, idx) => idx !== removalIndex);
			// Clamp the selection: if the removed city was at or before the
			// current selection, shift left; always ensure we stay in range.
			setSelectedIndexRaw((current) => {
				const adjusted = removalIndex < current ? current - 1 : current;
				return clampSelectedIndex(adjusted, next.length);
			});
			return next;
		});
	}, []);

	const selected = cities[selectedIndex] ?? DEFAULT_PRESET_CITY;

	return {
		cities,
		selectedIndex,
		selected,
		setSelectedIndex,
		addCity,
		removeCity,
	};
}

export { PRESET_CITIES };
