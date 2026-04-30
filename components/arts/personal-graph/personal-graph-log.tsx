"use client";

import { useEffect, useState } from "react";
import { fetchLog } from "./lib/personal-graph-api";
import type { LogEntry } from "./lib/personal-graph-types";

const formatter = new Intl.DateTimeFormat("en-US", { dateStyle: "medium" });

export function PersonalGraphLog({ refreshKey }: Readonly<{ refreshKey: number }>) {
	const [entries, setEntries] = useState<LogEntry[]>([]);

	useEffect(() => {
		const controller = new AbortController();
		void fetchLog({ signal: controller.signal })
			.then((nextEntries) => setEntries(nextEntries.slice(-5).reverse()))
			.catch(() => setEntries([]));
		return () => controller.abort();
	}, [refreshKey]);

	if (entries.length === 0) {
		return null;
	}

	return (
		<div className="border-t border-neutral-950/30 pt-4">
			<div className="text-sm font-medium text-neutral-950">Recent ingests</div>
			<div className="mt-2 space-y-2">
				{entries.map((entry, index) => (
					<div className="text-xs text-neutral-600" key={`${entry.source}-${entry.date}-${index}`}>
						<div className="truncate text-neutral-950">{entry.source ?? entry.raw ?? "Log entry"}</div>
						<div>{entry.date ? formatter.format(new Date(entry.date)) : "Undated"}</div>
					</div>
				))}
			</div>
		</div>
	);
}
