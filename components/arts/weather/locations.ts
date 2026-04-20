import { DEFAULT_PRESET_CITY, PRESET_CITIES } from "./preset-cities";

export interface LockscreenLocation {
	id: string;
	name: string;
	code: string;
	countryCode: string;
	region: string;
	timezone: string;
	latitude: number;
	longitude: number;
}

export const LOCKSCREEN_LOCATIONS = PRESET_CITIES;
export const DEFAULT_LOCKSCREEN_LOCATION = DEFAULT_PRESET_CITY;

export function findLocation(id: string | undefined): LockscreenLocation | undefined {
	if (!id) return undefined;
	return PRESET_CITIES.find((location) => location.id === id);
}
