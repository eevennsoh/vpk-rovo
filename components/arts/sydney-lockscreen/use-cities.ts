"use client";

import { useCallback, useState } from "react";

import type { LockscreenLocation } from "./locations";
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

export function useCities(): UseCitiesReturn {
	const [cities, setCities] = useState<LockscreenLocation[]>([
		DEFAULT_PRESET_CITY,
	]);
	const [selectedIndex, setSelectedIndexRaw] = useState(0);

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
