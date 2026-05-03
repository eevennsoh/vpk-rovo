"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { token } from "@/lib/tokens";
import { cn } from "@/lib/utils";
import { useVaultSearch } from "./hooks/use-vault-search";
import {
	PersonalGraphControlFlyoutActions,
	PersonalGraphControlFlyoutTrigger,
	type PersonalGraphControlFlyoutAction,
} from "./personal-graph-control-flyout";
import { PersonalGraphGlassPanel } from "./personal-graph-glass-panel";
import { PixelArrowRightIcon } from "./personal-graph-pixel-icons";

interface PersonalGraphSearchProps {
	className?: string;
	flyoutActions: ReadonlyArray<PersonalGraphControlFlyoutAction>;
	onSelectSlug: (slug: string) => void;
}

export function PersonalGraphSearch({
	className,
	flyoutActions,
	onSelectSlug,
}: Readonly<PersonalGraphSearchProps>) {
	const [query, setQuery] = useState("");
	const [isFlyoutOpen, setIsFlyoutOpen] = useState(false);
	const { results, status } = useVaultSearch(query);
	const firstResult = results[0];

	useEffect(() => {
		if (!isFlyoutOpen) return;
		function handleKeyDown(event: KeyboardEvent) {
			if (event.key === "Escape") setIsFlyoutOpen(false);
		}
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [isFlyoutOpen]);

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
			<PersonalGraphControlFlyoutActions
				actions={flyoutActions}
				className="right-[72px] top-1/2"
				isOpen={isFlyoutOpen}
			/>
			<PersonalGraphGlassPanel contentClassName="flex h-16 items-center gap-2 p-4 pl-6" radius={30}>
				<input
					aria-label="Ask or search Personal Graph"
					className="min-w-0 flex-1 bg-transparent text-text outline-none placeholder:text-text-subtlest"
					onChange={(event) => setQuery(event.target.value)}
					placeholder="Ask or search your graph..."
					style={{ font: token("font.body") }}
					value={query}
				/>
				<PersonalGraphControlFlyoutTrigger
					isOpen={isFlyoutOpen}
					onToggle={() => setIsFlyoutOpen((current) => !current)}
				/>
				<Button
					aria-label="Open top search result"
					className="size-8 rounded-full border-0 text-text-subtle shadow-none hover:bg-bg-neutral-subtle-hovered [&_svg]:text-icon-subtle"
					disabled={!firstResult}
					size="icon"
					type="submit"
					variant="ghost"
				>
					<PixelArrowRightIcon />
				</Button>
			</PersonalGraphGlassPanel>
			{query ? (
				<div className="absolute bottom-[calc(100%+0.75rem)] left-0 right-0 z-40 text-text">
					<PersonalGraphGlassPanel contentClassName="max-h-[min(42svh,320px)] overflow-auto p-1" radius={22}>
						{status === "loading" ? <div className="px-3 py-2 text-xs text-text-subtlest">Searching...</div> : null}
						{status === "error" ? <div className="px-3 py-2 text-xs text-text-danger">Search failed.</div> : null}
						{results.map((result) => (
							<button
								className="block w-full rounded-2xl px-3 py-2 text-left transition-colors duration-normal hover:bg-bg-neutral-subtle-hovered"
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
							<div className="px-3 py-2 text-xs text-text-subtlest">No results.</div>
						) : null}
					</PersonalGraphGlassPanel>
				</div>
			) : null}
		</form>
	);
}
