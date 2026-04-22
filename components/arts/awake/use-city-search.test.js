import assert from "node:assert/strict";
import test from "node:test";

import { mapOpenMeteoCity } from "./use-city-search.ts";

test("mapOpenMeteoCity maps a complete Open-Meteo response into a LockscreenLocation", () => {
	const mapped = mapOpenMeteoCity({
		id: 2950159,
		name: "Berlin",
		latitude: 52.52437,
		longitude: 13.41053,
		country_code: "de",
		country: "Germany",
		admin1: "Berlin",
		timezone: "Europe/Berlin",
	});

	assert.deepEqual(mapped, {
		id: "om-de-berlin-52.52-13.41",
		name: "Berlin",
		code: "BER",
		countryCode: "DE",
		region: "Berlin",
		timezone: "Europe/Berlin",
		latitude: 52.52437,
		longitude: 13.41053,
	});
});

test("mapOpenMeteoCity falls back to country when admin1 is missing", () => {
	const mapped = mapOpenMeteoCity({
		name: "Auckland",
		latitude: -36.84846,
		longitude: 174.76333,
		country_code: "nz",
		country: "New Zealand",
		timezone: "Pacific/Auckland",
	});

	assert.equal(mapped.region, "New Zealand");
	assert.equal(mapped.countryCode, "NZ");
	assert.equal(mapped.code, "AUC");
});

test("mapOpenMeteoCity provides safe defaults when fields are missing", () => {
	const mapped = mapOpenMeteoCity({
		name: "X",
		latitude: 0,
		longitude: 0,
	});

	// `code` pads short names so it always has 3 characters.
	assert.equal(mapped.code, "XXX");
	// Missing country code is normalized to "XX" (ISO unassigned).
	assert.equal(mapped.countryCode, "XX");
	// Missing timezone falls back to UTC.
	assert.equal(mapped.timezone, "UTC");
	// Region is empty string when neither admin1 nor country is present.
	assert.equal(mapped.region, "");
	// Id is built from country code, slug, and rounded coordinates.
	assert.equal(mapped.id, "om-xx-x-0.00-0.00");
});

test("mapOpenMeteoCity slugifies non-ASCII names for stable ids", () => {
	const mapped = mapOpenMeteoCity({
		name: "São Paulo",
		latitude: -23.5505,
		longitude: -46.6333,
		country_code: "br",
		country: "Brazil",
		admin1: "São Paulo",
		timezone: "America/Sao_Paulo",
	});

	assert.equal(mapped.id, "om-br-sao-paulo--23.55--46.63");
	assert.equal(mapped.name, "São Paulo");
	// Code is derived from ASCII letters only.
	assert.equal(mapped.code, "SAO");
});
