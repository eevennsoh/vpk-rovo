import assert from "node:assert/strict";
import test from "node:test";

import {
	readStoredCitiesState,
	WEATHER_CITY_STORAGE_KEY,
} from "./city-storage.ts";

function createStorage(values) {
	return {
		getItem(key) {
			return values[key] ?? null;
		},
	};
}

test("readStoredCitiesState falls back to legacy data when the v2 payload is malformed", () => {
	const legacyState = {
		cityIds: ["tokyo", "london"],
		selectedIndex: 1,
	};

	assert.deepEqual(
		readStoredCitiesState(
			createStorage({
				[WEATHER_CITY_STORAGE_KEY]: "{",
				"vpk:weather:cities": JSON.stringify(legacyState),
			}),
		),
		legacyState,
	);
});

test("readStoredCitiesState filters invalid city ids and defaults the selected index", () => {
	assert.deepEqual(
		readStoredCitiesState(
			createStorage({
				[WEATHER_CITY_STORAGE_KEY]: JSON.stringify({
					cityIds: ["sydney", null, "tokyo", 42],
				}),
			}),
		),
		{
			cityIds: ["sydney", "tokyo"],
			selectedIndex: 0,
		},
	);
});

test("readStoredCitiesState returns null when neither storage key contains a valid cities array", () => {
	assert.equal(
		readStoredCitiesState(
			createStorage({
				[WEATHER_CITY_STORAGE_KEY]: JSON.stringify({
					cityIds: "sydney",
					selectedIndex: 2,
				}),
				"vpk:weather:cities": JSON.stringify({
					cityIds: false,
				}),
			}),
		),
		null,
	);
});
