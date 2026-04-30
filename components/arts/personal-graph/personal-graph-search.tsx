"use client";

import { useState } from "react";
import ArrowUpRightIcon from "@atlaskit/icon/core/arrow-up-right";
import SearchIcon from "@atlaskit/icon/core/search";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useVaultSearch } from "./hooks/use-vault-search";

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
			<div className="flex min-h-16 items-center gap-3 rounded-[2px] border border-neutral-950/80 bg-white/95 px-4 py-2 text-neutral-950 shadow-lg backdrop-blur-xl sm:min-h-[72px] sm:gap-4 sm:px-5">
				<SearchIcon label="" />
				<input
					aria-label="Ask or search Personal Graph"
					className="min-w-0 flex-1 bg-transparent text-base text-neutral-950 outline-none placeholder:text-neutral-500 sm:text-lg"
					onChange={(event) => setQuery(event.target.value)}
					placeholder="Ask or search your graph..."
					value={query}
				/>
				<Button
					aria-label="Open top search result"
					className="size-11 rounded-[2px] border-neutral-950/20 bg-neutral-950 text-white shadow-none hover:bg-neutral-800 disabled:bg-neutral-100 disabled:text-neutral-400 sm:size-12"
					disabled={!firstResult}
					size="icon-lg"
					type="submit"
					variant="outline"
				>
					<ArrowUpRightIcon label="" />
				</Button>
			</div>
			{query ? (
				<div className="absolute bottom-[calc(100%+0.75rem)] left-0 right-0 z-40 max-h-[min(42svh,320px)] overflow-auto rounded-[2px] border border-neutral-950/70 bg-white/95 p-1 text-neutral-950 shadow-xl backdrop-blur">
					{status === "loading" ? <div className="px-3 py-2 text-xs text-neutral-500">Searching...</div> : null}
					{status === "error" ? <div className="px-3 py-2 text-xs text-red-700">Search failed.</div> : null}
					{results.map((result) => (
						<button
							className="block w-full rounded-[2px] px-3 py-2 text-left hover:bg-neutral-100"
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
				</div>
			) : null}
		</form>
	);
}
