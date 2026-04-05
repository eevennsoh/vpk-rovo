import "server-only";

import { execSync } from "node:child_process";
const WEBSITE_LAST_UPDATED_TTL_MS = 60_000;

let cachedWebsiteLastUpdatedAt:
	| {
		expiresAt: number;
		value: string | null;
	}
	| null = null;

function loadWebsiteLastUpdatedAt(): string | null {
	try {
		const committedAt = execSync("git log -1 --format=%cI", {
			cwd: process.cwd(),
			encoding: "utf8",
		}).trim();
		const date = new Date(committedAt);
		return Number.isNaN(date.getTime()) ? null : committedAt;
	} catch {
		return null;
	}
}

export function getWebsiteLastUpdatedAt(): string | null {
	const now = Date.now();
	if (cachedWebsiteLastUpdatedAt && cachedWebsiteLastUpdatedAt.expiresAt > now) {
		return cachedWebsiteLastUpdatedAt.value;
	}

	const value = loadWebsiteLastUpdatedAt();
	cachedWebsiteLastUpdatedAt = {
		value,
		expiresAt: now + WEBSITE_LAST_UPDATED_TTL_MS,
	};

	return value;
}
