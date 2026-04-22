export const WEATHER_CITY_STORAGE_KEY = "vpk:weather:cities:v2";
export const WEATHER_CITY_LEGACY_STORAGE_KEYS = ["vpk:weather:cities"];

export interface StoredCitiesState {
	cityIds: string[];
	selectedIndex: number;
}

function parseStoredCitiesState(raw: string | null): StoredCitiesState | null {
	if (!raw) return null;
	try {
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

export function readStoredCitiesState(
	storage: Pick<Storage, "getItem">,
): StoredCitiesState | null {
	const currentState = parseStoredCitiesState(
		storage.getItem(WEATHER_CITY_STORAGE_KEY),
	);
	if (currentState) return currentState;

	for (const legacyKey of WEATHER_CITY_LEGACY_STORAGE_KEYS) {
		const legacyState = parseStoredCitiesState(storage.getItem(legacyKey));
		if (legacyState) {
			return legacyState;
		}
	}

	return null;
}
