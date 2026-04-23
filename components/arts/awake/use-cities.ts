"use client";

import { useCallback, useEffect, useRef, useState } from "react";

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

const SELECTION_PERSIST_DEBOUNCE_MS = 150;

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

function persistCitiesState(payload: StoredCitiesState) {
	try {
		window.localStorage.setItem(
			WEATHER_CITY_STORAGE_KEY,
			JSON.stringify(payload),
		);
	} catch {
		// Ignore quota / serialization errors.
	}
}

export function useCities(): UseCitiesReturn {
	// Start from SSR-safe defaults so server and first client render agree.
	// Stored state is merged in after mount to avoid a hydration mismatch.
	const [cities, setCities] = useState<LockscreenLocation[]>(() => [
		...DEFAULT_PRESET_CITIES,
	]);
	const [selectedIndex, setSelectedIndexRaw] = useState(0);
	const [hasHydrated, setHasHydrated] = useState(false);
	const persistTimeoutRef = useRef<number | null>(null);
	const pendingPersistRef = useRef<StoredCitiesState | null>(null);
	const lastPersistedCityIdsKeyRef = useRef<string | null>(null);

	const clearPersistTimeout = useCallback(() => {
		if (persistTimeoutRef.current === null) return;
		window.clearTimeout(persistTimeoutRef.current);
		persistTimeoutRef.current = null;
	}, [persistTimeoutRef]);

	const flushPendingPersist = useCallback(() => {
		clearPersistTimeout();
		if (!pendingPersistRef.current) return;
		persistCitiesState(pendingPersistRef.current);
		pendingPersistRef.current = null;
	}, [clearPersistTimeout, pendingPersistRef]);

	useEffect(() => {
		const stored = loadStoredState();
		if (stored) {
			const resolved = resolveStoredCities(stored);
			setCities(resolved);
			setSelectedIndexRaw(
				clampSelectedIndex(stored.selectedIndex, resolved.length),
			);
		}
		setHasHydrated(true);
	}, []);

	useEffect(() => {
		if (!hasHydrated) return;
		const payload: StoredCitiesState = {
			cityIds: cities.map((c) => c.id),
			selectedIndex,
		};
		const cityIdsKey = payload.cityIds.join("\u0000");
		// City-list mutations are rare and user-committed, so persist them
		// immediately. Selection previews fire on hover/drag, so debounce
		// those writes off the pointer-move path.
		const didCityListChange =
			lastPersistedCityIdsKeyRef.current !== cityIdsKey;
		pendingPersistRef.current = payload;
		lastPersistedCityIdsKeyRef.current = cityIdsKey;

		clearPersistTimeout();
		if (didCityListChange) {
			flushPendingPersist();
			return;
		}

		persistTimeoutRef.current = window.setTimeout(() => {
			flushPendingPersist();
		}, SELECTION_PERSIST_DEBOUNCE_MS);

		return () => {
			clearPersistTimeout();
		};
	}, [
		cities,
		selectedIndex,
		hasHydrated,
		clearPersistTimeout,
		flushPendingPersist,
	]);

	useEffect(() => {
		return () => {
			if (!hasHydrated) return;
			flushPendingPersist();
		};
	}, [flushPendingPersist, hasHydrated]);

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
