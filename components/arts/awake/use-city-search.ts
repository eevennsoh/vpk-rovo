"use client";

import { useEffect, useRef, useState } from "react";

import type { LockscreenLocation } from "./locations";

/**
 * Live city search backed by the Open-Meteo Geocoding API.
 *
 * Open-Meteo provides a free, no-key geocoding endpoint that returns up
 * to 100 results per query with name, country, admin region, timezone,
 * and lat/lng — a near-perfect match for our LockscreenLocation shape.
 *
 *   https://open-meteo.com/en/docs/geocoding-api
 *
 * The hook is intentionally minimal:
 *   - debounces input by `DEBOUNCE_MS` to avoid hammering the API on
 *     every keystroke
 *   - aborts in-flight requests when a new query supersedes them
 *   - short-circuits when the trimmed query is shorter than
 *     `MIN_QUERY_LENGTH` (returns an empty list, no network call)
 *   - caches successful responses in-memory so repeat searches within
 *     the same session are instant
 *
 * Results are returned as `LockscreenLocation[]` so callers can mix
 * them with the bundled PRESET_CITIES list without any further
 * adaptation.
 */

const ENDPOINT = "https://geocoding-api.open-meteo.com/v1/search";
const DEBOUNCE_MS = 250;
const MIN_QUERY_LENGTH = 2;
const RESULT_COUNT = 20;

interface OpenMeteoCity {
	id?: number;
	name: string;
	latitude: number;
	longitude: number;
	country_code?: string;
	country?: string;
	admin1?: string;
	admin2?: string;
	timezone?: string;
}

interface OpenMeteoResponse {
	results?: OpenMeteoCity[];
}

export interface UseCitySearchResult {
	results: LockscreenLocation[];
	isLoading: boolean;
	error: Error | null;
}

const responseCache = new Map<string, LockscreenLocation[]>();

function slugify(value: string): string {
	return value
		.toLowerCase()
		.normalize("NFKD")
		.replace(/[\u0300-\u036f]/g, "")
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
}

function deriveCode(name: string): string {
	// Strip diacritics first so non-ASCII names ("São Paulo") still
	// produce a sensible 3-letter code ("SAO") instead of leaking the
	// next character past the missing diacritic ("SOP").
	const ascii = name
		.normalize("NFKD")
		.replace(/[\u0300-\u036f]/g, "");
	const letters = ascii.replace(/[^A-Za-z]/g, "");
	if (letters.length >= 3) return letters.slice(0, 3).toUpperCase();
	if (letters.length > 0) return letters.toUpperCase().padEnd(3, "X");
	return "CTY";
}

export function mapOpenMeteoCity(city: OpenMeteoCity): LockscreenLocation {
	const countryCode = (city.country_code ?? "").toUpperCase() || "XX";
	const region = city.admin1 ?? city.country ?? "";
	const slug = slugify(city.name) || "city";
	const lat = Number.isFinite(city.latitude) ? city.latitude : 0;
	const lng = Number.isFinite(city.longitude) ? city.longitude : 0;
	// Stable id that survives across sessions: country + name + coarse
	// coordinates. Open-Meteo's numeric `id` is also stable but using a
	// human-readable slug keeps storage debuggable and avoids collisions
	// between cities of the same name in different regions.
	const id = `om-${countryCode.toLowerCase()}-${slug}-${lat.toFixed(2)}-${lng.toFixed(2)}`;

	return {
		id,
		name: city.name,
		code: deriveCode(city.name),
		countryCode,
		region,
		timezone: city.timezone ?? "UTC",
		latitude: lat,
		longitude: lng,
	};
}

/**
 * Live-search hook for cities. Pass the raw input value; receive a
 * debounced, deduplicated list of LockscreenLocations.
 */
export function useCitySearch(query: string): UseCitySearchResult {
	const [results, setResults] = useState<LockscreenLocation[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<Error | null>(null);

	// Track the latest in-flight request so a stale response cannot
	// overwrite results from a newer query.
	const requestIdRef = useRef(0);

	useEffect(() => {
		const trimmed = query.trim();
		if (trimmed.length < MIN_QUERY_LENGTH) {
			setResults([]);
			setIsLoading(false);
			setError(null);
			return;
		}

		const cached = responseCache.get(trimmed.toLowerCase());
		if (cached) {
			setResults(cached);
			setIsLoading(false);
			setError(null);
			return;
		}

		const requestId = ++requestIdRef.current;
		const controller = new AbortController();
		setIsLoading(true);
		setError(null);

		const debounceHandle = setTimeout(() => {
			const url = new URL(ENDPOINT);
			url.searchParams.set("name", trimmed);
			url.searchParams.set("count", String(RESULT_COUNT));
			url.searchParams.set("language", "en");
			url.searchParams.set("format", "json");

			fetch(url.toString(), { signal: controller.signal })
				.then(async (response) => {
					if (!response.ok) {
						throw new Error(`Geocoding request failed: ${response.status}`);
					}
					const json = (await response.json()) as OpenMeteoResponse;
					const list = (json.results ?? []).map(mapOpenMeteoCity);

					// Deduplicate by id (Open-Meteo occasionally returns near-
					// duplicate entries for the same place across sources).
					const seen = new Set<string>();
					const deduped: LockscreenLocation[] = [];
					for (const city of list) {
						if (seen.has(city.id)) continue;
						seen.add(city.id);
						deduped.push(city);
					}

					responseCache.set(trimmed.toLowerCase(), deduped);
					if (requestId === requestIdRef.current) {
						setResults(deduped);
						setIsLoading(false);
					}
				})
				.catch((err: unknown) => {
					if (controller.signal.aborted) return;
					if (requestId !== requestIdRef.current) return;
					setError(err instanceof Error ? err : new Error(String(err)));
					setResults([]);
					setIsLoading(false);
				});
		}, DEBOUNCE_MS);

		return () => {
			clearTimeout(debounceHandle);
			controller.abort();
		};
	}, [query]);

	return { results, isLoading, error };
}
