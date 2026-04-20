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

test("readStoredCitiesState falls back to the legacy key when v2 storage is missing", () => {
	const legacyState = {
		cityIds: ["tokyo", "london"],
		selectedIndex: 1,
	};

	assert.deepEqual(
		readStoredCitiesState(
			createStorage({
				"vpk:weather:cities": JSON.stringify(legacyState),
			}),
		),
		legacyState,
	);
});

test("readStoredCitiesState prefers the current v2 key over legacy storage", () => {
	const legacyState = {
		cityIds: ["tokyo", "london"],
		selectedIndex: 1,
	};
	const currentState = {
		cityIds: ["sydney", "kuala-lumpur"],
		selectedIndex: 0,
	};

	assert.deepEqual(
		readStoredCitiesState(
			createStorage({
				"vpk:weather:cities": JSON.stringify(legacyState),
				[WEATHER_CITY_STORAGE_KEY]: JSON.stringify(currentState),
			}),
		),
		currentState,
	);
});
