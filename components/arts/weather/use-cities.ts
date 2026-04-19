"use client";

import { useCallback, useEffect, useState } from "react";

import { findLocation, type LockscreenLocation } from "./locations";
import { DEFAULT_PRESET_CITY, PRESET_CITIES } from "./preset-cities";

export interface UseCitiesReturn {
	cities: ReadonlyArray<LockscreenLocation>;
	selectedIndex: number;
	selected: LockscreenLocation;
	setSelectedIndex: (index: number) => void;
	addCity: (city: LockscreenLocation) => void;
	removeCity: (index: number) => void;
	isAdded: (id: string) => boolean;
}

const STORAGE_KEY = "vpk:weather:cities";

interface StoredCitiesState {
	cityIds: string[];
	selectedIndex: number;
}

function loadStoredState(): StoredCitiesState | null {
	if (typeof window === "undefined") return null;
	try {
		const raw = window.localStorage.getItem(STORAGE_KEY);
		if (!raw) return null;
		const parsed = JSON.parse(raw) as Partial<StoredCitiesState>;
		if (!parsed || !Array.isArray(parsed.cityIds)) return null;
		const cityIds = parsed.cityIds.filter(
			(id): id is string => typeof id === "string",
		);
		const selectedIndex =
			typeof parsed.selectedIndex === "number" ? parsed.selectedIndex : 0;
		return { cityIds, selectedIndex };
	} catch {
		return null;
	}
}

function getInitialCities(): LockscreenLocation[] {
	const stored = loadStoredState();
	if (!stored) return [DEFAULT_PRESET_CITY];
	const resolved = stored.cityIds
		.map((id) => findLocation(id))
		.filter((c): c is LockscreenLocation => Boolean(c));
	return resolved.length > 0 ? resolved : [DEFAULT_PRESET_CITY];
}

function getInitialSelectedIndex(citiesLength: number): number {
	const stored = loadStoredState();
	if (!stored) return 0;
	return Math.max(0, Math.min(stored.selectedIndex, citiesLength - 1));
}

export function useCities(): UseCitiesReturn {
	const [cities, setCities] = useState<LockscreenLocation[]>(getInitialCities);
	const [selectedIndex, setSelectedIndexRaw] = useState(() =>
		getInitialSelectedIndex(getInitialCities().length),
	);

	useEffect(() => {
		if (typeof window === "undefined") return;
		try {
			const payload: StoredCitiesState = {
				cityIds: cities.map((c) => c.id),
				selectedIndex,
			};
			window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
		} catch {
			// Ignore quota / serialization errors.
		}
	}, [cities, selectedIndex]);

	const setSelectedIndex = useCallback(
		(index: number) => {
			setSelectedIndexRaw(Math.max(0, Math.min(index, cities.length - 1)));
		},
		[cities.length],
	);

	const addCity = useCallback(
		(city: LockscreenLocation) => {
			if (cities.some((c) => c.id === city.id)) return;
			setCities((prev) => {
				const next = [...prev, city];
				setSelectedIndexRaw(next.length - 1);
				return next;
			});
		},
		[cities],
	);

	const removeCity = useCallback(
		(index: number) => {
			if (cities.length <= 1) return;
			setCities((prev) => {
				const next = prev.filter((_, i) => i !== index);
				return next;
			});
			setSelectedIndexRaw((prev) =>
				prev >= cities.length - 1 ? Math.max(0, cities.length - 2) : prev,
			);
		},
		[cities.length],
	);

	const isAdded = useCallback(
		(id: string) => cities.some((c) => c.id === id),
		[cities],
	);

	const selected = cities[selectedIndex] ?? DEFAULT_PRESET_CITY;

	return {
		cities,
		selectedIndex,
		selected,
		setSelectedIndex,
		addCity,
		removeCity,
		isAdded,
	};
}

export { PRESET_CITIES };
