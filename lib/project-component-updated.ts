import "server-only";

import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { cache } from "react";
import { PROJECT_COMPONENTS, type ComponentEntry } from "@/app/data/components";

export interface ProjectComponentEntry extends ComponentEntry {
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

export const getProjectComponentsWithUpdatedAt = cache((): ProjectComponentEntry[] => {
	return PROJECT_COMPONENTS.map((component) => ({
		...component,
		updatedAt: getLatestCommittedAt(getCandidatePaths(component.slug)),
	}));
});
