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
		<div className="space-y-4 border-t border-border pt-4">
			<div className="flex items-center justify-between gap-2">
				<div className="text-sm font-medium text-text">Unprocessed sources</div>
				<div className="rounded-full bg-bg-neutral px-2 py-0.5 text-xs font-medium text-text-subtle">{paths.length}</div>
			</div>
			{paths.length > 0 ? (
				<div className="space-y-2">
					{paths.slice(0, 4).map((sourcePath) => (
						<div
							className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-bg-neutral-subtle px-3 py-2 text-xs text-text-subtle"
							key={sourcePath}
						>
							<span className="min-w-0 truncate">{sourcePath}</span>
							<span aria-hidden="true" className="text-text-subtlest">x</span>
						</div>
					))}
				</div>
			) : null}
			<Button
				className="h-11 w-full rounded-full bg-bg-neutral-bold text-sm font-medium text-text-inverse shadow-none hover:bg-bg-neutral-bold-hovered disabled:bg-bg-disabled disabled:text-text-disabled"
				disabled={paths.length === 0 || librarian.status === "running"}
				onClick={() => paths[0] ? void librarian.start(paths[0]) : undefined}
				size="sm"
			>
				Ingest
			</Button>
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
