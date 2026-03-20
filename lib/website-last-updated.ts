import "server-only";

import { execSync } from "node:child_process";
import { cache } from "react";

export const getWebsiteLastUpdatedAt = cache(() => {
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
});
