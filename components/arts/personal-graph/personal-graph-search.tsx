"use client";

import { useState } from "react";
import { useVaultSearch } from "./hooks/use-vault-search";

interface PersonalGraphSearchProps {
	onSelectSlug: (slug: string) => void;
}

export function PersonalGraphSearch({ onSelectSlug }: Readonly<PersonalGraphSearchProps>) {
	const [query, setQuery] = useState("");
	const { results, status } = useVaultSearch(query);

	return (
		<div className="relative w-[min(420px,40vw)]">
			<input
				aria-label="Search Personal Graph"
				className="h-8 w-full rounded-md border border-border bg-bg-neutral px-3 text-sm text-text outline-none focus:border-border-selected focus:ring-2 focus:ring-ring/30"
				onChange={(event) => setQuery(event.target.value)}
				placeholder="Search vault"
				value={query}
			/>
			{query ? (
				<div className="absolute right-0 top-10 z-40 max-h-[320px] w-full overflow-auto rounded-md border border-border bg-surface-raised p-1 shadow-lg">
					{status === "loading" ? <div className="px-3 py-2 text-xs text-text-subtle">Searching...</div> : null}
					{status === "error" ? <div className="px-3 py-2 text-xs text-text-danger">Search failed.</div> : null}
					{results.map((result) => (
						<button
							className="block w-full rounded-sm px-3 py-2 text-left hover:bg-bg-neutral-subtle-hovered"
							key={`${result.path}-${result.title}`}
							onClick={() => {
								onSelectSlug(result.slug);
								setQuery("");
							}}
							type="button"
						>
							<div className="truncate text-xs font-medium text-text">{result.title}</div>
							<div className="mt-1 line-clamp-2 text-xs text-text-subtle">{result.excerpt}</div>
						</button>
					))}
					{status === "ready" && results.length === 0 ? (
						<div className="px-3 py-2 text-xs text-text-subtle">No results.</div>
					) : null}
				</div>
			) : null}
		</div>
	);
}
