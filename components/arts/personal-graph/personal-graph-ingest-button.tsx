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
		<div className="space-y-4 border-t border-neutral-950/10 pt-4">
			<div className="flex items-center justify-between gap-2">
				<div className="text-sm font-medium text-neutral-950">Unprocessed sources</div>
				<div className="rounded-full bg-white/10 px-2 py-0.5 text-xs font-medium text-neutral-700">{paths.length}</div>
			</div>
			{paths.length > 0 ? (
				<div className="space-y-2">
					{paths.slice(0, 4).map((sourcePath) => (
						<div
							className="flex items-center justify-between gap-3 rounded-2xl border border-neutral-950/8 bg-white/5 px-3 py-2 text-xs text-neutral-800"
							key={sourcePath}
						>
							<span className="min-w-0 truncate">{sourcePath}</span>
							<span aria-hidden="true" className="text-neutral-500">x</span>
						</div>
					))}
				</div>
			) : null}
			<Button
				className="h-11 w-full rounded-full bg-neutral-950 text-sm font-medium text-white shadow-none hover:bg-neutral-800 disabled:bg-white/10 disabled:text-neutral-400"
				disabled={paths.length === 0 || librarian.status === "running"}
				onClick={() => paths[0] ? void librarian.start(paths[0]) : undefined}
				size="sm"
			>
				Ingest
			</Button>
			{librarian.events.length > 0 ? (
				<div className="space-y-3 border-t border-neutral-950/10 pt-3">
					<div className="space-y-1">
						{librarian.events.map((event, index) => (
							<div className="text-xs text-neutral-600" key={`${event.type}-${event.stage}-${index}`}>
								{event.stage}
							</div>
						))}
					</div>
					{librarian.takeaways.length > 0 ? (
						<ul className="list-disc space-y-1 pl-4 text-xs text-neutral-950">
							{librarian.takeaways.map((takeaway) => <li key={takeaway}>{takeaway}</li>)}
						</ul>
					) : null}
					{librarian.related.length > 0 ? (
						<div className="space-y-1">
							<div className="text-xs font-medium text-neutral-950">Related pages found by qmd</div>
							{librarian.related.slice(0, 4).map((result) => (
								<div className="truncate text-xs text-neutral-600" key={result.path}>{result.title}</div>
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
