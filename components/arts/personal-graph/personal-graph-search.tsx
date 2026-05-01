"use client";

import { useState } from "react";
import ArrowUpRightIcon from "@atlaskit/icon/core/arrow-up-right";
import SearchIcon from "@atlaskit/icon/core/search";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useVaultSearch } from "./hooks/use-vault-search";
import { PersonalGraphGlassPanel } from "./personal-graph-glass-panel";

interface PersonalGraphSearchProps {
	className?: string;
	onSelectSlug: (slug: string) => void;
}

export function PersonalGraphSearch({ className, onSelectSlug }: Readonly<PersonalGraphSearchProps>) {
	const [query, setQuery] = useState("");
	const { results, status } = useVaultSearch(query);
	const firstResult = results[0];

	return (
		<form
			className={cn("relative w-full", className)}
			onSubmit={(event) => {
				event.preventDefault();
				if (!firstResult) return;
				onSelectSlug(firstResult.slug);
				setQuery("");
			}}
		>
			<PersonalGraphGlassPanel contentClassName="flex min-h-14 items-center gap-3 px-3 py-2 sm:min-h-16 sm:gap-4 sm:px-4" radius={30}>
				<div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white/5 text-neutral-950 sm:size-10">
					<SearchIcon label="" />
				</div>
				<input
					aria-label="Ask or search Personal Graph"
					className="min-w-0 flex-1 bg-transparent text-base text-neutral-950 outline-none placeholder:text-neutral-500 sm:text-lg"
					onChange={(event) => setQuery(event.target.value)}
					placeholder="Ask or search your graph..."
					value={query}
				/>
				<Button
					aria-label="Open top search result"
					className="size-10 rounded-full border-neutral-950 bg-neutral-950 text-white shadow-none hover:bg-neutral-800 disabled:border-neutral-950/5 disabled:bg-white/10 disabled:text-neutral-400 sm:size-11"
					disabled={!firstResult}
					size="icon-lg"
					type="submit"
					variant="outline"
				>
					<ArrowUpRightIcon label="" />
				</Button>
			</PersonalGraphGlassPanel>
			{query ? (
				<div className="absolute bottom-[calc(100%+0.75rem)] left-0 right-0 z-40 text-neutral-950">
					<PersonalGraphGlassPanel contentClassName="max-h-[min(42svh,320px)] overflow-auto p-1" radius={22}>
						{status === "loading" ? <div className="px-3 py-2 text-xs text-neutral-500">Searching...</div> : null}
						{status === "error" ? <div className="px-3 py-2 text-xs text-red-700">Search failed.</div> : null}
						{results.map((result) => (
							<button
								className="block w-full rounded-2xl px-3 py-2 text-left transition-colors duration-normal hover:bg-white/20"
								key={`${result.path}-${result.title}`}
								onClick={() => {
									onSelectSlug(result.slug);
									setQuery("");
								}}
								type="button"
							>
								<div className="truncate text-xs font-medium text-neutral-950">{result.title}</div>
								<div className="mt-1 line-clamp-2 text-xs text-neutral-600">{result.excerpt}</div>
							</button>
						))}
						{status === "ready" && results.length === 0 ? (
							<div className="px-3 py-2 text-xs text-neutral-500">No results.</div>
						) : null}
					</PersonalGraphGlassPanel>
				</div>
			) : null}
		</form>
	);
}
