"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { fetchUnprocessedCount } from "./lib/personal-graph-api";
import { useLibrarianStream } from "./hooks/use-librarian-stream";

interface PersonalGraphIngestButtonProps {
	onDone: () => void;
	refreshKey: number;
}

export function PersonalGraphIngestButton({ onDone, refreshKey }: Readonly<PersonalGraphIngestButtonProps>) {
	const [paths, setPaths] = useState<string[]>([]);
	const librarian = useLibrarianStream(onDone);
	const refresh = useCallback(() => {
		void fetchUnprocessedCount().then((result) => setPaths(result.paths)).catch(() => setPaths([]));
	}, []);

	useEffect(() => refresh(), [refresh, refreshKey]);

	return (
		<div className="space-y-3 rounded-md border border-border bg-surface/80 p-3">
			<div className="flex items-center justify-between gap-2">
				<div>
					<div className="text-xs font-medium text-text">Unprocessed sources</div>
					<div className="text-xs text-text-subtle">{paths.length} waiting</div>
				</div>
				<Button
					disabled={paths.length === 0 || librarian.status === "running"}
					onClick={() => paths[0] ? void librarian.start(paths[0]) : undefined}
					size="sm"
				>
					Ingest
				</Button>
			</div>
			{paths.length > 0 ? (
				<div className="truncate text-xs text-text-subtle">{paths[0]}</div>
			) : null}
			{librarian.events.length > 0 ? (
				<div className="space-y-3 border-t border-border pt-3">
					<div className="space-y-1">
						{librarian.events.map((event, index) => (
							<div className="text-xs text-text-subtle" key={`${event.type}-${event.stage}-${index}`}>
								{event.stage}
							</div>
						))}
					</div>
					{librarian.takeaways.length > 0 ? (
						<ul className="list-disc space-y-1 pl-4 text-xs text-text">
							{librarian.takeaways.map((takeaway) => <li key={takeaway}>{takeaway}</li>)}
						</ul>
					) : null}
					{librarian.related.length > 0 ? (
						<div className="space-y-1">
							<div className="text-xs font-medium text-text">Related pages found by qmd</div>
							{librarian.related.slice(0, 4).map((result) => (
								<div className="truncate text-xs text-text-subtle" key={result.path}>{result.title}</div>
							))}
						</div>
					) : null}
					{librarian.status === "awaiting-confirmation" ? (
						<div className="flex gap-2">
							<Button onClick={() => void librarian.confirm()} size="sm">Confirm</Button>
							<Button onClick={librarian.discard} size="sm" variant="outline">Discard</Button>
						</div>
					) : null}
				</div>
			) : null}
		</div>
	);
}
