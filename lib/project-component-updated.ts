import "server-only";

import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import {
	ART_COMPONENTS,
	PROJECT_COMPONENTS,
	type ComponentManifestEntry,
} from "@/app/data/component-manifest";

const COMPONENTS_UPDATED_TTL_MS = 60_000;

export interface ProjectComponentEntry extends ComponentManifestEntry {
	updatedAt: string | null;
}

export type ArtComponentEntry = ProjectComponentEntry;

interface ComponentsCache {
	expiresAt: number;
	value: ProjectComponentEntry[];
}

const cacheByPrefix = new Map<string, ComponentsCache>();

function getCandidatePaths(prefix: string, slug: string): string[] {
	const candidatePaths = [`components/${prefix}/${slug}`];
	const appPath = `app/${slug}`;

	if (existsSync(appPath)) {
		candidatePaths.push(appPath);
	}

	return candidatePaths;
}

function getLatestCommittedAt(paths: ReadonlyArray<string>): string | null {
	let latestTimestamp: string | null = null;
	let latestTime = Number.NEGATIVE_INFINITY;

	for (const path of paths) {
		try {
			const committedAt = execFileSync("git", ["log", "-1", "--format=%cI", "--", path], {
				cwd: process.cwd(),
				encoding: "utf8",
			}).trim();
			const committedTime = Date.parse(committedAt);

			if (!Number.isFinite(committedTime)) {
				continue;
			}

			if (committedTime > latestTime) {
				latestTime = committedTime;
				latestTimestamp = committedAt;
			}
		} catch {
			// Ignore git lookup failures and fall back to null.
		}
	}

	return latestTimestamp;
}

function loadComponentsWithUpdatedAt(
	components: ReadonlyArray<ComponentManifestEntry>,
	prefix: string,
): ProjectComponentEntry[] {
	return components.map((component) => ({
		...component,
		updatedAt: getLatestCommittedAt(getCandidatePaths(prefix, component.slug)),
	}));
}

function getComponentsWithUpdatedAt(
	components: ReadonlyArray<ComponentManifestEntry>,
	prefix: string,
): ProjectComponentEntry[] {
	const now = Date.now();
	const cached = cacheByPrefix.get(prefix);
	if (cached && cached.expiresAt > now) {
		return cached.value;
	}

	const value = loadComponentsWithUpdatedAt(components, prefix);
	cacheByPrefix.set(prefix, {
		value,
		expiresAt: now + COMPONENTS_UPDATED_TTL_MS,
	});

	return value;
}

export function getProjectComponentsWithUpdatedAt(): ProjectComponentEntry[] {
	return getComponentsWithUpdatedAt(PROJECT_COMPONENTS, "projects");
}

export function getArtComponentsWithUpdatedAt(): ArtComponentEntry[] {
	return getComponentsWithUpdatedAt(ART_COMPONENTS, "arts");
}
