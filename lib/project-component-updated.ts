import "server-only";

import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { PROJECT_COMPONENTS, type ComponentManifestEntry } from "@/app/data/component-manifest";

const PROJECT_COMPONENTS_UPDATED_TTL_MS = 60_000;

let cachedProjectComponentsWithUpdatedAt:
	| {
		expiresAt: number;
		value: ProjectComponentEntry[];
	}
	| null = null;

export interface ProjectComponentEntry extends ComponentManifestEntry {
	updatedAt: string | null;
}

function getCandidatePaths(slug: string): string[] {
	const candidatePaths = [`components/projects/${slug}`];
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

function loadProjectComponentsWithUpdatedAt(): ProjectComponentEntry[] {
	return PROJECT_COMPONENTS.map((component) => ({
		...component,
		updatedAt: getLatestCommittedAt(getCandidatePaths(component.slug)),
	}));
}

export function getProjectComponentsWithUpdatedAt(): ProjectComponentEntry[] {
	const now = Date.now();
	if (
		cachedProjectComponentsWithUpdatedAt &&
		cachedProjectComponentsWithUpdatedAt.expiresAt > now
	) {
		return cachedProjectComponentsWithUpdatedAt.value;
	}

	const value = loadProjectComponentsWithUpdatedAt();
	cachedProjectComponentsWithUpdatedAt = {
		value,
		expiresAt: now + PROJECT_COMPONENTS_UPDATED_TTL_MS,
	};

	return value;
}
